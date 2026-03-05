# ==============================================================================
# BASE: Common Node.js Alpine image for all stages
# ==============================================================================
FROM node:20.10-alpine AS base

# ==============================================================================
# DEPS: Install production dependencies
# - libc6-compat needed for some native Node modules on Alpine
# - Using --legacy-peer-deps for compatibility
# ==============================================================================
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ==============================================================================
# BUILDER: Build the Next.js application
# - Generates Prisma client for custom output path
# - NEXT_PUBLIC_ vars must be set at build time (baked into client bundle)
# ==============================================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (baked into the JavaScript bundle)
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

# Disable telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma client (output: src/generated/client)
RUN npx prisma generate

# Build Next.js with standalone output
RUN npm run build

# ==============================================================================
# RUNNER: Production image, minimal footprint
# - Uses standalone output (no node_modules needed for Next.js)
# - Copies Prisma for runtime migrations
# - Runs as non-root user for security
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Create .next directory with correct permissions for prerender cache
RUN mkdir .next && chown nextjs:nodejs .next

# Copy standalone output (includes server.js and minimal node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and generated client for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Copy Prisma CLI for running migrations (from node_modules)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 4000

ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

# Run migrations then start the server
# server.js is created by Next.js standalone build
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
