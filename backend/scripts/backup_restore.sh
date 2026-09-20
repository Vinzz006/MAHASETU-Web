#!/usr/bin/env bash
# ==============================================================================
# MahaSetu Platform — Automated Database Backup & Disaster Recovery Script
# Supports: SQLite3 & PostgreSQL with SHA-256 Checksum Verification
# ==============================================================================
set -eo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_URL="${DATABASE_URL:-sqlite:///./mahasetu.db}"

usage() {
    echo "Usage: $0 {backup|restore <file>|verify <file>}"
    echo "  backup             Create a timestamped backup of the active database"
    echo "  restore <file>     Restore database from a verified backup archive"
    echo "  verify <file>      Verify SHA-256 checksum of an existing backup"
    exit 1
}

do_backup() {
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Starting MahaSetu database backup..."
    if [[ "$DATABASE_URL" == sqlite* ]]; then
        DB_PATH=$(echo "$DATABASE_URL" | sed 's/sqlite:\/\/\///')
        if [ ! -f "$DB_PATH" ]; then
            echo "Error: SQLite database file '$DB_PATH' not found."
            exit 1
        fi
        TARGET_FILE="${BACKUP_DIR}/mahasetu_sqlite_${TIMESTAMP}.db"
        sqlite3 "$DB_PATH" ".backup '${TARGET_FILE}'" || cp "$DB_PATH" "$TARGET_FILE"
        sha256sum "$TARGET_FILE" > "${TARGET_FILE}.sha256"
        echo "[SUCCESS] SQLite backup created: ${TARGET_FILE}"
        echo "[SUCCESS] Checksum written: ${TARGET_FILE}.sha256"
    elif [[ "$DATABASE_URL" == postgresql* ]]; then
        TARGET_FILE="${BACKUP_DIR}/mahasetu_pg_${TIMESTAMP}.sql.gz"
        pg_dump "$DATABASE_URL" | gzip > "$TARGET_FILE"
        sha256sum "$TARGET_FILE" > "${TARGET_FILE}.sha256"
        echo "[SUCCESS] PostgreSQL backup created: ${TARGET_FILE}"
        echo "[SUCCESS] Checksum written: ${TARGET_FILE}.sha256"
    else
        echo "Error: Unsupported database protocol in DATABASE_URL."
        exit 1
    fi
}

do_verify() {
    local FILE="$1"
    if [ ! -f "$FILE" ]; then
        echo "Error: Backup file '$FILE' not found."
        exit 1
    fi
    if [ ! -f "${FILE}.sha256" ]; then
        echo "Error: Checksum file '${FILE}.sha256' not found."
        exit 1
    fi
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Verifying SHA-256 checksum for $FILE..."
    sha256sum -c "${FILE}.sha256"
    echo "[SUCCESS] Backup file integrity verified."
}

do_restore() {
    local FILE="$1"
    do_verify "$FILE"
    echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] Restoring database from $FILE..."
    if [[ "$DATABASE_URL" == sqlite* ]]; then
        DB_PATH=$(echo "$DATABASE_URL" | sed 's/sqlite:\/\/\///')
        # Preserve original as rollback safety
        [ -f "$DB_PATH" ] && cp "$DB_PATH" "${DB_PATH}.pre_restore_bak"
        cp "$FILE" "$DB_PATH"
        echo "[SUCCESS] SQLite database restored successfully to $DB_PATH."
    elif [[ "$DATABASE_URL" == postgresql* ]]; then
        gunzip -c "$FILE" | psql "$DATABASE_URL"
        echo "[SUCCESS] PostgreSQL database restored successfully."
    fi
}

case "$1" in
    backup)
        do_backup
        ;;
    restore)
        [ -z "$2" ] && usage
        do_restore "$2"
        ;;
    verify)
        [ -z "$2" ] && usage
        do_verify "$2"
        ;;
    *)
        usage
        ;;
esac
