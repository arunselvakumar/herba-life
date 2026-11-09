import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, waitFor } from "storybook/test";
import { LoginForm } from "@/components/auth/login-form";
import { authClient } from "@/lib/auth-client";
import { onSurface } from "@/stories/decorators";

type SignInResult = Awaited<ReturnType<typeof authClient.signIn.email>>;

/** What Better Auth resolves with when it rejects a sign-in. */
function rejected(status: number, message: string): SignInResult {
  return { data: null, error: { status, message, statusText: "" } } as unknown as SignInResult;
}

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: { layout: "centered" },
  decorators: [
    onSurface,
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Sign in stays disabled until both fields have something in them. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Sign in" })).toBeDisabled();
  },
};

/** Sent here by the session check after an administrator suspended the account. */
export const Suspended: Story = {
  parameters: { nextjs: { navigation: { pathname: "/login", query: { reason: "suspended" } } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("login-error")).toHaveTextContent("Your account has been suspended");
  },
};

/** "Show" reveals what was typed. */
export const ShowPassword: Story = {
  play: async ({ canvas, userEvent }) => {
    const password = canvas.getByLabelText("Password");
    await userEvent.type(password, "sunrise-2026");
    await expect(password).toHaveAttribute("type", "password");
    await userEvent.click(canvas.getByRole("button", { name: "Show" }));
    await expect(password).toHaveAttribute("type", "text");
    await expect(canvas.getByRole("button", { name: "Hide" })).toHaveAttribute("aria-pressed", "true");
  },
};

export const InvalidCredentials: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.email).mockResolvedValue(rejected(401, "Invalid email or password"));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "arun@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "wrong-password");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await expect(await canvas.findByTestId("login-error")).toHaveTextContent("That email and password combination is not valid.");
    await expect(getRouter().replace).not.toHaveBeenCalled();
  },
};

/** Better Auth refuses a suspended account with a 403. */
export const SuspendedOnSubmit: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.email).mockResolvedValue(rejected(403, "Account suspended"));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "anand@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await expect(await canvas.findByTestId("login-error")).toHaveTextContent("This account has been suspended.");
  },
};

/** Anything else: Better Auth's own message. */
export const ServerError: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.email).mockResolvedValue(rejected(429, "Too many attempts. Try again in a minute."));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "arun@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await expect(await canvas.findByTestId("login-error")).toHaveTextContent("Too many attempts. Try again in a minute.");
  },
};

/** While Better Auth answers, the button spins and can't be pressed again. */
export const Submitting: Story = {
  beforeEach: () => {
    mocked(authClient.signIn.email).mockImplementation(() => new Promise<never>(() => {}));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "arun@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await expect(await canvas.findByRole("button", { name: "Signing in…" })).toBeDisabled();
  },
};

/** Signs in with the trimmed email, then goes back to where the person was headed. */
export const SuccessRedirects: Story = {
  parameters: { nextjs: { navigation: { pathname: "/login", query: { next: "/members?filter=due" } } } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "  arun@herbalife.test ");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(getRouter().replace).toHaveBeenCalledWith("/members?filter=due"));
    await expect(authClient.signIn.email).toHaveBeenCalledWith({ email: "arun@herbalife.test", password: "sunrise-2026", rememberMe: true });
    await expect(getRouter().refresh).toHaveBeenCalled();
  },
};

/** A `next` that points off-site is ignored: the person lands on the overview. */
export const IgnoresOffsiteNext: Story = {
  parameters: { nextjs: { navigation: { pathname: "/login", query: { next: "//evil.example.com" } } } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Email"), "arun@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(getRouter().replace).toHaveBeenCalledWith("/"));
  },
};
