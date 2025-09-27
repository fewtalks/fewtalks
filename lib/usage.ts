import { supabaseAdmin } from "@/lib/supabase/admin";

export type PlanTier = "free" | "paid";

export type UsageSummary = {
  remainingFreeRuns: number;
  plan: PlanTier;
};

const DEFAULT_USAGE: UsageSummary = {
  remainingFreeRuns: 3,
  plan: "free",
};

export async function getUsageForUser(userId: string | null): Promise<UsageSummary> {
  if (!userId) {
    return DEFAULT_USAGE;
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("remaining_free_runs, plan")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return DEFAULT_USAGE;
  }

  return {
    remainingFreeRuns: typeof data.remaining_free_runs === "number" ? data.remaining_free_runs : DEFAULT_USAGE.remainingFreeRuns,
    plan: (data.plan as PlanTier) ?? DEFAULT_USAGE.plan,
  };
}

export async function decrementFreeRun(userId: string | null): Promise<void> {
  if (!userId) {
    return;
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("remaining_free_runs")
    .eq("id", userId)
    .single();

  const current = typeof data?.remaining_free_runs === "number" ? data.remaining_free_runs : DEFAULT_USAGE.remainingFreeRuns;

  const next = Math.max(current - 1, 0);

  await supabaseAdmin
    .from("profiles")
    .upsert({ id: userId, remaining_free_runs: next }, { onConflict: "id" });
}

export async function isPaidUser(userId: string | null): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("plan")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.plan === "paid";
}

