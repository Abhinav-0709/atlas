"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Activity, Server, ArrowLeft, Menu, X, BookOpen, Brain } from "lucide-react";

interface NavbarProps {
  engineOnline?: boolean;
  activeWorkers?: number;
  queueDepth?: number;
}

export default function Navbar({
  engineOnline = true,
  activeWorkers = 0,
  queueDepth = 0,
}: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { label: "Overview", href: "/", icon: ArrowLeft },
    { label: "Workflows", href: "/dashboard", icon: Layers },
    { label: "ML Engine", href: "/dashboard/intelligence", icon: Brain },
    { label: "Workers", href: "/dashboard/workers", icon: Server },
    { label: "Metrics", href: "/dashboard/metrics", icon: Activity },
    { label: "Docs", href: "/docs", icon: BookOpen },
  ];

  return (
    <header className="w-full px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-black/15 bg-atlas-lime text-atlas-black sticky top-0 z-50 shadow-xs">
      {/* Brand with Official Logo */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Atlas Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-base sm:text-lg tracking-tight uppercase leading-none font-sans">
                Atlas
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-black/10 text-black/75 uppercase tracking-wider">
                Console
              </span>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-black/60 uppercase hidden sm:block">
              Distributed DAG Engine
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider font-semibold ml-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || (link.href === "/dashboard" && pathname.startsWith("/dashboard/runs"));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition-all text-xs ${
                  isActive
                    ? "bg-atlas-black text-atlas-lime shadow-sm font-bold"
                    : "text-black/75 hover:bg-black/10 hover:text-black"
                }`}
              >
                <Icon size={13} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right Side: Live Telemetry & Engine Status */}
      <div className="flex items-center gap-2.5">
        {/* Live Workers Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-black/15 font-mono text-[11px] font-semibold">
          <span className="text-black/60 uppercase text-[10px]">Workers:</span>
          <span className="font-bold text-emerald-800">{activeWorkers} LIVE</span>
        </div>

        {/* Live Queue Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-black/15 font-mono text-[11px] font-semibold">
          <span className="text-black/60 uppercase text-[10px]">Queue:</span>
          <span className="font-bold text-atlas-blue">{queueDepth} TASKS</span>
        </div>

        {/* Engine Status */}
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-black/20 bg-white/80 font-mono text-[10px] sm:text-[11px] font-bold shadow-2xs flex-shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${
              engineOnline ? "bg-emerald-600 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-black/90">
            <span className="hidden sm:inline">Engine </span>
            {engineOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-black hover:bg-black/10"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-atlas-cream border-b border-black/15 p-4 shadow-xl flex flex-col gap-2 z-50">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || (link.href === "/dashboard" && pathname.startsWith("/dashboard/runs"));

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-mono text-xs uppercase tracking-wider font-bold transition-all ${
                  isActive
                    ? "bg-atlas-black text-atlas-lime"
                    : "text-black/80 hover:bg-black/5"
                }`}
              >
                <Icon size={15} />
                <span>{link.label}</span>
              </Link>
            );
          })}

          <div className="flex items-center justify-between pt-3 mt-2 border-t border-black/10 font-mono text-xs">
            <span className="text-black/60">Workers: {activeWorkers} Live</span>
            <span className="text-atlas-blue font-bold">Queue: {queueDepth} Tasks</span>
          </div>
        </div>
      )}
    </header>
  );
}
