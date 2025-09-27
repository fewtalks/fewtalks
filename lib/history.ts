import { supabaseAdmin } from "@/lib/supabase/admin";

type HistoryEntry = {
  user_id: string | null;
  source_text: string;
  tweets: string[];
  model: string;
};

export async function recordGeneration(entry: HistoryEntry) {
  await supabaseAdmin.from("generation_history").insert({
    user_id: entry.user_id,
    source_text: entry.source_text,
    tweets: entry.tweets,
    model: entry.model,
  });
}

