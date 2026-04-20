#!/bin/bash

# Exit immediately if a command fails
set -e

LOG_FILE="deploy.log"

# Color codes
GREEN="\033[0;32m"
BLUE="\033[0;34m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

# Logging functions
log_info() {
  echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $1" >> "$LOG_FILE"
}

log_success() {
  echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [SUCCESS] $1" >> "$LOG_FILE"
}

log_error() {
  echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $1" >> "$LOG_FILE"
}

log_warn() {
  echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1${NC}"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] $1" >> "$LOG_FILE"
}

# Trap errors to log them
trap 'log_error "Deployment failed at line $LINENO"; exit 1' ERR

log_info "Starting deployment..."

# Check if dist folder exists before rsync
DIST_PATH="/var/www/DestiniqueReDevelopment/dist/destinique/browser/"
if [ ! -d "$DIST_PATH" ]; then
  log_error "Build output directory not found: $DIST_PATH"
  exit 1
fi

# Run build
log_info "Running build:ssr..."
npm run build:ssr 2>&1 | tee -a "$LOG_FILE"
log_success "build:ssr completed"

# Run prerender
log_info "Running prerender..."
npm run prerender 2>&1 | tee -a "$LOG_FILE"
log_success "prerender completed"

# Sync files
log_info "Syncing files with rsync..."
sudo rsync -av --delete "$DIST_PATH" /var/www/dev.destinique.com/public_html/ 2>&1 | tee -a "$LOG_FILE"
log_success "rsync completed"

# Final success message
log_success "Site deployed successfully 🚀"
