"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { fetchSystemStats } from "@/lib/api";
import { SystemStats } from "@/lib/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="min-h-screen bg-atlas-cream text-atlas-black flex flex-col font-sans">
      {/* Single Unified Console Navigation Bar */}
      <Navbar
        engineOnline={stats.engineOnline}
        activeWorkers={stats.activeWorkers}
        queueDepth={stats.queueDepth}
      />

      {/* Main Dashboard Workspace */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
