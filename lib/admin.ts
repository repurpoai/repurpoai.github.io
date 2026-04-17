import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getViewerContext, type ViewerContext } from "@/lib/viewer";

export type AdminProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  tier: string | null;
  is_blocked: boolean | null;
  block_reason: string | null;
  blocked_until: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminLogRow = {
  id: string;
  actor_user_id: string | null;
  target_user_id: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function requireAdmin(): Promise<ViewerContext> {
  const viewer = await getViewerContext();

  if (!viewer) {
    redirect("/login");
  }

  const adminViewer = viewer as ViewerContext;

  if (adminViewer.role !== "admin") {
    redirect("/dashboard");
  }

  return adminViewer;
}

const LOG_PAGE_SIZE = 20;

export async function getAdminDashboardData(logPage = 1) {
  const admin = createAdminClient();
  const normalizedPage = Number.isFinite(logPage) && logPage > 0 ? Math.floor(logPage) : 1;
  const logOffset = (normalizedPage - 1) * LOG_PAGE_SIZE;
  const logLimit = LOG_PAGE_SIZE + 1;

  const [{ data: profiles }, { data: logs }, { data: settings }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, email, full_name, role, tier, is_blocked, block_reason, blocked_until, created_at, updated_at")
      .order("created_at", { ascending: false }),
    admin
      .from("user_logs")
      .select("id, actor_user_id, target_user_id, action, metadata, created_at")
      .order("created_at", { ascending: false })
      .range(logOffset, logOffset + logLimit - 1),
    admin
      .from("app_settings")
      .select("maintenance_mode, maintenance_message, allow_admin")
      .eq("id", 1)
      .maybeSingle()
  ]);

  const pagedLogs = (logs ?? []) as AdminLogRow[];
  const hasMoreLogs = pagedLogs.length > LOG_PAGE_SIZE;

  return {
    profiles: (profiles ?? []) as AdminProfileRow[],
    logs: hasMoreLogs ? pagedLogs.slice(0, LOG_PAGE_SIZE) : pagedLogs,
    logPage: normalizedPage,
    hasMoreLogs,
    settings: {
      maintenance_mode: Boolean(settings?.maintenance_mode),
      maintenance_message: typeof settings?.maintenance_message === "string" ? settings.maintenance_message : null,
      allow_admin: settings?.allow_admin !== false
    }
  };
}
