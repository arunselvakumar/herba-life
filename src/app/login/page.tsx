import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Reveal } from "@/components/motion/reveal";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
};

// Matches the notice on herbalife.com; the page is statically prerendered,
// so the year is a constant rather than read from the clock at render time.
const COPYRIGHT_YEAR = 2026;

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
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_15%_10%,rgba(233,201,164,0.22),transparent_70%),radial-gradient(45%_40%_at_90%_95%,rgba(255,255,255,0.08),transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 size-[32rem] rounded-full border border-white/10" />
        <div aria-hidden className="pointer-events-none absolute -right-8 -bottom-16 size-[20rem] rounded-full border border-white/10" />

        <Reveal className="relative">
          <Logo tone="white" imageClassName="h-9" subtitle="Live your best life" />
        </Reveal>

        <Reveal className="relative max-w-md space-y-8" delay={0.1}>
          <p data-reveal className="text-xs font-medium text-white/60">
            Management console
          </p>
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

        <p className="relative max-w-md text-xs leading-relaxed text-white/40">
          Copyright &copy; {COPYRIGHT_YEAR} Herbalife International of America, Inc. All Rights Reserved. For authorised personnel only.
        </p>
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
