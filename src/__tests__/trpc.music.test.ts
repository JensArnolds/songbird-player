// File: src/__tests__/trpc.music.test.ts

import { describe, expect, it, vi } from "vitest";

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

const createMockDb = () => {
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
  } as any;
};

describe("musicRouter tRPC operations", () => {
  it("returns default smart queue settings when no preferences exist", async () => {
    const db = createMockDb();
    db.query.userPreferences.findFirst.mockResolvedValue(null);

    const caller = createCaller({
      db,
      session: { user: { id: "user-1" } },
      headers: new Headers(),
    });

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

    const caller = createCaller({
      db,
      session: { user: { id: "user-1" } },
      headers: new Headers(),
    });

    const result = await caller.updatePreferences({
      visualizerType: "flowfield",
      keepPlaybackAlive: false,
    });

    expect(result).toEqual({ success: true });
    expect(db.insert).toHaveBeenCalled();
  });
});
