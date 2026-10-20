"use client";

import { useEffect } from "react";
import { ensureGsap, killScrollTriggersById, prefersReducedMotion } from "@/lib/motion/gsap";

/**
 * Material Ledger motion — entries write in, stamps land. Nothing else moves.
 * Scoped to `[data-ledger-line]` on the homepage; reduced-motion visitors get
 * the final, fully legible ledger (the global CSS reset also collapses any
 * residual transition).
 */
export function HomeGsap() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const gsap = ensureGsap();
    const prefix = "ledger-line";
    let raf = 0;

    /* Deferred a frame and `immediateRender: false`: homepage sections stream
       in behind Suspense, and GSAP must never write initial styles onto a
       node React has not finished hydrating. */
    raf = requestAnimationFrame(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-ledger-line]");
      lines.forEach((el, index) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 10 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: { id: `${prefix}-${index}`, trigger: el, start: "top 92%", once: true },
          },
        );

        const stamp = el.querySelector<HTMLElement>(".type-stamp");
        if (stamp) {
          gsap.fromTo(
            stamp,
            { autoAlpha: 0, scale: 1.6, rotation: -10 },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: -2,
              duration: 0.3,
              delay: 0.15,
              ease: "power3.in",
              immediateRender: false,
              scrollTrigger: { id: `${prefix}-stamp-${index}`, trigger: el, start: "top 92%", once: true },
            },
          );
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      killScrollTriggersById(prefix);
    };
  }, []);

  return null;
}
