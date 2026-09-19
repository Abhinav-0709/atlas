"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhyAtlasSection from "@/components/landing/WhyAtlasSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import QuickstartSection from "@/components/landing/QuickstartSection";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-atlas-cream selection:bg-atlas-lime selection:text-atlas-black">
      {/* 1. Integrated Split Navbar */}
      <Navbar />

      {/* 2. Hero: Sky Blue & Acid Lime Split with Blocks & Typography */}
      <HeroSection />

      {/* 3. Features: More Than a Job Queue (2x3 Feature Bento) */}
      <WhyAtlasSection />

      {/* 4. Use Cases: Dark Section with Precision Showcase */}
      <UseCasesSection />

      {/* 5. Architecture: Distributed Architecture & Engine Flow */}
      <ArchitectureSection />

      {/* 6. Developer Workflow: Code Terminal & Quickstart */}
      <QuickstartSection />

      {/* 7. CTA Banner: 3-Segment Capsule Ready to Build */}
      <CtaBanner />

      {/* 8. Footer: Brand, Clean Links & Socials */}
      <Footer />
    </main>
  );
}
