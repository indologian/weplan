export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-32 animate-pulse rounded bg-[#e5e7eb]" />
          <div className="mt-1 h-4 w-48 animate-pulse rounded bg-[#e5e7eb]" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-[#e5e7eb]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-[#e5e7eb] bg-white p-5">
            <div className="mb-3 flex items-start justify-between">
              <div className="h-5 w-36 animate-pulse rounded bg-[#e5e7eb]" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-[#e5e7eb]" />
            </div>
            <div className="mb-4 h-3 w-24 animate-pulse rounded bg-[#e5e7eb]" />
            <div className="flex gap-2">
              <div className="h-7 w-24 animate-pulse rounded-lg bg-[#e5e7eb]" />
              <div className="h-7 w-20 animate-pulse rounded-lg bg-[#e5e7eb]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
