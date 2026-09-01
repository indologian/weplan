# Market-Fit Visual & Motion Rules — Wedding Themes

> **Status:** NORMATIVE AMENDMENT untuk `05 - guide-undangan-pernikahan.md`.
>
> **Efektif:** 1 September 2026.
>
> **Tujuan:** memperbarui art direction, photography, clipping/mask, ornament/SVG, typography, gallery, responsive composition, dan motion grammar agar theme WePlan lebih dekat dengan kualitas serta ekspektasi pasar undangan digital Indonesia.
>
> **Precedence:** untuk aturan visual/motion yang bertentangan, dokumen ini **menggantikan** File 05 lama pada area yang disebut eksplisit di §2. Business rule, security, entitlement, state machine, media ownership, RSVP, payment, dan persistence tetap mengikuti File 01/02 dan **tidak** diubah oleh dokumen ini.
>
> **Arsitektur yang tetap berlaku:** Hybrid Responsive Canvas, R3 slot-based renderer, Canonical Theme Tokens, static theme-owned `next/font`, shared functional behavior, theme-owned `motion.tsx`, `useGSAP()`, `gsap.matchMedia()`, dan reduced-motion.

---

## 1. Basis Riset Pasar Indonesia — 1 September 2026

Riset dilakukan terhadap katalog, halaman fitur, dan demo publik dari:

1. https://indoinvite.com/
2. https://www.wevitation.com/
3. https://our-wedding.link/
4. https://www.webnikah.com/
5. https://www.linkundangan.com/
6. https://inveet.id/
7. https://katsudoto.id/

### 1.1 Temuan faktual yang dapat diverifikasi

- **Indoinvite** menawarkan ratusan theme, background music, gallery/video, countdown, love story, custom font/warna, susunan komponen, dan fitur **Auto Scroll**. Katalog mereka mencakup classic/elegant, floral, dark/gold, budaya/wayang, muslim, slide, simple, dan style lain yang sangat beragam.
- **Wevitation** menampilkan theme seperti BluBloom, Peppy, Wayang, Photovit Green/Black, Culture Javanese, Midnight Elegance, Elegant Rose, Timeless Snapshot, Visual Journey, Snap Photo, dan lain-lain. Wevitation juga menyebut musik dan animasi sebagai bagian dari pengalaman theme interaktif.
- **Our Wedding Link** secara eksplisit mempromosikan desain modern/responsif, background music, dan **gallery slideshow**.
- **WebNikah** memiliki 100+ theme dan katalog aktif yang mencakup Basic Premium, Monochrome, Dark Gold, Rose Red, Bloom Theme, Blossom Celebration, Chic Floral, Bloom Bliss, Floral Affair, serta theme budaya lain.
- **LinkUndangan** menawarkan template premium dan custom CSS/JS/HTML, yang menunjukkan bahwa presentasi theme tingkat lanjut merupakan ekspektasi pasar, bukan sekadar palette swap.
- **Inveet** menampilkan family visual Happy Peach, Elegant Green, Dark Flower, Pastel Floral, Modern Elegant, dan Sparkling Flowers, dengan gallery, background music, countdown, quote, map, dan media.
- **Katsudoto** menekankan fleksibilitas pemilihan desain, warna, font, foto, dan art direction yang mengikuti konsep pernikahan.

### 1.2 Batas interpretasi riset

Crawler publik tidak selalu mengekspos library atau source animation setiap provider. Karena itu dokumen ini **tidak mengklaim** semua provider memakai library/easing yang sama.

Rule motion di bawah adalah **sintesis market-fit** dari pola visual/interaksi yang konsisten pada undangan digital Indonesia: animated opening gate, scroll reveal, photo mask/zoom, decorative layering, gallery slideshow/sequence, background music, dan theme-specific ornamental motion.

### 1.3 Kesimpulan utama

Masalah utama rule lama bukan kurangnya disiplin, melainkan terlalu banyak menginterpretasikan “premium” sebagai “motion harus sangat minimal”. Untuk pasar undangan digital Indonesia, premium yang efektif lebih tepat dirumuskan sebagai:

```text
strong art direction
+ photography sebagai focal point
+ authored ornament layers
+ recognizable photo mask/frame
+ expressive typography
+ controlled but clearly visible motion
+ music / interaction continuity
+ mobile-first storytelling
```

Motion harus **terlihat dan terasa**, tetapi tetap mempunyai hierarchy, performance budget, accessibility, dan reduced-motion fallback.

---

## 2. Aturan Lama yang Disupersede

Dokumen ini secara eksplisit menggantikan interpretasi lama berikut.

### 2.1 File 05 §1.2 dan §25.2 — Desktop bukan lagi center-phone-only

Rule lama yang mengarahkan desktop ke wedding stage sekitar 440–480px **tidak lagi menjadi default kanonik**.

Gunakan Hybrid Responsive Canvas:

```text
Mobile core        : 320–430px portrait experience
Readable core      : kira-kira 360–560px sesuai section
Medium composition : sampai ±720–900px
Desktop breakout   : sampai ±1100–1280px bila art direction membutuhkannya
```

Desktop tidak boleh sekadar menjadi preview ponsel di tengah layar.

Theme boleh memakai split photo/text, sticky visual column, oversized foreground ornament, asymmetric wide gallery, architectural side framing, cinematic full-bleed image, dan narrow readable copy di dalam wide visual composition.

Paragraph tetap constrained; visual boleh breakout.

### 2.2 File 05 §3 — motion satu-line terlalu lemah

Definisi singkat seperti `clip reveal + restrained fade` atau `subtle sway pada 1–2 ornament` bukan lagi spesifikasi lengkap.

Setiap launch theme wajib memiliki **motion choreography map per section**, minimal untuk:

1. access gate / cover;
2. couple/photo reveal;
3. event/countdown;
4. story atau gallery;
5. closing echo.

### 2.3 File 05 §15.4 — carousel tidak harus hanya cross-fade

Gallery boleh menggunakan cross-fade, horizontal slide, swipeable carousel, snap sequence, atau masked slide transition selama gerak tidak agresif dan tidak mengambil alih scroll page.

Auto-advance hanya boleh bila lambat, pause-able, berhenti saat section offscreen/document hidden, dan disabled pada reduced-motion.

### 2.4 File 05 §24 — Motion System diperluas

“Restrained” bukan sinonim dari “hampir statis”. Key section harus mempunyai motion yang cukup terbaca tanpa menjadi gimmick.

### 2.5 File 05 §29.3 — cultural motion bukan selalu subtle

Cultural theme boleh mempunyai **ceremonial hero choreography yang kuat**, misalnya gunungan membuka, architectural frame reveal, atau symmetrical motif entrance. Body section tetap lebih tenang.

### 2.6 File 05 §31 — PREMIUM/VIP

Premium/VIP tidak dinilai hanya dari jumlah effect. Namun custom mask, multi-layer ornament, authored SVG/raster, gallery choreography, dan theme-specific motion sekarang merupakan **quality expectation**, bukan optional polish yang mudah dihapus.

### 2.7 File 05 §35 — particles dan ambient motion

Low-density petals, sparkle, dust, star/glint, atau botanical ambient motion **boleh digunakan** bila sesuai art direction.

Tetap dilarang: density tinggi, menutupi text/wajah/CTA, loop berat offscreen, dan particle yang menjadi identitas semua theme.

### 2.8 Auto Scroll

Pasar menggunakan auto-scroll, tetapi WePlan **tidak menjadikannya default theme behavior**. Jika kelak diadopsi, harus user-initiated dan dapat pause/stop. Jangan mengaktifkannya otomatis saat invitation dibuka.

---

## 3. Market-Fit Visual Grammar Wajib

Setiap theme production harus dapat dikenali dari screenshot **dan** dari rekaman scroll tanpa melihat nama theme.

Theme harus berbeda pada mayoritas dimensi: cover silhouette, photo framing/mask, typography hierarchy, ornament family, divider/rhythm, couple composition, event composition, story/gallery grammar, motion grammar, dan closing composition.

### 3.1 Tiga depth layer sebagai baseline theme dekoratif

```text
BACKGROUND
texture / landscape / pattern / large faint SVG

MIDGROUND
photo / main content / architectural frame

FOREGROUND
flower / leaf / gunungan / foil line / decorative frame edge
```

Tidak wajib pada setiap section. Cover, couple, story/gallery hero, dan closing adalah kandidat utama.

### 3.2 Ornament harus menjadi composition asset

Dilarang menyebut theme “floral”, “Javanese”, atau “luxury” jika ornament hanya berupa icon kecil di atas heading.

Ornament harus mempengaruhi silhouette, framing, negative space, photo mask, depth, atau section transition.

---

## 4. Asset Selection — SVG vs Raster vs CSS

### 4.1 SVG

Gunakan untuk botanical line art, monogram, geometric frame, arabesque, line flourish, gunungan/wayang silhouette, batik geometry sederhana, architectural outline, crop marks, foil line/orbit, divider, dan geometric/vector mask.

### 4.2 WebP/AVIF/PNG transparan

Gunakan untuk watercolor flowers, painted bouquet, textured petals, detailed cultural painting, paper texture, grain, realistic foil texture, dan complex brush decoration.

Jangan menggambar watercolor kompleks memakai puluhan radial-gradient CSS yang terlihat seperti blob.

### 4.3 CSS

Gunakan untuk simple rule, geometric block, shadow/depth, solid gradient, subtle paper lighting, clip-path sederhana, mask positioning, dan micro hover state.

### 4.4 Asset anti-pattern

Dilarang random free SVG tanpa visual system, stock icon sebagai hero ornament, ornament raster beresolusi rendah, asset budaya tanpa research note, dan satu floral asset yang diulang identik di semua section.

### 4.5 Theme-owned assets

Asset art direction berada di theme folder dan memiliki source/license note bila berasal dari pihak ketiga.

---

## 5. Photography & Clipping Contract v2

Foto adalah material desain utama.

### 5.1 Primary photo grammar

Maksimal 2 treatment utama per theme:

```text
Modern Editorial
- editorial rectangle / full-bleed crop
- contact sheet / offset crop

Romantic Floral
- arch / oval / organic mask
- floral foreground overlap

Javanese Heritage
- carved architectural frame
- formal portrait + gunungan/gebyok framing

Luxury Midnight
- cinematic full bleed
- oval / tall fashion portrait + fine metallic frame
```

### 5.2 Clipping/masking

Boleh menggunakan local `overflow: hidden`, `border-radius`, `clip-path`, CSS `mask-image`, SVG `<clipPath>`/`<mask>`, dan layered foreground assets.

Whole-page overflow masking tidak boleh dipakai untuk menyembunyikan layout bug.

### 5.3 Focal point

Semua crop wajib menghormati canonical `focus_x/focus_y`.

### 5.4 Face-safe zone

Uji close-up, half-body, wajah kiri/kanan, dan couple hero. Foreground ornament tidak boleh memotong mata/wajah.

### 5.5 Photo reveal

Photography-led theme sebaiknya memiliki setidaknya satu dari: clip reveal, mask wipe, scale `1.03–1.08 → 1`, directional reveal, layered parallax, opacity+scale, atau slideshow transition.

Jangan hanya `fade-up` wrapper dan menyebutnya photo choreography.

---

## 6. Typography Contract v2

Maksimal dua active font families per theme tetap berlaku.

### 6.1 Role

`DISPLAY` untuk couple name/section title/hero phrase. `BODY` untuk paragraph, parent names, address, RSVP, gift, dan metadata penting.

### 6.2 Script display

Theme floral/classic boleh memakai calligraphic/script display untuk nama pasangan bila short-copy only, body tetap readable, long-name fallback tersedia, dan tidak dipakai pada alamat/event/form/nav/account number.

### 6.3 Hierarchy

```text
micro metadata     : 10–12px
body               : 14–16px
functional label   : 13–16px
section title      : 28–46px
couple name        : 44–72px
hero display       : 48–88px bila aman
```

Desktop/breakout boleh lebih besar.

### 6.4 Launch core grammar

- **Modern:** editorial serif + clean grotesk, large scale contrast, tracked uppercase metadata.
- **Floral:** romantic serif/calligraphic display + readable body; section title tidak semuanya script.
- **Javanese:** formal serif + clean body; hindari pseudo-Asian novelty font.
- **Luxury:** high-contrast fashion serif + geometric/clean sans; metallic hanya accent.

---

## 7. Motion System v2 — Wajib Lebih Hidup

GSAP tetap engine choreography kompleks; CSS untuk micro/ambient effect.

### 7.1 Lima kategori

```text
A. ENTRY
fade / translate / stagger / line reveal

B. PHOTO
mask / clip / zoom / parallax / slideshow

C. ORNAMENT
sway / float / rotate-small / parallax / stroke draw

D. SECTION TRANSITION
foreground crossing / divider draw / background shift

E. AMBIENT
petals / sparkles / dust / foil shimmer
```

Launch core theme tidak boleh hanya memiliki kategori A.

### 7.2 Timing baseline

```text
section reveal     : 0.55–0.95s
hero major reveal  : 0.8–1.4s
cinematic image    : 1.2–2.2s
child stagger      : 0.06–0.16s
small line draw    : 0.5–1.2s
```

### 7.3 Amplitude baseline

```text
translate reveal   : 16–48px
image scale        : 1.03–1.08 → 1
botanical sway     : ±2–5deg
parallax           : kecil, relatif terhadap frame
```

### 7.4 Continuous ambient

Usahakan maksimal sekitar 1–2 continuous decorative motions yang terlihat per viewport. Pause ketika offscreen, document hidden, atau reduced-motion.

### 7.5 Section choreography

```text
Cover    → mask + text stagger
Opening  → opacity + line draw
Couple   → portrait clip reveal + names
Events   → date/countdown sequence
Story    → chapter reveal
Gallery  → image stagger / carousel
Gift     → simple reveal
Closing  → echo cover motif
```

### 7.6 Scroll-linked

Boleh small parallax, layered depth, sticky narrative, image-progress reveal. Dilarang scroll-jacking.

### 7.7 SVG motion

Gunakan stroke/path/clip/mask/transform untuk monogram, floral line-art, border, gunungan outline, architecture, dan luxury orbit. Plugin berbayar tidak diwajibkan.

### 7.8 Low-density ambient accents

- Floral: 3–8 petal/leaf accent elements total pada hero/interlude sebagai baseline awal.
- Luxury: low-density sparkle/glint atau foil light.
- Heritage: motion texture/debu hanya bila relevan; motif budaya bukan random particle.
- Modern: umumnya tanpa particle; gunakan type/photo/paper motion.

### 7.9 Reduced motion

`reduce` mematikan parallax, auto carousel, ambient loop, particle, dan kinetic mask dependency. Content harus langsung visible; opacity-only sangat singkat atau tanpa transition diperbolehkan.

---

## 8. Cover / Access Gate v2

Cover harus terasa seperti **scene**, bukan card SaaS.

Layer ideal:

```text
backdrop
+ hero photo / main illustration
+ background ornament
+ foreground ornament/frame
+ couple names
+ date
+ recipient
+ Buka Undangan CTA
+ optional scroll/music cue
```

Recommended choreography:

```text
CTA tap
→ foreground/frame move/open/fade
→ hero photo mask/zoom
→ name/date stagger
→ main invitation interactive
→ request audio playback
```

Jangan menahan user dengan intro panjang yang tidak dapat dilewati.

---

## 9. Couple Section v2

Couple tidak boleh sekadar dua card identik.

Gunakan alternating portrait, stacked+ornament overlap, editorial spread, ceremonial symmetric portrait, atau overlapping photo/name treatment.

Photo entrance mengikuti archetype:

```text
Modern   → rectangular clip reveal
Floral   → arch/organic mask + flower overlap
Heritage → architectural frame reveal
Luxury   → tall/oval fashion frame + cinematic fade
```

Parent names/body tidak perlu motion kompleks.

---

## 10. Event & Countdown Motion

Gunakan heading reveal, date number pop/clip, countdown stagger, divider line draw, sequential event panel, dan location micro transition.

Countdown digit tidak perlu bounce setiap detik. Entrance animated; ticking stabil.

---

## 11. Story / Timeline Motion

Allowed: vertical line draw, alternating chapter reveal, photo mask, sticky chapter title, film-strip progression, atau theme ornament transition.

Motion mengikuti chronology; bukan random direction per card.

---

## 12. Gallery v2

### 12.1 Composition

Allowed: asymmetric grid, authored masonry-like CSS grid, collage, hero+thumbnails, slideshow, horizontal swipe carousel, film/contact sheet, framed portrait sequence.

### 12.2 Motion

Gunakan staggered image mask, cross-fade, horizontal slide, scale `1.03 → 1`, drag/swipe feedback, atau selected hero transition sesuai archetype.

### 12.3 Auto slideshow

Interval lambat, pause on interaction, stop offscreen/hidden, reduced-motion no auto-advance, manual control tetap tersedia.

### 12.4 Lightbox

Tetap shared primitive dengan keyboard, Escape, accessible labels, dan focus semantics.

---

## 13. Theme-Specific Rules — Launch Core

### 13.1 Modern Editorial — REVISED

Target: editorial wedding magazine yang photography-led dan kinetic, bukan corporate editorial landing page.

Required motion: cover photo mask, headline stagger, line/index reveal, couple photo clip, story chapter movement, gallery mask/carousel/photo sequence, small desktop parallax/paper depth. Tanpa floral particle.

### 13.2 Romantic Floral — REVISED

Target: layered romantic garden invitation yang hidup.

Use authored botanical SVG + watercolor transparent raster, arch/oval/organic masks, foreground floral overlaps. Required: flower-cluster entrance, portrait mask, botanical layer parallax, gentle sway, floral divider reveal, soft gallery slide/cross-fade. Low-density petals optional.

### 13.3 Javanese Heritage — REVISED

Target: ceremonial, culturally grounded, visually layered, bukan brown/gold cards.

Use gunungan, batik geometry, wayang silhouette bila valid, architectural/gebyok framing. Required: gunungan/architectural gate reveal, symmetric ornament entrance, selected stroke reveal, formal portrait mask, chapter-like transitions, closing motif recomposition.

### 13.4 Luxury Midnight — REVISED

Target: cinematic fashion invitation dengan material/foil depth.

Use full-bleed/tall portrait, oval/fine metallic frame, monogram/orbit. Required: dark-to-image mask reveal, slow controlled zoom, line/monogram draw, foil/light sweep, cinematic section clip/fade, gallery hero transition, closing monogram echo.

---

## 14. Functional Sections Tetap Lebih Tenang

RSVP, gift, map, navigation, dan form hanya memakai section entrance, heading/ornament reveal, button micro interaction, success transition, dan static ornament yang aman.

Dilarang moving form controls, QRIS di atas animated lighting, address parallax, atau navigation yang berpindah karena animation.

---

## 15. Music as Part of Visual Experience

Shared music behavior tetap satu controller. Theme memberi skin sesuai art direction. Saat playing, icon boleh rotate/pulse/equalizer-like state ringan. Reduced-motion menghilangkan dekorative movement tetapi status playing tetap jelas.

---

## 16. Responsive Composition v2

### Mobile
320–430px adalah primary storytelling surface. Visual hierarchy tetap kuat pada 320px; nama panjang wrap elegan.

### Tablet
Mulai split photo/text, wider mask, larger ornament frame, authored 2–3 column gallery.

### Desktop
Gunakan Hybrid Canvas. Visual stage boleh jauh lebih lebar dari 480px; readable text tetap constrained. Sticky visual, side ornament, landscape photo, asymmetric spread, dan deep background diperbolehkan.

Desktop phone-mockup-only bukan default.

---

## 17. Motion Performance Budget

Prefer `transform`, `opacity`, measured `clip-path/mask`, small `background-position`, dan simple SVG stroke.

Batch animation per section; hindari ScrollTrigger untuk setiap span. Continuous motion hanya decorative dan berhenti offscreen. Cleanup via `useGSAP()`; media/reduced conditions via `gsap.matchMedia()`.

Mobile boleh memakai choreography yang disederhanakan daripada desktop.

---

## 18. Updated Anti-Patterns

Dilarang:

- generic `fade-up` untuk seluruh theme;
- semua foto circle;
- dua symmetric couple cards pada semua theme;
- rounded event card pada semua theme;
- CSS blob dianggap floral illustration;
- tiny icon dianggap ornament system;
- semua section center aligned;
- page-wide clipping untuk menutupi overflow;
- focal point diabaikan;
- typography scale hampir seragam;
- script untuk paragraph/form;
- photography-led hero statis sementara hanya text yang bergerak;
- cultural theme = warna + satu icon;
- dense particle system;
- banyak endless loops;
- animation aktif saat document hidden;
- reduced-motion membuat content hilang;
- desktop premium dikunci 480px tanpa alasan.

---

## 19. Updated QA Gate — Visual & Motion

Theme belum selesai hanya karena build tidak error.

### Visual evidence
Screenshot minimal `393×852`, `768×1024`, `1440×900`; full regression mengikuti architecture plan.

Periksa cover silhouette, clipping, face safety, foreground layering, typography scale, event, gallery, closing, desktop breakout.

### Motion evidence
Wajib runtime observation untuk gate/cover, major scroll reveal, photo mask, event/countdown, gallery/story, closing, dan reduced-motion.

Source inspection saja tidak cukup.

### Motion diversity
FAIL bila semua key section memakai effect identik, theme hanya opacity+translateY everywhere, photo tidak punya choreography pada photography-led theme, atau ornament tidak terlibat pada ornament-led theme.

### Static/reduced
Theme tetap harus terlihat lengkap ketika animation disabled.

---

## 20. Implementation Consequence untuk Launch Core

`#3D/#3D.1` tetap valid untuk architecture, responsive foundation, reduced-motion, accessibility, dan R3 integration. Namun **visual/motion acceptance dibuka kembali** terhadap rule baru.

Urutan berikut:

```text
#3D.2 Modern Editorial Market-Fit Visual & Motion Polish
↓
#3E Luxury Midnight
↓
#3F Javanese Heritage
↓
#3G Romantic Floral
↓
#3H Cross-Theme Verification / Polish
```

#3E/#3F/#3G wajib memakai rule v2 sejak awal.

---

## 21. No Database Change

Rule refresh ini tidak membutuhkan migration, perubahan `themes`, `design_tokens`, `layout_config`, invitation DTO, atau entitlement.

Asset/mask/type/composition/motion tetap presentation concern.

---

## 22. Final Canonical Formula

```text
shared reliable behavior
+
theme-owned composition
+
strong photography
+
intentional clipping/masking
+
authored SVG/raster ornament layers
+
expressive but readable typography
+
visible theme-specific animation
+
mobile-first storytelling
+
hybrid desktop composition
+
reduced-motion + accessibility
+
performance discipline
```

**Visual premium bukan berarti statis.**

**Motion premium bukan berarti ramai.**

Target: undangan yang terasa seperti **desain pernikahan yang hidup**, bukan landing page SaaS yang diberi foto pasangan.
