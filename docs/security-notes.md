# System Security Architecture & Hardening Notes

This document details the security safeguards, threat modeling mitigations, and server hardening procedures implemented in the **Aemade Selam Sunday School System** based on the **OWASP Top 10** standards.

---

## 1. Threat Mitigation Matrix (OWASP Top 10)

### 1.1 A01:2021 - Broken Access Control
- **Role-Based Access Control (RBAC)**: All administrative, teaching, and member routes are safeguarded by NestJS `JwtAuthGuard` and `@Roles()` guards.
- **Principle of Least Privilege**:
  - `super_admin`: Full system control, user management, audit logs, backup downloads.
  - `admin`: Member records, courses, contributions, forms, events.
  - `teacher`: Assigned courses, lessons, attendance recording, student grades.
  - `content_manager`: Mezmur catalog, announcements, posts, public events.
  - `member`: Personal profile, course enrollments, submitted forms, contribution history.
- **Resource Ownership Verification**: Members can only access and modify their own records and submissions; multi-tenant isolation is enforced at the service query level.

### 1.2 A02:2021 - Cryptographic Failures
- **Password Storage**: Hashed using industry-standard `bcrypt` / `argon2` with high-work factors. Passwords are never stored in plaintext and never included in API responses or logs (`Exclude()` decorators).
- **In-Transit Encryption**: All communication is enforced over **TLS 1.3 / TLS 1.2** with HTTP Strict Transport Security (`HSTS`). Unencrypted HTTP is permanently redirected (301) to HTTPS.
- **Two-Factor Authentication (2FA)**: Time-based One-Time Password (TOTP) algorithm (RFC 6238). Shared secrets are encrypted at rest.
- **JWT Signing**: Dual-token architecture with short-lived access tokens (15 minutes) and rotating cryptographically hashed refresh tokens (7 days).

### 1.3 A03:2021 - Injection
- **SQL Injection Prevention**: All database interactions are executed through **Prisma ORM** using prepared and parameterized queries. No raw SQL string concatenation exists in the codebase.
- **Cross-Site Scripting (XSS)**: Rich text inputs (Tiptap / Sinksar editor) are scrubbed through server-side sanitization libraries (`DOMPurify` / `sanitize-html`), stripping `<script>`, `<iframe>`, and malicious `onerror`/`onload` attributes before saving to database. Output is automatically escaped in React / Next.js JSX templates.

### 1.4 A04:2021 - Insecure Design
- **Rate Limiting**: Configured at both Nginx proxy level (`limit_req_zone` 10r/s) and application level via `@nestjs/throttler` (100 req/min for standard endpoints, 5 req/min for `/auth/login`).
- **Account Lockout**: 5 consecutive failed login attempts trigger an exponential lock-out period (`lockedUntil`), mitigating automated credential stuffing.

### 1.5 A05:2021 - Security Misconfiguration
- **HTTP Security Headers**: Enforced via `helmet` middleware:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy`: Restricts script and style execution to trusted origins.
- **CORS Policies**: Explicit origin reflection restricted strictly to configured web portal domains; wildcard `*` is disabled in production.

### 1.6 A06:2021 - Vulnerable and Outdated Components
- **Dependency Auditing**: Continuous automated auditing via `npm audit` in CI/CD pipeline (`.github/workflows/ci.yml`).
- **Minimalist Base Images**: Containers run on `node:20-alpine` stripped of package managers and unnecessary build utilities.

### 1.7 A07:2021 - Identification and Authentication Failures
- **Session Revocation**: User password changes immediately revoke all active refresh tokens in the `refresh_tokens` table.
- **Secure Cookie Flags**: Session cookies are set with `HttpOnly`, `Secure`, and `SameSite=Strict`.

### 1.8 A08:2021 - Software and Data Integrity Failures
- **File Upload Verification**: Uploaded media (photos, audio, PDF) are checked for allowed MIME types and file extension matches. Files are stored with cryptographically generated UUID basenames to prevent path traversal (`../../etc/passwd`).
- **Backup Verification**: All database backups generate and verify SHA-256 hashes before decompression.

### 1.9 A09:2021 - Security Logging and Monitoring Failures
- **Audit Logging**: Any write operation to `Member`, `Course`, `Grade`, `Contribution`, or `User` records an immutable audit log entry containing the user ID, entity, action, IP address, and JSON diff (`oldValue` vs `newValue`).
- **Exception Telemetry**: Uncaught server exceptions are monitored via Sentry error tracking with sensitive user information masked.

### 1.10 A10:2021 - Server-Side Request Forgery (SSRF)
- External media embeds (e.g. YouTube video previews) validate target URLs against strict regular expressions, refusing internal loopback IPs (`127.0.0.1`, `169.254.169.254`, `localhost`).

---

## 2. Production Host Hardening Checklist

When preparing a production Linux VPS host, apply the following system configurations:

### 2.1 SSH Hardening (`/etc/ssh/sshd_config`)
```text
Port 2222                    # (Optional) Change standard SSH port
PermitRootLogin no           # Disable direct root access
PasswordAuthentication no    # Require SSH public key authentication
PubkeyAuthentication yes
MaxAuthTries 3
```
Restart SSH service:
```bash
sudo systemctl restart sshd
```

### 2.2 Intrusion Prevention with Fail2ban
Install and enable fail2ban to automatically ban IPs with repeated failed SSH or HTTP authentication attempts:
```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2.3 Docker Container Non-Root Users
Both `api/Dockerfile` and `web/Dockerfile` run under unprivileged system users:
- API container runs as `USER nestjs` (`uid 1001:1001`).
- Web container runs as `USER nextjs` (`uid 1001:1001`).
- Root filesystem write access is restricted; only `/uploads` and temporary caches are writable.

### 2.4 Environment File Permissions
Ensure production `.env` files are readable only by the deployment user:
```bash
chmod 600 /opt/aemade-selam/.env.production
chown deployer:deployer /opt/aemade-selam/.env.production
```

---

## 3. Incident Response & Breach Protocol

1. **Immediate Revocation**: If an administrator account is compromised, execute a password reset via Super Admin or directly revoke all refresh tokens in MySQL:
   ```sql
   UPDATE refresh_tokens SET revoked = 1 WHERE userId = '<COMPROMISED_USER_ID>';
   UPDATE users SET status = 'suspended' WHERE id = '<COMPROMISED_USER_ID>';
   ```
2. **Audit Extraction**: Extract the user's audit trail to assess touched entities:
   ```sql
   SELECT * FROM audit_logs WHERE userId = '<COMPROMISED_USER_ID>' ORDER BY createdAt DESC;
   ```
3. **Secret Rotation**: Rotate `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `SESSION_SECRET` in `.env.production` and restart services with `docker compose up -d`. This immediately logs out all users globally.
