"use client";

import React from "react";
import Image from "next/image";

export default function ResultsSection() {
  return (
    <section id="results" className="w-full bg-atlas-cream pb-20 lg:pb-28 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Metrics Card */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-8 sm:p-10 border border-atlas-black/10 shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/60 mb-8 uppercase">
              // RESULTS
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4">
            {/* Stat 1 */}
            <div>
              <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-atlas-black tracking-tight mb-2">
                10x
              </p>
              <p className="text-xs sm:text-sm font-medium text-atlas-black/70 leading-snug">
                Faster execution at scale
              </p>
            </div>

            {/* Stat 2 */}
            <div>
              <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-atlas-black tracking-tight mb-2">
                99.9%
              </p>
              <p className="text-xs sm:text-sm font-medium text-atlas-black/70 leading-snug">
                Reliable task processing
              </p>
            </div>

            {/* Stat 3 */}
            <div>
              <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-atlas-black tracking-tight mb-2 select-none">
                ∞
              </p>
              <p className="text-xs sm:text-sm font-medium text-atlas-black/70 leading-snug">
                Built for what&apos;s next
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Panoramic Golf Banner */}
        <div className="lg:col-span-6 relative rounded-3xl overflow-hidden min-h-[220px] sm:min-h-[260px] border border-atlas-black/10 shadow-sm group">
          {/* Panoramic Image */}
          <Image
            src="/golf.png"
            alt="Complexity shouldn't slow you down"
            fill
            className="object-cover object-bottom transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-black/75 pointer-events-none" />

          {/* Overlay Typography */}
          <div className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 text-right z-10">
            <h4 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-md">
              COMPLEXITY
              <br />
              SHOULDN&apos;T SLOW
              <br />
              YOU DOWN.
            </h4>
          </div>
        </div>
      </div>
    </section>
  );
}
