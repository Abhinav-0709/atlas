"use client";

import { TaskRun } from "@/lib/types";
import TaskStatusPill from "./TaskStatusPill";
import { ArrowRight, Clock, Globe, Cpu, Hourglass, CheckCircle2 } from "lucide-react";

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

function getTaskTypeIcon(type?: string | null) {
  if (!type) return <Cpu size={11} className="text-slate-500" />;
  const upper = type.toUpperCase();
  if (upper.includes("HTTP")) return <Globe size={11} className="text-sky-600" />;
  if (upper.includes("DELAY")) return <Hourglass size={11} className="text-amber-600" />;
  return <Cpu size={11} className="text-emerald-600" />;
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
      <div className="p-8 text-center border border-dashed border-black/15 rounded-xl bg-black/5 font-mono text-xs uppercase tracking-wider text-black/50">
        No DAG nodes defined for this execution
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto terminal-scrollbar py-2">
      <div className="flex items-center justify-center gap-2 sm:gap-3 min-w-fit mx-auto py-2 px-1">
        {tasks.map((task, idx) => {
          const isSelected = selectedTaskKey === task.task_key;
          const isRunning = task.status === "RUNNING";
          const isSuccess = task.status === "SUCCESS";
          const duration = calculateDuration(task.started_at, task.completed_at);
          const title = formatTaskTitle(task);

          return (
            <div key={task.task_key} className="flex items-center gap-2 sm:gap-3">
              {/* Compact, Professional Node Card */}
              <div
                onClick={() => onSelectTask?.(task)}
                className={`cursor-pointer w-44 sm:w-48 rounded-xl border p-3 transition-all duration-150 shadow-2xs relative select-none ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-atlas-blue/40 -translate-y-0.5"
                    : isRunning
                    ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-300/40 animate-pulse-subtle"
                    : "bg-white border-black/15 hover:border-black/40 hover:-translate-y-0.5 hover:shadow-xs"
                }`}
              >
                {/* Step Index & Status Pill Header */}
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold ${
                        isSelected
                          ? "bg-white/20 text-atlas-lime"
                          : "bg-black/5 text-black/60"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span title={task.task_type || "Compute"}>
                      {getTaskTypeIcon(task.task_type)}
                    </span>
                  </div>
                  <TaskStatusPill status={task.status} size="sm" />
                </div>

                {/* Friendly Task Name */}
                <div
                  className={`font-bold text-xs truncate leading-snug ${
                    isSelected ? "text-white" : "text-slate-900"
                  }`}
                  title={title}
                >
                  {title}
                </div>

                {/* Technical Key */}
                <div
                  className={`font-mono text-[10px] truncate mb-2 ${
                    isSelected ? "text-atlas-lime/80" : "text-black/45"
                  }`}
                  title={task.task_key}
                >
                  {task.task_key}
                </div>

                {/* Bottom Footer (Duration + Worker snippet) */}
                <div
                  className={`flex items-center justify-between text-[10px] font-mono pt-1.5 border-t ${
                    isSelected ? "border-white/15 text-white/70" : "border-black/10 text-black/50"
                  }`}
                >
                  <div>
                    {duration ? (
                      <span className="flex items-center gap-1 font-semibold">
                        <Clock size={10} className={isSelected ? "text-atlas-lime" : "text-black/50"} />
                        <span>{duration}</span>
                      </span>
                    ) : isRunning ? (
                      <span className="text-amber-500 font-bold animate-pulse">Running</span>
                    ) : (
                      <span>Att {task.current_attempt || 1}</span>
                    )}
                  </div>

                  {task.worker_id ? (
                    <span
                      className={`truncate max-w-[65px] px-1 py-0.2 rounded text-[9px] ${
                        isSelected ? "bg-white/10 text-white/90" : "bg-black/5 text-black/60"
                      }`}
                    >
                      w/{task.worker_id.slice(0, 4)}
                    </span>
                  ) : (
                    <span className="text-black/30 text-[9px]">queued</span>
                  )}
                </div>
              </div>

              {/* Minimalist Edge Connector */}
              {idx < tasks.length - 1 && (
                <div className="flex items-center justify-center text-black/25 flex-shrink-0">
                  <ArrowRight size={15} className="stroke-[2]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
