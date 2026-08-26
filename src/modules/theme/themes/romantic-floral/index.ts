import { registerTheme } from "../../registry";
import { RomanticFloralRenderer } from "./renderer";

registerTheme({
  key: "romantic-floral-watercolor",
  name: "Romantic Floral Watercolor",
  tierCode: "basic",
  renderer: RomanticFloralRenderer,
  spec: {
    palette: {
      background: "#fdf8f3",
      surface: "#f4e4e6",
      text: "#4a3a3a",
      muted: "#9a8a8a",
      accent: "#d4a0a0",
      accentContrast: "#ffffff",
      border: "#e8d5d0",
    },
    typography: {
      displayFamily: '"Playfair Display", Georgia, serif',
      bodyFamily: '"Inter", system-ui, sans-serif',
      displayWeight: 400,
      bodyWeight: 400,
    },
    geometry: {
      contentWidth: "480px",
      cardRadius: "8px",
      photoRadius: "8px",
      sectionGap: "0px",
    },
    artDirection: {
      archetype: "romantic-floral",
      ornamentSet: "floral-soft",
      photoMask: "rounded_rect",
      sectionDivider: "floral-divider",
      motionPreset: "hover-only",
    },
  },
});
