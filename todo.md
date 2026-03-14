# MailGuard OSS - Development Todo

## Phase 1: Project Foundation
- [x] Create root package.json with npm workspaces
- [x] Create tsconfig.json
- [x] Create .env.example
- [x] Create docker-compose.yml
- [x] Create railway.toml

## Phase 2: Packages Core
- [x] Create prisma/schema.prisma
- [x] Create crypto.ts (AES-256-GCM encryption)
- [x] Create otp.ts (OTP generation/hashing)
- [x] Create ratelimit.ts (Sliding window rate limiter)
- [x] Create env.ts (Zod validation)
- [x] Create constants.ts
- [x] Create types/index.ts
- [x] Create prisma.ts
- [x] Create logger.ts
- [x] Create jwt.ts
- [x] Create redis.ts
- [x] Create apikey.ts
- [x] Create template.ts
- [x] Create utils.ts
- [x] Create index.ts

## Phase 3: Packages SMTP
- [x] Create provider.ts
- [x] Create mailer.ts
- [x] Create index.ts

## Phase 4: Apps API
- [x] Create middleware/auth.ts
- [x] Create middleware/ratelimit.ts
- [x] Create middleware/security.ts
- [x] Create routes/otp.ts
- [x] Create routes/health.ts
- [x] Create routes/email.ts
- [x] Create routes/logs.ts
- [x] Create index.ts
- [x] Create Dockerfile

## Phase 5: Apps Worker
- [x] Create processors/email.ts
- [x] Create processors/cleanup.ts
- [x] Create processors/notification.ts
- [x] Create index.ts
- [x] Create Dockerfile

## Phase 6: Apps Bot
- [x] Create middleware/auth.ts
- [x] Create commands/start.ts
- [x] Create commands/genkey.ts
- [x] Create commands/setotp.ts
- [x] Create commands/list.ts
- [x] Create commands/logs.ts
- [x] Create wizards/addemail.ts
- [x] Create wizards/newproject.ts
- [x] Create notify/messages.ts
- [x] Create index.ts
- [x] Create Dockerfile

## Phase 7: SDKs
- [x] Create packages/sdk-js/package.json
- [x] Create packages/sdk-js/tsconfig.json
- [x] Create packages/sdk-js/src/types.ts
- [x] Create packages/sdk-js/src/errors.ts
- [x] Create packages/sdk-js/src/index.ts (Main MailGuard class)
- [x] Create packages/sdk-python
- [x] Create packages/sdk-php
- [x] Create packages/sdk-go

## Phase 8: Testing
- [x] Create unit tests for packages/core
- [x] Create integration tests for API

## Phase 9: Documentation
- [x] Create README.md
- [x] Create SECURITY.md
- [x] Create LICENSE