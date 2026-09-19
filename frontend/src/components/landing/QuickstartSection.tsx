"use client";

import React, { useState } from "react";
import Link from "next/link";

const codeSnippets = {
  python: `from atlas.workflow.dag import DAGDefinition, TaskDefinition

# 1. Define your DAG with automatic topological validation
pipeline = DAGDefinition(
    name="data-ingest-pipeline",
    tasks=[
        TaskDefinition(
            key="fetch_raw_events",
            name="Fetch Raw Events",
            type="HTTP",
            retries=3,
        ),
        TaskDefinition(
            key="transform_and_clean",
            name="Transform & Clean",
            type="PYTHON_FUNCTION",
            dependencies=["fetch_raw_events"],
        ),
        TaskDefinition(
            key="load_to_warehouse",
            name="Load to Warehouse",
            type="PYTHON_FUNCTION",
            dependencies=["transform_and_clean"],
        ),
    ],
)`,
  curl: `# Trigger an execution run via the FastAPI REST API
curl -X POST http://localhost:8000/workflows \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "daily-etl-run",
    "definition": {
      "name": "etl",
      "tasks": [
        {"key": "extract", "name": "Extract", "type": "HTTP"},
        {"key": "transform", "name": "Transform", "type": "PYTHON_FUNCTION", "dependencies": ["extract"]},
        {"key": "load", "name": "Load", "type": "PYTHON_FUNCTION", "dependencies": ["transform"]}
      ]
    }
  }'`,
  cli: `# Launch the local Atlas worker daemon
$ python -m atlas.worker.main --concurrency 4
[INFO] Atlas worker initialized: worker-01 (hostname: node-east-1)
[INFO] Connected to PostgreSQL & Redis lease manager
[INFO] Claimed task "fetch_raw_events" (attempt 1, lease: 30s)
[INFO] Task finished in 242ms. Enqueued dependent: "transform_and_clean"`,
};

const devSteps = [
  {
    step: "01",
    title: "Declarative DAGs",
    desc: "Define task graphs in pure Python, JSON, or YAML with zero boilerplate and automatic cycle detection.",
  },
  {
    step: "02",
    title: "Atomic Distributed Leases",
    desc: "Workers claim ready tasks atomically via Redis queues and maintain heartbeat leases to prevent duplicate execution.",
  },
  {
    step: "03",
    title: "End-to-End Observability",
    desc: "Inspect live execution states, query Prometheus metrics at /metrics, and stream structured audit traces.",
  },
];

export default function QuickstartSection() {
  const [activeTab, setActiveTab] = useState<"python" | "curl" | "cli">("python");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="quickstart" className="w-full bg-atlas-cream py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-14">
      <div className="max-w-[1440px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/60 mb-3 uppercase">
              // DEVELOPER WORKFLOW
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tighter text-atlas-black leading-[1.04]">
              Built for code.
              <br />
              Ready in minutes.
            </h2>
          </div>
          <p className="text-sm sm:text-base text-atlas-black/75 max-w-md leading-relaxed">
            Atlas gives you full programmatic control. Define workflows in Python,
            dispatch via REST, and orchestrate with sub-second execution guarantees.
          </p>
        </div>

        {/* 2-Column Developer Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Interactive Code Terminal (7 cols) */}
          <div className="lg:col-span-7 bg-[#0E1015] rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 border border-atlas-black/20 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
              {/* Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("python")}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    activeTab === "python"
                      ? "bg-atlas-lime text-atlas-black shadow-sm"
                      : "text-white/60 hover:text-white bg-white/5"
                  }`}
                >
                  workflow.py
                </button>
                <button
                  onClick={() => setActiveTab("curl")}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    activeTab === "curl"
                      ? "bg-atlas-lime text-atlas-black shadow-sm"
                      : "text-white/60 hover:text-white bg-white/5"
                  }`}
                >
                  curl API
                </button>
                <button
                  onClick={() => setActiveTab("cli")}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                    activeTab === "cli"
                      ? "bg-atlas-lime text-atlas-black shadow-sm"
                      : "text-white/60 hover:text-white bg-white/5"
                  }`}
                >
                  worker.sh
                </button>
              </div>

              {/* Copy Button with SVG Icon */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-white/75 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all active:scale-95"
                title="Copy code to clipboard"
              >
                {copied ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-atlas-lime" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-atlas-lime font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Block Area with Fixed Height and Custom Scrollbar */}
            <div className="h-[280px] sm:h-[300px] overflow-y-auto overflow-x-auto terminal-scrollbar py-2 pr-2 my-auto">
              <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-white/90">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>

            {/* Terminal Footer */}
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-white/40">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-atlas-lime animate-pulse" />
                <span>ATLAS LOCAL ENGINE ONLINE</span>
              </div>
              <span>PYTHON 3.12 • FASTAPI • REDIS 7</span>
            </div>
          </div>

          {/* Right Column: 3 Pillars Card Stack (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {devSteps.map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-[24px] p-6 sm:p-7 border border-atlas-black/10 shadow-sm flex flex-col justify-between flex-1 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold tracking-widest text-atlas-black/50">
                    STEP {item.step}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-atlas-lime border border-atlas-black/20" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-atlas-black tracking-tight mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] text-atlas-black/75 leading-relaxed font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
