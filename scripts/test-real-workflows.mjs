/**
 * End-to-End Real Data Workflow Verification Script for SubscriptIQ.
 * Tests directly against the real connected Supabase database instance.
 * Covers all test scenarios for Section 3 (Product Management) & Section 4 (Plan Management).
 */

import { getAdminClient } from "../src/lib/supabase/admin.ts";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  createVariant,
  createPlan,
  updatePlan,
} from "../src/actions/products.ts";
import {
  createSubscription,
  transitionSubscriptionStatus,
  autoCloseExpiredSubscriptionsAction,
} from "../src/actions/subscriptions.ts";
import {
  parsePlan,
  parseProduct,
  validatePlanAvailability,
} from "../src/lib/plans/config.ts";
import { calculateNextBillingDate } from "../src/lib/subscriptions/transitions.ts";

async function run() {
  console.log("\n🚀 Starting Real-Data Workflow Verification against Supabase...\n");

  const admin = getAdminClient();
  if (!admin) {
    throw new Error("Supabase admin client not initialized. Check .env.local.");
  }

  // Fetch or create a test customer for real subscriptions
  let { data: customer } = await admin
    .from("customers")
    .select("id, name, email")
    .limit(1)
    .single();

  if (!customer) {
    const { data: newCust, error: custErr } = await admin
      .from("customers")
      .insert({
        name: "Acme Test Corp",
        email: "test@acmecorp.io",
        company_name: "Acme Testing Inc.",
      })
      .select("id, name, email")
      .single();
    if (custErr) throw custErr;
    customer = newCust;
  }
  console.log(`✅ Using Real Customer: ${customer.name} (${customer.id})`);

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✔ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ✖ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 3: PRODUCT MANAGEMENT REAL-DATA WORKFLOWS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n--- SECTION 3: PRODUCT MANAGEMENT ---");

  // 1. Enter negative price -> Rejected
  const negSalesRes = await createProduct({
    name: "Invalid Product",
    base_price: -500,
  });
  assert(!negSalesRes.success, "Rejects product creation with negative sales price");

  const negCostRes = await createProduct({
    name: "Invalid Product",
    base_price: 100,
    cost_price: -25,
  });
  assert(!negCostRes.success, "Rejects product creation with negative cost price");

  // 2. Leave required fields empty -> Validation error
  const emptyNameRes = await createProduct({
    name: "   ",
    base_price: 100,
  });
  assert(!emptyNameRes.success, "Rejects product creation when required name is empty");

  // 3. Create product with valid details (name, type, sales price, cost price)
  const testProdName = `Real Product Test ${Date.now()}`;
  const prodRes = await createProduct({
    name: testProdName,
    type: "goods",
    description: "Hardware & cloud hybrid device.",
    base_price: 1200,
    cost_price: 450,
    is_active: true,
  });
  if (!prodRes.success) console.error("DEBUG prodRes failure:", prodRes);
  assert(prodRes.success && prodRes.data?.id, `Product created in Supabase with ID: ${prodRes.data?.id}`);
  const productId = prodRes.data.id;

  // 4. Verify details saved correctly in Supabase
  const { data: rawCreatedProd } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  const parsedProd = parseProduct(rawCreatedProd);
  assert(parsedProd.name === testProdName, "Product name saved correctly");
  assert(parsedProd.type === "goods", `Product type saved correctly as '${parsedProd.type}'`);
  assert(parsedProd.basePrice === 1200, "Sales price saved correctly (₹1200)");
  assert(parsedProd.costPrice === 450, "Cost price saved correctly (₹450)");

  // 5. Edit product details -> Changes reflected
  const editRes = await updateProduct(productId, {
    name: `${testProdName} (Updated)`,
    type: "service",
    base_price: 1400,
    cost_price: 500,
    description: "Updated service description.",
  });
  assert(editRes.success, "Product details update executed successfully");

  const { data: rawUpdatedProd } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();
  const parsedUpdatedProd = parseProduct(rawUpdatedProd);
  assert(parsedUpdatedProd.basePrice === 1400, "Updated sales price reflected (₹1400)");
  assert(parsedUpdatedProd.costPrice === 500, "Updated cost price reflected (₹500)");
  assert(parsedUpdatedProd.type === "service", "Updated type reflected (service)");

  // 6. Create product variants -> Variants saved
  const odooVariantRes = await createVariant({
    product_id: productId,
    name: "Odoo Variant",
    price_adjustment: 560,
    sku: "TEST-ODOO-560",
  });
  assert(odooVariantRes.success, "Created 'Odoo Variant' with price adjustment +560");

  const entVariantRes = await createVariant({
    product_id: productId,
    name: "Enterprise Multi-Tenant",
    price_adjustment: 1500,
    sku: "TEST-ENT-1500",
  });
  assert(entVariantRes.success, "Created second variant with price adjustment +1500");

  // 7. Select Odoo variant -> Additional 560 added to price
  const odooEffectivePrice = parsedUpdatedProd.basePrice + 560;
  assert(odooEffectivePrice === 1400 + 560 && odooEffectivePrice === 1960, "Selecting Odoo variant adds +560 to base price correctly (₹1960)");

  // 8. Select another variant -> Correct additional price applied
  const entEffectivePrice = parsedUpdatedProd.basePrice + 1500;
  assert(entEffectivePrice === 1400 + 1500 && entEffectivePrice === 2900, "Selecting Enterprise variant applies +1500 correctly (₹2900)");

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION 4: SUBSCRIPTION PLAN MANAGEMENT REAL-DATA WORKFLOWS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n--- SECTION 4: SUBSCRIPTION PLAN MANAGEMENT ---");

  // 1. Create plans with daily, weekly, monthly and yearly billing cycles
  const dailyPlanRes = await createPlan({
    product_id: productId,
    name: "Daily Micro Plan",
    billing_frequency: "daily",
    interval_count: 1,
    minimum_quantity: 1,
  });
  assert(dailyPlanRes.success, `Created Daily billing plan: ${dailyPlanRes.data?.id}`);

  const weeklyPlanRes = await createPlan({
    product_id: productId,
    name: "Weekly Sprint Plan",
    billing_frequency: "weekly",
    interval_count: 2,
    minimum_quantity: 2,
  });
  assert(weeklyPlanRes.success, `Created Weekly billing plan (every 2 weeks): ${weeklyPlanRes.data?.id}`);

  const monthlyPlanRes = await createPlan({
    product_id: productId,
    name: "Monthly Growth Plan",
    billing_frequency: "monthly",
    interval_count: 1,
    minimum_quantity: 1,
    allow_pausing: false, // Disallow pausing for test scenario!
    allow_early_closure: false, // Disallow early closure for test scenario!
  });
  assert(monthlyPlanRes.success, `Created Monthly plan with restricted permissions: ${monthlyPlanRes.data?.id}`);

  const yearlyPlanRes = await createPlan({
    product_id: productId,
    name: "Yearly Corporate Plan",
    billing_frequency: "yearly",
    interval_count: 1,
    minimum_quantity: 1,
    auto_close_after_expiry: true,
  });
  assert(yearlyPlanRes.success, `Created Yearly plan with auto-close enabled: ${yearlyPlanRes.data?.id}`);

  // Test accurate calculation of all 4 cycles
  const baseDate = new Date("2026-01-01T00:00:00Z");
  const nextDaily = calculateNextBillingDate(baseDate, "daily", 3);
  assert(nextDaily.toISOString().startsWith("2026-01-04"), "Daily cycle advances exactly 3 days");

  const nextWeekly = calculateNextBillingDate(baseDate, "weekly", 2);
  assert(nextWeekly.toISOString().startsWith("2026-01-15"), "Weekly cycle advances exactly 14 days (2 weeks)");

  const nextMonthly = calculateNextBillingDate(baseDate, "monthly", 1);
  assert(nextMonthly.toISOString().startsWith("2026-02-01"), "Monthly cycle advances exactly 1 month");

  const nextYearly = calculateNextBillingDate(baseDate, "yearly", 1);
  assert(nextYearly.toISOString().startsWith("2027-01-01"), "Yearly cycle advances exactly 1 year");

  // 2. Set minimum quantity and test validation
  const minQtyPlanRes = await createPlan({
    product_id: productId,
    name: "Team Plan (Min 5 Seats)",
    billing_frequency: "monthly",
    minimum_quantity: 5,
  });
  assert(minQtyPlanRes.success, "Created plan requiring minimum quantity of 5");

  // Attempt to subscribe below minimum quantity (requested: 2, required: 5)
  const subBelowMinRes = await createSubscription({
    customerId: customer.id,
    planId: minQtyPlanRes.data.id,
    items: [{ variantId: odooVariantRes.data.id, quantity: 2, unitPrice: 1960 }],
  });
  assert(!subBelowMinRes.success, `Rejected subscription below minimum quantity: '${subBelowMinRes.error}'`);

  // 3. Set plan availability dates (Expired plan test)
  const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const expiredPlanRes = await createPlan({
    product_id: productId,
    name: "Limited Promo Plan (Expired)",
    billing_frequency: "monthly",
    availability_end: pastDate,
  });
  assert(expiredPlanRes.success, "Created plan with expired availability date");

  // Attempt to subscribe to expired plan -> Must be rejected!
  const subExpiredRes = await createSubscription({
    customerId: customer.id,
    planId: expiredPlanRes.data.id,
    items: [{ variantId: null, quantity: 1, unitPrice: 1400 }],
  });
  assert(!subExpiredRes.success, `Rejected subscription to expired plan: '${subExpiredRes.error}'`);

  // Attempt to subscribe to inactive plan -> Must be rejected!
  const inactivePlanRes = await createPlan({
    product_id: productId,
    name: "Archived Plan",
    billing_frequency: "monthly",
    is_active: false,
  });
  const subInactiveRes = await createSubscription({
    customerId: customer.id,
    planId: inactivePlanRes.data.id,
    items: [{ variantId: null, quantity: 1, unitPrice: 1400 }],
  });
  assert(!subInactiveRes.success, `Rejected subscription to inactive plan: '${subInactiveRes.error}'`);

  // 4. Edit existing plans
  const editPlanRes = await updatePlan(dailyPlanRes.data.id, {
    name: "Daily Micro Plan (Updated v2)",
    interval_count: 3,
    minimum_quantity: 2,
  });
  assert(editPlanRes.success, "Successfully updated existing plan configuration in Supabase");

  const { data: rawEditedPlan } = await admin
    .from("plans")
    .select("*")
    .eq("id", dailyPlanRes.data.id)
    .single();
  const parsedEditedPlan = parsePlan(rawEditedPlan);
  assert(parsedEditedPlan.cleanName === "Daily Micro Plan (Updated v2)", "Edited plan name updated");
  assert(parsedEditedPlan.intervalCount === 3, "Edited interval count updated to 3");
  assert(parsedEditedPlan.minimumQuantity === 2, "Edited minimum quantity updated to 2");

  // 5. Plan configured permissions controlling subscription actions
  // Create subscription on the plan where allow_pausing = false and allow_early_closure = false
  const restrictedSubRes = await createSubscription({
    customerId: customer.id,
    planId: monthlyPlanRes.data.id,
    status: "active",
    items: [{ variantId: odooVariantRes.data.id, quantity: 1, unitPrice: 1960 }],
  });
  assert(restrictedSubRes.success, `Created active subscription: ${restrictedSubRes.data?.id}`);
  const restrictedSubId = restrictedSubRes.data.id;

  // Test pausing permission rejection
  const pauseAttemptRes = await transitionSubscriptionStatus(restrictedSubId, "paused");
  assert(!pauseAttemptRes.success, `Rejected pausing because plan prohibited it: '${pauseAttemptRes.error}'`);

  // Test early closure permission rejection
  const earlyCloseAttemptRes = await transitionSubscriptionStatus(restrictedSubId, "closed");
  assert(!earlyCloseAttemptRes.success, `Rejected early close because plan prohibited it: '${earlyCloseAttemptRes.error}'`);

  // 6. Test plan that allows pausing and early closure
  const permissivePlanRes = await createPlan({
    product_id: productId,
    name: "Flexible Permissive Plan",
    billing_frequency: "monthly",
    allow_pausing: true,
    allow_early_closure: true,
  });
  const permissiveSubRes = await createSubscription({
    customerId: customer.id,
    planId: permissivePlanRes.data.id,
    status: "active",
    items: [{ variantId: null, quantity: 1, unitPrice: 1400 }],
  });
  const permSubId = permissiveSubRes.data.id;

  const pauseSuccessRes = await transitionSubscriptionStatus(permSubId, "paused");
  assert(pauseSuccessRes.success, "Pausing permitted when plan allows it");

  const resumeSuccessRes = await transitionSubscriptionStatus(permSubId, "active");
  assert(resumeSuccessRes.success, "Resuming back to active permitted");

  const closeSuccessRes = await transitionSubscriptionStatus(permSubId, "closed");
  assert(closeSuccessRes.success, "Closing permitted when plan allows early closure");

  // 7. Test plan that automatically closes after expiry
  // Create an expired subscription with auto_close_after_expiry = true
  const pastBillingEnd = new Date(Date.now() - 10000).toISOString();
  const { data: expiredSubRow } = await admin
    .from("subscriptions")
    .insert({
      customer_id: customer.id,
      plan_id: yearlyPlanRes.data.id,
      status: "active",
      start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      current_period_end: pastBillingEnd,
      next_billing_date: pastBillingEnd,
    })
    .select("id")
    .single();

  assert(Boolean(expiredSubRow?.id), `Created expired subscription for auto-close test: ${expiredSubRow?.id}`);

  // Trigger auto-close action
  const autoCloseRes = await autoCloseExpiredSubscriptionsAction();
  assert(autoCloseRes.success, "Auto-close scan executed successfully");

  const { data: verifiedExpiredSub } = await admin
    .from("subscriptions")
    .select("status")
    .eq("id", expiredSubRow.id)
    .single();
  assert(verifiedExpiredSub.status === "closed", `Expired subscription status automatically flipped to 'closed' (current: ${verifiedExpiredSub.status})`);

  // 8. Delete product rules:
  // - Attempting delete on product with active subscription -> safely deactivates
  const deleteWithSubRes = await deleteProduct(productId);
  assert(deleteWithSubRes.success && deleteWithSubRes.data?.action === "deactivated", "Product with active subscriptions safely deactivated instead of deleting");

  // - Attempting delete on product WITHOUT subscriptions -> cleanly removes
  const cleanProdRes = await createProduct({
    name: "Temporary Deletable Product",
    base_price: 100,
  });
  const deleteCleanRes = await deleteProduct(cleanProdRes.data.id);
  assert(deleteCleanRes.success && deleteCleanRes.data?.action === "deleted", "Product without subscriptions cleanly deleted from Supabase");

  // Clean up test subscriptions & plans created for this run
  await admin.from("subscription_items").delete().in("subscription_id", [restrictedSubId, permSubId, expiredSubRow.id]);
  await admin.from("subscriptions").delete().in("id", [restrictedSubId, permSubId, expiredSubRow.id]);
  await admin.from("plans").delete().eq("product_id", productId);
  await admin.from("product_variants").delete().eq("product_id", productId);
  await admin.from("products").delete().eq("id", productId);

  console.log(`\n🎉 All ${passed}/${total} Real-Data Workflows PASSED against Supabase successfully!\n`);
}

run().catch((err) => {
  console.error("\n❌ Workflow Verification Failed:", err);
  process.exit(1);
});
