import type { AnyRouter } from "@trpc/server";

export interface TRPCRouterRegistry {}

export type AppRouter =
  TRPCRouterRegistry extends {
    appRouter: infer TRouter extends AnyRouter;
  }
    ? TRouter
    : AnyRouter;
