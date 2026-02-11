import type { getProviders } from "next-auth/react";

type ProvidersResponse = NonNullable<Awaited<ReturnType<typeof getProviders>>>;
type ProviderRecord = ProvidersResponse[string];

const buildOAuthProvider = (id: string, name: string): ProviderRecord => ({
  id,
  name,
  type: "oauth",
  signinUrl: `/api/auth/signin/${id}`,
  callbackUrl: `/api/auth/callback/${id}`,
});

export const OAUTH_PROVIDERS_FALLBACK: ProvidersResponse = {
  discord: buildOAuthProvider("discord", "Discord"),
};
