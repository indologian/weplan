import { z } from "zod";

const couplePersonSchema = z.object({
  name: z.string().trim().max(160).optional(),
  nickname: z.string().trim().max(80).optional(),
  parentNames: z.array(z.string().trim().max(160)).max(4).optional(),
}).strict();

const initialEventDraftSchema = z.object({
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
    context.addIssue({ code: "custom", message: "End time requires a start time" });
  }
  if (event.endsAt && event.startsAt && Date.parse(event.endsAt) < Date.parse(event.startsAt)) {
    context.addIssue({ code: "custom", message: "End time cannot be before start time" });
  }
});

export const invitationCreateOrSyncSchema = z.object({
  clientRef: z.uuid(),
  themeId: z.uuid(),
  couple: z.object({
    groom: couplePersonSchema.optional(),
    bride: couplePersonSchema.optional(),
  }).strict().default({}),
  initialEventDraft: initialEventDraftSchema.optional(),
}).strict();

export type InvitationCreateOrSyncInput = z.infer<typeof invitationCreateOrSyncSchema>;
