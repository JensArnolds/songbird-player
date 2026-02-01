FROM node:25.2.0-alpine AS base
RUN apk add --no-cache libc6-compat postgresql-client
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV ELECTRON_BUILD=false

# Mirror env.js: build args from .env (docker-compose passes them). No hardcoded values.
ARG AUTH_SECRET
ARG AUTH_DISCORD_ID
ARG AUTH_DISCORD_SECRET
ARG NEXTAUTH_URL
ARG DATABASE_URL
ARG DB_ADMIN_USER
ARG DB_ADMIN_PASSWORD
ARG DB_HOST
ARG DB_PORT
ARG DB_NAME
ARG NODE_ENV
ARG STREAMING_KEY
ARG SONGBIRD_API_KEY
ARG API_URL
ARG API_V2_URL
ARG NEXT_PUBLIC_NEXTAUTH_URL
ARG NEXT_PUBLIC_NEXTAUTH_VERCEL_URL
ARG NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER
ARG NEXT_PUBLIC_API_HEALTH_URL
ARG NEXT_PUBLIC_API_V2_HEALTH_URL
ARG ELECTRON_BUILD

ENV AUTH_SECRET=${AUTH_SECRET}
ENV AUTH_DISCORD_ID=${AUTH_DISCORD_ID}
ENV AUTH_DISCORD_SECRET=${AUTH_DISCORD_SECRET}
ENV NEXTAUTH_URL=${NEXTAUTH_URL}
ENV DATABASE_URL=${DATABASE_URL}
ENV DB_ADMIN_USER=${DB_ADMIN_USER}
ENV DB_ADMIN_PASSWORD=${DB_ADMIN_PASSWORD}
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV DB_NAME=${DB_NAME}
ENV NODE_ENV=${NODE_ENV}
ENV STREAMING_KEY=${STREAMING_KEY}
ENV SONGBIRD_API_KEY=${SONGBIRD_API_KEY}
ENV API_URL=${API_URL}
ENV API_V2_URL=${API_V2_URL}
ENV NEXT_PUBLIC_NEXTAUTH_URL=${NEXT_PUBLIC_NEXTAUTH_URL}
ENV NEXT_PUBLIC_NEXTAUTH_VERCEL_URL=${NEXT_PUBLIC_NEXTAUTH_VERCEL_URL}
ENV NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER=${NEXT_PUBLIC_NEXTAUTH_URL_CUSTOM_SERVER}
ENV NEXT_PUBLIC_API_HEALTH_URL=${NEXT_PUBLIC_API_HEALTH_URL}
ENV NEXT_PUBLIC_API_V2_HEALTH_URL=${NEXT_PUBLIC_API_V2_HEALTH_URL}
ENV ELECTRON_BUILD=${ELECTRON_BUILD}

RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.env.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/src/server/db ./src/server/db
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.bin/drizzle-kit ./node_modules/.bin/drizzle-kit
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/dotenv ./node_modules/dotenv

COPY --from=builder --chown=nextjs:nodejs /app/scripts/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 3222

ENV PORT=3222
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["/docker-entrypoint.sh"]
