# Aemade Selam Sunday School Management System
## Quick Setup Guide (5 Minutes to Production)

> **አዕማደ ሰላም ሰንበት ትምህርት ቤት አስተዳደር ሥርዓት**  
> Modern, secure, bilingual (Amharic & English) Sunday School Management System built with **NestJS**, **Next.js 14**, **Prisma**, **MySQL/MariaDB**, and **Docker**.

---

## Prerequisites
- **Docker** & **Docker Compose** (v2+)
- Or for local development without Docker:
  - **Node.js** v20+
  - **MySQL** 8.0+ or **MariaDB** 10.4+
  - **npm** v10+

---

## 1. Quick Launch with Docker Compose (Recommended)

### Step 1: Clone and Configure
```bash
git clone https://github.com/aemade-selam/sunday-school-system.git
cd sunday-school-system

# Copy the production environment template
cp .env.production.example .env
```

### Step 2: Configure Environment
Open `.env` and set your production domain and secrets:
```ini
DOMAIN_NAME=aemade.org
MYSQL_ROOT_PASSWORD=SuperStrongRootPassword!2026
MYSQL_PASSWORD=SuperStrongUserPassword!2026
JWT_SECRET=generate_strong_64_character_random_secret_key_here
SUPER_ADMIN_EMAIL=admin@aemade.org
SUPER_ADMIN_PASSWORD=Admin@123456!
```

### Step 3: Start Services
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Docker Compose will automatically:
1. Boot MySQL with `utf8mb4` character set and persistent volumes.
2. Wait for MySQL health probe, run database migrations (`prisma migrate deploy`), and initialize roles and the Super Admin account.
3. Build and launch the multi-stage Next.js standalone application.
4. Launch Nginx reverse proxy routing traffic with automated Let's Encrypt TLS certificates.

### Step 4: Verify Live System
Open your browser or run the automated acceptance script:
```bash
node scripts/acceptance-check.js
```

- **Public Website & Portal**: `https://aemade.org` (or `http://localhost:3001` in local mode)
- **REST API Endpoint**: `https://aemade.org/api/v1`
- **Interactive Swagger Docs**: `https://aemade.org/api/docs`
- **System Telemetry & Status**: `https://aemade.org/am/status`
- **Default Super Admin**: `admin@aemade.org` / `Admin@123456!`

---

## 2. Local Development Setup (Without Docker)

### Step 1: Database Setup
Start your local MySQL / MariaDB server (e.g. XAMPP or native service on port 3306) and create the database:
```sql
CREATE DATABASE aemade_selam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Step 2: Start API Server
```bash
cd api
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed:demo # Seeds demo members, courses, mezmur, and content

# Run API in watch mode
npm run start:dev
# API will be available at http://localhost:3000/api/v1
# Swagger docs at http://localhost:3000/api/docs
```

### Step 3: Start Frontend Web Server
In a new terminal:
```bash
cd web
npm install
npm run dev
# Frontend will be live at http://localhost:3001
```

---

## 3. Core Architectural Modules
1. **Members Management**: Registration, approval workflow, QR ID cards, official PDF letters, Excel import/export.
2. **Academic & Courses**: Course catalogs, drag-and-drop lessons, attendance tracking, camera QR scanning, gradebooks, certificates with public verification at `/verify/[code]`.
3. **Spiritual Content**: Daily Sinksar feeds, scheduled posts, rich text editor (TipTap), Mezmur audio/video library with full-text search.
4. **Form Builder & Responses**: Dynamic form designer, submission review, PDF/Excel export.
5. **Contributions & Finance**: Payment recording, receipt generation (PDF), monthly trends.
6. **System Administration**: Role management, database backup/restore, audit logs, and settings.
