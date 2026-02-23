---
name: push
description: Push code components and design tokens from your codebase to Figma. Analyzes your components and creates or updates matching Figma components using the Figma MCP.
---

# Push Code to Figma

Analyze the current codebase and push component definitions and design tokens to Figma using the Figma MCP.

## Prerequisites

Read `.figma-sync.json` to get the configuration. If it doesn't exist, tell the user to run `/figma-sync:init` first.

## Steps

### 1. Analyze the Codebase

Scan the configured component directory for UI components. For each component, extract:

- **Component name** and file path
- **Props/API** - all props with types and defaults
- **Variants** - conditional rendering paths, size/color/state variants
- **Design tokens used** - colors, spacing, typography, shadows, borders
- **Layout structure** - flex/grid patterns, dimensions, padding/margin
- **Child components** - composition relationships

Use the design-analyzer agent via the Task tool to help with analysis if there are many components.

### 2. Extract Design Tokens

From the configured tokens path, extract:
- **Colors** - all color values (hex, rgb, hsl, CSS variables, Tailwind colors)
- **Typography** - font families, sizes, weights, line heights
- **Spacing** - padding/margin scale values
- **Shadows** - box-shadow definitions
- **Border radius** - radius values
- **Breakpoints** - responsive breakpoints

### 3. Map to Figma Structure

For each component, determine the Figma representation:

- **Component** → Figma Component with auto-layout
- **Variants** → Figma Component Set with variant properties
- **Text** → Figma Text nodes with style references
- **Colors** → Figma Color Styles
- **Typography** → Figma Text Styles
- **Shadows** → Figma Effect Styles
- **Spacing** → Auto-layout padding/gaps
- **Icons** → Figma Component instances

### 4. Push to Figma via MCP

Use the Figma MCP tools to:

1. **Check existing components** - Read the Figma file to see what already exists
2. **Create/update styles** - Push design token values as Figma styles
3. **Create/update components** - Create Figma components matching code structure
4. **Set properties** - Apply correct colors, typography, spacing, auto-layout
5. **Add descriptions** - Include component documentation from code comments/JSDoc

### 5. Update Sync State

After pushing, update `.figma-sync/state.json` with:
- Timestamp of last push
- List of components pushed with their Figma node IDs
- Token values that were synced
- Any conflicts or warnings

### 6. Report Results

Print a summary:
- Components created/updated
- Design tokens synced
- Any components that couldn't be mapped
- Link to the Figma file

## Arguments

If $ARGUMENTS is provided, treat it as a filter:
- A component name: push only that component
- A path: push only components in that directory
- "tokens": push only design tokens
- "all": push everything (default)
