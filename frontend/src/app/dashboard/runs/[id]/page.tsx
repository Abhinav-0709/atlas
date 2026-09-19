"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import BentoCard from "@/components/BentoCard";
import TaskStatusPill from "@/components/TaskStatusPill";
import DAGVisualizer from "@/components/DAGVisualizer";
import { fetchRun, fetchRunEvents, cancelWorkflowRun } from "@/lib/api";
import { WorkflowRun, AuditEvent, TaskRun } from "@/lib/types";
import {
  ArrowLeft,
  RefreshCw,
  XCircle,
  Clock,
  Key,
  Layers,
  FileCode,
  Terminal,
} from "lucide-react";

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const runId = params.id as string;

  const [run, setRun] = useState<WorkflowRun | null>(null);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  const loadRunData = async () => {
    if (!runId) return;
    try {
      const [r, evs] = await Promise.all([fetchRun(runId), fetchRunEvents(runId)]);
      if (r) {
        setRun(r);
        if (r.tasks && r.tasks.length > 0 && !selectedTask) {
          setSelectedTask(r.tasks[0]);
        }
      }
      setEvents(evs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRunData();
    const interval = setInterval(() => {
      if (run?.status === "RUNNING" || run?.status === "PENDING") {
        loadRunData();
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [runId, run?.status]);

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this workflow execution?")) return;
    setCancelling(true);
    try {
      await cancelWorkflowRun(runId);
      await loadRunData();
    } catch (err: any) {
      alert(`Cancellation error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading && !run) {
    return (
      <div className="p-16 text-center font-mono text-sm uppercase tracking-wider text-black/60">
        Loading execution run details...
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-16 text-center space-y-4">
        <h2 className="text-2xl font-black uppercase">Run Not Found</h2>
        <p className="font-mono text-xs text-black/60">The specified execution does not exist.</p>
        <Link href="/dashboard" className="inline-block px-5 py-2 rounded-full bg-atlas-black text-atlas-lime font-bold text-xs uppercase">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/dashboard"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border-2 border-black/20 flex items-center justify-center hover:bg-black/5 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight">
                Run #{run.id.slice(0, 8)}
              </h1>
              <TaskStatusPill status={run.status} size="md" />
            </div>
            <div className="font-mono text-[11px] sm:text-xs text-black/60 mt-1 truncate max-w-[260px] sm:max-w-md">
              UUID: {run.id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={loadRunData}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border-2 border-black/20 bg-white font-mono text-xs uppercase font-bold hover:bg-black/5 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          {(run.status === "RUNNING" || run.status === "PENDING") && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider hover:bg-rose-700 transition-all shadow-sm"
            >
              <XCircle size={14} />
              <span>{cancelling ? "Cancelling..." : "Cancel Run"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Metadata Bento Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border-2 border-black/15">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-black/50 font-bold mb-1">
            Status
          </span>
          <TaskStatusPill status={run.status} size="sm" />
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-black/15">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-black/50 font-bold mb-1">
            Idempotency Key
          </span>
          <span className="font-mono text-xs font-bold text-black truncate block">
            {run.idempotency_key || "None (Non-idempotent)"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-black/15">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-black/50 font-bold mb-1">
            Started At
          </span>
          <span className="font-mono text-xs text-black block">
            {run.started_at ? new Date(run.started_at).toLocaleTimeString() : "--"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-black/15">
          <span className="block font-mono text-[10px] uppercase tracking-wider text-black/50 font-bold mb-1">
            Completed At
          </span>
          <span className="font-mono text-xs text-black block">
            {run.completed_at ? new Date(run.completed_at).toLocaleTimeString() : "--"}
          </span>
        </div>
      </div>

      {/* DAG Visualizer Card */}
      <BentoCard variant="white" className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-black/15 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-atlas-black text-atlas-lime flex items-center justify-center font-bold flex-shrink-0">
              <Layers size={15} />
            </div>
            <h3 className="font-black text-lg sm:text-xl uppercase tracking-tight">
              Interactive DAG Graph Execution
            </h3>
          </div>
          <span className="font-mono text-[11px] sm:text-xs text-black/50 uppercase hidden xs:inline">
            Click node to view details
          </span>
        </div>

        <DAGVisualizer
          tasks={run.tasks || []}
          selectedTaskKey={selectedTask?.task_key}
          onSelectTask={(t) => setSelectedTask(t)}
        />
      </BentoCard>

      {/* Task Details Drawer & Events Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selected Task Inspection Panel */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4 sm:p-6 border border-black/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/10">
            <h4 className="font-black text-lg uppercase tracking-tight">
              Task Details
            </h4>
            {selectedTask && <TaskStatusPill status={selectedTask.status} size="sm" />}
          </div>

          {selectedTask ? (
            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-black/50 uppercase block text-[10px] font-bold">
                  Task Key
                </span>
                <span className="font-bold text-sm">{selectedTask.task_key}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-black/50 uppercase block text-[10px] font-bold">
                    Attempts
                  </span>
                  <span>{selectedTask.current_attempt || 0}</span>
                </div>
                <div>
                  <span className="text-black/50 uppercase block text-[10px] font-bold">
                    Assigned Worker
                  </span>
                  <span className="truncate block">
                    {selectedTask.worker_id || "Unassigned"}
                  </span>
                </div>
              </div>

              {selectedTask.scheduled_retry_at && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                  <span className="font-bold">Next Retry Scheduled: </span>
                  {new Date(selectedTask.scheduled_retry_at).toLocaleTimeString()}
                </div>
              )}

              {selectedTask.error_message && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  <span className="font-bold block mb-1">Execution Error:</span>
                  <pre className="whitespace-pre-wrap text-[11px]">
                    {selectedTask.error_message}
                  </pre>
                </div>
              )}

              {selectedTask.output_data && (
                <div>
                  <span className="text-black/50 uppercase block text-[10px] font-bold mb-1">
                    Output Payload
                  </span>
                  <pre className="p-3 rounded-xl bg-black/5 border border-black/10 overflow-x-auto text-[11px]">
                    {JSON.stringify(selectedTask.output_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center text-xs font-mono text-black/50">
              Select a task node in the DAG above to inspect attempts and outputs.
            </div>
          )}
        </div>

        {/* Audit Events Timeline */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-4 sm:p-6 border border-black/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-black/10">
            <h4 className="font-black text-lg uppercase tracking-tight">
              Audit Event Stream
            </h4>
            <span className="font-mono text-xs text-black/50">
              {events.length} Events
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto terminal-scrollbar space-y-2 pr-2">
            {events.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-black/50">
                No events recorded for this run.
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-black/5 border border-black/10 font-mono text-xs flex items-start justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-atlas-blue uppercase">
                      {ev.event_type}
                    </span>
                    {ev.task_key && (
                      <span className="text-black/70 ml-2 font-semibold">
                        [{ev.task_key}]
                      </span>
                    )}
                    {ev.payload && Object.keys(ev.payload).length > 0 && (
                      <div className="text-[10px] text-black/50 mt-1 truncate max-w-sm">
                        {JSON.stringify(ev.payload)}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-black/40 whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
