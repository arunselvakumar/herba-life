import { redirect } from "next/navigation";
import { homeFor } from "@/components/app/nav-config";
import { getCurrentUser } from "@/lib/session";

// The route is nothing but a redirect, so there is no shell worth prerendering.
export const instant = false;

/** Land on the first module the signed-in user's role can see. */
export default async function Home() {
  const user = await getCurrentUser();
  redirect(homeFor(user));
}
