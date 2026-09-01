"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useInvitationExperience } from "@/modules/theme/primitives/invitation-experience";

gsap.registerPlugin(ScrollTrigger);

export function LuxuryMidnightMotion() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { phase } = useInvitationExperience();
  const experienceStarted = phase !== "closed";

  useGSAP(() => {
    if (!experienceStarted) return;

    const mm = gsap.matchMedia();

    // Standard motion (not reduced)
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // Cover Choreography
      const coverTl = gsap.timeline({
        defaults: { ease: "power3.out" },
      });
      
      coverTl.fromTo(
        ".lm-cover-media",
        { scale: 1.1, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.8 }
      )
      .fromTo(
        ".lm-cover-monogram",
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.2 },
        "-=1.2"
      )
      .fromTo(
        ".lm-cover-groom, .lm-cover-bride",
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.2, stagger: 0.15 },
        "-=1.0"
      )
      .fromTo(
        ".lm-cover-amp",
        { scale: 0.8, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 1.0 },
        "-=1.0"
      )
      .fromTo(
        ".lm-cover-line",
        { scaleX: 0, autoAlpha: 0 },
        { scaleX: 1, autoAlpha: 1, duration: 1.0 },
        "-=0.8"
      )
      .fromTo(
        ".lm-cover-subtitle",
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 1.0 },
        "-=0.8"
      );

      // Couple Section
      gsap.utils.toArray<HTMLElement>(".lm-person").forEach((el, index) => {
        const photo = el.querySelector(".lm-person-photo");
        const info = el.querySelector(".lm-person-info");
        const direction = index === 0 ? -1 : 1;
        
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
            once: true,
          }
        });
        
        if (photo) {
          tl.fromTo(photo, 
            { y: 50 * direction, autoAlpha: 0, scale: 1.05 },
            { y: 0, autoAlpha: 1, scale: 1, duration: 1.5, ease: "power3.out" }
          );
        }
        if (info) {
          tl.fromTo(info,
            { autoAlpha: 0, x: -30 * direction },
            { autoAlpha: 1, x: 0, duration: 1.2, ease: "power3.out" },
            "-=1.0"
          );
        }
      });
      
      // Events Section
      gsap.utils.toArray<HTMLElement>(".lm-event-card").forEach((card) => {
        gsap.fromTo(card,
          { y: 40, autoAlpha: 0 },
          { 
            y: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              once: true
            }
          }
        );
      });
      
      // Story Chapters
      gsap.utils.toArray<HTMLElement>(".lm-story-chapter").forEach((chapter) => {
        gsap.fromTo(chapter,
          { x: -30, autoAlpha: 0 },
          { 
            x: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out",
            scrollTrigger: {
              trigger: chapter,
              start: "top 85%",
              once: true
            }
          }
        );
      });
      
      // Gallery Hero
      gsap.fromTo(".lm-gallery-hero",
        { scale: 0.95, autoAlpha: 0 },
        { 
          scale: 1, autoAlpha: 1, duration: 1.5, ease: "power3.out",
          scrollTrigger: {
            trigger: ".lm-gallery",
            start: "top 75%",
            once: true
          }
        }
      );
      
      // Closing
      gsap.fromTo(".lm-closing-monogram",
        { scale: 0.8, autoAlpha: 0, rotation: -10 },
        {
          scale: 1, autoAlpha: 1, rotation: 0, duration: 1.5, ease: "power2.out",
          scrollTrigger: {
            trigger: ".lm-closing",
            start: "top 80%",
            once: true
          }
        }
      );
      
      gsap.fromTo(".lm-closing-names",
        { y: 30, autoAlpha: 0 },
        {
          y: 0, autoAlpha: 1, duration: 1.2, ease: "power3.out",
          scrollTrigger: {
            trigger: ".lm-closing",
            start: "top 80%",
            once: true
          }
        }
      );

      return () => {
        ScrollTrigger.getAll().forEach(t => t.kill());
      };
    });
    
  }, { scope: containerRef, dependencies: [experienceStarted] });

  return <div ref={containerRef} style={{ display: "none" }} aria-hidden="true" />;
}

