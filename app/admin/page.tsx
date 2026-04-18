import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getAdminDashboardData, requireAdmin } from "@/lib/admin";
import { updateMaintenanceAction, updateUserRoleAction, blockUserAction } from "@/app/admin/actions";
import { PageShell } from "@/components/page-shell";
import { SiteHeader } from "@/components/site-header";
import { FlashBanner } from "@/components/flash-banner";

const flashMessages: Record<string, { title: string; message: string; tone: "success" | "error" | "info" }> = {
  maintenance_saved: {
    title: "Saved",
    message: "Maintenance settings updated successfully.",
    tone: "success"
  },
  role_updated: {
    title: "Saved",
    message: "User role updated successfully.",
    tone: "success"
  },
  user_blocked: {
    title: "Saved",
    message: "User blocked successfully.",
    tone: "success"
  },
  user_unblocked: {
    title: "Saved",
    message: "User unblocked successfully.",
    tone: "success"
  }
};

function readParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function buildAdminHref(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).length > 0) {
      query.set(key, String(value));
    }
  });
  return `/admin${query.toString() ? `?${query.toString()}` : ""}`;
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireAdmin();
  const params = (await searchParams) ?? {};
  const query = readParam(params.q).trim();
  const userId = readParam(params.user_id).trim();
  const userPage = Math.max(1, Number(readParam(params.user_page) || 1) || 1);
  const logPage = Math.max(1, Number(readParam(params.log_page) || 1) || 1);
  const data = await getAdminDashboardData({ userPage, logPage, query, userId: userId || null });
  const flash = readParam(params.flash) || null;
  const detail = readParam(params.detail) || null;
  const flashInfo = flash ? flashMessages[flash] : null;
  const flashMessage = flashInfo ? (detail ? `${flashInfo.message} ${detail}` : flashInfo.message) : null;

  const usersPrev = buildAdminHref({ q: query, user_page: data.userPage - 1, user_id: data.selectedUserId, log_page: data.logPage, flash });
  const usersNext = buildAdminHref({ q: query, user_page: data.userPage + 1, user_id: data.selectedUserId, log_page: data.logPage, flash });
  const logsPrev = buildAdminHref({ q: query, user_page: data.userPage, user_id: data.selectedUserId, log_page: data.logPage - 1, flash });
  const logsNext = buildAdminHref({ q: query, user_page: data.userPage, user_id: data.selectedUserId, log_page: data.logPage + 1, flash });
  const clearFilters = buildAdminHref({ flash });

  return (
    <PageShell>
      {flashInfo ? <FlashBanner title={flashInfo.title} message={flashMessage} tone={flashInfo.tone} /> : null}
      <SiteHeader links={[{ href: "/dashboard", label: "Dashboard" }, { href: "/", label: "Home" }, { href: "/pricing", label: "Pricing" }]} />

      <div className="space-y-6 py-6">
        <Card className="border-white/10 bg-white/5 text-slate-50 shadow-soft backdrop-blur">
          <CardHeader>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
              Admin panel
            </div>
            <CardTitle className="text-3xl text-white">Control center</CardTitle>
            <CardDescription className="text-slate-300">
              Manage users, roles, blocks, logs, and maintenance mode. Signed in as {viewer.email ?? viewer.userId}.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-white/10 bg-white/5 text-slate-50 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Maintenance mode</CardTitle>
              <CardDescription className="text-slate-300">Pause the app when you need to fix security or stability issues.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateMaintenanceAction} className="space-y-4">
                <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
                  <input type="checkbox" name="maintenance_mode" defaultChecked={data.settings.maintenance_mode} className="h-4 w-4 rounded border-slate-300" />
                  Enable maintenance mode
                </label>
                <Textarea
                  name="maintenance_message"
                  defaultValue={data.settings.maintenance_message ?? ""}
                  placeholder="Optional message for visitors"
                  className="min-h-28 border-white/10 bg-slate-950/70 text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/20"
                />
                <Button type="submit" className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">
                  Save maintenance settings
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 text-slate-50 shadow-soft backdrop-blur">
            <CardHeader>
              <CardTitle className="text-white">Stats</CardTitle>
              <CardDescription className="text-slate-300">Quick snapshot of the control panel.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Users</div>
                <div className="mt-1 text-2xl font-semibold text-white">{data.totalUsers}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Blocked</div>
                <div className="mt-1 text-2xl font-semibold text-white">{data.profiles.filter((p) => p.is_blocked).length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
                <div className="text-sm text-slate-400">Logs shown</div>
                <div className="mt-1 text-2xl font-semibold text-white">{data.logs.length}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-white/10 bg-white/5 text-slate-50 shadow-soft backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle className="text-white">Users</CardTitle>
                <CardDescription className="text-slate-300">Search users and open only the account you need.</CardDescription>
              </div>
              <form className="flex w-full max-w-xl gap-2 lg:w-auto" method="get">
                <Input name="q" defaultValue={query} placeholder="Search email or name" className="border-white/10 bg-slate-950/70 text-slate-50 placeholder:text-slate-500 focus:border-emerald-400 focus:ring-emerald-500/20" />
                <input type="hidden" name="user_page" value="1" />
                <input type="hidden" name="log_page" value={data.logPage} />
                <Button type="submit" variant="secondary" className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                  Search
                </Button>
              </form>
            </div>
            {(query || data.selectedUserId) ? (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200">
                <span>{query ? `Showing matches for “${query}”` : "Filtered by selected user."}</span>
                <Link href={clearFilters} className="font-medium text-emerald-300 underline underline-offset-4">
                  Clear filter
                </Link>
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {data.profiles.length === 0 ? (
                <p className="text-sm text-slate-400">No users found.</p>
              ) : (
                data.profiles.map((user) => {
                  const selected = data.selectedUserId === user.id;
                  return (
                    <div key={user.id} className={`rounded-2xl border p-4 ${selected ? "border-emerald-400/30 bg-emerald-400/10" : "border-white/10 bg-slate-950/60"}`}>
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-white">{user.email ?? "—"}</div>
                            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                              {user.role ?? "user"}
                            </span>
                            {user.is_blocked ? (
                              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] uppercase tracking-[0.2em] text-amber-200">
                                blocked
                              </span>
                            ) : null}
                          </div>
                          <div className="text-sm text-slate-300">{user.full_name ?? "No name"}</div>
                          <div className="text-xs text-slate-400">Joined {formatDateTime(user.created_at)}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Link href={buildAdminHref({ q: query, user_id: user.id, user_page: data.userPage, log_page: 1, flash })} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                            View logs
                          </Link>
                          <form action={updateUserRoleAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="user_id" value={user.id} />
                            <select name="role" defaultValue={user.role ?? "user"} className="h-10 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-slate-100">
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                            <Button type="submit" variant="secondary" size="sm" className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                              Save
                            </Button>
                          </form>
                          <form action={blockUserAction} className="flex flex-wrap items-center gap-2">
                            <input type="hidden" name="user_id" value={user.id} />
                            <input type="hidden" name="blocked" value={user.is_blocked ? "" : "on"} />
                            <Button type="submit" variant="secondary" size="sm" className="border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10">
                              {user.is_blocked ? "Unblock" : "Block"}
                            </Button>
                          </form>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                          <div className="text-slate-400">Plan</div>
                          <div className="mt-1 font-medium capitalize text-white">{user.tier ?? "free"}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                          <div className="text-slate-400">Status</div>
                          <div className="mt-1 font-medium text-white">{user.is_blocked ? "Blocked" : "Active"}</div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-3 text-sm">
                          <div className="text-slate-400">Updated</div>
                          <div className="mt-1 font-medium text-white">{formatDateTime(user.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              {data.hasMoreUsers ? (
                <Link href={usersNext} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                  Next users
                </Link>
              ) : (
                <span />
              )}
              <div className="text-sm text-slate-400">Page {data.userPage}</div>
              {data.userPage > 1 ? (
                <Link href={usersPrev} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                  Previous users
                </Link>
              ) : (
                <span />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5 text-slate-50 shadow-soft backdrop-blur">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-white">{data.selectedUserId ? "Selected user activity" : "Recent activity"}</CardTitle>
                <CardDescription className="text-slate-300">
                  {data.selectedUserId ? "Only the selected user’s logs are shown here." : "Latest admin and user events. Select a user to narrow this down."}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {data.logPage > 1 ? (
                  <Link href={logsPrev} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                    Previous
                  </Link>
                ) : null}
                <div className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-200">
                  Page {data.logPage}
                </div>
                {data.hasMoreLogs ? (
                  <Link href={logsNext} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10">
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.logs.length === 0 ? (
              <p className="text-sm text-slate-400">No activity logged yet.</p>
            ) : (
              data.logs.map((log) => (
                <div key={log.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium text-white">{log.action}</div>
                    <div className="text-slate-400">{formatDateTime(log.created_at)}</div>
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 ? (
                    <pre className="mt-2 overflow-x-auto rounded-xl bg-black/30 p-3 text-xs text-slate-300">{JSON.stringify(log.metadata, null, 2)}</pre>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
