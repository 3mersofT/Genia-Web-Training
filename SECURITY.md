# Security Policy

## Reporting Vulnerabilities

**Do not open public issues for security vulnerabilities.**

Please report security issues by email to: **contact@hk-conseils.fr**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide a timeline for resolution.

## Supported Versions

| Version | Supported |
|---------|-----------|
| 3.x     | Yes       |
| < 3.0   | No        |

## Security Practices

### Authentication & Authorization
- All database tables use Row-Level Security (RLS)
- Admin routes are protected by middleware with role verification
- Service role keys are only used in server-side API routes, never exposed to clients
- Session cookies use `httpOnly`, `secure`, and `sameSite` flags

### Input Validation
- All API endpoints validate input with Zod schemas
- Password resets require minimum 12 characters with complexity rules
- Query parameters are bounded to prevent resource exhaustion

### Rate Limiting
- API endpoints are rate-limited (10-30 req/min depending on endpoint)
- Supports distributed rate limiting via Upstash Redis

### Content Security
- Content-Security-Policy header is enforced
- User-generated markdown is sanitized with `rehype-sanitize`
- XSS protection verified by dedicated test suite

### Monitoring
- Error tracking via Sentry with PII filtering enabled
- Sensitive data (passwords, tokens, API keys) redacted from logs

## Dependencies

We use Dependabot for automated dependency updates. Security advisories are reviewed weekly.
