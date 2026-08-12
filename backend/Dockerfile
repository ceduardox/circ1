# Base stage
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (incluye devDependencies para poder compilar TS y Prisma)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Generate Prisma
FROM base AS generate
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma/
RUN npx prisma generate

# Build
FROM base AS build
COPY --from=generate /app/node_modules ./node_modules
COPY --from=generate /app/prisma ./prisma/
COPY . .
RUN npm run build

# Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/prisma ./prisma/

EXPOSE 3001
CMD ["node", "dist/index.js"]
