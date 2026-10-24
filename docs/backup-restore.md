# Backup, Retention and Disaster Recovery Guide

This manual outlines the data protection architecture, automated scheduling, cloud synchronization, and verified disaster recovery procedures for the **Aemade Selam Sunday School System**.

---

## 1. Backup Strategy Overview

Aemade Selam implements the **3-2-1 backup rule**:
- **3 Copies of Data**: Primary database, local compressed archive, and remote cloud replication.
- **2 Different Media**: SSD server storage and S3-compatible cloud object store.
- **1 Off-Site Location**: Remote geographical region (AWS S3, Cloudflare R2, or Wasabi).

### Core Characteristics:
- **Consistent Dumps**: Utilizing `mysqldump` with `--single-transaction`, `--quick`, and `--hex-blob` ensuring zero table locking during church service hours.
- **Compression**: High-ratio gzip (`.sql.gz`) shrinking database dumps by ~85%.
- **Cryptographic Verification**: SHA-256 hash (`.sha256`) generated automatically with every dump to detect bitrot or corruption.
- **30-Day Retention**: Automatic purge of local and remote snapshots older than 30 days.

---

## 2. Automated Scheduled Backups

### 2.1 Linux Host / Cron Configuration
Add a nightly cron job running at 02:00 AM server local time:

```bash
# Open crontab
crontab -e

# Add nightly execution
0 2 * * * /opt/aemade-selam/scripts/backup.sh >> /var/log/aemade-backup.log 2>&1
```

### 2.2 Inside Docker Production Compose
Alternatively, if running via Docker, trigger the backup inside the compose network:

```bash
0 2 * * * docker compose -f /opt/aemade-selam/docker-compose.prod.yml exec -T mysql /opt/scripts/backup.sh
```

---

## 3. Remote Cloud Synchronization (S3 / R2)

When `S3_BUCKET` is configured in `.env.production`, the backup scripts automatically stream compressed snapshots to cloud object storage.

### Environment Configuration:
```ini
BACKUP_DIR=/opt/aemade-selam/backups
BACKUP_RETENTION_DAYS=30
S3_BUCKET=s3://aemade-selam-backups
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY
AWS_DEFAULT_REGION=af-south-1
```

### Manual Cloud Sync Command:
```bash
aws s3 sync /opt/aemade-selam/backups s3://aemade-selam-backups/ --delete
```

---

## 4. Manual On-Demand Backup Execution

### From the Admin UI:
1. Navigate to **Admin Dashboard -> Backups** (`/[locale]/admin/backups`).
2. Click **Create Backup Now**.
3. The server generates a live `.sql.gz` dump, registers its checksum, and makes it available for immediate direct download.

### From Command Line:
**Linux / macOS**:
```bash
bash scripts/backup.sh
```

**Windows PowerShell**:
```powershell
.\scripts\backup.ps1 -User "aemade_user" -Password "aemade_password" -Database "aemade_selam"
```

---

## 5. Step-by-Step Disaster Recovery Procedure

In the event of hardware failure, catastrophic server loss, or ransomware compromise, follow this procedure to restore the system on a clean server.

### Phase 1: Clean Machine Provisioning
1. Install Docker Engine and clone the repository:
   ```bash
   git clone https://github.com/organization/felege-selam.git /opt/aemade-selam
   cd /opt/aemade-selam
   cp .env.production.example .env.production
   # Configure production passwords and secrets
   ```

2. Start the database container:
   ```bash
   docker compose -f docker-compose.prod.yml up -d mysql
   ```

### Phase 2: Retrieve Backup Archive
Download the latest verified backup and its SHA-256 hash from S3:
```bash
mkdir -p /opt/aemade-selam/backups
aws s3 cp s3://aemade-selam-backups/latest.sql.gz /opt/aemade-selam/backups/
aws s3 cp s3://aemade-selam-backups/latest.sql.gz.sha256 /opt/aemade-selam/backups/
```

### Phase 3: Execute Restore Script
Run the automated restore script which validates SHA-256 hash integrity before executing the database import:

**Linux / Docker**:
```bash
bash scripts/restore.sh /opt/aemade-selam/backups/latest.sql.gz
```

**Windows PowerShell**:
```powershell
.\scripts\restore.ps1 -BackupFile "api\backups\backup-aemade-selam-YYYYMMDD_HHMMSS.sql.gz" -User "aemade_user" -Password "aemade_password" -Database "aemade_selam"
```

### Phase 4: Run Migrations and Start All Services
Apply any outstanding database migrations (if restoring an older snapshot into a newer application version):
```bash
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
docker compose -f docker-compose.prod.yml up -d
```

### Phase 5: Verification & Acceptance
Run the automated acceptance suite to confirm full functional restoration:
```bash
node scripts/acceptance-check.js
```
Expected output:
```text
>>> ALL ACCEPTANCE TESTS PASSED! The live deployment is verified healthy and operational. <<<
```

---

## 6. Disaster Recovery Testing Schedule

Disaster recovery drills must be performed **quarterly**:
1. Download a snapshot from off-site S3 storage.
2. Spin up an isolated staging container.
3. Execute `restore.sh` / `restore.ps1`.
4. Run `node scripts/acceptance-check.js` against the staging instance.
5. Record drill outcome, RTO (Recovery Time Objective < 15 mins), and RPO (Recovery Point Objective < 24 hours).
