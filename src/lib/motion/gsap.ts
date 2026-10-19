/**
 * GSAP helpers for marketing timelines (DESIGN.md motion ownership).
 * Import only from client components. Register plugins once; always kill
 * ScrollTriggers and timelines on unmount.
 */
"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

export function ensureGsap(): typeof gsap {
  if (!registered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
  return gsap;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Kill all ScrollTriggers created by a component scope (match by id prefix). */
export function killScrollTriggersById(idPrefix: string): void {
  if (typeof window === "undefined") return;
  ensureGsap();
  for (const trigger of ScrollTrigger.getAll()) {
    if (trigger.vars.id?.toString().startsWith(idPrefix)) {
      trigger.kill();
    }
  }
}

export { gsap, ScrollTrigger };
