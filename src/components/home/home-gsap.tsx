"use client";

import { useEffect } from "react";
import { ensureGsap, killScrollTriggersById, prefersReducedMotion } from "@/lib/motion/gsap";

/**
 * Material Ledger motion.
 *
 * First look (the cover) runs one entrance choreography on load: folio lines
 * rise in sequence, the live sheet's rows write in from the margin, stamps
 * land one by one, folio totals count up, the ghost folio numeral drifts,
 * the active entry highlight walks down the sheet, and the register ribbon
 * ticks sideways. Below the fold, entries write in and stamps land as they
 * arrive. Nothing else moves; reduced-motion visitors get the resting,
 * fully legible ledger.
 */
export function HomeGsap() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const gsap = ensureGsap();
    const prefix = "ledger-line";
    let raf = 0;
    let cycleTimer = 0;
    let sheet: HTMLElement | null = null;
    let pauseCycle: (() => void) | null = null;
    let resumeCycle: (() => void) | null = null;

    raf = requestAnimationFrame(() => {
      /* ------------------------------------------------ cover choreography */
      const hero = document.querySelector<HTMLElement>("[data-hero]");
      if (hero) {
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline
          .fromTo(
            hero.querySelectorAll("[data-hero-reveal]"),
            { autoAlpha: 0, y: 26 },
            { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.09 },
          )
          .fromTo(
            hero.querySelectorAll("[data-sheet-row]"),
            { autoAlpha: 0, x: 36 },
            { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.07 },
            "-=0.35",
          );

        hero.querySelectorAll<HTMLElement>("[data-sheet-row] .type-stamp").forEach((stamp, index) => {
          gsap.fromTo(
            stamp,
            { autoAlpha: 0, scale: 1.7, rotation: -12 },
            {
              autoAlpha: 1,
              scale: 1,
              rotation: -2,
              duration: 0.32,
              delay: 0.55 + index * 0.07,
              ease: "power4.in",
            },
          );
        });

        const ghost = hero.querySelector("[data-ghost]");
        if (ghost) {
          gsap.to(ghost, { y: 14, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" });
        }

        /* Folio totals count up — formatting follows the page locale. */
        const formatter = new Intl.NumberFormat(document.documentElement.lang || "en");
        hero.querySelectorAll<HTMLElement>("[data-count-up]").forEach((el) => {
          const target = Number(el.dataset.countUp ?? 0);
          if (!target) return;
          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.4,
            delay: 0.4,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = formatter.format(Math.round(counter.value));
            },
          });
        });

        /* Register ribbon — a slow, endless sideways tick of live SKUs. */
        const track = hero.querySelector("[data-ribbon-track]");
        if (track) {
          gsap.to(track, { xPercent: -50, duration: 32, repeat: -1, ease: "none" });
        }

        /* The active entry walks the sheet until the visitor takes over. */
        const rows = Array.from(hero.querySelectorAll<HTMLElement>("[data-sheet-row]"));
        if (rows.length > 1) {
          let activeIndex = 0;
          rows[0].classList.add("ledger-active");
          const advance = () => {
            rows[activeIndex].classList.remove("ledger-active");
            activeIndex = (activeIndex + 1) % rows.length;
            rows[activeIndex].classList.add("ledger-active");
          };
          const startCycle = () => {
            window.clearInterval(cycleTimer);
            cycleTimer = window.setInterval(advance, 2400);
          };
          pauseCycle = () => window.clearInterval(cycleTimer);
          resumeCycle = startCycle;
          sheet = rows[0].closest("section");
          sheet?.addEventListener("pointerenter", pauseCycle);
          sheet?.addEventListener("pointerleave", resumeCycle);
          sheet?.addEventListener("focusin", pauseCycle);
          sheet?.addEventListener("focusout", resumeCycle);
          startCycle();
        }
      }

      /* --------------------------------------- below-fold entry/stamp motion */
      const lines = gsap.utils
        .toArray<HTMLElement>("[data-ledger-line]")
        .filter((el) => !el.closest("[data-hero]"));

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
      window.clearInterval(cycleTimer);
      if (sheet && pauseCycle && resumeCycle) {
        sheet.removeEventListener("pointerenter", pauseCycle);
        sheet.removeEventListener("pointerleave", resumeCycle);
        sheet.removeEventListener("focusin", pauseCycle);
        sheet.removeEventListener("focusout", resumeCycle);
      }
      killScrollTriggersById(prefix);
    };
  }, []);

  return null;
}
