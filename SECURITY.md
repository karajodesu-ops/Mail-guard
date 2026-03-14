# MailGuard Security Policy

## Security Architecture

MailGuard OSS is designed with security as a primary concern. This document outlines the security measures implemented and best practices for deployment.

## Encryption

### Data at Rest

All sensitive data is encrypted using AES-256-GCM before storage:

- **Sender Email Passwords**: SMTP passwords are encrypted with AES-256-GCM
- **OAuth Tokens**: OAuth refresh tokens are encrypted
- **Fresh IV**: Each encryption operation generates a new random 16-byte IV
- **Authentication Tag**: GCM mode provides integrity verification

```typescript
// Encryption format: iv_hex:authTag_hex:ciphertext_hex
const encrypted = encrypt(smtpPassword, ENCRYPTION_KEY);
```

### OTP Security

OTP codes are never stored in plaintext:

- **Hashing**: bcrypt with cost factor 10
- **One-way**: Original OTP cannot be recovered from hash
- **Constant-time Comparison**: bcrypt.compare prevents timing attacks

```typescript
// OTP is hashed before storage
const hash = await hashOtp(otpCode);
// Verification uses constant-time comparison
const isValid = await verifyOtpHash(submittedCode, hash);
```

### API Key Security

API keys are hashed and never stored in plaintext:

- **SHA-256 Hashing**: Keys are hashed before database storage
- **Redis Caching**: Cached with TTL to reduce database load
- **Key Prefix**: Only first 12 characters are stored for identification
- **Rate-limited**: Invalid key attempts are rate-limited

```typescript
// Key validation flow
const keyHash = hashApiKey(apiKey); // SHA-256
const cached = await getCachedApiKey(keyHash);
```

## Authentication & Authorization

### API Key Scopes

API keys support multiple scopes:

| Scope | Description |
|-------|-------------|
| `otp:send` | Send OTP codes |
| `otp:verify` | Verify OTP codes |
| `email:send` | Send transactional emails |
| `logs:read` | Read email logs |
| `admin` | Full administrative access |

### JWT Tokens

Successful OTP verification returns a signed JWT:

- **Algorithm**: HS256
- **Expiration**: Configurable, default 1 hour
- **Claims**: Includes email, purpose, and project ID
- **Secure Storage**: Store securely on client side

### Telegram Bot Security

- **Admin Gate**: Only authorized Telegram user IDs can access admin commands
- **Session Management**: Sessions stored in database with expiration
- **Command Validation**: All inputs are validated before processing

## Rate Limiting

### Sliding Window Algorithm

Rate limiting uses a sliding window for accurate request counting:

```typescript
// Rate limit tiers
const RATE_LIMITS = {
  OTP_SEND: { points: 5, duration: 60 },      // 5 per minute
  OTP_VERIFY: { points: 10, duration: 60 },   // 10 per minute
  EMAIL_SEND: { points: 100, duration: 60 },  // 100 per minute
};
```

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 55
X-RateLimit-Reset: 1704067200
```

## Input Validation

### Email Validation

- **Format Check**: RFC 5322 compliant email validation
- **Domain Validation**: Checks for valid MX records (optional)
- **Normalization**: Emails are lowercased and trimmed

### OTP Validation

- **Length**: Only 4, 6, or 8 digit OTPs allowed
- **Numeric Only**: Non-numeric characters rejected
- **Expiration Check**: Expired OTPs are rejected

### Request Validation

All API requests are validated using JSON schemas:

```typescript
const OtpSendSchema = {
  type: 'object',
  required: ['email'],
  properties: {
    email: { type: 'string', format: 'email' },
    purpose: { type: 'string', maxLength: 100 },
  },
};
```

## Infrastructure Security

### HTTPS Enforcement

- **Production**: HTTPS is mandatory, HTTP requests are redirected
- **TLS 1.2+**: Minimum TLS version 1.2
- **HSTS**: Strict Transport Security header enforced

### Security Headers

All responses include security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

### CORS Configuration

- **Origins**: Configurable allowed origins
- **Methods**: Only necessary methods allowed
- **Credentials**: Credentials mode configurable

## Vulnerability Reporting

### Reporting Process

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security@mailguard.dev with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 72 hours
- **Fix Timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 1 week
  - Medium: 2 weeks
  - Low: Next release

### Disclosure Policy

- Coordinated disclosure after fix is released
- Credit given to reporter (if desired)
- Security advisory published for significant vulnerabilities

## Security Best Practices

### Deployment

1. **Environment Variables**: Never commit secrets to version control
2. **Encryption Key**: Generate a secure 32-byte key for production
3. **Database**: Use connection pooling and SSL
4. **Redis**: Enable TLS and authentication
5. **Backups**: Encrypt database backups

### API Key Management

1. **Rotation**: Rotate keys periodically
2. **Scope**: Use minimal required scope
3. **Monitoring**: Monitor key usage for anomalies
4. **Revocation**: Revoke keys immediately if compromised

### Monitoring

1. **Logs**: Monitor authentication failures
2. **Alerts**: Set up alerts for suspicious activity
3. **Rate Limits**: Monitor rate limit violations
4. **Access Logs**: Keep detailed access logs

### Sender Email Security

1. **App Passwords**: Use app-specific passwords for Gmail
2. **OAuth**: Prefer OAuth over password authentication
3. **Limits**: Set appropriate daily sending limits
4. **Monitoring**: Monitor sender health and reputation

## Security Checklist

Before deploying to production, ensure:

- [ ] Strong, unique encryption key generated
- [ ] All environment variables properly set
- [ ] HTTPS enabled with valid certificate
- [ ] Rate limiting configured appropriately
- [ ] Telegram admin UID restricted to authorized users
- [ ] Database backups configured and encrypted
- [ ] Redis requires authentication
- [ ] API keys have minimal required scope
- [ ] Monitoring and alerting configured
- [ ] Security headers enabled

## Compliance

MailGuard OSS can be configured for various compliance requirements:

- **GDPR**: Data encryption, right to erasure, audit logs
- **SOC 2**: Access controls, monitoring, encryption
- **HIPAA**: Encryption at rest and in transit, audit trails

## Security Contact

For security-related inquiries:

- **Email**: security@mailguard.dev
- **PGP Key**: [Available on request]
- **Response Time**: 24 hours for security issues

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial security policy |