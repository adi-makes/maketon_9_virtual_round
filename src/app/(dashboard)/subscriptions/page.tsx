import { getSubscriptions } from "@/actions/subscriptions";
import { SubscriptionsPage } from "@/components/subscriptions/SubscriptionsPage";

export const dynamic = "force-dynamic";

export default async function SubscriptionsRoute() {
  const result = await getSubscriptions();
  return (
    <SubscriptionsPage
      initialSubscriptions={result.data || []}
      initialError={result.success ? null : result.error || "Failed to load subscriptions from database"}
    />
  );
}
