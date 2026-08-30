"use client";

import { useState } from "react";
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
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventStep({
  invitationId,
  initialEvents,
  saveEditorEvent,
  deleteEditorEvent,
  reorderEditorEvents,
}: Props) {
  const { contentVersion, setContentVersion } = useEditorWorkspace();
  const [events, setEvents] = useState<EditableEvent[]>(() =>
    initialEvents.map((event) => ({
      ...event,
      localId: event.eventId,
    }))
  );
  
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const saveEvent = async (event: EditableEvent) => {
    setPending(true);
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
    setPending(false);
    
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    
    toast.success("Acara berhasil disimpan!");
    setContentVersion(result.data.contentVersion);
    setEvents((current) =>
      current.map((item) =>
        item.localId === event.localId
          ? { ...item, eventId: result.data.eventId }
          : item
      )
    );
  };

  const removeEvent = async (eventId: string) => {
    setPending(true);
    const result = await deleteEditorEvent({
      invitationId,
      expectedVersion: contentVersion,
      eventId,
    });
    setPending(false);
    setEventToDelete(null);
    
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    
    setContentVersion(result.data.contentVersion);
    setEvents((current) =>
      current.filter((event) => event.eventId !== eventId)
    );
    toast.success("Acara dihapus!");
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
      toast.error("Simpan semua acara baru sebelum mengubah urutan.");
      return;
    }
    
    setPending(true);
    const result = await reorderEditorEvents({
      invitationId,
      expectedVersion: contentVersion,
      eventIds: reordered.map((e) => e.eventId!),
    });
    setPending(false);
    
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    
    setContentVersion(result.data.contentVersion);
    setEvents(reordered.map((event, position) => ({ ...event, position })));
    toast.success("Urutan acara tersimpan!");
  };

  const handleUpdate = (localId: string, updates: Partial<EditableEvent>) => {
    setEvents((current) =>
      current.map((item) =>
        item.localId === localId ? { ...item, ...updates } : item
      )
    );
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
                          : setEvents((current) =>
                              current.filter((_, itemIndex) => itemIndex !== index)
                            )
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
                      <Label>Waktu Mulai</Label>
                      <Input
                        type="datetime-local"
                        value={formatForInput(event.startsAt)}
                        onChange={(e) => {
                          const val = e.target.value;
                          handleUpdate(event.localId, {
                            startsAt: val ? new Date(val).toISOString() : null,
                            timezone: val ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
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
                            endsAt: val ? new Date(val).toISOString() : null,
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

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    disabled={pending}
                    onClick={() => void saveEvent(event)}
                  >
                    {pending ? "Menyimpan..." : "Simpan Acara Ini"}
                  </Button>
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
