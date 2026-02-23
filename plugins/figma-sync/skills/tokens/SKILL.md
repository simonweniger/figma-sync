---
name: tokens
description: Sync design tokens between your codebase and Figma. Extract tokens from code or Figma and update the other side. Handles colors, typography, spacing, shadows, and more.
---

# Design Token Sync

Synchronize design tokens between the codebase and Figma. This is a focused sync that only handles design tokens, not full components.

## Prerequisites

Read `.figma-sync.json` to get the configuration. If it doesn't exist, tell the user to run `/figma-sync:init` first.

## Determine Direction

If $ARGUMENTS contains a direction, use it:
- `push` or `to-figma` → Push code tokens to Figma
- `pull` or `from-figma` → Pull Figma tokens to code
- `diff` → Show differences without making changes
- (no argument) → Show diff and ask the user which direction

## Token Categories

### Colors
- CSS: `--color-*` custom properties, named colors
- Tailwind: `theme.colors.*` config values
- SCSS: `$color-*` variables
- JS/TS: exported color objects/constants
- Figma: Color styles

### Typography
- Font families, sizes, weights
- Line heights, letter spacing
- Text styles (heading, body, caption, etc.)
- Figma: Text styles

### Spacing
- Margin/padding scale
- Gap values
- Figma: Auto-layout spacing

### Shadows
- Box shadows / drop shadows
- Figma: Effect styles

### Border Radius
- Corner radius values
- Figma: Corner radius properties

### Breakpoints
- Media query breakpoints
- Container query breakpoints

## Push Flow (Code → Figma)

1. Read token files from the configured `paths.tokens` directory
2. Parse tokens based on the format (CSS vars, Tailwind, SCSS, JSON, TS)
3. Read existing Figma styles via MCP
4. Compare and identify changes
5. Create/update Figma styles via MCP
6. Report what was synced

## Pull Flow (Figma → Code)

1. Read all styles from the Figma file via MCP
2. Parse Figma styles into token format
3. Read existing code tokens
4. Compare and identify changes
5. Write updated token files in the configured `tokenFormat`
6. Report what was synced

## Diff Flow

1. Read both code tokens and Figma styles
2. Compare values
3. Show a table of differences:
   ```
   Token              Code Value    Figma Value    Status
   color-primary      #007AFF       #0066FF        DIFFERENT
   color-secondary    #5856D6       #5856D6        IN SYNC
   font-size-lg       18px          20px           DIFFERENT
   spacing-4          16px          -              CODE ONLY
   shadow-lg          -             0 4px 12px     FIGMA ONLY
   ```
4. Ask the user what to do about differences
