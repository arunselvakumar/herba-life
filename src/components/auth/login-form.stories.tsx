import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginForm } from "@/components/auth/login-form";

const meta = {
  title: "Auth/LoginForm",
  component: LoginForm,
  parameters: {
    layout: "centered",
    nextjs: { appDirectory: true },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
