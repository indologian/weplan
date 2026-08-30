import { Skeleton } from "@/shared/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-7 sm:space-y-8" aria-label="Memuat daftar undangan" role="status">
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-full max-w-sm" />
        </div>
        <Skeleton className="h-11 w-40" />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-20" />
        </div>
        {[1, 2, 3].map((item) => (
          <div key={item} className="grid overflow-hidden rounded-2xl border sm:grid-cols-[9rem_minmax(0,1fr)]">
            <Skeleton className="aspect-[16/9] rounded-none sm:aspect-auto sm:min-h-48" />
            <div className="space-y-5 p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-2/3 max-w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-7 w-24" />
              </div>
              <Skeleton className="h-4 w-full max-w-md" />
              <div className="flex gap-2 border-t pt-4">
                <Skeleton className="h-11 w-36" />
                <Skeleton className="h-11 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Memuat…</span>
    </div>
  );
}
