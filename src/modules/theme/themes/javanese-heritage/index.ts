import { registerTheme } from "../../registry";
import { JavaneseHeritageRenderer } from "./renderer";

registerTheme({
  key: "javanese-heritage",
  name: "Javanese Heritage",
  tierCode: "basic",
  renderer: JavaneseHeritageRenderer,
  spec: {
    palette: {
      background: "#faf5ed",
      surface: "#f0e8d8",
      text: "#3a3a3a",
      muted: "#7a7060",
      accent: "#b8860b",
      accentContrast: "#ffffff",
      border: "#d4c8b0",
    },
    typography: {
      displayFamily: '"Playfair Display", Georgia, serif',
      bodyFamily: '"Inter", system-ui, sans-serif',
      displayWeight: 700,
      bodyWeight: 400,
    },
    geometry: {
      contentWidth: "480px",
      cardRadius: "0px",
      photoRadius: "0px",
      sectionGap: "0px",
    },
    artDirection: {
      archetype: "javanese-heritage",
      ornamentSet: "geometric-batik",
      photoMask: "editorial_rect",
      sectionDivider: "gold-rule",
      motionPreset: "opacity-subtle",
    },
  },
});
