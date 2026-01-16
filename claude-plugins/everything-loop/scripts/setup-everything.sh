#!/bin/bash

# Setup script for Everything Loop
# Initializes state directory and makes hooks executable

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Setting up Everything Loop plugin..."

# Create state directory
mkdir -p "$PLUGIN_ROOT/state"
echo "Created state directory: $PLUGIN_ROOT/state"

# Make hooks executable
chmod +x "$PLUGIN_ROOT/hooks/session-start-hook.sh"
chmod +x "$PLUGIN_ROOT/hooks/stop-hook.sh"
echo "Made hooks executable"

# Verify structure
echo ""
echo "Plugin structure:"
find "$PLUGIN_ROOT" -type f -name "*.sh" -o -name "*.json" -o -name "*.md" | sort | while read -r file; do
  echo "  ${file#$PLUGIN_ROOT/}"
done

echo ""
echo "Everything Loop plugin setup complete!"
echo ""
echo "Usage:"
echo "  /everything <description> [--fixed-scope|--continuous] [--max-iterations N]"
echo "  /everything-status"
echo "  /everything-cancel"
