import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type HistoryRow = {
  id: string;
  created_at: string;
  tweets: string[];
  source_text: string;
  model: string;
};

export default async function HistoryPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data } = await supabase
    .from("generation_history")
    .select("id, created_at, tweets, source_text, model")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const history = (data ?? []) as HistoryRow[];

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold text-[#101828]">Recent generations</h1>
        <p className="mt-2 text-sm text-[#475467]">
          Review the outputs you’ve created with Talks to Tweets. Refine them or push them live in seconds.
        </p>
      </header>

      <div className="rounded-3xl border border-[#e4e7ec] bg-white shadow-sm">
        {history.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-[#475467]">
            No generations yet. Paste a thought on the homepage to create your first batch of tweets.
          </div>
        ) : (
          <ul className="divide-y divide-[#f2f4f7]">
            {history.map((row) => (
              <li key={row.id} className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#6172f3]">
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                  <p className="mt-2 text-sm text-[#475467] line-clamp-3">
                    {row.source_text}
                  </p>
                  <p className="mt-3 text-xs text-[#98a2b3]">Model: {row.model}</p>
                </div>
                <div className="flex-1 rounded-2xl border border-[#e4e7ec] bg-[#f8f9fc] p-4">
                  <ul className="grid gap-3 text-sm text-[#101828]">
                    {row.tweets.map((tweet, idx) => (
                      <li key={idx} className="rounded-xl border border-[#e4e7ec] bg-white px-3 py-2">
                        {tweet}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

