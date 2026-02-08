// File: src/__tests__/trpc.music.test.ts

import { describe, expect, it, vi } from "vitest";
import type { MaybePromise } from "@trpc/server";

vi.mock("@/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/services/songbird", () => ({
  songbird: {
    request: vi.fn(),
  },
}));

import { createCallerFactory } from "@/server/api/trpc";
import { musicRouter } from "@/server/api/routers/music";

const createCaller = createCallerFactory(musicRouter);
type CallerContext = Parameters<typeof createCaller>[0];
type CallerContextDb = CallerContext extends { db: infer D }
  ? D
  : CallerContext extends () => MaybePromise<infer C>
    ? C["db"]
    : never;

const createMockDb = (): CallerContextDb => {
  const insert = vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue(undefined),
  });
  const update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(undefined),
    }),
  });
  return {
    query: {
      userPreferences: {
        findFirst: vi.fn(),
      },
    },
    insert,
    update,
  } satisfies CallerContextDb;
};

describe("musicRouter tRPC operations", () => {
  it("returns default smart queue settings when no preferences exist", async () => {
    const db = createMockDb();
    db.query.userPreferences.findFirst.mockResolvedValue(null);

    const context = {
      db,
      session: { user: { id: "user-1" }, expires: new Date().toISOString() },
      headers: new Headers(),
    } satisfies CallerContext;

    const caller = createCaller(context);

    const result = await caller.getSmartQueueSettings();

    expect(result).toEqual({
      autoQueueEnabled: false,
      autoQueueThreshold: 3,
      autoQueueCount: 5,
      smartMixEnabled: true,
      similarityPreference: "balanced",
    });
  });

  it("persists preferences with supported visualizer type", async () => {
    const db = createMockDb();
    db.query.userPreferences.findFirst.mockResolvedValue(null);

    const context = {
      db,
      session: { user: { id: "user-1" }, expires: new Date().toISOString() },
      headers: new Headers(),
    } satisfies CallerContext;

    const caller = createCaller(context);

    const result = await caller.updatePreferences({
      visualizerType: "flowfield",
      keepPlaybackAlive: false,
    });

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalled();
  });
});
