// File: src/server/api/routers/admin.ts

import { TRPCError } from "@trpc/server";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
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
          firstAdmin: true,
          banned: true,
          profilePublic: true,
        },
        orderBy: [asc(users.email)],
        limit,
      });
    }),

  setBanned: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        banned: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.id === input.userId && input.banned) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot ban yourself.",
        });
      }

      await ctx.db
        .update(users)
        .set({ banned: input.banned })
        .where(eq(users.id, input.userId));

      return { success: true };
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

      // Check if the target user is the firstAdmin
      const targetUser = await ctx.db.query.users.findFirst({
        columns: { firstAdmin: true },
        where: eq(users.id, input.userId),
      });

      if (targetUser?.firstAdmin && !input.admin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The first admin cannot be demoted by other admins.",
        });
      }

      await ctx.db
        .update(users)
        .set({ admin: input.admin })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Check if the user is the firstAdmin
    const currentUser = await ctx.db.query.users.findFirst({
      columns: {
        firstAdmin: true,
        emailVerified: true,
      },
      where: eq(users.id, userId),
    });

    // If the user is the firstAdmin, transfer the role to the next eligible user
    if (currentUser?.firstAdmin) {
      // First, try to find the second-oldest admin (excluding the current user)
      const nextAdmin = await ctx.db.query.users.findFirst({
        columns: { id: true },
        where: and(eq(users.admin, true), ne(users.id, userId)),
        orderBy: [asc(users.emailVerified)],
      });

      if (nextAdmin) {
        // Transfer firstAdmin to the second-oldest admin
        await ctx.db
          .update(users)
          .set({ firstAdmin: true })
          .where(eq(users.id, nextAdmin.id));
      } else {
        // No other admin exists, find the second-oldest user in general
        const nextUser = await ctx.db.query.users.findFirst({
          columns: { id: true },
          where: ne(users.id, userId),
          orderBy: [asc(users.emailVerified)],
        });

        if (nextUser) {
          // Make them admin and firstAdmin
          await ctx.db
            .update(users)
            .set({ admin: true, firstAdmin: true })
            .where(eq(users.id, nextUser.id));
        }
        // If there's no other user at all, no transfer is needed
      }
    }

    // Delete the user account (cascades to related data)
    await ctx.db.delete(users).where(eq(users.id, userId));

    return { success: true };
  }),
});
