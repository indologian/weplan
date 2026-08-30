"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/shared/types/action-result";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Button } from "@/shared/components/ui/button";

export function DeleteInvitationButton({
  id,
  invitationName,
  deleteInvitation,
}: {
  id: string;
  invitationName: string;
  deleteInvitation: (id: string) => Promise<ActionResult<{ success: boolean }>>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteInvitation(id);
      if (!result.success) {
        setError(result.error ?? "Undangan belum dapat dihapus. Coba lagi.");
        return;
      }

      setOpen(false);
      toast.success("Undangan dihapus dari dashboard.");
      router.refresh();
    } catch {
      setError("Undangan belum dapat dihapus. Periksa koneksi lalu coba lagi.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isDeleting) return;
        setOpen(nextOpen);
        if (!nextOpen) setError(null);
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-11 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
          Hapus
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md rounded-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus undangan ini dari dashboard?</AlertDialogTitle>
          <AlertDialogDescription className="leading-relaxed">
            Undangan <span className="font-medium text-foreground">{invitationName}</span> dan halaman publiknya
            tidak akan dapat diakses setelah dihapus. Tindakan ini tidak menghapus data secara permanen.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting} className="h-11">Batal</AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            className="h-11"
            disabled={isDeleting}
            onClick={handleDelete}
          >
            {isDeleting ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            {isDeleting ? "Menghapus…" : "Hapus Undangan"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
