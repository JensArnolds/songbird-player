"use client";

import { startSpotifyLogin } from "@/services/spotifyAuthClient";
import { buildAuthCallbackUrl } from "@/utils/authRedirect";
import { Music2 } from "lucide-react";
import { signIn } from "next-auth/react";

interface GuestModalProps {
  onContinueAsGuest?: () => void;
  callbackUrl?: string;
}

export function GuestModal({
  onContinueAsGuest,
  callbackUrl = "/library",
}: GuestModalProps) {
  return (
    <section className="fixed inset-0 z-[230] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(43,48,160,0.22),_transparent_48%),linear-gradient(180deg,rgba(18,22,45,0.7)_0%,rgba(6,7,15,0.76)_65%,rgba(3,3,8,0.78)_100%)] backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#1DB954]/12 blur-3xl" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-[#0F1528]/88 p-8 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1DB954]/30 bg-[#1DB954]/12">
          <Music2 className="h-7 w-7 text-[#1DB954]" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-bold tracking-tight text-white">
          Tune the start page and optionally sign in
        </h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-white/72">
          Connect Spotify to unlock your library, playlists, and personalized playback.
        </p>

        <button
          type="button"
          onClick={() =>
            void signIn("discord", {
              callbackUrl: buildAuthCallbackUrl(callbackUrl, "discord"),
            })
          }
          className="mt-7 w-full rounded-2xl bg-[linear-gradient(135deg,#5865F2,#7480ff)] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:brightness-95"
        >
          Sign in with Discord
        </button>
        <button
          type="button"
          onClick={() => startSpotifyLogin(callbackUrl)}
          className="mt-3 w-full rounded-2xl bg-[#1DB954] px-5 py-3.5 text-sm font-semibold text-white transition hover:brightness-110 active:brightness-95"
        >
          Sign in with Spotify
        </button>
        <button
          type="button"
          onClick={() => onContinueAsGuest?.()}
          className="mt-3 w-full rounded-2xl border border-white/18 bg-white/6 px-5 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/30 hover:bg-white/10"
        >
          No Sign in, just tune
        </button>
      </div>
    </section>
  );
}
