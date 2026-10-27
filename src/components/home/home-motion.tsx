"use client";

import { useEffect } from "react";
import { ensureGsap, killScrollTriggersById, prefersReducedMotion } from "@/lib/motion/gsap";

/**
 * Homepage motion island — GSAP only on the public home route.
 *
 * 1. Hero entrance + live count-up
 * 2. Workflow pin (lg+) with step + comparison peak stagger
 * 3. Light below-fold reveals on [data-home-reveal]
 *
 * Reduced-motion: early exit; content stays fully visible (no FOUC gating).
 */
export function HomeMotion() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const gsap = ensureGsap();
    const prefix = "home-motion";
    let ctx: ReturnType<typeof gsap.context> | null = null;
    let raf = 0;

    raf = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        /* ------------------------------------------------ hero entrance */
        const hero = document.querySelector<HTMLElement>("[data-hero]");
        if (hero) {
          const bg = hero.querySelector("[data-hero-bg]");
          if (bg) {
            gsap.fromTo(bg, { scale: 1.08 }, { scale: 1, duration: 1.4, ease: "power2.out" });
          }

          gsap.fromTo(
            hero.querySelectorAll("[data-hero-reveal]"),
            { autoAlpha: 0, y: 28 },
            { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1, ease: "power3.out" },
          );

          const formatter = new Intl.NumberFormat(document.documentElement.lang || "en");
          hero.querySelectorAll<HTMLElement>("[data-count-up]").forEach((el) => {
            const target = Number(el.dataset.countUp ?? 0);
            if (!target) return;
            const counter = { value: 0 };
            gsap.to(counter, {
              value: target,
              duration: 1.35,
              delay: 0.35,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = formatter.format(Math.round(counter.value));
              },
            });
          });
        }

        /* -------------------------------- workflow pin + comparison peak */
        const pin = document.querySelector<HTMLElement>("[data-workflow-pin]");
        if (pin && window.matchMedia("(min-width: 1024px)").matches) {
          const steps = pin.querySelectorAll<HTMLElement>("[data-workflow-step]");
          const rows = pin.querySelectorAll<HTMLElement>("[data-compare-row]");
          const peak = pin.querySelector<HTMLElement>("[data-comparison-peak]");

          gsap.set(steps, { autoAlpha: 0, y: 24 });
          gsap.set(rows, { autoAlpha: 0, x: 20 });

          const tl = gsap.timeline({
            scrollTrigger: {
              id: `${prefix}-workflow`,
              trigger: pin,
              start: "top 15%",
              end: "+=220%",
              pin: true,
              scrub: 0.65,
              anticipatePin: 1,
            },
          });

          tl.to(steps, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.12,
            ease: "power2.out",
          });

          if (peak) {
            tl.fromTo(
              peak,
              { autoAlpha: 0.55, scale: 0.98 },
              { autoAlpha: 1, scale: 1, duration: 0.35, ease: "power2.out" },
              "-=0.1",
            );
          }

          tl.to(
            rows,
            {
              autoAlpha: 1,
              x: 0,
              duration: 0.35,
              stagger: 0.1,
              ease: "power2.out",
            },
            "-=0.15",
          );

          const lowest = pin.querySelector<HTMLElement>('[data-compare-row][data-lowest="true"]');
          if (lowest) {
            tl.fromTo(
              lowest,
              { boxShadow: "inset 0 0 0 0 transparent" },
              {
                boxShadow: "inset 3px 0 0 var(--brand-primary)",
                duration: 0.25,
                ease: "power2.out",
              },
              "-=0.1",
            );
          }
        } else if (pin) {
          gsap.fromTo(
            pin.querySelectorAll("[data-workflow-step], [data-compare-row]"),
            { autoAlpha: 0, y: 16 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.5,
              stagger: 0.06,
              ease: "power2.out",
              scrollTrigger: {
                id: `${prefix}-workflow-mobile`,
                trigger: pin,
                start: "top 85%",
                once: true,
              },
            },
          );
        }

        /* --------------------------------------- below-fold section reveals */
        gsap.utils.toArray<HTMLElement>("[data-home-reveal]").forEach((el, index) => {
          if (el.closest("[data-workflow-pin]")) return;
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: 20 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              ease: "power2.out",
              immediateRender: false,
              scrollTrigger: {
                id: `${prefix}-reveal-${index}`,
                trigger: el,
                start: "top 90%",
                once: true,
              },
            },
          );
        });
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      ctx?.revert();
      killScrollTriggersById(prefix);
    };
  }, []);

  return null;
}
