import { registerTheme } from "../../registry";
import { ModernEditorialRenderer } from "./renderer";

registerTheme({
  key: "modern-editorial-ivory",
  name: "Modern Editorial Ivory",
  tierCode: "basic",
  renderer: ModernEditorialRenderer,
  spec: {
    palette: {
      background: "#faf8f5",
      surface: "#f5f0ea",
      text: "#2c2c2c",
      muted: "#8a8580",
      accent: "#c4a87c",
      accentContrast: "#ffffff",
      border: "#e8e2da",
    },
    typography: {
      displayFamily: '"Playfair Display", Georgia, serif',
      bodyFamily: '"Inter", system-ui, sans-serif',
      displayWeight: 400,
      bodyWeight: 400,
    },
    geometry: {
      contentWidth: "480px",
      cardRadius: "0px",
      photoRadius: "0px",
      sectionGap: "0px",
    },
    artDirection: {
      archetype: "modern-editorial",
      ornamentSet: "thin-rule",
      photoMask: "editorial_rect",
      sectionDivider: "rule",
      motionPreset: "editorial",
    },
  },
});
