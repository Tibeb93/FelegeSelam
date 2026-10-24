param(
  [Parameter(Mandatory=$true)]
  [string]$BackupFile,
  [string]$HostName = "127.0.0.1",
  [int]$Port = 3306,
  [string]$User = "aemade_user",
  [string]$Password = "aemade_password",
  [string]$Database = "aemade_selam"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -Path $BackupFile)) {
  Write-Error "Backup file '$BackupFile' was not found!"
  exit 1
}

Write-Host "=== Aemade Selam Database Restore Procedure ===" -ForegroundColor Cyan
Write-Host "File: $BackupFile" -ForegroundColor Yellow

$ShaFile = "$BackupFile.sha256"
if (Test-Path -Path $ShaFile) {
  Write-Host "Verifying SHA-256 hash..." -ForegroundColor Gray
  $RawSha = (Get-Content -Path $ShaFile -Raw).Trim()
  $ExpectedHash = $RawSha.Substring(0, 64).ToUpper()
  $ActualHash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash.ToUpper()

  if ($ExpectedHash -ne $ActualHash) {
    Write-Error "Checksum mismatch! Expected: $ExpectedHash, Got: $ActualHash"
    exit 1
  }
  Write-Host "[OK] SHA-256 checksum verified ($ActualHash)." -ForegroundColor Green
}

$TempSql = [System.IO.Path]::ChangeExtension([System.IO.Path]::GetTempFileName(), ".sql")

if ($BackupFile -like "*.gz") {
  Write-Host "Decompressing GZip stream..." -ForegroundColor Gray
  $InputStream = [System.IO.File]::OpenRead($BackupFile)
  $GzipStream = New-Object System.IO.Compression.GZipStream($InputStream, [System.IO.Compression.CompressionMode]::Decompress)
  $OutputStream = [System.IO.File]::Create($TempSql)

  $GzipStream.CopyTo($OutputStream)
  $OutputStream.Close()
  $GzipStream.Close()
  $InputStream.Close()
} else {
  Copy-Item -Path $BackupFile -Destination $TempSql -Force
}

$MysqlPath = "C:\xampp\mysql\bin\mysql.exe"
if (-not (Test-Path -Path $MysqlPath)) {
  $MysqlPath = "mysql"
}

Write-Host "Restoring database '$Database'..." -ForegroundColor Cyan

$RestoreArgs = @(
  "--host=$HostName",
  "--port=$Port",
  "--user=$User",
  "--default-character-set=utf8mb4",
  $Database
)

if ($Password -ne "") {
  $RestoreArgs = @("--password=$Password") + $RestoreArgs
}

Get-Content -Path $TempSql | & $MysqlPath @RestoreArgs

Remove-Item -Path $TempSql -Force

Write-Host "[OK] Database successfully restored." -ForegroundColor Green
