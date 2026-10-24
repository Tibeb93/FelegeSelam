# System Architecture Documentation

> **System**: Aemade Selam Sunday School Management System  
> **Repository**: [FelegeSelam](file:///c:/Users/user/Desktop/PersonalProjects/FelegeSelam)  
> **Date**: October 2026

---

## 1. High-Level Architecture Overview

The Aemade Selam Sunday School Management System is designed as a modular, decoupled full-stack platform consisting of a high-performance **NestJS REST API**, a server-rendered **Next.js 14 Web Application**, a persistent **MySQL 8.0** relational database, and an **Nginx Reverse Proxy** with automated SSL termination.

```mermaid
graph TD
    User["Public Visitors & Members"] --> |HTTPS / Port 443| Nginx["Nginx Reverse Proxy & TLS"]
    Admin["Admins & Teachers"] --> |HTTPS / Port 443| Nginx

    subgraph "DMZ & Gateway"
        Nginx --> |/_next, /, /portal| Web["Next.js 14 Frontend<br/>(Port 3001)"]
        Nginx --> |/api/v1/*| API["NestJS 10 REST API<br/>(Port 3000)"]
        Nginx --> |/uploads/*| API
    end

    subgraph "Core Backend Services"
        API --> |Prisma ORM| DB[("MySQL 8.0 / MariaDB<br/>utf8mb4_unicode_ci")]
        API --> |Sharp WebP Engine| Storage["Local / Cloud Storage<br/>(Uploads & Backups)"]
        API --> |Argon2id & Otplib| Auth["Auth Engine<br/>(JWT, 2FA, RBAC)"]
        API --> |cron & bull| Scheduler["Scheduled Jobs<br/>(Sinksar, Post Expiry)"]
    end

    subgraph "External Integrations"
        API -.-> |SMTP| MailGateway["Email Server (Mailgun/SES)"]
        API -.-> |Telemetry| Sentry["Sentry Error Tracking"]
        API -.-> |Offsite Sync| S3["AWS S3 / Cloudflare R2"]
    end
```

---

## 2. Technology Stack & Decision Rationale

### 2.1 Backend (`/api`)
- **Framework**: [NestJS 10](https://nestjs.com) — Enterprise-grade TypeScript framework enforcing Clean Architecture, dependency injection, and modular structure.
- **ORM**: [Prisma 5](https://www.prisma.io) — Type-safe relational schema modeling, automated migrations (`prisma migrate deploy`), and parameterized query execution preventing SQL injection.
- **Database**: **MySQL 8.0 / MariaDB 10.4** — Native full-text indexing, utf8mb4 multi-byte Amharic Unicode collation (`utf8mb4_unicode_ci`).
- **Security & Crypto**:
  - `argon2` (Argon2id variant) for salted password hashing.
  - `passport-jwt` with strict single-use refresh token rotation (OWASP RFC 6819).
  - `otplib` for Time-based One-Time Password (TOTP) two-factor authentication.
  - `helmet` for HTTP security headers and Content Security Policy.
- **Media & Document Generation**:
  - `sharp` for high-speed WebP image conversion and thumbnailing.
  - `exceljs` & `xlsx` for bidirectional spreadsheet imports/exports.
  - `puppeteer` for headless rendering of PDF certificates and official letters.

### 2.2 Frontend (`/web`)
- **Framework**: [Next.js 14](https://nextjs.org) (App Router) — Hybrid Server-Side Rendering (SSR) and Client Components with React 18.
- **Internationalization**: `next-intl` providing seamless locale routing (`/am/...` and `/en/...`) with zero runtime layout shifts.
- **Styling & UI**:
  - `Tailwind CSS` with CSS variables for dynamic Dark Mode support.
  - `Lucide React` iconography.
  - `Recharts` for interactive SVG/Canvas administrative analytics.
  - `TipTap` rich text editor for spiritual articles and scheduled notices.
- **Form Handling & Validation**: `react-hook-form` integrated with `zod` schema resolvers.
- **Data Fetching**: `@tanstack/react-query` for client caching, optimistic updates, and background refetching.

---

## 3. Layered Request Lifecycle

Every HTTP request to the NestJS API passes through standard security and validation layers before hitting service logic:

```mermaid
sequenceDiagram
    participant Client as Client (Browser / Mobile)
    participant Nginx as Nginx Proxy
    participant Throttler as ThrottlerGuard
    participant JwtGuard as JwtAuth / RolesGuard
    participant Interceptor as AuditLogInterceptor
    participant Pipe as ValidationPipe (Zod / class-validator)
    participant Controller as Controller
    participant Service as Service & Prisma ORM
    participant DB as MySQL Database

    Client->>Nginx: HTTP Request with Bearer Token
    Nginx->>Throttler: Check rate limit
    Throttler->>JwtGuard: Verify JWT signature & active session
    JwtGuard->>Interceptor: Audit start & capture request context
    Interceptor->>Pipe: Validate DTO types & sanitize strings
    Pipe->>Controller: Route to handler method
    Controller->>Service: Call business logic
    Service->>DB: Parameterized Prisma Query
    DB-->>Service: Relational Results
    Service-->>Controller: Domain Response Entity
    Controller-->>Interceptor: Redact sensitive fields (password, token, hash)
    Interceptor->>DB: Write redacted audit log record
    Interceptor-->>Client: Final JSON Response
```

---

## 4. Storage Architecture

```
/app
├── /uploads
│   ├── /photos         # Profile pictures (resized WebP, max 2MB)
│   ├── /lessons        # Lesson materials (PDFs, Audio MP3, Video MP4)
│   ├── /branding       # School logo and public seal
│   └── /posts          # Spiritual article banner attachments
└── /backups            # Gzipped mysqldump files (30-day retention)
```
- Uploaded assets are served statically by Nginx with aggressive caching headers (`Cache-Control: public, max-age=2592000`).
- Database backups are isolated on persistent Docker volumes and periodically synced to cloud storage (S3/R2).
