#!/usr/bin/env bash
# health_check.sh — Wait for docker-compose services to become healthy
# and verify the app responds correctly.
#
# Usage:
#   ./health_check.sh [options]
#
# Options:
#   --url URL         Health check URL (default: http://localhost:3000/health)
#   --port PORT       Port to check (alternative to --url)
#   --path PATH       URL path (default: /health)
#   --timeout SECS    Max seconds to wait (default: 120)
#   --service NAME    Specific compose service to check logs on failure
#   --compose-file F  Path to docker-compose file (default: docker-compose.yml)
#
# Examples:
#   ./health_check.sh
#   ./health_check.sh --port 8000 --path /api/health
#   ./health_check.sh --url http://localhost:3000 --timeout 60
#   ./health_check.sh --service app --timeout 90

set -euo pipefail

# ─── Defaults ─────────────────────────────────────────────────────────────────
URL=""
PORT=3000
PATH_CHECK="/health"
TIMEOUT=120
SERVICE=""
COMPOSE_FILE="docker-compose.yml"
POLL_INTERVAL=3

# ─── Arg parsing ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
    case "$1" in
        --url)       URL="$2";          shift 2 ;;
        --port)      PORT="$2";         shift 2 ;;
        --path)      PATH_CHECK="$2";   shift 2 ;;
        --timeout)   TIMEOUT="$2";      shift 2 ;;
        --service)   SERVICE="$2";      shift 2 ;;
        --compose-file) COMPOSE_FILE="$2"; shift 2 ;;
        *) echo "[ERROR] Unknown argument: $1"; exit 1 ;;
    esac
done

if [[ -z "$URL" ]]; then
    URL="http://localhost:${PORT}${PATH_CHECK}"
fi

# ─── Color helpers ────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC}    $*"; }
err()  { echo -e "${RED}[FAIL]${NC}  $*"; }
info() { echo -e "${YELLOW}[INFO]${NC}  $*"; }

# ─── Step 1: Validate compose config ─────────────────────────────────────────
info "Validating compose config..."
if ! docker compose -f "$COMPOSE_FILE" config --quiet 2>&1; then
    err "docker compose config failed. Fix YAML errors before continuing."
    exit 1
fi
ok "Compose config is valid"

# ─── Step 2: Check container status ──────────────────────────────────────────
info "Checking container status..."
docker compose -f "$COMPOSE_FILE" ps

# Detect any exited containers
EXITED=$(docker compose -f "$COMPOSE_FILE" ps --format json 2>/dev/null | \
    python3 -c "
import sys, json
data = sys.stdin.read().strip()
if not data: sys.exit(0)
rows = json.loads(data) if data.startswith('[') else [json.loads(l) for l in data.splitlines() if l]
exited = [r.get('Name', r.get('Service','?')) for r in rows if r.get('State','') == 'exited']
print(' '.join(exited))
" 2>/dev/null || echo "")

if [[ -n "$EXITED" ]]; then
    err "Containers exited unexpectedly: $EXITED"
    info "Showing logs for exited containers:"
    for svc in $EXITED; do
        echo ""
        echo "── Logs: $svc ──────────────────────────────────────────────────"
        docker compose -f "$COMPOSE_FILE" logs --tail=30 "$svc" 2>/dev/null || true
    done
    exit 1
fi

# ─── Step 3: Wait for HTTP health check ──────────────────────────────────────
info "Waiting for $URL (timeout: ${TIMEOUT}s)..."

ELAPSED=0
HTTP_CODE=""

while [[ $ELAPSED -lt $TIMEOUT ]]; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$URL" 2>/dev/null || echo "000")

    if [[ "$HTTP_CODE" == "200" ]]; then
        ok "Health check passed: $URL → HTTP $HTTP_CODE"
        break
    fi

    if [[ "$HTTP_CODE" == "000" ]]; then
        printf "."
    else
        printf " [HTTP $HTTP_CODE]"
    fi

    sleep "$POLL_INTERVAL"
    ELAPSED=$((ELAPSED + POLL_INTERVAL))
done

echo ""  # newline after dots

if [[ "$HTTP_CODE" != "200" ]]; then
    err "Health check timed out after ${TIMEOUT}s. Last status: HTTP $HTTP_CODE"

    # Show logs for the relevant service
    if [[ -n "$SERVICE" ]]; then
        echo ""
        echo "── Logs: $SERVICE ──────────────────────────────────────────────────"
        docker compose -f "$COMPOSE_FILE" logs --tail=50 "$SERVICE"
    else
        echo ""
        info "Showing last 30 lines of all service logs:"
        docker compose -f "$COMPOSE_FILE" logs --tail=30
    fi

    exit 1
fi

# ─── Step 4: Inter-service connectivity check (optional) ──────────────────────
info "Checking inter-service connectivity..."

# Get list of running services
SERVICES=$(docker compose -f "$COMPOSE_FILE" ps --services 2>/dev/null || echo "")

# Check if db service exists and is reachable from app
if echo "$SERVICES" | grep -q "^db$" && echo "$SERVICES" | grep -q "^app$"; then
    DB_CHECK=$(docker compose -f "$COMPOSE_FILE" exec -T app \
        sh -c 'nc -z db 5432 2>/dev/null && echo "ok" || echo "fail"' 2>/dev/null || echo "skip")
    if [[ "$DB_CHECK" == "ok" ]]; then
        ok "app → db:5432 reachable"
    elif [[ "$DB_CHECK" == "fail" ]]; then
        err "app cannot reach db:5432 — check service names and network config"
    fi
fi

# Check if redis service exists and is reachable from app
if echo "$SERVICES" | grep -q "^redis$" && echo "$SERVICES" | grep -q "^app$"; then
    REDIS_CHECK=$(docker compose -f "$COMPOSE_FILE" exec -T app \
        sh -c 'nc -z redis 6379 2>/dev/null && echo "ok" || echo "fail"' 2>/dev/null || echo "skip")
    if [[ "$REDIS_CHECK" == "ok" ]]; then
        ok "app → redis:6379 reachable"
    elif [[ "$REDIS_CHECK" == "fail" ]]; then
        err "app cannot reach redis:6379 — check service names and network config"
    fi
fi

# ─── Step 5: Summary ─────────────────────────────────────────────────────────
echo ""
ok "All health checks passed!"
echo ""
echo "  App URL:  $URL"
echo "  Services: $(docker compose -f "$COMPOSE_FILE" ps --services | tr '\n' ' ')"
echo ""
echo "  docker compose logs -f         # Stream logs"
echo "  docker compose down -v         # Tear down + remove volumes"
