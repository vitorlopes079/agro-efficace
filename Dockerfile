# ==============================================================================
# BASE: Common Node.js Alpine image for all stages
# ==============================================================================
FROM node:20.10-alpine AS base

# ==============================================================================
# DEPS: Install production dependencies
# ==============================================================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps --ignore-scripts

# ==============================================================================
# BUILDER: Build the Next.js application
# ==============================================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (populates src/generated AND .next/standalone/node_modules after build)
RUN npx prisma generate

# Build Next.js with standalone output
RUN npm run build

# ==============================================================================
# RUNNER: Production image, minimal footprint
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next && chown nextjs:nodejs .next

# Standalone output already includes the node_modules Next.js needs (including Prisma)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy custom Prisma generated client (src/generated)
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy Prisma CLI modules needed to run migrate deploy at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 4000
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
