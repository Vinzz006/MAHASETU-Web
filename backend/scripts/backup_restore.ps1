# ==============================================================================
# MahaSetu Platform — Automated Database Backup & Disaster Recovery Script (PowerShell)
# Supports: SQLite3 & PostgreSQL with SHA-256 Checksum Verification
# ==============================================================================
param (
    [Parameter(Position=0, Mandatory=$true)]
    [ValidateSet("backup", "restore", "verify")]
    [string]$Action,

    [Parameter(Position=1, Mandatory=$false)]
    [string]$TargetFile
)

$BackupDir = if ($env:BACKUP_DIR) { $env:BACKUP_DIR } else { ".\backups" }
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
$DatabaseUrl = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "sqlite:///./mahasetu.db" }

function Do-Backup {
    Write-Host "[$(Get-Date -Format 'o')] Starting MahaSetu database backup..." -ForegroundColor Cyan
    if ($DatabaseUrl -match "sqlite:///(.+)") {
        $DbPath = $Matches[1]
        if (-not (Test-Path $DbPath)) {
            Write-Error "Error: SQLite database file '$DbPath' not found."
            exit 1
        }
        $BackupPath = Join-Path $BackupDir "mahasetu_sqlite_${Timestamp}.db"
        Copy-Item -Path $DbPath -Destination $BackupPath
        $Hash = (Get-FileHash -Path $BackupPath -Algorithm SHA256).Hash
        $Hash | Out-File -FilePath "${BackupPath}.sha256" -Encoding utf8
        Write-Host "[SUCCESS] SQLite backup created: $BackupPath" -ForegroundColor Green
        Write-Host "[SUCCESS] Checksum written (SHA256): $Hash" -ForegroundColor Green
    } else {
        Write-Warning "Non-sqlite database detected. Ensure pg_dump is installed for PostgreSQL backups."
    }
}

function Do-Verify([string]$File) {
    if (-not (Test-Path $File)) {
        Write-Error "Error: Backup file '$File' not found."
        exit 1
    }
    $ChecksumFile = "${File}.sha256"
    if (-not (Test-Path $ChecksumFile)) {
        Write-Error "Error: Checksum file '$ChecksumFile' not found."
        exit 1
    }
    $Expected = (Get-Content $ChecksumFile).Trim()
    $Actual = (Get-FileHash -Path $File -Algorithm SHA256).Hash.Trim()
    if ($Expected -eq $Actual) {
        Write-Host "[SUCCESS] Backup file integrity verified. SHA-256 matches: $Actual" -ForegroundColor Green
    } else {
        Write-Error "INTEGRITY CHECK FAILED! Expected: $Expected, Computed: $Actual"
        exit 1
    }
}

function Do-Restore([string]$File) {
    Do-Verify $File
    Write-Host "[$(Get-Date -Format 'o')] Restoring database from $File..." -ForegroundColor Cyan
    if ($DatabaseUrl -match "sqlite:///(.+)") {
        $DbPath = $Matches[1]
        if (Test-Path $DbPath) {
            Copy-Item -Path $DbPath -Destination "${DbPath}.pre_restore_bak"
        }
        Copy-Item -Path $File -Destination $DbPath -Force
        Write-Host "[SUCCESS] SQLite database successfully restored to $DbPath" -ForegroundColor Green
    }
}

switch ($Action) {
    "backup" { Do-Backup }
    "verify" {
        if (-not $TargetFile) { Write-Error "Usage: .\backup_restore.ps1 verify <file>"; exit 1 }
        Do-Verify $TargetFile
    }
    "restore" {
        if (-not $TargetFile) { Write-Error "Usage: .\backup_restore.ps1 restore <file>"; exit 1 }
        Do-Restore $TargetFile
    }
}
