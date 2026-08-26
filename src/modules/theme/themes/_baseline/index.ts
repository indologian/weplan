import { registerTheme } from "../../registry";
import { BaselineRenderer } from "./renderer";

registerTheme({
  key: "_baseline",
  name: "Baseline",
  tierCode: "basic",
  renderer: BaselineRenderer,
  spec: {
    palette: {
      background: "#ffffff",
      surface: "#f9f9f9",
      text: "#1a1a1a",
      muted: "#6b7280",
      accent: "#1a1a1a",
      accentContrast: "#ffffff",
      border: "#e5e7eb",
    },
    typography: {
      displayFamily: "system-ui, sans-serif",
      bodyFamily: "system-ui, sans-serif",
      displayWeight: 700,
      bodyWeight: 400,
    },
    geometry: {
      contentWidth: "480px",
      cardRadius: "0.5rem",
      photoRadius: "0",
      sectionGap: "4rem",
    },
    artDirection: {
      archetype: "baseline",
      ornamentSet: "none",
      photoMask: "none",
      sectionDivider: "whitespace",
      motionPreset: "none",
    },
  },
});
