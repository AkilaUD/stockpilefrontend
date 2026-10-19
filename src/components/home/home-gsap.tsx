"use client";

import { useEffect } from "react";
import { ensureGsap, killScrollTriggersById, prefersReducedMotion } from "@/lib/motion/gsap";

/**
 * Homepage GSAP section reveals. Scoped to `[data-home-reveal]`; killed on unmount.
 */
export function HomeGsap() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const gsap = ensureGsap();
    const nodes = gsap.utils.toArray<HTMLElement>("[data-home-reveal]");
    const prefix = "home-reveal";

    nodes.forEach((el, index) => {
      gsap.fromTo(
        el,
        { autoAlpha: 0, y: 28 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            id: `${prefix}-${index}`,
            trigger: el,
            start: "top 88%",
            once: true,
          },
        },
      );
    });

    return () => {
      killScrollTriggersById(prefix);
    };
  }, []);

  return null;
}
