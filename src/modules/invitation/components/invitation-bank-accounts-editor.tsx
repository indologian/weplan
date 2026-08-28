"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, CreditCard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Label } from "@/shared/components/ui/label";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import type { EditorDTO, SaveEditorContentAction } from "../types";

type Props = {
  invitationId: string;
  initialVersion: number;
  initialBankAccounts: EditorDTO["bankAccounts"];
  saveEditorContent: SaveEditorContentAction;
};

export function InvitationBankAccountsEditor({
  invitationId,
  initialVersion,
  initialBankAccounts,
  saveEditorContent,
}: Props) {
  const [contentVersion, setContentVersion] = useState(initialVersion);
  const [accounts, setAccounts] = useState(initialBankAccounts);
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
    });
    setIsSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    setContentVersion(result.data.contentVersion);
    toast.success("Daftar rekening berhasil disimpan!");
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
    </div>
  );
}
