import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUsageForUser, isPaidUser } from "@/lib/usage";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [usage, paid] = await Promise.all([
    getUsageForUser(user.id),
    isPaidUser(user.id),
  ]);

  return (
    <section className="flex flex-col gap-8">
      <header className="rounded-3xl bg-white p-8 shadow-lg shadow-[#101828]/5">
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6172f3]">Welcome back</p>
          <h1 className="text-3xl font-semibold text-[#101828]">{user.email}</h1>
          <p className="text-sm text-[#475467]">
            Here’s the state of your Talks to Tweets plan. Keep the ideas flowing—your feed depends on it.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#e4e7ec] bg-[#f8f9fc] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6172f3]">Plan</p>
            <p className="mt-2 text-xl font-semibold text-[#101828]">{paid ? "Creator" : "Free"}</p>
            <p className="mt-2 text-sm text-[#475467]">
              {paid
                ? "Unlimited runs with hashtag packs, thread drafts, and export tools."
                : "Upgrade to unlock unlimited generations, advanced rewrites, and export tools."}
            </p>
          </div>
          <div className="rounded-2xl border border-[#e4e7ec] bg-[#f8f9fc] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6172f3]">Free runs left</p>
            <p className="mt-2 text-xl font-semibold text-[#101828]">{usage.remainingFreeRuns}</p>
            <p className="mt-2 text-sm text-[#475467]">
              We reset free credits periodically. Need more capacity? Upgrade for unlimited access.
            </p>
          </div>
        </div>
      </header>

      <section className="rounded-3xl border border-[#e4e7ec] bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-[#101828]">Integrations</h2>
        <p className="mt-2 text-sm text-[#475467]">
          Connect your favorite tools to push tweets directly where they need to go.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#f8f9fc] p-6 text-sm text-[#475467]">
            X (Twitter) scheduling — coming soon.
          </div>
          <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#f8f9fc] p-6 text-sm text-[#475467]">
            Notion and CSV export — in build.
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#e4e7ec] bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-[#101828]">Upgrade or manage billing</h2>
        <p className="mt-2 text-sm text-[#475467]">
          Need to change your plan? Head to your Stripe portal to manage billing details and invoices.
        </p>
        <form action="/api/stripe/portal" method="post" className="mt-6">
          <button className="rounded-full bg-[#101828] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#141b2f]">
            Open customer portal
          </button>
        </form>
      </section>
    </section>
  );
}

