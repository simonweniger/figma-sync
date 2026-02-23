#!/bin/bash
# Check for pending figma-sync changes when Claude stops responding.
# Runs as a Stop hook to remind the user about unsynced changes.

set -euo pipefail

# Check if figma-sync is initialized
if [ ! -f ".figma-sync.json" ]; then
  exit 0
fi

CHANGES_FILE=".figma-sync/pending-changes.json"

if [ ! -f "$CHANGES_FILE" ]; then
  exit 0
fi

# Count pending changes
CHANGE_COUNT=$(jq '.changes | length' "$CHANGES_FILE" 2>/dev/null || echo "0")

if [ "$CHANGE_COUNT" -eq 0 ]; then
  exit 0
fi

# List the changed files
COMPONENT_COUNT=$(jq '[.changes[] | select(.type == "component")] | length' "$CHANGES_FILE" 2>/dev/null || echo "0")
TOKEN_COUNT=$(jq '[.changes[] | select(.type == "token")] | length' "$CHANGES_FILE" 2>/dev/null || echo "0")

MSG="figma-sync: $CHANGE_COUNT file(s) changed since last sync"
if [ "$COMPONENT_COUNT" -gt 0 ]; then
  MSG="$MSG ($COMPONENT_COUNT component(s)"
  if [ "$TOKEN_COUNT" -gt 0 ]; then
    MSG="$MSG, $TOKEN_COUNT token file(s)"
  fi
  MSG="$MSG)"
fi
MSG="$MSG. Run /figma-sync:push to sync or /figma-sync:status to review."

echo "$MSG" >&2
exit 0
