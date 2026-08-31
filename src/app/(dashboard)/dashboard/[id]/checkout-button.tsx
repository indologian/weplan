"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { actionCancelCheckout, actionCreateCheckout } from "./checkout-action";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useOptionalEditorWorkspace } from "@/modules/invitation/components/editor/editor-workspace-context";
import { actionEvaluatePublishReadiness } from "@/modules/invitation/client-actions";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";

type ActiveCheckout = {
  transactionId: string;
  paymentState: string;
  canCancel: boolean;
};

export function CheckoutButton({
  invitationId,
  flushEditorBeforeCheckout = true,
  className,
}: {
  invitationId: string;
  flushEditorBeforeCheckout?: boolean;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [activeCheckout, setActiveCheckout] = useState<ActiveCheckout | null>(null);
  const editorWorkspace = useOptionalEditorWorkspace();

  const redirectToCheckout = (redirectUrl: string) => {
    window.location.assign(redirectUrl);
  };

  const processCheckoutResult = (result: Awaited<ReturnType<typeof actionCreateCheckout>>) => {
    if (result.success && result.published) {
      toast.success("Undangan berhasil dipublikasikan.");
      window.location.reload();
      return true;
    }

    if (result.success && result.redirectUrl) {
      redirectToCheckout(result.redirectUrl);
      return true;
    }

    if (!result.success && result.code === "ALREADY_ACTIVE" && result.activeCheckout) {
      setActiveCheckout(result.activeCheckout);
      return false;
    }

    toast.error(result.error || "Gagal membuat tagihan pembayaran.");
    return false;
  };

  const handleCheckout = async () => {
    setLoading(true);
    
    if (flushEditorBeforeCheckout) {
      if (!editorWorkspace) {
        toast.error("Editor tidak tersedia. Muat ulang halaman dan coba lagi.");
        setLoading(false);
        return;
      }

      const flushed = await editorWorkspace.flushAll();
      if (!flushed.success) {
        toast.error("Tidak dapat membuat checkout. Ada perubahan yang gagal disimpan.");
        setLoading(false);
        return;
      }
    }
    
    // 2. Evaluate readiness
    const readiness = await actionEvaluatePublishReadiness(invitationId);
    if (!readiness.success || !readiness.data.isReady) {
      const issueMsg = readiness.success 
        ? readiness.data.issues.map(i => i.message).join("\\n") 
        : "Undangan belum lengkap.";
      toast.error("Undangan belum siap dipublish:\\n" + issueMsg);
      setLoading(false);
      return;
    }
    
    // 3. Create checkout
    const result = await actionCreateCheckout(invitationId);
    if (!processCheckoutResult(result)) {
      setLoading(false);
    }
  };

  const handleCancelAndRestart = async () => {
    if (!activeCheckout?.canCancel) return;

    setCancelling(true);
    const cancellation = await actionCancelCheckout(
      invitationId,
      activeCheckout.transactionId,
    );

    if (!cancellation.success) {
      if (cancellation.code === "ALREADY_FUNDED") {
        setActiveCheckout(null);
        const result = await actionCreateCheckout(invitationId);
        if (!processCheckoutResult(result)) {
          setCancelling(false);
        }
        return;
      }

      toast.error(cancellation.error || "Gagal membatalkan checkout pembayaran.");
      setCancelling(false);
      return;
    }

    setActiveCheckout(null);
    const result = await actionCreateCheckout(invitationId);
    if (!processCheckoutResult(result)) {
      setCancelling(false);
    }
  };

  return (
    <>
      <Button onClick={handleCheckout} disabled={loading} className={cn("gap-2", className)}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        Publish Undangan
      </Button>

      <AlertDialog
        open={activeCheckout !== null}
        onOpenChange={(open) => {
          if (!open && !cancelling) setActiveCheckout(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Checkout sebelumnya masih aktif</AlertDialogTitle>
            <AlertDialogDescription>
              {activeCheckout?.canCancel
                ? "Sesi pembayaran sebelumnya sudah tidak dapat dilanjutkan. Batalkan sesi tersebut untuk membuat checkout baru."
                : "Status pembayaran memerlukan pemeriksaan. Checkout baru tidak dapat dibuat agar pembayaran tidak tercatat ganda."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Tutup</AlertDialogCancel>
            {activeCheckout?.canCancel ? (
              <AlertDialogAction
                disabled={cancelling}
                onClick={(event) => {
                  event.preventDefault();
                  void handleCancelAndRestart();
                }}
              >
                {cancelling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Membatalkan...
                  </>
                ) : (
                  "Batalkan & Buat Baru"
                )}
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
