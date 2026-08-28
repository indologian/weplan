"use client";

import { useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { actionCreateCheckout } from "./checkout-action";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function CheckoutButton({ invitationId }: { invitationId: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
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
