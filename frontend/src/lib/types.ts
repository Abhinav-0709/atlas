export type WorkflowStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";
export type TaskStatus = "PENDING" | "READY" | "RUNNING" | "SUCCESS" | "FAILED" | "RETRYING" | "TIMED_OUT" | "DEAD_LETTERED";
export type WorkerStatus = "ACTIVE" | "PAUSED" | "DEAD";

export interface WorkflowDefinitionTask {
  key: string;
  name: string;
  type: string;
  dependencies: string[];
  configuration?: Record<string, any>;
  timeout_seconds?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  active_version: number;
  tasks_count?: number;
  definition?: {
    tasks: WorkflowDefinitionTask[];
  };
  created_at: string;
  updated_at: string;
}

export interface TaskRun {
  id: string;
  workflow_run_id: string;
  task_key: string;
  status: TaskStatus;
  worker_id?: string | null;
  scheduled_retry_at?: string | null;
  current_attempt: number;
  started_at?: string | null;
  completed_at?: string | null;
  error_message?: string | null;
  output_data?: Record<string, any> | null;
}

export interface WorkflowRun {
  id: string;
  workflow_version_id: string;
  status: WorkflowStatus;
  idempotency_key?: string | null;
  context_data: Record<string, any>;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  tasks?: TaskRun[];
}

export interface Worker {
  id: string;
  worker_name: string;
  hostname: string;
  pid: number;
  status: WorkerStatus;
  last_heartbeat_at: string;
  registered_at: string;
}

export interface AuditEvent {
  id: string;
  workflow_run_id?: string | null;
  task_run_id?: string | null;
  worker_id?: string | null;
  event_type: string;
  task_key?: string | null;
  payload: Record<string, any>;
  created_at: string;
}

export interface SystemStats {
  activeWorkers: number;
  queueDepth: number;
  totalWorkflows: number;
  activeRuns: number;
  engineOnline: boolean;
}
