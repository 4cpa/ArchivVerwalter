# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install build tools needed for sqlite3 native module
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:20-alpine

LABEL org.opencontainers.image.title="ArchivVerwalter" \
      org.opencontainers.image.description="Archive manager — index, deduplicate and browse file archives" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder /build/node_modules ./node_modules

# Copy application source
COPY src/       ./src/
COPY public/    ./public/
COPY index.js   ./
COPY package.json ./

# Writable directories (mounted as volumes in production)
RUN mkdir -p data logs && chown -R node:node /app

# Run as non-root
USER node

ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health | grep -q '"status":"ok"' || exit 1

CMD ["node", "index.js"]
