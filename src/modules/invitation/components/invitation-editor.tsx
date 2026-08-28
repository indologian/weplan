"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SensitiveAuthForm } from "@/modules/auth/components/sensitive-auth-form";
import type { IssueSensitiveAuthAction } from "@/modules/auth/types";
import { AutosaveQueue, type AutosaveResult } from "../autosave-queue";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { RefreshCw, CheckCircle2, AlertCircle, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type {
  DeleteEditorEventAction,
  EditorDTO,
  ReorderEditorEventsAction,
  SaveEditorContentAction,
  SaveEditorEventAction,
  UpdateEditorPrivacyAction,
} from "../types";

const OPENING_TEMPLATES = [
  { label: "Formal", value: "Dengan memohon rahmat dan ridho Allah SWT, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami:" },
  { label: "Hangat", value: "Dengan penuh rasa syukur dan sukacita, kami bermaksud mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara pernikahan kami:" },
  { label: "Santai", value: "Tanpa mengurangi rasa hormat, kami mengundang teman-teman sekalian untuk hadir dan merayakan hari bahagia pernikahan kami:" },
  { label: "Kristen/Katolik", value: "Dalam kasih karunia Tuhan, kami bermaksud menyelenggarakan pemberkatan dan perayaan pernikahan putra-putri kami:" }
];

const QUOTE_TEMPLATES = [
  { label: "Islami", value: "\"Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya, dan dijadikan-Nya diantaramu rasa kasih dan sayang. Sesungguhnya pada yang demikian itu benar-benar terdapat tanda-tanda bagi kaum yang berfikir.\" (QS. Ar-Rum: 21)" },
  { label: "Kristen", value: "\"Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.\" (Matius 19:6)" },
  { label: "Katolik", value: "\"Cinta itu sabar; cinta itu murah hati; ia tidak cemburu. Ia tidak memegahkan diri dan tidak sombong.\" (1 Korintus 13:4)" },
  { label: "Umum / Romantis", value: "\"Dua jiwa namun satu pikiran, dua hati namun satu perasaan.\"" }
];

function formatForInput(isoString?: string | null) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

  const { control, register, setValue } = useForm<EditorForm>({
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
    <div className="space-y-8 pb-10">
      <form onSubmit={handleEditorSubmit} className="space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Editor Konten</h1>
            <div className="flex items-center gap-2 text-sm bg-muted/50 px-3 py-1.5 rounded-full" aria-live="polite">
              {saveState === "saving" && <><RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" /> <span className="text-muted-foreground font-medium">Menyimpan...</span></>}
              {saveState === "saved" && <><CheckCircle2 className="h-4 w-4 text-green-600" /> <span className="text-muted-foreground font-medium">Tersimpan</span></>}
              {saveState === "dirty" && <span className="text-muted-foreground font-medium italic">Ada perubahan...</span>}
              {saveState === "error" && <><AlertCircle className="h-4 w-4 text-destructive" /> <span className="text-destructive font-medium">Gagal menyimpan</span></>}
              {saveState === "conflict" && <><AlertCircle className="h-4 w-4 text-orange-500" /> <span className="text-orange-500 font-medium">Konflik versi</span></>}
            </div>
          </div>
          <p className="text-muted-foreground">Sesuaikan informasi undangan pernikahan Anda di bawah ini. Perubahan akan disimpan secara otomatis.</p>
        </div>

        {saveState === "conflict" && (
          <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-5 w-5" />
                  <p className="font-semibold">Undangan telah diubah di perangkat atau tab lain.</p>
                </div>
                {!confirmReload ? (
                  <Button type="button" variant="outline" className="w-fit" onClick={() => setConfirmReload(true)}>
                    Muat versi terbaru
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Perubahan lokal Anda yang belum tersimpan akan tertimpa dengan versi terbaru dari server. Apakah Anda yakin?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="destructive" onClick={() => window.location.reload()}>
                        Ya, Timpa Pekerjaan Saya
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setConfirmReload(false)}>
                        Batal
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Profil Mempelai</CardTitle>
            <CardDescription>Masukkan nama panggilan atau nama pendek kedua mempelai.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="groomName">Mempelai Pria</Label>
              <Input id="groomName" {...register("groomName")} placeholder="Contoh: Romeo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brideName">Mempelai Wanita</Label>
              <Input id="brideName" {...register("brideName")} placeholder="Contoh: Juliet" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembuka</CardTitle>
            <CardDescription>Teks sambutan dan kutipan (doa/puisi) di bagian atas undangan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label htmlFor="openingText">Teks Pembuka</Label>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center mr-1">Generator:</span>
                  {OPENING_TEMPLATES.map((tmpl) => (
                    <Button 
                      key={tmpl.label} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setValue("openingText", tmpl.value, { shouldDirty: true, shouldTouch: true })}
                    >
                      {tmpl.label}
                    </Button>
                  ))}
                </div>
              </div>
              <textarea 
                id="openingText" 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                {...register("openingText")} 
                placeholder="Dengan memohon rahmat dan ridho Allah SWT..." 
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <Label htmlFor="quoteText">Kutipan atau Doa</Label>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground self-center mr-1">Generator:</span>
                  {QUOTE_TEMPLATES.map((tmpl) => (
                    <Button 
                      key={tmpl.label} 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setValue("quoteText", tmpl.value, { shouldDirty: true, shouldTouch: true })}
                    >
                      {tmpl.label}
                    </Button>
                  ))}
                </div>
              </div>
              <textarea 
                id="quoteText" 
                className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                {...register("quoteText")} 
                placeholder="Dan di antara tanda-tanda kekuasaan-Nya..." 
              />
            </div>
          </CardContent>
        </Card>
        
        <button type="submit" className="sr-only" disabled={saveState === "saving"}>Simpan sekarang</button>
      </form>

      <div className="space-y-8">
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
      </div>
    </div>
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
    <Card>
      <CardHeader>
        <CardTitle>Privasi Undangan</CardTitle>
        <CardDescription>Atur siapa saja yang dapat mengakses undangan Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-3">
          <input
            id="isPrivate"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300"
            checked={isPrivate}
            onChange={(event) => {
              setIsPrivate(event.target.checked);
              setAuthenticated(false);
            }}
          />
          <Label htmlFor="isPrivate" className="font-medium">
            Gunakan PIN Keamanan
          </Label>
        </div>

        {isPrivate && (
          <div className="space-y-2 border-l-2 border-muted pl-4 ml-1">
            <Label htmlFor="pin">PIN Baru (Opsional jika ingin menggunakan PIN lama)</Label>
            <Input
              id="pin"
              type="password"
              className="max-w-xs"
              value={pin}
              inputMode="numeric"
              autoComplete="new-password"
              placeholder="Contoh: 123456"
              onChange={(event) => setPin(event.target.value)}
            />
          </div>
        )}

        {message && (
          <p className="text-sm font-medium text-green-600" aria-live="polite">{message}</p>
        )}

        <div className="pt-4 border-t">
          {!authenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Verifikasi password Anda untuk menyimpan pengaturan keamanan ini.</p>
              <SensitiveAuthForm
                issueSensitiveAuth={issueSensitiveAuth}
                onAuthenticated={() => setAuthenticated(true)}
              />
            </div>
          ) : (
            <Button
              type="button"
              disabled={pending}
              onClick={() => void updatePrivacy()}
            >
              {pending ? "Menyimpan..." : "Simpan Pengaturan Privasi"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
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
      reordered[target]!,
      reordered[index]!,
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
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle>Detail Acara</CardTitle>
          <CardDescription>Atur jadwal akad, resepsi, dan rangkaian acara lainnya.</CardDescription>
        </div>
        <Button
          type="button"
          size="sm"
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
          className="gap-1"
        >
          <Plus className="w-4 h-4" /> Tambah Acara
        </Button>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {message && (
          <p className="text-sm font-medium text-green-600 mb-4" aria-live="polite">{message}</p>
        )}
        
        {events.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            Belum ada acara yang ditambahkan.
          </div>
        )}

        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.localId} className="border rounded-lg p-5 space-y-6 bg-card shadow-sm">
              <div className="flex items-center justify-between border-b pb-4">
                <h3 className="font-semibold text-lg">{event.title || "Acara Baru"}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === 0}
                    onClick={() => void moveEvent(index, -1)}
                    title="Geser ke atas"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={index === events.length - 1}
                    onClick={() => void moveEvent(index, 1)}
                    title="Geser ke bawah"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 ml-2"
                    onClick={() =>
                      event.eventId
                        ? void removeEvent(event.eventId)
                        : setEvents((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                    }
                    title="Hapus Acara"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nama Acara</Label>
                <Input
                  value={event.title}
                  placeholder="Contoh: Akad Nikah / Resepsi"
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
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Waktu Mulai</Label>
                  <Input
                    type="datetime-local"
                    value={formatForInput(event.startsAt)}
                    onChange={(change) => {
                      const dt = change.target.value;
                      const isoStr = dt ? new Date(dt).toISOString() : null;
                      setEvents((current) =>
                        current.map((item) =>
                          item.localId === event.localId
                            ? { ...item, startsAt: isoStr }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Waktu Selesai</Label>
                    <div className="flex items-center gap-1.5">
                      <input 
                        type="checkbox" 
                        id={`until-finish-${event.localId}`}
                        checked={event.endsAt === null}
                        onChange={(e) => {
                          setEvents((current) =>
                            current.map((item) =>
                              item.localId === event.localId
                                ? { ...item, endsAt: e.target.checked ? null : item.startsAt }
                                : item,
                            ),
                          );
                        }}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor={`until-finish-${event.localId}`} className="text-xs text-muted-foreground cursor-pointer">
                        Selesai
                      </label>
                    </div>
                  </div>
                  <Input
                    type="datetime-local"
                    value={formatForInput(event.endsAt)}
                    disabled={event.endsAt === null}
                    onChange={(change) => {
                      const dt = change.target.value;
                      const isoStr = dt ? new Date(dt).toISOString() : null;
                      setEvents((current) =>
                        current.map((item) =>
                          item.localId === event.localId
                            ? { ...item, endsAt: isoStr }
                            : item,
                        ),
                      );
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Zona Waktu</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={event.timezone || "Asia/Jakarta"}
                    onChange={(change) => {
                       setEvents((current) =>
                        current.map((item) => item.localId === event.localId ? { ...item, timezone: change.target.value } : item)
                      );
                    }}
                  >
                    <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                    <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                    <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Lokasi/Gedung</Label>
                  <Input
                    value={event.venueName || ""}
                    placeholder="Contoh: Gedung Serbaguna Senayan"
                    onChange={(change) =>
                      setEvents((current) =>
                        current.map((item) =>
                          item.localId === event.localId
                            ? { ...item, venueName: change.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alamat Lengkap</Label>
                  <Input
                    value={event.address || ""}
                    placeholder="Jl. Pintu Satu Senayan..."
                    onChange={(change) =>
                      setEvents((current) =>
                        current.map((item) =>
                          item.localId === event.localId
                            ? { ...item, address: change.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => void saveEvent(event)}>
                  Simpan Perubahan Acara
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
