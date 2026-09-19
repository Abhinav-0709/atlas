"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full relative z-50">
      <div className="grid grid-cols-1 lg:grid-cols-12 w-full">
        {/* Left Side: Sky Blue with Logo & Main Navigation */}
        <div className="lg:col-span-8 bg-atlas-sky px-6 sm:px-12 lg:px-16 py-6 flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-8 h-8 flex-shrink-0 transition-transform group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Atlas Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-2xl font-black tracking-tight text-atlas-black font-sans">
                Atlas
              </span>
            </Link>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-7 text-[14px] font-semibold text-atlas-black/80">
              <a
                href="#why-atlas"
                className="hover:text-atlas-black transition-colors"
              >
                Product
              </a>
              <a
                href="#use-cases"
                className="hover:text-atlas-black transition-colors"
              >
                Use Cases
              </a>
              <a
                href="#results"
                className="hover:text-atlas-black transition-colors"
              >
                Pricing
              </a>
              <Link
                href="/dashboard"
                className="hover:text-atlas-black transition-colors"
              >
                Docs
              </Link>
              <a
                href="#testimonials"
                className="hover:text-atlas-black transition-colors"
              >
                Blog
              </a>
            </nav>
          </div>

          {/* Mobile hamburger button on small screens */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-atlas-black rounded-lg hover:bg-black/5"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Right Side: White Background with Sign In & Get Started Button */}
        <div className="hidden lg:flex lg:col-span-4 bg-white px-8 lg:px-12 py-6 items-center justify-end gap-6">
          <Link
            href="/dashboard"
            className="text-[14px] font-bold text-atlas-black hover:opacity-75 transition-opacity"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-atlas-black text-white text-[14px] font-bold hover:bg-black/90 active:scale-95 transition-all shadow-sm group"
          >
            <span>Get Started</span>
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-atlas-cream border-b border-atlas-black/10 px-6 py-6 shadow-2xl flex flex-col gap-4 z-50">
          <a
            href="#why-atlas"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-semibold text-atlas-black py-1"
          >
            Product
          </a>
          <a
            href="#use-cases"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-semibold text-atlas-black py-1"
          >
            Use Cases
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-semibold text-atlas-black py-1"
          >
            Architecture
          </a>
          <a
            href="#results"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-semibold text-atlas-black py-1"
          >
            Pricing
          </a>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-semibold text-atlas-black py-1"
          >
            Docs
          </Link>
          <div className="pt-4 border-t border-atlas-black/10 flex flex-col gap-3">
            <Link
              href="/dashboard"
              className="text-center py-2 text-atlas-black font-semibold"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="text-center py-3 rounded-full bg-atlas-black text-white font-semibold"
            >
              Get Started →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
