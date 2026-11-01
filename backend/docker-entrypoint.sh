#!/bin/sh
set -e
mkdir -p "${UPLOAD_DIR:-/data/uploads}"
chown -R appuser:appuser "${UPLOAD_DIR:-/data/uploads}"
exec su-exec appuser /app/api
