import type { PublicInvitationDTO } from "@/modules/invitation/types";

export type ThemePalette = {
  background: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  accentContrast: string;
  border: string;
};

export type ThemeTypography = {
  displayFamily: string;
  bodyFamily: string;
  displayWeight: number;
  bodyWeight: number;
};

export type ThemeGeometry = {
  contentWidth: string;
  cardRadius: string;
  photoRadius: string;
  sectionGap: string;
};

export type ThemeArtDirection = {
  archetype: string;
  ornamentSet: string;
  photoMask: string;
  sectionDivider: string;
  motionPreset: string;
};

export type ThemeVisualSpec = {
  palette: ThemePalette;
  typography: ThemeTypography;
  geometry: ThemeGeometry;
  artDirection: ThemeArtDirection;
};

export type RendererProps = {
  invitation: PublicInvitationDTO;
  guestName?: string;
};

export type RendererComponent = React.ComponentType<RendererProps>;

export type ThemeDefinition = {
  key: string;
  name: string;
  tierCode: "basic" | "premium" | "vip";
  renderer: RendererComponent;
  spec: ThemeVisualSpec;
};
