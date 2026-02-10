"use client";

import { springPresets } from "@/utils/spring-animations";
import { AnimatePresence, motion } from "framer-motion";
import { getProviders, signIn } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type ProvidersResponse = Awaited<ReturnType<typeof getProviders>>;

interface AuthModalProps {
  isOpen: boolean;
  callbackUrl: string;
  title?: string;
  message?: string;
  onClose: () => void;
}

const providerButtonStyles: Record<string, string> = {
  discord:
    "bg-[#5865F2] text-white hover:brightness-110 active:brightness-95",
  spotify:
    "bg-[#1DB954] text-white hover:brightness-110 active:brightness-95",
};

export function AuthModal({
  isOpen,
  callbackUrl,
  title = "Sign in to continue",
  message = "Choose an OAuth provider to continue.",
  onClose,
}: AuthModalProps) {
  const [providers, setProviders] = useState<ProvidersResponse>(null);
  const [submittingProviderId, setSubmittingProviderId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    void getProviders()
      .then((result) => {
        if (cancelled) return;
        setProviders(result);
      })
      .catch(() => {
        if (cancelled) return;
        setProviders({});
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const oauthProviders = useMemo(() => {
    if (!providers) return [];

    return Object.values(providers).filter(
      (provider) => provider.type === "oauth",
    );
  }, [providers]);

  const handleProviderSignIn = async (providerId: string) => {
    setSubmittingProviderId(providerId);
    await signIn(providerId, { callbackUrl });
    setSubmittingProviderId(null);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={springPresets.gentle}
            className="theme-chrome-backdrop fixed inset-0 z-[220] backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={springPresets.gentle}
            className="fixed inset-x-4 top-1/2 z-[221] -translate-y-1/2 md:right-auto md:left-1/2 md:w-full md:max-w-sm md:-translate-x-1/2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="surface-panel p-6">
              <h2 className="text-center text-xl font-bold text-[var(--color-text)]">
                {title}
              </h2>
              <p className="mt-2 text-center text-sm text-[var(--color-subtext)]">
                {message}
              </p>

              <div className="mt-6 space-y-3">
                {providers === null ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                  </div>
                ) : oauthProviders.length > 0 ? (
                  oauthProviders.map((provider) => {
                    const providerClasses =
                      providerButtonStyles[provider.id] ??
                      "border border-[var(--color-border)] bg-[var(--color-surface-hover)] text-[var(--color-text)] hover:border-[var(--color-accent)]";
                    const isSubmitting = submittingProviderId === provider.id;

                    return (
                      <button
                        key={provider.id}
                        type="button"
                        onClick={() => void handleProviderSignIn(provider.id)}
                        disabled={submittingProviderId !== null}
                        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${providerClasses}`}
                      >
                        {isSubmitting
                          ? `Connecting ${provider.name}...`
                          : `Continue with ${provider.name}`}
                      </button>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm text-[var(--color-subtext)]">
                    No OAuth providers are currently available.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-4 py-2.5 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-accent)]"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
