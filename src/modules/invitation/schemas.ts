import { z } from "zod";

const SOCIAL_HOSTS: Readonly<Record<"instagram" | "tiktok" | "facebook", ReadonlySet<string>>> = {
  instagram: new Set(["instagram.com", "www.instagram.com"]),
  tiktok: new Set(["tiktok.com", "www.tiktok.com"]),
  facebook: new Set(["facebook.com", "www.facebook.com", "fb.com", "www.fb.com"]),
};

const COMMON_PIN_BLOCKLIST = new Set([
  "112233",
  "123321",
  "147258",
  "159753",
  "258369",
  "520520",
  "1314520",
]);

function getIsoOffsetMinutes(value: string): number | null {
  if (value.endsWith("Z")) return 0;
  const match = value.match(/([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1] === "+" ? 1 : -1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

function getIanaOffsetMinutes(value: string, timezone: string): number | null {
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    }).formatToParts(new Date(value)).find(({ type }) => type === "timeZoneName")?.value;
    if (part === "GMT" || part === "UTC") return 0;
    const match = part?.match(/^(?:GMT|UTC)([+-])(\d{2}):(\d{2})$/);
    if (!match) return null;
    const sign = match[1] === "+" ? 1 : -1;
    return sign * (Number(match[2]) * 60 + Number(match[3]));
  } catch {
    return null;
  }
}

export function isValidIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return value.includes("/") || value === "UTC";
  } catch {
    return false;
  }
}

function hasMatchingIanaOffset(value: string, timezone: string): boolean {
  const isoOffset = getIsoOffsetMinutes(value);
  const ianaOffset = getIanaOffsetMinutes(value, timezone);
  return isoOffset !== null && ianaOffset !== null && isoOffset === ianaOffset;
}

export function isWeakPin(pin: string): boolean {
  if (/^(\d)\1+$/.test(pin)) return true;

  const digits = [...pin].map(Number);
  const isAscending = digits.every((digit, index) => index === 0 || digit === digits[index - 1]! + 1);
  const isDescending = digits.every((digit, index) => index === 0 || digit === digits[index - 1]! - 1);
  if (isAscending || isDescending) return true;

  for (let patternLength = 1; patternLength <= Math.floor(pin.length / 2); patternLength += 1) {
    if (pin.length % patternLength === 0) {
      const pattern = pin.slice(0, patternLength);
      if (pattern.repeat(pin.length / patternLength) === pin) return true;
    }
  }

  return COMMON_PIN_BLOCKLIST.has(pin);
}

const socialLinkSchema = z.object({
  provider: z.enum(["instagram", "tiktok", "facebook", "website"]),
  url: z.url().max(1000),
}).strict().superRefine((link, context) => {
  const url = new URL(link.url);
  if (url.protocol !== "https:") {
    context.addIssue({ code: "custom", message: "Social links must use HTTPS", path: ["url"] });
    return;
  }

  if (link.provider !== "website" && !SOCIAL_HOSTS[link.provider].has(url.hostname.toLowerCase())) {
    context.addIssue({ code: "custom", message: "Social link host does not match its provider", path: ["url"] });
  }
});

export const couplePersonSchema = z.object({
  name: z.string().trim().max(160).optional(),
  nickname: z.string().trim().max(80).optional(),
  parentNames: z.array(z.string().trim().max(160)).optional(),
  photoMediaId: z.uuid().optional(),
  socialLinks: z.array(socialLinkSchema).optional(),
}).strict();

export const invitationCoupleSchema = z.object({
  groom: couplePersonSchema.optional(),
  bride: couplePersonSchema.optional(),
}).strict();

export const invitationEventDraftSchema = z.object({
  position: z.number().int().min(0).max(32767).default(0),
  eventType: z.string().trim().min(1).max(80).default("other"),
  title: z.string().trim().max(160).default(""),
  startsAt: z.iso.datetime({ offset: true }).optional(),
  endsAt: z.iso.datetime({ offset: true }).optional(),
  timezone: z.string().trim().min(3).max(64).optional(),
  venueName: z.string().trim().max(240).default(""),
  address: z.string().trim().max(1000).default(""),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
}).strict().superRefine((event, context) => {
  if ((event.latitude === undefined) !== (event.longitude === undefined)) {
    context.addIssue({ code: "custom", message: "Latitude and longitude must be provided together" });
  }
  if (event.endsAt && !event.startsAt) {
    context.addIssue({ code: "custom", message: "End time requires a start time", path: ["endsAt"] });
  }
  if (event.endsAt && event.startsAt && Date.parse(event.endsAt) < Date.parse(event.startsAt)) {
    context.addIssue({ code: "custom", message: "End time cannot be before start time", path: ["endsAt"] });
  }
  if (event.timezone && !isValidIanaTimezone(event.timezone)) {
    context.addIssue({ code: "custom", message: "Timezone must be a valid IANA timezone", path: ["timezone"] });
  }
  if (event.timezone && event.startsAt && !hasMatchingIanaOffset(event.startsAt, event.timezone)) {
    context.addIssue({ code: "custom", message: "Start time offset must match the IANA timezone", path: ["startsAt"] });
  }
  if (event.timezone && event.endsAt && !hasMatchingIanaOffset(event.endsAt, event.timezone)) {
    context.addIssue({ code: "custom", message: "End time offset must match the IANA timezone", path: ["endsAt"] });
  }
});

const createCouplePersonSchema = couplePersonSchema.omit({ photoMediaId: true });

export const invitationCreateOrSyncSchema = z.object({
  clientRef: z.uuid(),
  themeId: z.uuid(),
  couple: z.object({
    groom: createCouplePersonSchema.optional(),
    bride: createCouplePersonSchema.optional(),
  }).strict().default({}),
  initialEventDraft: invitationEventDraftSchema.optional(),
}).strict();

export type InvitationCreateOrSyncInput = z.infer<typeof invitationCreateOrSyncSchema>;

export const loveStoryItemSchema = z.object({
  id: z.uuid(),
  date: z.string().trim().max(80).optional(),
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(2000).optional(),
  photoMediaId: z.uuid().optional(),
}).strict();

export const bankAccountItemSchema = z.object({
  id: z.uuid(),
  bankName: z.string().trim().max(160),
  accountNumber: z.string().trim().max(80),
  accountHolder: z.string().trim().max(160),
  qrisMediaId: z.uuid().optional(),
}).strict();

export const invitationSettingsSchema = z.object({
  openingText: z.string().trim().max(1000).nullish(),
  quoteText: z.string().trim().max(500).nullish(),
  backgroundAudioMediaId: z.uuid().nullish(),
  videoEmbeds: z.array(z.object({
    id: z.uuid(),
    kind: z.enum(["video", "live"]),
    provider: z.literal("youtube"),
    externalId: z.string().trim().regex(/^[A-Za-z0-9_-]{11}$/),
    title: z.string().trim().max(160).optional(),
  }).strict()).nullish(),
  physicalGift: z.object({
    enabled: z.boolean(),
    recipient: z.string().trim().max(160).optional(),
    address: z.string().trim().max(1000).optional(),
  }).strict().nullish(),
  sectionVisibility: z.record(z.string().trim().min(1).max(80), z.boolean()).nullish(),
  themeOverrides: z.record(z.string().trim().min(1).max(80), z.unknown()).nullish(),
}).strict().superRefine((settings, context) => {
  if (settings.physicalGift?.enabled && !settings.physicalGift.recipient?.trim()) context.addIssue({ code:"custom", path:["physicalGift","recipient"], message:"Nama penerima hadiah wajib diisi." });
  if (settings.physicalGift?.enabled && !settings.physicalGift.address?.trim()) context.addIssue({ code:"custom", path:["physicalGift","address"], message:"Alamat hadiah wajib diisi." });
});

export const editorContentAutosaveSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  couple: invitationCoupleSchema.optional(),
  loveStory: z.array(loveStoryItemSchema).optional(),
  bankAccounts: z.array(bankAccountItemSchema).optional(),
  settings: invitationSettingsSchema.optional(),
}).strict();

export type EditorContentAutosaveInput = z.infer<typeof editorContentAutosaveSchema>;

export const editorGalleryReplaceSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  mediaAssetIds: z.array(z.uuid()).max(100),
}).strict().superRefine((input, context) => {
  if (new Set(input.mediaAssetIds).size !== input.mediaAssetIds.length) {
    context.addIssue({
      code: "custom",
      message: "Galeri tidak boleh memuat media yang sama lebih dari sekali.",
      path: ["mediaAssetIds"],
    });
  }
});

export type EditorGalleryReplaceInput = z.infer<typeof editorGalleryReplaceSchema>;

export const editorEventSaveSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  eventId: z.uuid().optional(),
  data: invitationEventDraftSchema,
}).strict();

export type EditorEventSaveInput = z.infer<typeof editorEventSaveSchema>;

export const editorEventReorderSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  eventIds: z.array(z.uuid()).max(20).refine(
    (eventIds) => new Set(eventIds).size === eventIds.length,
    { message: "Event IDs must be unique" },
  ),
}).strict();

export type EditorEventReorderInput = z.infer<typeof editorEventReorderSchema>;

export const editorEventDeleteSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  eventId: z.uuid(),
}).strict();

export type EditorEventDeleteInput = z.infer<typeof editorEventDeleteSchema>;

export const editorUpdateThemeSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  themeId: z.uuid(),
}).strict();

export type EditorUpdateThemeInput = z.infer<typeof editorUpdateThemeSchema>;

export const editorUpdatePrivacySchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  isPrivate: z.boolean(),
  pin: z.string().regex(/^[0-9]{6,10}$/, "PIN must contain 6 to 10 digits").optional(),
}).strict().superRefine((data, context) => {
  if (data.pin && isWeakPin(data.pin)) {
    context.addIssue({ code: "custom", message: "PIN is too easy to guess", path: ["pin"] });
  }
});

export type EditorUpdatePrivacyInput = z.infer<typeof editorUpdatePrivacySchema>;

export const editorUpdateRsvpConfigSchema = z.object({
  invitationId: z.uuid(),
  expectedVersion: z.number().int().min(1),
  rsvpMode: z.enum(["personal_only", "open"]),
  guestbookModeration: z.enum(["auto", "manual"]),
}).strict();

export type EditorUpdateRsvpConfigInput = z.infer<typeof editorUpdateRsvpConfigSchema>;
