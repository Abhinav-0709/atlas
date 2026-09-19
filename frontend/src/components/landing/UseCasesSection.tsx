"use client";

import React from "react";
import Image from "next/image";

const useCases = [
  {
    title: "Data Pipelines",
    desc: "ETL, data processing and analytics workloads.",
    bg: "bg-atlas-lime text-atlas-black",
    icon: (
      <svg className="w-7 h-7 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  {
    title: "ML/AI Workloads",
    desc: "Train models, run batch inference, evaluate at scale.",
    bg: "bg-white text-atlas-black",
    icon: (
      <svg className="w-7 h-7 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    title: "Automation",
    desc: "Report generation, file processing, scheduled jobs.",
    bg: "bg-[#70CCFE] text-atlas-black",
    icon: (
      <svg className="w-7 h-7 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    title: "Custom Workflows",
    desc: "Build and run your own logic — no limits.",
    bg: "bg-white text-atlas-black",
    icon: (
      <svg className="w-7 h-7 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
];

export default function UseCasesSection() {
  return (
    <section id="use-cases" className="w-full bg-atlas-cream py-12 sm:py-16 px-4 sm:px-8 lg:px-12 text-white">
      {/* Contained Giant Dark Card (~85-90% width with rounded corners) */}
      <div className="max-w-[1440px] mx-auto bg-black rounded-[32px] sm:rounded-[36px] p-8 sm:p-10 lg:p-12 border border-white/10 shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2">
          <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-white/60 uppercase">
            // USE CASES
          </p>
          <p className="text-xs font-mono font-bold tracking-[0.2em] text-white/40 uppercase">
            DIFFERENT PROBLEMS. ONE ENGINE.
          </p>
        </div>

        {/* 2-Column Main Section: Left (Title + 4 Cards) and Right (Big Golf Card) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-stretch">
          {/* Left Column: Headline + 4-Card Horizontal Row */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col justify-between">
            {/* Headline & Description */}
            <div className="mb-8 lg:mb-10 max-w-2xl">
              <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-black tracking-tighter text-white leading-[1.05] mb-4">
                Powering
                <br />
                real-world builders.
              </h2>
              <p className="text-sm sm:text-base text-white/70 font-normal leading-relaxed max-w-xl">
                From data pipelines to AI workloads, Atlas adapts to your most complex workflows.
              </p>
            </div>

            {/* 4 Cards in a Row: 1 2 3 4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
              {useCases.map((uc, idx) => (
                <div
                  key={idx}
                  className={`${uc.bg} p-5 sm:p-6 rounded-[12px] flex flex-col justify-between min-h-[210px] sm:min-h-[220px] transition-all hover:scale-[1.02] shadow-md group cursor-default`}
                >
                  <div>
                    <div className="mb-5">{uc.icon}</div>
                    <h3 className="text-base sm:text-[17px] font-extrabold tracking-tight mb-1.5 leading-snug">
                      {uc.title}
                    </h3>
                    <p className="text-xs font-medium opacity-80 leading-relaxed">
                      {uc.desc}
                    </p>
                  </div>
                  <div className="pt-4 flex justify-start">
                    <span className="text-base font-bold transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Card 5 - The Large Showcase Golf Card */}
          <div className="lg:col-span-4 xl:col-span-4 relative rounded-[28px] overflow-hidden min-h-[380px] lg:h-full flex flex-col justify-end p-7 sm:p-9 border border-white/10 shadow-2xl group">
            {/* Background Image */}
            <Image
              src="/golf.png"
              alt="Any Workflow, A Higher Standard"
              fill
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent pointer-events-none" />

            {/* Typography Overlay in Bottom-Right */}
            <div className="relative z-10 text-right">
              <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
                ANY
                <br />
                WORKFLOW.
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
