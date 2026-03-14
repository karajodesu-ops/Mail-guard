Build stage

FROM node:20-alpine AS builder

WORKDIR /app

Copy root package files

COPY package.json ./
COPY package-lock.json* ./

Copy workspace package files

COPY packages/core/package.json ./packages/core/
COPY packages/smtp/package.json ./packages/smtp/
COPY apps/worker/package.json ./apps/worker/

Install dependencies

RUN npm install

Copy full source code

COPY tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

Generate Prisma client

RUN npx prisma generate --schema=packages/core/prisma/schema.prisma

Build workspaces in order

RUN npm run build --workspace=packages/core
RUN npm run build --workspace=packages/smtp
RUN npm run build --workspace=apps/worker

Production stage

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

Copy package files

COPY --from=builder /app/package.json ./

Copy node_modules

COPY --from=builder /app/node_modules ./node_modules

Copy built packages

COPY --from=builder /app/packages/core ./packages/core
COPY --from=builder /app/packages/smtp ./packages/smtp
COPY --from=builder /app/apps/worker ./apps/worker

Set working directory to worker

WORKDIR /app/apps/worker

Start worker

CMD ["node", "dist/index.js"]
