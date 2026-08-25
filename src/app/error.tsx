"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Terjadi kesalahan</h1>
        <p className="text-muted-foreground">Permintaan belum dapat diselesaikan.</p>
        <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={reset} type="button">Coba lagi</button>
      </div>
    </main>
  );
}
