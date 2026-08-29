"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { actionDeleteInvitation } from "@/modules/invitation/server/actions";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteInvitationButton({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus undangan ini? Tindakan ini tidak dapat dibatalkan.")) return;
    
    setIsDeleting(true);
    const result = await actionDeleteInvitation(id);
    
    if (result.success) {
      toast.success("Undangan berhasil dihapus.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Gagal menghapus undangan.");
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash2 className="h-4 w-4 mr-1.5" />
      {isDeleting ? "Menghapus..." : "Hapus"}
    </Button>
  );
}
