"use client";

import { useAnimate } from "motion/react-mini";
import { useEffect, useRef, type ReactNode } from "react";
import { useMotionPreference } from "@/lib/motion/use-motion-preference";
import { cx, type ClassValue } from "@/lib/cx";

/*
 * Reveal — the one editorial scroll-reveal for public routes
 * (design-system.md §7.1: Framer/`motion` owns entrances; §7.2 rules).
 *
 * Why `motion/react-mini` and not `motion/react`: the full entry costs
 * ~39 KB gzip on a public route (measured 1.53 — over the §11 200 KB cap),
 * while the mini entry carries only the imperative `useAnimate` engine.
 * One-shot rise-and-fade at `--dur-slow`/`--ease-standard`; never a loop,
 * never scrubbed (§7.2: no perpetual animation).
 *
 * Contract:
 *   - SSR renders children VISIBLE (SEO, no-JS, first paint) — the hidden
 *     state is applied only inside the effect, so below-fold content never
 *     flashes for the reader (effects run before the user scrolls there).
 *   - Never wrap above-the-fold content: the effect runs after first paint,
 *     so an in-view element would flash visible→hidden→visible. The hero
 *     uses the CSS `.hero-enter` keyframes in globals.css instead.
 *   - `prefers-reduced-motion` (the one hook): no transform, no hide — the
 *     section simply is there (§7.2 "collapse to opacity or none").
 *   - Fires once per mount (no re-trigger on scroll-back) and disconnects
 *     its observer — nothing persists across route changes.
 */

interface RevealProps {
  children: ReactNode;
  className?: ClassValue;
  /** Stagger inside a group, ms. Keep small — motion never blocks reading. */
  delay?: number;
}

export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduce = useMotionPreference();
  const [scope, animate] = useAnimate();
  const fired = useRef(false);

  useEffect(() => {
    const el = scope.current;
    if (!el || fired.current) return;
    // Reduced motion: leave the SSR-visible content exactly as it is.
    if (reduce) return;

    // Hide now (below the fold — the reader cannot see this frame), then
    // reveal on first intersection. `duration: 0` applies the start state
    // synchronously inside the effect.
    void animate(el, { opacity: 0, y: 16 }, { duration: 0 });

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        fired.current = true;
        observer.disconnect();
        void animate(
          el,
          { opacity: [0, 1], y: [16, 0] },
          // --motion-ease-standard as a cubic-bezier tuple (motion-dom's
          // `ease`, not WAAPI's `easing`).
          { duration: 0.38, delay: delay / 1000, ease: [0.2, 0, 0, 1] },
        );
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, delay, reduce, scope]);

  return (
    <div ref={scope} className={cx(className)}>
      {children}
    </div>
  );
}
