/**
 * Figma Sync Plugin - Main Code
 *
 * This plugin runs inside Figma and exports component definitions,
 * design tokens, and styles in a structured format that the
 * figma-sync Claude Code plugin can consume.
 *
 * The export is copied to clipboard as JSON, which the user then
 * saves to their project for the Claude Code plugin to process.
 */

figma.showUI(__html__, { width: 480, height: 640, themeColors: true });

// ── Types ───────────────────────────────────────────────────────────

interface ExportResult {
  version: "1.0";
  exportedAt: string;
  fileKey: string;
  fileName: string;
  components: ComponentExport[];
  styles: StylesExport;
}

interface ComponentExport {
  nodeId: string;
  name: string;
  description: string;
  properties: PropertyExport[];
  variants: VariantExport[];
  layout: LayoutExport;
  visual: VisualExport;
  children: ChildExport[];
}

interface PropertyExport {
  name: string;
  type: string;
  defaultValue: string;
}

interface VariantExport {
  name: string;
  properties: Record<string, string>;
  nodeId: string;
}

interface LayoutExport {
  mode: string;
  padding: { top: number; right: number; bottom: number; left: number };
  gap: number;
  primaryAxisAlign: string;
  counterAxisAlign: string;
  sizing: { width: string; height: string };
}

interface VisualExport {
  fills: FillExport[];
  strokes: StrokeExport[];
  effects: EffectExport[];
  cornerRadius: number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number };
  opacity: number;
}

interface FillExport {
  type: string;
  color?: string;
  opacity?: number;
  styleId?: string;
  styleName?: string;
}

interface StrokeExport {
  color: string;
  weight: number;
  styleId?: string;
}

interface EffectExport {
  type: string;
  color?: string;
  offset?: { x: number; y: number };
  radius: number;
  spread?: number;
  styleId?: string;
}

interface ChildExport {
  type: string;
  name: string;
  nodeId: string;
  text?: string;
  componentName?: string;
}

interface StylesExport {
  colors: ColorStyleExport[];
  text: TextStyleExport[];
  effects: EffectStyleExport[];
}

interface ColorStyleExport {
  id: string;
  name: string;
  color: string;
  opacity: number;
  description?: string;
}

interface TextStyleExport {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number | string;
  letterSpacing: number;
  description?: string;
}

interface EffectStyleExport {
  id: string;
  name: string;
  effects: EffectExport[];
  description?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function colorToString(paint: SolidPaint): string {
  return rgbToHex(paint.color.r, paint.color.g, paint.color.b);
}

function extractFills(node: SceneNode): FillExport[] {
  if (!("fills" in node) || !Array.isArray(node.fills)) return [];

  return (node.fills as readonly Paint[])
    .filter((f) => f.visible !== false)
    .map((fill) => {
      const result: FillExport = { type: fill.type };
      if (fill.type === "SOLID") {
        result.color = rgbToHex(fill.color.r, fill.color.g, fill.color.b);
        result.opacity = fill.opacity ?? 1;
      }

      // Check for bound style
      if ("fillStyleId" in node && node.fillStyleId && typeof node.fillStyleId === "string") {
        result.styleId = node.fillStyleId;
        const style = figma.getStyleById(node.fillStyleId);
        if (style) result.styleName = style.name;
      }

      return result;
    });
}

function extractStrokes(node: SceneNode): StrokeExport[] {
  if (!("strokes" in node) || !Array.isArray(node.strokes)) return [];

  return (node.strokes as readonly Paint[])
    .filter((s) => s.visible !== false)
    .map((stroke) => {
      const result: StrokeExport = {
        color: stroke.type === "SOLID" ? colorToString(stroke) : "#000000",
        weight: "strokeWeight" in node ? (node.strokeWeight as number) : 1,
      };
      return result;
    });
}

function extractEffects(node: SceneNode): EffectExport[] {
  if (!("effects" in node)) return [];

  return (node.effects as readonly Effect[])
    .filter((e) => e.visible !== false)
    .map((effect) => {
      const result: EffectExport = {
        type: effect.type,
        radius: effect.radius,
      };
      if (
        effect.type === "DROP_SHADOW" ||
        effect.type === "INNER_SHADOW"
      ) {
        result.color = rgbToHex(
          effect.color.r,
          effect.color.g,
          effect.color.b
        );
        result.offset = { x: effect.offset.x, y: effect.offset.y };
        result.spread = effect.spread;
      }
      return result;
    });
}

function extractCornerRadius(
  node: SceneNode
): number | { topLeft: number; topRight: number; bottomRight: number; bottomLeft: number } {
  if (!("cornerRadius" in node)) return 0;
  if (node.cornerRadius !== figma.mixed) return node.cornerRadius;
  if (
    "topLeftRadius" in node &&
    "topRightRadius" in node &&
    "bottomRightRadius" in node &&
    "bottomLeftRadius" in node
  ) {
    return {
      topLeft: node.topLeftRadius,
      topRight: node.topRightRadius,
      bottomRight: node.bottomRightRadius,
      bottomLeft: node.bottomLeftRadius,
    };
  }
  return 0;
}

function extractLayout(node: SceneNode): LayoutExport {
  const layout: LayoutExport = {
    mode: "NONE",
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
    gap: 0,
    primaryAxisAlign: "MIN",
    counterAxisAlign: "MIN",
    sizing: { width: "FIXED", height: "FIXED" },
  };

  if (!("layoutMode" in node)) return layout;

  const frame = node as FrameNode;
  layout.mode = frame.layoutMode;

  if (frame.layoutMode !== "NONE") {
    layout.padding = {
      top: frame.paddingTop,
      right: frame.paddingRight,
      bottom: frame.paddingBottom,
      left: frame.paddingLeft,
    };
    layout.gap = frame.itemSpacing;
    layout.primaryAxisAlign = frame.primaryAxisAlignItems;
    layout.counterAxisAlign = frame.counterAxisAlignItems;
  }

  layout.sizing = {
    width:
      "layoutSizingHorizontal" in frame
        ? frame.layoutSizingHorizontal
        : "FIXED",
    height:
      "layoutSizingVertical" in frame ? frame.layoutSizingVertical : "FIXED",
  };

  return layout;
}

function extractChildren(node: SceneNode): ChildExport[] {
  if (!("children" in node)) return [];

  return (node as FrameNode).children.map((child) => {
    const result: ChildExport = {
      type: child.type,
      name: child.name,
      nodeId: child.id,
    };

    if (child.type === "TEXT") {
      result.text = child.characters;
    }

    if (child.type === "INSTANCE") {
      const mainComponent = child.mainComponent;
      if (mainComponent) {
        result.componentName = mainComponent.name;
      }
    }

    return result;
  });
}

// ── Component Export ─────────────────────────────────────────────────

function exportComponent(
  component: ComponentNode | ComponentSetNode
): ComponentExport {
  const result: ComponentExport = {
    nodeId: component.id,
    name: component.name,
    description: component.description || "",
    properties: [],
    variants: [],
    layout: extractLayout(component),
    visual: {
      fills: extractFills(component),
      strokes: extractStrokes(component),
      effects: extractEffects(component),
      cornerRadius: extractCornerRadius(component),
      opacity: component.opacity,
    },
    children: extractChildren(component),
  };

  // Extract component properties
  if ("componentPropertyDefinitions" in component) {
    const defs = component.componentPropertyDefinitions;
    for (const [key, def] of Object.entries(defs)) {
      result.properties.push({
        name: key,
        type: def.type,
        defaultValue: String(def.defaultValue),
      });
    }
  }

  // Extract variants for component sets
  if (component.type === "COMPONENT_SET") {
    for (const child of component.children) {
      if (child.type === "COMPONENT") {
        const variantProps: Record<string, string> = {};
        const nameParts = child.name.split(",").map((p) => p.trim());
        for (const part of nameParts) {
          const [key, value] = part.split("=").map((s) => s.trim());
          if (key && value) {
            variantProps[key] = value;
          }
        }
        result.variants.push({
          name: child.name,
          properties: variantProps,
          nodeId: child.id,
        });
      }
    }
  }

  return result;
}

// ── Style Export ─────────────────────────────────────────────────────

async function exportStyles(): Promise<StylesExport> {
  const styles: StylesExport = {
    colors: [],
    text: [],
    effects: [],
  };

  // Export color styles
  const paintStyles = await figma.getLocalPaintStylesAsync();
  for (const style of paintStyles) {
    const paint = style.paints[0];
    if (paint && paint.type === "SOLID") {
      styles.colors.push({
        id: style.id,
        name: style.name,
        color: colorToString(paint),
        opacity: paint.opacity ?? 1,
        description: style.description || undefined,
      });
    }
  }

  // Export text styles
  const textStyles = await figma.getLocalTextStylesAsync();
  for (const style of textStyles) {
    const lineHeight =
      style.lineHeight.unit === "AUTO"
        ? "auto"
        : style.lineHeight.unit === "PERCENT"
          ? `${style.lineHeight.value}%`
          : style.lineHeight.value;

    styles.text.push({
      id: style.id,
      name: style.name,
      fontFamily: style.fontName.family,
      fontSize: style.fontSize,
      fontWeight: getFontWeight(style.fontName.style),
      lineHeight,
      letterSpacing:
        style.letterSpacing.unit === "PERCENT"
          ? style.letterSpacing.value / 100
          : style.letterSpacing.value,
      description: style.description || undefined,
    });
  }

  // Export effect styles
  const effectStyles = await figma.getLocalEffectStylesAsync();
  for (const style of effectStyles) {
    styles.effects.push({
      id: style.id,
      name: style.name,
      effects: style.effects
        .filter((e) => e.visible !== false)
        .map((e) => {
          const result: EffectExport = { type: e.type, radius: e.radius };
          if (e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW") {
            result.color = rgbToHex(e.color.r, e.color.g, e.color.b);
            result.offset = { x: e.offset.x, y: e.offset.y };
            result.spread = e.spread;
          }
          return result;
        }),
      description: style.description || undefined,
    });
  }

  return styles;
}

function getFontWeight(style: string): number {
  const weights: Record<string, number> = {
    Thin: 100,
    "Extra Light": 200,
    ExtraLight: 200,
    UltraLight: 200,
    Light: 300,
    Regular: 400,
    Normal: 400,
    Medium: 500,
    "Semi Bold": 600,
    SemiBold: 600,
    DemiBold: 600,
    Bold: 700,
    "Extra Bold": 800,
    ExtraBold: 800,
    UltraBold: 800,
    Black: 900,
    Heavy: 900,
  };
  return weights[style] ?? 400;
}

// ── Main Export Logic ────────────────────────────────────────────────

async function exportAll(): Promise<ExportResult> {
  const components: ComponentExport[] = [];

  // Find all components and component sets in the document
  const componentNodes = figma.root.findAll(
    (node) => node.type === "COMPONENT" || node.type === "COMPONENT_SET"
  );

  // Avoid duplicating components that are part of a set
  const componentSetIds = new Set<string>();
  for (const node of componentNodes) {
    if (node.type === "COMPONENT_SET") {
      componentSetIds.add(node.id);
    }
  }

  for (const node of componentNodes) {
    // Skip individual variant components that belong to a set
    if (node.type === "COMPONENT" && node.parent?.type === "COMPONENT_SET") {
      continue;
    }
    components.push(
      exportComponent(node as ComponentNode | ComponentSetNode)
    );
  }

  const styles = await exportStyles();

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    fileKey: figma.fileKey ?? "unknown",
    fileName: figma.root.name,
    components,
    styles,
  };
}

async function exportSelection(): Promise<ExportResult> {
  const selection = figma.currentPage.selection;
  const components: ComponentExport[] = [];

  for (const node of selection) {
    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
      components.push(exportComponent(node));
    } else if (node.type === "FRAME" || node.type === "GROUP") {
      // Look for components inside frames
      const innerComponents = node.findAll(
        (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
      );
      for (const inner of innerComponents) {
        if (
          inner.type === "COMPONENT" &&
          inner.parent?.type === "COMPONENT_SET"
        ) {
          continue;
        }
        components.push(
          exportComponent(inner as ComponentNode | ComponentSetNode)
        );
      }
    }
  }

  const styles = await exportStyles();

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    fileKey: figma.fileKey ?? "unknown",
    fileName: figma.root.name,
    components,
    styles,
  };
}

async function exportTokensOnly(): Promise<ExportResult> {
  const styles = await exportStyles();

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    fileKey: figma.fileKey ?? "unknown",
    fileName: figma.root.name,
    components: [],
    styles,
  };
}

// ── Message Handling ────────────────────────────────────────────────

figma.ui.onmessage = async (msg: {
  type: string;
  scope?: string;
}) => {
  try {
    let result: ExportResult;

    switch (msg.type) {
      case "export":
        if (msg.scope === "selection") {
          result = await exportSelection();
        } else if (msg.scope === "tokens") {
          result = await exportTokensOnly();
        } else {
          result = await exportAll();
        }

        figma.ui.postMessage({
          type: "export-result",
          data: result,
          summary: {
            componentCount: result.components.length,
            colorStyleCount: result.styles.colors.length,
            textStyleCount: result.styles.text.length,
            effectStyleCount: result.styles.effects.length,
          },
        });
        break;

      case "get-info":
        const allComponents = figma.root.findAll(
          (n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET"
        );
        const setIds = new Set<string>();
        for (const n of allComponents) {
          if (n.type === "COMPONENT_SET") setIds.add(n.id);
        }
        const topLevelCount = allComponents.filter(
          (n) =>
            n.type === "COMPONENT_SET" ||
            (n.type === "COMPONENT" && n.parent?.type !== "COMPONENT_SET")
        ).length;

        const paintStyles = await figma.getLocalPaintStylesAsync();
        const textStyles = await figma.getLocalTextStylesAsync();
        const effectStyles = await figma.getLocalEffectStylesAsync();

        figma.ui.postMessage({
          type: "file-info",
          data: {
            fileName: figma.root.name,
            fileKey: figma.fileKey,
            pageCount: figma.root.children.length,
            componentCount: topLevelCount,
            colorStyleCount: paintStyles.length,
            textStyleCount: textStyles.length,
            effectStyleCount: effectStyles.length,
            selectionCount: figma.currentPage.selection.length,
          },
        });
        break;

      case "cancel":
        figma.closePlugin();
        break;
    }
  } catch (error) {
    figma.ui.postMessage({
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
