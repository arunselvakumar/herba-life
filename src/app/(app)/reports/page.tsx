import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata: Metadata = {
  title: "Reports",
};

export default function Page() {
  return <PlaceholderPage title="Reports" description="Sales, compensation, and compliance reporting." />;
}
