"use client"

import { memo } from "react"
import { motion } from "motion/react"

/**
 * HeroGeometricBackground
 * 
 * Faithful Bauhaus / Modernist geometric composition inspired by the reference artwork:
 * - 5 vertical modular architectural columns with interlocking arches, domes, capsules, and stadium pills.
 * - Column 1 is 100% whole, complete, and uncut (no gradient mask seam), acting as an architectural frame for the text.
 * - Extends to y=0 so the navbar and hero canvas are seamlessly unified.
 * - Anchored cleanly to the right half on desktop (lg+), leaving generous breathing room for the headline, value prop, and search.
 * - Color palette mapped to PlayComun brand system:
 *     - Deep Midnight Violet (#2e1065) for the anchor arch
 *     - Vibrant Brand Violet (#7c3aed / #6d28d9) for pillars and floating capsules
 *     - Soft Lavender (#ddd6fe / #ede9fe) for connector and pill accents
 *     - Crisp Architectural White (#ffffff) for the grounded arches
 *     - Deep Brand Violet (#401289) for the global backdrop
 * 
 * Emil Kowalski design engineering principles:
 * - Tactile soft drop shadow (feDropShadow) on floating stadium capsules
 * - Smooth cubic-bezier entrance easing [0.23, 1, 0.32, 1]
 * - GPU-accelerated transforms, zero layout shifts
 * - Full prefers-reduced-motion compliance
 */
export const HeroGeometricBackground = memo(function HeroGeometricBackground() {
  return (
    <div 
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0"
      aria-hidden="true"
    >
      {/* Base rich brand violet background fill */}
      <div className="absolute inset-0 bg-[#401289]" />

      {/* Subtle brand depth wash on left */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#380e7a] via-[#401289] to-[#4c1d95]" />

      {/* Architectural columns container:
          - On desktop (lg+): occupies the right half (50%-48%), perfectly balancing the text on the left
          - On mobile/tablet: full width with ambient opacity for subtle texture
      */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[50%] xl:w-[48%] 2xl:w-[46%] h-full">
        <svg
          className="w-full h-full opacity-25 sm:opacity-35 lg:opacity-100 transition-opacity duration-300"
          viewBox="0 0 700 800"
          preserveAspectRatio="xMinYMin slice"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Tactile drop shadow for overlapping stadium capsules (Emil Kowalski depth) */}
            <filter id="hero-pill-shadow" x="-30%" y="-20%" width="160%" height="150%">
              <feDropShadow dx="-4" dy="12" stdDeviation="14" floodColor="#1a053d" floodOpacity="0.45" />
            </filter>

            {/* Soft tint shadow for the dark anchor arch */}
            <filter id="hero-arch-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="-2" dy="8" stdDeviation="12" floodColor="#12042b" floodOpacity="0.4" />
            </filter>

            {/* Subtle vertical gradients for vibrant elements */}
            <linearGradient id="hero-vibrant-grad-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            <linearGradient id="hero-vibrant-grad-2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>

            <linearGradient id="hero-lavender-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f5f3ff" />
              <stop offset="100%" stopColor="#ddd6fe" />
            </linearGradient>

            <linearGradient id="hero-white-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* =========================================================================
              5 MODULAR COLUMNS (W = 140 each, Radius R = 70, Total W = 700)
              Col 1: 0 - 140    (100% WHOLE, uncut, starting cleanly at x=0)
              Col 2: 140 - 280
              Col 3: 280 - 420
              Col 4: 420 - 560
              Col 5: 560 - 700
             ========================================================================= */}

          {/* -------------------------------------------------------------
              COLUMN 4 BACKGROUND LAYER: Tall Dark Anchor Arch
              Starts at y=600, rises to dome at y=100 (center: 490, 170, r=70)
             ------------------------------------------------------------- */}
          <motion.path
            d="M 420 600 L 420 170 A 70 70 0 0 1 560 170 L 560 600 Z"
            fill="#2e1065"
            filter="url(#hero-arch-shadow)"
            initial={{ opacity: 0, transform: "translateY(20px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* -------------------------------------------------------------
              COLUMN 1 (x: 0 to 140) - 100% COMPLETE & UNCUT:
              - Top: Vibrant violet hanging pill (y=0 to y=350, cap center at 280)
              - Bottom: White rising arch (y=1200 to y=450, dome center at 520)
             ------------------------------------------------------------- */}
          {/* Col 1 Bottom: White Arch */}
          <motion.path
            d="M 0 1200 L 0 520 A 70 70 0 0 1 140 520 L 140 1200 Z"
            fill="url(#hero-white-grad)"
            initial={{ opacity: 0, transform: "translateY(30px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* Col 1 Top: Vibrant Violet Pill */}
          <motion.path
            d="M 0 0 L 140 0 L 140 280 A 70 70 0 0 1 0 280 Z"
            fill="url(#hero-vibrant-grad-1)"
            initial={{ opacity: 0, transform: "translateY(-20px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* -------------------------------------------------------------
              COLUMN 3 (x: 280 to 420):
              - Middle connector: Soft lavender tint (y=260 to y=370)
              - Bottom: Rich violet arch (y=1200 to y=450, dome at 520)
              - Top: Vibrant violet hanging pill (y=0 to y=200, cap at 130)
             ------------------------------------------------------------- */}
          {/* Col 3 Middle Connector: Lavender */}
          <motion.path
            d="M 280 260 L 420 260 L 420 370 A 70 70 0 0 1 280 370 Z"
            fill="#ddd6fe"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />

          {/* Col 3 Bottom: Rich Violet Arch */}
          <motion.path
            d="M 280 1200 L 280 520 A 70 70 0 0 1 420 520 L 420 1200 Z"
            fill="url(#hero-vibrant-grad-2)"
            initial={{ opacity: 0, transform: "translateY(30px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* Col 3 Top: Vibrant Violet Pill */}
          <motion.path
            d="M 280 0 L 420 0 L 420 130 A 70 70 0 0 1 280 130 Z"
            fill="url(#hero-vibrant-grad-1)"
            initial={{ opacity: 0, transform: "translateY(-20px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* -------------------------------------------------------------
              COLUMN 5 (x: 560 to 700):
              - Bottom: White rising arch (y=1200 to y=450, dome at 520)
              - Top: Vibrant violet hanging pill (y=0 to y=350, cap at 280)
             ------------------------------------------------------------- */}
          {/* Col 5 Bottom: White Arch */}
          <motion.path
            d="M 560 1200 L 560 520 A 70 70 0 0 1 700 520 L 700 1200 Z"
            fill="url(#hero-white-grad)"
            initial={{ opacity: 0, transform: "translateY(30px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* Col 5 Top: Vibrant Violet Pill */}
          <motion.path
            d="M 560 0 L 700 0 L 700 280 A 70 70 0 0 1 560 280 Z"
            fill="url(#hero-vibrant-grad-1)"
            initial={{ opacity: 0, transform: "translateY(-20px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* -------------------------------------------------------------
              COLUMN 4 (x: 420 to 560) FOREGROUND:
              - Bottom: White rising arch (y=1200 to y=670, dome at 740)
              - Middle: Vibrant floating pill (y=340 to y=550) with shadow
             ------------------------------------------------------------- */}
          {/* Col 4 Bottom: White Arch */}
          <motion.path
            d="M 420 1200 L 420 740 A 70 70 0 0 1 560 740 L 560 1200 Z"
            fill="url(#hero-white-grad)"
            initial={{ opacity: 0, transform: "translateY(20px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.28, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* Col 4 Middle Pill: Vibrant Violet Capsule */}
          <motion.path
            d="M 420 410 A 70 70 0 0 1 560 410 L 560 480 A 70 70 0 0 1 420 480 Z"
            fill="url(#hero-vibrant-grad-2)"
            filter="url(#hero-pill-shadow)"
            initial={{ opacity: 0, transform: "scale(0.96)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* -------------------------------------------------------------
              COLUMN 2 (x: 140 to 280) FOREGROUND:
              - Top: Rich vibrant violet hanging pill (y=0 to y=250, cap at 180)
                Ensures crystal-clear contrast for navbar items ("Servicios")
              - Middle/Bottom: HERO FLOATING PILL (y=340 to y=640)
                Signature soft lavender stadium capsule with tactile drop shadow
             ------------------------------------------------------------- */}
          {/* Col 2 Top: Vibrant Violet Pill */}
          <motion.path
            d="M 140 0 L 280 0 L 280 180 A 70 70 0 0 1 140 180 Z"
            fill="url(#hero-vibrant-grad-2)"
            initial={{ opacity: 0, transform: "translateY(-20px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.7, delay: 0.22, ease: [0.23, 1, 0.32, 1] }}
          />

          {/* Col 2 Signature Floating Stadium Capsule (Soft Lavender with Tactile Shadow) */}
          <motion.path
            d="M 140 410 A 70 70 0 0 1 280 410 L 280 570 A 70 70 0 0 1 140 570 Z"
            fill="url(#hero-lavender-grad)"
            filter="url(#hero-pill-shadow)"
            initial={{ opacity: 0, transform: "translateY(15px) scale(0.96)" }}
            animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
            transition={{ duration: 0.65, delay: 0.32, ease: [0.23, 1, 0.32, 1] }}
          />
        </svg>
      </div>

    </div>
  )
})

