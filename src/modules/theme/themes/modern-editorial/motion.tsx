"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, useGSAP);

export function ModernEditorialMotion() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const cover = gsap.timeline({ defaults: { ease: "power3.out" } });
      cover
        .from(".wedding-theme.modern-editorial .me-cover-frame", { xPercent: -18, duration: 0.65 }, 0)
        .from(".wedding-theme.modern-editorial .me-cover-photo-mask", { clipPath: "inset(0 100% 0 0)", duration: 1.05 }, 0.08)
        .from(".wedding-theme.modern-editorial .me-cover-photo-mask img", { scale: 1.14, duration: 1.25 }, 0.08)
        .from(".wedding-theme.modern-editorial .me-cover-title > span", { yPercent: 110, duration: 0.72, stagger: 0.08 }, 0.2)
        .from(".wedding-theme.modern-editorial .me-cover-meta, .wedding-theme.modern-editorial .me-kicker", { opacity: 0, y: 10, duration: 0.45, stagger: 0.07 }, 0.48)
        .from(".wedding-theme.modern-editorial .me-cover-secondary", { x: 24, opacity: 0, duration: 0.6 }, 0.48);
      gsap.utils.toArray<HTMLElement>(".wedding-theme.modern-editorial .me-section").forEach((section) => {
        const elements = section.querySelectorAll<HTMLElement>(".me-reveal");
        if (!elements.length || section.classList.contains("me-cover")) return;
        gsap.from(elements, { y: 24, opacity: 0, duration: 0.65, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: section, start: "top 82%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".wedding-theme.modern-editorial .me-person").forEach((person, index) => {
        gsap.from(person.querySelector(".me-person-photo-wrapper"), { clipPath: index ? "inset(0 0 0 100%)" : "inset(0 100% 0 0)", duration: 1, ease: "power3.out", scrollTrigger: { trigger: person, start: "top 82%", once: true } });
        gsap.from(person.querySelectorAll("h3, p, .me-person-index"), { x: index ? 20 : -20, opacity: 0, duration: 0.6, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: person, start: "top 78%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".wedding-theme.modern-editorial .me-story-article").forEach((article, index) => {
        gsap.from(article, { x: index % 2 ? 30 : -18, opacity: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: article, start: "top 86%", once: true } });
        gsap.from(article, { "--me-rule-scale": 0, duration: 0.8, ease: "power2.out", scrollTrigger: { trigger: article, start: "top 86%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".wedding-theme.modern-editorial .me-event-card").forEach((card) => {
        gsap.from(card.querySelector("h3"), { clipPath: "inset(0 0 100% 0)", y: 18, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: card, start: "top 84%", once: true } });
        gsap.from(card.querySelectorAll(".me-event-index, .me-event-date, .me-event-venue, .me-event-actions-wrap"), { opacity: 0, x: 14, duration: 0.5, stagger: 0.08, ease: "power2.out", scrollTrigger: { trigger: card, start: "top 80%", once: true } });
      });
      gsap.from(".wedding-theme.modern-editorial .me-gallery-hero", { clipPath: "inset(12% 0 12% 0)", opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".wedding-theme.modern-editorial .me-gallery", start: "top 78%", once: true } });
      gsap.from(".wedding-theme.modern-editorial .me-gallery-select", { x: 28, opacity: 0, duration: 0.55, stagger: 0.07, ease: "power2.out", scrollTrigger: { trigger: ".wedding-theme.modern-editorial .me-gallery-strip", start: "top 90%", once: true } });
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
