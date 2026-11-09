// Storybook mock for `auth-client.ts`, registered with sb.mock() in .storybook/preview.tsx.
// Sign-in succeeds by default. A story shows a rejected login with
//   mocked(authClient.signIn.email).mockResolvedValue({ data: null, error: { status: 401, message: "Invalid" } })
import { fn } from "storybook/test";
import type { authClient as ActualClient } from "../auth-client";

type Client = typeof ActualClient;

const signIn = {
  email: fn(async () => ({ data: { redirect: false, token: "story", user: {} }, error: null })).mockName("signIn.email"),
};
const signOut = fn(async () => ({ data: { success: true }, error: null })).mockName("signOut");
const useSession = fn(() => ({ data: null, isPending: false, error: null, refetch: async () => {} })).mockName("useSession");

export const authClient = { signIn, signOut, useSession } as unknown as Client;
export { signIn, signOut, useSession };
