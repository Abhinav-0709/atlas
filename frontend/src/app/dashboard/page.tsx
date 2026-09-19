"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BentoCard from "@/components/BentoCard";
import TaskStatusPill from "@/components/TaskStatusPill";
import TriggerModal from "@/components/TriggerModal";
import { fetchWorkflows, fetchWorkflowRuns } from "@/lib/api";
import { Workflow, WorkflowRun } from "@/lib/types";
import { Play, ArrowUpRight, RefreshCw, Layers, Clock, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recentRuns, setRecentRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWfId, setSelectedWfId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const wfs = await fetchWorkflows();
      setWorkflows(wfs);

      // Fetch runs for first workflow if available
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

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight">
            Workflows & Executions
          </h1>
          <p className="font-mono text-xs text-black/60 uppercase tracking-wider mt-1">
            Browse registered DAG definitions and inspect real-time execution states
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full border-2 border-black/20 bg-white font-mono text-xs uppercase font-bold hover:bg-black/5 transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => openTrigger()}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-atlas-black text-atlas-lime font-black text-xs uppercase tracking-wider hover:bg-atlas-blue hover:text-white transition-all shadow-md"
          >
            <Play size={14} className="fill-current" />
            <span>Trigger Run</span>
          </button>
        </div>
      </div>

      {/* Workflows Table Card */}
      <BentoCard variant="white" className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-black/15 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-atlas-blue text-white flex items-center justify-center font-bold flex-shrink-0">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight">
                Registered Workflows
              </h2>
              <span className="font-mono text-xs text-black/50 uppercase">
                {workflows.length} DAGs configured
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto terminal-scrollbar -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full text-left font-sans min-w-[650px]">
            <thead>
              <tr className="border-b-2 border-black/10 text-[11px] font-mono text-black/50 uppercase tracking-wider">
                <th className="pb-3 pl-2">Workflow Name</th>
                <th className="pb-3">ID</th>
                <th className="pb-3">Version</th>
                <th className="pb-3">Tasks</th>
                <th className="pb-3">Created</th>
                <th className="pb-3 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {workflows.map((wf) => (
                <tr key={wf.id} className="hover:bg-black/5 transition-colors group">
                  <td className="py-4 pl-2 font-bold">
                    <div className="text-base">{wf.name}</div>
                    {wf.description && (
                      <div className="text-xs text-black/60 font-normal line-clamp-1 max-w-md">
                        {wf.description}
                      </div>
                    )}
                  </td>
                  <td className="py-4 font-mono text-xs text-black/60">
                    {wf.id.slice(0, 12)}...
                  </td>
                  <td className="py-4">
                    <span className="px-2.5 py-1 rounded-full bg-atlas-black text-atlas-lime font-mono text-xs font-bold">
                      v{wf.active_version}
                    </span>
                  </td>
                  <td className="py-4 font-mono font-bold">
                    {wf.tasks_count || wf.definition?.tasks?.length || 3} Tasks
                  </td>
                  <td className="py-4 font-mono text-xs text-black/60">
                    {new Date(wf.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-right pr-2">
                    <button
                      onClick={() => openTrigger(wf.id)}
                      className="px-4 py-1.5 rounded-full bg-atlas-blue text-white font-black text-xs uppercase tracking-wider hover:bg-atlas-blue-dark transition-all shadow-sm"
                    >
                      Run DAG
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </BentoCard>

      {/* Recent Executions Grid */}
      <BentoCard variant="white" className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-black/15 mb-6">
          <div>
            <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight">
              Recent Execution Runs
            </h2>
            <span className="font-mono text-xs text-black/50 uppercase">
              Click any execution to inspect live DAG flow
            </span>
          </div>
        </div>

        {recentRuns.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs uppercase text-black/50 border-2 border-dashed border-black/15 rounded-2xl">
            No executions recorded yet. Click "Trigger Run" above to start a workflow execution.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                onClick={() => router.push(`/dashboard/runs/${run.id}`)}
                className="cursor-pointer p-5 rounded-2xl bg-white border-2 border-black/15 hover:border-atlas-blue hover:-translate-y-1 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-black/60">
                      RUN #{run.id.slice(0, 8)}
                    </span>
                    <TaskStatusPill status={run.status} size="sm" />
                  </div>

                  {run.idempotency_key && (
                    <div className="text-[11px] font-mono text-black/50 truncate mb-2">
                      Key: {run.idempotency_key}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-black/10 flex items-center justify-between font-mono text-xs text-black/60 mt-3">
                  <span>{new Date(run.created_at).toLocaleTimeString()}</span>
                  <span className="text-atlas-blue font-bold flex items-center gap-1 group-hover:underline">
                    View DAG ➔
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
