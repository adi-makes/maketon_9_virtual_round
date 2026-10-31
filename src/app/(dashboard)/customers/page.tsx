import { getCustomers } from "@/actions/customers";
import { CustomersClientView } from "@/components/customers/CustomersClientView";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const result = await getCustomers();

  return (
    <CustomersClientView
      initialCustomers={result.data || []}
      initialError={result.success ? null : result.error || "Failed to load customers from database."}
    />
  );
}
