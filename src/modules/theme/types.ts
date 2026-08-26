import type { z } from "zod";
import type {
  bankAccountItemSchema,
  invitationCoupleSchema,
  invitationSettingsSchema,
  loveStoryItemSchema,
} from "@/modules/invitation/schemas";

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

export type PublicEventDTO = {
  eventId: string;
  position: number;
  eventType: string;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  venueName: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type PublicMediaDTO = {
  mediaId: string;
  purpose: string;
  variant: string;
  url: string;
};

export type PublicInvitationDTO = {
  invitationId: string;
  slug: string;
  isPrivate: boolean;
  couple: z.infer<typeof invitationCoupleSchema>;
  loveStory: z.infer<typeof loveStoryItemSchema>[];
  bankAccounts: z.infer<typeof bankAccountItemSchema>[];
  settings: z.infer<typeof invitationSettingsSchema>;
  events: PublicEventDTO[];
  theme: {
    rendererKey: string;
    designTokens: Record<string, unknown>;
    layoutConfig: Record<string, unknown>;
  };
  media: PublicMediaDTO[];
  guestName?: string;
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
