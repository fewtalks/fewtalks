import { NextResponse } from "next/server";

import { openai } from "@/lib/openai";
import { recordGeneration } from "@/lib/history";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { decrementFreeRun, getUsageForUser, isPaidUser } from "@/lib/usage";

const DEFAULT_FALLBACK_TWEETS = [
  "Your audience grows when you ship your thinking daily. Summaries become signal. Threads become SOPs.",
  "Hot take: Consistency beats virality. Publish one sharp idea every day and the platform works for you.",
  "Stop over-editing. Share the lesson, add one story, ship it. The rest is analytics polish you can automate.",
];

function buildPrompt(prompt: string) {
  return `You are an elite social media strategist. Rewrite the text below into three unique tweets tailored for X (Twitter).

Guidelines:
- Keep each tweet under 260 characters.
- Vary hooks and tones across the tweets (e.g., direct advice, spicy take, narrative).
- Use clear, scroll-stopping language. Add emojis only if they add clarity.
- Include at most one hashtag per tweet and only if it amplifies the message.
- Never fabricate data.

Original content:
"""
${prompt}
"""

Return the tweets as a numbered list:
1. Tweet...
2. Tweet...
3. Tweet...`;
}

function parseTweets(completion: string): string[] {
  return completion
    .split(/\n\s*\d+\.\s*/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 3);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userId = user?.id ?? null;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const usage = await getUsageForUser(userId);
    const paid = await isPaidUser(userId);

    if (!paid && usage.remainingFreeRuns <= 0) {
      return NextResponse.json(
        {
          error: "Free quota reached. Upgrade to keep generating tweets.",
          tweets: DEFAULT_FALLBACK_TWEETS.slice(0, 1),
          remainingFreeRuns: 0,
        },
        { status: 402 }
      );
    }

    const model = "gpt-4.1-mini";

    const completion = await openai.responses.create({
      model,
      input: buildPrompt(prompt),
      max_output_tokens: 800,
      reasoning: { effort: "medium" },
      temperature: 0.7,
    });

    const text = completion.output_text?.trim() ?? "";
    const tweets = parseTweets(text);

    if (!paid) {
      await decrementFreeRun(userId);
    }
    const remainingFreeRuns = paid ? usage.remainingFreeRuns : Math.max(usage.remainingFreeRuns - 1, 0);

    if (tweets.length === 0) {
      return NextResponse.json({ tweets: DEFAULT_FALLBACK_TWEETS, remainingFreeRuns });
    }

    await recordGeneration({
      user_id: userId,
      source_text: prompt,
      tweets,
      model,
    });

    return NextResponse.json({ tweets, remainingFreeRuns, paid });
  } catch (error) {
    console.error("Generate error", error);
    return NextResponse.json(
      {
        tweets: DEFAULT_FALLBACK_TWEETS,
        error: error instanceof Error ? error.message : "Unable to generate tweets right now.",
        remainingFreeRuns: undefined,
      },
      { status: 200 }
    );
  }
}

