// File: apps/web/src/components/AuthModal.tsx

"use client";

import {
  getOAuthProviderButtonStyle,
  isEnabledOAuthProvider,
} from "@/config/oauthProviders";
import { logAuthClientDebug } from "@/utils/authDebugClient";
import { springPresets } from "@/utils/spring-animations";
import { OAUTH_PROVIDERS_FALLBACK } from "@/utils/authProvidersFallback";
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
    let resolved = false;
    logAuthClientDebug("AuthModal opened; fetching OAuth providers", {
      callbackUrl,
    });

    const timeoutId = setTimeout(() => {
      if (cancelled || resolved) return;
      console.warn(
        "[AuthModal] getProviders timed out; using fallback OAuth providers.",
      );
      logAuthClientDebug(
        "AuthModal getProviders timed out; using fallback list",
        {
          fallbackProviders: Object.keys(OAUTH_PROVIDERS_FALLBACK),
        },
      );
      setProviders(OAUTH_PROVIDERS_FALLBACK);
    }, 3000);

    void getProviders()
      .then((result) => {
        if (cancelled) return;
        resolved = true;
        clearTimeout(timeoutId);
        const resolvedProviders = result ?? OAUTH_PROVIDERS_FALLBACK;
        logAuthClientDebug("AuthModal providers fetched", {
          providerIds: Object.keys(resolvedProviders),
          usedFallback: !result,
        });
        setProviders(resolvedProviders);
      })
      .catch((providerError: unknown) => {
        if (cancelled) return;
        resolved = true;
        clearTimeout(timeoutId);
        logAuthClientDebug("AuthModal getProviders failed; using fallback", {
          fallbackProviders: Object.keys(OAUTH_PROVIDERS_FALLBACK),
          error: providerError,
        });
        setProviders(OAUTH_PROVIDERS_FALLBACK);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [callbackUrl, isOpen]);

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
    return Object.values(providers).filter(isEnabledOAuthProvider);
  }, [providers]);

  useEffect(() => {
    if (!isOpen || !providers) return;
    logAuthClientDebug("AuthModal providers available", {
      providerIds: oauthProviders.map((provider) => provider.id),
      callbackUrl,
    });
  }, [callbackUrl, isOpen, oauthProviders, providers]);

  const handleProviderSignIn = async (providerId: string) => {
    setSubmittingProviderId(providerId);

    logAuthClientDebug("AuthModal starting OAuth sign-in", {
      providerId,
      callbackUrl,
    });

    try {
      await signIn(providerId, { callbackUrl });
      logAuthClientDebug("AuthModal signIn call resolved", { providerId });
    } catch (error: unknown) {
      logAuthClientDebug("AuthModal signIn call failed", { providerId, error });
      throw error;
    } finally {
      setSubmittingProviderId(null);
    }
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
                    const providerClasses = getOAuthProviderButtonStyle(
                      provider.id,
                    );
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
