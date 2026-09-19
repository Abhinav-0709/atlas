"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Layers,
  Server,
  Activity,
  ShieldAlert,
  Cpu,
  RefreshCw,
  GitBranch,
  Terminal,
  Database,
  Code2,
  FileText,
  AlertTriangle,
  Zap,
  Lock,
  ArrowDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const navChapters = [
    { id: "overview", label: "1. System Overview", icon: Zap },
    { id: "architecture", label: "2. Core Architecture", icon: Server },
    { id: "state-machine", label: "3. Execution State Machine", icon: GitBranch },
    { id: "leases", label: "4. Leases & Zombie Recovery", icon: Lock },
    { id: "decisions", label: "5. Architectural Decisions", icon: ShieldAlert },
    { id: "observability", label: "6. Observability & Telemetry", icon: Activity },
    { id: "quickstart", label: "7. API & Developer Guide", icon: Terminal },
  ];

  // Scrollspy via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) {
          setActiveSection(visible.target.id);
        }
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      }
    );

    navChapters.forEach((ch) => {
      const el = document.getElementById(ch.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-atlas-cream text-atlas-black font-sans selection:bg-atlas-lime selection:text-atlas-black flex flex-col">
      {/* Top Navigation Header */}
      <header className="sticky top-0 z-50 w-full bg-atlas-cream/95 backdrop-blur-md border-b border-black/15 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative w-7 h-7 flex-shrink-0 transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Atlas Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg sm:text-xl font-black tracking-tight uppercase leading-none font-sans">
                Atlas
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-atlas-lime text-atlas-black border border-black/15 uppercase tracking-wider">
                DOCS
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full font-mono text-xs uppercase font-bold text-black/75 hover:text-black hover:bg-black/5 transition-all"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Landing Page</span>
            <span className="sm:hidden">Home</span>
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 rounded-full bg-atlas-black text-atlas-lime font-mono text-xs uppercase font-bold hover:bg-atlas-blue hover:text-white transition-all shadow-sm group"
          >
            <span>Console</span>
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </header>

      {/* Mobile Horizontal Chapter Navigation Bar */}
      <div className="lg:hidden sticky top-[57px] z-40 w-full bg-white/95 backdrop-blur-md border-b border-black/10 px-4 py-2.5 overflow-x-auto terminal-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {navChapters.map((ch) => {
            const isActive = activeSection === ch.id;
            return (
              <a
                key={ch.id}
                href={`#${ch.id}`}
                className={`px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                  isActive
                    ? "bg-atlas-black text-atlas-lime shadow-xs"
                    : "text-black/70 hover:bg-black/5"
                }`}
              >
                {ch.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Main Documentation Container */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">
        {/* Left Sticky Table of Contents Sidebar (Desktop) */}
        <aside className="hidden lg:block lg:col-span-3 border-r border-black/15 p-6 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto terminal-scrollbar bg-atlas-cream/50">
          <p className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-black/50 mb-4">
            TABLE OF CONTENTS
          </p>
          <nav className="space-y-1 font-mono text-xs">
            {navChapters.map((chapter) => {
              const Icon = chapter.icon;
              const isActive = activeSection === chapter.id;
              return (
                <a
                  key={chapter.id}
                  href={`#${chapter.id}`}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    isActive
                      ? "bg-atlas-black text-atlas-lime font-bold shadow-xs translate-x-1"
                      : "text-black/80 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  <Icon size={14} className={isActive ? "text-atlas-lime" : "text-black/50"} />
                  <span>{chapter.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-black/10">
            <div className="p-4 rounded-2xl bg-white border border-black/10 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-[10px] font-bold uppercase text-black/70">
                  Engine Status
                </span>
              </div>
              <p className="text-xs text-black/80 leading-relaxed font-sans">
                Atlas local daemon coordinates workflows via Redis 7 leases & PostgreSQL 16 state records.
              </p>
            </div>
          </div>
        </aside>

        {/* Documentation Content Area */}
        <main className="lg:col-span-9 p-4 sm:p-8 lg:p-12 space-y-14 sm:space-y-16 max-w-4xl mx-auto w-full min-w-0">
          {/* Hero Header */}
          <div className="space-y-4 pb-8 sm:pb-10 border-b border-black/15">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-atlas-lime border border-black/20 text-atlas-black font-mono text-xs font-bold uppercase tracking-wider">
              <span>✦ TECHNICAL SPECIFICATION & ARCHITECTURE RECORD</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-atlas-black leading-[1.05]">
              Atlas Engine Design
            </h1>
            <p className="text-base sm:text-lg text-black/75 leading-relaxed font-sans max-w-2xl">
              An in-depth explanation of the distributed workflow execution engine, DAG scheduling algorithm,
              fault-tolerant lease protocols, and core architectural trade-offs.
            </p>
          </div>

          {/* Section 1: Overview */}
          <section id="overview" className="space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                01
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                System Overview & Problem Statement
              </h2>
            </div>

            <div className="prose prose-neutral max-w-none text-black/85 leading-relaxed space-y-4 font-sans text-sm sm:text-base">
              <p>
                Executing a single background job is straightforward. Reliably executing thousands of
                dependent tasks across a distributed pool of worker nodes is an entirely different engineering challenge.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-xs">
                  <h4 className="font-bold font-mono text-sm uppercase text-black mb-2 flex items-center gap-2">
                    <span className="text-rose-600 font-bold">✕</span> Typical Ad-Hoc Queues Fail At:
                  </h4>
                  <ul className="text-xs space-y-1.5 text-black/70 list-disc list-inside">
                    <li>Worker silent crashes leaving tasks hung indefinitely.</li>
                    <li>Race conditions: Multiple workers executing the same task.</li>
                    <li>Uncoordinated DAG dependencies leading to orphan jobs.</li>
                    <li>Poison-pill payloads causing infinite retry storms.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-xs">
                  <h4 className="font-bold font-mono text-sm uppercase text-black mb-2 flex items-center gap-2">
                    <span className="text-emerald-700 font-bold">✓</span> Atlas Architectural Solution:
                  </h4>
                  <ul className="text-xs space-y-1.5 text-black/70 list-disc list-inside">
                    <li>Topological DAG validation with cycle detection.</li>
                    <li>Atomic Redis leases with heartbeat lease renewal.</li>
                    <li>Zombie process reaping with automatic recovery.</li>
                    <li>Idempotency keys with at-least-once execution.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Architecture (Visual Responsive Diagram) */}
          <section id="architecture" className="space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                02
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Distributed System Architecture
              </h2>
            </div>

            {/* Responsive Visual Topology Diagram */}
            <div className="rounded-3xl bg-[#0E1015] p-5 sm:p-8 border border-white/10 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2 font-mono text-xs text-white/50">
                <span className="text-atlas-lime font-bold uppercase tracking-wider">
                  ATLAS TOPOLOGY & DATA BUS ARCHITECTURE
                </span>
                <span>FASTAPI • REDIS 7 • POSTGRES 16</span>
              </div>

              {/* Node 1: Client & Ingestion */}
              <div className="flex flex-col items-center">
                <div className="w-full sm:w-80 p-3.5 rounded-2xl bg-white/10 border border-white/15 text-center text-white shadow-sm">
                  <span className="text-[10px] font-mono text-atlas-lime font-bold uppercase tracking-widest block mb-0.5">
                    CLIENT LAYER
                  </span>
                  <div className="font-bold text-sm">Web Dashboard • SDK • REST API Clients</div>
                </div>

                <div className="h-6 w-0.5 bg-atlas-lime/50 my-1" />
                <span className="text-[10px] font-mono text-white/50 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  HTTP POST /workflows/&#123;id&#125;/runs
                </span>
                <div className="h-4 w-0.5 bg-atlas-lime/50 my-1" />
              </div>

              {/* Node 2: API Server & DAG Scheduler */}
              <div className="flex flex-col items-center">
                <div className="w-full sm:w-96 p-4 rounded-2xl bg-[#1A1E27] border-2 border-atlas-lime text-center text-white shadow-md">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-atlas-lime animate-pulse" />
                    <span className="text-xs font-mono font-bold text-atlas-lime uppercase">
                      FastAPI Control Plane & DAG Scheduler
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 font-mono">
                    Topological Cycle Validation • Dependency Engine • State Coordinator
                  </p>
                </div>

                <div className="h-6 w-0.5 bg-white/20 my-1" />
              </div>

              {/* Node 3: Split Dual-Store Grid (Postgres vs Redis) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                {/* Postgres Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-atlas-blue/40 space-y-2">
                  <div className="flex items-center gap-2 text-atlas-blue font-mono font-bold text-xs uppercase">
                    <Database size={15} />
                    <span>PostgreSQL 16: Durable Truth</span>
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Durable write-ahead record of DAG definitions, versions, task states, execution attempts, and structured audit logs.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1 font-mono text-[10px] text-white/50">
                    <span className="bg-white/10 px-2 py-0.5 rounded">Workflows</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded">TaskRuns</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded">AuditEvents</span>
                  </div>
                </div>

                {/* Redis Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-atlas-lime/40 space-y-2">
                  <div className="flex items-center gap-2 text-atlas-lime font-mono font-bold text-xs uppercase">
                    <Cpu size={15} />
                    <span>Redis 7: Atomic Lease Broker</span>
                  </div>
                  <p className="text-xs text-white/70 font-sans leading-relaxed">
                    Sub-millisecond task dispatch queues (<code className="text-atlas-lime">RPUSH</code> / <code className="text-atlas-lime">BLPOP</code>), atomic TTL leases (30s), and worker heartbeats.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-1 font-mono text-[10px] text-white/50">
                    <span className="bg-white/10 px-2 py-0.5 rounded">ReadyQueue</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded">TaskLeases</span>
                    <span className="bg-white/10 px-2 py-0.5 rounded">Heartbeats</span>
                  </div>
                </div>
              </div>

              {/* Connecting Pipe */}
              <div className="flex flex-col items-center">
                <div className="h-4 w-0.5 bg-white/20 my-1" />
                <span className="text-[10px] font-mono text-white/50 bg-black/60 px-2 py-0.5 rounded border border-white/10">
                  BLPOP Task Claim + Atomic Lease Lock
                </span>
                <div className="h-4 w-0.5 bg-atlas-lime/50 my-1" />
              </div>

              {/* Node 4: Worker Fleet */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/5 border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                    <Server size={14} className="text-atlas-lime" />
                    Distributed Worker Pool (Python Daemons)
                  </span>
                  <span className="text-emerald-400 font-bold text-[11px]">Heartbeat: 10s</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                    <span className="text-white/60 block text-[10px]">WORKER 01</span>
                    <span className="text-atlas-lime font-bold text-xs">HTTP Task Runner</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                    <span className="text-white/60 block text-[10px]">WORKER 02</span>
                    <span className="text-atlas-lime font-bold text-xs">Python Function</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-center">
                    <span className="text-white/60 block text-[10px]">WORKER N</span>
                    <span className="text-atlas-lime font-bold text-xs">Database Handler</span>
                  </div>
                </div>
              </div>

              {/* Node 5: Observability Banner */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-white/70">
                  <Activity size={15} className="text-atlas-blue" />
                  <span>Prometheus Exposition: Raw scrape endpoint at <strong>/metrics</strong></span>
                </div>
                <span className="text-atlas-lime font-bold">SLO: Sub-second state reconciliation</span>
              </div>
            </div>
          </section>

          {/* Section 3: State Machine */}
          <section id="state-machine" className="space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                03
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Execution State Machine & DAG Engine
              </h2>
            </div>

            <p className="text-sm sm:text-base text-black/80 leading-relaxed font-sans">
              Every workflow DAG is validated upfront using topological sorting. If any cyclic dependency
              is detected, the definition is rejected before touching the database.
            </p>

            {/* State Machine Transition Diagram */}
            <div className="p-5 sm:p-6 rounded-3xl bg-white border border-black/15 shadow-sm space-y-4">
              <h4 className="font-mono font-bold text-xs uppercase text-black/60 tracking-wider">
                TASK RUN FINITE STATE MACHINE (FSM)
              </h4>
              <div className="flex flex-wrap items-center justify-start sm:justify-between gap-2.5 font-mono text-xs">
                <div className="px-3.5 py-1.5 rounded-xl bg-gray-100 border border-black/10 font-bold">
                  PENDING
                </div>
                <span className="text-black/40 text-xs">──(deps)──&gt;</span>
                <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-atlas-blue border border-atlas-blue/30 font-bold">
                  READY
                </div>
                <span className="text-black/40 text-xs">──(claim)──&gt;</span>
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 font-bold">
                  RUNNING
                </div>
                <span className="text-black/40 text-xs">──(done)──&gt;</span>
                <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                  SUCCESS
                </div>
              </div>

              <div className="pt-4 border-t border-black/10 text-xs text-black/75 space-y-1.5 font-sans leading-relaxed">
                <p><strong>Failure Branch:</strong> If a task raises an uncaught exception, it transitions to <span className="font-mono font-bold text-rose-600">FAILED</span>. If attempts &lt; max_retries, it transitions to <span className="font-mono font-bold text-amber-700">RETRYING</span> with exponential backoff.</p>
                <p><strong>Dependency Resolution:</strong> When a task completes with <span className="font-mono font-bold text-emerald-700">SUCCESS</span>, the engine immediately checks all downstream dependents. If all parent tasks of a child are satisfied, the child transitions from <span className="font-mono font-bold">PENDING</span> to <span className="font-mono font-bold text-atlas-blue">READY</span> and is pushed to the Redis execution queue.</p>
              </div>
            </div>
          </section>

          {/* Section 4: Leases */}
          <section id="leases" className="space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                04
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Leases, Heartbeats & Zombie Recovery
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-black/80 leading-relaxed font-sans">
              <p>
                What happens when a worker node running an expensive ETL script loses power or suffers a kernel panic?
                In simple queue systems, the task remains locked forever.
              </p>

              <div className="p-5 sm:p-6 rounded-3xl bg-atlas-black text-white border border-white/10 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 font-mono text-xs gap-1">
                  <span className="text-atlas-lime font-bold">THE ATLAS LEASE PROTOCOL</span>
                  <span className="text-white/40">HEARTBEAT TTL: 30 SECONDS</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-atlas-lime font-bold">1. Atomic Claim</span>
                    <p className="text-white/70 font-sans text-xs">
                      Worker claims the task via an atomic lease in Redis. Status set to RUNNING in PostgreSQL.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-atlas-blue font-bold">2. Heartbeat Ping</span>
                    <p className="text-white/70 font-sans text-xs">
                      Worker background thread sends a heartbeat every 10s to extend the lease expiration window.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <span className="text-amber-400 font-bold">3. Zombie Reaper</span>
                    <p className="text-white/70 font-sans text-xs">
                      If 30s elapse without heartbeat, the lease expires. The Reaper re-queues the task to READY for another worker.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Decisions */}
          <section id="decisions" className="space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                05
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Architectural Decisions & Constraints
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-black/10 shadow-xs space-y-2">
                <span className="text-[11px] font-mono font-bold text-atlas-blue uppercase">
                  DECISION 01 // EXECUTION GUARANTEE
                </span>
                <h3 className="text-lg font-black uppercase">At-Least-Once Delivery + Idempotency</h3>
                <p className="text-xs sm:text-sm text-black/75 leading-relaxed font-sans">
                  We do not make the impossible claim of "magic exactly-once". In real distributed networks with partitions
                  and crashes, delivery is at-least-once. Atlas provides first-class idempotency keys (<code className="font-mono bg-black/5 px-1.5 py-0.5 rounded">idempotency_key</code>)
                  to guarantee that duplicate trigger requests return existing runs without repeating side-effects.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-black/10 shadow-xs space-y-2">
                <span className="text-[11px] font-mono font-bold text-atlas-lime-dark uppercase">
                  DECISION 02 // DATA STORAGE DISCIPLINE
                </span>
                <h3 className="text-lg font-black uppercase">PostgreSQL as Single Source of Truth</h3>
                <p className="text-xs sm:text-sm text-black/75 leading-relaxed font-sans">
                  Redis is strictly used as an ephemeral dispatch broker and lease manager. All durable state transitions
                  (DAG creation, run status, audit event streams, task attempts) must be committed to PostgreSQL.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-black/10 shadow-xs space-y-2">
                <span className="text-[11px] font-mono font-bold text-amber-700 uppercase">
                  DECISION 03 // SAFETY BOUNDARIES
                </span>
                <h3 className="text-lg font-black uppercase">Controlled Task Handlers vs. Arbitrary RCE</h3>
                <p className="text-xs sm:text-sm text-black/75 leading-relaxed font-sans">
                  Atlas does not permit arbitrary remote shell strings to execute unchecked on host machines.
                  Tasks must register with typed handlers: <code className="font-mono bg-black/5 px-1 py-0.5 rounded">HTTP</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">PYTHON_FUNCTION</code>, <code className="font-mono bg-black/5 px-1 py-0.5 rounded">DATABASE</code>, and <code className="font-mono bg-black/5 px-1 py-0.5 rounded">DELAY</code>.
                </p>
              </div>

              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-black/10 shadow-xs space-y-2">
                <span className="text-[11px] font-mono font-bold text-black/60 uppercase">
                  DECISION 04 // OPERATIONAL FOOTPRINT
                </span>
                <h3 className="text-lg font-black uppercase">Docker Compose Local-First Architecture</h3>
                <p className="text-xs sm:text-sm text-black/75 leading-relaxed font-sans">
                  Before scaling to cloud Kubernetes clusters, every distributed concept must run and reproduce
                  locally using Docker Compose and standard Python processes, ensuring transparent debugging.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Observability */}
          <section id="observability" className="space-y-6 scroll-mt-28">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                06
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                Observability & Metrics
              </h2>
            </div>

            <p className="text-sm sm:text-base text-black/80 leading-relaxed font-sans">
              Every state transition emits structured audit log records and Prometheus gauge/counter metrics at
              the standard <code className="font-mono bg-black/5 px-1.5 py-0.5 rounded">/metrics</code> endpoint.
            </p>

            <div className="rounded-2xl bg-white border border-black/10 p-5 shadow-xs font-mono text-xs space-y-2 overflow-x-auto terminal-scrollbar">
              <p className="font-bold text-black/60 uppercase text-[10px]">Exposed Prometheus Metrics</p>
              <ul className="space-y-1.5 text-black/75 min-w-[400px]">
                <li><code className="text-atlas-blue font-bold">atlas_tasks_total&#123;status="SUCCESS"&#125;</code>: Total completed tasks counter</li>
                <li><code className="text-rose-600 font-bold">atlas_tasks_total&#123;status="FAILED"&#125;</code>: Total failed tasks counter</li>
                <li><code className="text-emerald-700 font-bold">atlas_active_workers_gauge</code>: Count of live registered workers</li>
                <li><code className="text-amber-700 font-bold">atlas_queue_depth_gauge</code>: Real-time task queue depth in Redis</li>
                <li><code className="text-black font-bold">atlas_task_duration_seconds_bucket</code>: Histogram latency of executions</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Quickstart & API */}
          <section id="quickstart" className="space-y-6 scroll-mt-28 pb-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-atlas-lime border border-black/20 flex items-center justify-center text-atlas-black font-bold font-mono flex-shrink-0">
                07
              </div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
                API Reference & Developer Quickstart
              </h2>
            </div>

            <div className="space-y-4">
              {/* Code Snippet 1 */}
              <div className="rounded-2xl bg-[#0E1015] border border-white/10 p-4 sm:p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-3 gap-2">
                  <span className="text-atlas-lime font-bold truncate">Define Workflow in Python (DAG)</span>
                  <button
                    onClick={() => handleCopy(`from atlas.workflow.dag import DAGDefinition, TaskDefinition

pipeline = DAGDefinition(
    name="order-fulfillment-dag",
    tasks=[
        TaskDefinition(key="validate_payment", name="Validate Payment", type="HTTP"),
        TaskDefinition(key="reserve_inventory", name="Reserve Inventory", type="PYTHON_FUNCTION", dependencies=["validate_payment"]),
        TaskDefinition(key="generate_invoice", name="Generate Invoice", type="PYTHON_FUNCTION", dependencies=["reserve_inventory"]),
        TaskDefinition(key="send_notification", name="Send Notification", type="HTTP", dependencies=["generate_invoice"]),
    ],
)`, "code1")}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-all flex-shrink-0"
                  >
                    {copiedId === "code1" ? <Check size={12} className="text-atlas-lime" /> : <Copy size={12} />}
                    <span>{copiedId === "code1" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs text-white/90 overflow-x-auto terminal-scrollbar leading-relaxed">
{`from atlas.workflow.dag import DAGDefinition, TaskDefinition

pipeline = DAGDefinition(
    name="order-fulfillment-dag",
    tasks=[
        TaskDefinition(key="validate_payment", name="Validate Payment", type="HTTP"),
        TaskDefinition(key="reserve_inventory", name="Reserve Inventory", type="PYTHON_FUNCTION", dependencies=["validate_payment"]),
        TaskDefinition(key="generate_invoice", name="Generate Invoice", type="PYTHON_FUNCTION", dependencies=["reserve_inventory"]),
        TaskDefinition(key="send_notification", name="Send Notification", type="HTTP", dependencies=["generate_invoice"]),
    ],
)`}
                </pre>
              </div>

              {/* Code Snippet 2 */}
              <div className="rounded-2xl bg-[#0E1015] border border-white/10 p-4 sm:p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between text-xs font-mono border-b border-white/10 pb-3 gap-2">
                  <span className="text-atlas-lime font-bold truncate">Trigger Execution via cURL</span>
                  <button
                    onClick={() => handleCopy(`curl -X POST http://localhost:8000/workflows/{workflow_id}/runs \\
  -H "Content-Type: application/json" \\
  -d '{
    "idempotency_key": "order-req-20260919-01",
    "context_data": {
      "order_id": "ORD-9921",
      "customer_tier": "ENTERPRISE"
    }
  }'`, "code2")}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-all flex-shrink-0"
                  >
                    {copiedId === "code2" ? <Check size={12} className="text-atlas-lime" /> : <Copy size={12} />}
                    <span>{copiedId === "code2" ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <pre className="font-mono text-xs text-white/90 overflow-x-auto terminal-scrollbar leading-relaxed">
{`curl -X POST http://localhost:8000/workflows/{workflow_id}/runs \\
  -H "Content-Type: application/json" \\
  -d '{
    "idempotency_key": "order-req-20260919-01",
    "context_data": {
      "order_id": "ORD-9921",
      "customer_tier": "ENTERPRISE"
    }
  }'`}
                </pre>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
