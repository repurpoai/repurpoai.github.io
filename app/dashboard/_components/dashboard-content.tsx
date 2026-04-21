import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { DashboardGenerator } from "@/app/dashboard/_components/dashboard-generator";
import { getViewerContext } from "@/lib/viewer";

export async function DashboardContent() {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/login");
  }

  if (viewer.isBlocked) {
    redirect("/blocked");
  }

  const upgradeHref = "/pricing";

  return (
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
  );
}
