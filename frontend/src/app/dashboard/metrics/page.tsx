"use client";

import { useEffect, useState } from "react";
import BentoCard from "@/components/BentoCard";
import { fetchMetricsText } from "@/lib/api";
import { Activity, RefreshCw, ExternalLink, Terminal } from "lucide-react";

export default function MetricsPage() {
  const [metricsText, setMetricsText] = useState<string>("Loading Prometheus metrics...");
  const [loading, setLoading] = useState<boolean>(true);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await fetchMetricsText();
      setMetricsText(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight">
            Prometheus Metrics
          </h1>
          <p className="font-mono text-xs text-black/60 uppercase tracking-wider mt-1">
            Raw exposition format scraped at <code>/metrics</code> for Prometheus & Grafana
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <a
            href="http://localhost:8000/metrics"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-2 border-black/20 bg-white font-mono text-xs uppercase font-bold hover:bg-black/5 transition-all"
          >
            <span>Raw Endpoint</span>
            <ExternalLink size={14} />
          </a>

          <button
            onClick={loadMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-atlas-black text-atlas-lime font-black text-xs uppercase tracking-wider hover:bg-atlas-blue hover:text-white transition-all shadow-md"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Terminal Card */}
      <BentoCard variant="black" className="p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-atlas-lime text-atlas-black flex items-center justify-center font-bold flex-shrink-0">
              <Terminal size={16} />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-white">
                Metrics Exposition Output
              </h2>
              <span className="font-mono text-xs text-white/50 uppercase">
                Content-Type: text/plain; version=0.0.4
              </span>
            </div>
          </div>
        </div>

        <div className="bg-black/80 rounded-2xl p-4 md:p-6 border border-white/10 overflow-x-auto max-h-[560px] overflow-y-auto terminal-scrollbar">
          <pre className="font-mono text-xs text-atlas-lime leading-relaxed whitespace-pre-wrap">
            {metricsText}
          </pre>
        </div>
      </BentoCard>
    </div>
  );
}
