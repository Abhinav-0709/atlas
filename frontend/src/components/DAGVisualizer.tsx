"use client";

import { TaskRun } from "@/lib/types";
import TaskStatusPill from "./TaskStatusPill";
import { ArrowRight, CheckCircle2, Clock, Globe, Cpu, Hourglass, AlertTriangle, ShieldCheck } from "lucide-react";

interface DAGVisualizerProps {
  tasks: TaskRun[];
  onSelectTask?: (task: TaskRun) => void;
  selectedTaskKey?: string | null;
}

function formatTaskTitle(task: TaskRun): string {
  if (task.task_name) return task.task_name;
  return task.task_key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getTaskTypeBadge(type?: string | null) {
  if (!type) return null;
  const upper = type.toUpperCase();
  if (upper.includes("HTTP")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 text-[10px] font-mono font-bold uppercase">
        <Globe size={10} />
        <span>HTTP</span>
      </span>
    );
  }
  if (upper.includes("PYTHON")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold uppercase">
        <Cpu size={10} />
        <span>Compute</span>
      </span>
    );
  }
  if (upper.includes("DELAY")) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-mono font-bold uppercase">
        <Hourglass size={10} />
        <span>Delay</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-mono font-bold uppercase">
      {type}
    </span>
  );
}

function calculateDuration(startedAt?: string | null, completedAt?: string | null): string | null {
  if (!startedAt || !completedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;
  if (diffMs < 0) return null;
  if (diffMs < 1000) return `${diffMs}ms`;
  return `${(diffMs / 1000).toFixed(1)}s`;
}

export default function DAGVisualizer({
  tasks,
  onSelectTask,
  selectedTaskKey,
}: DAGVisualizerProps) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-black/20 rounded-2xl bg-black/5 font-mono text-xs uppercase tracking-wider text-black/60">
        No DAG nodes defined for this execution
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto terminal-scrollbar p-2 sm:p-4">
      <div className="flex items-center gap-4 sm:gap-6 min-w-max py-3 px-1">
        {tasks.map((task, idx) => {
          const isSelected = selectedTaskKey === task.task_key;
          const isRunning = task.status === "RUNNING";
          const duration = calculateDuration(task.started_at, task.completed_at);
          const title = formatTaskTitle(task);

          return (
            <div key={task.task_key} className="flex items-center gap-4 sm:gap-6">
              {/* Task Node Card */}
              <div
                onClick={() => onSelectTask?.(task)}
                className={`cursor-pointer w-64 rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm relative ${
                  isSelected
                    ? "bg-atlas-black text-white border-atlas-blue shadow-xl -translate-y-1 ring-2 ring-atlas-blue/30"
                    : isRunning
                    ? "bg-amber-50/70 border-atlas-blue ring-2 ring-atlas-blue/20 animate-pulse-subtle"
                    : "bg-white border-black/15 hover:border-black/40 hover:-translate-y-0.5"
                }`}
              >
                {/* Top Badge Row */}
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[10px] tracking-wider uppercase font-bold px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-white/10 text-atlas-lime" : "bg-black/5 text-black/60"
                      }`}
                    >
                      STEP {idx + 1}
                    </span>
                    {getTaskTypeBadge(task.task_type)}
                  </div>
                  <TaskStatusPill status={task.status} size="sm" />
                </div>

                {/* Friendly Title */}
                <div
                  className={`font-black text-sm tracking-tight mb-0.5 truncate ${
                    isSelected ? "text-white" : "text-black"
                  }`}
                  title={title}
                >
                  {title}
                </div>

                {/* Technical Key */}
                <div
                  className={`font-mono text-[11px] truncate mb-3 ${
                    isSelected ? "text-atlas-lime/80" : "text-black/50"
                  }`}
                  title={task.task_key}
                >
                  {task.task_key}
                </div>

                {/* Bottom Meta Row */}
                <div
                  className={`flex items-center justify-between text-[11px] font-mono pt-2.5 border-t ${
                    isSelected
                      ? "border-white/15 text-white/70"
                      : "border-black/10 text-black/60"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {duration ? (
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock size={12} className={isSelected ? "text-atlas-lime" : "text-black/60"} />
                        <span>{duration}</span>
                      </span>
                    ) : isRunning ? (
                      <span className="flex items-center gap-1 text-atlas-blue font-bold animate-pulse">
                        <Clock size={12} />
                        <span>Running</span>
                      </span>
                    ) : (
                      <span>Att: {task.current_attempt || 1}</span>
                    )}
                  </div>

                  {task.worker_id ? (
                    <span
                      className={`truncate max-w-[95px] text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected ? "bg-white/10 text-white/90" : "bg-black/5 text-black/70"
                      }`}
                      title={`Worker: ${task.worker_id}`}
                    >
                      w/{task.worker_id.slice(0, 6)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-black/40">queued</span>
                  )}
                </div>

                {task.error_message && (
                  <div className="mt-2.5 text-[10px] font-mono text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-200 line-clamp-2">
                    ⚠ {task.error_message}
                  </div>
                )}
              </div>

              {/* Edge Arrow to Next Node */}
              {idx < tasks.length - 1 && (
                <div className="flex flex-col items-center justify-center text-black/30">
                  <ArrowRight size={22} className="stroke-[2.5]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
