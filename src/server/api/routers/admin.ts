// File: src/server/api/routers/admin.ts

import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import { users } from "@/server/db/schema";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.session.user?.admin) {
    throw new TRPCError({ code: "FORBIDDEN" });
  }

  return next();
});

export const adminRouter = createTRPCRouter({
  listUsers: adminProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(200).default(100),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 100;

      return ctx.db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          userHash: true,
          admin: true,
          profilePublic: true,
        },
        orderBy: [asc(users.email)],
        limit,
      });
    }),

  setAdmin: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        admin: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId && !input.admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove your own admin access.",
        });
      }

      await ctx.db
        .update(users)
        .set({ admin: input.admin })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),
});
