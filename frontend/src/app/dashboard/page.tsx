"use client";

import { useEffect, useState, useMemo } from "react";
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
  ArrowRight,
  Globe,
  Hourglass,
  Search,
  Check,
} from "lucide-react";

function getWorkflowMeta(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("order") || lower.includes("fulfillment")) {
    return {
      category: "E-Commerce & Logistics",
      color: "bg-sky-50 text-sky-700 border-sky-200",
      icon: "💳",
      defaultTasks: ["Validate Payment", "Reserve Inventory", "Notify Warehouse", "Send Confirmation"],
    };
  }
  if (lower.includes("embedding") || lower.includes("data") || lower.includes("sync")) {
    return {
      category: "AI & Vector Sync",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: "🧠",
      defaultTasks: ["Fetch Corpus", "Neural Embeddings", "Commit Vector Store"],
    };
  }
  return {
    category: "General Pipeline",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "⚡",
    defaultTasks: ["Validate", "Execute", "Complete"],
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanMessage, setCleanMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      setCleanMessage(`Purged ${res.cleaned_count} test executions.`);
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

  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows;
    const q = searchQuery.toLowerCase();
    return workflows.filter(
      (w) => w.name.toLowerCase().includes(q) || (w.description && w.description.toLowerCase().includes(q))
    );
  }, [workflows, searchQuery]);

  const filteredRuns = recentRuns.filter((r) => {
    if (statusFilter === "SUCCESS") return r.status === "SUCCESS";
    if (statusFilter === "FAILED") return r.status === "FAILED" || r.status === "CANCELLED";
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Sleek Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/10">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Workflows &amp; Orchestration
            </h1>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Online
            </span>
          </div>
          <p className="font-mono text-xs text-black/50 mt-0.5">
            Durable DAG execution engine with lease recovery, heartbeats &amp; atomic task claiming
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-black/15 bg-white font-mono text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openTrigger()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-atlas-blue transition-colors shadow-2xs"
          >
            <Play size={12} className="fill-current" />
            <span>Trigger Execution</span>
          </button>
        </div>
      </div>

      {/* Clean Feedback Alert */}
      {cleanMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>{cleanMessage}</span>
          </div>
          <button onClick={() => setCleanMessage(null)} className="text-emerald-700 hover:text-emerald-950 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* WORKFLOW CATALOG (High-Density, Modern List UX) */}
      <div className="bg-white rounded-2xl border border-black/10 shadow-xs overflow-hidden">
        {/* Table/Directory Header Bar */}
        <div className="p-4 sm:px-6 border-b border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-atlas-blue text-white flex items-center justify-center font-bold">
              <Layers size={13} />
            </div>
            <h2 className="font-bold text-sm text-slate-900 uppercase tracking-wide">
              Registered Workflows
            </h2>
            <span className="font-mono text-xs text-black/50 ml-1">
              ({workflows.length})
            </span>
          </div>

          {/* Search filter input */}
          <div className="relative w-full sm:w-64">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black/40" />
            <input
              type="text"
              placeholder="Filter workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-black/15 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-atlas-blue"
            />
          </div>
        </div>

        {/* Directory Items List */}
        <div className="divide-y divide-black/5">
          {filteredWorkflows.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-black/50">
              No workflows found.
            </div>
          ) : (
            filteredWorkflows.map((wf) => {
              const meta = getWorkflowMeta(wf.name);
              // Use real tasks list, or definition tasks, or fallback
              const taskNames =
                wf.tasks && wf.tasks.length > 0
                  ? wf.tasks
                  : wf.definition?.tasks && wf.definition.tasks.length > 0
                  ? wf.definition.tasks.map((t) => t.name || t.key)
                  : meta.defaultTasks;

              return (
                <div
                  key={wf.id}
                  className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
                >
                  {/* Left: Workflow Identity & Description */}
                  <div className="space-y-1 min-w-0 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-atlas-blue transition-colors">
                        {wf.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${meta.color}`}>
                        {meta.category}
                      </span>
                      <span className="font-mono text-[10px] text-black/40">
                        v{wf.active_version || 1}
                      </span>
                    </div>

                    <p className="text-xs text-black/60 leading-relaxed line-clamp-1">
                      {wf.description || "Distributed DAG workflow pipeline."}
                    </p>
                  </div>

                  {/* Middle: Sleek Step Sequence Chips (No big empty boxes!) */}
                  <div className="flex items-center gap-1.5 overflow-x-auto terminal-scrollbar py-1">
                    {taskNames.map((stepName, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-700 font-medium">
                          {stepName}
                        </span>
                        {sIdx < taskNames.length - 1 && (
                          <ArrowRight size={11} className="text-black/30 flex-shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 self-end lg:self-center flex-shrink-0">
                    <span className="font-mono text-[10px] text-black/40 hidden sm:inline">
                      ID: {wf.id.slice(0, 8)}
                    </span>
                    <button
                      onClick={() => openTrigger(wf.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-atlas-blue font-bold text-xs transition-colors shadow-2xs"
                    >
                      <Play size={11} className="fill-current" />
                      <span>Run DAG</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CORE RESILIENCE & DISTRIBUTED MECHANISMS (Clean & Compact) */}
      <div className="bg-slate-50/80 rounded-2xl border border-black/10 p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-atlas-blue" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              Distributed Execution Guarantees
            </h3>
          </div>
          <span className="font-mono text-[11px] text-black/50">
            Engine Architecture
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-black/10 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
              <ShieldCheck size={14} className="text-sky-600" />
              <span>Atomic Lease Locks</span>
            </div>
            <p className="text-[11px] text-black/60 leading-normal">
              Exclusive DB worker claiming with 30s TTL prevents duplicate concurrent runs.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-black/10 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
              <Zap size={14} className="text-amber-500" />
              <span>Crash Recovery Reaper</span>
            </div>
            <p className="text-[11px] text-black/60 leading-normal">
              Background reaper detects dead worker leases within 15s and cleanly re-queues.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-black/10 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
              <GitBranch size={14} className="text-emerald-600" />
              <span>Topological DAG Engine</span>
            </div>
            <p className="text-[11px] text-black/60 leading-normal">
              Cycle detection guarantees downstream tasks unlock only when parents succeed.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-black/10 space-y-1 shadow-2xs">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
              <Repeat size={14} className="text-purple-600" />
              <span>Exponential Backoff</span>
            </div>
            <p className="text-[11px] text-black/60 leading-normal">
              Jittered automatic retries eliminate thundering herd spikes on dependencies.
            </p>
          </div>
        </div>
      </div>

      {/* RECENT EXECUTIONS & DATA CLEANING SECTION */}
      <div className="bg-white rounded-2xl border border-black/10 shadow-xs p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-black/10 gap-3">
          <div>
            <h2 className="font-bold text-sm uppercase tracking-wide text-slate-900">
              Recent Execution Runs
            </h2>
            <span className="font-mono text-xs text-black/50">
              Click any execution to inspect live DAG state &amp; telemetry
            </span>
          </div>

          {/* Filter Tabs & Data Purge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center rounded-lg bg-black/5 p-0.5 border border-black/10 text-xs font-mono">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === "ALL" ? "bg-white text-black shadow-2xs" : "text-black/60 hover:text-black"
                }`}
              >
                All ({recentRuns.length})
              </button>
              <button
                onClick={() => setStatusFilter("SUCCESS")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === "SUCCESS" ? "bg-white text-black shadow-2xs" : "text-black/60 hover:text-black"
                }`}
              >
                Success
              </button>
              <button
                onClick={() => setStatusFilter("FAILED")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
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
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100 transition-colors font-mono text-xs font-bold shadow-2xs"
              title="Clean all failed test runs from database"
            >
              <Trash2 size={12} />
              <span>{cleaning ? "Purging..." : "Purge Failed"}</span>
            </button>
          </div>
        </div>

        {filteredRuns.length === 0 ? (
          <div className="p-10 text-center font-mono text-xs text-black/50 border border-dashed border-black/15 rounded-xl space-y-2">
            <div>No executions found for this filter.</div>
            <button
              onClick={() => openTrigger()}
              className="text-atlas-blue font-bold hover:underline"
            >
              Trigger a fresh execution ➔
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/dashboard/runs/${run.id}`)}
                className="cursor-pointer p-4 rounded-xl bg-white border border-black/10 hover:border-atlas-blue hover:shadow-xs transition-all flex flex-col justify-between group select-none"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      RUN #{run.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <TaskStatusPill status={run.status} size="sm" />
                      <button
                        onClick={(e) => handleDeleteSingle(e, run.id)}
                        className="text-black/30 hover:text-rose-600 transition-colors p-0.5"
                        title="Delete Run"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {run.workflow_name && (
                    <div className="text-xs font-bold text-slate-900 group-hover:text-atlas-blue transition-colors mb-1 truncate">
                      {run.workflow_name}
                    </div>
                  )}

                  {run.idempotency_key && (
                    <div className="text-[10px] font-mono text-black/45 truncate mb-1">
                      Key: {run.idempotency_key}
                    </div>
                  )}
                </div>

                <div className="pt-2.5 border-t border-black/5 flex items-center justify-between font-mono text-[11px] text-black/50 mt-2">
                  <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                  <span className="text-atlas-blue font-semibold flex items-center gap-1 group-hover:underline">
                    Inspect ➔
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
