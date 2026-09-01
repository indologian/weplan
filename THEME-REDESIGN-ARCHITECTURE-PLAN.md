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
- **WebGL:** NOT REQUIRED. 3D WebGL is definitively unnecessary for achieving premium quality.
- **K2 Keyboard Correction:** Fixed controls (Nav/Music) are fully focusable but naturally ordered at the DOM's end. Manual `tabindex` is rejected; semantic DOM reordering is required.
- **T1/T4 Luxury Correction:** Theme CSS must explicitly propagate global `--theme-*` custom properties to support shared controls. Browser `color-scheme` must be explicitly handled by the theme, not forced to `light` globally.

# D. Current Architecture Summary
The current architecture relies on a centralized `createRenderer` which forces a strict 1-column vertical stacking rhythm. The global `InvitationShell` handles the outer layout constraint (max-width 480px). `designTokens` are merged into inline style `--theme-*` custom properties via `getThemeStyle`. However, themes often alias these properties internally (e.g., `--lm-bg`) without defining the canonical global values, causing shared controls (like RSVP) to fail back to global white defaults when database tokens are empty. Furthermore, motion is handled by a monolithic `ThemeAnimator` that fails to respect reduced motion.

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
**Reason:** A strict 480px frame feels restrictive for "Luxury" or "Editorial" desktop viewing, behaving like a phone emulator. Fully responsive text layouts are notoriously unreadable for wedding invitations (lines get too long). A Hybrid model constrains typography and reading flow to a central column (e.g., max 600px), but allows structural wrapper components (like Cover imagery, Gallery grids, and specific breakpoints) to break out full-bleed or utilize 50/50 sticky-split layouts on desktop.
**Tradeoff:** Moderate increase in layout complexity and QA compared to Fixed 480.
**Alternative:** Fixed 480px (lowest development cost, but sacrifices premium desktop perception).

# G. Renderer Composition Strategy
- **R1 - Fixed global order:** (Current) Safe, but visually repetitive.
- **R2 - Theme-authored composition manifest:** Flexible, but risks breaking required business boundaries (like placing RSVP before Cover).
- **R3 - Slot-based renderer:** The `createRenderer` shell enforces the business logic order (Cover → Couple → Events → RSVP) but allows themes to supply the *layout wrapper* in addition to the content, enabling asymmetric or sticky layouts without breaking data flow.
- **R4 - Section composition descriptors:** Over-engineered for 4 themes.

# H. Recommended Renderer Architecture
**Recommended:** R3 - Slot-based renderer.
Keep `createRenderer` as the SSoT for section sequence and business logic to guarantee product invariants. Allow themes to pass React components for each section, but upgrade the section containers to accept structural primitives (e.g., `Breakout`, `StickySplit`) rather than forcing everything into a standard `.theme-generic-section` 1-column wrapper.

# I. Responsibility Matrix
| Concern | Global (Platform) | Shared Primitive | Theme | DB Token |
| :--- | :---: | :---: | :---: | :---: |
| RSVP submission logic | X | | | |
| RSVP form shell | | X | | |
| Couple composition | | | X | |
| Base Font Family | | | X | X (Override) |
| Navigation routing | X | | | |
| Navigation skin | | X | | |
| Motion choreography | | | X | |
| Section order | X | | | |

# J. Canonical Theme Token System
The dependency graph must be strictly: **Canonical Token → Theme Alias (if needed) → Shared Primitive**.
Themes MUST declare canonical tokens at their root:
```css
.wedding-theme.luxury-midnight {
  --theme-bg: #0a0f1a;
  --theme-surface: #141b2d;
  --theme-text: #f5f0e8;
  --theme-muted: #a0a8b8;
  --theme-accent: #c9a84c;
  --theme-border: #2a3040;
}
```
*Never* rely on `--lm-bg: var(--theme-bg, #0a0f1a)` while leaving `--theme-bg` undefined, as shared primitives (`globals.css`) expect `--theme-bg` to exist. Database `designTokens` will simply override these via inline React styles on the shell.

# K. Color-Scheme Strategy
Remove `color-scheme: light;` from `.wedding-theme` in `globals.css`.
Themes must explicitly declare their mode:
```css
.wedding-theme.luxury-midnight {
  color-scheme: dark;
}
```
This solves the T4 root cause, ensuring browser-native forms (inputs, textareas, scrollbars) match the theme intent seamlessly.

# L. Shared Controls Strategy
Behavior is shared; Presentation relies on Canonical Tokens.
- **Navigation / RSVP / Music:** Built once in `primitives/`. Styled securely via `--theme-*` variables.
- **Theme Variant Hooks:** If a theme needs a vastly different layout for a shared control (e.g., docked bottom navigation vs floating pill), the shared primitive will expose a semantic prop (e.g., `variant="pill" | "dock"`), rather than duplicating the entire component per theme.

# M. Typography Architecture
Typography will be distinct per theme, managed via Next.js `next/font`.
- To avoid massive global font bundles, fonts must be loaded asynchronously or scoped strictly to the theme renderer.
- Utilize `--theme-font-display` and `--theme-font-body` CSS variables.
- Themes own weight, tracking, and leading in their respective CSS.

# N. Theme Font Directions
- **Modern Editorial:** High-contrast pairing. Strong Editorial Serif (e.g., Playfair Display) for display headers, neutral Grotesk (e.g., Inter) for body.
- **Romantic Floral:** Soft humanist. Warm Serif (e.g., Lora or Cormorant) for display, highly legible Sans for body. Restrained calligraphy for small accents, not primary headings.
- **Javanese Heritage:** Formal, tall Serif. Avoid stereotypical pseudo-Asian typefaces; prioritize cultural elegance (e.g., Crimson Pro or Cinzel) paired with clean body text.
- **Luxury Midnight:** Fashion-luxury. Extreme contrast Serif (e.g., Bodoni Moda) and wide-tracked geometric sans (e.g., Montserrat) for overlines/metadata.

# O. Layout Primitive Strategy
Extract reusable layout containers into `primitives/layout/` to replace generic `<section>` tags:
- `NarrowMeasure`: Constrains text to optimal reading width (max 600px).
- `Breakout`: Allows images/galleries to expand full-width on desktop.
- `StickySplit`: A desktop-only layout splitting the screen 50/50 (sticky visual left, scrolling text right). Mobile degrades to standard stack.

# P. Photography System
Raw media dimensions and focal points are governed by the database. Presentation (crop shape, arch mask, square grid, aspect ratio, borders) is strictly the responsibility of the Theme's CSS.

# Q. SVG / Ornament Architecture
Ornaments are **Theme-Owned Assets**.
Located in `themes/<name>/ornaments/`. They are not generic shared primitives. Use inline SVGs or CSS `mask-image` for performance, keeping DOM weight low.

# R. Motion Architecture
Motion must be explicitly choreographed per theme, removing the monolithic global `ThemeAnimator`.
- **CSS Transitions:** Used for all hover states and micro-interactions.
- **GSAP:** Exclusively used for scroll-linked narrative orchestration.
- **Implementation:** Themes will define motion in `themes/<name>/motion.tsx` utilizing `@gsap/react` `useGSAP()` for rock-solid unmount cleanup.

# S. Reduced Motion Architecture
Reduced motion compliance is an architectural mandate, not an afterthought.
All GSAP choreography must be wrapped in `gsap.matchMedia()` targeting `(prefers-reduced-motion: no-preference)`. Global CSS will act as a fallback safety net:
```css
@media (prefers-reduced-motion: reduce) {
  .wedding-theme * { animation: none !important; transition: none !important; }
}
```

# T. Spatial Effects Architecture
For Level C themes (Modern Editorial, Luxury Midnight):
- **Modern Editorial:** Relies on CSS negative margins for paper-like overlap, CSS parallax (`transform: translateZ` or ScrollTrigger), and sticky layouts to create 2D spatial depth.
- **Luxury Midnight:** Relies on subtle CSS lighting (`box-shadow`, radial gradients), foil reflections via animated background positions, and deep foreground/background layer separation.

# U. Performance Strategy
Primary design and QA environment is `393 × 852` (Mobile).
- Limit `ScrollTrigger` instances per page.
- Ensure hidden tabs do not burn CPU (GSAP pauses when `visibilitychange` is hidden).
- Restrict heavy blur/filters (especially backdrop-filter) to small surfaces like the navigation pill.

# V. Accessibility Strategy
- **K2 Keyboard Fix:** Reorder the DOM tree inside `createRenderer`. Move `<InvitationNavigation>` immediately after the access gate in the React tree so it is reached early via Tab, while using CSS `position: fixed` to place it visually at the bottom.
- Ensure high contrast for `:focus-visible` across both dark and light modes.
- Maintain strict heading hierarchy (H1 Cover, H2 Sections) independent of visual text scaling.

# W. Demo / Preview / Public Parity
The `WeddingRenderer` boundary must guarantee identical state. The Demo route must accurately fall back to the theme's authored canonical tokens when database `designTokens` are empty.

# X. Baseline Theme Role
`themes/_baseline/` serves as a functional reference implementation and testing harness. It proves the data flows correctly. It does NOT dictate visual composition for authored themes.

# Y. Target Folder Architecture
```text
themes/modern-editorial/
├── renderer.tsx
├── theme.css
├── motion.tsx
├── ornaments/
│   ├── arch-mask.tsx
│   └── ...
└── sections/ (optional, if file gets too large)
```

# Z. Modern Editorial Design Specification
- **Art Direction:** Contemporary, editorial, high-contrast, photography-led.
- **Tone:** Confident, modern, stylish.
- **Layout:** Asymmetric grids, controlled whitespace, sticky-split sections on desktop.
- **Typography:** Kinetic headings, extreme size contrasts.

# AA. Romantic Floral Design Specification
- **Art Direction:** Botanical, light, organic, refined.
- **Tone:** Soft, warm, intimate.
- **Layout:** Soft edges, overlapping imagery, flowing narrative.
- **Typography:** Legible humanist serif, very restrained calligraphy accents.

# AB. Javanese Heritage Design Specification
- **Art Direction:** Culturally grounded, formal, crafted, elegant.
- **Tone:** Respectful, ceremonial, timeless.
- **Layout:** Symmetrical foundations with elegant framing.
- **SVG:** Wayang silhouettes, gunungan framing, batik line progression. Avoid random pseudo-Asian clutter.

# AC. Luxury Midnight Design Specification
- **Art Direction:** Cinematic, dark fashion, controlled gold, materiality.
- **Tone:** Exclusive, dramatic, premium.
- **Layout:** Deep foreground/background separation, dramatic reveals.
- **Motion:** Foil lighting effects, slow cinematic fades.

# AD. Cross-Theme Section Differentiation Matrix
| Section | Modern Editorial | Romantic Floral | Javanese Heritage | Luxury Midnight |
| :--- | :--- | :--- | :--- | :--- |
| **Cover** | Asymmetric text overlap | Soft floral frame | Symmetrical Gunungan | Full-bleed cinematic dark |
| **Couple** | Staggered sticky scroll | Soft arch masks | Traditional border frames | Monogram focused |
| **Events** | Bento grid approach | Soft timeline | Formal list with gold dividers | Dark cards with foil accents |
| **Gallery** | Masonry / Editorial spread | Organic overlapping grid | Formal gallery with borders | High-contrast filmstrip |

# AE. Existing Asset KEEP / EVOLVE / REPLACE Matrix
| Asset | Decision | Reason |
| :--- | :--- | :--- |
| Modern leaf ornament | REPLACE | Too generic; needs sharp editorial shapes instead of leaves. |
| Romantic bloom | EVOLVE | Refine SVG paths for better performance and aesthetic quality. |
| Javanese crown/border | EVOLVE | Ensure strict cultural accuracy and dignity of motifs. |
| Luxury orbit | KEEP | Good baseline for 2D spatial depth and lighting. |

# AF. Risk Matrix
| Risk | Level | Mitigation |
| :--- | :---: | :--- |
| GSAP Memory Leaks | HIGH | Enforce `@gsap/react` `useGSAP()` for automatic unmount cleanup. |
| Responsive Complexity | MEDIUM | Use layout primitives (NarrowMeasure, Breakout) to constrain text while letting backgrounds expand. |
| CSS Scope Leakage | LOW | Strict enforcement of `.wedding-theme.<name>` class wrapping all theme CSS. |
| Demo/Public Divergence | LOW | Rely purely on Canonical Tokens as defaults; Demo supplies empty JSON. |

# AG. Database Impact
**NO.**
The proposed redesign architecture strictly utilizes existing `designTokens` and `layoutConfig` JSONB fields for overrides. Visual composition and art direction remain authored in the codebase renderer, honoring the separation of concerns.

# AH. Editor Impact
**Minimal.**
The editor remains a data-entry tool, not a free-form site builder. Existing color override functionality maps cleanly to the new Canonical Theme Tokens.

# AI. Migration Strategy
1. **Foundation:** Implement layout primitives, accessibility DOM reordering, and Canonical Token updates.
2. **Modern Editorial:** Redesign trailblazer (proves CSS spatial depth and GSAP cleanup).
3. **Luxury Midnight:** Redesign trailblazer (proves Dark Mode context and color-scheme).
4. **Javanese & Romantic:** Final redesigns leveraging the proven foundation.

# AJ. Future Work Packages
- `#3C` — Theme Foundation Architecture (Tokens, Layout Primitives, Accessibility)
- `#3D` — Modern Editorial Redesign
- `#3E` — Luxury Midnight Redesign
- `#3F` — Javanese Heritage Redesign
- `#3G` — Romantic Floral Redesign
- `#3H` — Cross-Theme Responsive / Performance Polish

# AK. Product Decision Gates

**D1 — Canvas strategy**
- **Recommendation:** Hybrid Responsive Canvas.
- **Reason:** Best balance of premium desktop experience and mobile readability.
- **Tradeoff:** Higher QA cost than fixed 480px.
- **Alternative:** Fixed 480px.

**D2 — Renderer composition flexibility**
- **Recommendation:** R3 - Slot-based renderer.
- **Reason:** Keeps business sequence secure (Global `createRenderer`) while allowing themes to dictate structural wrapper layouts.
- **Tradeoff:** slightly more verbose theme files.
- **Alternative:** Theme-authored array (risks breaking required flows).

**D3 — Theme-specific font strategy**
- **Recommendation:** `next/font` scoped per theme renderer.
- **Reason:** Prevents loading 8+ font families globally.
- **Tradeoff:** Setup complexity per theme.
- **Alternative:** Global font loading (hurts performance).

**D4 — Shared controls visual divergence**
- **Recommendation:** CSS-themed with optional semantic variants (`variant="pill"`).
- **Reason:** Prevents duplicating complex RSVP/Nav logic.
- **Tradeoff:** Limits extreme visual deviations for RSVP.
- **Alternative:** Completely distinct RSVP components per theme (maintenance nightmare).

**D5 — GSAP Motion choreography**
- **Recommendation:** Extracted to `themes/<name>/motion.tsx` with mandatory `matchMedia`.
- **Reason:** Solves reduced-motion bug and memory leaks.
- **Tradeoff:** Harder to abstract perfectly.
- **Alternative:** Keep generic `ThemeAnimator` (proven ineffective for distinct themes).

# AL. Final Architecture Recommendation
Transition to a **Hybrid Canvas, Slot-Based Renderer** architecture. Rely heavily on **Canonical Theme Tokens** (`--theme-bg`, etc.) combined with explicit `color-scheme` declarations to fix dark mode. Move scroll-linked choreography out of global space and into theme-specific GSAP files wrapped in strict `matchMedia` hooks for reduced motion compliance. Solve accessibility tab order by semantically hoisting `<InvitationNavigation>` in the React tree while retaining its fixed visual position.
