import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

const HIGHLIGHTS = [
  "Member wellness records and follow-ups",
  "Package enrolment and renewal tracking",
  "Progress at a glance for every member",
] as const;

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-foreground text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <BackgroundBeams />
        {/* Scrim: darkest behind the copy on the left, so the beams show at full strength only where there is no text. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(17,17,17,0.72)_0%,rgba(17,17,17,0.5)_55%,rgba(17,17,17,0.1)_100%)]"
        />

        <Reveal className="relative">
          <Logo tone="white" imageClassName="h-9" subtitle="Live your best life" />
        </Reveal>

        <Reveal className="relative my-auto max-w-md space-y-8" delay={0.1}>
          <h1 data-reveal className="font-heading text-4xl leading-[1.05] font-semibold tracking-[-0.03em] text-balance xl:text-[3.5rem]">
            Make wellness a movement.
          </h1>
          <p data-reveal className="text-base leading-relaxed text-white/70">
            The world&rsquo;s premier health and wellness platform, on a mission of over 45 years to help people live their best lives through rigorous
            scientific research, high-quality ingredients and a strong sense of community spirit.
          </p>
          <ul data-reveal className="space-y-3 text-sm text-white/75">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span aria-hidden className="inline-block size-1.5 rounded-full bg-accent-soft" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center px-4 py-10 sm:px-10">
        <Reveal className="w-full max-w-md space-y-6" delay={0.15}>
          <div data-reveal className="flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-full bg-card shadow-card ring-1 ring-border">
              <LogoMark className="h-5" title="" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[1.05rem] font-bold tracking-[-0.02em]">Herbalife</span>
              <span className="mt-1 text-[0.7rem] font-medium text-muted-foreground">Internal</span>
            </span>
          </div>

          <div data-reveal className="surface space-y-8 p-6 sm:p-10">
            <div className="space-y-2">
              <p className="text-eyebrow">Welcome back</p>
              <h2 className="font-heading text-3xl font-semibold tracking-[-0.03em]">Sign in to your account</h2>
              <p className="text-sm text-muted-foreground">Use the credentials issued by your administrator. Accounts are not self-service.</p>
            </div>

            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <LoginForm />
            </Suspense>
          </div>

          <p data-reveal className="text-center text-xs text-muted-foreground">
            Trouble signing in? Contact the IT service desk.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
