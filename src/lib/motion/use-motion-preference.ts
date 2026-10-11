"use client";

import { useSyncExternalStore } from "react";

/*
 * The one motion-preferences hook — docs/design-system.md §7.2.
 *
 *   prefers-reduced-motion: reduce  →  all GSAP timelines not created, Framer
 *   transitions collapse to opacity or none, View Transitions disabled. One
 *   hook (useMotionPreference) + <MotionConfig reducedMotion="user">.
 *
 * Every consumer (GSAP gating, View-Transition gating, anything that animates
 * in JS) reads THIS signal, never its own matchMedia — one source of truth so
 * the reduced-motion contract cannot drift consumer by consumer.
 *
 * Why not `useReducedMotion` from motion/react? That hook reads the same media
 * query, but the spec names one app-level hook, and GSAP/View-Transition
 * consumers must not depend on the Framer Runtime just to ask the OS a
 * question. This hook needs only React.
 *
 * Server rendering: the server has no screen, so the first HTML claims
 * "not reduced" (getServerSnapshot = false) — an optimistic default that
 * hydrates to the truth before the browser paints interacting elements, and
 * which matches how MotionConfig's `reducedMotion="user"` behaves on first
 * pass. GSAP consumers are the one curve: they create timelines in effects
 * that run after hydration anyway, so the value is correct by then — nothing
 * in Phase 1 reads this during pre-hydration (see use-motion-preference
 * consumers in later tasks).
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onStoreChange);
  return () => mql.removeEventListener("change", onStoreChange);
}

function getSnapshot(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

const getServerSnapshot = (): boolean => false;

/** `true` when the OS asks for reduced motion. */
export function useMotionPreference(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}