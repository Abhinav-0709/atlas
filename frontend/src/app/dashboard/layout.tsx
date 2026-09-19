"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { fetchSystemStats } from "@/lib/api";
import { SystemStats } from "@/lib/types";
import { Layers, Activity, Server, FileText, ArrowLeft } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [stats, setStats] = useState<SystemStats>({
    activeWorkers: 0,
    queueDepth: 0,
    totalWorkflows: 0,
    activeRuns: 0,
    engineOnline: false,
  });

  useEffect(() => {
    fetchSystemStats().then(setStats);
    const interval = setInterval(() => {
      fetchSystemStats().then(setStats);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const sublinks = [
    { label: "Workflows & Runs", href: "/dashboard", icon: Layers },
    { label: "Worker Fleet", href: "/dashboard/workers", icon: Server },
    { label: "Prometheus Metrics", href: "/dashboard/metrics", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-atlas-lime text-atlas-black flex flex-col font-sans">
      <Navbar engineOnline={stats.engineOnline} />

      {/* Subnav & Stats Ribbon */}
      <div className="border-b border-black/15 bg-white/70 backdrop-blur-xs px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Sub Navigation */}
          <div className="flex items-center gap-2">
            {sublinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs uppercase tracking-wider font-bold transition-all ${
                    isActive
                      ? "bg-atlas-black text-atlas-lime shadow-sm"
                      : "text-black/70 hover:bg-black/5"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mini Stats Pills */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-atlas-cream border border-black/15">
              <span className="text-black/60 uppercase">Workers:</span>
              <span className="font-bold text-emerald-700">{stats.activeWorkers} LIVE</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-atlas-cream border border-black/15">
              <span className="text-black/60 uppercase">Queue:</span>
              <span className="font-bold text-atlas-blue">{stats.queueDepth} TASKS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Child Content */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
