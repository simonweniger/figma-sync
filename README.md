# figma-sync

Bidirectional sync between your codebase and Figma, powered by Claude Code.

**figma-sync** is a Claude Code plugin that lets you push UI components from code to Figma and pull Figma designs back to code. It uses your locally configured Figma MCP server — no external services, no API keys to manage, everything runs through your existing Claude Code setup.

It also includes a companion **Figma plugin** for exporting designs directly from the Figma UI.

## How It Works

```
┌─────────────┐                          ┌─────────────┐
│             │   /figma-sync:push       │             │
│  Codebase   │  ─────────────────────>  │   Figma     │
│             │                          │             │
│  Components │   /figma-sync:pull       │  Components │
│  Tokens     │  <─────────────────────  │  Styles     │
│  Styles     │                          │  Tokens     │
│             │   /figma-sync:tokens     │             │
│             │  <────────────────────>  │             │
└─────────────┘                          └─────────────┘
       │                                        │
       │  Claude Code + Figma MCP              │  Figma Plugin
       │  (analysis, generation, sync)          │  (export to JSON)
       └────────────────────────────────────────┘
```

The Claude Code plugin uses two specialized agents:
- **design-analyzer** — scans your codebase to extract component props, variants, tokens, and layout
- **code-generator** — generates framework-idiomatic code from Figma design specs

## Installation

### Claude Code Plugin

**From GitHub** (once published):

```
/plugin marketplace add simonweniger/figma-sync
/plugin install figma-sync@figma-sync-marketplace
```

**From a local clone:**

```bash
git clone https://github.com/simonweniger/figma-sync.git
```

Then in Claude Code:

```
/plugin marketplace add /path/to/figma-sync
/plugin install figma-sync@figma-sync-marketplace
```

**For quick local testing** (no install, loads at startup):

```bash
claude --plugin-dir /path/to/figma-sync/plugins/figma-sync
```

### Figma MCP Server (Required)

figma-sync requires a Figma MCP server configured in Claude Code. If you don't have one:

```bash
claude mcp add figma -- npx figma-developer-mcp --figma-api-key=YOUR_KEY
```

You can get a Figma API key from **Figma > Settings > Personal Access Tokens**.

### Figma Plugin (Optional)

The companion Figma plugin provides an alternative way to export designs:

```bash
cd figma-plugin
npm install
npm run build
```

Then in Figma: **Plugins > Development > Import plugin from manifest** and select `figma-plugin/manifest.json`.

## Quick Start

### 1. Initialize in your project

```
/figma-sync:init
```

This scans your project, detects the framework and styling approach, and creates a `.figma-sync.json` config file. You'll be asked for your Figma file URL.

### 2. Push code to Figma

```
/figma-sync:push
```

Analyzes your codebase components and creates/updates matching Figma components with correct layout, colors, typography, and variants.

### 3. Pull Figma designs to code

```
/figma-sync:pull
```

Reads your Figma file via MCP and generates framework-specific component code, reconciling with existing files.

### 4. Sync design tokens

```
/figma-sync:tokens
/figma-sync:tokens push
/figma-sync:tokens pull
/figma-sync:tokens diff
```

Focused sync for design tokens only — colors, typography, spacing, shadows, border radius.

### 5. Check sync status

```
/figma-sync:status
```

Shows what's in sync, what's changed, and what actions are available.

## Supported Frameworks

| Framework | Styling Options |
|-----------|----------------|
| React     | Tailwind, CSS Modules, styled-components, CSS-in-JS, CSS/SCSS |
| Vue       | Tailwind, CSS Modules, Scoped CSS, SCSS |
| Svelte    | Tailwind, CSS, SCSS |
| Angular   | CSS, SCSS, CSS Modules |
| HTML      | CSS, SCSS, Tailwind |

## Token Formats

| Format | Output |
|--------|--------|
| `css-variables` | `:root { --color-primary: #007AFF; }` |
| `tailwind` | Extends `theme` in `tailwind.config.*` |
| `scss` | `$color-primary: #007AFF;` |
| `json` | W3C Design Token Format |
| `typescript` | `export const colors = { primary: '#007AFF' };` |

## Configuration

`.figma-sync.json` (created by `/figma-sync:init`):

```json
{
  "figmaFileKey": "abc123xyz",
  "framework": "react",
  "styling": "tailwind",
  "paths": {
    "components": "src/components",
    "tokens": "src/tokens",
    "styles": "src/styles",
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

## Automatic Change Tracking

figma-sync includes hooks that automatically track when you edit component or token files during a Claude Code session. When Claude finishes responding, it'll remind you if there are unsynced changes.

You can disable this by removing the hooks from the plugin config.

## Project Structure

```
figma-sync/
├── .claude-plugin/
│   └── marketplace.json         # Marketplace manifest (for plugin installation)
├── plugins/
│   └── figma-sync/              # The Claude Code plugin
│       ├── .claude-plugin/
│       │   └── plugin.json      # Plugin manifest
│       ├── skills/
│       │   ├── init/SKILL.md    # /figma-sync:init
│       │   ├── push/SKILL.md    # /figma-sync:push
│       │   ├── pull/SKILL.md    # /figma-sync:pull
│       │   ├── tokens/SKILL.md  # /figma-sync:tokens
│       │   └── status/SKILL.md  # /figma-sync:status
│       ├── agents/
│       │   ├── design-analyzer.md
│       │   └── code-generator.md
│       ├── hooks/
│       │   └── hooks.json
│       └── scripts/
│           ├── track-component-change.sh
│           └── check-sync-drift.sh
├── figma-plugin/                # Companion Figma plugin
│   ├── manifest.json
│   ├── package.json
│   └── src/
│       ├── code.ts              # Plugin logic
│       └── ui.html              # Plugin UI
├── shared/
│   └── types.ts                 # Shared type definitions
└── README.md
```

## Using the Figma Plugin

The Figma plugin provides a UI for exporting directly from Figma:

1. **Export All** — exports every component and style in the file
2. **Export Selection** — exports only selected components/frames
3. **Export Tokens Only** — exports just color, text, and effect styles

The export produces a JSON file that you save to `.figma-sync/export.json` in your project, then run `/figma-sync:pull` to generate code.

## How It Uses Your Figma MCP

figma-sync doesn't call the Figma API directly. Instead, it leverages whatever Figma MCP server you have configured in Claude Code. This means:

- No additional API keys to configure
- Works with any Figma MCP implementation
- Respects your existing permissions and rate limits
- All operations go through Claude Code's permission system

The skills instruct Claude to use `mcp__figma__*` tools for reading and writing Figma data.

## License

MIT
