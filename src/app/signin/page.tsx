// File: src/app/signin/page.tsx

"use client";

import { getProviders, signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const isBanned = error === "Banned";
  const [providers, setProviders] = useState<
    Awaited<ReturnType<typeof getProviders>>
  >(null);

  useEffect(() => {
    let isMounted = true;

    void getProviders()
      .then((nextProviders) => {
        if (!isMounted) return;
        setProviders(nextProviders);
      })
      .catch(() => {
        if (!isMounted) return;
        setProviders({});
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const oauthProviders = useMemo(() => {
    if (!providers) return [];
    return Object.values(providers).filter(
      (provider) => provider.id === "discord" || provider.id === "spotify",
    );
  }, [providers]);

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
          {providers === null ? (
            <div className="flex items-center justify-center py-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
            </div>
          ) : oauthProviders.length > 0 ? (
            <div className="space-y-3">
              {oauthProviders.map((provider) => {
                const isDiscord = provider.id === "discord";
                return (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => signIn(provider.id, { callbackUrl })}
                    className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 ${
                      isDiscord ? "bg-[#5865f2]" : "bg-[#1db954]"
                    }`}
                  >
                    Sign in with {isDiscord ? "Discord" : "Spotify"}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--color-subtext)]">
              No sign-in providers are currently configured.
            </p>
          )}
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
