# ==========================================
# PORTOS AI — Next.js Frontend Dockerfile
# ==========================================
FROM node:20-slim AS base

WORKDIR /app

# Install dependencies based on package-lock
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source
COPY . .

# Build production assets
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runtime stage
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package and built files
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) process.exit(1)})"

CMD ["npm", "start"]

