'use client';

import { useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const CHECKOUT_ENDPOINT = "/api/stripe/checkout";

const FREE_GENERATIONS = 3;

type GenerateResponse = {
  tweets: string[];
  remainingFreeRuns?: number;
  paid?: boolean;
  error?: string;
};

export default function Home() {
  const [sourceText, setSourceText] = useState("");
  const [tweets, setTweets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingFreeRuns, setRemainingFreeRuns] = useState(FREE_GENERATIONS);
  const [highlightUpgrade, setHighlightUpgrade] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const pricingRef = useRef<HTMLDivElement | null>(null);
  const supabaseClientRef = useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  const visibleTweets = useMemo(() => tweets.slice(0, 2), [tweets]);
  const hasHiddenTweets = useMemo(() => tweets.length > visibleTweets.length, [tweets, visibleTweets.length]);

  useEffect(() => {
    if (!supabaseClientRef.current) {
      supabaseClientRef.current = createSupabaseBrowserClient();
    }

    const supabase = supabaseClientRef.current;

    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGenerate = async () => {
    if (isLoading) return;

    const trimmed = sourceText.trim();
    if (!trimmed) {
      setErrorMessage("Please add a thought, post, or article to transform.");
      return;
    }

    if (remainingFreeRuns <= 0) {
      setHighlightUpgrade(true);
      pricingRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: trimmed }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Something went wrong. Please try again.");
      }

      const data = (await response.json()) as GenerateResponse;

      if (typeof data.remainingFreeRuns === "number") {
        setRemainingFreeRuns(data.remainingFreeRuns);
      } else {
        setRemainingFreeRuns((prev) => Math.max(prev - 1, 0));
      }

      if (data.error) {
        setErrorMessage(data.error);
      }

      setTweets(data.tweets);
      setHighlightUpgrade(!data.paid && (data.remainingFreeRuns ?? remainingFreeRuns) <= 0);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
    setHighlightUpgrade(true);
  };

  const handleUpgrade = async () => {
    if (!supabaseClientRef.current) {
      supabaseClientRef.current = createSupabaseBrowserClient();
    }

    const supabase = supabaseClientRef.current;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const {
        data: { url },
        error,
      } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (error || !url) {
        setErrorMessage(error?.message ?? "Unable to sign in.");
        return;
      }

      window.location.href = url;
      return;
    }

    try {
      const response = await fetch(CHECKOUT_ENDPOINT, { method: "POST" });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not start checkout.");
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        throw new Error("Invalid checkout response.");
      }

      window.location.href = data.url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#101828]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-tight">fewtalks</div>
          <div className="flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={handleScrollToPricing}
              className="text-[#475467] transition hover:text-[#101828]"
            >
              Pricing
            </button>
            {userEmail ? (
              <button
                onClick={async () => {
                  if (!supabaseClientRef.current) {
                    supabaseClientRef.current = createSupabaseBrowserClient();
                  }

                  const supabase = supabaseClientRef.current;
                  await fetch("/api/auth/signout", { method: "POST" });
                  await supabase.auth.signOut();
                }}
                className="rounded-full border border-[#101828]/10 px-4 py-1.5 text-[#101828]/80 transition hover:border-[#101828]/30 hover:text-[#101828]"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                className="rounded-full border border-[#101828]/10 px-4 py-1.5 text-[#101828]/80 transition hover:border-[#101828]/30 hover:text-[#101828]"
              >
                Sign in
              </button>
            )}
            <button
              onClick={handleUpgrade}
              className="rounded-full bg-[#101828] px-4 py-1.5 text-white transition hover:bg-[#141b2f]"
            >
              Try for free
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-16 px-6 pb-24 pt-12">
        <section className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#6172f3]">Talks to Tweets</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#101828] sm:text-5xl">
            Turn your thoughts into viral tweets.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[#475467]">
            Paste your long-form ideas and let our AI instantly craft scroll-stopping tweets for X. Stay consistent, grow faster, and ship content without staring at a blank cursor.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <button
              onClick={handleUpgrade}
              className="w-full rounded-full bg-[#101828] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#141b2f] sm:w-auto"
            >
              Unlock full power
            </button>
            <button
              onClick={() => {
                const textarea = document.getElementById("source-input");
                if (textarea) {
                  textarea.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }}
              className="w-full rounded-full border border-[#101828]/10 px-6 py-3 text-sm font-semibold text-[#101828] transition hover:border-[#101828]/30 sm:w-auto"
            >
              Generate for free
            </button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-lg shadow-[#101828]/5">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[#101828]" htmlFor="source-input">
                Drop your long-form thoughts here
              </label>
              <p className="text-sm text-[#475467]">
                Paste a draft, voice note transcript, or blog paragraph. We’ll spin it into high-performing tweets instantly.
              </p>
            </div>
            <textarea
              id="source-input"
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Paste your long thought, blog post, or article here..."
              rows={8}
              className="w-full resize-none rounded-2xl border border-[#d0d5dd] bg-[#f8f9fc] px-4 py-4 text-base text-[#101828] outline-none transition focus:border-[#6172f3] focus:bg-white focus:shadow-[0_0_0_4px_rgba(97,114,243,0.15)]"
            />
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div className="text-xs font-medium uppercase tracking-[0.32em] text-[#6172f3]">
                Free runs left: {remainingFreeRuns}
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#6172f3] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4a5ae6] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                >
                  {isLoading ? "Generating..." : "Generate my tweets"}
                </button>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#101828]/10 px-6 py-3 text-sm font-semibold text-[#101828] transition hover:border-[#101828]/30 sm:w-auto"
                >
                  Upgrade for unlimited
                </button>
              </div>
            </div>
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-lg shadow-[#101828]/5">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-[#101828]">Your tweet ideas</h2>
              <p className="text-sm text-[#475467]">
                Instantly generated for X. Free plan shows a couple of ideas—unlock the rest when you’re ready.
              </p>
            </header>

            {visibleTweets.length === 0 && !isLoading && (
              <div className="rounded-2xl border border-dashed border-[#d0d5dd] bg-[#f8f9fc] px-6 py-10 text-center text-sm text-[#475467]">
                Paste your thoughts above and hit Generate to see tweet options here.
              </div>
            )}

            <div className="grid gap-4">
              {visibleTweets.map((tweet, index) => (
                <article key={index} className="rounded-2xl border border-[#e4e7ec] bg-white px-6 py-5 text-sm text-[#101828] shadow-sm">
                  {tweet}
                </article>
              ))}

              {isLoading && (
                <div className="animate-pulse rounded-2xl border border-[#e4e7ec] bg-[#f8f9fc] px-6 py-5 text-sm text-[#475467]">
                  Crafting headlines that spark engagement...
                </div>
              )}

              {hasHiddenTweets && (
                <div className="rounded-2xl border border-[#6172f3]/20 bg-[#eef0ff] px-6 py-5 text-sm text-[#3c4de0]">
                  Want more? Upgrade to unlock {tweets.length - visibleTweets.length} additional tweets, hashtag packs, and export tools.
                </div>
              )}

              {remainingFreeRuns <= 0 && (
                <div className="rounded-2xl border border-[#fee4e2] bg-[#fef3f2] px-6 py-4 text-sm text-[#b42318]">
                  You’ve used all free runs. Upgrade to keep generating without limits.
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                onClick={handleUpgrade}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition ${
                  highlightUpgrade
                    ? "bg-[#101828] text-white shadow-[0_8px_16px_rgba(16,24,40,0.12)] hover:bg-[#141b2f]"
                    : "border border-[#101828]/10 text-[#101828] hover:border-[#101828]/30"
                }`}
              >
                Unlock unlimited tweets
              </button>
              <span className="text-xs uppercase tracking-[0.32em] text-[#6172f3]">
                Built for creators & founders
              </span>
            </div>
          </div>
        </section>

        <section
          ref={pricingRef}
          className={`rounded-3xl border ${
            highlightUpgrade ? "border-[#101828] shadow-xl shadow-[#101828]/20" : "border-[#e4e7ec]"
          } bg-white p-8 transition-shadow`}
        >
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold text-[#101828]">Upgrade and own your feed</h2>
              <p className="mt-3 text-sm text-[#475467]">
                Unlimited generations, advanced rewriting modes, auto hashtag suggestions, thread drafts, and scheduling-ready exports. Everything you need to show up daily without burning out.
              </p>
              <ul className="mt-6 grid gap-3 text-sm text-[#475467]">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6172f3]" aria-hidden />
                  Unlimited tweet and thread generations
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6172f3]" aria-hidden />
                  Hashtag packs tuned to your topics
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#6172f3]" aria-hidden />
                  Export to X, Notion, and CSV in one click
                </li>
              </ul>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-[#e4e7ec] bg-[#f8f9fc] p-6 text-center shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#6172f3]">Creator plan</p>
              <p className="text-4xl font-bold text-[#101828]">$9.99<span className="text-base font-medium text-[#475467]">/month</span></p>
              <p className="text-sm text-[#475467]">Start today. Cancel anytime. Instant access to every feature.</p>
              <button
                onClick={handleUpgrade}
                className="rounded-full bg-[#101828] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#141b2f]"
              >
                Start your subscription
              </button>
              <p className="text-xs text-[#98a2b3]">Secure payments powered by Stripe.</p>
            </div>
        </div>
        </section>
      </main>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm text-[#475467] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-[#101828]">fewtalks</p>
          <div className="flex items-center gap-6">
            <a className="transition hover:text-[#101828]" href="#">
              About
            </a>
            <a className="transition hover:text-[#101828]" href="#">
              Contact
            </a>
            <a className="transition hover:text-[#101828]" href="#">
              Privacy
            </a>
          </div>
          <p className="text-xs text-[#98a2b3]">© {new Date().getFullYear()} fewtalks. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
