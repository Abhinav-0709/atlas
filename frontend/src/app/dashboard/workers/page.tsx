"use client";

import { useEffect, useState } from "react";
import BentoCard from "@/components/BentoCard";
import { fetchWorkers } from "@/lib/api";
import { Worker } from "@/lib/types";
import { Server, RefreshCw, Cpu, CheckCircle2, XCircle } from "lucide-react";

export default function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      const data = await fetchWorkers();
      setWorkers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
    const interval = setInterval(loadWorkers, 4000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = workers.filter((w) => w.status === "ACTIVE").length;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            Worker Fleet Monitoring
          </h1>
          <p className="font-mono text-xs text-black/60 uppercase tracking-wider mt-1">
            Real-time pulse of distributed execution workers, heartbeats, and lease renewals
          </p>
        </div>

        <button
          onClick={loadWorkers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border-2 border-black/20 bg-white font-mono text-xs uppercase font-bold hover:bg-black/5 transition-all"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {/* Stats Summary Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-atlas-black text-white rounded-3xl p-6 border border-white/10 shadow-md">
          <span className="font-mono text-[10px] uppercase text-white/50 font-bold block mb-2">
            ACTIVE FLEET CAPACITY
          </span>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-black font-mono text-atlas-lime">
              {activeCount}
            </span>
            <span className="text-xs font-mono text-white/60">
              Active disposable worker nodes
            </span>
          </div>
        </div>

        <div className="bg-atlas-blue text-white rounded-3xl p-6 border-2 border-black/15 shadow-md">
          <span className="font-mono text-[10px] uppercase text-white/70 font-bold block mb-2">
            HEARTBEAT FREQUENCY
          </span>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-black font-mono text-white">10s</span>
            <span className="text-xs font-mono text-white/80">
              Lease timeout window: 30s
            </span>
          </div>
        </div>

        <div className="bg-atlas-cream text-atlas-black rounded-3xl p-6 border-2 border-black/15 shadow-md">
          <span className="font-mono text-[10px] uppercase text-black/50 font-bold block mb-2">
            LEASE REAPING
          </span>
          <div className="flex items-center gap-3">
            <span className="text-5xl font-black font-mono text-emerald-700">AUTO</span>
            <span className="text-xs font-mono text-black/60">
              Expired leases re-queued to READY
            </span>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <BentoCard variant="cream" className="p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-black/15 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-atlas-black text-atlas-lime flex items-center justify-center font-bold">
              <Server size={16} />
            </div>
            <div>
              <h2 className="font-black text-xl uppercase tracking-tight">
                Registered Workers
              </h2>
              <span className="font-mono text-xs text-black/50 uppercase">
                {workers.length} nodes registered
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="border-b-2 border-black/10 text-[11px] font-mono text-black/50 uppercase tracking-wider">
                <th className="pb-3 pl-2">Status</th>
                <th className="pb-3">Worker Name</th>
                <th className="pb-3">Worker ID</th>
                <th className="pb-3">Host & PID</th>
                <th className="pb-3">Last Heartbeat</th>
                <th className="pb-3 text-right pr-2">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 text-sm">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center font-mono text-xs text-black/50">
                    No workers registered in fleet. Start worker via: <code>uv run python -m atlas.worker.main</code>
                  </td>
                </tr>
              ) : (
                workers.map((w) => {
                  const isLive = w.status === "ACTIVE";
                  return (
                    <tr key={w.id} className="hover:bg-black/5 transition-colors">
                      <td className="py-4 pl-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase ${
                            isLive
                              ? "bg-emerald-600 text-white animate-pulse"
                              : "bg-rose-600 text-white"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {w.status}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-base">
                        {w.worker_name}
                      </td>
                      <td className="py-4 font-mono text-xs text-black/60">
                        {w.id}
                      </td>
                      <td className="py-4 font-mono text-xs text-black/70">
                        {w.hostname} (PID: {w.pid})
                      </td>
                      <td className="py-4 font-mono text-xs">
                        {new Date(w.last_heartbeat_at).toLocaleTimeString()}
                      </td>
                      <td className="py-4 font-mono text-xs text-black/60 text-right pr-2">
                        {new Date(w.registered_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </BentoCard>
    </div>
  );
}
