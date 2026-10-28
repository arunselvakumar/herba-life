import type { Metadata } from "next";
import { Urbanist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Urbanist: a geometric sans with round, even letterforms, close to the
// reference console's type. It ships as a single variable font, so every
// weight costs one request.
const sans = Urbanist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Herbalife Internal",
    template: "%s · Herbalife Internal",
  },
  description: "Herbalife internal management tool",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Marks the document before first paint so entrance animations can
            hide their targets without a flash. Skipped for reduced motion. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('js-motion')",
          }}
        />
      </head>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
