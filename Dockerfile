# Stage 1: Build Next.js application
FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev for build)
RUN npm ci

# Copy source
COPY . .

# Build Next.js (standalone output)
RUN npm run build

# Seed the database (creates tables + populates brands and feeds)
RUN npx tsx src/lib/db/seed.ts && npx tsx scripts/seed-feeds.ts

# Stage 2: Runtime with Puppeteer/Chromium
FROM node:20-slim AS runner

WORKDIR /app

# Install Chromium and fonts for Puppeteer
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      chromium \
      fonts-noto-cjk \
      fonts-noto-color-emoji \
      fonts-liberation \
      ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

# Copy standalone server (includes traced node_modules)
COPY --from=builder /app/.next/standalone ./

# Copy static assets (not included in standalone by default)
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/public ./public

# Copy seeded database from builder
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["node", "server.js"]
