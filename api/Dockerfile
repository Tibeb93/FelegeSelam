# ==============================================================================
# Multi-stage Production Dockerfile for Aemade Selam NestJS API
# ==============================================================================

# --- Stage 1: Dependencies ---
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# --- Stage 2: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build
RUN npm prune --production

# --- Stage 3: Production Runner ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install runtime utilities
RUN apk add --no-cache dumb-init openssl wget

# Create non-root system group and user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Create uploads, logs, and backups storage directories
RUN mkdir -p /app/uploads /app/backups /app/logs && \
    chown -R nestjs:nestjs /app/uploads /app/backups /app/logs

# Copy application files
COPY --chown=nestjs:nestjs --from=builder /app/node_modules ./node_modules
COPY --chown=nestjs:nestjs --from=builder /app/dist ./dist
COPY --chown=nestjs:nestjs --from=builder /app/prisma ./prisma
COPY --chown=nestjs:nestjs --from=builder /app/package.json ./package.json
COPY --chown=nestjs:nestjs --from=builder /app/scripts ./scripts
COPY --chown=nestjs:nestjs --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh

RUN chmod +x ./docker-entrypoint.sh

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
