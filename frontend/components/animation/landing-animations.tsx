"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type LandingAnimationsProps = {
  children: ReactNode;
};

export function LandingAnimations({ children }: LandingAnimationsProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reducedMotion) {
        gsap.set([".hero-reveal", ".reveal"], { autoAlpha: 1, y: 0 });
        return;
      }

      const intro = gsap.timeline({
        defaults: { duration: 0.9, ease: "power3.out" }
      });

      intro
        .from(".nav-reveal", { autoAlpha: 0, y: -16 })
        .from(".hero-reveal", { autoAlpha: 0, y: 24, stagger: 0.08 }, "-=0.55")
        .from(".proof-lane", { autoAlpha: 0, y: 26, stagger: 0.1 }, "-=0.35")
        .from(".signal-line", { scaleX: 0, transformOrigin: "left center", stagger: 0.06 }, "-=0.45");

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.85,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: element,
              start: "top 82%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });

      gsap.utils.toArray<HTMLElement>(".story-step").forEach((element, index) => {
        gsap.fromTo(
          element,
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            delay: index * 0.04,
            ease: "power2.out",
            immediateRender: false,
            scrollTrigger: {
              trigger: element,
              start: "top 84%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    },
    { scope }
  );

  return <div ref={scope}>{children}</div>;
}
