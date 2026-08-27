import { createSupabaseServiceClient } from "../src/shared/lib/supabase/service-client";

type VerificationResult = {
  passed: boolean;
  checks: Array<{ name: string; status: "pass" | "fail" | "warn"; detail: string }>;
};

async function verifyDatabaseHealth(): Promise<VerificationResult> {
  const checks: VerificationResult["checks"] = [];
  const supabase = createSupabaseServiceClient();

  try {
    const { data: ping } = await supabase.from("user_profiles").select("id", { count: "exact", head: true });
    checks.push({ name: "database_connectivity", status: "pass", detail: "Database reachable" });
  } catch {
    checks.push({ name: "database_connectivity", status: "fail", detail: "Database unreachable" });
    return { passed: false, checks };
  }

  try {
    const { count } = await supabase.from("invitations").select("id", { count: "exact", head: true });
    checks.push({ name: "invitation_table_readable", status: "pass", detail: `${count ?? 0} invitations` });
  } catch {
    checks.push({ name: "invitation_table_readable", status: "fail", detail: "Cannot read invitations" });
  }

  try {
    const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
    checks.push({ name: "transaction_table_readable", status: "pass", detail: `${count ?? 0} transactions` });
  } catch {
    checks.push({ name: "transaction_table_readable", status: "fail", detail: "Cannot read transactions" });
  }

  try {
    const { count } = await supabase.from("outbox_events").select("id", { count: "exact", head: true }).eq("status", "pending");
    checks.push({ name: "outbox_pending", status: count && count > 100 ? "warn" : "pass", detail: `${count ?? 0} pending events` });
  } catch {
    checks.push({ name: "outbox_pending", status: "fail", detail: "Cannot read outbox" });
  }

  try {
    const { count } = await supabase.from("failed_jobs").select("id", { count: "exact", head: true }).is("resolved_at", null);
    checks.push({ name: "failed_jobs", status: count && count > 50 ? "warn" : "pass", detail: `${count ?? 0} unresolved failed jobs` });
  } catch {
    checks.push({ name: "failed_jobs", status: "fail", detail: "Cannot read failed_jobs" });
  }

  const passed = checks.every((c) => c.status !== "fail");
  return { passed, checks };
}

async function run(): Promise<void> {
  console.log("=== Weplan Production Health Check ===\n");
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const dbHealth = await verifyDatabaseHealth();
  console.log("Database Health:");
  for (const check of dbHealth.checks) {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    console.log(`  ${icon} ${check.name}: ${check.detail}`);
  }

  const overallStatus = dbHealth.passed ? "✅ ALL CHECKS PASSED" : "❌ SOME CHECKS FAILED";
  console.log(`\nOverall: ${overallStatus}`);

  if (!dbHealth.passed) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error("Health check failed:", error);
  process.exit(1);
});
