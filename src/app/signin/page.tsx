"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const isBanned = error === "Banned";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-4">
      <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-6 shadow-[var(--shadow-lg)]">
        <h1 className="text-center text-xl font-bold text-[var(--color-text)]">
          Sign in to Starchild Music
        </h1>

        {isBanned && (
          <div
            className="mt-4 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-3 text-center text-sm font-medium text-[var(--color-danger)]"
            role="alert"
          >
            Your account has been banned. If you believe this is an error, please
            contact support.
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className="w-full rounded-xl bg-[#5865f2] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Sign in with Discord
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
