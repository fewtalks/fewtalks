export default function StripeSuccessPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center text-[#101828]">
      <span className="rounded-full bg-[#d1f2d6] px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#0f5c25]">
        Payment confirmed
      </span>
      <h1 className="text-3xl font-semibold">You’re in! Welcome to the Creator plan.</h1>
      <p className="text-sm text-[#475467]">
        Check your inbox for a receipt and bookmark this tab—we’ll redirect you back to Talks to Tweets in a moment. 🎉
      </p>
    </main>
  );
}

