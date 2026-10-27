import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata: Metadata = {
  title: "Distributors",
};

export default function Page() {
  return <PlaceholderPage title="Distributors" description="Members, sponsors, and qualification levels." />;
}
