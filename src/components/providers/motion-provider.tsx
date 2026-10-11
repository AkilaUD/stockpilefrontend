"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/*
 * Wires docs/design-system.md §7.2's Framer/Motion reduced-motion contract:
 *
 *   One hook (useMotionPreference) + <MotionConfig reducedMotion="user">.
 *
 * `reducedMotion="user"` makes every `motion` component in the tree read the
 * OS `prefers-reduced-motion` setting itself and collapse its transition to
 * the target state (instant) for users who asked for less motion — "collapse
 * to opacity or none" in §7.2. It lives in the root provider stack so every
 * route — public and workspace alike — inherits it; the tree-shaken cost is
 * the price of the allocation table in §7.1 ("always (tree-shaken)").
 *
 * This covers the JS/Framer side. Radix's dialog/menu overlays are pure CSS
 * and already collapse under `@media (prefers-reduced-motion: reduce)` in
 * app/globals.css (§7.2); GSAP and View Transitions have no consumers in
 * Phase 1 and will gate on the same signal (lib/motion/use-motion-preference)
 * when their tasks arrive.
 */

export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}