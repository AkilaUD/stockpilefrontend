"use client";

import dynamic from "next/dynamic";

/**
 * Lazy-load GSAP home choreography so the motion island is a separate chunk.
 * SSR skipped: motion is progressive enhancement; markup is already visible.
 */
const HomeMotion = dynamic(
  () => import("./home-motion").then((mod) => mod.HomeMotion),
  { ssr: false },
);

export function LazyHomeMotion() {
  return <HomeMotion />;
}
