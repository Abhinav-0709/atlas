"use client";

import React from "react";
import Link from "next/link";

const features = [
  {
    title: "DAG Scheduling",
    desc: "Model complex dependencies with ease.",
    icon: (
      <svg className="w-9 h-9 sm:w-10 sm:h-10 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    bg: "bg-white border border-atlas-black/5 shadow-sm",
  },
  {
    title: "Distributed Execution",
    desc: "Run tasks across a scalable worker pool.",
    icon: (
      <svg className="w-9 h-9 sm:w-10 sm:h-10 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    bg: "bg-[#A5DEFD] border border-atlas-black/5 shadow-sm",
  },
  {
    title: "Fault Tolerance",
    desc: "Automatic retries, timeouts and recovery.",
    icon: (
      <svg className="w-9 h-9 sm:w-10 sm:h-10 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    bg: "bg-white border border-atlas-black/5 shadow-sm",
  },
  {
    title: "Real-time Observability",
    desc: "Logs, metrics and execution history.",
    icon: (
      <svg className="w-9 h-9 sm:w-10 sm:h-10 text-atlas-black" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 19h3v-6H4v6zm6 0h3v-10h-3v10zm6 0h3V5h-3v14z" />
      </svg>
    ),
    bg: "bg-atlas-lime border border-atlas-black/5 shadow-sm",
  },
  {
    title: "Built for Production",
    desc: "Reliable, secure and extensible.",
    icon: (
      <svg className="w-9 h-9 sm:w-10 sm:h-10 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    bg: "bg-white border border-atlas-black/5 shadow-sm",
  },
  {
    title: "Cloud Native",
    desc: "Designed for AWS from day one.",
    icon: (
      <svg className="w-9 h-9 sm:w-10 sm:h-10 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
    bg: "bg-[#A5DEFD] border border-atlas-black/5 shadow-sm",
  },
];

export default function WhyAtlasSection() {
  return (
    <section id="features" className="w-full bg-atlas-cream py-16 sm:py-20 lg:py-24 px-6 sm:px-10 lg:px-14">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
        {/* Left Column: Headline & Action */}
        <div className="lg:col-span-4 xl:col-span-4">
          <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/60 mb-3 uppercase">
            // WHY ATLAS
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-[54px] xl:text-[60px] font-black tracking-tighter text-atlas-black leading-[1.02] mb-5">
            More than
            <br />
            a job queue.
          </h2>
          <p className="text-sm sm:text-base leading-relaxed text-atlas-black/80 font-normal mb-8 max-w-sm">
            Atlas helps you run complex, real-world workflows with DAG scheduling,
            automatic recovery, distributed execution and deep observability — so
            you can focus on building, not babysitting infrastructure.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-atlas-black text-white text-sm sm:text-base font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-sm group"
          >
            <span>Explore Features</span>
            <span className="text-base transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </div>

        {/* Right Column: 3x2 Feature Bento Card Grid (3 Columns, 2 Rows) */}
        <div className="lg:col-span-8 xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-4.5">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className={`${feature.bg} p-6 sm:p-7 rounded-[12px] flex flex-col justify-between min-h-[175px] sm:min-h-[185px] transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-default`}
            >
              <div className="mb-4">
                {feature.icon}
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-atlas-black tracking-tight mb-1.5 leading-snug">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-[13px] font-medium text-atlas-black/80 leading-relaxed">
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
