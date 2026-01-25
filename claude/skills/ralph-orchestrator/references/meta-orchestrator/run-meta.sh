#!/bin/bash
# Evolutionary Meta-Orchestrator Entry Point
#
# Usage:
#   ./run-meta.sh                           # Use default config
#   ./run-meta.sh path/to/config.md         # Use custom config

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="${1:-$SCRIPT_DIR/examples/prd-implementation.md}"

# Ensure .meta directory exists
mkdir -p .meta/results .meta/approaches

# Copy config if not already in .meta
if [[ "$CONFIG" != ".meta/config.md" ]]; then
    cp "$CONFIG" .meta/config.md
    echo "Copied config to .meta/config.md"
fi

# Initialize iteration counter if not exists
if [[ ! -f .meta/iteration.txt ]]; then
    echo "0" > .meta/iteration.txt
fi

echo "=== Evolutionary Meta-Orchestrator ==="
echo "Config: .meta/config.md"
echo "Starting iteration: $(cat .meta/iteration.txt)"
echo ""

# Run ralph with the meta-orchestrator config
ralph run --config "$SCRIPT_DIR/ralph.yml"
