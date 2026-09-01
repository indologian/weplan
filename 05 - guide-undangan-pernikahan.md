# Panduan Tema Undangan Pernikahan

> **Peran dokumen:** kontrak visual, composition system, dan implementasi renderer wedding theme.
>
> **SINGLE SOURCE OF TRUTH teknis/bisnis:** `01 - arsitektur-dan-konvensi.md`.
> **SINGLE SOURCE OF TRUTH renderer/theme visual:** **File 05 ini**.
>
> **Normative market-fit amendment — 1 September 2026:** `05A - market-fit-visual-motion-rules.md`. Untuk visual/motion, photography/mask, SVG/raster, gallery, dan responsive composition yang bertentangan, File 05A memiliki precedence sampai aturan ini dikonsolidasikan kembali ke File 05.
> **UI/UX platform:** `03 - panduan-ui-ux.md`.
> **Security:** `02 - panduan-keamanan.md`.
>
> Theme hanya menerima data/capability yang sudah diputuskan domain layer. Dokumen ini **tidak mengulang** harga, tier rank, entitlement state machine, PIN threshold, signed-URL lifetime, RSVP authorization matrix, autosave, atau payment rules.
>
> **Basis riset pasar Indonesia:** baseline 25 Agustus 2026 diperbarui pada **1 September 2026** melalui File 05A dengan studi Indoinvite, Wevitation, Our Wedding Link, WebNikah, LinkUndangan, Inveet, dan Katsudoto. Temuan pasar dipakai sebagai **input desain**, bukan sebagai sumber business rule aplikasi.
>
> **Arah market-fit:** katalog harus mengutamakan Modern/Editorial, Floral/Botanical, Minimalist, Adat/Heritage Nusantara, Royal/Luxury, Islamic, dan beberapa niche visual yang benar-benar berbeda. Banyak theme boleh memakai feature skeleton yang sama, tetapi **tidak boleh terasa hanya sebagai pergantian warna/background**.
>
> **Zero-cost/simplicity:** renderer tidak boleh membutuhkan paid asset/API/library sebagai dependency inti MVP. Maksimal dua font family aktif per theme. Asset dekoratif wajib mempunyai lisensi yang jelas.

---

## 1. Prinsip Desain Theme System

### 1.1 Shared Product Skeleton, Distinct Visual Grammar

Riset pasar menunjukkan fitur inti undangan Indonesia sangat konvergen: cover, pasangan, acara, countdown, map, love story, galeri, RSVP, ucapan, gift, musik, dan penutup berulang di banyak provider. Keunggulan visual bukan berasal dari membuat business flow berbeda untuk setiap theme, melainkan dari **art direction**.

Karena itu:

```text
shared domain data + shared interaction primitive
                    ↓
             ThemeVisualSpec
                    ↓
     composition + typography + ornament
       + photo treatment + motion grammar
                    ↓
               renderer theme
```

Theme yang benar-benar berbeda minimal harus mengubah beberapa dimensi berikut:

1. **cover composition**;
2. **couple composition**;
3. **event composition**;
4. **gallery composition**;
5. **ornament vocabulary**;
6. **typography hierarchy**;
7. **photo treatment/mask**;
8. **section transition rhythm**;
9. **motion choreography**.

Mengganti hanya palette, background image, atau satu ornament **bukan theme baru**; itu hanya variant.

### 1.2 Mobile-First Interactive Poster + Hybrid Desktop Canvas

Undangan tetap diperlakukan sebagai **interactive vertical poster** dengan portrait mobile sebagai primary storytelling surface, tetapi desktop **tidak** dikunci ke simulasi ponsel 440–480px.

Baseline composition mengikuti Hybrid Responsive Canvas:

```text
primary mobile      : 320–430px portrait
readable core       : kira-kira 360–560px sesuai section
medium composition  : sampai ±720–900px
desktop breakout    : sampai ±1100–1280px bila art direction membutuhkannya
```

Paragraph tetap constrained. Foto, ornament, gallery, sticky visual, dan cinematic section boleh breakout secara intentional. Detail normatif mengikuti File 05A §2.1 dan §16.

### 1.3 Premium = Art Direction, Bukan Keramaian

Kualitas visual tinggi berasal dari:

- composition yang matang;
- typography hierarchy yang kuat;
- photography treatment yang konsisten;
- ornament yang selektif;
- whitespace;
- motion timing;
- cultural authenticity bila theme adat;
- performa dan keterbacaan.

Label premium **bukan alasan** untuk menambah particles, blur, shadow, script font, ornament, atau animasi tanpa hierarchy.

### 1.4 Theme Spec Bukan Form Builder Owner

`ThemeVisualSpec`, `design_tokens`, `layout_config`, ornament set, typography, photo mask, motion grammar, section divider, dan composition adalah **authoring surface developer/admin/theme designer**. Mereka tidak otomatis menjadi field pada wizard owner.

Owner hanya menerima presentation override yang sudah di-whitelist oleh theme/domain contract File 01, baseline: section visibility optional dan optional accent override bila theme mengizinkan. **Focal point foto bukan theme override**; editor boleh menyediakan kontrol focus/crop preview, tetapi canonical focus disimpan pada `media_assets.focus_x/focus_y` melalui media contract File 01 sehingga tidak berubah saat theme berganti. Theme dapat mengunci palette agar color picker tidak muncul. Jangan membuat editor bebas yang memungkinkan owner memilih arbitrary font, ornament, SVG, mask, animation preset, renderer layout, atau CSS token.

---

## 2. Contract Struktur Undangan

Undangan menggunakan **single-page scrolling experience** dengan section vertikal. Renderer tetap server-compatible sejauh mungkin; client island hanya digunakan untuk interaksi yang membutuhkan browser API, motion, atau audio.

Urutan berikut adalah **default reference**. Theme composition boleh mengubah presentation order bila dependency semantik tetap logis: access gate/cover tetap entry point, closing tetap akhir, venue tetap terkait event/location, dan reordering tidak mengubah domain/readiness/authorization.

```text
Cover / Access Gate
↓
Opening / Quote / Verse
↓
Couple
↓
Event + Countdown
↓
Venue / Navigation
↓
Love Story
↓
Gallery
↓
Video / Live Streaming (opsional)
↓
RSVP
↓
Wishes / Guestbook
↓
Digital Gift
↓
Optional cultural/religious section
↓
Closing
```

Section yang didukung:

- **PIN Gate:** theme hanya merender gate/state dari server; security policy mengikuti File 01/02.
- **Cover/Hero:** gesture **Buka Undangan** menjadi entry point experience dan gesture pertama untuk audio.
- **Opening/Quote:** copy pendek, doa, ayat, atau editorial opening.
- **Couple:** foto, nama, orang tua, optional social identity yang aman.
- **Event:** event DTO dari server; tidak membuat state/event source-of-truth kedua.
- **Countdown:** visual-only projection dari event instant kanonik.
- **Venue/Map:** alamat dan navigation CTA selalu tersedia; functional embedded map tetap dapat diakses ketika data/provider memungkinkan, sedangkan frame/placement/presentation menyesuaikan theme.
- **Love Story:** chronology/storytelling dengan foto opsional.
- **Gallery:** render final media dari DTO.
- **Video/Live:** lazy dan hanya muncul bila capability/data efektif tersedia.
- **RSVP/Wishes:** presentation layer di atas contract server.
- **Digital Gift:** rekening/QRIS/gift delivery yang sudah diizinkan domain layer.
- **Optional cultural/religious section:** pada MVP **tidak menambah form/schema domain baru**. Section ini hanya boleh menjadi visual/interlude/static theme copy atau projection dari data invitation yang sudah ada. Jika produk kelak membutuhkan content editable khusus adat/agama, tambahkan domain/schema secara eksplisit di File 01 terlebih dahulu.
- **Closing:** thank-you, signature/couple names, dan watermark/credit berdasarkan effective data.

**Feature/data boundary:** File 05 tidak menciptakan schema tersembunyi untuk fitur di atas. Couple portrait/social link, love-story photo, QRIS, background audio, video/live embed, dan physical-gift content hanya boleh dirender dari canonical JSONB/media contract File 01 §4.4/§4.15. Jika DTO/capability tidak menyediakannya, section/element tersebut tidak muncul. Renderer tidak boleh menyimpan data alternatif di theme config.

---

## 3. Archetype Katalog

Roadmap katalog jangka dekat tidak mengejar jumlah sebanyak mungkin. **Target launch awal adalah 4 archetype yang QA-nya benar-benar tuntas**, sedangkan 8 archetype lain pada bagian ini adalah wave berikutnya. Keseluruhan 12 archetype tetap menjadi portfolio/art-direction plan File 05, bukan schema invariant File 01; row production tetap ditentukan melalui tabel `themes` dan release readiness/QA.

### 3.1 Modern Editorial Ivory

**Karakter:** clean, quiet luxury, whitespace tinggi, foto besar, serif × sans.

```text
Palette     : ivory / paper / charcoal / muted champagne
Photo       : 3:4 atau 4:5 portrait, large editorial crop
Ornament    : thin rule, tiny monogram, minimal line
Typography  : high-contrast serif display + neutral sans body
Motion      : clip reveal + restrained fade
Radius      : 0–8px
```

### 3.2 Editorial Dark

**Karakter:** fashion editorial malam, photography-led, kontras tinggi.

```text
Palette     : near-black / warm white / muted metallic accent
Photo       : full bleed + controlled overlay
Ornament    : geometric rule / monogram
Typography  : serif display + uppercase tracking
Motion      : slow image reveal, mask, subtle zoom
```

### 3.3 Minimalist Botanical

**Karakter:** airy, natural, sage, line botanical.

```text
Palette     : off-white / sage / olive / taupe
Ornament    : line-art leaf/eucalyptus SVG
Photo       : soft arch/rounded-rect
Typography  : modern serif + readable sans
Motion      : soft reveal + very light botanical sway
```

### 3.4 Romantic Floral Watercolor

**Karakter:** romantic Indonesia-market familiar, tetapi harus dikendalikan agar tidak terlihat template lama.

```text
Palette     : blush / dusty rose / soft peach / cream / sage
Ornament    : watercolor raster + optional vector line accent
Photo       : organic/arch mask
Typography  : serif + script hanya nama/decorative heading
Motion      : subtle sway/parallax pada 1–2 ornament utama
```

### 3.5 Luxury Midnight

**Karakter:** formal, cinematic, dark premium.

```text
Palette     : midnight navy / black / ivory / antique gold
Ornament    : arch frame / fine metallic line / monogram
Photo       : portrait framed atau full bleed
Typography  : thin high-contrast serif
Motion      : line draw + cinematic fade + restrained parallax
```

### 3.6 Emerald Islamic

**Karakter:** elegant Islamic geometry, bukan sekadar menambah crescent icon.

```text
Palette     : emerald / deep green / ivory / muted gold
Ornament    : mihrab/arch, geometric arabesque, fine star pattern
Photo       : arch portrait atau no-photo variant
Typography  : refined serif + neutral sans; Arabic text punya dedicated readable face bila diperlukan
Motion      : symmetrical reveal / drawSVG geometry
```

### 3.7 Javanese Heritage

**Karakter:** modern heritage Jawa.

```text
Palette     : sogan / warm cream / charcoal / antique gold
Ornament    : gunungan line-art, batik geometry, architectural silhouette
Photo       : formal portrait, carved-frame/arch treatment
Typography  : restrained serif/display; bukan decorative font pada seluruh body
Motion      : symmetrical ornament reveal, subtle depth
```

### 3.8 Minang Suntiang

**Karakter:** formal Minangkabau dengan hierarchy visual dari suntiang/rumah gadang/songket.

```text
Palette     : deep maroon / black / warm ivory / gold
Ornament    : suntiang detail, rumah gadang geometry, songket-inspired border
Photo       : formal centered portrait / architectural frame
Typography  : strong serif/display + neutral body
Motion      : layered ceremonial entrance, slow ornament reveal
```

### 3.9 Sundanese Botanical Heritage

**Karakter:** heritage lebih ringan dan garden-oriented.

```text
Palette     : cream / terracotta / forest green / muted gold
Ornament    : traditional architecture + local botanical illustration
Photo       : natural outdoor photography
Typography  : serif + soft sans
Motion      : subtle botanical depth, no heavy particle
```

### 3.10 Bali Architectural

**Karakter:** stone/temple architecture, tropical composition.

```text
Palette     : stone / terracotta / charcoal / botanical green / gold accent
Ornament    : kori/gapura silhouette, carved geometry, tropical foliage
Photo       : portrait framed by architecture
Typography  : elegant serif + restrained sans
Motion      : architectural layer reveal + light parallax
```

### 3.11 Newspaper Editorial

**Karakter:** theme mengubah **content grammar**, bukan hanya styling.

Vocabulary visual boleh menggunakan:

```text
Breaking News
Invitation
Issue / Edition
Live Date
The Bride
The Groom
Feature Story
Journey of Love
```

Layout memakai:

- masthead;
- rule lines;
- columns;
- caption;
- headline hierarchy;
- photo-caption relationship.

Motion minimal; kesan premium datang dari typography/layout.

### 3.12 Photojournalistic / Film

**Karakter:** dokumenter, candid, cinematic photography.

```text
Palette     : neutral / warm film / black / off-white
Photo       : mixed ratio, contact-sheet/editorial sequencing
Ornament    : hampir tidak ada
Typography  : clean serif/sans
Motion      : image sequence reveal, subtle zoom
```

---

## 4. Design Token Contract

Setiap theme wajib mempunyai visual token yang eksplisit. Jangan menyebar angka/warna/font arbitrary di banyak komponen.

Contoh conceptual contract:

```typescript
type ThemeVisualSpec = {
  palette: {
    background: string;
    surface: string;
    text: string;
    muted: string;
    accent: string;
    accentContrast: string;
    border: string;
  };

  typography: {
    displayFamily: string;
    bodyFamily: string;
    displayWeight: number;
    bodyWeight: number;
    labelTracking: string;
  };

  geometry: {
    contentWidth: string;
    cardRadius: string;
    photoRadius: string;
    sectionGap: string;
  };

  artDirection: {
    archetype: string;
    ornamentSet: string;
    photoMask: string;
    sectionDivider: string;
    motionPreset: string;
  };
};
```

CSS token baseline:

```text
--theme-bg
--theme-surface
--theme-text
--theme-muted
--theme-accent
--theme-accent-contrast
--theme-border

--theme-font-display
--theme-font-body

--theme-content-width
--theme-section-space
--theme-card-radius
--theme-photo-radius
```

`ThemeVisualSpec` hanya presentation contract. Harga, entitlement, limits, dan lifecycle **tidak masuk** ke object visual. Object ini juga **bukan owner form payload**. Editor hanya mengirim allowlisted `InvitationThemeOverrides` yang diizinkan theme sesuai File 01; renderer menggabungkan canonical theme spec + safe owner overrides pada server/trusted composition boundary.

---

## 5. Typography System

### 5.1 Maksimal Dua Family

Theme hanya boleh mempunyai maksimal:

```text
1 display family
1 body family
```

Arabic/aksara khusus yang benar-benar dibutuhkan untuk konten dapat menggunakan fallback yang tepat tanpa menjadikan seluruh theme memiliki tiga font dekoratif aktif.

### 5.2 Hierarchy Baseline

Angka berikut adalah baseline responsive, bukan hard requirement setiap theme:

```text
micro label / overline  : 10–12px
body                    : 14–16px
button / nav label      : 12–15px
section title           : 28–40px
couple display name     : 42–64px
hero editorial display  : 48–72px bila composition memungkinkan
body line-height        : 1.55–1.8
```

### 5.3 Script Font

Script font hanya untuk:

- nama pasangan;
- decorative heading pendek;
- signature treatment.

Script font **tidak** digunakan untuk:

- alamat;
- tanggal/waktu;
- paragraph body;
- RSVP label;
- bank account;
- tombol.

### 5.4 Adat dan Ornamen Kompleks

Semakin kompleks ornament visual, semakin restrained typography. Jangan menggabungkan motif padat + script padat + gold shadow + decorative body font.

### 5.5 Editorial/Newspaper

Theme editorial boleh memakai lebih banyak **weights/size contrast** dari family yang sama untuk menciptakan hierarchy seperti:

```text
masthead
headline
subheadline
caption
small metadata
body copy
```

---

## 6. Palette & Color System

### 6.1 Keluarga Palette Utama

Keluarga yang relevan untuk pasar:

1. **Ivory/Champagne/Taupe** — modern/elegant.
2. **Sage/Olive/Botanical** — garden/minimalist.
3. **Blush/Dusty Rose/Peach** — romantic floral.
4. **Maroon/Burgundy/Terracotta** — formal/heritage tertentu.
5. **Midnight/Navy/Black + Metallic Accent** — luxury.
6. **Emerald/Deep Green + Gold/Ivory** — Islamic/luxury.
7. **Culture-specific palette** — tidak disamakan menjadi satu `traditional` palette.

### 6.2 Theme Adat Tidak Boleh Generic

Dilarang membuat rule:

```text
traditional = maroon + gold
```

Setiap cultural theme mempunyai palette yang diturunkan dari art direction masing-masing dan diverifikasi secara visual/kultural.

### 6.3 Metallic Color

Gold/bronze/silver sebaiknya berupa **accent**, bukan seluruh body text. Hindari artificial gradient yang memberi kesan chrome/plastic jika tidak mendukung art direction.

### 6.4 Contrast

Body, form, event data, account number, dan CTA wajib lolos contrast yang layak. Decorative text boleh lebih ringan hanya jika bukan satu-satunya carrier informasi.

---

## 7. Ornament & SVG System

### 7.1 Tiga Tingkat Ornamen

Jangan mengulang satu frame besar identik di setiap section. Gunakan hierarchy:

```text
Hero Ornament
Section Ornament
Micro Ornament
```

**Hero Ornament** — elemen identitas terbesar, hanya pada cover/section tertentu.

**Section Ornament** — divider/frame/illustration skala sedang.

**Micro Ornament** — monogram, line, icon, flourish kecil.

### 7.2 SVG Cocok Untuk

SVG direkomendasikan untuk:

- monogram;
- divider;
- corner line ornament;
- botanical line-art;
- gunungan/wayang silhouette;
- gapura/architectural line-art;
- geometric arabesque;
- wedding rings/heart decorative mark;
- map/calendar/gift/music decorative icon variant;
- ornamental border;
- motif geometric yang dapat diulang.

### 7.3 Raster Cocok Untuk

WebP/AVIF lebih tepat untuk:

- watercolor kompleks;
- textured painting;
- paper grain/photo texture;
- detailed flower painting;
- photographic ornament;
- hand-painted cultural illustration dengan detail tinggi.

### 7.4 Layering

Theme premium dapat menggunakan depth:

```text
background texture/ornament      opacity rendah
mid-layer photo/content
foreground ornament              opacity penuh
```

Foreground tidak boleh menutupi wajah, text penting, CTA, atau form control.

### 7.5 SVG Motion

`DrawSVG`, `MorphSVG`, atau stroke animation boleh digunakan jika mendukung narrative. Jangan membuat seluruh icon UI menjadi animated decorative SVG.

---

## 8. Photography & Photo Mask System

### 8.1 Supported Treatments

Theme dapat memilih:

```text
full_bleed
editorial_rect
arch
oval
circle
organic_mask
architectural_frame
collage
contact_sheet
```

### 8.2 Crop by Archetype

```text
Modern Editorial     → 3:4 / 4:5 portrait
Minimalist            → strict portrait/grid
Floral                → arch/organic portrait
Luxury                → framed portrait / full bleed hero
Adat                  → formal portrait + cultural frame
Photojournalistic     → mixed ratio
```

Jangan memaksa semua media menjadi `aspect-square`.

### 8.3 Face Safety

Decorative mask harus mempunyai safe region untuk wajah. Authoring/preview perlu memperlihatkan crop final; jangan mengandalkan object-position default jika wajah dapat terpotong.

### 8.4 Visual Continuity

Satu theme sebaiknya mempunyai 1–2 primary photo treatments. Menggunakan circle, arch, torn paper, square, dan ornamental frame sekaligus dalam satu theme membuat visual grammar tidak konsisten.

---

## 9. Component Anatomy — Cover / Hero

Cover adalah komponen dengan prioritas visual tertinggi.

### 9.1 Microcomponents

```text
CoverBackdrop
CoverTexture
HeroPhoto
HeroOrnamentBack
HeroOrnamentFront
WeddingOverline
CoupleDisplayName
WeddingDate
GuestRecipient
OpenInvitationButton
ScrollHint
MusicEntryState
OptionalMonogram
```

### 9.2 Layer Model

```text
Layer 0  background / gradient / texture
Layer 1  background ornament
Layer 2  hero photo / illustration
Layer 3  foreground ornament
Layer 4  typography / recipient
Layer 5  CTA / interaction control
```

### 9.3 Cover Variants

**Photo-led**

```text
full-bleed photo
+ controlled overlay
+ small overline
+ large name
+ date
+ recipient
+ open CTA
```

**Ornamental**

```text
hero ornament
monogram
couple name
portrait/frame
recipient
open CTA
```

**Editorial**

```text
masthead/overline
large asymmetric type
photo crop
fine rule
metadata/date
CTA
```

**Heritage**

```text
cultural architecture/motif
formal portrait
ceremonial typography
recipient
open CTA
```

### 9.4 Cover Motion

Gesture opening dapat menjalankan:

```text
CTA tap
→ foreground ornament opens/moves
→ photo subtle zoom/reveal
→ title transition
→ scroll/content unlock
→ audio play request
```

Motion harus selesai cepat dan tidak membuat user menunggu beberapa detik sebelum dapat membaca konten.

---

## 10. Component Anatomy — Opening / Quote

### 10.1 Microcomponents

```text
QuoteEyebrow
QuoteText
ArabicText (bila ada)
TranslationText
QuoteSource
SectionOrnament
```

### 10.2 Layout

- centered quiet composition untuk spiritual/romantic theme;
- editorial pull-quote untuk modern/newspaper;
- framed ornamental composition untuk heritage/luxury.

Paragraph tidak boleh dibungkus dalam ornament padat yang mengurangi readability.

---

## 11. Component Anatomy — Couple

### 11.1 Microcomponents

```text
CoupleSection
PartnerPortrait
PartnerRoleLabel
PartnerName
ParentageText
OptionalSocialLink
CoupleConnector
```

### 11.2 Composition Variants

```text
stacked
split
alternating
editorial_feature
portrait_card
ceremonial_pair
```

**Stacked:** aman untuk mobile dan theme floral/minimal.

**Split:** dipakai hanya jika width cukup; mobile kembali ke vertical.

**Alternating:** pasangan mendapat section/visual block masing-masing.

**Editorial feature:** portrait + typographic profile seperti magazine.

**Ceremonial pair:** heritage/luxury dengan symmetry lebih kuat.

### 11.3 Connector

`&` atau decorative separator adalah elemen komposisi, bukan harus selalu script/font besar.

---

## 12. Component Anatomy — Event & Countdown

### 12.1 EventCard Microcomponents

```text
EventTypeLabel
EventTitle
EventDateBlock
EventTime
VenueName
VenueAddress
CalendarAction
NavigationAction
OptionalEventOrnament
```

### 12.2 Event Layout Variants

**Classic card:** satu card per acara.

**Editorial rows:** date besar di satu sisi, event details di sisi lain.

**Timeline:** event diurutkan sepanjang vertical line.

**Ceremonial panel:** event berada di ornamental/architectural frame.

### 12.3 Date Block

Date tidak harus selalu card kecil. Variant:

```text
DAY
25
APR
2026
```

atau satu line editorial:

```text
25 · 04 · 2026
```

### 12.4 Countdown

Microcomponents:

```text
CountdownUnit(days)
CountdownUnit(hours)
CountdownUnit(minutes)
CountdownUnit(seconds)
```

Variant:

- naked numbers;
- thin bordered cells;
- circle;
- translucent panel;
- editorial inline.

Countdown tidak boleh menjadi visual lebih dominan daripada event title/date kecuali theme memang berkonsep countdown/launch editorial.

---

## 13. Component Anatomy — Venue / Map

### 13.1 Minimum Visual Contract

```text
VenueName
VenueAddress
EmbeddedMap / provider-backed map presentation
NavigationButton
```

Map tidak perlu mengambil satu viewport penuh. **Theme tidak boleh menghilangkan functional embedded map sebagai pengganti permanen hanya demi art direction** ketika venue mempunyai data/provider yang dapat dirender. Theme boleh memilih:

- embedded map card;
- compact embedded map;
- editorial address block atau location illustration **sebagai framing/pendamping**, dengan embedded map tetap dapat diakses;
- variasi radius/border/ornament/placement yang tidak menutup gesture/control.

Alamat teks dan `Buka Navigasi` tetap tersedia sebagai fallback/action. Business/provider/CSP contract mengikuti **File 01**; File 03 hanya memiliki interaction/fallback UX.

### 13.2 Map Frame

Map container memakai stable dimensions untuk mencegah layout shift. Decorative frame tidak boleh menghalangi map gesture/control.

---

## 14. Component Anatomy — Love Story

### 14.1 Microcomponents

```text
StorySectionTitle
StoryItem
StoryDate
StoryTitle
StoryBody
StoryPhoto
StoryConnector
```

### 14.2 Variants

**Vertical timeline**

```text
● first meet
│
● relationship
│
● engagement
│
● wedding
```

**Alternating editorial**

```text
photo | story
story | photo
photo | story
```

**Chapter / Newspaper**

```text
date
headline
body
caption/photo
```

**Film/contact sheet** — chronology diikat oleh rangkaian foto.

Jangan memaksakan love story panjang ke card sempit dengan fixed height/scroll internal.

---

## 15. Component Anatomy — Gallery

### 15.1 Shared Microcomponents

```text
GallerySection
GalleryItem
GalleryCaption
GalleryTrigger
Lightbox
LightboxClose
LightboxPrevNext
```

### 15.2 Composition by Theme

```text
Modern Editorial     → asymmetric editorial masonry
Minimalist            → strict grid
Floral                → soft collage / organic spacing
Luxury                → framed hero + secondary images
Adat                  → ornamental portrait sequence
Photojournalistic     → mixed-ratio contact sheet
```

### 15.3 Lightbox

Lightbox adalah shared interaction primitive. Theme boleh memberi visual skin ringan tetapi tidak mengubah focus/keyboard/escape semantics.

### 15.4 Carousel

Jika carousel digunakan, cross-fade atau restrained horizontal transition lebih baik daripada aggressive slide. Jangan membuat gallery auto-scroll cepat.

---

## 16. Component Anatomy — Video & Live Streaming

Video/live bukan focal visual above-the-fold.

### 16.1 Microcomponents

```text
VideoPoster
VideoPlayButton
VideoCaption
LivePlatformButton
LiveStatusLabel
```

### 16.2 Rules

- lazy load;
- poster image lebih dahulu;
- player hanya dibuat saat dibutuhkan;
- provider branding tidak boleh merusak theme hierarchy;
- theme tidak membuat autoplay video bersuara pada page load.

---

## 17. Component Anatomy — RSVP

RSVP adalah functional section; dekorasi tidak boleh mengurangi usability.

### 17.1 Microcomponents

```text
RsvpHeading
RsvpDescription
AttendanceChoice
GuestCountStepper
GuestNameInput (bila contract memerlukannya)
WishTextarea
RsvpSubmitButton
RsvpPendingState
RsvpSuccessState
RsvpErrorState
```

### 17.2 Layout

- form controls memiliki contrast dan tap target jelas;
- label tidak menggunakan script font;
- form tidak diletakkan di atas photo background yang ramai tanpa solid/blur-safe surface;
- success state mengganti/meringkas form, bukan hanya toast singkat.

### 17.3 Attendance Choice

Gunakan choice yang jelas seperti:

```text
[ Hadir ] [ Tidak Hadir ]
```

Bukan icon-only.

---

## 18. Component Anatomy — Wishes / Guestbook

### 18.1 WishCard

```text
WishAvatar/Initial
WishAuthor
AttendanceBadge (bila memang ditampilkan)
WishBody
WishTimestamp
```

### 18.2 Visual Rules

Wish feed bisa memakai compact cards tetapi tidak perlu ornamental frame berat pada setiap item karena jumlah item dapat besar.

Use-case dengan banyak ucapan harus tetap cepat; decorative animation hanya pada initial section reveal, bukan pada setiap card selama scroll.

---

## 19. Component Anatomy — Digital Gift

### 19.1 BankCard

```text
BankLogo/BankName
AccountNumber
AccountHolder
CopyButton
OptionalQrisTrigger
```

Account number menjadi visual data utama; jangan ditulis sebagai paragraph.

### 19.2 QRIS

QRIS image harus mempunyai:

- stable frame;
- sufficient contrast;
- download/copy instruction bila diperlukan;
- tidak ditempatkan di atas moving/animated background.

### 19.3 Physical Gift

```text
Recipient
Address
OptionalCopyAddressButton
OptionalConfirmationAction
```

Functional information mengambil prioritas di atas ornament.

---

## 20. Component Anatomy — Closing

Closing membentuk **visual echo** dari cover, bukan membuat desain baru.

Microcomponents:

```text
ClosingMessage
CoupleSignatureName
ClosingDate
ClosingOrnament
OptionalMonogram
BrandWatermark
```

Gunakan kembali satu atau dua visual motif dari cover agar experience terasa selesai secara intentional.

---

## 21. Iconography

### 21.1 Functional Icons

Untuk:

- music;
- map;
- calendar;
- copy;
- gift;
- close;
- gallery;
- navigation.

Gunakan icon line yang sederhana dan konsisten dengan library kanonik aplikasi.

### 21.2 Decorative Icons/Illustrations

Theme boleh mempunyai SVG/icon sendiri untuk:

- monogram;
- cultural symbol;
- botanical mark;
- ornament.

Pisahkan konsep:

```text
functional icon ≠ decorative illustration
```

Decorative SVG tidak menggantikan accessible label pada action.

---

## 22. Radius, Border, Shadow & Surface

Jangan memakai satu global `rounded-2xl` untuk semua theme.

Baseline language:

```text
Editorial/Minimal    : 0–8px
Modern Soft          : 10–20px
Floral               : 14–28px bila cocok
Luxury               : 2–12px
Adat/Heritage        : custom mask/frame lebih penting daripada radius
Newspaper            : 0px + rule/border
```

Shadow:

- subtle elevation hanya bila diperlukan;
- hindari large blurry shadow pada setiap card;
- dark luxury lebih baik memakai border/contrast daripada `box-shadow` berlebihan.

---

## 23. Section Divider & Rhythm

Theme mempunyai `SectionDivider` vocabulary sendiri:

```text
whitespace only
thin rule
small floral SVG
monogram
geometric motif strip
batik-inspired separator
architectural silhouette
```

Tidak semua section harus memiliki divider visual. Whitespace adalah divider yang valid.

Section vertical rhythm baseline:

```text
normal section : ~64–96px vertical breathing room
hero/cinematic : dapat lebih besar
functional form: lebih compact
```

Angka final mengikuti viewport/theme dan diuji pada perangkat nyata.

---

## 24. Motion System

GSAP adalah engine kompleks kanonik; CSS digunakan untuk micro-interaction sederhana.

### 24.1 Motion Presets

Renderer sebaiknya menggunakan vocabulary preset daripada setiap component membuat easing/duration sendiri.

```text
none
soft
editorial
botanical
cinematic
heritage
```

#### `soft`

- opacity;
- translateY kecil;
- short stagger;
- tanpa continuous motion.

#### `editorial`

- text/line clip reveal;
- image mask reveal;
- caption stagger;
- no decorative particle.

#### `botanical`

- soft section reveal;
- 1–2 ornament sway;
- light parallax pada hero ornament;
- tidak semua bunga bergerak.

#### `cinematic`

- layered hero reveal;
- slow image scale;
- foreground/background depth;
- limited section transitions.

#### `heritage`

- symmetrical entrance;
- architectural/ornament line reveal;
- gentle vertical depth;
- ceremonial pacing.

### 24.2 Motion Hierarchy

```text
Hero               → strongest choreography
Couple/Event        → medium reveal
Story/Gallery       → restrained
RSVP/Gift/Form      → minimal decorative animation
Closing             → quiet echo
```

### 24.3 Continuous Motion

Continuous sway/parallax/particle hanya boleh pada sedikit decorative elements. Pause ketika document hidden dan hormati reduced-motion.

### 24.4 Avoid

- scroll-jacking;
- full-page `ScrollSmoother` sebagai default;
- animasi `width/height/top/left` besar;
- fullscreen continuous blur;
- particle tanpa batas;
- semua text memakai stagger;
- form control bergerak saat user mengisi.

---

## 25. Responsive & In-App Browser

### 25.1 Mobile First

Design dan QA dimulai dari portrait mobile.

Setiap theme wajib diuji pada:

- narrow Android;
- common 390–430px iPhone/Android;
- Safari iOS;
- Chrome Android low-end;
- WhatsApp/Instagram/LINE/Facebook in-app browser bila tersedia pada test device.

### 25.2 Desktop Hybrid Stage

Desktop mengikuti Hybrid Responsive Canvas, bukan center-phone-only. Readable text tetap constrained, sedangkan visual section dapat menggunakan split composition, sticky visual, side framing, wide gallery, asymmetric spread, atau cinematic full-bleed sampai batas layout yang aman.

Outer canvas tetap boleh memakai solid, gradient, low-res derived image, atau subtle texture. Jangan menduplikasi full-resolution portrait sebagai background blur besar.

Detail breakpoint/composition mengikuti File 05A §2.1 dan §16.

### 25.3 Safe Area

Floating controls dan bottom navigation menghormati `env(safe-area-inset-bottom)` dan tidak bergantung hanya pada user-agent detection.

---

## 26. Music & Floating Controls

### 26.1 Music

- satu controller/instance aktif per invitation renderer;
- gesture **Buka Undangan** menjadi kesempatan play pertama;
- always-visible pause/play control setelah experience dibuka;
- error audio tidak memblokir content;
- icon boleh berputar/pulse halus saat playing, tetapi jangan berlebihan.

### 26.2 Floating Controls

Default maksimum:

```text
1 music control
+
1 bottom navigation / compact navigation system
```

Jangan menumpuk 4–6 floating circular actions di sisi layar.

### 26.3 Bottom Navigation

Contoh informasi:

```text
Home
Couple
Event
Gallery
Gift
```

Jumlah item harus cukup besar untuk tap dan tidak memaksa label terlalu kecil.

Interaction detail mengikuti File 03.

---

## 27. Theme Composition Architecture

Jangan membangun setiap theme sebagai aplikasi baru yang menduplikasi behavior.

Target ownership berikut adalah ekspansi renderer yang **sudah diakui struktur source tree File 01**:

```text
modules/theme/
  primitives/
    countdown/
    map-action/
    lightbox/
    rsvp/
    gift/
    music/

  shared-sections/
    optional shared functional shells

  themes/
    modern-editorial/
      renderer.tsx
      cover.tsx
      couple-layout.tsx
      event-layout.tsx
      gallery-layout.tsx
      ornament-set.tsx
      theme.css

    minang-suntiang/
      ...
```

Shared primitives memiliki behavior/accessibility. Theme memiliki composition/style/art direction.

### 27.1 Wrapper Depth

Hindari nested decorative wrapper yang tidak perlu. Normalnya satu section cukup mempunyai 1–3 layout container sebelum actual content. Theme CSS tidak boleh membutuhkan DOM nesting panjang hanya untuk alignment.

### 27.2 Renderer Registry

Registry hanya memetakan `renderer_key -> renderer implementation`. Metadata bisnis/presentasi yang kanonik tidak diduplikasi di source code bila sudah dimiliki database/domain layer.

---

## 28. Theme Variant vs Theme Baru

Gunakan **variant** bila perbedaan hanya:

- palette;
- background texture;
- satu decorative asset;
- minor type treatment.

Gunakan **theme baru** bila perubahan menyentuh minimal beberapa area berikut:

```text
cover composition
couple layout
event layout
gallery layout
ornament family
photo treatment
typography hierarchy
motion grammar
```

Contoh:

```text
Modern Editorial Ivory
Modern Editorial Sage
```

lebih tepat menjadi satu theme family dengan palette variant bila composition identik.

Sebaliknya `Newspaper Editorial` adalah theme berbeda karena content grammar/layout berbeda total.

### 28.1 Representasi MVP di Database

Istilah *family/variant* adalah taxonomy desain. MVP **tidak memerlukan** `parent_theme_id`, `theme_family`, atau tabel variant baru. Jika dua variant perlu muncul sebagai pilihan katalog terpisah, keduanya boleh menjadi dua row `themes` dengan `renderer_key`/composition sama dan `design_tokens` berbeda. Jika variant hanya internal palette option dan tidak perlu katalog entry terpisah, renderer dapat memilih token melalui configuration yang tervalidasi. Schema/immutability tetap mengikuti File 01.

---

## 29. Cultural / Adat Authenticity Contract

### 29.1 Jangan Membuat “Generic Adat”

Setiap cultural theme harus mempunyai research note internal yang mencatat:

```text
culture/subculture
palette rationale
motif source/inspiration
architecture/ornament reference
prohibited/misleading usage
photo styling
motion vocabulary
review status
```

### 29.2 Motif Bukan Dekorasi Acak

Jangan mengambil motif budaya hanya karena terlihat “tradisional”. Pastikan bentuk, orientasi, kombinasi, dan konteksnya tidak menyesatkan.

### 29.3 Modernisasi yang Diharapkan

Target bukan meniru undangan cetak secara literal. Formula yang dianjurkan:

```text
authentic cultural vocabulary
+
modern layout discipline
+
strong photography
+
restrained typography
+
subtle motion
```

### 29.4 Cultural Theme Review

Sebelum masuk katalog production, lakukan review minimal terhadap:

- naming;
- icon/motif;
- dress/portrait mockup;
- palette;
- architecture;
- copy contoh;
- religious/cultural symbol placement.

---

## 30. Katalog & Demo Theme

Card/catalog layout, CTA, responsive grid, filtering, dan copy berada di **File 03**. Archetype visual **tidak otomatis menjadi enum `category` baru**. Gunakan kategori luas File 01 + `catalog_tags` untuk discoverability granular.

Contoh mapping yang tidak menambah business enum:

```text
Emerald Islamic        -> category=general, tags=islamic/geometric/emerald
Newspaper Editorial    -> category=general|modern, tags=editorial/newspaper
Photojournalistic      -> category=general|modern, tags=editorial/photojournalistic
Javanese Heritage      -> category=traditional, tags=javanese/heritage
```

Tag adalah metadata katalog, bukan sumber entitlement atau renderer behavior. Tanggung jawab renderer:

- sediakan preview asset 3:4 yang representatif;
- preview harus menunjukkan **cover identity**, bukan screenshot acak section tengah;
- hanya satu full renderer aktif pada demo;
- demo memakai dummy data representatif;
- map/video/audio lazy;
- category/design metadata tidak diduplikasi di renderer.

### 30.1 Preview Asset

Preview card sebaiknya mengkomunikasikan dalam satu frame:

- couple name;
- key palette;
- primary ornament/photo treatment;
- visual archetype.

Jangan memakai mockup smartphone yang terlalu kecil hingga theme tidak dapat dievaluasi.

### 30.2 Demo

Demo harus memuat cukup data untuk menguji:

- long/short name;
- dua event;
- gallery;
- story;
- RSVP;
- gift;
- optional media;
- long address;
- no-photo fallback bila theme mendukung.

---

## 31. Diferensiasi Visual BASIC / PREMIUM / VIP

Tier/entitlement/pricing/limits tetap mengikuti File 01. Di File 05, tier hanya diterjemahkan ke **complexity budget**, bukan library restriction.

### BASIC

- typography matang;
- clean composition;
- 1–2 ornament families;
- satu primary photo treatment;
- standard gallery composition;
- soft/editorial reveal;
- tetap boleh memakai GSAP.

### PREMIUM

- composition lebih khas;
- multiple photo layouts yang konsisten;
- custom mask/frame;
- layered ornament;
- richer editorial hierarchy;
- more deliberate motion choreography;
- gallery/story composition lebih spesifik theme.

### VIP

- art-directed experience;
- bespoke SVG/illustration set;
- multiple depth layers yang terkontrol;
- highly distinctive section composition;
- custom cultural/artistic visual language;
- advanced but restrained motion sequence;
- lebih banyak QA/performance budget, bukan sekadar “lebih banyak efek”.

Tidak ada `VIP-only animation engine`.

---

## 32. Media, Cache & Privacy Boundary

Source-of-truth media/cache/security berada di File 01/02. Theme hanya:

- merender derived media final/ready dari DTO;
- tidak membaca quarantine/original object;
- tidak membuat Storage URL sendiri;
- memakai responsive variants;
- tidak memasukkan guest token, PIN/session, phone, atau credential ke metadata/analytics;
- tidak mengasumsikan private/personalized page aman untuk shared cache;
- mempertahankan old visual asset sampai replacement final siap bila DTO masih menunjukkannya.

### 32.1 Theme Switch, Focus & Crop

**Ganti theme bukan media replacement.** Renderer baru memakai asset yang sama beserta normalized `focus_x/focus_y` dari File 01. Perubahan frame dari 3:4 ke arch/organic/square hanya mengubah presentation crop/mask (`object-position`, clip/mask, atau derived rendition non-destruktif); original/focus tidak ditimpa.

Jika theme membutuhkan derived rendition baru:
1. preview/editor menampilkan crop final berdasarkan focus yang sama;
2. derived variant dibuat non-destruktif bila pipeline memang memerlukannya;
3. fallback asset lama/original tetap dapat dipakai sampai variant baru ready;
4. switching kembali ke theme lama tidak kehilangan crop/focus atau memaksa re-upload.

Theme tidak boleh membuat `crop_hint` tersembunyi sendiri yang berbeda dari canonical media contract.

---

## 33. Performance Budget Theme

### 33.1 Above the Fold

Hero harus ringan. Prioritas:

- satu hero photo/illustration utama;
- selective ornament;
- no video/map/gallery preload;
- font subset seperlunya;
- plugin motion hanya jika hero menggunakannya.

### 33.2 Image Strategy

- derived responsive image;
- jangan render original camera file;
- reserve dimensions/aspect ratio;
- below-fold lazy load;
- decorative raster asset dikompres dan tidak diulang dalam resolusi besar.

### 33.3 DOM & JS

- tidak ada nested wrapper berlebihan;
- tidak ada renderer lain di background;
- satu GSAP scope aktif;
- satu Howler controller aktif;
- plugin GSAP selective;
- listener/timeline cleanup wajib.

### 33.4 Expensive Visual Effects

Batasi:

- backdrop blur besar;
- continuous filter animation;
- large box-shadow;
- masking kompleks pada banyak foto sekaligus;
- particle/canvas loop;
- parallax pada semua section.

---

## 34. Accessibility Contract

Setiap theme wajib mempertahankan:

- semantic heading order;
- body contrast;
- keyboard navigation;
- visible focus;
- accessible action labels;
- image alt strategy sesuai konteks;
- reduced-motion;
- form labels/error states;
- lightbox escape/focus restoration;
- touch target yang memadai.

Decorative ornament memakai semantics yang tidak menambah noise ke screen reader.

Typography/ornament tidak boleh mengubah nama/label penting menjadi image-only content.

---

## 35. Anti-Patterns — Jangan Diulang dari Pasar

Hindari:

- frame floral yang sama di setiap section;
- semua text center tanpa alasan composition;
- script font untuk body/alamat/tombol;
- setiap section memakai card putih bulat di atas background;
- semua foto circle;
- semua elemen `fade-up` identik;
- gold gradient artificial pada semua typography;
- heavy drop shadow pada semua card;
- terlalu banyak floating button;
- particle/flower loop terus-menerus;
- auto-scroll otomatis/tanpa kontrol user atau scroll-jacking;
- theme adat hanya berupa floral generic + satu symbol budaya;
- 10 “theme” yang sebenarnya satu layout dengan palette berbeda;
- RSVP/gift memakai dekorasi yang mengganggu form/data;
- ornament foreground menutupi wajah/CTA;
- mobile font terlalu kecil demi memuat 6–8 bottom-nav item.

---

## 36. Owner Draft Preview Contract

Canonical route/auth/save/readiness contract berada di File 01. Tanggung jawab renderer:

- composition preview dan public sama;
- graceful terhadap draft incomplete;
- placeholder tetap mengikuti visual theme;
- tidak merender credential/PIN/private-session data;
- target-theme preview tidak mengubah live theme hanya karena renderer berhasil dirender;
- bila target allowance lebih kecil daripada current content, renderer **tetap menampilkan seluruh content valid yang diterima PreviewDTO** dan menampilkan/menyediakan ruang untuk warning conflict; jangan truncate/hide item berdasarkan target tier. Activation/publish tetap menjadi urusan domain dan boleh blocked.

---

## 37. QA Checklist Setiap Theme

### Visual Identity

- [ ] Cover dapat dikenali sebagai theme ini tanpa melihat nama theme.
- [ ] Theme berbeda pada lebih dari sekadar palette/background.
- [ ] Typography hierarchy konsisten.
- [ ] Ornament memiliki hierarchy hero/section/micro.
- [ ] Photo treatment konsisten.
- [ ] Closing menggemakan visual cover.

### Content Stress

- [ ] Nama pasangan pendek dan sangat panjang tidak pecah.
- [ ] Gelar akademik/nama orang tua panjang tetap readable.
- [ ] Alamat venue panjang tidak overflow.
- [ ] 1–3 event tetap terlihat baik.
- [ ] Love story panjang tidak membuat fixed-height clipping.
- [ ] Empty optional section tidak meninggalkan gap/ornament yatim.

### Responsive

- [ ] 320/360px narrow mobile.
- [ ] 390–430px common mobile.
- [ ] tablet portrait.
- [ ] desktop Hybrid Canvas: readable core + intentional breakout.
- [ ] safe-area bottom.
- [ ] in-app browser smoke test.

### Motion

- [ ] Hero/access-gate mempunyai choreography yang terlihat dan tidak menghalangi akses konten.
- [ ] Photography-led theme memiliki photo mask/clip/zoom/sequence motion, bukan wrapper fade saja.
- [ ] Ornament-led theme mengintegrasikan ornament ke composition/motion.
- [ ] Key sections tidak semuanya memakai choreography identik.
- [ ] Event/countdown dan story/gallery mempunyai entrance yang sesuai narrative.
- [ ] `prefers-reduced-motion` tetap lengkap dan semua content langsung visible.
- [ ] ambient loop/auto-gallery berhenti offscreen/document hidden.
- [ ] cleanup theme/unmount benar.
- [ ] Runtime evidence direkam; source inspection saja tidak dianggap motion QA.

### Functional Components

- [ ] Map CTA jelas.
- [ ] Calendar CTA jelas.
- [ ] RSVP form readable dan keyboard accessible.
- [ ] Wish feed tetap ringan untuk banyak item.
- [ ] Bank account/QRIS mudah dibaca/copy.
- [ ] Music control tidak menghalangi bottom navigation.
- [ ] Lightbox accessible.

### Cultural Theme

- [ ] Motif/naming/palette direview.
- [ ] Tidak mencampur motif budaya berbeda tanpa alasan yang tervalidasi.
- [ ] Cultural symbol tidak dipakai sebagai dekorasi sembarang.
- [ ] Photo mockup dan copy contoh sesuai konteks theme.

### Performance

- [ ] Above-the-fold tidak preload media yang tidak perlu.
- [ ] Raster ornament sudah dikompres.
- [ ] SVG tidak berisi path/metadata berlebihan.
- [ ] Tidak ada unused motion plugin.
- [ ] Tidak ada duplicate renderer/Howler instance.
- [ ] DOM nesting tetap sederhana.

---

## 38. Recommended Launch Portfolio

Untuk launch awal, kualitas dan cakupan QA lebih penting daripada jumlah katalog. Baseline yang direkomendasikan:

```text
LAUNCH CORE
01 Modern Editorial Ivory
02 Romantic Floral Watercolor
03 Javanese Heritage
04 Luxury Midnight
```

Empat archetype ini sengaja mencakup spektrum yang berbeda: editorial modern, romantic/floral, heritage Nusantara, dan dark/luxury. Masing-masing harus lulus seluruh QA File 05 §37 pada mobile nyata, reduced-motion, media fallback, RSVP/gift/map, dan browser target sebelum dianggap production-ready.

**Wave 2 — setelah renderer primitives dan telemetry launch stabil:**

```text
05 Minimalist Botanical
06 Emerald Islamic
07 Editorial Dark
08 Newspaper Editorial
```

**Wave 3 — setelah cultural review/performance budget siap:**

```text
09 Minang Suntiang
10 Sundanese Botanical Heritage
11 Bali Architectural
12 Photojournalistic / Film
```

Urutan Wave 2/3 boleh berubah berdasarkan first-party data dan kesiapan cultural review. Menambah theme tidak boleh mengalahkan perbaikan renderer primitive, accessibility, performance, atau conversion pada theme yang sudah live.

Setelah first-party data tersedia, prioritas theme berikutnya ditentukan oleh:

- catalog CTR;
- demo-to-create conversion;
- theme activation;
- checkout conversion per archetype;
- switch-away rate;
- mobile performance;
- support/revision complaint;
- request budaya tertentu.

Jangan menambah theme baru hanya untuk “memenuhi jumlah katalog”.

---

## 39. Kesimpulan Implementasi

Theme system weplan harus mengambil kekuatan utama pasar Indonesia—fitur lengkap, mobile-first, pilihan visual luas, budaya Nusantara, dan motion—tanpa meniru kelemahan umum berupa layout repetitif, ornament berlebihan, DOM berat, atau puluhan skin yang sebenarnya identik.

Formula kanonik:

```text
shared reliable product primitives
+
strong archetype-specific composition
+
authentic visual vocabulary
+
selective SVG/raster ornament
+
responsive photography
+
motion hierarchy
+
performance/accessibility discipline
```

> **Aturan anti-duplikasi:** jika sebuah rule menentukan business/security/runtime behavior, dokumentasikan di File 01/02 dan hanya referensikan di sini. File 05 memiliki aturan yang spesifik pada renderer, visual composition, media presentation, motion, performance, cultural art direction, dan accessibility theme.
