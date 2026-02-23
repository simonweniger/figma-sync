---
name: status
description: Show the current sync status between your codebase and Figma. Displays which components are in sync, modified, or missing on either side.
---

# Figma Sync Status

Show the current synchronization status between the codebase and Figma.

## Prerequisites

Read `.figma-sync.json` to get the configuration. If it doesn't exist, tell the user to run `/figma-sync:init` first.

## Steps

### 1. Read Sync State

Read `.figma-sync/state.json` to get:
- Last push timestamp
- Last pull timestamp
- Component mappings (Figma node ID ↔ code file path)
- Token sync state

### 2. Scan Code Components

Scan the configured component directory:
- List all component files
- Check file modification times against last sync
- Identify new components (not in mapping)
- Identify deleted components (in mapping but file removed)

### 3. Read Figma State (via MCP)

Use the Figma MCP to read the current file:
- List all components
- Compare against the stored mapping
- Identify new Figma components (not in mapping)
- Identify deleted Figma components

### 4. Display Status

Show a comprehensive status report:

```
Figma Sync Status
=================

Config: .figma-sync.json
Figma File: <file-name> (<file-key>)
Last Push: 2024-01-15 14:30:00
Last Pull: 2024-01-14 10:00:00

Components:
  IN SYNC     Button          src/components/Button.tsx ↔ Button (Figma)
  MODIFIED    Card            src/components/Card.tsx (code changed since last sync)
  CODE ONLY   Tooltip         src/components/Tooltip.tsx (not in Figma)
  FIGMA ONLY  Badge           Badge component exists in Figma but not in code
  CONFLICT    Modal           Both code and Figma changed since last sync

Tokens:
  IN SYNC     colors          12 tokens synced
  MODIFIED    typography      3 tokens changed in code
  FIGMA ONLY  shadows         5 new shadow tokens in Figma

Summary:
  5 components total | 1 in sync | 1 modified | 1 code-only | 1 figma-only | 1 conflict
  3 token categories | 1 in sync | 1 modified | 1 figma-only

Suggestions:
  - Run /figma-sync:push to push Tooltip to Figma
  - Run /figma-sync:pull to pull Badge from Figma
  - Run /figma-sync:tokens diff to review token changes
```

### 5. Offer Quick Actions

Based on the status, suggest relevant commands the user can run next.
