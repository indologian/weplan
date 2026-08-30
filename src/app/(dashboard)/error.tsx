"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="rounded-2xl border bg-card px-5 py-10 text-center text-card-foreground sm:px-8 sm:py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold">Dashboard belum dapat dimuat</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Data undangan Anda tetap aman. Coba muat ulang halaman, atau kembali lagi beberapa saat lagi.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button type="button" className="h-11" onClick={retry}>
            <RefreshCw aria-hidden="true" />
            Coba Lagi
          </Button>
          <Button asChild variant="outline" className="h-11">
            <Link href="/">Kembali ke Beranda</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
