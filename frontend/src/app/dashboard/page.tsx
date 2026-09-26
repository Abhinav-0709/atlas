"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BentoCard from "@/components/BentoCard";
import TaskStatusPill from "@/components/TaskStatusPill";
import TriggerModal from "@/components/TriggerModal";
import {
  fetchWorkflows,
  fetchWorkflowRuns,
  cleanupWorkflowRuns,
  deleteWorkflowRun,
} from "@/lib/api";
import { Workflow, WorkflowRun } from "@/lib/types";
import {
  Play,
  ArrowUpRight,
  RefreshCw,
  Layers,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Cpu,
  Trash2,
  Sparkles,
  GitBranch,
  Repeat,
  AlertTriangle,
  ArrowRight,
  Check,
  Globe,
  Hourglass,
  SlidersHorizontal,
} from "lucide-react";

function getWorkflowCategory(name: string) {
  if (name.toLowerCase().includes("order") || name.toLowerCase().includes("fulfillment")) {
    return {
      tag: "E-Commerce & Logistics",
      color: "bg-blue-50 text-blue-800 border-blue-200",
      icon: "💳",
    };
  }
  if (name.toLowerCase().includes("embedding") || name.toLowerCase().includes("data") || name.toLowerCase().includes("sync")) {
    return {
      tag: "AI & Vector Sync",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200",
      icon: "🧠",
    };
  }
  return {
    tag: "Distributed Pipeline",
    color: "bg-purple-50 text-purple-800 border-purple-200",
    icon: "⚡",
  };
}

function getTaskIcon(type?: string) {
  const t = (type || "").toUpperCase();
  if (t.includes("HTTP")) return <Globe size={11} className="text-sky-600" />;
  if (t.includes("DELAY")) return <Hourglass size={11} className="text-amber-600" />;
  return <Cpu size={11} className="text-emerald-600" />;
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SUCCESS" | "FAILED">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWfId, setSelectedWfId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const wfs = await fetchWorkflows();
      setWorkflows(wfs);

      let runs: WorkflowRun[] = [];
      for (const wf of wfs) {
        const r = await fetchWorkflowRuns(wf.id);
        runs.push(...r);
      }
      runs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentRuns(runs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const openTrigger = (wfId?: string) => {
    setSelectedWfId(wfId);
    setModalOpen(true);
  };

  const handleCleanFailed = async () => {
    if (!confirm("Clean up all failed and cancelled test executions?")) return;
    setCleaning(true);
    try {
      const res = await cleanupWorkflowRuns();
      setCleanMessage(`Cleaned ${res.cleaned_count} test execution runs.`);
      await loadData();
      setTimeout(() => setCleanMessage(null), 4000);
    } catch (err: any) {
      alert(`Cleanup failed: ${err.message}`);
    } finally {
      setCleaning(false);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, runId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this execution record?")) return;
    try {
      await deleteWorkflowRun(runId);
      setRecentRuns((prev) => prev.filter((r) => r.id !== runId));
    } catch (err: any) {
      alert(`Failed to delete run: ${err.message}`);
    }
  };

  const filteredRuns = recentRuns.filter((r) => {
    if (statusFilter === "SUCCESS") return r.status === "SUCCESS";
    if (statusFilter === "FAILED") return r.status === "FAILED" || r.status === "CANCELLED";
    return true;
  });

  return (
    <div className="space-y-10">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight">
              Workflows & Orchestration
            </h1>
            <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-atlas-lime font-black uppercase text-atlas-black">
              Production Ready
            </span>
          </div>
          <p className="font-mono text-xs text-black/60 uppercase tracking-wider mt-1">
            Durable DAG execution engine with lease recovery, heartbeats &amp; atomic task claiming
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border-2 border-black/20 bg-white font-mono text-xs uppercase font-bold hover:bg-black/5 transition-all shadow-xs"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openTrigger()}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-atlas-black text-atlas-lime font-black text-xs uppercase tracking-wider hover:bg-atlas-blue hover:text-white transition-all shadow-md"
          >
            <Play size={14} className="fill-current" />
            <span>Trigger Execution</span>
          </button>
        </div>
      </div>

      {/* Clean Feedback Alert */}
      {cleanMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 font-mono text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{cleanMessage}</span>
          </div>
          <button onClick={() => setCleanMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* WORKFLOW CARDS SECTION (Replacing plain table with high-end product showcase) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-atlas-blue text-white flex items-center justify-center font-bold">
              <Layers size={15} />
            </div>
            <h2 className="font-black text-xl uppercase tracking-tight">
              Registered Workflow Catalog
            </h2>
          </div>
          <span className="font-mono text-xs text-black/50 uppercase">
            {workflows.length} DAGs configured &amp; operational
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {workflows.map((wf) => {
            const cat = getWorkflowCategory(wf.name);
            const tasks = wf.definition?.tasks || [];

            return (
              <div
                key={wf.id}
                className="p-6 rounded-3xl bg-white border-2 border-black/15 shadow-sm hover:border-atlas-blue/60 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div>
                  {/* Category Pill & Version */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border font-mono ${cat.color}`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.tag}</span>
                    </span>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-atlas-black text-atlas-lime font-bold">
                      v{wf.active_version}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-black uppercase tracking-tight text-black group-hover:text-atlas-blue transition-colors">
                    {wf.name}
                  </h3>
                  <p className="text-xs text-black/70 mt-1.5 leading-relaxed line-clamp-2">
                    {wf.description || "Distributed task orchestration pipeline with fault tolerance."}
                  </p>

                  {/* Visual Pipeline Stepper (Visual DAG Preview) */}
                  <div className="mt-5 p-3.5 rounded-2xl bg-black/5 border border-black/10">
                    <span className="block font-mono text-[10px] uppercase tracking-wider text-black/50 font-bold mb-2">
                      Pipeline Architecture ({tasks.length || 3} Tasks)
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto terminal-scrollbar pb-1">
                      {tasks.map((t, idx) => (
                        <div key={t.key} className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-black/15 shadow-2xs font-mono text-[11px] font-bold text-black">
                            {getTaskIcon(t.type)}
                            <span>{t.name || t.key}</span>
                          </div>
                          {idx < tasks.length - 1 && (
                            <ArrowRight size={13} className="text-black/30 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resilience Mechanism Badges */}
                  <div className="mt-4 flex items-center gap-2 flex-wrap text-[10px] font-mono text-black/60 font-semibold">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 border border-black/10">
                      <ShieldCheck size={11} className="text-emerald-700" />
                      <span>30s Lease TTL</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 border border-black/10">
                      <Repeat size={11} className="text-atlas-blue" />
                      <span>Exp Backoff Jitter</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/5 border border-black/10">
                      <Zap size={11} className="text-amber-600" />
                      <span>Crash Auto-Recovery</span>
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-black/10 flex items-center justify-between">
                  <span className="font-mono text-[11px] text-black/50">
                    ID: {wf.id.slice(0, 8)}..
                  </span>
                  <button
                    onClick={() => openTrigger(wf.id)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full bg-atlas-black text-atlas-lime hover:bg-atlas-blue hover:text-white font-black text-xs uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Play size={12} className="fill-current" />
                    <span>Run Pipeline</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CORE RESILIENCE & DISTRIBUTED MECHANISMS (Visual Product Proof) */}
      <BentoCard variant="cream" className="p-6 sm:p-8 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-atlas-blue" />
            <h2 className="font-black text-xl uppercase tracking-tight">
              Under-The-Hood Distributed Mechanics
            </h2>
          </div>
          <p className="font-mono text-xs text-black/60 mt-1 uppercase tracking-wider">
            How Atlas guarantees fault tolerance, zero task loss, and deterministic DAG state transitions
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border-2 border-black/15 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <ShieldCheck size={16} />
            </div>
            <h4 className="font-black text-sm uppercase tracking-tight">
              1. Atomic Task Leasing
            </h4>
            <p className="text-xs text-black/70 leading-relaxed">
              Workers claim tasks via atomic database row updates with strict TTL leases. Prevents race conditions and double executions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-black/15 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <Zap size={16} />
            </div>
            <h4 className="font-black text-sm uppercase tracking-tight">
              2. Crash Recovery Reaper
            </h4>
            <p className="text-xs text-black/70 leading-relaxed">
              If an EC2 worker node dies mid-execution, the background reaper detects the expired lease within 15s and safely re-queues the task.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-black/15 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <GitBranch size={16} />
            </div>
            <h4 className="font-black text-sm uppercase tracking-tight">
              3. Topological DAG Engine
            </h4>
            <p className="text-xs text-black/70 leading-relaxed">
              Cycle-validated Directed Acyclic Graphs. Downstream tasks stay pending until all required parent nodes succeed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border-2 border-black/15 space-y-2 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <Repeat size={16} />
            </div>
            <h4 className="font-black text-sm uppercase tracking-tight">
              4. Exponential Backoff
            </h4>
            <p className="text-xs text-black/70 leading-relaxed">
              Configurable retries with randomized jitter to prevent thundering herd spikes on downstream external APIs.
            </p>
          </div>
        </div>
      </BentoCard>

      {/* RECENT EXECUTIONS & DATA CLEANING SECTION */}
      <BentoCard variant="white" className="p-4 sm:p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-black/15 gap-4">
          <div>
            <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight">
              Execution Runs &amp; Audit Logs
            </h2>
            <span className="font-mono text-xs text-black/50 uppercase">
              Click any execution to inspect live DAG state &amp; payload telemetry
            </span>
          </div>

          {/* Data Cleaning Actions & Status Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="flex items-center rounded-xl bg-black/5 p-1 border border-black/10 text-xs font-mono">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === "ALL" ? "bg-white text-black shadow-2xs" : "text-black/60 hover:text-black"
                }`}
              >
                All ({recentRuns.length})
              </button>
              <button
                onClick={() => setStatusFilter("SUCCESS")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === "SUCCESS" ? "bg-white text-black shadow-2xs" : "text-black/60 hover:text-black"
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setStatusFilter("FAILED")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  statusFilter === "FAILED" ? "bg-white text-black shadow-2xs" : "text-black/60 hover:text-black"
                }`}
              >
                Failed
              </button>
            </div>

            {/* Clean Failed Runs Action */}
            <button
              onClick={handleCleanFailed}
              disabled={cleaning}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors font-mono text-xs font-bold shadow-2xs"
              title="Clean all failed test runs from database"
            >
              <Trash2 size={13} />
              <span>{cleaning ? "Cleaning..." : "Purge Failed"}</span>
            </button>
          </div>
        </div>

        {filteredRuns.length === 0 ? (
          <div className="p-14 text-center font-mono text-xs uppercase text-black/50 border-2 border-dashed border-black/15 rounded-2xl space-y-2">
            <div>No executions found for this filter.</div>
            <button
              onClick={() => openTrigger()}
              className="text-atlas-blue font-bold hover:underline"
            >
              Trigger a fresh execution ➔
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/dashboard/runs/${run.id}`)}
                className="cursor-pointer p-5 rounded-2xl bg-white border-2 border-black/15 hover:border-atlas-blue hover:-translate-y-1 transition-all shadow-sm flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-black/70">
                      RUN #{run.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <TaskStatusPill status={run.status} size="sm" />
                      <button
                        onClick={(e) => handleDeleteSingle(e, run.id)}
                        className="text-black/30 hover:text-rose-600 transition-colors p-1"
                        title="Delete Run"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {run.workflow_name && (
                    <div className="text-sm font-black uppercase text-black group-hover:text-atlas-blue transition-colors mb-1 truncate">
                      {run.workflow_name}
                    </div>
                  )}

                  {run.idempotency_key && (
                    <div className="text-[11px] font-mono text-black/50 truncate mb-2">
                      Key: {run.idempotency_key}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between font-mono text-xs text-black/60 mt-3">
                  <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                  <span className="text-atlas-blue font-bold flex items-center gap-1 group-hover:underline">
                    View Execution ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </BentoCard>

      {/* Trigger Modal */}
      <TriggerModal
        workflows={workflows}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultWorkflowId={selectedWfId}
        onSuccess={(newRunId) => {
          loadData();
          router.push(`/dashboard/runs/${newRunId}`);
        }}
      />
    </div>
  );
}
