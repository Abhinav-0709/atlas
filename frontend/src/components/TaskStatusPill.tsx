import { TaskStatus, WorkflowStatus } from "@/lib/types";

interface StatusPillProps {
  status: TaskStatus | WorkflowStatus | string;
  size?: "sm" | "md";
}

export default function TaskStatusPill({ status, size = "md" }: StatusPillProps) {
  const norm = status.toUpperCase();

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  let colorClasses = "bg-zinc-200 text-zinc-800 border-zinc-300";

  switch (norm) {
    case "READY":
      colorClasses = "bg-atlas-blue text-white border-atlas-blue-dark";
      break;
    case "RUNNING":
      colorClasses = "bg-atlas-black text-atlas-lime border-black animate-pulse";
      break;
    case "SUCCESS":
      colorClasses = "bg-emerald-600 text-white border-emerald-700";
      break;
    case "FAILED":
      colorClasses = "bg-rose-600 text-white border-rose-700";
      break;
    case "RETRYING":
      colorClasses = "bg-amber-400 text-black border-amber-500 font-bold animate-pulse";
      break;
    case "DEAD_LETTERED":
      colorClasses = "bg-red-950 text-red-200 border-red-800";
      break;
    case "PENDING":
    default:
      colorClasses = "bg-black/10 text-black/70 border-black/20";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono uppercase font-bold rounded-full border tracking-wider shadow-2xs ${sizeClasses} ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {norm}
    </span>
  );
}
