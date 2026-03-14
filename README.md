# MailGuard OSS

A complete, self-hosted OTP (One-Time Password) and email automation server with Fastify REST API, BullMQ Queue Worker, Telegram Bot, and multi-language SDKs.

## Features

- **OTP Management**: Generate, send, and verify one-time passwords via email
- **Email Automation**: Send transactional emails through SMTP providers
- **Telegram Bot**: Administer your MailGuard instance via Telegram
- **Multi-language SDKs**: JavaScript/TypeScript, Python, PHP, and Go
- **Self-hosted**: Full control over your data and infrastructure
- **Production Ready**: Built with security, scalability, and reliability in mind

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Fastify API   │────▶│    BullMQ       │────▶│   SMTP Pool     │
│   (apps/api)    │     │    Worker       │     │   (Nodemailer)  │
└────────┬────────┘     │   (apps/worker) │     └─────────────────┘
         │              └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │     Redis       │
│   (Supabase)    │     │    (Upstash)    │
└─────────────────┘     └─────────────────┘
         ▲
         │
┌────────┴────────┐
│  Telegram Bot   │
│  (apps/bot)     │
└─────────────────┘
```

## Tech Stack

- **API Framework**: Fastify with TypeScript
- **Queue System**: BullMQ with Redis
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (Upstash recommended)
- **Bot Framework**: grammY for Telegram
- **Email**: Nodemailer with SMTP provider auto-detection
- **Encryption**: AES-256-GCM for sensitive data
- **OTP Hashing**: bcrypt with cost factor 10

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Telegram Bot Token (optional)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/mailguard/mailguard.git
cd mailguard
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Configure your environment variables (see Configuration section)

5. Generate Prisma client and run migrations:
```bash
cd packages/core
npm run generate
npm run migrate
```

6. Start the development servers:
```bash
# Terminal 1: API
cd apps/api && npm run dev

# Terminal 2: Worker
cd apps/worker && npm run dev

# Terminal 3: Bot (optional)
cd apps/bot && npm run dev
```

### Docker Compose

For local development with all services:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 3000
- Worker
- Bot (if configured)

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `ENCRYPTION_KEY` | 32-byte hex key for AES-256-GCM | Yes |
| `JWT_SECRET` | Secret for signing JWT tokens | Yes |
| `API_PORT` | API server port (default: 3000) | No |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | For bot |
| `TELEGRAM_ADMIN_UID` | Admin Telegram user ID | For bot |

### Generating Keys

```bash
# Generate encryption key (32 bytes = 64 hex characters)
openssl rand -hex 32

# Generate JWT secret
openssl rand -hex 32
```

## API Reference

### OTP Endpoints

#### Send OTP
```http
POST /api/v1/otp/send
Content-Type: application/json
X-API-Key: mg_live_xxx

{
  "email": "user@example.com",
  "purpose": "login"
}
```

Response:
```json
{
  "id": "otp_abc123",
  "status": "sent",
  "expires_in": 300,
  "masked_email": "u***@example.com"
}
```

#### Verify OTP
```http
POST /api/v1/otp/verify
Content-Type: application/json
X-API-Key: mg_live_xxx

{
  "email": "user@example.com",
  "code": "123456"
}
```

Response (success):
```json
{
  "verified": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_at": "2024-01-01T12:00:00Z"
}
```

### Email Endpoints

#### Send Email
```http
POST /api/v1/email/send
Content-Type: application/json
X-API-Key: mg_live_xxx

{
  "to": "recipient@example.com",
  "subject": "Welcome!",
  "body": "Hello, welcome to our service!",
  "format": "text"
}
```

### Health Check
```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok",
  "bot": "ok",
  "queue": {
    "waiting": 5,
    "active": 2
  },
  "senders": [
    {
      "id": "sender_123",
      "email": "noreply@example.com",
      "provider": "gmail",
      "status": "ok",
      "daily_limit": 500,
      "sent_today": 42
    }
  ]
}
```

## SDK Usage

### JavaScript/TypeScript

```bash
npm install @mailguard/sdk-js
```

```typescript
import { MailGuard } from '@mailguard/sdk-js';

const mg = MailGuard.init({
  apiKey: 'mg_live_xxxxxxxxxxxx',
  baseUrl: 'https://api.mailguard.example.com',
});

// Send OTP
const result = await mg.otp.send({
  email: 'user@example.com',
  purpose: 'login',
});

// Verify OTP
const verifyResult = await mg.otp.verify({
  email: 'user@example.com',
  code: '123456',
});

if (verifyResult.verified) {
  console.log('Token:', verifyResult.token);
}
```

### Python

```bash
pip install mailguard-sdk
```

```python
import asyncio
from mailguard_sdk import MailGuard

async def main():
    mg = MailGuard.init({
        "api_key": "mg_live_xxxxxxxxxxxx",
        "base_url": "https://api.mailguard.example.com",
    })
    
    # Send OTP
    result = await mg.otp.send(
        email="user@example.com",
        purpose="login",
    )
    print(f"OTP sent: {result.id}")
    
    # Verify OTP
    verify_result = await mg.otp.verify(
        email="user@example.com",
        code="123456",
    )
    if verify_result.verified:
        print(f"Token: {verify_result.token}")

asyncio.run(main())
```

### PHP

```bash
composer require mailguard/sdk-php
```

```php
use MailGuard\Sdk\MailGuard;

$mg = MailGuard::init([
    'api_key' => 'mg_live_xxxxxxxxxxxx',
    'base_url' => 'https://api.mailguard.example.com',
]);

// Send OTP
$result = $mg->otp->send('user@example.com', 'login');
echo "OTP sent: {$result->id}\n";

// Verify OTP
$verifyResult = $mg->otp->verify('user@example.com', '123456');
if ($verifyResult instanceof OtpVerifySuccessResponse) {
    echo "Token: {$verifyResult->token}\n";
}
```

### Go

```bash
go get github.com/mailguard/sdk-go
```

```go
package main

import (
    "context"
    "fmt"
    "time"
    
    "github.com/mailguard/sdk-go/mailguard"
)

func main() {
    mg, err := mailguard.Init(mailguard.Config{
        APIKey:  "mg_live_xxxxxxxxxxxx",
        BaseURL: "https://api.mailguard.example.com",
        Timeout: 30 * time.Second,
    })
    if err != nil {
        panic(err)
    }
    
    // Send OTP
    result, err := mg.Otp().Send(context.Background(), &mailguard.OtpSendRequest{
        Email:   "user@example.com",
        Purpose: "login",
    })
    if err != nil {
        panic(err)
    }
    fmt.Printf("OTP sent: %s\n", result.ID)
    
    // Verify OTP
    verifyResult, err := mg.Otp().Verify(context.Background(), &mailguard.OtpVerifyRequest{
        Email: "user@example.com",
        Code:  "123456",
    })
    if err != nil {
        panic(err)
    }
    if success, ok := verifyResult.(*mailguard.OtpVerifySuccessResponse); ok {
        fmt.Printf("Token: %s\n", success.Token)
    }
}
```

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Show system status and help |
| `/genkey` | Generate a new API key |
| `/newproject` | Create a new project (wizard) |
| `/addemail` | Add sender email (wizard) |
| `/setotp` | Configure OTP template |
| `/senders` | List sender emails |
| `/projects` | List projects |
| `/keys` | List API keys |
| `/logs` | View email logs |

## Deployment

### Railway

1. Create a new Railway project
2. Add PostgreSQL and Redis services
3. Deploy the API, Worker, and Bot as separate services
4. Set environment variables

See `railway.toml` for configuration.

### Docker

Build and run with Docker:

```bash
# Build
docker build -t mailguard-api -f apps/api/Dockerfile .
docker build -t mailguard-worker -f apps/worker/Dockerfile .
docker build -t mailguard-bot -f apps/bot/Dockerfile .

# Run
docker run -p 3000:3000 --env-file .env mailguard-api
docker run --env-file .env mailguard-worker
docker run --env-file .env mailguard-bot
```

## Security

- **API Keys**: SHA-256 hashed with Redis cache
- **OTP Codes**: bcrypt hashed (cost factor 10)
- **Sensitive Data**: AES-256-GCM encryption with fresh IV per operation
- **Rate Limiting**: Sliding window algorithm with 5 tiers
- **HTTPS**: Enforced in production
- **Security Headers**: HSTS, XSS Protection, Content-Type Options

See [SECURITY.md](./SECURITY.md) for more details.

## Development

### Project Structure

```
mailguard/
├── apps/
│   ├── api/          # Fastify REST API
│   ├── worker/       # BullMQ email worker
│   └── bot/          # Telegram bot
├── packages/
│   ├── core/         # Shared utilities
│   ├── smtp/         # Email provider abstraction
│   ├── sdk-js/       # JavaScript SDK
│   ├── sdk-python/   # Python SDK
│   ├── sdk-php/      # PHP SDK
│   └── sdk-go/       # Go SDK
├── docker-compose.yml
├── railway.toml
└── package.json      # npm workspaces
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific package
cd packages/core && npm test

# Run with coverage
npm run test:coverage
```

### Code Style

This project uses strict TypeScript with comprehensive type checking.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## Support

- GitHub Issues: [https://github.com/mailguard/mailguard/issues](https://github.com/mailguard/mailguard/issues)
- Documentation: [https://docs.mailguard.dev](https://docs.mailguard.dev)