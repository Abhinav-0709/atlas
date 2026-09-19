"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const useCases = [
  {
    title: "Data Pipelines",
    desc: "ETL, data processing and analytics workloads.",
    bg: "bg-atlas-lime text-atlas-black",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  {
    title: "ML/AI Workloads",
    desc: "Train models, run batch inference, evaluate at scale.",
    bg: "bg-white text-atlas-black",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: "Automation",
    desc: "Report generation, file processing, scheduled jobs.",
    bg: "bg-atlas-sky text-atlas-black",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Custom Workflows",
    desc: "Build and run your own logic — no limits.",
    bg: "bg-white text-atlas-black",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="w-full bg-atlas-dark-section py-20 lg:py-28 px-6 sm:px-12 lg:px-16 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-white/60 uppercase">
            // USE CASES
          </p>
          <p className="text-xs font-mono font-bold tracking-[0.2em] text-white/40 uppercase">
            DIFFERENT PROBLEMS, ONE ENGINE.
          </p>
        </div>

        <div className="mb-14 max-w-2xl">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-tight mb-4">
            Powering
            <br />
            real-world builders.
          </h2>
          <p className="text-base sm:text-lg text-white/75 font-normal leading-relaxed">
            From data pipelines to AI workloads, Atlas adapts to your most complex workflows.
          </p>
        </div>

        {/* Bento: 2x2 Use Cases + Right High-Impact Golf Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left: 2x2 Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {useCases.map((uc, idx) => (
              <div
                key={idx}
                className={`${uc.bg} p-7 rounded-3xl flex flex-col justify-between min-h-[220px] transition-all hover:scale-[1.01] shadow-lg group cursor-pointer`}
              >
                <div>
                  <div className="mb-6">{uc.icon}</div>
                  <h3 className="text-xl font-extrabold tracking-tight mb-2">
                    {uc.title}
                  </h3>
                  <p className="text-sm font-medium opacity-85 leading-snug">
                    {uc.desc}
                  </p>
                </div>
                <div className="pt-4 flex justify-start">
                  <span className="text-lg font-bold transition-transform group-hover:translate-x-1.5">
                    →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Golf Showcase Card */}
          <div className="lg:col-span-5 relative rounded-3xl overflow-hidden min-h-[360px] lg:min-h-[460px] flex flex-col justify-end p-8 sm:p-10 border border-white/10 shadow-2xl group">
            {/* Background Image */}
            <Image
              src="/golf.png"
              alt="Any Workflow, A Higher Standard"
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Typography Overlay */}
            <div className="relative z-10 text-right">
              <h4 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                ANY
                <br />
                WORKFLOW,
                <br />
                A HIGHER
                <br />
                STANDARD.
              </h4>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
