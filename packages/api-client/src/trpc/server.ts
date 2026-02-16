// File: src/trpc/server.ts

import "server-only";

import { createHydrationHelpers } from "@trpc/react-query/rsc";
import type { AnyRouter } from "@trpc/server";
import { headers } from "next/headers";
import { cache } from "react";

import { type AppRouter } from "./router";
import { createQueryClient } from "./query-client";

interface CreateTRPCServerHelpersOptions {
  createContext: (options: { headers: Headers }) => Promise<unknown> | unknown;
  createCaller: (createContext: () => Promise<unknown>) => any;
}

export function createTRPCServerHelpers<TRouter extends AnyRouter = AppRouter>(
  options: CreateTRPCServerHelpersOptions,
) {
  const createContext = cache(async () => {
    const requestHeaders = new Headers(await headers());
    requestHeaders.set("x-trpc-source", "rsc");

    return options.createContext({
      headers: requestHeaders,
    });
  });

  const getQueryClient = cache(createQueryClient);
  const caller = options.createCaller(createContext);

  return createHydrationHelpers<TRouter>(caller, getQueryClient);
}
