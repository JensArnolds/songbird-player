// File: src/app/admin/page.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import { Shield, Users2, RefreshCcw, Crown, Lock, Loader2, Link2, Ban, CircleCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useMemo } from "react";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();

  const {
    data: users,
    isLoading,
    isFetching,
    refetch,
    error,
  } = api.admin.listUsers.useQuery(
    { limit: 200 },
    {
      enabled: !!session?.user?.admin,
      staleTime: 10_000,
    },
  );

  const updateAdmin = api.admin.setAdmin.useMutation({
    onSuccess: async () => {
      showToast("User permissions updated", "success");
      await refetch();
    },
    onError: (err) => {
      showToast(err.message ?? "Failed to update user", "error");
    },
  });

  const updateBanned = api.admin.setBanned.useMutation({
    onSuccess: async () => {
      showToast("User ban status updated", "success");
      await refetch();
    },
    onError: (err) => {
      showToast(err.message ?? "Failed to update ban status", "error");
    },
  });

  const isAuthorized = useMemo(
    () => session?.user?.admin === true,
    [session?.user?.admin],
  );

  const handleToggleAdmin = (userId: string, admin: boolean) => {
    updateAdmin.mutate({ userId, admin: !admin });
  };

  const handleToggleBanned = (userId: string, banned: boolean) => {
    updateBanned.mutate({ userId, banned: !banned });
  };

  if (status === "loading") {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-10">
        <div className="h-10 w-64 animate-pulse rounded-xl bg-[var(--color-surface)]/60" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface)]/60"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-6 py-8 shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(244,178,102,0.08)] text-[var(--color-accent)]">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Admin access required
          </h1>
          <p className="mt-2 text-[var(--color-subtext)]">
            You need to be an admin to view and manage users. If you think this is a mistake, sign out and back in.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              Return home
            </Link>
            <Link
              href="/signin?callbackUrl=%2Fadmin"
              className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="flex items-center gap-3 text-sm uppercase tracking-[0.2em] text-[var(--color-subtext)]">
            <Shield className="h-5 w-5 text-[var(--color-accent)]" />
            Admin Console
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)]">
            User Management
          </h1>
          <p className="mt-1 text-[var(--color-subtext)]">
            View users, inspect their profiles, and toggle admin access.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      <div className="rounded-3xl border border-[var(--color-border)] bg-gradient-to-br from-[var(--color-surface)]/90 via-[var(--color-surface-2)]/90 to-[rgba(88,198,177,0.08)] p-6 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[var(--color-subtext)]">
            <Users2 className="h-5 w-5" />
            <span className="text-sm">
              {users?.length ?? 0} user{(users?.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
          {error && (
            <div className="text-sm text-[var(--color-danger)]">
              {error.message}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-24 animate-pulse rounded-2xl bg-[var(--color-surface)]/70"
              />
            ))}
          </div>
        ) : (users?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
            <Users2 className="h-8 w-8 text-[var(--color-muted)]" />
            <p className="text-[var(--color-subtext)]">No users found.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {users?.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/85 p-4 transition hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-md)]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    {user.image ? (
                      <Image
                        src={user.image}
                        alt={user.name ?? "User avatar"}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Shield className="h-5 w-5 text-[var(--color-muted)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-lg font-semibold text-[var(--color-text)]">
                        {user.name ?? "Unnamed user"}
                      </p>
                      {user.admin && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(88,198,177,0.12)] px-2 py-1 text-xs font-semibold text-[var(--color-success)]">
                          <Crown className="h-3 w-3" />
                          {user.firstAdmin ? "First Admin" : "Admin"}
                        </span>
                      )}
                      {!user.profilePublic && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(242,199,97,0.12)] px-2 py-1 text-xs font-semibold text-[var(--color-warning)]">
                          <Lock className="h-3 w-3" />
                          Private
                        </span>
                      )}
                      {user.banned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(242,139,130,0.2)] px-2 py-1 text-xs font-semibold text-[var(--color-danger)]">
                          <Ban className="h-3 w-3" />
                          Banned
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm text-[var(--color-subtext)]">
                      {user.email}
                    </p>
                    {user.userHash && (
                      <Link
                        href={`/${user.userHash}`}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] transition hover:text-[var(--color-accent-light)]"
                      >
                        <Link2 className="h-3 w-3" />
                        View profile
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    ID: {user.id}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleToggleAdmin(user.id, user.admin ?? false)}
                      disabled={updateAdmin.isPending || user.firstAdmin}
                      title={user.firstAdmin ? "The first admin cannot be demoted by other admins" : ""}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        user.admin
                          ? "border border-[var(--color-danger)]/70 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                          : "border border-[var(--color-accent)]/70 text-[var(--color-text)] hover:bg-[var(--color-accent)]/10"
                      } ${updateAdmin.isPending || user.firstAdmin ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {updateAdmin.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.admin ? (
                        <>
                          <Shield className="h-4 w-4" />
                          {user.firstAdmin ? "Protected" : "Remove admin"}
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 text-[var(--color-accent)]" />
                          Grant admin
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleToggleBanned(user.id, user.banned ?? false)}
                      disabled={updateBanned.isPending || session?.user?.id === user.id}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                        user.banned
                          ? "border border-[var(--color-success)]/70 text-[var(--color-success)] hover:bg-[var(--color-success)]/10"
                          : "border border-[var(--color-danger)]/70 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
                      } ${updateBanned.isPending ? "opacity-50" : ""} ${session?.user?.id === user.id ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      {updateBanned.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.banned ? (
                        <>
                          <CircleCheck className="h-4 w-4" />
                          Unban
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4" />
                          Ban
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
