import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/brand/logo";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

const HIGHLIGHTS = [
  "Distributor and member management",
  "Order, inventory, and fulfilment tracking",
  "Volume points and compensation insights",
] as const;

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-brand-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_20%_10%,rgba(66,160,70,0.45),transparent_70%),radial-gradient(50%_40%_at_90%_90%,rgba(229,255,197,0.18),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-32 size-[32rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -bottom-16 size-[20rem] rounded-full border border-white/10"
        />

        <Logo
          className="relative text-white"
          markClassName="size-10 text-brand-200"
          wordmarkClassName="text-xl"
          subtitle="Internal"
        />

        <div className="relative max-w-md space-y-8">
          <p className="text-eyebrow text-brand-200">Management console</p>
          <h1 className="font-heading text-4xl leading-[1.1] font-extrabold tracking-tight text-balance xl:text-5xl">
            Nutrition for a better life, run from one place.
          </h1>
          <ul className="space-y-3 text-sm text-white/80">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="inline-block size-1.5 rounded-full bg-brand-500"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/50">
          © Herbalife. For authorised personnel
          only.
        </p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm space-y-8">
          <Logo
            className="text-brand-600 lg:hidden"
            markClassName="size-9"
            subtitle="Internal"
          />
          <div className="space-y-2">
            <p className="text-eyebrow text-brand-600">Welcome back</p>
            <h2 className="font-heading text-3xl font-extrabold tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Use the credentials issued by your administrator. Accounts are
              not self-service.
            </p>
          </div>

          <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
            <LoginForm />
          </Suspense>

          <p className="text-center text-xs text-muted-foreground">
            Trouble signing in? Contact the IT service desk.
          </p>
        </div>
      </section>
    </main>
  );
}
