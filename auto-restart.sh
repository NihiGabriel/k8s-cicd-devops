#!/bin/bash

# ─────────────────────────────────────────────
#  auto-restart.sh
#  Watches your Node.js app and restarts it
#  automatically if it crashes or stops responding.
# ─────────────────────────────────────────────

APP_CMD="node server.js"          # Command to start your app
APP_PORT=3000                     # Port your app listens on
HEALTH_ENDPOINT="http://localhost:$APP_PORT/health"
CHECK_INTERVAL=10                 # Seconds between health checks
RESTART_DELAY=5                   # Seconds to wait before restarting
MAX_RESTARTS=10                   # Stop after this many restarts (0 = unlimited)
LOG_FILE="./logs/app.log"         # Log file path

# ── Colour codes for terminal output ──────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'   # No colour

# ── Helpers ────────────────────────────────────
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
  local level="$1"; shift
  local msg="$*"
  local color="$NC"
  case "$level" in
    INFO)    color="$GREEN"  ;;
    WARN)    color="$YELLOW" ;;
    ERROR)   color="$RED"    ;;
    RESTART) color="$BLUE"   ;;
  esac
  local line="[$(timestamp)] [$level] $msg"
  echo -e "${color}${line}${NC}"
  echo "$line" >> "$LOG_FILE"
}

# ── Setup ──────────────────────────────────────
mkdir -p "$(dirname "$LOG_FILE")"
RESTART_COUNT=0
APP_PID=""

# ── Cleanup on exit (Ctrl+C or kill) ──────────
cleanup() {
  log INFO "Watchdog shutting down..."
  if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
    log INFO "Stopping app (PID $APP_PID)..."
    kill "$APP_PID"
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

# ── Start the app ──────────────────────────────
start_app() {
  log RESTART "Starting: $APP_CMD"
  $APP_CMD >> "$LOG_FILE" 2>&1 &
  APP_PID=$!
  log INFO "App started with PID $APP_PID"
  sleep 2   # Give it a moment to bind the port
}

# ── Check if app is alive ──────────────────────
is_process_alive() {
  [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null
}

is_http_healthy() {
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_ENDPOINT" 2>/dev/null)
  [ "$code" = "200" ]
}

# ── Main watchdog loop ─────────────────────────
log INFO "Watchdog starting. Monitoring: $APP_CMD"
log INFO "Health check: $HEALTH_ENDPOINT every ${CHECK_INTERVAL}s"
log INFO "Logs: $LOG_FILE"
echo ""

start_app

while true; do
  sleep "$CHECK_INTERVAL"

  if ! is_process_alive; then
    log ERROR "Process $APP_PID has died (not running)."
    RESTART_COUNT=$((RESTART_COUNT + 1))

  elif ! is_http_healthy; then
    log WARN "Process alive but /health returned non-200. Killing and restarting..."
    kill "$APP_PID" 2>/dev/null
    RESTART_COUNT=$((RESTART_COUNT + 1))

  else
    log INFO "Healthy (PID $APP_PID, restart count: $RESTART_COUNT)"
    continue   # All good — skip the restart logic below
  fi

  # ── Restart logic ─────────────────────────────
  if [ "$MAX_RESTARTS" -gt 0 ] && [ "$RESTART_COUNT" -ge "$MAX_RESTARTS" ]; then
    log ERROR "Reached max restarts ($MAX_RESTARTS). Giving up. Check $LOG_FILE."
    exit 1
  fi

  log RESTART "Restart #$RESTART_COUNT — waiting ${RESTART_DELAY}s..."
  sleep "$RESTART_DELAY"
  start_app
done
