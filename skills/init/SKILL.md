---
name: init
description: Initialize figma-sync in the current project. Creates a .figma-sync.json config file mapping your codebase components to Figma files. Run this first before using push or pull.
---

# Initialize Figma Sync

Set up figma-sync for this project. You need to:

1. **Detect the project framework** by examining the codebase:
   - Look for `package.json`, `tsconfig.json`, `tailwind.config.*`, etc.
   - Identify the UI framework: React, Vue, Svelte, Angular, or vanilla HTML/CSS
   - Identify the styling approach: CSS Modules, Tailwind, styled-components, CSS-in-JS, plain CSS/SCSS

2. **Find existing design token files** if any:
   - Look for files named `tokens.*`, `theme.*`, `variables.*`, `design-tokens.*`
   - Check for CSS custom properties files, Tailwind config theme extensions
   - Check for any existing style guide or design system files

3. **Ask the user for their Figma file URL** (if not provided as $ARGUMENTS):
   - The Figma file URL or key they want to sync with
   - Which components or pages to include

4. **Create the config file** `.figma-sync.json` at the project root:

```json
{
  "figmaFileKey": "<extracted-from-url-or-provided>",
  "framework": "<detected>",
  "styling": "<detected>",
  "paths": {
    "components": "<detected-component-directory>",
    "tokens": "<detected-or-default-tokens-path>",
    "styles": "<detected-styles-directory>",
    "generated": ".figma-sync/generated"
  },
  "sync": {
    "tokens": true,
    "components": true,
    "icons": false,
    "assets": false
  },
  "tokenFormat": "css-variables",
  "componentMapping": {}
}
```

5. **Create the `.figma-sync/` directory** for generated files and sync state:
   - `.figma-sync/generated/` - for generated code
   - `.figma-sync/state.json` - for tracking sync state
   - Add `.figma-sync/generated/` to `.gitignore` if it exists

6. **Verify the Figma MCP is configured** by attempting to use a Figma MCP tool. If it fails, tell the user to configure it:
   ```
   claude mcp add figma -- npx figma-developer-mcp --figma-api-key=<KEY>
   ```

7. **Print a summary** of what was set up and what commands are available:
   - `/figma-sync:push` - Push code components to Figma
   - `/figma-sync:pull` - Pull Figma designs to code
   - `/figma-sync:tokens` - Sync design tokens
   - `/figma-sync:status` - Check sync status
