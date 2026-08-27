import type { z } from "zod";
import type { ActionResult } from "@/shared/types/action-result";
import type {
  bankAccountItemSchema,
  editorEventDeleteSchema,
  editorEventReorderSchema,
  editorEventSaveSchema,
  editorUpdatePrivacySchema,
  invitationCoupleSchema,
  invitationSettingsSchema,
  loveStoryItemSchema,
} from "./schemas";

export type CreatedInvitation = {
  invitationId: string;
  slug: string;
  contentVersion: number;
};

export type EditorDTO = {
  invitationId: string;
  slug: string;
  status: "draft" | "published" | "expired" | "trashed";
  isPrivate: boolean;
  rsvpMode: "personal_only" | "open";
  guestbookModeration: "auto" | "manual";
  couple: z.infer<typeof invitationCoupleSchema>;
  loveStory: z.infer<typeof loveStoryItemSchema>[];
  bankAccounts: z.infer<typeof bankAccountItemSchema>[];
  settings: z.infer<typeof invitationSettingsSchema>;
  contentVersion: number;
  expiresAt: string | null;
  themeId: string;
  events: Array<{
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
  }>;
};

export type SaveEditorContentAction = (
  input: unknown,
) => Promise<ActionResult<{ contentVersion: number }>>;

export type SaveEditorEventAction = (
  input: z.input<typeof editorEventSaveSchema>,
) => Promise<ActionResult<{ contentVersion: number; eventId: string }>>;

export type DeleteEditorEventAction = (
  input: z.input<typeof editorEventDeleteSchema>,
) => Promise<ActionResult<{ contentVersion: number }>>;

export type ReorderEditorEventsAction = (
  input: z.input<typeof editorEventReorderSchema>,
) => Promise<ActionResult<{ contentVersion: number }>>;

export type UpdateEditorPrivacyAction = (
  input: z.input<typeof editorUpdatePrivacySchema>,
) => Promise<ActionResult<{ contentVersion: number }>>;

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