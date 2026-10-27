import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/app/placeholder-page";

export const metadata: Metadata = {
  title: "Products",
};

export default function Page() {
  return <PlaceholderPage title="Products" description="Catalogue, pricing, and volume point values." />;
}
