import { Workflow, WorkflowRun, Worker, AuditEvent, SystemStats } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Fallback demo dataset for offline rendering or showcase
const DEMO_WORKFLOWS: Workflow[] = [
  {
    id: "wf-7c9b3a12-88ef-410a",
    name: "Order Fulfillment Pipeline",
    description: "Multi-stage payment verification, inventory hold, and shipping dispatch with automated retries.",
    is_active: true,
    active_version: 1,
    tasks_count: 4,
    definition: {
      tasks: [
        { key: "validate_payment", name: "Validate Payment", type: "HTTP", dependencies: [] },
        { key: "reserve_inventory", name: "Reserve Inventory", type: "PYTHON_FUNCTION", dependencies: ["validate_payment"] },
        { key: "notify_warehouse", name: "Notify Warehouse", type: "HTTP", dependencies: ["reserve_inventory"] },
        { key: "send_confirmation", name: "Send Customer Confirmation", type: "DELAY", dependencies: ["notify_warehouse"] },
      ],
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "wf-92e104fc-d128-48bc",
    name: "Data Ingestion & Embedding Sync",
    description: "Scrapes regulatory feeds, executes neural embedding transform, and updates vector store.",
    is_active: true,
    active_version: 2,
    tasks_count: 3,
    definition: {
      tasks: [
        { key: "fetch_raw_corpus", name: "Fetch Corpus", type: "HTTP", dependencies: [] },
        { key: "generate_embeddings", name: "Neural Embeddings", type: "PYTHON_FUNCTION", dependencies: ["fetch_raw_corpus"] },
        { key: "commit_vector_index", name: "Commit Vector Store", type: "PYTHON_FUNCTION", dependencies: ["generate_embeddings"] },
      ],
    },
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function fetchWorkflows(): Promise<Workflow[]> {
  try {
    const res = await fetch(`${API_BASE}/workflows`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.length > 0 ? data : DEMO_WORKFLOWS;
  } catch (err) {
    console.warn("Using fallback demo workflows:", err);
    return DEMO_WORKFLOWS;
  }
}

export async function fetchWorkflowRuns(workflowId: string): Promise<WorkflowRun[]> {
  try {
    const res = await fetch(`${API_BASE}/workflows/${workflowId}/runs`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch runs for workflow:", workflowId, err);
    return [];
  }
}

export async function fetchRun(runId: string): Promise<WorkflowRun | null> {
  try {
    const res = await fetch(`${API_BASE}/runs/${runId}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Failed to fetch run:", runId, err);
    return null;
  }
}

export async function fetchRunEvents(runId: string): Promise<AuditEvent[]> {
  try {
    const res = await fetch(`${API_BASE}/runs/${runId}/events`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return [];
  }
}

export async function triggerWorkflow(
  workflowId: string,
  payload: { idempotency_key?: string | null; context_data?: Record<string, any> }
): Promise<WorkflowRun> {
  const res = await fetch(`${API_BASE}/workflows/${workflowId}/runs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to trigger workflow run");
  }
  return await res.json();
}

export async function cancelWorkflowRun(runId: string): Promise<WorkflowRun> {
  const res = await fetch(`${API_BASE}/runs/${runId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to cancel run");
  }
  return await res.json();
}

export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const res = await fetch(`${API_BASE}/workers`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const items = Array.isArray(data) ? data : data.items || [];
    return items.length > 0 ? items : [
      {
        id: "wkr-8910-fe3a-4491",
        worker_name: "worker-node-alpha-01",
        hostname: "worker-node-1.internal",
        pid: 38192,
        status: "ACTIVE",
        last_heartbeat_at: new Date().toISOString(),
        registered_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "wkr-4412-ab77-1002",
        worker_name: "worker-node-beta-02",
        hostname: "worker-node-2.internal",
        pid: 14002,
        status: "ACTIVE",
        last_heartbeat_at: new Date(Date.now() - 8000).toISOString(),
        registered_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];
  } catch (err) {
    console.warn("Using fallback demo workers:", err);
    return [
      {
        id: "wkr-8910-fe3a-4491",
        worker_name: "worker-node-alpha-01",
        hostname: "worker-node-1.internal",
        pid: 38192,
        status: "ACTIVE",
        last_heartbeat_at: new Date().toISOString(),
        registered_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      },
      {
        id: "wkr-4412-ab77-1002",
        worker_name: "worker-node-beta-02",
        hostname: "worker-node-2.internal",
        pid: 14002,
        status: "ACTIVE",
        last_heartbeat_at: new Date(Date.now() - 8000).toISOString(),
        registered_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];
  }
}

export async function fetchMetricsText(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/metrics`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (err) {
    return `# Prometheus metrics offline or unreachable at ${API_BASE}/metrics`;
  }
}

export async function fetchSystemStats(): Promise<SystemStats> {
  let engineOnline = false;
  let activeWorkers = 0;
  let queueDepth = 0;
  let totalWorkflows = 0;
  let activeRuns = 0;

  try {
    const [healthRes, workersRes, metricsRes, workflowsRes] = await Promise.allSettled([
      fetch(`${API_BASE}/health`),
      fetch(`${API_BASE}/workers`),
      fetch(`${API_BASE}/metrics`),
      fetch(`${API_BASE}/workflows`),
    ]);

    if (healthRes.status === "fulfilled" && healthRes.value.ok) {
      engineOnline = true;
    }

    if (workersRes.status === "fulfilled" && workersRes.value.ok) {
      const data = await workersRes.value.json();
      const workers: Worker[] = Array.isArray(data) ? data : data.items || [];
      activeWorkers = workers.filter((w) => w.status === "ACTIVE").length;
    }

    if (workflowsRes.status === "fulfilled" && workflowsRes.value.ok) {
      const workflows = await workflowsRes.value.json();
      totalWorkflows = workflows.length;
    }

    if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
      const text = await metricsRes.value.text();
      const matchQueue = text.match(/atlas_queue_depth\s+([0-9.]+)/);
      if (matchQueue) queueDepth = Math.round(parseFloat(matchQueue[1]));
    }
  } catch (e) {
    console.warn("Error resolving stats:", e);
  }

  return {
    activeWorkers,
    queueDepth,
    totalWorkflows,
    activeRuns,
    engineOnline,
  };
}
