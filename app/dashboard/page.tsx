import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { SiteHeader } from "@/components/site-header";
import { DashboardGenerator } from "@/app/dashboard/_components/dashboard-generator";
import { getViewerContext } from "@/lib/viewer";

export default async function DashboardPage() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.isBlocked) {
    redirect("/blocked");
  }

  const upgradeHref = "/pricing";

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-6">
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.10),transparent_35%),linear-gradient(180deg,#0f172a_0%,#020617_100%)] px-4 py-4 text-slate-50 shadow-soft">
          <SiteHeader
            links={[
              { href: "/pricing", label: "Pricing" },
              { href: "/history", label: "History" },
              { href: "/profile", label: "Profile" }
            ]}
          />
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 lg:flex-row lg:p-6">
        <Sidebar
          userName={viewer.userName}
          userEmail={viewer.email}
          tier={viewer.tier}
          usedThisMonth={viewer.usedThisMonth}
          monthlyLimit={viewer.monthlyLimit}
          remainingThisMonth={viewer.remainingThisMonth}
          imageUsedThisMonth={viewer.imageUsedThisMonth}
          imageMonthlyLimit={viewer.imageMonthlyLimit}
          imageRemainingThisMonth={viewer.imageRemainingThisMonth}
          usageWindowLabel={viewer.usageWindowLabel}
          isAdmin={viewer.isAdmin}
        />
        <section className="min-w-0 flex-1">
          <DashboardGenerator
            tier={viewer.tier}
            usedThisMonth={viewer.usedThisMonth}
            monthlyLimit={viewer.monthlyLimit}
            remainingThisMonth={viewer.remainingThisMonth}
            imageUsedThisMonth={viewer.imageUsedThisMonth}
            imageMonthlyLimit={viewer.imageMonthlyLimit}
            imageRemainingThisMonth={viewer.imageRemainingThisMonth}
            usageWindowLabel={viewer.usageWindowLabel}
            upgradeHref={upgradeHref}
          />
        </section>
      </div>
    </main>
  );
}
