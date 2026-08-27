export type {
  ThemeVisualSpec,
  ThemePalette,
  ThemeTypography,
  ThemeGeometry,
  ThemeArtDirection,
  RendererProps,
  RendererComponent,
  ThemeDefinition,
} from "./types";

export { createRenderer } from "./renderer";
export type { ThemeSectionRenderers } from "./renderer";
export {
  registerTheme,
  getTheme,
  getRenderer,
  getAllThemes,
  getActiveRendererKeys,
} from "./registry";
