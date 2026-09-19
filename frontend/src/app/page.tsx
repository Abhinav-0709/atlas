"use client";

import React from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import WhyAtlasSection from "@/components/landing/WhyAtlasSection";
import UseCasesSection from "@/components/landing/UseCasesSection";
import ArchitectureSection from "@/components/landing/ArchitectureSection";
import ResultsSection from "@/components/landing/ResultsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CtaBanner from "@/components/landing/CtaBanner";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-atlas-cream selection:bg-atlas-lime selection:text-atlas-black">
      {/* 1. Integrated Split Navbar */}
      <Navbar />

      {/* 2. Hero: Sky Blue & Acid Lime Split with Blocks & Typography */}
      <HeroSection />

      {/* 3. Why Atlas: More Than a Job Queue (2x3 Feature Bento) */}
      <WhyAtlasSection />

      {/* 4. Use Cases: Dark Section with Golf Ball Showcase */}
      <UseCasesSection />

      {/* 5. Architecture: Built on AWS, Diagram & 3D Cloud */}
      <ArchitectureSection />

      {/* 6. Results: 10x, 99.9%, ∞ Metrics + Panoramic Fairway Banner */}
      <ResultsSection />

      {/* 7. Testimonials: Loved by Builders Carousel */}
      <TestimonialsSection />

      {/* 8. CTA Banner: 3-Segment Capsule Ready to Build */}
      <CtaBanner />

      {/* 9. Footer: Logo, Links & Socials */}
      <Footer />
    </main>
  );
}
