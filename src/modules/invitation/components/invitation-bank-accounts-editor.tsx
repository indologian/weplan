"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CreditCard, Copy } from "lucide-react";
import { MediaUploader } from "@/modules/storage/components/media-uploader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import type { EditorDTO, SaveEditorContentAction } from "../types";

type Props = {
  invitationId: string;
  initialVersion: number;
  initialBankAccounts: EditorDTO["bankAccounts"];
  initialSettings: EditorDTO["settings"];
  saveEditorContent: SaveEditorContentAction;
};

export function InvitationBankAccountsEditor({
  invitationId,
  initialVersion,
  initialBankAccounts,
  initialSettings,
  saveEditorContent,
}: Props) {
  const [contentVersion, setContentVersion] = useState(initialVersion);
  const [accounts, setAccounts] = useState(initialBankAccounts);
  const [physicalGift, setPhysicalGift] = useState(initialSettings.physicalGift ?? { enabled: false, recipient: "", address: "" });
  const [isSaving, setIsSaving] = useState(false);

  const addAccount = () => {
    setAccounts((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        bankName: "",
        accountNumber: "",
        accountHolder: "",
      },
    ]);
  };

  const removeAccount = (id: string) => {
    if (!window.confirm("Hapus rekening ini? Perubahan berlaku setelah disimpan.")) return;
    setAccounts((current) => current.filter((acc) => acc.id !== id));
  };

  const updateAccount = (id: string, field: keyof EditorDTO["bankAccounts"][number], value: string) => {
    setAccounts((current) =>
      current.map((acc) => (acc.id === id ? { ...acc, [field]: value } : acc))
    );
  };

  const saveAccounts = async () => {
    // Validasi dasar
    if (accounts.some(a => !a.bankName.trim() || !a.accountNumber.trim() || !a.accountHolder.trim())) {
      toast.error("Harap isi semua kolom rekening yang kosong atau hapus rekening tersebut.");
      return;
    }

    setIsSaving(true);
    const result = await saveEditorContent({
      invitationId,
      expectedVersion: contentVersion,
      bankAccounts: accounts,
      settings: { ...initialSettings, physicalGift },
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setContentVersion(result.data.contentVersion);
    toast.success("Daftar rekening berhasil disimpan!");
  };
  const copyAccountNumber = async (value: string) => {
    try { await navigator.clipboard.writeText(value); }
    catch { const node=document.createElement("textarea"); node.value=value; node.style.position="fixed"; node.style.opacity="0"; document.body.appendChild(node); node.select(); document.execCommand("copy"); node.remove(); }
    toast.success("Nomor rekening disalin.");
  };

  return (
    <div className="space-y-6">
      {accounts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <h3 className="mb-2 text-lg font-semibold">Belum ada rekening</h3>
            <p className="mb-4 text-sm text-muted-foreground max-w-sm">
              Tambahkan rekening bank atau dompet digital (e-wallet) untuk mempermudah tamu memberikan hadiah (wedding gift).
            </p>
            <Button onClick={addAccount}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rekening Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {accounts.map((account, index) => (
            <Card key={account.id} className="relative">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                      {index + 1}
                    </span>
                    Informasi Rekening
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Hapus Rekening</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nama Bank / Dompet Digital</Label>
                    <Input
                      placeholder="Contoh: BCA / GoPay / OVO"
                      value={account.bankName}
                      onChange={(e) => updateAccount(account.id, "bankName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nomor Rekening / No. HP</Label>
                    <Input
                      placeholder="Contoh: 1234567890"
                      value={account.accountNumber}
                      onChange={(e) => updateAccount(account.id, "accountNumber", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Nama Pemilik Rekening</Label>
                    <Input
                      placeholder="Contoh: Beni Mustiko"
                      value={account.accountHolder}
                      onChange={(e) => updateAccount(account.id, "accountHolder", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>QRIS (opsional)</Label>
                    <MediaUploader invitationId={invitationId} kind="image" purpose="qris_image" currentMediaId={account.qrisMediaId} label="Unggah QRIS" onSuccess={(mediaId)=>updateAccount(account.id,"qrisMediaId",mediaId)}/>
                  </div>
                  <div className="md:col-span-2"><Button type="button" size="sm" variant="ghost" onClick={()=>void copyAccountNumber(account.accountNumber)}><Copy className="mr-2 h-4 w-4"/>Salin nomor</Button></div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={addAccount}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Rekening Baru
            </Button>

            <Button type="button" onClick={saveAccounts} disabled={isSaving} className="w-full sm:w-auto">
              {isSaving ? "Menyimpan..." : "Simpan Rekening"}
            </Button>
          </div>
        </div>
      )}
      <Card><CardHeader><CardTitle className="text-base">Hadiah fisik</CardTitle><CardDescription>Tampilkan alamat pengiriman hadiah pada undangan.</CardDescription></CardHeader><CardContent className="space-y-4"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={physicalGift.enabled} onChange={e=>setPhysicalGift({...physicalGift,enabled:e.target.checked})}/>Aktifkan pengiriman hadiah fisik</label>{physicalGift.enabled&&<><div className="space-y-2"><Label htmlFor="gift-recipient">Nama penerima</Label><Input id="gift-recipient" value={physicalGift.recipient??""} onChange={e=>setPhysicalGift({...physicalGift,recipient:e.target.value})}/></div><div className="space-y-2"><Label htmlFor="gift-address">Alamat lengkap</Label><textarea id="gift-address" className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm" value={physicalGift.address??""} onChange={e=>setPhysicalGift({...physicalGift,address:e.target.value})}/></div></>}<Button onClick={saveAccounts} disabled={isSaving||Boolean(physicalGift.enabled&&(!physicalGift.recipient?.trim()||!physicalGift.address?.trim()))}>{isSaving?"Menyimpan...":"Simpan pengaturan hadiah"}</Button></CardContent></Card>
    </div>
  );
}
