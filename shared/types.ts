/**
 * Shared types for the figma-sync protocol.
 * Used by both the Claude Code plugin (via skills/agents) and the Figma plugin.
 */

// ── Sync Configuration ──────────────────────────────────────────────

export interface FigmaSyncConfig {
  figmaFileKey: string;
  framework: "react" | "vue" | "svelte" | "angular" | "html";
  styling:
    | "tailwind"
    | "css-modules"
    | "styled-components"
    | "css-in-js"
    | "scss"
    | "css";
  paths: {
    components: string;
    tokens: string;
    styles: string;
    generated: string;
  };
  sync: {
    tokens: boolean;
    components: boolean;
    icons: boolean;
    assets: boolean;
  };
  tokenFormat:
    | "css-variables"
    | "tailwind"
    | "scss"
    | "json"
    | "typescript";
  componentMapping: Record<string, ComponentMapping>;
}

export interface ComponentMapping {
  codeFile: string;
  figmaNodeId: string;
  figmaNodeName: string;
  lastSyncedAt: string;
  lastCodeHash?: string;
  lastFigmaHash?: string;
}

// ── Sync State ──────────────────────────────────────────────────────

export interface SyncState {
  lastPush: string | null;
  lastPull: string | null;
  components: ComponentSyncRecord[];
  tokens: TokenSyncRecord[];
}

export interface ComponentSyncRecord {
  name: string;
  codeFile: string;
  figmaNodeId: string;
  figmaNodeName: string;
  lastSyncedAt: string;
  syncDirection: "push" | "pull";
  status: "synced" | "code-modified" | "figma-modified" | "conflict";
}

export interface TokenSyncRecord {
  category: string;
  tokenCount: number;
  lastSyncedAt: string;
  syncDirection: "push" | "pull";
}

// ── Design Tokens ───────────────────────────────────────────────────

export interface DesignTokens {
  colors: Record<string, ColorToken>;
  typography: Record<string, TypographyToken>;
  spacing: Record<string, SpacingToken>;
  shadows: Record<string, ShadowToken>;
  borderRadius: Record<string, string>;
  breakpoints: Record<string, string>;
}

export interface ColorToken {
  value: string;
  description?: string;
  figmaStyleId?: string;
}

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: string | number;
  lineHeight: string;
  letterSpacing?: string;
  description?: string;
  figmaStyleId?: string;
}

export interface SpacingToken {
  value: string;
  description?: string;
}

export interface ShadowToken {
  value: string;
  offsetX: string;
  offsetY: string;
  blur: string;
  spread: string;
  color: string;
  description?: string;
  figmaStyleId?: string;
}

// ── Component Analysis ──────────────────────────────────────────────

export interface ComponentAnalysis {
  name: string;
  filePath: string;
  framework: string;
  props: PropDefinition[];
  variants: VariantDefinition[];
  tokens: TokenReference[];
  layout: LayoutInfo;
  children: string[];
  description?: string;
}

export interface PropDefinition {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  isVariant: boolean;
}

export interface VariantDefinition {
  property: string;
  values: string[];
}

export interface TokenReference {
  token: string;
  category: "color" | "typography" | "spacing" | "shadow" | "radius";
  resolvedValue?: string;
}

export interface LayoutInfo {
  display: "flex" | "grid" | "block" | "inline" | "inline-flex";
  direction?: "row" | "column";
  alignment?: string;
  justify?: string;
  gap?: string;
  padding?: string;
  wrap?: boolean;
}

// ── Figma Plugin Export Format ───────────────────────────────────────

export interface FigmaExport {
  version: "1.0";
  exportedAt: string;
  fileKey: string;
  fileName: string;
  components: FigmaComponentExport[];
  styles: FigmaStylesExport;
}

export interface FigmaComponentExport {
  nodeId: string;
  name: string;
  description: string;
  properties: FigmaPropertyExport[];
  variants: FigmaVariantExport[];
  layout: FigmaLayoutExport;
  visual: FigmaVisualExport;
  children: FigmaChildExport[];
}

export interface FigmaPropertyExport {
  name: string;
  type: "BOOLEAN" | "TEXT" | "INSTANCE_SWAP" | "VARIANT";
  defaultValue: string;
}

export interface FigmaVariantExport {
  name: string;
  properties: Record<string, string>;
  nodeId: string;
}

export interface FigmaLayoutExport {
  mode: "NONE" | "HORIZONTAL" | "VERTICAL";
  padding: { top: number; right: number; bottom: number; left: number };
  gap: number;
  primaryAxisAlign: string;
  counterAxisAlign: string;
  sizing: { width: string; height: string };
}

export interface FigmaVisualExport {
  fills: FigmaFillExport[];
  strokes: FigmaStrokeExport[];
  effects: FigmaEffectExport[];
  cornerRadius: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  opacity: number;
}

export interface FigmaFillExport {
  type: "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "IMAGE";
  color?: string;
  opacity?: number;
  styleId?: string;
  styleName?: string;
}

export interface FigmaStrokeExport {
  color: string;
  weight: number;
  styleId?: string;
}

export interface FigmaEffectExport {
  type: "DROP_SHADOW" | "INNER_SHADOW" | "BLUR" | "BACKGROUND_BLUR";
  color?: string;
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
  styleId?: string;
}

export interface FigmaChildExport {
  type: "TEXT" | "FRAME" | "INSTANCE" | "RECTANGLE" | "VECTOR" | "GROUP";
  name: string;
  nodeId: string;
  text?: string;
  componentName?: string;
}

export interface FigmaStylesExport {
  colors: FigmaColorStyleExport[];
  text: FigmaTextStyleExport[];
  effects: FigmaEffectStyleExport[];
}

export interface FigmaColorStyleExport {
  id: string;
  name: string;
  color: string;
  opacity: number;
  description?: string;
}

export interface FigmaTextStyleExport {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing: number;
  description?: string;
}

export interface FigmaEffectStyleExport {
  id: string;
  name: string;
  effects: FigmaEffectExport[];
  description?: string;
}

// ── Pending Changes (tracked by hooks) ──────────────────────────────

export interface PendingChanges {
  changes: PendingChange[];
}

export interface PendingChange {
  file: string;
  type: "component" | "token";
  timestamp: string;
}
