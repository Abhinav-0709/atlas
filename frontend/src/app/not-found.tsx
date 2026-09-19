"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Compass, Home, Layers, BookOpen, Terminal } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-atlas-cream text-atlas-black font-sans selection:bg-atlas-lime selection:text-atlas-black flex flex-col justify-between">
      {/* Header Bar */}
      <header className="w-full px-6 sm:px-10 py-4 flex items-center justify-between border-b border-black/15 bg-atlas-cream">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-105">
            <Image
              src="/logo.png"
              alt="Atlas Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight uppercase leading-none font-sans">
                Atlas
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/10 text-black/75 uppercase tracking-wider">
                ENGINE
              </span>
            </div>
            <span className="font-mono text-[9px] tracking-widest text-black/60 uppercase hidden sm:block">
              Distributed DAG Engine
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-4 py-2 rounded-full font-mono text-xs uppercase font-bold text-black/75 hover:text-black hover:bg-black/5 transition-all"
        >
          <ArrowLeft size={13} />
          <span>Back Home</span>
        </Link>
      </header>

      {/* Center 404 Visual Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="max-w-2xl w-full mx-auto text-center space-y-8">
          {/* Eyebrow Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-atlas-lime border border-black/20 text-atlas-black font-mono text-xs font-bold uppercase tracking-wider shadow-xs animate-pulse-subtle">
            <span className="w-2 h-2 rounded-full bg-black/80" />
            <span>ERROR 404 // NODE_NOT_FOUND</span>
          </div>

          {/* Large Hero Title */}
          <div className="space-y-3">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase tracking-tighter text-atlas-black leading-none">
              404
            </h1>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-atlas-black">
              State Machine Dead End
            </h2>
            <p className="text-sm sm:text-base text-black/70 max-w-md mx-auto leading-relaxed font-sans">
              The node or route you attempted to dispatch does not exist in the execution graph.
              All upstream dependencies have terminated.
            </p>
          </div>

          {/* Diagnostic Code Card */}
          <div className="rounded-2xl bg-[#0E1015] border border-white/10 p-4 sm:p-5 text-left font-mono text-xs text-white/85 shadow-xl max-w-lg mx-auto space-y-1.5">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 text-[10px] text-white/40 uppercase">
              <span className="flex items-center gap-1.5">
                <Terminal size={12} className="text-atlas-lime" />
                <span>SCHEDULER TRACE</span>
              </span>
              <span className="text-rose-400 font-bold">DISPATCH_ABORTED</span>
            </div>
            <div className="text-white/60 text-[11px]">
              &gt; Resolving requested route URI...
            </div>
            <div className="text-rose-400 font-bold text-[11px]">
              &gt; [ERROR] Unresolved dependency: target node is NULL
            </div>
            <div className="text-atlas-lime text-[11px]">
              &gt; Recommended recovery: Re-route to entrypoint DAG
            </div>
          </div>

          {/* Action Recovery Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-atlas-black text-white font-mono text-xs uppercase font-bold hover:bg-black/90 active:scale-95 transition-all shadow-sm group"
            >
              <Home size={13} />
              <span>Landing Page</span>
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-atlas-lime border-2 border-black/20 text-atlas-black font-mono text-xs uppercase font-bold hover:bg-atlas-lime-dark active:scale-95 transition-all shadow-sm"
            >
              <Layers size={13} />
              <span>Workflow Console</span>
            </Link>

            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-black/15 text-black font-mono text-xs uppercase font-bold hover:bg-black/5 active:scale-95 transition-all"
            >
              <BookOpen size={13} />
              <span>Read Docs</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-5 border-t border-black/10 text-center font-mono text-[11px] text-black/50">
        ATLAS DISTRIBUTED DAG ENGINE • FAULT-TOLERANT EXECUTION
      </footer>
    </div>
  );
}
