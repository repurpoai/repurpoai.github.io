export function DashboardSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:p-6">
      <aside className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 lg:w-[320px]">
        <div className="h-10 w-40 rounded-2xl bg-white/10" />
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-white/10" />
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="h-4 w-36 rounded bg-white/10" />
        </div>
        <div className="h-24 rounded-2xl bg-white/10" />
        <div className="h-24 rounded-2xl bg-white/10" />
        <div className="h-10 rounded-2xl bg-white/10" />
      </aside>

      <section className="min-w-0 flex-1 space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="h-8 w-56 rounded bg-white/10" />
        <div className="h-4 w-80 rounded bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 rounded-3xl bg-white/10" />
          <div className="h-64 rounded-3xl bg-white/10" />
        </div>
        <div className="h-96 rounded-3xl bg-white/10" />
      </section>
    </div>
  );
}
