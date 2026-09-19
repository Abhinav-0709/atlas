"use client";

import React from "react";
import Link from "next/link";

const features = [
  {
    title: "DAG Scheduling",
    desc: "Model complex dependencies with ease.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: "bg-white",
  },
  {
    title: "Distributed Execution",
    desc: "Run tasks across a scalable worker pool.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    bg: "bg-atlas-sky",
  },
  {
    title: "Fault Tolerance",
    desc: "Automatic retries, timeouts and recovery.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    bg: "bg-white",
  },
  {
    title: "Real-time Observability",
    desc: "Logs, metrics and execution history.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    bg: "bg-atlas-lime",
  },
  {
    title: "Built for Production",
    desc: "Reliable, secure and extensible.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    bg: "bg-white",
  },
  {
    title: "Cloud Native",
    desc: "Designed for AWS from day one.",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    bg: "bg-atlas-sky",
  },
];

export default function WhyAtlasSection() {
  return (
    <section id="why-atlas" className="w-full bg-atlas-cream py-20 lg:py-28 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Column Text */}
        <div className="lg:col-span-5">
          <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/70 mb-4 uppercase">
            // WHY ATLAS
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-atlas-black leading-[1.05] mb-6">
            More than
            <br />
            a job queue.
          </h2>
          <p className="text-base sm:text-lg leading-relaxed text-atlas-black/80 font-normal mb-8 max-w-md">
            Atlas helps you run complex, real-world workflows with DAG scheduling,
            automatic recovery, distributed execution and deep observability — so
            you can focus on building, not babysitting infrastructure.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-atlas-black text-white text-base font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-sm group"
          >
            <span>Explore Features</span>
            <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Right Column: 2x3 Feature Card Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`${feature.bg} p-7 rounded-3xl border border-atlas-black/10 flex flex-col justify-between min-h-[180px] shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}
            >
              <div className="text-atlas-black mb-5">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-atlas-black tracking-tight mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm font-medium text-atlas-black/80 leading-snug">
                  {feature.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
