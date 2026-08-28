import { isValidIanaTimezone } from "./schemas";

export type PublishReadinessIssueCode =
  | "BRIDE_NAME_REQUIRED"
  | "GROOM_NAME_REQUIRED"
  | "PUBLISHABLE_EVENT_REQUIRED"
  | "THEME_NOT_AVAILABLE"
  | "GALLERY_LIMIT_EXCEEDED"
  | "BANK_ACCOUNT_LIMIT_EXCEEDED"
  | "VIDEO_LIMIT_EXCEEDED"
  | "AUDIO_NOT_ALLOWED"
  | "MEDIA_NOT_READY"
  | "PIN_REQUIRED"
  | "RENDERER_CONFIG_INVALID"
  | "NOT_FOUND";

export type PublishReadinessIssue = {
  code: PublishReadinessIssueCode;
  path: string;
  message: string;
};

export type PublishReadinessSnapshot = {
  couple: {
    groom?: { name?: string };
    bride?: { name?: string };
  };
  events: Array<{ title: string; startsAt?: string; timezone?: string }>;
  theme: { isActive: boolean; rendererKey: string; rendererConfigValid: boolean } | null;
  knownRendererKeys: ReadonlySet<string>;
  usage: { galleryItems: number; bankAccounts: number; videoEmbeds: number; backgroundAudio: boolean };
  allowance: { galleryItems: number; bankAccounts: number; videoEmbeds: number; audioEnabled: boolean };
  referencedMediaIds: readonly string[];
  readyMediaIds: ReadonlySet<string>;
  isPrivate: boolean;
  hasPinCredential: boolean;
};

export type PublishReadinessResult = {
  isReady: boolean;
  issues: PublishReadinessIssue[];
};

export function evaluatePublishReadinessSnapshot(
  snapshot: PublishReadinessSnapshot,
): PublishReadinessResult {
  const issues: PublishReadinessIssue[] = [];

  if (!snapshot.couple.groom?.name?.trim()) {
    issues.push({ code: "GROOM_NAME_REQUIRED", path: "couple.groom.name", message: "Nama mempelai pria belum diisi." });
  }
  if (!snapshot.couple.bride?.name?.trim()) {
    issues.push({ code: "BRIDE_NAME_REQUIRED", path: "couple.bride.name", message: "Nama mempelai wanita belum diisi." });
  }

  const hasPublishableEvent = snapshot.events.some((event) => Boolean(
    event.title.trim()
    && event.startsAt
    && event.timezone
    && isValidIanaTimezone(event.timezone),
  ));
  if (!hasPublishableEvent) {
    issues.push({
      code: "PUBLISHABLE_EVENT_REQUIRED",
      path: "events",
      message: "Tambahkan minimal satu acara dengan judul, waktu mulai, dan zona waktu IANA yang valid.",
    });
  }

  if (!snapshot.theme?.isActive || !snapshot.knownRendererKeys.has(snapshot.theme.rendererKey)) {
    issues.push({ code: "THEME_NOT_AVAILABLE", path: "themeId", message: "Tema aktif belum memiliki renderer yang tersedia." });
  } else if (!snapshot.theme.rendererConfigValid) {
    issues.push({ code: "RENDERER_CONFIG_INVALID", path: "theme", message: "Konfigurasi renderer tema tidak valid." });
  }

  if (snapshot.usage.galleryItems > snapshot.allowance.galleryItems) {
    issues.push({
      code: "GALLERY_LIMIT_EXCEEDED",
      path: "gallery",
      message: "Jumlah foto galeri melebihi batas paket aktif.",
    });
  }
  if (snapshot.usage.bankAccounts > snapshot.allowance.bankAccounts) {
    issues.push({
      code: "BANK_ACCOUNT_LIMIT_EXCEEDED",
      path: "bankAccounts",
      message: "Jumlah rekening melebihi batas paket aktif.",
    });
  }
  if (snapshot.usage.videoEmbeds > snapshot.allowance.videoEmbeds) {
    issues.push({ code: "VIDEO_LIMIT_EXCEEDED", path: "settings.videoEmbeds", message: "Jumlah video melebihi batas paket aktif." });
  }
  if (snapshot.usage.backgroundAudio && !snapshot.allowance.audioEnabled) {
    issues.push({ code: "AUDIO_NOT_ALLOWED", path: "settings.backgroundAudioMediaId", message: "Paket aktif tidak mengizinkan audio latar." });
  }

  const missingMedia = snapshot.referencedMediaIds.filter((id) => !snapshot.readyMediaIds.has(id));
  if (missingMedia.length > 0) {
    issues.push({ code: "MEDIA_NOT_READY", path: "media", message: "Semua media final harus selesai diproses sebelum publish." });
  }

  if (snapshot.isPrivate && !snapshot.hasPinCredential) {
    issues.push({ code: "PIN_REQUIRED", path: "isPrivate", message: "Undangan private membutuhkan kredensial PIN." });
  }

  return { isReady: issues.length === 0, issues };
}
