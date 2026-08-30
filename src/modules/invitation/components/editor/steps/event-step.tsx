"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/shared/components/ui/alert-dialog";
import { useEditorWorkspace } from "../editor-workspace-context";
import type { EditorDTO, SaveEditorEventAction, DeleteEditorEventAction, ReorderEditorEventsAction } from "../../../types";

type EditableEvent = Omit<EditorDTO["events"][number], "eventId"> & {
  eventId?: string;
  localId: string;
};

type Props = {
  invitationId: string;
  initialEvents: EditorDTO["events"];
  saveEditorEvent: SaveEditorEventAction;
  deleteEditorEvent: DeleteEditorEventAction;
  reorderEditorEvents: ReorderEditorEventsAction;
};

function formatForInput(isoString?: string | null) {
  if (!isoString) return "";
  return isoString.substring(0, 16);
}

function buildIsoString(datetimeLocalStr: string | null | undefined, ianaTz: string) {
  if (!datetimeLocalStr) return null;
  // Parse purely for offset calculation
  const d = new Date(datetimeLocalStr + ':00Z');
  const options = { timeZone: ianaTz, timeZoneName: 'longOffset' as const };
  const str = new Intl.DateTimeFormat('en-US', options).format(d);
  const match = str.match(/GMT([+-]\d{2}:\d{2})/);
  let offset = '+00:00';
  if (match && match[1]) offset = match[1];
  else {
    const matchShort = str.match(/GMT([+-]\d{2})/);
    if (matchShort && matchShort[1]) offset = matchShort[1] + ':00';
    else if (str.includes('GMT')) offset = '+00:00';
  }
  return datetimeLocalStr + ':00' + offset;
}

const COMMON_TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB (Jakarta)" },
  { value: "Asia/Makassar", label: "WITA (Makassar)" },
  { value: "Asia/Jayapura", label: "WIT (Jayapura)" },
];

export function EventStep({
  invitationId,
  initialEvents,
  saveEditorEvent,
  deleteEditorEvent,
  reorderEditorEvents,
}: Props) {
  const { contentVersion, commitRevision, flushAll, registerSection, unregisterSection, setSectionState, setConflictState } = useEditorWorkspace();
  const [events, setEvents] = useState<EditableEvent[]>(() =>
    initialEvents.map((event) => ({
      ...event,
      localId: event.eventId,
    }))
  );
  
  const [dirtyEventIds, setDirtyEventIds] = useState<Set<string>>(new Set());
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (dirtyEventIds.size > 0) {
      setSectionState("events", "dirty");
    } else {
      setSectionState("events", "saved");
    }
  }, [dirtyEventIds, setSectionState]);

  const flushAllDirtyEvents = useCallback(async (currentVersion: number) => {
    if (dirtyEventIds.size === 0) return { success: true as const, version: currentVersion };
    
    setSectionState("events", "saving");
    let versionToUse = currentVersion;
    let hasError = false;
    let conflict = false;
    let errCode = "";
    
    const dirtyIds = Array.from(dirtyEventIds);
    for (const localId of dirtyIds) {
      const eventToSave = events.find(e => e.localId === localId);
      if (!eventToSave) continue;
      
      const result = await saveEditorEvent({
        invitationId,
        expectedVersion: versionToUse,
        ...(eventToSave.eventId ? { eventId: eventToSave.eventId } : {}),
        data: {
          position: eventToSave.position,
          eventType: eventToSave.eventType,
          title: eventToSave.title,
          ...(eventToSave.startsAt ? { startsAt: eventToSave.startsAt } : {}),
          ...(eventToSave.endsAt ? { endsAt: eventToSave.endsAt } : {}),
          ...(eventToSave.timezone ? { timezone: eventToSave.timezone } : {}),
          venueName: eventToSave.venueName,
          address: eventToSave.address,
          ...(eventToSave.latitude === null ? {} : { latitude: eventToSave.latitude }),
          ...(eventToSave.longitude === null ? {} : { longitude: eventToSave.longitude }),
        },
      });
      
      if (!result.success) {
        if (result.code === "VERSION_CONFLICT") {
          conflict = true;
        }
        hasError = true;
        errCode = result.code;
        break;
      }
      
      versionToUse = result.data.contentVersion;
      
      setEvents((current) =>
        current.map((item) =>
          item.localId === localId
            ? { ...item, eventId: result.data.eventId }
            : item
        )
      );
      
      setDirtyEventIds(prev => {
        const next = new Set(prev);
        next.delete(localId);
        return next;
      });
    }

    if (hasError) {
      if (conflict) {
        setConflictState(true);
        setSectionState("events", "conflict");
      } else {
        setSectionState("events", "error");
      }
      return { success: false as const, error: errCode };
    }
    
    setSectionState("events", "saved");
    return { success: true as const, version: versionToUse };
  }, [dirtyEventIds, events, saveEditorEvent, invitationId, setSectionState, setConflictState]);

  useEffect(() => {
    registerSection("events", flushAllDirtyEvents);
    return () => unregisterSection("events");
  }, [registerSection, unregisterSection, flushAllDirtyEvents]);

  const removeEvent = async (eventId: string) => {
    setPending(true);
    const flushed = await flushAll();
    if (!flushed.success) {
      setPending(false);
      setEventToDelete(null);
      toast.error("Gagal menyimpan perubahan sebelumnya. Silakan muat ulang versi terbaru.");
      return;
    }
    
    const result = await deleteEditorEvent({
      invitationId,
      expectedVersion: flushed.contentVersion,
      eventId,
    });
    setPending(false);
    setEventToDelete(null);
    
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    
    commitRevision(result.data.contentVersion);
    setEvents((current) => current.filter((event) => event.eventId !== eventId));
    setDirtyEventIds(prev => {
      const next = new Set(prev);
      const ev = events.find(e => e.eventId === eventId);
      if (ev) next.delete(ev.localId);
      return next;
    });
    toast.success("Acara dihapus!");
  };

  const moveEvent = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= events.length) return;
    
    if (events.some((event) => !event.eventId) || dirtyEventIds.size > 0) {
      toast.error("Terdapat perubahan acara yang belum tersimpan. Tunggu sebentar lalu coba lagi.");
      return;
    }
    
    const reordered = [...events];
    [reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!];
    
    setPending(true);
    const flushed = await flushAll();
    if (!flushed.success) {
      setPending(false);
      toast.error("Gagal menyimpan perubahan sebelumnya.");
      return;
    }
    
    const result = await reorderEditorEvents({
      invitationId,
      expectedVersion: flushed.contentVersion,
      eventIds: reordered.map((e) => e.eventId!),
    });
    setPending(false);
    
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    
    commitRevision(result.data.contentVersion);
    setEvents(reordered.map((event, position) => ({ ...event, position })));
    toast.success("Urutan acara tersimpan!");
  };

  const handleUpdate = (localId: string, updates: Partial<EditableEvent>) => {
    setEvents((current) =>
      current.map((item) =>
        item.localId === localId ? { ...item, ...updates } : item
      )
    );
    setDirtyEventIds(prev => new Set(prev).add(localId));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <CardTitle>Detail Acara</CardTitle>
            <CardDescription>Atur jadwal akad, resepsi, dan rangkaian acara lainnya.</CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const newId = crypto.randomUUID();
              setEvents((current) => [
                ...current,
                {
                  localId: newId,
                  position: current.length,
                  title: "",
                  eventType: "other",
                  startsAt: null,
                  endsAt: null,
                  timezone: "Asia/Jakarta",
                  venueName: "",
                  address: "",
                  latitude: null,
                  longitude: null,
                },
              ]);
              setDirtyEventIds(prev => new Set(prev).add(newId));
            }}
            className="gap-1 shrink-0"
          >
            <Plus className="w-4 h-4" /> Tambah Acara
          </Button>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {events.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Belum ada acara yang ditambahkan.
            </div>
          )}

          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.localId} className="border rounded-lg p-4 sm:p-5 space-y-6 bg-card shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
                  <h3 className="font-semibold text-lg truncate pr-4">{event.title || "Acara Baru"}</h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={index === 0 || pending}
                      onClick={() => void moveEvent(index, -1)}
                      title="Geser ke atas"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={index === events.length - 1 || pending}
                      onClick={() => void moveEvent(index, 1)}
                      title="Geser ke bawah"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 ml-2"
                      disabled={pending}
                      onClick={() =>
                        event.eventId
                          ? setEventToDelete(event.eventId)
                          : (() => {
                              setEvents((current) => current.filter((_, itemIndex) => itemIndex !== index));
                              setDirtyEventIds(prev => {
                                const next = new Set(prev);
                                next.delete(event.localId);
                                return next;
                              });
                            })()
                      }
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Acara</Label>
                      <Input
                        value={event.title}
                        onChange={(e) => handleUpdate(event.localId, { title: e.target.value })}
                        placeholder="Contoh: Akad Nikah"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Zona Waktu</Label>
                      <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={event.timezone || "Asia/Jakarta"}
                        onChange={(e) => {
                          const newTz = e.target.value;
                          const newStartsAt = event.startsAt ? buildIsoString(formatForInput(event.startsAt), newTz) : null;
                          const newEndsAt = event.endsAt ? buildIsoString(formatForInput(event.endsAt), newTz) : null;
                          handleUpdate(event.localId, { timezone: newTz, startsAt: newStartsAt, endsAt: newEndsAt });
                        }}
                      >
                        {COMMON_TIMEZONES.map(tz => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Waktu Mulai</Label>
                      <Input
                        type="datetime-local"
                        value={formatForInput(event.startsAt)}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate(event.localId, {
                            startsAt: val ? buildIsoString(val, event.timezone || "Asia/Jakarta") : null,
                          });
                        }}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Waktu Selesai (Opsional)</Label>
                      <Input
                        type="datetime-local"
                        value={formatForInput(event.endsAt)}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate(event.localId, {
                            endsAt: val ? buildIsoString(val, event.timezone || "Asia/Jakarta") : null,
                          });
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nama Tempat / Gedung</Label>
                      <Input
                        value={event.venueName}
                        onChange={(e) => handleUpdate(event.localId, { venueName: e.target.value })}
                        placeholder="Contoh: Gedung Serbaguna"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Alamat Lengkap</Label>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={event.address}
                        onChange={(e) => handleUpdate(event.localId, { address: e.target.value })}
                        placeholder="Alamat lengkap acara..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Latitude (Opsional)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={event.latitude ?? ""}
                          onChange={(e) => handleUpdate(event.localId, { latitude: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="-6.200000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Longitude (Opsional)</Label>
                        <Input
                          type="number"
                          step="any"
                          value={event.longitude ?? ""}
                          onChange={(e) => handleUpdate(event.localId, { longitude: e.target.value ? parseFloat(e.target.value) : null })}
                          placeholder="106.816666"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Acara</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus acara ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (eventToDelete) void removeEvent(eventToDelete);
              }}
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
