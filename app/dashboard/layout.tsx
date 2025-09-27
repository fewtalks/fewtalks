import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f8fb] text-[#101828]">
      <header className="border-b border-black/5 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            fewtalks
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-[#475467] transition hover:text-[#101828]">
              Overview
            </Link>
            <Link href="/dashboard/history" className="text-[#475467] transition hover:text-[#101828]">
              History
            </Link>
            <Link href="/" className="rounded-full border border-[#101828]/10 px-4 py-1.5 text-[#101828]/80 transition hover:border-[#101828]/30 hover:text-[#101828]">
              Back to generator
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-16 pt-12">{children}</main>
    </div>
  );
}

