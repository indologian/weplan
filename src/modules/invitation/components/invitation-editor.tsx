"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SensitiveAuthForm } from "@/modules/auth/components/sensitive-auth-form";
import type { IssueSensitiveAuthAction } from "@/modules/auth/types";
import { AutosaveQueue, type AutosaveResult } from "../autosave-queue";
import type {
  DeleteEditorEventAction,
  EditorDTO,
  ReorderEditorEventsAction,
  SaveEditorContentAction,
  SaveEditorEventAction,
  UpdateEditorPrivacyAction,
} from "../types";

type EditorForm = {
  groomName: string;
  brideName: string;
  openingText: string;
  quoteText: string;
};

type Props = {
  initialData: EditorDTO;
  saveEditorContent: SaveEditorContentAction;
  saveEditorEvent: SaveEditorEventAction;
  deleteEditorEvent: DeleteEditorEventAction;
  reorderEditorEvents: ReorderEditorEventsAction;
  issueSensitiveAuth: IssueSensitiveAuthAction;
  updateEditorPrivacy: UpdateEditorPrivacyAction;
};

export function InvitationEditor({
  initialData,
  saveEditorContent,
  saveEditorEvent,
  deleteEditorEvent,
  reorderEditorEvents,
  issueSensitiveAuth,
  updateEditorPrivacy,
}: Props) {
  const [saveState, setSaveState] = useState<
    "saved" | "dirty" | "saving" | "error" | "conflict"
  >("saved");
  const [confirmReload, setConfirmReload] = useState(false);
  const [editorVersion, setEditorVersion] = useState(
    initialData.contentVersion,
  );
  const [localEditGeneration, setLocalEditGeneration] = useState(0);
  const [lastAckedGeneration, setLastAckedGeneration] = useState(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  const { control, register } = useForm<EditorForm>({
    defaultValues: {
      groomName: initialData.couple.groom?.name ?? "",
      brideName: initialData.couple.bride?.name ?? "",
      openingText: initialData.settings.openingText ?? "",
      quoteText: initialData.settings.quoteText ?? "",
    },
  });

  const [autosaveQueue] = useState(
    () =>
      new AutosaveQueue<EditorForm>(
        initialData.contentVersion,
        async (snapshot, expectedVersion): Promise<AutosaveResult> => {
          const result = await saveEditorContent({
            invitationId: initialData.invitationId,
            expectedVersion,
            couple: {
              ...initialData.couple,
              groom: { ...initialData.couple.groom, name: snapshot.groomName },
              bride: { ...initialData.couple.bride, name: snapshot.brideName },
            },
            settings: {
              ...initialData.settings,
              openingText: snapshot.openingText,
              quoteText: snapshot.quoteText,
            },
          });
          if (result.success)
            return {
              success: true,
              contentVersion: result.data.contentVersion,
            };
          return {
            success: false,
            code:
              result.code === "VERSION_CONFLICT" ||
              result.code === "VALIDATION_ERROR"
                ? result.code
                : "TEMPORARY_ERROR",
          };
        },
      ),
  );

  const groomName = useWatch({ control, name: "groomName" }) ?? "";
  const brideName = useWatch({ control, name: "brideName" }) ?? "";
  const openingText = useWatch({ control, name: "openingText" }) ?? "";
  const quoteText = useWatch({ control, name: "quoteText" }) ?? "";

  const flushSaveQueue = useCallback(async () => {
    if (!autosaveQueue.state.pendingSave) return;
    setSaveState("saving");
    const result = await autosaveQueue.flush();
    if (!result) return;
    if (!result.success) {
      setSaveState(result.code === "VERSION_CONFLICT" ? "conflict" : "error");
      return;
    }
    setEditorVersion(result.contentVersion);
    setLastAckedGeneration(autosaveQueue.state.lastAckedGeneration);
    setLocalEditGeneration(autosaveQueue.state.localEditGeneration);
    setSaveState("saved");
  }, [autosaveQueue]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const generation = autosaveQueue.markDirty({
      groomName,
      brideName,
      openingText,
      quoteText,
    });
    setLocalEditGeneration(generation);
    setSaveState("dirty");
  }, [autosaveQueue, groomName, brideName, openingText, quoteText]);

  useEffect(() => {
    if (localEditGeneration === 0 || saveState === "conflict") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSaveQueue(), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [flushSaveQueue, localEditGeneration, saveState]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (autosaveQueue.state.pendingSave && !autosaveQueue.state.isSaving) {
        void flushSaveQueue();
      }
    }, 30_000);
    const handlePageHide = () => {
      if (autosaveQueue.state.pendingSave && !autosaveQueue.state.isSaving) {
        void flushSaveQueue();
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [autosaveQueue, flushSaveQueue, lastAckedGeneration]);

  const handleEditorSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void flushSaveQueue();
  };

  return (
    <>
      <form onSubmit={handleEditorSubmit}>
        <header>
          <p>Editor undangan</p>
          <h1>{initialData.slug}</h1>
          <p aria-live="polite">
            {saveState === "saving" && "Menyimpan..."}
            {saveState === "saved" && "Tersimpan"}
            {saveState === "dirty" && "Ada perubahan"}
            {saveState === "error" && "Gagal menyimpan"}
            {saveState === "conflict" && "Perubahan di tempat lain"}
          </p>
        </header>
        {saveState === "conflict" && (
          <div role="alert">
            <p>Undangan berubah di tab atau perangkat lain.</p>
            {!confirmReload ? (
              <button type="button" onClick={() => setConfirmReload(true)}>
                Muat versi terbaru
              </button>
            ) : (
              <div>
                <p>
                  Perubahan lokal yang belum tersimpan akan diganti versi
                  server.
                </p>
                <button type="button" onClick={() => window.location.reload()}>
                  Lanjutkan
                </button>
                <button type="button" onClick={() => setConfirmReload(false)}>
                  Batal
                </button>
              </div>
            )}
          </div>
        )}
        <fieldset>
          <legend>Profil mempelai</legend>
          <label>
            Nama mempelai pria
            <input {...register("groomName")} />
          </label>
          <label>
            Nama mempelai wanita
            <input {...register("brideName")} />
          </label>
        </fieldset>
        <fieldset>
          <legend>Pembuka</legend>
          <label>
            Teks pembuka
            <textarea {...register("openingText")} />
          </label>
          <label>
            Kutipan atau doa
            <textarea {...register("quoteText")} />
          </label>
        </fieldset>
        <button type="submit" disabled={saveState === "saving"}>
          Simpan sekarang
        </button>
      </form>
      <InvitationEventsEditor
        invitationId={initialData.invitationId}
        initialEvents={initialData.events}
        contentVersion={editorVersion}
        saveEditorEvent={saveEditorEvent}
        deleteEditorEvent={deleteEditorEvent}
        reorderEditorEvents={reorderEditorEvents}
        onVersionChange={(version) => {
          setEditorVersion(version);
        }}
      />
      <InvitationPrivacyEditor
        invitationId={initialData.invitationId}
        contentVersion={editorVersion}
        initialIsPrivate={initialData.isPrivate}
        issueSensitiveAuth={issueSensitiveAuth}
        updateEditorPrivacy={updateEditorPrivacy}
        onVersionChange={setEditorVersion}
      />
    </>
  );
}

type PrivacyEditorProps = {
  invitationId: string;
  contentVersion: number;
  initialIsPrivate: boolean;
  issueSensitiveAuth: IssueSensitiveAuthAction;
  updateEditorPrivacy: UpdateEditorPrivacyAction;
  onVersionChange: (version: number) => void;
};

function InvitationPrivacyEditor({
  invitationId,
  contentVersion,
  initialIsPrivate,
  issueSensitiveAuth,
  updateEditorPrivacy,
  onVersionChange,
}: PrivacyEditorProps) {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [pin, setPin] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const updatePrivacy = async () => {
    setPending(true);
    const result = await updateEditorPrivacy({
      invitationId,
      expectedVersion: contentVersion,
      isPrivate,
      ...(pin ? { pin } : {}),
    });
    setPending(false);
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    setPin("");
    setAuthenticated(false);
    onVersionChange(result.data.contentVersion);
    setMessage("Pengaturan privasi tersimpan.");
  };

  return (
    <section>
      <h2>Privasi undangan</h2>
      <label>
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={(event) => {
            setIsPrivate(event.target.checked);
            setAuthenticated(false);
          }}
        />
        Gunakan PIN untuk undangan ini
      </label>
      {isPrivate && (
        <label>
          PIN baru (opsional jika memakai PIN lama)
          <input
            value={pin}
            inputMode="numeric"
            autoComplete="new-password"
            onChange={(event) => setPin(event.target.value)}
          />
        </label>
      )}
      {!authenticated ? (
        <SensitiveAuthForm
          issueSensitiveAuth={issueSensitiveAuth}
          onAuthenticated={() => setAuthenticated(true)}
        />
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => void updatePrivacy()}
        >
          {pending ? "Menyimpan..." : "Simpan pengaturan privasi"}
        </button>
      )}
      <p aria-live="polite">{message}</p>
    </section>
  );
}

type EventEditorProps = {
  invitationId: string;
  initialEvents: EditorDTO["events"];
  contentVersion: number;
  saveEditorEvent: SaveEditorEventAction;
  deleteEditorEvent: DeleteEditorEventAction;
  reorderEditorEvents: ReorderEditorEventsAction;
  onVersionChange: (version: number) => void;
};

type EditableEvent = Omit<EditorDTO["events"][number], "eventId"> & {
  eventId?: string;
  localId: string;
};

function InvitationEventsEditor({
  invitationId,
  initialEvents,
  contentVersion,
  saveEditorEvent,
  deleteEditorEvent,
  reorderEditorEvents,
  onVersionChange,
}: EventEditorProps) {
  const [events, setEvents] = useState<EditableEvent[]>(() =>
    initialEvents.map((event) => ({
      ...event,
      localId: event.eventId,
    })),
  );
  const [message, setMessage] = useState("");

  const saveEvent = async (event: EditableEvent) => {
    const result = await saveEditorEvent({
      invitationId,
      expectedVersion: contentVersion,
      ...(event.eventId ? { eventId: event.eventId } : {}),
      data: {
        position: event.position,
        eventType: event.eventType,
        title: event.title,
        ...(event.startsAt ? { startsAt: event.startsAt } : {}),
        ...(event.endsAt ? { endsAt: event.endsAt } : {}),
        ...(event.timezone ? { timezone: event.timezone } : {}),
        venueName: event.venueName,
        address: event.address,
        ...(event.latitude === null ? {} : { latitude: event.latitude }),
        ...(event.longitude === null ? {} : { longitude: event.longitude }),
      },
    });
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    onVersionChange(result.data.contentVersion);
    setEvents((current) =>
      current.map((item) =>
        item.localId === event.localId
          ? { ...item, eventId: result.data.eventId }
          : item,
      ),
    );
    setMessage("Acara tersimpan");
  };

  const removeEvent = async (eventId: string) => {
    const result = await deleteEditorEvent({
      invitationId,
      expectedVersion: contentVersion,
      eventId,
    });
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    const nextVersion = result.data.contentVersion;
    onVersionChange(nextVersion);
    setEvents((current) =>
      current.filter((event) => event.eventId !== eventId),
    );
    setMessage("Acara dihapus");
  };

  const moveEvent = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= events.length) return;
    const reordered = [...events];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    if (reordered.some((event) => !event.eventId)) {
      setMessage("Simpan semua acara baru sebelum mengubah urutan.");
      return;
    }
    const result = await reorderEditorEvents({
      invitationId,
      expectedVersion: contentVersion,
      eventIds: reordered.map((event) => {
        if (!event.eventId)
          throw new Error("Unsaved event cannot be reordered");
        return event.eventId;
      }),
    });
    if (!result.success) {
      setMessage(result.error);
      return;
    }
    const nextVersion = result.data.contentVersion;
    onVersionChange(nextVersion);
    setEvents(reordered.map((event, position) => ({ ...event, position })));
    setMessage("Urutan acara tersimpan");
  };

  return (
    <section>
      <h2>Detail acara</h2>
      <p aria-live="polite">{message}</p>
      <button
        type="button"
        onClick={() =>
          setEvents((current) => [
            ...current,
            {
              localId: crypto.randomUUID(),
              position: current.length,
              title: "",
              eventType: "other",
              startsAt: null,
              endsAt: null,
              timezone: null,
              venueName: "",
              address: "",
              latitude: null,
              longitude: null,
            },
          ])
        }
      >
        Tambah acara
      </button>
      {events.map((event, index) => (
        <article key={event.localId}>
          <label>
            Nama acara
            <input
              value={event.title}
              onChange={(change) =>
                setEvents((current) =>
                  current.map((item) =>
                    item.localId === event.localId
                      ? { ...item, title: change.target.value }
                      : item,
                  ),
                )
              }
            />
          </label>
          <label>
            Waktu ISO dengan offset
            <input
              value={event.startsAt ?? ""}
              placeholder="2026-08-26T09:00:00+07:00"
              onChange={(change) =>
                setEvents((current) =>
                  current.map((item) =>
                    item.localId === event.localId
                      ? { ...item, startsAt: change.target.value || null }
                      : item,
                  ),
                )
              }
            />
          </label>
          <label>
            Timezone IANA
            <input
              value={event.timezone ?? ""}
              placeholder="Asia/Jakarta"
              onChange={(change) =>
                setEvents((current) =>
                  current.map((item) =>
                    item.localId === event.localId
                      ? { ...item, timezone: change.target.value || null }
                      : item,
                  ),
                )
              }
            />
          </label>
          <button type="button" onClick={() => void saveEvent(event)}>
            Simpan acara
          </button>
          <button
            type="button"
            onClick={() =>
              event.eventId
                ? void removeEvent(event.eventId)
                : setEvents((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
            }
          >
            Hapus acara
          </button>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => void moveEvent(index, -1)}
          >
            Naik
          </button>
          <button
            type="button"
            disabled={index === events.length - 1}
            onClick={() => void moveEvent(index, 1)}
          >
            Turun
          </button>
        </article>
      ))}
    </section>
  );
}
