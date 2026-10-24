<#
.SYNOPSIS
  Automated Nightly Database Backup Script for Windows environments.
.DESCRIPTION
  Performs mysqldump, compresses with Gzip, computes SHA-256 hash, and enforces 30-day retention.
#>

param(
  [string]$BackupDir = "api\backups",
  [int]$RetentionDays = 30,
  [string]$HostName = "127.0.0.1",
  [int]$Port = 3306,
  [string]$User = "root",
  [string]$Password = "",
  [string]$Database = "aemade_selam_db"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupDir)) {
  New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$SqlFile = Join-Path $BackupDir "backup-aemade-selam-$Timestamp.sql"
$GzFile = "$SqlFile.gz"
$ShaFile = "$GzFile.sha256"

Write-Host "[$(Get-Date -Format s)] Starting database backup for '$Database'..." -ForegroundColor Cyan

# Find mysqldump executable
$MysqlDumpPath = "C:\xampp\mysql\bin\mysqldump.exe"
if (-not (Test-Path $MysqlDumpPath)) {
  $MysqlDumpPath = "mysqldump"
}

# 1. Execute dump
$DumpArgs = @(
  "--host=$HostName",
  "--port=$Port",
  "--user=$User",
  "--default-character-set=utf8mb4",
  "--single-transaction",
  "--quick",
  "--routines",
  "--triggers",
  $Database
)

if ($Password -ne "") {
  $DumpArgs = @("--password=$Password") + $DumpArgs
}

& $MysqlDumpPath @DumpArgs | Out-File -FilePath $SqlFile -Encoding utf8

# 2. Compress to .gz
$InputStream = [System.IO.File]::OpenRead($SqlFile)
$OutputStream = [System.IO.File]::Create($GzFile)
$GzipStream = New-Object System.IO.Compression.GZipStream($OutputStream, [System.IO.Compression.CompressionLevel]::Optimal)

$InputStream.CopyTo($GzipStream)
$GzipStream.Close()
$OutputStream.Close()
$InputStream.Close()

Remove-Item -Path $SqlFile -Force

# 3. Compute SHA-256
$Hash = (Get-FileHash -Path $GzFile -Algorithm SHA256).Hash
Set-Content -Path $ShaFile -Value "$Hash  $(Split-Path $GzFile -Leaf)"

$FileSizeMB = ((Get-Item $GzFile).Length / 1MB).ToString("0.00")
Write-Host "[$(Get-Date -Format s)] Backup successfully created: $GzFile ($FileSizeMB MB, SHA256: $Hash)" -ForegroundColor Green

# 4. Prune files older than RetentionDays (30 days)
$Threshold = (Get-Date).AddDays(-$RetentionDays)
$OldBackups = Get-ChildItem -Path $BackupDir -Filter "backup-aemade-selam-*" | Where-Object { $_.LastWriteTime -lt $Threshold }

foreach ($old in $OldBackups) {
  Write-Host "Pruning old backup: $($old.Name)" -ForegroundColor Yellow
  Remove-Item -Path $old.FullName -Force
}

Write-Host "[$(Get-Date -Format s)] Backup completed successfully." -ForegroundColor Green
