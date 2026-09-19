"use client";

import React from "react";
import Link from "next/link";

export default function CtaBanner() {
  return (
    <section className="w-full bg-atlas-cream border-t border-atlas-black/15 overflow-hidden">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch border-b border-atlas-black/15 shadow-sm">
        {/* Left Segment: Sky Blue - Flush to the left edge */}
        <div className="lg:col-span-4 bg-atlas-sky p-8 sm:p-12 lg:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-atlas-black/15">
          <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/60 mb-3 uppercase">
            // GET STARTED
          </p>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-atlas-black leading-[1.05]">
            Ready to build
            <br />
            with Atlas?
          </h3>
        </div>

        {/* Center Segment: Acid Lime with CTA buttons */}
        <div className="lg:col-span-5 bg-atlas-lime p-8 sm:p-12 lg:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-atlas-black/15">
          <p className="text-base sm:text-lg text-atlas-black/90 font-medium mb-8 max-w-md leading-relaxed">
            Get started today and turn your ideas into reliable, scalable workflows.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-atlas-black text-white text-sm font-bold hover:bg-black/90 active:scale-95 transition-all shadow-sm group"
            >
              <span>Get Started</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-atlas-lime border-2 border-atlas-black text-atlas-black text-sm font-bold hover:bg-atlas-lime-light active:scale-95 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Read the Docs</span>
            </Link>
          </div>
        </div>

        {/* Right Segment: White/Cream with Editorial Typography - Flush to the right edge */}
        <div className="lg:col-span-3 bg-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
          <div className="flex justify-end">
            <span className="text-4xl font-light text-atlas-black select-none">
              ↗
            </span>
          </div>
          <div>
            <p className="text-xs font-mono font-bold tracking-wider text-atlas-black/70 mb-3 leading-tight">
              BUILD
              <br />
              RUN
              <br />
              SCALE
            </p>
            <p className="text-xs font-mono font-bold tracking-wider text-atlas-black uppercase leading-tight">
              A BRIGHTER
              <br />
              TOMORROW.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
