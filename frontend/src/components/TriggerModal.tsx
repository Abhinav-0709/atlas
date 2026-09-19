"use client";

import { useState } from "react";
import { Workflow } from "@/lib/types";
import { triggerWorkflow } from "@/lib/api";
import { X, Play, Key, Database, Sparkles } from "lucide-react";

interface TriggerModalProps {
  workflows: Workflow[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (runId: string) => void;
  defaultWorkflowId?: string;
}

export default function TriggerModal({
  workflows,
  isOpen,
  onClose,
  onSuccess,
  defaultWorkflowId,
}: TriggerModalProps) {
  const [workflowId, setWorkflowId] = useState<string>(
    defaultWorkflowId || workflows[0]?.id || ""
  );
  const [idempKey, setIdempKey] = useState<string>("");
  const [contextData, setContextData] = useState<string>(
    JSON.stringify({ order_id: "ORD-9921", priority: "HIGH" }, null, 2)
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let parsedContext = {};
    try {
      if (contextData.trim()) {
        parsedContext = JSON.parse(contextData);
      }
    } catch (err: any) {
      setError(`Invalid JSON context: ${err.message}`);
      setLoading(false);
      return;
    }

    try {
      const run = await triggerWorkflow(workflowId, {
        idempotency_key: idempKey.trim() || undefined,
        context_data: parsedContext,
      });
      onSuccess(run.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to trigger run");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-atlas-cream border-2 border-atlas-black rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/15 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">✦</span>
            <h3 className="font-black text-xl uppercase tracking-tight">
              Trigger Execution
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center hover:bg-black/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 text-xs font-mono rounded-xl">
              {error}
            </div>
          )}

          {/* Workflow selection */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider font-bold mb-2">
              Target Workflow DAG
            </label>
            <select
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="w-full bg-white border-2 border-black/20 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-hidden focus:border-atlas-blue"
              required
            >
              {workflows.map((wf) => (
                <option key={wf.id} value={wf.id}>
                  {wf.name} (v{wf.active_version})
                </option>
              ))}
            </select>
          </div>

          {/* Idempotency key */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-mono text-xs uppercase tracking-wider font-bold">
                Idempotency Key (Optional)
              </label>
              <span className="text-[10px] font-mono text-black/50">
                Safe duplicates
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. checkout-session-88029"
                value={idempKey}
                onChange={(e) => setIdempKey(e.target.value)}
                className="w-full bg-white border-2 border-black/20 rounded-xl px-3 py-2.5 font-mono text-xs focus:outline-hidden focus:border-atlas-blue"
              />
            </div>
            <p className="text-[11px] text-black/60 mt-1">
              Repeated requests with this key safely return the same execution.
            </p>
          </div>

          {/* Input JSON Context */}
          <div>
            <label className="block font-mono text-xs uppercase tracking-wider font-bold mb-2">
              Input Context (JSON)
            </label>
            <textarea
              rows={4}
              value={contextData}
              onChange={(e) => setContextData(e.target.value)}
              className="w-full bg-white border-2 border-black/20 rounded-xl p-3 font-mono text-xs focus:outline-hidden focus:border-atlas-blue"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/15">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border-2 border-black/20 font-bold text-xs uppercase tracking-wider hover:bg-black/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-atlas-black text-atlas-lime font-black text-xs uppercase tracking-wider hover:bg-atlas-blue hover:text-white transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Play size={14} className="fill-current" />
              <span>{loading ? "Dispatching..." : "Launch Run"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
