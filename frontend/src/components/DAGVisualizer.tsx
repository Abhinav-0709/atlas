"use client";

import { useState } from "react";
import { TaskRun } from "@/lib/types";
import TaskStatusPill from "./TaskStatusPill";
import { CheckCircle2, Clock, AlertTriangle, ArrowRight, CornerDownRight } from "lucide-react";

interface DAGVisualizerProps {
  tasks: TaskRun[];
  onSelectTask?: (task: TaskRun) => void;
  selectedTaskKey?: string | null;
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
      <div className="flex items-center gap-4 sm:gap-6 min-w-max py-2 px-1">
        {tasks.map((task, idx) => {
          const isSelected = selectedTaskKey === task.task_key;
          const isRunning = task.status === "RUNNING";

          return (
            <div key={task.task_key} className="flex items-center gap-6">
              {/* Task Node Card */}
              <div
                onClick={() => onSelectTask?.(task)}
                className={`cursor-pointer w-48 rounded-2xl border-2 p-4 transition-all duration-200 shadow-sm ${
                  isSelected
                    ? "bg-atlas-black text-atlas-lime border-atlas-blue shadow-lg -translate-y-1"
                    : isRunning
                    ? "bg-atlas-cream border-atlas-blue animate-pulse-subtle"
                    : "bg-white border-black/15 hover:border-black/40 hover:-translate-y-0.5"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase text-black/50 font-bold">
                    STEP {idx + 1}
                  </span>
                  <TaskStatusPill status={task.status} size="sm" />
                </div>

                <div className="font-black text-sm uppercase tracking-tight truncate mb-1">
                  {task.task_key}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-black/60 pt-2 border-t border-black/10">
                  <span>Attempt: {task.current_attempt || 0}</span>
                  {task.worker_id && (
                    <span className="truncate max-w-[80px]">
                      {task.worker_id.slice(0, 6)}..
                    </span>
                  )}
                </div>

                {task.error_message && (
                  <div className="mt-2 text-[10px] font-mono text-rose-600 truncate bg-rose-50 p-1 rounded border border-rose-200">
                    ⚠ {task.error_message}
                  </div>
                )}
              </div>

              {/* Edge Arrow to Next Node */}
              {idx < tasks.length - 1 && (
                <div className="text-black/30 font-black flex items-center justify-center">
                  <ArrowRight size={24} className="stroke-[2.5]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
