# Production Deployment Guide

This guide details the step-by-step procedure for deploying the **Aemade Selam Sunday School Management System** into a high-availability production environment using **Docker Compose**, **Nginx / Caddy**, **MySQL 8.0**, and **Let's Encrypt TLS**.

---

## 1. System Requirements

### Recommended Server Specifications
- **Operating System**: Ubuntu Server 22.04 LTS or 24.04 LTS (x86_64 / amd64)
- **CPU**: 2 vCPU cores or higher
- **Memory**: 4 GB RAM minimum (8 GB recommended for heavy reporting)
- **Disk**: 50 GB NVMe SSD with persistent storage volume
- **Network**: Static public IPv4 address, ports `80` (HTTP) and `443` (HTTPS) open

### Required Software Packages
- Docker Engine `v25.0+`
- Docker Compose plugin `v2.24+`
- `git`, `curl`, `openssl`, `ufw`

---

## 2. Server Preparation & Firewall Configuration

### 2.1 Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw fail2ban jq
```

### 2.2 Configure UFW Firewall
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2.3 Install Docker Engine & Compose
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
docker --version && docker compose version
```

---

## 3. Deployment Directory & Code Checkout

Clone the repository to `/opt/aemade-selam`:

```bash
sudo mkdir -p /opt/aemade-selam
sudo chown -R $USER:$USER /opt/aemade-selam
git clone https://github.com/organization/felege-selam.git /opt/aemade-selam
cd /opt/aemade-selam
```

---

## 4. Production Environment Configuration

Create the production environment file from the provided template:

```bash
cp .env.production.example .env.production
chmod 600 .env.production
nano .env.production
```

### Critical Environment Variables to Set:

```ini
# Production Domain
DOMAIN_NAME=aemade.org

# Database Credentials
MYSQL_ROOT_PASSWORD=SUPER_STRONG_MYSQL_ROOT_PASSWORD_32CHARS!
MYSQL_DATABASE=aemade_selam
MYSQL_USER=aemade_user
MYSQL_PASSWORD=SUPER_STRONG_USER_PASSWORD_32CHARS!

# NestJS API Security Secrets (Minimum 32 random characters)
JWT_SECRET=GENERATED_RANDOM_SECRET_FOR_ACCESS_TOKEN_XYZ123
JWT_REFRESH_SECRET=GENERATED_RANDOM_SECRET_FOR_REFRESH_TOKEN_ABC789
SESSION_SECRET=GENERATED_RANDOM_SESSION_SECRET_987654321

# Super Admin Bootstrap Account
FIRST_RUN_ADMIN_EMAIL=admin@aemade.org
FIRST_RUN_ADMIN_PASSWORD=CHANGE_ME_IMMEDIATELY_UPON_LOGIN_2026!
FIRST_RUN_ADMIN_PHONE=+251911223344

# Storage & Next.js Public URLs
NEXT_PUBLIC_API_URL=https://aemade.org/api/v1
NEXT_PUBLIC_APP_URL=https://aemade.org
NEXTAUTH_SECRET=GENERATED_NEXTAUTH_SECRET_HEX64
```

> [!TIP]
> Generate secure secrets using OpenSSL:
> ```bash
> openssl rand -base64 36
> ```

---

## 5. SSL / TLS Setup Options

### Option A: Automatic Nginx + Certbot (Default Compose Setup)
1. Initialize dummy certificates for first startup:
   ```bash
   mkdir -p ./certbot/conf/live/aemade.org
   mkdir -p ./certbot/www
   ```
2. Request Let's Encrypt TLS Certificate:
   ```bash
   docker compose -f docker-compose.prod.yml run --rm certbot certonly \
     --webroot -w /var/www/certbot \
     --email admin@aemade.org \
     -d aemade.org -d www.aemade.org \
     --agree-tos --no-eff-email
   ```

### Option B: Zero-Config Caddy Reverse Proxy
If preferred over Nginx, you can run Caddy which manages Let's Encrypt certificates automatically with zero configuration:
```bash
# Using the preconfigured Caddyfile in repository root
caddy run --config Caddyfile
```

---

## 6. Launching Production Services

### 6.1 Build and Start Containers
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 6.2 Monitor Startup & Migrations
The API container automatically runs `prisma migrate deploy` and the `first-run.ts` administrator initialization script on startup:
```bash
docker compose -f docker-compose.prod.yml logs -f api
```
Expected output:
```text
> Applying database migrations...
Prisma Migrate applied 12 migrations successfully.
> Running first-run database bootstrap...
[FirstRun] Super Admin role and user verified: admin@aemade.org
> Starting NestJS Production Server on port 3000...
```

### 6.3 Verify Service Health
Check running container states:
```bash
docker compose -f docker-compose.prod.yml ps
```
All services (`mysql`, `api`, `web`, `nginx`) should report `Up (healthy)`.

---

## 7. Automated Acceptance & Smoke Testing

Run the automated live verification script from the host or within CI:

```bash
node scripts/acceptance-check.js
```

This checklist verifies:
- API `/api/v1/health` and database connection probe
- Server-Side Rendered (SSR) home page and Sinksar feeds
- Status page latency and monitoring telemetry
- RBAC authentication and JWT token exchange
- Member record query execution

---

## 8. Log Rotation & Monitoring

- **Container Logs**: Preconfigured with `json-file` driver, `max-size: 20m`, `max-file: 5`.
- **API Sentry Tracking**: Enable by populating `SENTRY_DSN` in `.env.production`.
- **Uptime Monitoring**: Point external uptime bots (e.g. UptimeRobot, Better Uptime) to `https://aemade.org/api/v1/health`.

---

## 9. Zero-Downtime Application Updates

To deploy new code updates seamlessly:

```bash
cd /opt/aemade-selam
git pull origin main

# Rebuild images without interrupting active connections
docker compose --env-file .env.production -f docker-compose.prod.yml build api web

# Rolling restart
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-deps api
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-deps web

# Prune dangling build artifacts
docker image prune -f
```
