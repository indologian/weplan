"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { actionUpdateEditorRsvpConfig } from "@/modules/invitation/client-actions";
export function RsvpSettings({invitationId,initialVersion,initialMode,initialModeration}:{invitationId:string;initialVersion:number;initialMode:"personal_only"|"open";initialModeration:"auto"|"manual"}){
 const [version,setVersion]=useState(initialVersion),[mode,setMode]=useState(initialMode),[moderation,setModeration]=useState(initialModeration),[pending,start]=useTransition();
 return <Card><CardHeader><CardTitle>Pengaturan RSVP</CardTitle><CardDescription>Atur siapa yang dapat mengisi RSVP dan bagaimana ucapan ditampilkan.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="rsvp-mode">Akses RSVP</Label><select id="rsvp-mode" className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={mode} onChange={e=>setMode(e.target.value as typeof mode)}><option value="personal_only">Hanya tautan tamu personal</option><option value="open">Terbuka untuk pengunjung</option></select></div><div><Label htmlFor="moderation">Moderasi ucapan</Label><select id="moderation" className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={moderation} onChange={e=>setModeration(e.target.value as typeof moderation)}><option value="manual">Tinjau sebelum tampil</option><option value="auto">Tampilkan otomatis</option></select></div><div className="md:col-span-2"><Button disabled={pending} onClick={()=>start(async()=>{const r=await actionUpdateEditorRsvpConfig({invitationId,expectedVersion:version,rsvpMode:mode,guestbookModeration:moderation});if(r.success){setVersion(r.data.contentVersion);toast.success("Pengaturan RSVP disimpan.")}else toast.error(r.error)})}>{pending?"Menyimpan...":"Simpan pengaturan RSVP"}</Button></div></CardContent></Card>
}
