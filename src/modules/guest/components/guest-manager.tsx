"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import type { GuestManagementDTO } from "../types";
import { actionDeleteGuest, actionGenerateGuestLink, actionMarkWaSent, actionModerateWish, actionSaveGuest } from "../actions";

type Draft={guestId?:string;name:string;phone:string;title:string;groupName:string;rsvpStatus:"pending"|"confirmed"|"declined";attendance:number};
const empty:Draft={name:"",phone:"",title:"",groupName:"",rsvpStatus:"pending",attendance:1};
export function GuestManager({invitationId,guests}:{invitationId:string;guests:GuestManagementDTO[]}) {
 const [draft,setDraft]=useState<Draft>(empty); const [pending,start]=useTransition();
 const run=(work:()=>Promise<{success:boolean;error?:string}>,ok:string)=>start(async()=>{const r=await work();if(!r.success)toast.error(r.error);else toast.success(ok);});
 const save=()=>run(async()=>{const r=await actionSaveGuest({...draft,invitationId});if(r.success)setDraft(empty);return r},"Data tamu disimpan.");
 const copy=async(value:string)=>{try{await navigator.clipboard.writeText(value)}catch{const node=document.createElement("textarea");node.value=value;node.style.position="fixed";node.style.opacity="0";document.body.appendChild(node);node.select();document.execCommand("copy");node.remove()}toast.success("Tautan disalin.")};
 return <div className="space-y-6">
  <Card><CardHeader><CardTitle>{draft.guestId?"Ubah tamu":"Tambah tamu"}</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
   <div><Label htmlFor="guest-name">Nama</Label><Input id="guest-name" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></div>
   <div><Label htmlFor="guest-phone">WhatsApp</Label><Input id="guest-phone" value={draft.phone} onChange={e=>setDraft({...draft,phone:e.target.value})}/></div>
   <div><Label htmlFor="guest-title">Sapaan</Label><Input id="guest-title" placeholder="Bapak/Ibu/Sdr." value={draft.title} onChange={e=>setDraft({...draft,title:e.target.value})}/></div>
   <div><Label htmlFor="guest-group">Grup</Label><Input id="guest-group" placeholder="Keluarga/Kantor" value={draft.groupName} onChange={e=>setDraft({...draft,groupName:e.target.value})}/></div>
   <div><Label htmlFor="guest-status">Status RSVP</Label><select id="guest-status" className="flex h-9 w-full rounded-md border bg-transparent px-3 text-sm" value={draft.rsvpStatus} onChange={e=>setDraft({...draft,rsvpStatus:e.target.value as Draft["rsvpStatus"],attendance:e.target.value==="declined"?0:Math.max(1,draft.attendance)})}><option value="pending">Menunggu</option><option value="confirmed">Hadir</option><option value="declined">Tidak hadir</option></select></div>
   <div><Label htmlFor="guest-attendance">Jumlah hadir</Label><Input id="guest-attendance" type="number" min={draft.rsvpStatus==="declined"?0:1} max={10} disabled={draft.rsvpStatus==="declined"} value={draft.attendance} onChange={e=>setDraft({...draft,attendance:Number(e.target.value)})}/></div>
   <div className="flex gap-2 md:col-span-2"><Button disabled={pending||!draft.name.trim()} onClick={save}>{pending?"Menyimpan...":"Simpan tamu"}</Button>{draft.guestId&&<Button variant="outline" onClick={()=>setDraft(empty)}>Batal</Button>}</div>
  </CardContent></Card>
  <div className="space-y-3">{guests.length===0&&<Card><CardContent className="py-10 text-center text-sm text-muted-foreground">Belum ada tamu. Tambahkan tamu pertama di atas.</CardContent></Card>}
  {guests.map(g=><Card key={g.id}><CardContent className="space-y-3 pt-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">{g.title?`${g.title} `:""}{g.name}</p><p className="text-sm text-muted-foreground">{g.phone||"Tanpa nomor"} · {g.groupName||"Tanpa grup"} · {g.rsvpStatus} ({g.attendance})</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={()=>setDraft({guestId:g.id,name:g.name,phone:g.phone??"",title:g.title??"",groupName:g.groupName??"",rsvpStatus:g.rsvpStatus,attendance:g.attendance})}>Ubah</Button><Button size="sm" variant="outline" onClick={()=>run(async()=>{const r=await actionGenerateGuestLink({invitationId,guestId:g.id});if(r.success)await copy(r.data.url);return r},"Tautan personal dibuat.")}>Buat ulang tautan</Button>{g.phone&&<Button size="sm" variant="outline" asChild><a target="_blank" rel="noreferrer" href={`https://wa.me/${g.phone.replace(/\D/g,"").replace(/^0/,"62")}`} onClick={()=>void actionMarkWaSent({invitationId,guestId:g.id})}>WhatsApp{g.isWaSent?" ✓":""}</a></Button>}<Button size="sm" variant="destructive" onClick={()=>{if(confirm(`Hapus ${g.name}?`))run(()=>actionDeleteGuest({invitationId,guestId:g.id}),"Tamu dihapus.")}}>Hapus</Button></div></div>
   {g.wishMessage&&<div className="rounded-md bg-muted p-3 text-sm"><p>“{g.wishMessage}”</p><div className="mt-2 flex gap-2"><span className="text-muted-foreground">Status: {g.wishStatus}</span>{(["approved","hidden","rejected"] as const).map(s=><button className="underline" key={s} onClick={()=>run(()=>actionModerateWish({invitationId,guestId:g.id,status:s}),"Status ucapan diperbarui.")}>{s}</button>)}</div></div>}
  </CardContent></Card>)}</div>
 </div>
}
