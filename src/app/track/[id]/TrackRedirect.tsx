// File: src/app/track/[id]/TrackRedirect.tsx

 "use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type TrackRedirectProps = {
  id: string;
};

export function TrackRedirect({ id }: TrackRedirectProps) {
  const router = useRouter();
  const destination = `/?track=${id}`;

  useEffect(() => {
    router.replace(destination);
  }, [destination, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-white">Opening track…</h1>
      <p className="text-sm text-slate-300">
        If you are not redirected, open{" "}
        <Link className="text-orange-300 underline" href={destination}>
          the track player
        </Link>
        .
      </p>
    </main>
  );
}
