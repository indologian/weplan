# A. Status
COMPLETE

# B. Inputs Reviewed
- `THEME-AUDIT-3A-REAL-BROWSER-REPORT.md` (and AC. Corrective Root-Cause Addendum)
- `01 - arsitektur-dan-konvensi.md` (Business & Runtime Invariants)
- `03 - panduan-ui-ux.md` (Platform UI SSoT)
- `05 - guide-undangan-pernikahan.md` (Theme Art Direction SSoT)
- `src/modules/theme/` (Registry, Renderer, Primitives, Themes)
- `src/app/globals.css`
- `src/app/demo/[slug]/page.tsx`

# C. Confirmed Audit Conclusions
- **Design Levels:** Modern Editorial (C), Romantic Floral (B), Javanese Heritage (B), Luxury Midnight (C).
- **WebGL:** NOT JUSTIFIED FOR CURRENT REDESIGN SCOPE. (The lack of premium feel stems from CSS layout monotony, not a lack of 3D).
- **K2 Keyboard Correction:** Fixed controls (Nav/Music) are fully focusable but ordered at the DOM's end. This is a UX focus-order optimization, not a broken accessibility defect. Manual `tabindex` is NOT RECOMMENDED.
- **T1/T4 Luxury Correction:** Theme CSS must explicitly propagate global `--theme-*` custom properties to support shared controls. Browser `color-scheme` must be explicitly handled by the theme's CSS cascade layer, not forced to `light` globally.

# D. Current Architecture Summary
The current architecture relies on a centralized `createRenderer`. The global `InvitationShell` acts as a wrapper, but the 480px width constraint is actually owned by the outer routing boundaries (`src/app/(wedding)/[slug]/page.tsx`, `preview`, `demo`). `designTokens` are merged into inline style `--theme-*` custom properties. However, themes often alias these properties internally (e.g., `--lm-bg`) without defining the canonical global values, causing shared controls to fail back to global white defaults when database tokens are empty. Furthermore, motion is handled by a monolithic `ThemeAnimator` that fails to respect reduced motion.

# E. Canvas Strategy
| Criterion | Fixed 480 | Fully Responsive | Hybrid |
| :--- | :---: | :---: | :---: |
| Mobile UX | 10 | 9 | 10 |
| Desktop UX | 3 | 10 | 8 |
| Art-direction freedom | 4 | 10 | 8 |
| Responsive complexity | 2 (Low) | 9 (High) | 5 (Medium) |
| Motion complexity | 2 (Low) | 8 (High) | 6 (Medium) |
| QA cost | 2 (Low) | 9 (High) | 5 (Medium) |
| Maintainability | 9 | 4 | 7 |
| Accessibility | 9 | 8 | 9 |
| Performance | 9 | 6 | 8 |
| Theme differentiation | 4 | 9 | 8 |

# F. Recommended Canvas Strategy
**PRODUCT DECISION REQUIRED**
**Recommended:** Hybrid Responsive Canvas.
**Reason:** A strict 480px frame feels restrictive for "Luxury" or "Editorial" desktop viewing. Fully responsive text layouts are notoriously unreadable for wedding invitations (lines get too long). A Hybrid model allows:
- **Mobile:** Full viewport width.
- **Core reading content:** Constrained readable measure.
- **Selected sections:** May use medium / breakout / full compositions at larger breakpoints.
- **Desktop:** Not simply stretching paragraphs across the viewport, but using intentional negative space or sticky columns.
**Canvas Boundary Ownership:** This should be owned by a new `WeddingCanvas` route presentation boundary rather than the internal `InvitationShell` behavior component.

# G. Renderer Composition Strategy
- **R1 - Fixed global order:** Safe, but visually repetitive. (Currently incorrectly treats section order as a business invariant).
- **R2 - Theme-authored composition manifest:** Allows reordering, but risks missing required features.
- **R3 - Slot-based renderer:** The platform renderer provides shared behavior, data gating, and reusable interaction primitives, while the theme dictates composition.
- **R4 - Section composition descriptors:** Over-engineered for 4 themes.

# H. Recommended Renderer Architecture
**Recommended:** R3 - Slot-based renderer.
Section order is NOT a business invariant. Themes may reorder presentation sections where `05 - guide-undangan-pernikahan.md` permits it, provided they do not invent unavailable data, bypass entitlement, or alter RSVP/payment semantics. The value of R3 is shared behavior reuse, type safety, feature gating, and maintainability, while offering theme composition flexibility.
*Conceptual Example:*
```tsx
createRenderer({
  composition: ThemeComposition,
  shared: {
    RSVP,
    Navigation,
    Lightbox,
    EventActions
  }
})
```

# I. Responsibility Matrix
| Concern | Global (Platform) | Shared Primitive | Theme | Config / Override |
| :--- | :---: | :---: | :---: | :---: |
| RSVP submission logic | X | | | |
| RSVP form shell | | X | | |
| Couple composition | | | X | |
| Base Font Family | | | X | |
| Navigation routing | X | | | |
| Navigation skin | | X | | |
| Motion choreography | | | X | |
| Section order | | | X | |

*Note: Base Font Family is owned by the Theme Author/Admin. The owner/user MUST NOT freely override font families to protect the theme's art direction.*

# J. Canonical Theme Token System
The dependency graph must be strictly: **Canonical Token → Theme Alias (if needed) → Shared Primitive**.
Themes MUST declare canonical tokens at their root to support shared primitive controls:
```css
.wedding-theme.luxury-midnight {
  --theme-bg: #0a0f1a;
  --theme-surface: #141b2d;
  --theme-text: #f5f0e8;
  --theme-muted: #a0a8b8;
  --theme-accent: #c9a84c;
  --theme-accent-contrast: #0a0f1a;
  --theme-border: #2a3040;
}
```
Canonical defaults must work perfectly when there are no configuration overrides. 

**Configuration Ownership:**
1. **Theme Code Defaults:** The authored canonical CSS variables.
2. **Theme-Author/Admin Config:** (`design_tokens`, `layout_config`) Authorized configuration for the theme.
3. **Owner Presentation Override:** Only explicitly allowlisted invitation-level configuration (e.g., color overrides mapped to canonical tokens). `designTokens` are NOT generic unrestricted owner CSS overrides.

# K. Color-Scheme Strategy
Light themes → light color-scheme; Dark themes → dark color-scheme.
The future implementation must deliberately assign `color-scheme` at the correct root/cascade layer in the theme CSS (e.g., `.wedding-theme.luxury-midnight { color-scheme: dark; }`). Remove the hardcoded global `.wedding-theme { color-scheme: light; }` from `globals.css` to prevent overriding theme-specific modes.

# L. Shared Controls Strategy
Target: **Shared Behavior + Theme-Aware Presentation**.
Do not duplicate complex logic (like RSVP or Navigation) per theme. Use Canonical Tokens to style them. If a theme requires a radically different layout structure (e.g., pill vs. dock navigation), use semantic presentation variants (e.g., `variant="dock"`) on the shared primitive rather than rewriting the component.

# M. Typography Architecture
Typography is distinct per theme and defined statically via `next/font`.
- **Strategy:** Theme-specific static font definitions applied as CSS variables at the theme renderer root.
- **Performance:** Subsetting must be used. Weights must be explicitly limited. Ensure network verification of `next/font` preloading to prevent layout shift.
- **SSoT:** Follow File 03: Maximum 2 active font families per theme. Body text must never be a script font. Platform font remains Plus Jakarta Sans.

# N. Theme Font Directions
- **Modern Editorial:** High-contrast pairing. Strong Editorial Serif (e.g., Playfair Display) for display headers, neutral Grotesk (e.g., Inter) for body.
- **Romantic Floral:** Soft humanist. Warm Serif (e.g., Lora or Cormorant) for display, highly legible Sans for body. Restrained calligraphy for small accents only.
- **Javanese Heritage:** Formal, tall Serif. Avoid stereotypical pseudo-Asian typefaces; prioritize cultural elegance (e.g., Crimson Pro or Cinzel) paired with clean body text.
- **Luxury Midnight:** Fashion-luxury. Extreme contrast Serif (e.g., Bodoni Moda) and wide-tracked geometric sans (e.g., Montserrat) for overlines/metadata.

# O. Layout Primitive Strategy
Extract reusable layout containers as structural primitives (e.g., `NarrowMeasure`, `WideMeasure`, `Breakout`, `StickyStory`, `EditorialGrid`). These provide safe, responsive scaffolding for themes to compose sections without making everything a generic card.

# P. Photography System
Raw media dimensions and focal points are governed by the database. Presentation decisions (aspect ratio, cropping, frame shapes like arch/oval/square, layered media) are strictly the responsibility of the Theme CSS and composition.

# Q. SVG / Ornament Architecture
Ornaments are **Theme-Owned Assets**. Located in `themes/<name>/ornaments/`. They are not generic shared primitives. Use inline SVGs or CSS `mask-image` for performance.
*(Note: The current Romantic Bloom is implemented via CSS radial-gradients, not SVG. This will be replaced/evolved into a proper authored botanical SVG system).*

# R. Motion Architecture
Motion must be explicitly choreographed per theme, removing the monolithic global `ThemeAnimator`.
- **CSS Transitions:** Hover states and ambient micro-interactions.
- **GSAP:** Scroll-linked narrative orchestration.
- **Implementation:** Themes will define motion in `themes/<name>/motion.tsx`.
  - `useGSAP()`: Provides scoped React lifecycle integration and cleanup/revert handling on unmount. Note: animations still require correct authoring and verification.
  - `gsap.matchMedia()`: Exclusively handles media-condition-specific choreography, specifically enforcing `prefers-reduced-motion` and responsive animation breakpoints.

# S. Reduced Motion Architecture
Reduced motion compliance is mandatory.
All JS-driven animation (GSAP) must explicitly use `gsap.matchMedia()` to respect `(prefers-reduced-motion: no-preference)`. Global CSS reduced-motion rules act as a secondary safety net.

# T. Spatial Effects Architecture
For Level C themes (Modern Editorial, Luxury Midnight):
- **Modern Editorial:** Negative margins for paper overlap, CSS parallax (`transform: translateZ`), sticky layouts.
- **Luxury Midnight:** Subtle CSS lighting, foil reflections via animated background positions, deep layer separation.
(WebGL is not justified).

# U. Performance Strategy
- Mobile-first (393x852) primary environment.
- Limit simultaneous animations and ScrollTriggers.
- Avoid unnecessary blur/filter usage.
- Limit font families (max 2 per theme).
- Pause offscreen ambient work.
- Use `transform`/`opacity` over layout-triggering properties.

# V. Accessibility Strategy
- Maintain strict heading hierarchy (H1 Cover, H2 Sections) independent of visual text scaling.
- Focus visibility and touch targets remain shared platform responsibilities.
- **K2 Focus-Order Optimization:** Moving `<InvitationNavigation>` earlier in the React tree while keeping its visual `position: fixed` CSS is an **OPTIONAL / SHOULD** UX enhancement. The controls are already fully keyboard reachable. Manual `tabindex` is strictly rejected. This is not a mandatory accessibility foundation task.

# W. Demo / Preview / Public Parity
`/demo/[slug]`, `/preview/[id]`, and `/(wedding)/[slug]` MUST all render using the identical `WeddingRenderer` theme architecture. While their outer UI may differ (demo toolbar, preview publish controls), the theme behavior must not diverge. If Hybrid Canvas is approved, it must be applied consistently across all three boundaries.

# X. Baseline Theme Role
`themes/_baseline/` serves as a functional reference implementation and testing harness to prove data flows correctly. It does NOT silently dictate the visual composition of every authored theme.

# Y. Target Folder Architecture
```text
themes/modern-editorial/
├── renderer.tsx
├── theme.css
├── motion.tsx
├── ornaments/
│   └── ...
└── sections/
    ├── cover.tsx
    └── ...
```

# Z. Modern Editorial Design Specification
- **Art Direction:** Contemporary, editorial, high-contrast, photography-led.
- **Emotional tone:** Confident, modern, stylish.
- **Color philosophy:** High contrast neutral (e.g., stark white, deep charcoal), accentuating photography.
- **Typography direction:** Strong editorial serif paired with modern grotesk; extreme scale contrasts; asymmetric alignment.
- **Layout grammar:** Asymmetric grids, controlled whitespace, sticky-split sections on desktop.
- **Photography treatment:** Full-bleed edges contrasting with tightly cropped floating images.
- **SVG / ornament language:** Minimal abstract paper geometry or strong editorial rules.
- **Motion grammar:** Scroll-linked narrative, fast snappy reveals, kinetic typography.
- **Spatial depth:** Overlapping paper layers (CSS negative margins).
- **Section rhythm:** Unpredictable, dynamic pacing.
- **Mobile behavior:** Stacked editorial grid.
- **Tablet behavior:** Two-column introduction.
- **Desktop behavior:** Wide sticky-scroll spreads.
- **Reduced-motion behavior:** Cross-fades replace kinetic movement.
- **Shared-control treatment:** Minimal, thin-line pill navigation.

# AA. Romantic Floral Design Specification
- **Art Direction:** Botanical, light, organic, refined.
- **Emotional tone:** Soft, warm, intimate, romantic.
- **Color philosophy:** Soft pastels, warm whites, organic greens.
- **Typography direction:** Legible humanist serif, very restrained calligraphy accents.
- **Layout grammar:** Soft edges, overlapping imagery, flowing narrative, centered reading axes.
- **Photography treatment:** Arch masks, soft vignettes.
- **SVG / ornament language:** Authored botanical SVG illustration system (replacing CSS blobs).
- **Motion grammar:** Soft organic reveals, layered floral parallax, mask bloom.
- **Spatial depth:** Foreground floral overlapping background content.
- **Section rhythm:** Flowing, continuous narrative.
- **Mobile behavior:** Single column flowing text.
- **Tablet behavior:** Wider imagery with inset text.
- **Desktop behavior:** Expansive floral framing around a constrained core content column.
- **Reduced-motion behavior:** Immediate visibility, no parallax.
- **Shared-control treatment:** Soft pill with subtle drop shadows.

# AB. Javanese Heritage Design Specification
- **Art Direction:** Culturally grounded, formal, crafted, elegant.
- **Emotional tone:** Respectful, ceremonial, timeless, sacred.
- **Color philosophy:** Sogan palette, deep browns, brass, natural tones.
- **Typography direction:** Formal, tall Serif (e.g., Crimson Pro); clean body text.
- **Layout grammar:** Symmetrical foundations, elegant architectural framing, centered structure.
- **Photography treatment:** Traditional border frames, sepia/warm color grading.
- **SVG / ornament language:** Wayang-inspired silhouettes, gunungan framing, batik geometry.
- **Motion grammar:** Ceremonial pacing, slow motif reveals, chapter-like transitions.
- **Spatial depth:** Flat, print-like crafted depth (embossing illusion).
- **Section rhythm:** Distinct, formal chapters (Opening, Akad, Resepsi).
- **Mobile behavior:** Centered, motif-framed vertical scroll.
- **Tablet behavior:** Symmetrical wide framing.
- **Desktop behavior:** Large gunungan/gebyok side-framing.
- **Reduced-motion behavior:** Static formal print layout.
- **Shared-control treatment:** Dark/brass tinted pill with formal icons.

# AC. Luxury Midnight Design Specification
- **Art Direction:** Cinematic, dark fashion, controlled gold, materiality.
- **Emotional tone:** Exclusive, dramatic, premium, glamorous.
- **Color philosophy:** Deep midnight navy/black, stark white text, controlled gold foil.
- **Typography direction:** High-contrast fashion Serif (Bodoni), wide-tracked geometric sans (Montserrat).
- **Layout grammar:** Deep foreground/background separation, dramatic reveals, negative space.
- **Photography treatment:** Dramatic lighting, cinematic aspect ratios, dark overlays.
- **SVG / ornament language:** Monograms, foil lines, celestial/geometric orbits.
- **Motion grammar:** Foil lighting effects, slow cinematic fades, pointer-reactive highlights.
- **Spatial depth:** Material depth, foil reflection illusion.
- **Section rhythm:** Dramatic pauses, slow pacing.
- **Mobile behavior:** Dark, edge-to-edge cinematic scroll.
- **Tablet behavior:** Offset overlapping cards.
- **Desktop behavior:** Deep background images with floating content cards.
- **Reduced-motion behavior:** Fade-in only.
- **Shared-control treatment:** True dark-mode inherited controls, high-contrast borders.

# AD. Cross-Theme Section Differentiation Matrix
| Section | Modern Editorial | Romantic Floral | Javanese Heritage | Luxury Midnight |
| :--- | :--- | :--- | :--- | :--- |
| **Cover** | Asymmetric text overlap | Soft floral frame | Symmetrical Gunungan | Full-bleed cinematic dark |
| **Opening** | Kinetic typography | Flowing script accent | Formal greeting block | Slow fade-in quote |
| **Couple** | Staggered sticky scroll | Soft arch masks | Traditional border frames | Monogram focused |
| **Events** | Bento grid approach | Soft timeline | Formal list with gold dividers | Dark cards with foil accents |
| **Story** | Alternating editorial spread with sticky year marker | Flowing botanical chapter sequence | Ceremonial chapter progression with motif framing | Cinematic dark narrative with controlled reveal |
| **Gallery** | Masonry / Editorial spread | Organic overlapping grid | Formal gallery with borders | High-contrast filmstrip |
| **Video** | Full-bleed sharp edges | Soft masked edges | Framed like a painting | Cinematic widescreen |
| **RSVP** | Minimalist borders | Soft surface cards | Formal layout with brass accents | Deep dark cards with foil inputs |
| **Wishes** | Flowing ticker | Staggered masonry | Formal list | Elegant scrolling list |
| **Gift** | Asymmetric layout | Centered soft card | Traditional patterned card | Monogrammed minimal layout |
| **Closing** | Sharp editorial typography | Flourished ending | Formal thank you | Monogram fade-out |
| **Navigation** | Minimal, thin-line pill | Soft pill with drop shadows | Brass-tinted formal pill | True dark-mode pill |
| **Access Gate**| High-contrast minimal | Soft floral envelope | Traditional framed envelope | Dark VIP envelope |
| **Music Ctrl** | Sharp geometric button | Soft round button | Patterned button | Gold-accented button |

# AE. Existing Asset KEEP / EVOLVE / REPLACE Matrix
| Asset | Decision | Reason |
| :--- | :--- | :--- |
| Modern leaf ornament | REPLACE | Too generic; needs sharp editorial shapes instead of leaves. |
| Romantic CSS bloom | REPLACE | Replace CSS radial-gradients with an authored botanical SVG system. |
| Javanese crown/border | EVOLVE | Ensure strict cultural accuracy and dignity of motifs. |
| Luxury orbit | KEEP | Good baseline for 2D spatial depth and lighting. |

# AF. Risk Matrix
| Risk | Level | Mitigation |
| :--- | :---: | :--- |
| GSAP Memory Leaks | HIGH | Enforce `@gsap/react` `useGSAP()` for scoped context lifecycle handling. |
| Responsive Complexity | MEDIUM | Use layout primitives to constrain text while letting backgrounds expand. |
| CSS Scope Leakage | LOW | Strict enforcement of `.wedding-theme.<name>` class wrapping all theme CSS. |
| Demo/Public Divergence | LOW | Demo UI chrome is distinct, but the `WeddingRenderer` boundary remains strictly identical. |
| Font Bundle Growth | MEDIUM | Use `next/font` scoped only to the active theme renderer. |

# AG. Database Impact
**NO.**
The proposed redesign architecture strictly utilizes existing `designTokens` and `layoutConfig` JSONB fields for allowed overrides. Visual composition, section ordering, and art direction remain authored in the codebase renderer, honoring the separation of concerns.

# AH. Editor Impact
**Minimal.**
The editor remains a data-entry and controlled presentation editor. It is NOT a free-form theme builder.
**Theme Author / Admin May Own:**
- Font family
- Palette defaults
- Typography tokens
- Geometry
- Ornament system
- Photo treatment
- Composition
- Motion preset/grammar
- Renderer presentation configuration

**Invitation Owner Must NOT Freely Override:**
- `renderer_key`
- Font family
- Ornament family
- Photo mask
- Motion grammar
- Section composition/order
- Arbitrary CSS

**Owner-editable presentation is strictly limited to explicitly allowlisted overrides already supported by the schema.**

# AI. Migration Strategy
1. **Foundation:** Implement canvas/layout primitives, `next/font` architecture, color-scheme ownership, shared-control theming contract, motion/reduced-motion foundation, and Canonical Token updates. *(K2 Focus-Order optimization is an optional enhancement, not mandatory foundation).*
2. **Modern Editorial:** Redesign trailblazer (proves CSS spatial depth and GSAP cleanup).
3. **Luxury Midnight:** Redesign trailblazer (proves Dark Mode context and color-scheme).
4. **Javanese & Romantic:** Final redesigns leveraging the proven foundation.
5. **Cross-Theme Polish:** Final performance and responsiveness verification.

# AJ. Future Work Packages
- `#3C` — Theme Foundation Architecture (IMPLEMENTED)
- `#3D` — Modern Editorial Redesign (IMPLEMENTED / ACCEPTED)
- `#3D.1` — Corrective QA & Final Acceptance (COMPLETE)
- `#3D.2` - Modern Editorial Market-Fit Visual & Motion Polish (COMPLETE)
- `#3D.3` - Shared Invitation Opening Transition & Theme Motion Synchronization (COMPLETE)
- `#3D.3.1` - Opening Transition Corrective Acceptance (COMPLETE)
- #3D.3 - Shared Invitation Opening Transition & Theme Motion Synchronization (COMPLETE)
- #3D.3.1 - Opening Transition Corrective Acceptance (COMPLETE)
- `#3E` — Luxury Midnight Redesign (READY)
- `#3F` — Javanese Heritage Redesign
- `#3G` — Romantic Floral Redesign
- `#3H` — Cross-Theme Verification / Polish
*(K2 focus-order optimization can be addressed alongside #3H or as an optional enhancement).*

# AK. Product Decision Gates

**D1 — Canvas strategy**
- **APPROVED:** Hybrid Responsive Canvas.

**D2 — Renderer composition flexibility**
- **APPROVED:** R3 - Slot-based renderer.

**D3 — Theme-specific font strategy**
- **APPROVED:** `next/font` scoped per theme renderer with max 2 families.

**D4 — Shared controls visual divergence**
- **APPROVED:** CSS Canonical Tokens with optional semantic variants.

**D5 — GSAP Motion choreography**
- **APPROVED:** Extracted to `themes/<name>/motion.tsx` utilizing `useGSAP` and `matchMedia`.

**D6 — Javanese Heritage Cultural Art Direction**
- **APPROVED:** Option J3 — Hybrid.

**D7 — Luxury Spatial Intensity**
- **APPROVED:** Option L1 — Subtle.

# AL. Final Architecture Recommendation
Transition to a **Hybrid Canvas, Slot-Based Renderer** architecture where themes own composition but share behavior. Enforce **Canonical Theme Tokens** with explicit `color-scheme` declarations to fix dark mode propagation. Implement theme-specific GSAP files wrapped in strict `matchMedia` hooks for reduced motion compliance, utilizing `useGSAP` for cleanup. Opt for UX DOM-order improvements for fixed controls over manual tabindexes. Utilize `next/font` at the theme root to secure bespoke typography safely.

**Status Pipeline:**
- D1–D7 → APPROVED
- #3C → IMPLEMENTED
- #3C.1 → VALIDATED
- #3C.2 → COMPLETE
- #3D → IMPLEMENTED / ACCEPTED
- #3D.1 → COMPLETE
- Theme Rule Refresh 2026-09-01 → ACTIVE (`05A - market-fit-visual-motion-rules.md`)
- #3D.2   COMPLETE
- #3D.3   COMPLETE
- #3D.3.1   COMPLETE
- #3E → READY

# AM. #3B.1 & #3B.2 Corrections Applied
- **Section-order ownership:** Corrected to explicitly allow themes to alter composition; it is not a business invariant.
- **K2 focus order:** Reclassified as a UX DOM-order enhancement (OPTIONAL/SHOULD), not a broken accessibility defect. Removed from mandatory foundation blockers.
- **480px ownership:** Reassigned from `InvitationShell` to outer routing/canvas boundaries.
- **next/font wording:** Clarified as static, build-time font integration.
- **Config Ownership:** Explicitly demarcated Theme Author/Admin config (fonts, grammar, layout) vs Owner-editable presentation (allowlisted color overrides only).
- **Romantic bloom:** Corrected origin from SVG to CSS radial-gradients.
- **WebGL wording:** Limited to "Not justified for current redesign scope", and completely removed from D7 (L3 is now Cinematic CSS/DOM + GSAP).
- **Motion Responsibilities:** Clarified that `matchMedia` handles responsive/reduced-motion conditions, while `useGSAP` provides React lifecycle integration and context cleanup.
- **Canonical Tokens:** Added `--theme-accent-contrast` to complete the contract.


# AN. Market-Fit Wedding Theme Rule Refresh — 1 September 2026

User feedback after #3D/#3D.1 identified that the accepted Modern Editorial implementation is technically sound but visually/motion-wise too restrained for the target Indonesian wedding-invitation market.

The normative visual/motion amendment is:

`05A - market-fit-visual-motion-rules.md`

It is based on refreshed study of Indoinvite, Wevitation, Our Wedding Link, WebNikah, LinkUndangan, Inveet, and Katsudoto.

Architecture decisions D1–D7 remain valid. The refresh changes the **quality bar** for photography, clipping/masking, ornament layering, typography hierarchy, gallery behavior, and theme-specific motion. It does not change authorization, persistence, entitlement, payment, RSVP semantics, or database design.

Modern Editorial therefore keeps its architecture acceptance from #3D/#3D.1 but requires #3D.2 visual/motion polish before the redesign program advances to #3E.





