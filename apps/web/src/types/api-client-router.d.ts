import type { AppRouter as WebAppRouter } from "@/server/api/root";

declare module "@starchild/api-client/trpc/router" {
  interface TRPCRouterRegistry {
    appRouter: WebAppRouter;
  }
}
