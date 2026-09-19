"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const awsServices = [
  {
    name: "DynamoDB",
    desc: "Execution state",
    icon: (
      <svg className="w-6 h-6 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
      </svg>
    ),
  },
  {
    name: "S3",
    desc: "Artifacts & logs",
    icon: (
      <svg className="w-6 h-6 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
      </svg>
    ),
  },
  {
    name: "CloudWatch",
    desc: "Monitoring & alerts",
    icon: (
      <svg className="w-6 h-6 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    name: "IAM",
    desc: "Security & access",
    icon: (
      <svg className="w-6 h-6 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    name: "VPC",
    desc: "Network isolation",
    icon: (
      <svg className="w-6 h-6 text-atlas-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
];

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="w-full bg-atlas-cream py-16 sm:py-20 lg:py-24 px-0 overflow-hidden">
      {/* 3-Column Grid Touching Left and Right Browser Edges with Zero Gap */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
        {/* Card 1: Acid Lime - Touching the LEFT Screen Edge */}
        <div className="lg:col-span-4 bg-atlas-lime pl-6 sm:pl-10 lg:pl-14 xl:pl-16 pr-6 sm:pr-8 py-10 sm:py-12 flex flex-col justify-between border-y border-r border-atlas-black/10 shadow-sm">
          <div>
            <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/70 mb-5 uppercase">
              // ARCHITECTURE
            </p>
            <h3 className="text-3xl sm:text-4xl lg:text-[46px] xl:text-[52px] font-black tracking-tighter text-atlas-black leading-[1.04] mb-5">
              Built on AWS.
              <br />
              Designed to scale.
            </h3>
            <p className="text-sm sm:text-base text-atlas-black/85 leading-relaxed font-normal mb-8 max-w-md">
              A modern, cloud-native architecture, using AWS to ensure
              reliability, scalability and operational excellence.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-atlas-black text-white text-sm font-semibold hover:bg-black/90 active:scale-95 transition-all shadow-sm"
            >
              <span>View Architecture</span>
              <span className="text-base">→</span>
            </Link>
          </div>

          <div className="pt-8">
            <span className="text-5xl sm:text-6xl font-light text-atlas-black select-none">
              ↗
            </span>
          </div>
        </div>

        {/* Card 2: Center Diagram Card (Touching Card 1 and Card 3) */}
        <div className="lg:col-span-5 bg-white p-6 sm:p-8 border-y border-r border-atlas-black/10 shadow-sm flex flex-col justify-between">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-full">
            {/* Left Services Column */}
            <div className="md:col-span-5 flex flex-col gap-3">
              {awsServices.map((svc) => (
                <div
                  key={svc.name}
                  className="flex items-center gap-3 p-2.5 rounded-xl bg-atlas-cream/70 border border-atlas-black/5 text-left"
                >
                  <span className="text-base sm:text-lg flex-shrink-0">{svc.icon}</span>
                  <div>
                    <p className="text-xs sm:text-[13px] font-bold text-atlas-black tracking-tight leading-tight">
                      {svc.name}
                    </p>
                    <p className="text-[10px] sm:text-[11px] font-medium text-atlas-black/60 leading-tight">
                      {svc.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Execution Flow Diagram */}
            <div className="md:col-span-7 flex flex-col items-center gap-2 py-1">
              {/* Client Box */}
              <div className="w-full text-center px-4 py-2.5 rounded-xl bg-atlas-black text-white shadow-sm">
                <p className="text-xs sm:text-[13px] font-extrabold tracking-tight">Client / API</p>
                <p className="text-[10px] text-white/70 font-mono">(Web App, SDK, CLI)</p>
              </div>

              <span className="text-atlas-black/40 text-xs font-bold leading-none">↓</span>

              {/* API Server */}
              <div className="w-full text-center px-4 py-2 rounded-xl bg-gray-100 border border-atlas-black/10">
                <p className="text-xs sm:text-[13px] font-bold text-atlas-black">API Server</p>
                <p className="text-[10px] text-atlas-black/60 font-mono">(EC2)</p>
              </div>

              <span className="text-atlas-black/40 text-xs font-bold leading-none">↓</span>

              {/* Scheduler */}
              <div className="w-full text-center px-4 py-2 rounded-xl bg-gray-100 border border-atlas-black/10">
                <p className="text-xs sm:text-[13px] font-bold text-atlas-black">Scheduler</p>
                <p className="text-[10px] text-atlas-black/60 font-mono">(EC2)</p>
              </div>

              <span className="text-atlas-black/40 text-xs font-bold leading-none">↓</span>

              {/* SQS Task Queue */}
              <div className="w-full text-center px-4 py-2.5 rounded-xl bg-atlas-cream border border-atlas-black/15 shadow-inner">
                <p className="text-xs sm:text-[13px] font-extrabold text-atlas-black">SQS</p>
                <p className="text-[10px] text-atlas-black/70 font-mono">(Task Queue)</p>
              </div>

              <span className="text-atlas-black/40 text-xs font-bold leading-none">↓</span>

              {/* Workers */}
              <div className="w-full text-center px-4 py-2 rounded-xl bg-gray-100 border border-atlas-black/10">
                <p className="text-xs sm:text-[13px] font-bold text-atlas-black">Workers</p>
                <p className="text-[10px] text-atlas-black/60 font-mono">(EC2 / ECS)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Sky Blue & Cloud - Touching the RIGHT Screen Edge */}
        <div className="lg:col-span-3 bg-atlas-sky pl-6 sm:pl-8 pr-6 sm:pr-10 lg:pr-14 xl:pr-16 py-10 sm:py-12 flex flex-col justify-between border-y border-atlas-black/10 shadow-sm">
          {/* Top Text Ribbon */}
          <div className="space-y-1">
            {["RELIABLE", "SCALABLE", "OBSERVABLE", "PRODUCTION READY"].map((tag) => (
              <p
                key={tag}
                className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-atlas-black/85 uppercase"
              >
                {tag}
              </p>
            ))}
          </div>

          {/* Inset Lime Card with 3D Cloud */}
          <div className="my-6 bg-atlas-lime rounded-2xl p-4 flex flex-col items-center justify-center border border-atlas-black/10 shadow-inner min-h-[190px]">
            <div className="relative w-36 h-28 hover:scale-105 transition-transform duration-300">
              <Image
                src="/cloud.png"
                alt="Atlas Cloud Native Architecture"
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>

          {/* Bottom Tagline */}
          <div>
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-tight text-atlas-black leading-tight">
              FROM
              <br />
              INFRASTRUCTURE
              <br />
              TO IMPACT.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
