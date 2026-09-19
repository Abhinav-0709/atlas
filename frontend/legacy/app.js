// Atlas Mission Control - Dashboard Controller

const API_BASE = '';

let activeWorkflowList = [];
let selectedRunId = null;
let pollInterval = null;

// DOM Elements
const navTabs = document.querySelectorAll('.nav-tab');
const tabPanes = document.querySelectorAll('.tab-pane');
const openTriggerModalBtn = document.getElementById('openTriggerModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const triggerModal = document.getElementById('triggerModal');
const triggerWorkflowForm = document.getElementById('triggerWorkflowForm');
const modalWorkflowSelect = document.getElementById('modalWorkflowSelect');

// Init
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModal();
  loadAllData();

  // Polling loop for overview stats
  setInterval(() => {
    loadStats();
    if (selectedRunId) {
      loadRunDetails(selectedRunId, false);
    }
  }, 3000);
});

// Tab Navigation
function initTabs() {
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(target).classList.add('active');

      if (target === 'workflows-view') loadWorkflows();
      if (target === 'runs-view') loadRuns();
      if (target === 'workers-view') loadWorkers();
      if (target === 'metrics-view') loadMetrics();
    });
  });

  document.getElementById('refreshWorkflowsBtn').addEventListener('click', loadWorkflows);
  document.getElementById('refreshRunsBtn').addEventListener('click', loadRuns);
  document.getElementById('refreshWorkersBtn').addEventListener('click', loadWorkers);
  document.getElementById('refreshMetricsBtn').addEventListener('click', loadMetrics);
  document.getElementById('cancelRunBtn').addEventListener('click', cancelActiveRun);
  document.getElementById('runStatusFilter').addEventListener('change', loadRuns);
}

// Modal Management
function initModal() {
  openTriggerModalBtn.addEventListener('click', () => {
    populateModalWorkflows();
    triggerModal.style.display = 'flex';
  });

  const close = () => { triggerModal.style.display = 'none'; };
  closeModalBtn.addEventListener('click', close);
  cancelModalBtn.addEventListener('click', close);

  triggerWorkflowForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const workflowId = modalWorkflowSelect.value;
    const idempKey = document.getElementById('modalIdempotencyKey').value.trim() || null;
    let contextData = {};

    try {
      contextData = JSON.parse(document.getElementById('modalContextData').value);
    } catch (err) {
      alert('Invalid JSON in context data: ' + err.message);
      return;
    }

    try {
      const resp = await fetch(`${API_BASE}/workflows/${workflowId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotency_key: idempKey,
          context_data: contextData,
        }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        alert('Failed to trigger run: ' + (error.detail || resp.statusText));
        return;
      }

      const run = await resp.json();
      close();
      // Switch to runs tab and inspect
      document.querySelector('[data-tab="runs-view"]').click();
      loadRuns(run.id);
    } catch (err) {
      alert('Network error: ' + err.message);
    }
  });
}

function populateModalWorkflows() {
  modalWorkflowSelect.innerHTML = '';
  activeWorkflowList.forEach(wf => {
    const opt = document.createElement('option');
    opt.value = wf.id;
    opt.textContent = `${wf.name} (v${wf.active_version || 1})`;
    modalWorkflowSelect.appendChild(opt);
  });
}

// Global Data Load
async function loadAllData() {
  await Promise.all([loadStats(), loadWorkflows(), loadRuns(), loadWorkers()]);
}

// Stats Ribbon
async function loadStats() {
  try {
    const [workersRes, healthRes] = await Promise.all([
      fetch(`${API_BASE}/workers`).catch(() => null),
      fetch(`${API_BASE}/health`).catch(() => null),
    ]);

    if (workersRes && workersRes.ok) {
      const workers = await workersRes.json();
      const activeCount = workers.filter(w => w.status === 'ACTIVE').length;
      document.getElementById('statActiveWorkers').textContent = activeCount;
    }

    // Read queue depth from Prometheus metrics endpoint
    const metricsRes = await fetch(`${API_BASE}/metrics`).catch(() => null);
    if (metricsRes && metricsRes.ok) {
      const text = await metricsRes.text();
      const match = text.match(/atlas_queue_depth\s+([0-9.]+)/);
      if (match) {
        document.getElementById('statQueueDepth').textContent = Math.round(parseFloat(match[1]));
      }
    }
  } catch (e) {
    console.warn('Stats poll failed:', e);
  }
}

// 1. Workflows
async function loadWorkflows() {
  const tbody = document.getElementById('workflowsTbody');
  try {
    const res = await fetch(`${API_BASE}/workflows`);
    if (!res.ok) throw new Error(res.statusText);
    const workflows = await res.json();
    activeWorkflowList = workflows;

    document.getElementById('statWorkflowsCount').textContent = workflows.length;

    if (workflows.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No workflows registered yet. Use API to register DAGs.</td></tr>';
      return;
    }

    tbody.innerHTML = workflows.map(wf => `
      <tr>
        <td><strong>${escapeHtml(wf.name)}</strong><br><small class="text-muted">${escapeHtml(wf.description || 'No description')}</small></td>
        <td class="mono-text">${wf.id}</td>
        <td><span class="status-pill status-READY">v${wf.active_version || 1}</span></td>
        <td>${wf.tasks_count || wf.definition?.tasks?.length || '--'}</td>
        <td class="mono-text">${formatDate(wf.created_at)}</td>
        <td>
          <button class="btn btn-primary btn-sm" onclick="triggerSpecificWorkflow('${wf.id}')">Run DAG</button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state text-danger">Failed to load workflows: ${err.message}</td></tr>`;
  }
}

window.triggerSpecificWorkflow = (workflowId) => {
  populateModalWorkflows();
  modalWorkflowSelect.value = workflowId;
  triggerModal.style.display = 'flex';
};

// 2. Runs & DAG View
async function loadRuns(autoSelectRunId = null) {
  const container = document.getElementById('runsListContainer');
  const filter = document.getElementById('runStatusFilter').value;

  try {
    // Collect runs across workflows
    let allRuns = [];
    for (const wf of activeWorkflowList) {
      const res = await fetch(`${API_BASE}/workflows/${wf.id}/runs`);
      if (res.ok) {
        const runs = await res.json();
        allRuns.push(...runs);
      }
    }

    // Sort by created_at desc
    allRuns.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const activeRunsCount = allRuns.filter(r => r.status === 'RUNNING').length;
    document.getElementById('statActiveRuns').textContent = activeRunsCount;

    if (filter !== 'ALL') {
      allRuns = allRuns.filter(r => r.status === filter);
    }

    if (allRuns.length === 0) {
      container.innerHTML = '<div class="empty-state">No runs found.</div>';
      return;
    }

    container.innerHTML = allRuns.map(run => `
      <div class="run-item ${run.id === selectedRunId ? 'active' : ''}" onclick="selectRun('${run.id}')">
        <div class="run-item-top">
          <span class="run-item-id">${run.id.slice(0, 8)}...</span>
          <span class="status-pill status-${run.status} ${run.status === 'RUNNING' ? 'pulse' : ''}">${run.status}</span>
        </div>
        <div class="run-item-time">${formatDate(run.created_at)}</div>
      </div>
    `).join('');

    const targetId = autoSelectRunId || selectedRunId || allRuns[0]?.id;
    if (targetId) {
      selectRun(targetId);
    }
  } catch (err) {
    container.innerHTML = `<div class="empty-state text-danger">${err.message}</div>`;
  }
}

window.selectRun = async (runId) => {
  selectedRunId = runId;
  document.querySelectorAll('.run-item').forEach(el => {
    el.classList.toggle('active', el.querySelector('.run-item-id')?.textContent.startsWith(runId.slice(0, 8)));
  });

  await loadRunDetails(runId, true);
};

async function loadRunDetails(runId, scrollIntoView = false) {
  try {
    const [detailRes, eventsRes] = await Promise.all([
      fetch(`${API_BASE}/runs/${runId}`),
      fetch(`${API_BASE}/runs/${runId}/events`).catch(() => null),
    ]);

    if (!detailRes.ok) return;
    const run = await detailRes.json();
    const events = eventsRes && eventsRes.ok ? await eventsRes.json() : [];

    document.getElementById('noRunSelected').style.display = 'none';
    document.getElementById('activeRunContent').style.display = 'block';

    // Header metadata
    document.getElementById('inspectorRunId').textContent = `Run: ${run.id}`;
    document.getElementById('inspectorVersionId').textContent = `Workflow Version ID: ${run.workflow_version_id}`;
    
    const statusPill = document.getElementById('inspectorRunStatus');
    statusPill.className = `status-pill status-${run.status} ${run.status === 'RUNNING' ? 'pulse' : ''}`;
    statusPill.textContent = run.status;

    document.getElementById('inspectorIdempKey').textContent = run.idempotency_key || 'None (Non-idempotent)';
    document.getElementById('inspectorStartedAt').textContent = formatDate(run.started_at);
    document.getElementById('inspectorCompletedAt').textContent = formatDate(run.completed_at);

    const cancelBtn = document.getElementById('cancelRunBtn');
    cancelBtn.style.display = run.status === 'RUNNING' || run.status === 'PENDING' ? 'inline-block' : 'none';

    // Render Visual DAG Nodes
    renderDAG(run.tasks || []);

    // Render Tasks Table
    renderTasksTable(run.tasks || []);

    // Render Audit Events
    renderEventsStream(events);
  } catch (err) {
    console.error('Error loading run details:', err);
  }
}

function renderDAG(tasks) {
  const container = document.getElementById('dagNodesContainer');
  if (!tasks || tasks.length === 0) {
    container.innerHTML = '<div class="empty-state">No task graph nodes present.</div>';
    return;
  }

  container.innerHTML = tasks.map((task, idx) => `
    <div class="dag-node ${task.status === 'RUNNING' ? 'active-running' : ''}" id="dag-node-${task.task_key}">
      <div class="dag-node-key">${escapeHtml(task.task_key)}</div>
      <div class="dag-node-type">${task.task_type || 'TASK'}</div>
      <span class="status-pill status-${task.status} ${task.status === 'RUNNING' ? 'pulse' : ''}">
        ${task.status}
      </span>
      <div style="font-size: 10px; color: var(--text-muted); margin-top: 6px;">
        Attempt: ${task.current_attempt || 0}
      </div>
    </div>
    ${idx < tasks.length - 1 ? '<div class="dag-arrow">➔</div>' : ''}
  `).join('');
}

function renderTasksTable(tasks) {
  const tbody = document.getElementById('tasksTbody');
  if (!tasks || tasks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No task runs recorded.</td></tr>';
    return;
  }

  tbody.innerHTML = tasks.map(t => `
    <tr>
      <td class="mono-text"><strong>${escapeHtml(t.task_key)}</strong></td>
      <td><span class="status-pill status-${t.status} ${t.status === 'RUNNING' ? 'pulse' : ''}">${t.status}</span></td>
      <td>${t.current_attempt || 0}</td>
      <td class="mono-text">${t.worker_id ? t.worker_id.slice(0, 8) + '...' : '<span class="text-muted">Unassigned</span>'}</td>
      <td>${t.started_at ? formatDate(t.started_at) : '--'}</td>
      <td>${t.error_message ? `<span class="text-danger">${escapeHtml(t.error_message)}</span>` : '<span class="text-muted">None</span>'}</td>
    </tr>
  `).join('');
}

function renderEventsStream(events) {
  const stream = document.getElementById('eventsStream');
  if (!events || events.length === 0) {
    stream.innerHTML = '<div class="empty-state">No audit events logged yet.</div>';
    return;
  }

  stream.innerHTML = events.map(e => `
    <div class="event-entry">
      <div>
        <span class="event-type">${escapeHtml(e.event_type)}</span>
        ${e.task_key ? `<span class="mono-text text-secondary"> (${escapeHtml(e.task_key)})</span>` : ''}
        <span class="event-time">${formatDate(e.created_at)}</span>
      </div>
      ${e.payload && Object.keys(e.payload).length > 0 ? `
        <div class="mono-text text-muted" style="margin-top: 4px; font-size: 11px;">
          ${escapeHtml(JSON.stringify(e.payload))}
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function cancelActiveRun() {
  if (!selectedRunId) return;
  if (!confirm('Are you sure you want to cancel this workflow run?')) return;

  try {
    const res = await fetch(`${API_BASE}/runs/${selectedRunId}/cancel`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json();
      alert('Failed to cancel run: ' + (err.detail || res.statusText));
      return;
    }
    await loadRunDetails(selectedRunId);
    await loadRuns();
  } catch (err) {
    alert('Error cancelling run: ' + err.message);
  }
}

// 3. Worker Fleet
async function loadWorkers() {
  const tbody = document.getElementById('workersTbody');
  try {
    const res = await fetch(`${API_BASE}/workers`);
    if (!res.ok) throw new Error(res.statusText);
    const workers = await res.json();

    if (workers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No workers registered in fleet.</td></tr>';
      return;
    }

    tbody.innerHTML = workers.map(w => {
      const isLive = w.status === 'ACTIVE';
      return `
        <tr>
          <td>
            <span class="status-pill status-${w.status} ${isLive ? 'pulse' : ''}">
              ${w.status}
            </span>
          </td>
          <td><strong>${escapeHtml(w.worker_name)}</strong></td>
          <td class="mono-text">${w.id}</td>
          <td>${escapeHtml(w.hostname || 'localhost')} (PID: ${w.pid || '--'})</td>
          <td class="mono-text">${formatDate(w.last_heartbeat_at)}</td>
          <td class="mono-text">${formatDate(w.registered_at)}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state text-danger">Failed to load workers: ${err.message}</td></tr>`;
  }
}

// 4. Prometheus Metrics
async function loadMetrics() {
  const code = document.getElementById('metricsOutputCode');
  try {
    const res = await fetch(`${API_BASE}/metrics`);
    if (!res.ok) throw new Error(res.statusText);
    const text = await res.text();
    code.textContent = text;
  } catch (err) {
    code.textContent = 'Failed to fetch Prometheus metrics: ' + err.message;
  }
}

// Utility Helpers
function formatDate(isoStr) {
  if (!isoStr) return '--';
  try {
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
