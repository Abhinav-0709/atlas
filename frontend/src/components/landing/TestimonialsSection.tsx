"use client";

import React, { useState } from "react";

const testimonials = [
  {
    quote:
      "Atlas made it so easy to manage our data pipelines. The observability and retries have saved us countless hours.",
    author: "Aarav Mehta",
    role: "Data Engineer",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "We run thousands of ML jobs through Atlas. It's reliable, simple to use and perfect for our scale.",
    author: "Priya Sharma",
    role: "ML Researcher",
    avatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  {
    quote:
      "The recovery and leasing guarantees eliminated all ghost task claims across our microservices cluster.",
    author: "Devon Clark",
    role: "Staff Platform Architect",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 2 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev >= testimonials.length - 2 ? 0 : prev + 1));
  };

  const displayedTestimonials = [
    testimonials[currentIndex % testimonials.length],
    testimonials[(currentIndex + 1) % testimonials.length],
  ];

  return (
    <section id="testimonials" className="w-full bg-atlas-cream pb-20 lg:pb-28 px-6 sm:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-atlas-black/60 mb-4 uppercase">
              // TRUSTED BY BUILDERS
            </p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-atlas-black leading-tight mb-4">
              Loved by
              <br />
              builders.
            </h2>
            <p className="text-base sm:text-lg text-atlas-black/75 max-w-md">
              Teams, researchers and independent developers use Atlas to run
              critical workflows every day.
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full border border-atlas-black/20 bg-white hover:bg-atlas-cream active:scale-95 flex items-center justify-center text-atlas-black text-lg transition-all"
              aria-label="Previous testimonials"
            >
              ←
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full bg-atlas-black text-white hover:bg-black/90 active:scale-95 flex items-center justify-center text-lg transition-all"
              aria-label="Next testimonials"
            >
              →
            </button>
          </div>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {displayedTestimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-atlas-black/10 shadow-sm flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md"
            >
              <div>
                <span className="text-4xl font-serif font-black text-atlas-black leading-none inline-block mb-3">
                  “
                </span>
                <p className="text-base sm:text-lg text-atlas-black/85 font-medium leading-relaxed mb-6">
                  {t.quote}
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-atlas-black/10">
                <img
                  src={t.avatar}
                  alt={t.author}
                  className="w-10 h-10 rounded-full object-cover grayscale"
                />
                <div>
                  <h4 className="text-sm font-extrabold text-atlas-black">
                    {t.author}
                  </h4>
                  <p className="text-xs font-medium text-atlas-black/60">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
