"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

/**
 * Spotlight
 * - Desktop-only soft cursor highlight that sits absolutely within its parent.
 * - Non-interactive (pointer-events: none); smoothly follows the cursor using framer-motion springs.
 *
 * Usage:
 *   Place <Spotlight /> inside a relatively positioned container (e.g., the Profile card).
 *   It will automatically attach listeners to its parent element.
 */
export default function Spotlight({ size = 220, strength = 0.28, className = "" }) {
  const dotRef = useRef(null);
  const [visible, setVisible] = useState(false);

  // Springs for buttery-smooth motion
  const x = useSpring(0, { stiffness: 300, damping: 30, mass: 0.2 });
  const y = useSpring(0, { stiffness: 300, damping: 30, mass: 0.2 });

  useEffect(() => {
    const el = dotRef.current?.parentElement;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      // Position spotlight centered at the cursor
      x.set((e.clientX - rect.left) - size / 2);
      y.set((e.clientY - rect.top) - size / 2);
    };

    const onEnter = () => setVisible(true);
    const onLeave = () => setVisible(false);

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [size, x, y]);

  // Keep it subtle; use mix-blend to "lift" the background slightly
  const opacity = visible ? 1 : 0;

  return (
    <motion.div
      ref={dotRef}
      className={`pointer-events-none absolute z-10 ${className}`}
      style={{
        width: size,
        height: size,
        // Framer motion animated position
        x,
        y,
        // Visuals: soft radial glow that fades outward
        background: `radial-gradient(ellipse at center,
          rgba(255,255,255,${strength}),
          rgba(255,255,255,0) 70%)`,
        filter: "blur(22px)",
        mixBlendMode: "screen",
        opacity,
        willChange: "transform, opacity",
      }}
    />
  );
}