import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured } from "@/lib/supabase/admin";
import { getStaffMembers } from "@/actions/staff";
import { CreateStaffDialog } from "./create-staff-dialog";
import { formatDate } from "@/lib/utils";
import {
  Users,
  Shield,
  UserCheck,
  AlertTriangle,
  Key,
  CheckCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffManagementPage() {
  const supabase = await createClient();

  // 1. Verify user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 2. Fetch role and verify Admin privilege
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole =
    profile?.role ||
    user.user_metadata?.role ||
    (user.email?.toLowerCase().startsWith("admin@") ? "admin" : "staff");

  // Only administrators can manage team credentials
  if (userRole !== "admin") {
    redirect("/dashboard");
  }

  // 3. Fetch team members and check environment configuration
  const isConfigured = isServiceRoleConfigured();
  const staffList = await getStaffMembers();

  // If table is initially empty, ensure at least the logged-in admin is shown
  const displayList =
    staffList.length > 0
      ? staffList
      : [
          {
            id: user.id,
            email: user.email || "admin@subscriptiq.com",
            fullName: user.user_metadata?.full_name || "System Administrator",
            role: "admin" as const,
            createdAt: user.created_at || new Date().toISOString(),
          },
        ];

  const adminCount = displayList.filter((m) => m.role === "admin").length;
  const staffCount = displayList.filter((m) => m.role === "staff").length;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Staff & Team Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Provision staff operators and manage operational credentials.
          </p>
        </div>
        <CreateStaffDialog isConfigured={isConfigured} />
      </div>

      {/* Setup Notice if SUPABASE_SECRET_KEY is missing */}
      {!isConfigured && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-start space-x-3.5">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm text-amber-900 dark:text-amber-200">
              <h4 className="font-semibold text-amber-950 dark:text-amber-100">
                Action Required: Configure SUPABASE_SECRET_KEY for Staff Creation
              </h4>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                To allow administrators to create staff users directly from this portal without logging out, Supabase requires the <strong>service_role</strong> API secret.
              </p>
              <div className="mt-3 flex items-center space-x-2 text-xs font-mono text-amber-950 dark:text-amber-100">
                <Key className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>
                  Supabase Dashboard &rarr; Project Settings &rarr; API &rarr; Project API keys &rarr; <code>service_role</code>
                </span>
              </div>
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                Add <code>SUPABASE_SECRET_KEY=your_service_role_secret</code> to your root <code>.env.local</code> file and restart the development server.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* Total Members */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Team Members
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {displayList.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Registered team operators
          </p>
        </div>

        {/* Administrators */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Administrators
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
              <Shield className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {adminCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Full executive & billing access
          </p>
        </div>

        {/* Staff Operators */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Staff Operators
            </span>
            <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {staffCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Subscriptions & payment operators
          </p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Authorized Personnel Directory
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All users with internal access to the SubscriptIQ management portal.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Member Details
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Role
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-6 py-3.5">
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayList.map((member) => {
                const initials = (member.fullName || member.email)
                  .substring(0, 2)
                  .toUpperCase();
                const isAdmin = member.role === "admin";

                return (
                  <tr
                    key={member.id}
                    className="transition hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold ${
                            isAdmin
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300"
                              : "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                          }`}
                        >
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {member.fullName || "Team Member"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center space-x-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 dark:border-purple-800/50 dark:bg-purple-950/40 dark:text-purple-300">
                          <Shield className="h-3 w-3" />
                          <span>ADMINISTRATOR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1.5 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700 dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-300">
                          <UserCheck className="h-3 w-3" />
                          <span>STAFF OPERATOR</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3.5 w-3.5" />
                        <span>Active</span>
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(member.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
