FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV SESSION_SECRET=build-placeholder-secret
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
ENV DIRECT_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

# Prisma-CLI mit vollstaendiger Abhaengigkeitskette (effect, c12, ...) fuer
# "migrate deploy". Das Standalone-Bundle enthaelt nur die App, nicht die CLI.
# Version aus der Lockfile, damit CLI und Client gleich bleiben.
FROM node:22-alpine AS prisma-cli
WORKDIR /app
COPY package-lock.json ./
RUN v="$(node -p "require('./package-lock.json').packages['node_modules/prisma'].version")" \
 && printf '%s\n' '{"name":"prisma-cli","private":true}' > package.json \
 && npm install --no-save --no-audit --no-fund "prisma@$v"

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache openssl libc6-compat
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
# Ergänzt die Top-Level-Abhängigkeiten der CLI (effect, c12, ...); @prisma bleibt
# vollständig aus dem Builder, der Merge überschreibt nur gleiche Versionen.
COPY --from=prisma-cli /app/node_modules ./node_modules
USER nextjs
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node scripts/ensure-admin.mjs && node server.js"]
