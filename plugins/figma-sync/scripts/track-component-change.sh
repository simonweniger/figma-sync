#!/bin/bash
# Track component file changes for figma-sync.
# Runs as a PostToolUse hook after Edit/Write operations.
# Records modified component files so the user can be reminded to push changes.

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty' 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Check if figma-sync is initialized in this project
CONFIG_FILE=".figma-sync.json"
if [ ! -f "$CONFIG_FILE" ]; then
  exit 0
fi

# Read the components path from config
COMPONENTS_DIR=$(jq -r '.paths.components // empty' "$CONFIG_FILE" 2>/dev/null)
TOKENS_DIR=$(jq -r '.paths.tokens // empty' "$CONFIG_FILE" 2>/dev/null)

# Check if the changed file is in a tracked directory
IS_COMPONENT=false
IS_TOKEN=false

if [ -n "$COMPONENTS_DIR" ] && echo "$FILE_PATH" | grep -q "$COMPONENTS_DIR"; then
  IS_COMPONENT=true
fi

if [ -n "$TOKENS_DIR" ] && echo "$FILE_PATH" | grep -q "$TOKENS_DIR"; then
  IS_TOKEN=true
fi

# Only track relevant files
if [ "$IS_COMPONENT" = false ] && [ "$IS_TOKEN" = false ]; then
  exit 0
fi

# Ensure .figma-sync directory exists
mkdir -p .figma-sync

# Record the change
CHANGES_FILE=".figma-sync/pending-changes.json"

if [ ! -f "$CHANGES_FILE" ]; then
  echo '{"changes":[]}' > "$CHANGES_FILE"
fi

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TYPE="component"
if [ "$IS_TOKEN" = true ]; then
  TYPE="token"
fi

# Append change record
UPDATED=$(jq --arg path "$FILE_PATH" --arg type "$TYPE" --arg ts "$TIMESTAMP" \
  '.changes += [{"file": $path, "type": $type, "timestamp": $ts}] | .changes |= unique_by(.file)' \
  "$CHANGES_FILE" 2>/dev/null)

if [ $? -eq 0 ]; then
  echo "$UPDATED" > "$CHANGES_FILE"
fi

exit 0
