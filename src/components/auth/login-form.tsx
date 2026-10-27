"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircleIcon, EyeIcon, EyeOffIcon, LoaderCircleIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

function safeNextPath(value: string | null): string {
  // Only allow same-origin, absolute paths to avoid open redirects.
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
        rememberMe: true,
      });

      if (result.error) {
        setError(
          result.error.status === 401 || result.error.status === 403
            ? "That email and password combination is not valid."
            : (result.error.message ?? "Unable to sign in right now."),
        );
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error ? (
        <Alert variant="destructive" data-testid="login-error">
          <AlertCircleIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          placeholder="you@herbalife.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 bg-card"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:underline"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
          >
            <span className="inline-flex items-center gap-1">
              {showPassword ? (
                <EyeOffIcon className="size-3.5" />
              ) : (
                <EyeIcon className="size-3.5" />
              )}
              {showPassword ? "Hide" : "Show"}
            </span>
          </button>
        </div>
        <Input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11 bg-card"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full text-base font-semibold"
        disabled={isPending || !email || !password}
      >
        {isPending ? (
          <>
            <LoaderCircleIcon className="animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
