import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardMetrics } from "@/lib/billing/dashboard-service";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();
  return <DashboardView initialMetrics={metrics} />;
}
