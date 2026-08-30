"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { actionCreateCheckout } from "./checkout-action";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useEditorWorkspace } from "@/modules/invitation/components/editor/editor-workspace-context";
import { actionEvaluatePublishReadiness } from "@/modules/invitation/client-actions";

export function CheckoutButton({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(false);


  const { flushAll } = useEditorWorkspace();

  const handleCheckout = async () => {
    setLoading(true);
    
    // 1. Flush local changes
    const flushed = await flushAll();
    if (!flushed.success) {
      toast.error("Tidak dapat membuat checkout. Ada perubahan yang gagal disimpan.");
      setLoading(false);
      return;
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
    if (result.success && result.redirectUrl) {
      window.location.href = result.redirectUrl;
    } else {
      toast.error(result.error || "Gagal membuat tagihan pembayaran.");
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Publish & Bayar
    </Button>
  );
}
