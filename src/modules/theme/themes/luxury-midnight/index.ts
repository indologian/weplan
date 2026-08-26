import { registerTheme } from "../../registry";
import { LuxuryMidnightRenderer } from "./renderer";

registerTheme({
  key: "luxury-midnight",
  name: "Luxury Midnight",
  tierCode: "basic",
  renderer: LuxuryMidnightRenderer,
  spec: {
    palette: {
      background: "#0a0f1a",
      surface: "#141b2d",
      text: "#f5f0e8",
      muted: "#a0a8b8",
      accent: "#c9a84c",
      accentContrast: "#0a0f1a",
      border: "#2a3040",
    },
    typography: {
      displayFamily: '"Playfair Display", Georgia, serif',
      bodyFamily: '"Inter", system-ui, sans-serif',
      displayWeight: 300,
      bodyWeight: 400,
    },
    geometry: {
      contentWidth: "480px",
      cardRadius: "0px",
      photoRadius: "0px",
      sectionGap: "0px",
    },
    artDirection: {
      archetype: "luxury-midnight",
      ornamentSet: "thin-gold-rule",
      photoMask: "editorial_rect",
      sectionDivider: "gold-rule",
      motionPreset: "gold-accent",
    },
  },
});
