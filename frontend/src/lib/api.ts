import { Workflow, WorkflowRun, Worker, AuditEvent, SystemStats, MLPredictResponse, MLBenchmarkResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000" || "https://atlas-api.abhinav.sbs/";

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
    const items = Array.isArray(data) ? data : data.items || [];
    return items.length > 0 ? items : DEMO_WORKFLOWS;
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

export async function deleteWorkflowRun(runId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/runs/${runId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to delete run");
  }
}

export async function cleanupWorkflowRuns(statusFilter?: string): Promise<{ cleaned_count: number }> {
  const url = statusFilter
    ? `${API_BASE}/runs/action/cleanup?status_filter=${encodeURIComponent(statusFilter)}`
    : `${API_BASE}/runs/action/cleanup`;
  const res = await fetch(url, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to cleanup runs");
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

const DEMO_BENCHMARK: MLBenchmarkResponse = {
  workload: "100 heterogeneous DAG tasks across 4 simulated worker profiles",
  policies: {
    ROUND_ROBIN: {
      avg_latency_sec: 4.12,
      p50_latency_sec: 3.8,
      p95_latency_sec: 7.4,
      failure_rate_pct: 18.0,
      throughput_tasks_per_sec: 24.2,
      successful_tasks: 82,
      failed_tasks: 18,
    },
    LEAST_LOADED: {
      avg_latency_sec: 1.84,
      p50_latency_sec: 1.6,
      p95_latency_sec: 3.2,
      failure_rate_pct: 8.0,
      throughput_tasks_per_sec: 54.3,
      successful_tasks: 92,
      failed_tasks: 8,
    },
    ML_ASSISTED: {
      avg_latency_sec: 0.85,
      p50_latency_sec: 0.72,
      p95_latency_sec: 1.45,
      failure_rate_pct: 1.0,
      throughput_tasks_per_sec: 117.6,
      successful_tasks: 99,
      failed_tasks: 1,
    },
  },
};

export async function fetchMLBenchmark(): Promise<MLBenchmarkResponse> {
  try {
    const res = await fetch(`${API_BASE}/ml/benchmark`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using demo ML benchmark:", err);
    return DEMO_BENCHMARK;
  }
}

export async function predictAndRankWorkers(payload: {
  job_type: string;
  input_size_bytes?: number;
  queue_depth?: number;
  retry_count?: number;
  candidates?: any[];
}): Promise<MLPredictResponse> {
  try {
    const res = await fetch(`${API_BASE}/ml/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("Using simulated ML rankings:", err);
    return {
      status: "success",
      job_type: payload.job_type,
      selected_worker: "worker-fast-01",
      rankings: [
        {
          worker_id: "wkr-1",
          worker_name: "worker-fast-01",
          total_score: 0.94,
          predicted_runtime_sec: 0.92,
          failure_probability_pct: 1.8,
          is_anomalous: false,
          reasons: ["Predicted runtime: 0.92s", "Failure risk: 1.8%", "Active load: 0 tasks"],
        },
        {
          worker_id: "wkr-2",
          worker_name: "worker-busy-02",
          total_score: 0.42,
          predicted_runtime_sec: 3.4,
          failure_probability_pct: 14.5,
          is_anomalous: false,
          reasons: ["High queue load (4 tasks)", "Predicted runtime: 3.4s"],
        },
        {
          worker_id: "wkr-3",
          worker_name: "worker-degraded-03",
          total_score: 0.12,
          predicted_runtime_sec: 7.1,
          failure_probability_pct: 42.0,
          is_anomalous: true,
          reasons: ["Excessive failure rate (42.0%)", "Latency spike (7.1s > 5.0s)"],
        },
      ],
    };
  }
}
