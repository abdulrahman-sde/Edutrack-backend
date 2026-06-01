# ── Stage 1: dev ─────────────────────────────────────────────
FROM node:24-alpine AS dev
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run dev"]

# ── Stage 2: builder ─────────────────────────────────────────
FROM node:24-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx prisma generate && npm run build

# ── Stage 3: production ──────────────────────────────────────
FROM node:24-alpine AS production
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY prisma ./prisma
COPY prisma.config.ts ./
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]