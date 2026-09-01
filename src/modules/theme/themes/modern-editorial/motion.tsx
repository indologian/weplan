"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ModernEditorialMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".wedding-theme.modern-editorial .me-cover-title > span", { y: 36, opacity: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" });
      gsap.from(".wedding-theme.modern-editorial .me-cover-visual", { scale: 0.97, opacity: 0, duration: 0.9, ease: "power2.out" });
      gsap.utils.toArray<HTMLElement>(".wedding-theme.modern-editorial .me-section").forEach((section) => {
        const elements = section.querySelectorAll<HTMLElement>(".me-reveal");
        if (!elements.length || section.classList.contains("me-cover")) return;
        gsap.from(elements, { y: 24, opacity: 0, duration: 0.65, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 82%", once: true } });
      });
    });
    mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.to(".wedding-theme.modern-editorial .me-cover-visual img", { yPercent: 5, ease: "none", scrollTrigger: { trigger: ".wedding-theme.modern-editorial .me-cover", start: "top top", end: "bottom top", scrub: 0.8 } });
      gsap.utils.toArray<HTMLElement>(".wedding-theme.modern-editorial .me-gallery-item").slice(0, 6).forEach((item, index) => {
        gsap.fromTo(item, { y: index % 2 ? 18 : -18 }, { y: index % 2 ? -18 : 18, ease: "none", scrollTrigger: { trigger: ".wedding-theme.modern-editorial .me-gallery-editorial", start: "top bottom", end: "bottom top", scrub: 0.7 } });
      });
    });
    return () => mm.revert();
  });
  return null;
}
