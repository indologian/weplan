"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export function ThemeAnimator() {
  useGSAP(() => {
    // 1. General Staggered Reveal for Sections
    const sections = gsap.utils.toArray<HTMLElement>("section.modern-editorial");

    sections.forEach((section) => {
      const animatables = section.querySelectorAll(".me-animate");
      if (animatables.length > 0) {
        gsap.set(animatables, { 
          y: 60, 
          opacity: 0,
          clipPath: "inset(10% 0 0 0)",
        });

        ScrollTrigger.create({
          trigger: section,
          start: "top 85%", 
          animation: gsap.to(animatables, {
            y: 0,
            opacity: 1,
            clipPath: "inset(0% 0 0 0)",
            duration: 1.5,
            stagger: 0.2,
            ease: "expo.out",
          }),
          toggleActions: "play none none reverse", 
        });
      }
      
      // 2. Cover Ornament Parallax & Rotation
      const ornament = section.querySelector(".me-cover-ornament");
      if (ornament) {
        // Continuous slow rotation
        gsap.to(ornament, {
          rotation: 360,
          duration: 120,
          repeat: -1,
          ease: "none",
        });
        
        // Scroll Parallax
        gsap.to(ornament, {
          yPercent: 50,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }

      // 3. Cover Typography Parallax
      const coverContent = section.querySelector(".me-cover-content");
      if (coverContent) {
        gsap.to(coverContent, {
          yPercent: 30,
          opacity: 0,
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }
      
      // 4. Asymmetrical Gallery Parallax
      const galleryItems = section.querySelectorAll(".me-gallery-item");
      if (galleryItems.length > 0) {
        galleryItems.forEach((item, index) => {
          gsap.fromTo(item, 
            { y: index % 2 === 0 ? 30 : -30 },
            {
              y: index % 2 === 0 ? -30 : 30,
              ease: "none",
              scrollTrigger: {
                trigger: section,
                start: "top bottom",
                end: "bottom top",
                scrub: 1 // smooth scrubbing
              }
            }
          );
        });
      }

      // 5. Couple Photos Elegant Scale-in
      const couplePhotos = section.querySelectorAll(".me-person-photo-wrapper");
      if (couplePhotos.length > 0) {
        couplePhotos.forEach((photo) => {
          gsap.fromTo(photo,
            { scale: 0.9, filter: "grayscale(50%)" },
            {
              scale: 1,
              filter: "grayscale(0%)",
              duration: 1.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: photo,
                start: "top 80%",
                toggleActions: "play none none reverse",
              }
            }
          );
        });
      }
    });

  }, []);

  return null;
}
