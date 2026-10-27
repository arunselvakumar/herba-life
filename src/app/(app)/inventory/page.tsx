import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata: Metadata = {
  title: "Inventory",
};

export default function Page() {
  return <PlaceholderPage title="Inventory" description="Stock levels by distribution centre." />;
}
