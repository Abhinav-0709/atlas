"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Activity, ArrowUpRight, Cpu } from "lucide-react";

export default function Navbar({ engineOnline = true }: { engineOnline?: boolean }) {
  const pathname = usePathname();

  const links = [
    { label: "Overview", href: "/" },
    { label: "Workflows", href: "/dashboard" },
    { label: "Worker Fleet", href: "/dashboard/workers" },
    { label: "Prometheus Metrics", href: "/dashboard/metrics" },
  ];

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between border-b border-black/15 bg-atlas-lime text-atlas-black sticky top-0 z-50">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-9 h-9 rounded-xl bg-atlas-black text-atlas-lime flex items-center justify-center font-black shadow-sm group-hover:bg-atlas-blue transition-colors">
          <span className="text-lg leading-none">✦</span>
        </div>
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tight uppercase leading-none">
            Atlas
          </span>
          <span className="font-mono text-[9px] tracking-widest text-black/60 uppercase">
            Distributed DAG Engine
          </span>
        </div>
      </Link>

      {/* Nav links */}
      <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-wider font-semibold">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-atlas-blue flex items-center gap-1 ${
                isActive ? "text-atlas-blue underline underline-offset-4 decoration-2" : "text-black/80"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Status & CTA */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/20 bg-black/5 font-mono text-[11px] font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              engineOnline ? "bg-emerald-600 animate-pulse" : "bg-red-500"
            }`}
          />
          <span>{engineOnline ? "Engine Online" : "Engine Offline"}</span>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-atlas-black text-atlas-lime font-bold text-xs uppercase tracking-wider hover:bg-atlas-blue hover:text-white transition-all shadow-sm"
        >
          <span>Dashboard</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </header>
  );
}
