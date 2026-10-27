import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata: Metadata = {
  title: "Orders",
};

export default function Page() {
  return <PlaceholderPage title="Orders" description="Order intake, fulfilment, and returns." />;
}
