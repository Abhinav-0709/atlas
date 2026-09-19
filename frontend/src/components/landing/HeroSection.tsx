"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="w-full lg:h-[calc(100vh-62px)] lg:max-h-[860px] lg:min-h-[580px] flex flex-col justify-between overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-12 h-full w-full bg-atlas-sky">
        {/* Left Column: Sky Blue Container */}
        <div className="lg:col-span-6 xl:col-span-6 bg-atlas-sky px-8 sm:px-12 lg:px-16 py-8 lg:py-10 flex flex-col justify-center h-full">
          <div>
            {/* Monospace Eyebrow Tag */}
            <p className="text-[11px] sm:text-xs font-bold tracking-[0.2em] uppercase text-atlas-black/85 mb-4 font-mono">
              DISTRIBUTED WORKFLOWS FOR REAL-WORLD BUILDERS
            </p>

            {/* Graphic Typography */}
            <h1 className="text-5xl sm:text-6xl lg:text-[68px] xl:text-[82px] font-black leading-[0.88] tracking-tighter text-atlas-black uppercase mb-5 select-none">
              BUILD.
              <br />
              RUN.<span className="inline-block align-middle ml-1 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl">✦</span>
              <br />
              SCALE.
            </h1>

            {/* Body Copy */}
            <p className="text-sm sm:text-base lg:text-[17px] leading-relaxed text-atlas-black/90 max-w-lg font-normal mb-8">
              Atlas is a powerful, open workflow engine to orchestrate, schedule
              and run complex tasks at scale — with reliability, observability
              and control out of the box.
            </p>

            {/* CTA Button Group */}
            <div className="flex flex-wrap items-center gap-3.5">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 px-7 py-3 rounded-full bg-atlas-black text-white text-sm sm:text-base font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-md group"
              >
                <span>Get Started</span>
                <span className="text-base transition-transform group-hover:translate-x-1">→</span>
              </Link>
              {/* <a
                href="#features"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white/40 hover:bg-white/60 text-atlas-black text-sm sm:text-base font-semibold backdrop-blur-sm active:scale-95 transition-all"
              >
                <span className="w-5 h-5 rounded-full bg-atlas-black text-white flex items-center justify-center text-[10px]">
                  ▶
                </span>
                <span>Watch Demo</span>
              </a> */}
            </div>
          </div>
        </div>

        {/* Right Column: Acid Lime Container touching Top, Right, and Bottom with Rounded Left Edge */}
        <div className="lg:col-span-6 xl:col-span-6 bg-atlas-lime rounded-t-[32px] sm:rounded-t-[40px] lg:rounded-t-none lg:rounded-l-[40px] xl:rounded-l-[48px] p-6 sm:p-8 lg:p-8 xl:p-10 h-full flex flex-col justify-between overflow-hidden relative border-t lg:border-t-0 lg:border-l border-atlas-black/10 shadow-sm">
          {/* Top Row: IDEAS TO IMPACT (Left) & COMPLEX WORKFLOWS (Right) */}
          <div className="grid grid-cols-12 w-full items-start relative z-10">
            {/* Top Left Headline */}
            <div className="col-span-7">
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-atlas-black leading-tight">
                IDEAS
                <br />
                TO IMPACT
              </p>
            </div>

            {/* Top Right Subtitle & Arrow */}
            <div className="col-span-5 text-right pl-2 border-l border-atlas-black/15">
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-tight text-atlas-black leading-tight">
                COMPLEX
                <br />
                WORKFLOWS.
                <br />
                SIMPLE CONTROL.
              </p>
              <span className="inline-block text-2xl sm:text-3xl font-light text-atlas-black mt-1">
                ↗
              </span>
            </div>
          </div>

          {/* Main Center Body: Left Big Blocks & Right Lifecycle Panel */}
          <div className="grid grid-cols-12 w-full items-center gap-2 my-auto relative z-10">
            {/* Left Side: Large 3D Concrete Blocks */}
            <div className="col-span-7 relative flex items-center justify-start">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] lg:max-w-[350px] xl:max-w-[400px] aspect-square transition-transform hover:scale-[1.02] duration-300">
                <Image
                  src="/blocks.png"
                  alt="Atlas Concrete Blocks - Ideas to Impact"
                  fill
                  priority
                  className="object-contain drop-shadow-xl"
                />
              </div>
            </div>

            {/* Right Side: Vertical Panel with 5 Lifecycle Pills */}
            <div className="col-span-5 pl-3 sm:pl-5 border-l border-atlas-black/15 flex flex-col justify-center gap-2 sm:gap-2.5">
              {/* 1. Define */}
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/40 border border-atlas-black/10 text-xs sm:text-sm font-medium text-atlas-black transition-all hover:bg-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-atlas-black" />
                <span>Define</span>
              </div>

              {/* 2. Orchestrate (Active Highlighted Pill with Soft Shadow) */}
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#FAFDE4] border border-atlas-black/15 text-xs sm:text-sm font-bold text-atlas-black shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-atlas-black" />
                <span>Orchestrate</span>
              </div>

              {/* 3. Execute */}
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/40 border border-atlas-black/10 text-xs sm:text-sm font-medium text-atlas-black transition-all hover:bg-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-atlas-black" />
                <span>Execute</span>
              </div>

              {/* 4. Observe (With Diamond Bullet) */}
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/40 border border-atlas-black/10 text-xs sm:text-sm font-medium text-atlas-black transition-all hover:bg-white/60">
                <span className="text-[9px] text-atlas-black leading-none">◆</span>
                <span>Observe</span>
              </div>

              {/* 5. Scale */}
              <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/40 border border-atlas-black/10 text-xs sm:text-sm font-medium text-atlas-black transition-all hover:bg-white/60">
                <span className="w-1.5 h-1.5 rounded-full bg-atlas-black" />
                <span>Scale</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Handwritten "Built for builders." with Vertical Pipe Line */}
          <div className="grid grid-cols-12 w-full relative z-10 pt-1">
            <div className="col-span-7" />
            <div className="col-span-5 pl-3 sm:pl-5 border-l border-atlas-black/15 flex items-center gap-2.5">
              <span className="w-[1px] h-9 bg-atlas-black/30 flex-shrink-0" />
              <p className="font-handwriting text-2xl sm:text-3xl lg:text-[32px] text-atlas-black font-semibold leading-tight tracking-wide select-none">
                Built
                <br />
                for builders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
