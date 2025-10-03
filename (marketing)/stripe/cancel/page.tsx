export default function StripeCancelPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center gap-6 px-6 text-center text-[#101828]">
      <span className="rounded-full bg-[#fee4e2] px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-[#b42318]">
        Checkout cancelled
      </span>
      <h1 className="text-3xl font-semibold">No worries, your draft is safe.</h1>
      <p className="text-sm text-[#475467]">
        You can try Talks to Tweets free again anytime. Ready for unlimited generations? Head back and upgrade when it fits.
      </p>
    </main>
  );
}

