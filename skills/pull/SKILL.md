---
name: pull
description: Pull Figma designs into your codebase. Reads components, styles, and tokens from Figma via MCP and generates or updates code files to match the designs.
---

# Pull Figma Designs to Code

Read Figma designs via MCP and generate/update code in the current project.

## Prerequisites

Read `.figma-sync.json` to get the configuration. If it doesn't exist, tell the user to run `/figma-sync:init` first.

## Steps

### 1. Read Figma File

Use the Figma MCP to read the configured Figma file:

- **List all pages** and their structure
- **Get all components** with their properties and variants
- **Get all styles** (color, text, effect, grid styles)
- **Get component descriptions** and documentation

### 2. Extract Design Information

For each Figma component, extract:

- **Name** and hierarchy path
- **Properties** - component properties (text, boolean, instance swap, variant)
- **Variants** - all variant combinations
- **Auto-layout** - direction, padding, gap, alignment
- **Visual properties** - fills, strokes, effects, corner radius
- **Typography** - font, size, weight, line height, letter spacing
- **Dimensions** - width, height, constraints
- **Children** - nested component instances and layers

For styles, extract:
- **Color styles** → CSS custom properties / Tailwind colors / theme values
- **Text styles** → Typography tokens
- **Effect styles** → Shadow tokens
- **Grid styles** → Layout tokens

### 3. Generate Code

Based on the project framework (from `.figma-sync.json`), generate appropriate code:

**React + Tailwind:**
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}
```

**React + CSS Modules:**
```tsx
import styles from './Button.module.css';
```

**Vue:**
```vue
<template>
  <button :class="classes">
    <slot />
  </button>
</template>
```

Use the code-generator agent via the Task tool to help generate high-quality, idiomatic code.

### 4. Reconcile with Existing Code

Before writing files:

1. **Check if the component already exists** in the codebase
2. **If it exists**, compare and show the differences to the user
3. **Ask the user** whether to:
   - Overwrite the existing file
   - Merge changes (update only styles/tokens, keep logic)
   - Skip this component
   - Generate to `.figma-sync/generated/` for manual review
4. **If it doesn't exist**, create it in the configured components directory

### 5. Generate Design Tokens

Write design tokens in the configured format:

- **CSS Variables**: `:root { --color-primary: #007AFF; }`
- **Tailwind Config**: Extend `theme` in `tailwind.config.*`
- **SCSS Variables**: `$color-primary: #007AFF;`
- **TypeScript Constants**: `export const colors = { primary: '#007AFF' };`
- **JSON**: Standard design token JSON format

### 6. Update Sync State

Update `.figma-sync/state.json` with:
- Timestamp of last pull
- List of components pulled with their Figma node IDs
- Token values that were synced
- Component mapping (Figma node ID → code file path)

### 7. Report Results

Print a summary:
- Components generated/updated
- Design tokens written
- Files that need manual review
- Any Figma components that couldn't be mapped to code

## Arguments

If $ARGUMENTS is provided:
- A Figma node URL: pull only that specific component
- A component name: pull only matching components
- "tokens": pull only design tokens
- "all": pull everything (default)
