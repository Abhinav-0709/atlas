"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

const awsServices = [
  {
    name: "DynamoDB",
    desc: "Execution state",
    icon: "🗄️",
  },
  {
    name: "S3",
    desc: "Artifacts & logs",
    icon: "📦",
  },
  {
    name: "CloudWatch",
    desc: "Monitoring & alerts",
    icon: "📈",
  },
  {
    name: "IAM",
    desc: "Security & access",
    icon: "🛡️",
  },
  {
    name: "VPC",
    desc: "Network isolation",
    icon: "🌐",
  },
];

export default function ArchitectureSection() {
  return (
    <section id="architecture" className="w-full bg-atlas-cream py-20 lg:py-28 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: Acid Lime Intro */}
          <div className="lg:col-span-4 bg-atlas-lime rounded-3xl p-8 sm:p-10 flex flex-col justify-between border border-atlas-black/10 shadow-sm">
            <div>
              <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/70 mb-6 uppercase">
                // ARCHITECTURE
              </p>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-atlas-black leading-[1.05] mb-6">
                Built on AWS.
                <br />
                Designed to scale.
              </h3>
              <p className="text-base text-atlas-black/85 leading-relaxed font-normal mb-8">
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
              <span className="text-6xl font-light text-atlas-black select-none">
                ↗
              </span>
            </div>
          </div>

          {/* Card 2: AWS Diagram Container */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 border border-atlas-black/10 shadow-sm flex flex-col justify-between">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center h-full">
              {/* Left AWS services badge column */}
              <div className="md:col-span-5 flex flex-col gap-3">
                {awsServices.map((svc) => (
                  <div
                    key={svc.name}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-atlas-cream/70 border border-atlas-black/5 text-left"
                  >
                    <span className="text-lg">{svc.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-atlas-black tracking-tight leading-tight">
                        {svc.name}
                      </p>
                      <p className="text-[10px] font-medium text-atlas-black/60 leading-tight">
                        {svc.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Execution Flow Diagram */}
              <div className="md:col-span-7 flex flex-col items-center gap-2 py-2">
                {/* Client Box */}
                <div className="w-full text-center px-4 py-2.5 rounded-xl bg-atlas-black text-white shadow-sm">
                  <p className="text-xs font-extrabold tracking-tight">Client / API</p>
                  <p className="text-[10px] text-white/70 font-mono">(Web App, SDK, CLI)</p>
                </div>

                <span className="text-atlas-black/40 text-xs font-bold">↓</span>

                {/* API Server */}
                <div className="w-full text-center px-4 py-2 rounded-xl bg-gray-100 border border-atlas-black/10">
                  <p className="text-xs font-bold text-atlas-black">API Server</p>
                  <p className="text-[10px] text-atlas-black/60 font-mono">(EC2)</p>
                </div>

                <span className="text-atlas-black/40 text-xs font-bold">↓</span>

                {/* Scheduler */}
                <div className="w-full text-center px-4 py-2 rounded-xl bg-gray-100 border border-atlas-black/10">
                  <p className="text-xs font-bold text-atlas-black">Scheduler</p>
                  <p className="text-[10px] text-atlas-black/60 font-mono">(EC2)</p>
                </div>

                <span className="text-atlas-black/40 text-xs font-bold">↓</span>

                {/* SQS Task Queue */}
                <div className="w-full text-center px-4 py-2.5 rounded-xl bg-atlas-cream border border-atlas-black/15 shadow-inner">
                  <p className="text-xs font-extrabold text-atlas-black">SQS</p>
                  <p className="text-[10px] text-atlas-black/70 font-mono">(Task Queue)</p>
                </div>

                <span className="text-atlas-black/40 text-xs font-bold">↓</span>

                {/* Workers */}
                <div className="w-full text-center px-4 py-2 rounded-xl bg-gray-100 border border-atlas-black/10">
                  <p className="text-xs font-bold text-atlas-black">Workers</p>
                  <p className="text-[10px] text-atlas-black/60 font-mono">(EC2 / ECS)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Sky Blue & Cloud Illustration */}
          <div className="lg:col-span-3 bg-atlas-sky rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-atlas-black/10 shadow-sm">
            {/* Top Text Ribbon */}
            <div className="space-y-1">
              {["RELIABLE", "SCALABLE", "OBSERVABLE", "PRODUCTION READY"].map((tag) => (
                <p
                  key={tag}
                  className="text-xs font-mono font-bold tracking-wider text-atlas-black/85 uppercase"
                >
                  {tag}
                </p>
              ))}
            </div>

            {/* Inset Lime Card with 3D Cloud */}
            <div className="my-6 bg-atlas-lime rounded-2xl p-4 flex flex-col items-center justify-center border border-atlas-black/10 shadow-inner min-h-[200px]">
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
      </div>
    </section>
  );
}
