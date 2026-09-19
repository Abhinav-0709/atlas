"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[640px] xl:min-h-[720px]">
        {/* Left Column: Sky Blue Container */}
        <div className="lg:col-span-6 bg-atlas-sky px-8 sm:px-12 lg:px-16 py-12 lg:py-16 flex flex-col justify-between">
          <div>
            {/* Monospace Eyebrow Tag */}
            <p className="text-[12px] sm:text-[13px] font-bold tracking-[0.2em] uppercase text-atlas-black/85 mb-8 font-mono">
              DISTRIBUTED WORKFLOWS FOR REAL-WORLD BUILDERS
            </p>

            {/* Giant Graphic Typography */}
            <h1 className="text-6xl sm:text-7xl lg:text-[88px] xl:text-[104px] font-black leading-[0.88] tracking-tighter text-atlas-black uppercase mb-8 select-none">
              BUILD.
              <br />
              RUN.<span className="inline-block align-middle ml-1 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl">✦</span>
              <br />
              SCALE.
            </h1>

            {/* Body Copy */}
            <p className="text-base sm:text-lg lg:text-[19px] leading-relaxed text-atlas-black/90 max-w-xl font-normal mb-10">
              Atlas is a powerful, open workflow engine to orchestrate, schedule
              and run complex tasks at scale — with reliability, observability
              and control out of the box.
            </p>

            {/* CTA Button Group */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-atlas-black text-white text-base font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-md group"
              >
                <span>Get Started</span>
                <span className="text-lg transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href="#why-atlas"
                className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-white/40 hover:bg-white/60 text-atlas-black text-base font-semibold backdrop-blur-sm active:scale-95 transition-all"
              >
                <span className="w-6 h-6 rounded-full bg-atlas-black text-white flex items-center justify-center text-xs">
                  ▶
                </span>
                <span>Watch Demo</span>
              </a>
            </div>
          </div>

          {/* Social Proof Row */}
          <div className="flex items-center gap-4 pt-6 border-t border-atlas-black/15">
            <div className="flex -space-x-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                alt="Builder Avatar"
                className="w-10 h-10 rounded-full border-2 border-atlas-sky object-cover grayscale"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Builder Avatar"
                className="w-10 h-10 rounded-full border-2 border-atlas-sky object-cover grayscale"
              />
              <img
                src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                alt="Builder Avatar"
                className="w-10 h-10 rounded-full border-2 border-atlas-sky object-cover grayscale"
              />
            </div>
            <p className="text-xs sm:text-sm font-medium text-atlas-black/80 max-w-[280px]">
              Join <span className="font-bold text-atlas-black">1,000+</span> builders automating real work with Atlas.
            </p>
          </div>
        </div>

        {/* Right Column: Acid Lime Container with Blocks & Checklist */}
        <div className="lg:col-span-6 bg-atlas-lime px-8 sm:px-12 lg:px-14 py-12 lg:py-16 relative flex flex-col justify-between overflow-hidden">
          {/* Top Row Metadata */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-tight text-atlas-black leading-tight">
                IDEAS
                <br />
                TO IMPACT
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-tight text-atlas-black leading-tight">
                COMPLEX
                <br />
                WORKFLOWS.
                <br />
                SIMPLE CONTROL.
              </p>
              <span className="inline-block text-3xl font-light text-atlas-black mt-2">
                ↗
              </span>
            </div>
          </div>

          {/* Center 3D Asset Illustration */}
          <div className="relative my-6 sm:my-8 flex items-center justify-center">
            <div className="relative w-full max-w-[420px] aspect-square transition-transform hover:scale-[1.02] duration-300">
              <Image
                src="/blocks.png"
                alt="Atlas Concrete Blocks - Ideas to Impact"
                fill
                priority
                className="object-contain drop-shadow-2xl"
              />
            </div>

            {/* Floating Lifecycle Pills Overlay on the right */}
            <div className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-20">
              {["Define", "Orchestrate", "Execute", "Observe", "Scale"].map((step) => (
                <div
                  key={step}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm border border-atlas-black/10 text-xs sm:text-sm font-bold text-atlas-black shadow-sm transition-all hover:bg-white hover:translate-x-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-atlas-black" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Handwritten Script Callout */}
          <div className="flex justify-end relative z-10 pt-4">
            <p className="font-handwriting text-4xl sm:text-5xl lg:text-6xl text-atlas-black font-semibold rotate-[-4deg] tracking-wide select-none">
              Built for builders.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
