# Panduan UI/UX

> **REVISI 25 AGUSTUS 2026:** UI/UX diselaraskan dengan keputusan produk, riset target market Indonesia, dan baseline zero-cost/simplicity. `FREE` adalah marketing-only; tier riil BASIC/PREMIUM/VIP berasal dari tabel `tiers`; guest/RSVP/private media mengikuti File 01.
>
> **Arah UX:** Modern Editorial Wedding SaaS — warm, modern, premium, personal, clear, effortless. Platform UI harus netral dan conversion-oriented; ekspresi floral/adat/glamor hidup di wedding theme, bukan chrome aplikasi.

> **SINGLE SOURCE OF TRUTH UI/UX PLATFORM:** File 03 memiliki design tokens, component geometry, z-index, interaction pattern, copy, responsive behavior, accessibility, dan projection user-visible state.
>
> **Business/domain/runtime authority:** `01 - arsitektur-dan-konvensi.md`. Security verification: File 02. Wedding renderer/art direction: File 05.
> Terakhir diperbarui: 25 Agustus 2026
>
> **Batas tanggung jawab:** File 03 tidak menetapkan harga, tier/allowance, lifecycle/payment state machine, security threshold, DB schema, atau provider/runtime policy. UI wajib mengonsumsi hasil policy/use-case kanonik dari File 01 dan hanya menentukan bagaimana hasil tersebut ditampilkan.

---

## 0. Launch Scope UI/UX

File 03 tetap menjadi SSoT **bagaimana** experience dirender. Untuk mencegah scope launch melebar, capability UI dibedakan dari optimasi acquisition sesudah core funnel stabil.

**Launch-critical experience:**

```text
Landing inti → katalog/demo → pilih theme → personalized preview ringan
→ auth/sync → editor → preview → checkout → publish
→ guest invitation → PIN bila private → RSVP/wishes/gift/navigation
→ dashboard status/payment/basic management
```

Landing launch cukup memiliki Navbar, Hero, Featured Themes, Personalized Preview, Cara Kerja/Core Benefits, Pricing, Privacy/Security, FAQ, Final CTA, dan Footer. Social proof/vendor hanya tampil bila data/partner nyata sudah tersedia.

**Post-launch optimization:** secondary lead magnets, eksperimen urutan section, advanced conversion experiments, dan surface admin/support yang belum diperlukan operasi awal boleh ditunda. Penundaan UI tidak mengubah business/security invariant File 01/02; route atau tombol untuk capability yang belum aktif **tidak boleh ditampilkan sebagai seolah-olah tersedia**.

File 06 menentukan milestone pengerjaan. Bagian ini hanya menetapkan launch UX boundary agar roadmap tidak perlu membuat aturan UX kedua.

---

## 1. Design System

Design system adalah fondasi visual seluruh aplikasi. Setiap komponen, warna, tipografi, dan spacing mengikuti standar yang didefinisikan di bagian ini. Konsistensi design system memastikan pengalaman pengguna yang kohesif di semua halaman — mulai dari landing page publik, dashboard user, hingga halaman undangan pernikahan. Sebagai solo developer, design system yang ketat mengurangi keputusan desain berulang dan mempercepat pengembangan.

### 1.1 CSS Framework

**Tailwind CSS 4** adalah satu-satunya framework CSS yang digunakan. Versi 4 menggunakan engine Oxide yang lebih cepat, zero-config di Next.js, mendukung container queries secara native, dan menggunakan `@theme` untuk design tokens. Styling platform/dashboard memakai utility Tailwind dan token `@theme`. `globals.css` adalah satu-satunya **global platform stylesheet** untuk token/base rules. File CSS khusus wedding theme (`modules/theme/themes/*/theme.css`) tetap diperbolehkan, tetapi harus di-scope ke wrapper theme dan tidak boleh mendefinisikan global app rule yang bocor ke dashboard/tema lain. Keputusan menggunakan Tailwind CSS 4 didasarkan pada kecepatan development, ukuran bundle akhir yang kecil (hanya class yang dipakai yang masuk build), dan dukungan first-class dari Next.js.

### 1.2 Component Library

**shadcn/ui** digunakan sebagai komponen dasar. Berbeda dengan component library lain (Chakra UI, MUI), shadcn/ui menggunakan pendekatan copy-paste — komponen di-copy langsung ke folder `src/shared/components/ui/` sehingga developer memiliki kontrol 100% atas kode. Komponen baseline meliputi: Button, Input, Dialog, **AlertDialog**, Card, Table, Select, Textarea, Badge, Tabs, Form, Label, Switch, DropdownMenu, Sheet, Skeleton, dan Sonner (Toaster). `AlertDialog` menjadi primitive confirmation; `Dialog`/`Sheet` untuk workflow/form. Jangan menambah library modal/toast kedua. Setiap komponen wajib menggunakan prop `className` untuk styling tambahan via Tailwind.

### 1.3 Ikon

**Lucide React** adalah satu-satunya library ikon yang digunakan. Lucide bersifat tree-shakable (hanya ikon yang di-import yang masuk ke bundle), memiliki style konsisten (line-art minimalis), dan menyediakan lebih dari 1000 ikon yang mencukupi seluruh kebutuhan aplikasi. Ikon-ikon yang sering digunakan meliputi: navigasi (Home, Users, Settings, LogOut), aksi (Edit, Trash2, Copy, Download, Upload, Plus, Check, X), status (CheckCircle, AlertCircle, Loader2, Info), dan undangan (Heart, MapPin, Calendar, Music, Camera, Gift). Semua ikon menggunakan ukuran default 24px dan dapat di-customize melalui prop `size`, `className`, dan `strokeWidth`. Untuk **ikon UI aplikasi** gunakan Lucide secara konsisten dan jangan menambah library ikon kedua. SVG/ornamen dekoratif milik wedding theme boleh custom pada BASIC/PREMIUM/VIP sesuai desain; SVG dekoratif bukan pengganti ikon UI dan tetap tunduk pada performance/accessibility budget.

### 1.4 Feedback, Toast & Confirmation Contract

**Sonner** adalah satu-satunya sistem toast/notifikasi ephemeral. Gunakan untuk:

- success: `Data tersimpan`, `Link berhasil disalin`;
- error singkat: `Gagal menyimpan data`;
- warning/info yang tidak membutuhkan keputusan;
- loading/promise untuk operasi async yang memang cocok ditampilkan sebagai toast.

Komponen `<Toaster />` berasal dari `shared/components/ui/sonner.tsx` dan ditempatkan di root layout. **Tidak ada legacy `toast.tsx`/`toaster.tsx` kedua.** Dilarang memakai `alert()`, `window.confirm()`, dan `window.prompt()`.

Sonner **bukan** confirmation popup. Action button pada toast tidak boleh menjadi satu-satunya pengaman untuk delete, security change, payment cancel, atau aksi irreversible. `Undo` pada Sonner hanya diperbolehkan bila server benar-benar menyediakan rollback yang aman/idempotent; jangan membuat undo palsu hanya di client.

#### 1.4.1 Primitive Kanonik

```text
Feedback singkat                 → Sonner
Keputusan/confirmation penting   → shadcn AlertDialog
Reusable app confirmation        → shared ConfirmDialog (wrapper AlertDialog)
Form/detail/workflow kompleks    → shadcn Dialog / Sheet / dedicated page
```

`ConfirmDialog` cukup satu komponen reusable untuk seluruh module. Props baseline:

```text
title
description
confirmLabel
cancelLabel
variant = default | warning | danger | critical
requiredText?     # hanya typed confirmation
isPending
onConfirm
```

Jangan membuat `DeleteGuestModal`, `DeletePhotoModal`, `DeleteBankModal`, dst. bila hanya berbeda copy/action dan dapat menggunakan wrapper yang sama.

#### 1.4.2 Matriks Confirmation

| Tingkat | Contoh weplan | UI | Aturan |
|---|---|---|---|
| **Tidak perlu confirmation** | autosave, save manual, preview, copy link/rekening, filter theme, pindah tab, play/pause, tambah item | langsung + Sonner bila perlu | Aksi aman/reversible tidak boleh dihambat popup. |
| **Standard** | hapus satu foto, tamu, rekening, event; reset field; menimpa teks manual dengan template | ConfirmDialog | Jelaskan objek yang terdampak. `Batal` + aksi spesifik (`Hapus Foto`). |
| **High-impact** | PUBLIC↔PRIVATE, regenerate guest link, reset/ganti PIN, restore Trash, cancel payment yang state-nya memang cancellable | ConfirmDialog | Jelaskan konsekuensi. Security/payment invariant tetap diverifikasi server. |
| **Critical** | Delete Account, permanent invitation delete, audit purge, bulk destructive admin action | ConfirmDialog + typed confirmation | `requiredText` + re-auth/approval bila diwajibkan. |
| **Complex workflow** | re-authentication, refund review, support elevation | Dialog/Sheet/page | Jangan memaksa form kompleks masuk AlertDialog atau toast. |

#### 1.4.3 Anti-Confirmation-Fatigue

Jangan menambahkan popup “Yakin?” setelah setiap klik. Secara khusus:

- **Save/autosave:** tidak ada confirmation.
- **RSVP submit normal:** tidak ada confirmation; tampilkan success state.
- **`Bayar & Publish`:** bila user sudah berada di halaman review yang menampilkan paket, durasi, dan harga dengan jelas, tombol ini sendiri adalah explicit intent; jangan menambah dialog `Apakah Anda yakin ingin membayar?` yang redundant.
- **Preview/ganti filter/ganti tab:** tidak ada confirmation kecuali ada unsaved state yang benar-benar belum dapat dipulihkan.
- **Ganti template doa/teks preset:** confirmation hanya jika field sudah dirty dan aksi akan menimpa tulisan manual user.

#### 1.4.4 Copy & Visual Confirmation

Confirmation harus menjelaskan **konsekuensi**, bukan hanya `Apakah Anda yakin?`.

Contoh standard:

```text
Hapus tamu?
Tamu ini akan dihapus dari daftar undangan.

[Batal] [Hapus Tamu]
```

Contoh high-impact:

```text
Jadikan undangan privat?
Tamu akan membutuhkan PIN untuk membuka undangan.
Link yang sudah dibagikan tetap ada, tetapi isi tidak dapat dibuka tanpa PIN.

[Batal] [Atur PIN & Jadikan Privat]
```

Contoh critical:

```text
Hapus akun?
Semua undangan langsung dinonaktifkan dan akun masuk masa grace sesuai policy akun.
Ketik HAPUS AKUN untuk melanjutkan.

[________________]
[Batal] [Hapus Akun]
```

Visual:

- standard dialog max-width sekitar **420–480px**;
- mobile width `calc(100% - 32px)` dan tetap menghormati safe-area;
- button normal tetap 44–48px;
- aksi destructive/critical memakai semantic danger, bukan gold;
- action order: `Batal` kemudian aksi utama/destructive;
- label harus spesifik (`Hapus Tamu`, `Batalkan Pembayaran`), bukan `Ya`/`OK`;
- jangan membuat modal fullscreen untuk confirmation sederhana.

#### 1.4.5 Async, Double Submit & Error

Saat user menekan confirm:

1. disable tombol confirm dan cancel yang dapat memicu race bila perlu;
2. ubah label menjadi state spesifik (`Menghapus...`, `Membatalkan...`);
3. mutation server memakai idempotency/ownership/state check sesuai File 01/02;
4. dialog **tidak ditutup optimistis** untuk destructive/high-impact action;
5. success → close dialog + Sonner success bila berguna;
6. failure → dialog tetap terbuka dengan inline error; Sonner boleh menjadi feedback tambahan.

Dialog tidak pernah menjadi security boundary. User dapat melewati UI; server tetap wajib memvalidasi authentication, ownership, sensitive-auth, payment state, entitlement dan invariant lain.

#### 1.4.6 Accessibility & Focus

- gunakan `AlertDialog`/`Dialog`/`Sheet` shadcn, bukan custom `div` modal;
- focus masuk ke dialog dan kembali ke trigger setelah close;
- `Escape`/Cancel tidak pernah menjalankan destructive action;
- critical dialog boleh mencegah accidental backdrop close bila memang diperlukan;
- `aria-describedby` mengarah ke konsekuensi aksi;
- tombol destructive tidak menjadi initial focused action bila itu meningkatkan risiko salah klik;
- dialog portal tetap `z-60`, Sonner `z-70`.

### 1.5 Tipografi

**Plus Jakarta Sans** adalah font platform untuk landing, katalog, auth, dashboard, pricing, form, dan CTA. Load sekali melalui `next/font/google` pada root layout untuk menghindari CLS.

**Playfair Display** hanya menjadi serif default/fallback wedding theme dan di-load pada wedding layout/renderer yang membutuhkannya; jangan membebani seluruh dashboard/landing dengan font wedding. Theme boleh memakai font gratis lain bila memang diperlukan, tetapi maksimal **2 font family aktif per theme** dan body text tidak memakai script font.

Heading landing/platform tetap Plus Jakarta Sans. Kesan wedding premium berasal dari theme preview, photography, whitespace dan motion—bukan dengan mengubah seluruh SaaS UI menjadi serif/script.

### 1.6 Dark Mode

Dark mode **tetap menjadi fitur resmi**, tetapi implementasinya dibagi berdasarkan jenis route agar aman untuk CSP dan tetap hemat Cloudflare Worker:

```text
Landing / katalog / public-static
→ CSS `prefers-color-scheme`
→ tidak membutuhkan script theme
→ tetap SSG/ISR/cacheable

Dashboard / Admin / authenticated dynamic app
→ `next-themes` pada layout dashboard/admin saja (BUKAN root `app/layout.tsx`)
→ attribute="class"
→ defaultTheme="system"
→ enableSystem=true
→ manual Light / Dark / System tersedia

Wedding invitation /[slug]
→ TIDAK mengikuti dark mode platform
→ warna mengikuti design token theme invitation
```

**CSP:** jangan mengizinkan `script-src 'unsafe-inline'` global hanya untuk `next-themes`. Pada dashboard/admin yang memang dynamic, `ThemeProvider` dapat menerima nonce request. Nonce tidak dipasang ke route landing/static karena CSP nonce di Next.js memaksa dynamic rendering dan menonaktifkan static optimization/ISR.

Kontrak Cloudflare/Rocket Loader dimiliki **File 01 §1.11.2**. File 03 hanya mengunci bahwa semua warna light/dark memakai CSS variables di `globals.css`; jangan menduplikasi palette di komponen atau membuat workaround runtime kedua di layer UI.

### 1.7 Responsive Design

Pendekatan **mobile-first** wajib diterapkan di seluruh aplikasi karena riset pasar wedding Indonesia menunjukkan penggunaan mobile sangat dominan. Jangan hardcode klaim “>90% traffic” sebagai fakta weplan sebelum first-party analytics tersedia; setelah launch, keputusan breakpoint/interaction dievaluasi dari data perangkat aktual. Setiap komponen tetap dirancang untuk layar kecil terlebih dahulu, baru diperluas ke tablet dan desktop. Breakpoint yang digunakan mengikuti standar Tailwind CSS: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px). Semua unit spacing menggunakan rem (relatif terhadap root font-size). Testing wajib dilakukan di perangkat nyata (bukan hanya DevTools) terutama untuk: (1) In-App Browser (Instagram, LINE, Facebook, WhatsApp), (2) Safari iOS (autoplay policy, safe area), dan (3) Chrome Android low-end (performa animasi). Halaman undangan pernikahan di desktop dibatasi lebar maksimal 480px dan di-center, mensimulasikan tampilan mobile untuk menjaga konsistensi desain.

### 1.8 Sistem Z-Index

Skala berikut adalah **kanonik File 03** untuk seluruh platform UI:

```text
base/content     z-0
raised/dropdown  z-20
sticky/header    z-30
floating action  z-40
overlay/backdrop z-50
modal/dialog     z-60
toast/critical   z-70
```

Floating action bar / bottom navigation tidak boleh melebihi `z-40`. Dialog/Sheet selalu melalui portal pada `z-60`; Sonner/critical toast `z-70`. Dilarang membuat angka z-index lokal baru tanpa memperbarui **bagian ini**; File 01 hanya merujuk kontrak UI ini.

### 1.9 Palette Usage & Visual Direction

**Champagne Slate tetap palette resmi platform** dan tidak diganti menjadi pink wedding generik. Alasannya: palette netral memberi ruang bagi preview theme Modern/Floral/Minimalist/Adat/Royal untuk menjadi pusat visual tanpa bertabrakan dengan chrome aplikasi.

Distribusi visual baseline:

```text
60–70%  canvas/surface ivory-white
20–30%  slate typography/navigation
5–10%   gold/blush accent
```

Hierarchy warna:

- **Acquisition primary:** Midnight Slate + teks inverse (`Coba Tema Gratis`, `Mulai Draft Gratis`).
- **Transactional/high-intent:** Brushed Gold + `ink-on-accent` (`Bayar & Publish`, `Upgrade`, `Perpanjang`).
- **Secondary:** surface/transparent + border slate/sand.
- **Destructive:** semantic danger.
- Gold tidak digunakan untuk semua tombol. Blush hanya tag/filter/decorative highlight.

Platform chrome tidak memakai floral ornament, wedding script, atau background prewedding sebagai default. Wedding imagery tampil melalui theme preview/product mockup.

### 1.10 Geometry, Button & Card System

Gunakan geometry konsisten agar implementasi sederhana:

| Komponen | Baseline |
|---|---|
| Input/control | radius 10–12px; min-height 44px |
| Button standard | radius 12px; height 44–48px |
| Hero CTA | radius 14px; height 52px |
| Standard card | radius 16px |
| Marketing/pricing card | radius 20px |
| Modal/hero demo container | radius 20–24px |
| Badge/filter chip | pill |

Card default memakai border `border` + surface, shadow sangat ringan. Hover desktop cukup `translateY(-2px)` + shadow ringan; jangan menambah animation library untuk hover. Jangan membuat semua elemen `rounded-3xl`.

Button hierarchy:

1. Primary filled slate.
2. Transactional filled gold.
3. Secondary outline.
4. Tertiary text-link + arrow.
5. Destructive semantic red.

Label aksi harus spesifik: `Lihat Semua Tema`, `Coba Tema Ini`, `Mulai Isi Undangan`, `Preview Undangan`, `Bayar & Publish`. Hindari `Klik di sini`, `Submit`, atau `Selengkapnya` ketika tujuan bisa disebut langsung.

### 1.11 Copywriting System

Tone produk: **warm + clear + confident + modern**.

- Marketing/product memakai `kamu` dan `kalian` secara konsisten; legal tetap formal.
- Copy menjual outcome, bukan implementasi teknis.
- `Guest token` → “Undangan personal untuk setiap tamu”.
- `PIN/HMAC session` → “Undangan privat dengan PIN”.
- `Provider peta internal` → “Tamu langsung menemukan lokasi acara”.
- `entitlement_snapshot` tidak disebut pada marketing UI.
- Dilarang hard-selling berlebihan: `HOT PROMO`, `TERMURAH`, `#1` tanpa bukti, countdown permanen, fake scarcity.
- Social proof hanya angka/testimonial/logo nyata.
- Cakupan pengalaman draft gratis (`buat + preview`, bukan publish gratis) dan batasannya dijelaskan sebelum checkout.

### 1.12 Component Ownership & Route Colocation

Struktur UI mengikuti ownership, bukan memaksa semua komponen masuk satu folder:

```text
Hanya satu route/route-group    → src/app/<segment>/_components/
Lintas route dalam satu fitur  → modules/<feature>/components/
Lintas domain/app-wide          → shared/components/
Static asset                    → root public/
```

Aturan:

- landing-specific `Hero`, `TrustStrip`, `FeaturedThemes`, `Pricing` boleh colocate di `src/app/(marketing)/_components/`;
- `_components`/`_lib` di dalam `app` adalah implementation detail route, **bukan business layer**;
- editor/guest/payment components yang dipakai lintas route tetap berada di module pemilik;
- `shared/components/` hanya untuk komponen benar-benar generik seperti `ConfirmDialog`, `PageHeader`, `EmptyState`, input generik, dan shadcn primitives;
- jangan membuat `src/public/`; static asset Next.js berada di root `public/`;
- loading UI ditempatkan pada segment yang memerlukan (`(dashboard)/loading.tsx`, `admin/loading.tsx`) daripada root loading global tanpa alasan;
- dialog/toast/theme behavior tetap mengikuti kontrak bagian sebelumnya meskipun komponen di-colocate.

## 2. Landing Page Publik

Landing page adalah acquisition + conversion surface utama. Implementasi tetap **SSG/ISR/server-first**; interaktivitas hanya client island kecil untuk preview/form/tool. Tidak ada carousel/analytics/AI library tambahan pada baseline.

### 2.1 Urutan Section Kanonik

```text
01 Navbar
02 Hero
03 Trust Strip
04 Featured Themes
05 Personalized Preview (primary lead magnet)
06 Cara Kerja
07 Core Benefits
08 Guest Experience
09 Pricing
10 Privacy & Security
11 Social Proof / Vendor
12 Secondary Lead Magnets
13 FAQ
14 Final CTA
15 Footer
```

Urutan boleh diuji setelah traffic cukup, tetapi jangan menambah section baru tanpa tujuan conversion yang jelas.

### 2.2 Top Navbar

Gunakan `position: sticky` dengan surface semi-opaque/solid + border/shadow ringan **tanpa JavaScript scroll listener**. Ini lebih mudah, menghindari contrast bug hero, dan tetap cache/static friendly.

Desktop:

```text
weplan    Tema  Cara Kerja  Fitur  Harga  FAQ       Masuk  [Coba Gratis]
```

Mobile:

```text
weplan                                      [Coba] [☰]
```

CTA di luar hamburger. Gunakan `Coba Gratis`/`Coba Tema`, bukan `Daftar`, karena registrasi bukan langkah pertama.

### 2.3 Hero

Hero tidak wajib `min-h-screen`; targetnya adalah value proposition + CTA + sebagian product preview terlihat cepat pada mobile. Gunakan `min-height` mobile-safe seperlunya, bukan ruang kosong hanya demi full viewport.

Baseline copy:

**Eyebrow:** `Undangan digital untuk momen yang personal`

**H1:** `Undangan pernikahan premium, buat sendiri dari HP.`

**Subcopy:** `Pilih tema, isi detail acara, dan lihat hasilnya langsung. Coba gratis—bayar hanya saat siap publish.`

**Primary CTA:** `Coba Tema Gratis`

**Secondary CTA:** `Lihat Contoh Undangan`

**Trust microcopy:** `Tanpa kartu kredit · Mulai tanpa login · Harga jelas sebelum bayar`

Hero visual menggunakan **actual theme preview/product mockup**, bukan stock wedding photo generik atau ilustrasi abstrak. Desktop dapat menampilkan 2–3 stacked theme previews; mobile cukup satu preview parsial agar initial load ringan.

Platform hero memakai Plus Jakarta Sans. Jangan menggunakan serif/script untuk headline platform.

### 2.4 Trust Strip

Sebelum memiliki metric nyata, gunakan product assurance:

```text
Coba sebelum bayar
Personal untuk setiap tamu
Optimized untuk WhatsApp
Edit sendiri dari HP
```

Setelah first-party data cukup, assurance dapat dilengkapi angka nyata. Fake counters dilarang.

### 2.5 Featured Themes

Homepage hanya menampilkan **6–8 featured themes**, bukan seluruh katalog.

Headline: `Temukan gaya yang terasa seperti kalian`

Subcopy: `Modern, floral, minimalis hingga nuansa adat. Semua tema bisa dicoba sebelum publish.`

Katalog memakai **search + facet**, bukan menganggap satu enum `category` cukup mewakili seluruh art direction.

Baseline category facet:

```text
Semua | Modern | Floral | Minimalis | Adat | Royal
```

`Adat` memetakan `themes.category='traditional'`. `themes.category='general'` tidak wajib diekspos sebagai chip literal karena terlalu generik.

Untuk arketipe lintas-kategori seperti Islamic, Editorial/Newspaper, atau Photojournalistic, gunakan `themes.catalog_tags` dari File 01. UI boleh menampilkan facet tambahan hanya bila tag tersebut tersedia pada katalog aktif, misalnya:

```text
Islamic | Editorial
```

Search mencocokkan nama/deskripsi/tag. Filter category/tag adalah **discoverability metadata**, bukan entitlement/business rule; jangan menambah enum DB baru hanya untuk menambah satu arketipe visual.

Preview theme adalah elemen dominan. Tidak autoplay 6–8 renderer GSAP sekaligus; homepage memakai preview image/video ringan. Full animation baru aktif pada demo theme.

CTA: `Lihat Semua Tema`.

### 2.6 Personalized Preview — Primary Lead Magnet

Ini adalah lead magnet utama dan **reuse onboarding existing**, bukan service/backend baru.

Form awal maksimal:

```text
Nama kamu
Nama pasangan
Tanggal pernikahan
```

Theme intent sudah diketahui dari card/demo atau gunakan featured default. Data disimpan sebagai local draft aman. Tidak ada upload media, nomor WA, kartu kredit, atau login pada langkah ini.

Copy:

**H2:** `Lihat undangan kalian dalam 60 detik`

`Masukkan nama dan tanggal. Tidak perlu membuat akun.`

CTA: `Lihat Preview`

Preview menampilkan nama pengguna di theme sehingga value dirasakan sebelum registrasi. Setelah pengguna memilih melanjutkan editing/upload, baru arahkan ke login/register lalu sync `client_ref`.

### 2.7 Cara Kerja

Hanya empat langkah:

1. **Pilih tema** — coba gaya yang paling sesuai.
2. **Isi detail** — tambahkan pasangan, acara, lokasi dan cerita.
3. **Preview gratis** — cek hasil sebelum membayar.
4. **Publish & bagikan** — aktifkan lalu kirim lewat WhatsApp.

Jangan membuat 6–10 step marketing diagram.

### 2.8 Core Benefits & Guest Experience

Gunakan outcome cards, maksimal 4–6:

- **Lebih personal** — undangan dengan nama tamu.
- **Lebih mudah** — edit langsung dari HP.
- **Lebih informatif** — acara, peta dan RSVP di satu link.
- **Lebih berkesan** — animasi, musik, foto dan cerita.
- **Lebih terkontrol** — guest list/RSVP/ucapan.
- **Lebih privat** — PIN bila dibutuhkan.

Guest Experience section memperlihatkan actual phone preview dan menjelaskan bahwa tamu dapat membuka lokasi, RSVP, galeri, ucapan dan amplop tanpa pindah aplikasi.

### 2.9 Pricing

Tetap empat marketing cards:

```text
FREE | BASIC | PREMIUM | VIP
```

FREE wajib ditulis:

**`Rp0 untuk membuat & preview`**

`Coba semua tema dan siapkan draft. Publish memerlukan paket sesuai tema yang dipilih.`

CTA: `Mulai Draft Gratis`.

BASIC/PREMIUM/VIP membaca data `tiers`. Maksimal **5 benefit utama** terlihat per card; detail lain melalui comparison/accordion.

`Premium` boleh diberi label **Direkomendasikan** jika secara product strategy memang anchor. Label `Paling Dipilih` hanya boleh muncul setelah first-party sales data mendukung.

Harga, durasi aktif, watermark dan batas utama tidak boleh disembunyikan sampai checkout. Original price/promo hanya jika benar-benar valid dan memiliki periode nyata.

### 2.10 Privacy & Security

Security dijual sebagai manfaat:

**`Hari kalian personal. Undangannya juga bisa privat.`**

- `Undangan privat dengan PIN`
- `Link personal untuk setiap tamu`
- `Media tidak diekspos sebagai public object permanen`

Jangan menampilkan istilah HMAC/Argon2/RLS pada marketing copy.

### 2.11 Social Proof & Vendor

Testimonial ideal:

```text
[theme thumbnail]
“Editnya gampang dan hasilnya tetap terasa premium.”
Nama pasangan
Kota · Tahun
Theme
```

Hanya gunakan data dengan izin.

Vendor section tetap dikontrol `homepage_sections.vendor`. Tampilkan hanya jika ada partner nyata yang memberi trust. Baseline menggunakan **CSS grid/native horizontal overflow**; jangan tambah carousel library. Autoplay marquee bukan kebutuhan MVP.

### 2.12 Secondary Lead Magnets — Tanpa AI/API

Lead magnet sekunder hanya setelah core preview berfungsi:

1. **Theme Finder** — 4–5 pertanyaan; scoring deterministik client-side; hasil 3 theme.
2. **Generator Teks Undangan WhatsApp** — template lokal (`formal`, `hangat`, `santai`, `islami`), bukan LLM/API.
3. **Checklist Pernikahan** — static/interaktif sederhana; localStorage opsional.
4. **Template Daftar Tamu CSV** — file statis yang formatnya sama dengan import guest.

Tidak ada AI API, PDF generation server, email gate, atau third-party marketing automation pada MVP. Tool boleh berdiri di `/lead-magnet` sebagai hub statis agar route/dependency tetap sedikit.

### 2.13 FAQ, Final CTA & Footer

FAQ berfokus pada objection conversion:

1. Apakah benar bisa mulai gratis?
2. Kapan harus membayar?
3. Harus membuat akun dulu?
4. Semua theme bisa dicoba?
5. Bisa diedit setelah publish?
6. Berapa lama aktif?
7. Bisa dibagikan lewat WhatsApp?
8. Ada RSVP?
9. Ada peta lokasi dan tombol navigasi?
10. Bisa ganti theme?
11. Bisa privat?
12. Metode pembayaran apa saja?

Final CTA:

**`Sudah punya tanggal?`**

`Mulai membuat undangan kalian hari ini.`

CTA `Coba Tema Gratis` + microcopy `Tidak perlu kartu kredit`.

Footer tetap memuat brand, navigasi, sosial, TOS, Privacy, kontak dan link lead magnet. Jangan membuat mega-footer terlalu panjang di mobile.

### 2.14 Katalog Tema

Menampilkan semua theme aktif dari relasi `themes -> tiers`.

Card contract:

- preview rasio **3:4**, sekitar 70–75% card;
- badge tier;
- nama;
- kategori;
- harga publish;
- satu CTA `Coba Tema Ini`.

Jangan memasukkan feature list panjang ke theme card.

Responsive baseline:
- mobile: 2 kolom bila preview/teks tetap terbaca; fallback 1 kolom pada layar sangat sempit melalui CSS;
- tablet: 3;
- desktop: 4;
- content max width 1200–1280px.

Filter memakai native button/chip + query/state ringan; tidak perlu library filter.

### 2.15 Halaman Demo Tema

Rute kanonik `/demo/[slug]`, dummy data, tanpa login/entitlement.

Full renderer dan motion boleh berjalan di sini. Bottom floating action bar:

```text
Theme name · tier · harga publish     [Coba Tema Ini]
```

Hanya satu theme renderer aktif. Jangan pre-mount renderer theme lain.

### 2.16 Alur Onboarding (Gradual Engagement)

```text
Landing / Pricing / Catalog / Demo
        ↓
pilih theme
        ↓
Personalized Preview / form publik aman
        ↓
Lihat Preview
        ↓
ingin lanjut edit/upload
        ↓
register/login
        ↓
Dashboard Editor
```

Kontrak sinkronisasi guest→login, local draft, `client_ref`, slug, atomic create, dan source-of-truth database **mengikuti File 01 §6.2**. Di sisi UX, upload media tetap diblokir sebelum login; setelah sinkronisasi sukses user masuk ke editor tanpa membuat jalur create kedua. Tidak ada quota jumlah draft sebagai marketing tier; UI hanya menampilkan pembatasan bila backend mengembalikan policy/retention/abuse state yang relevan.

## 3. Dashboard User

Dashboard adalah **wedding workspace**, bukan admin control panel. Desain task-first: pengguna pertama-tama melihat undangan aktif/draft, progress kelengkapan, `Lanjut Edit`, `Preview`, dan hal yang perlu diselesaikan—bukan grid semua fitur. Dashboard memiliki coarse route gate melalui Next.js 16+ `proxy.ts`, lalu authorization/ownership diverifikasi ulang server-side pada setiap data access/mutation. Proxy bukan satu-satunya security boundary.

### 3.1 Layout

Pada desktop, layout menggunakan **fixed left sidebar** dengan lebar 240px. Sidebar tetap terlihat saat konten di-scroll, sehingga navigasi selalu tersedia. Area konten utama berada di sebelah kanan sidebar dan bersifat scrollable secara independen. Pada mobile dan tablet, sidebar berubah menjadi **hamburger drawer overlay** — disembunyikan secara default dan muncul sebagai sheet dari kiri saat hamburger menu ditekan. Ini memaksimalkan ruang layar untuk form dan tabel pada perangkat kecil.

Di bagian paling atas sidebar terdapat **Dropdown Pemilih Undangan** yang berfungsi sebagai project switcher. Dropdown ini menampilkan daftar semua undangan milik user. Saat user memilih undangan berbeda, seluruh data di layar (tamu, rekening, editor) secara otomatis menyesuaikan dengan undangan yang aktif dipilih. Ini mengeliminasi kebutuhan untuk kembali ke halaman daftar undangan hanya untuk berpindah konteks.

Menu sidebar terdiri dari: **Beranda** (menampilkan daftar undangan), **Pengaturan** (edit profil dan danger zone hapus akun). Untuk setiap undangan yang dipilih, sub-menu muncul: Edit Undangan, Tamu, dan Rekening.

**Floating Action Bar** adalah bar aksi yang mengapung (fixed) di bagian bawah layar pada perangkat mobile. Bar ini menampilkan tombol-tombol aksi utama (Simpan, Hapus) untuk form yang sedang aktif. Floating action bar memakai `z-40`; semua modal/dialog **wajib** menggunakan `<DialogPortal>` pada `z-60` agar selalu berada di atas floating UI. Tanpa DialogPortal, tombol modal bisa tertutup oleh floating action bar dan tidak bisa diklik.

### 3.2 Halaman Utama (Daftar Undangan)

Setiap kartu invitation menampilkan theme aktif, tier theme/entitlement, slug, dan lifecycle status. Status pembayaran tidak dicampur ke `invitations.status`.

File 03 **tidak membaca `invitations.status` mentah sebagai lifecycle authority**. Card menerima projection server `InvitationWorkspaceState` dari File 01 (`effectiveLifecycle`, `commercialUiState`, `editable`, `availableActions`, `expiresAt`). Karena itu `expires_at <= now()` dapat tampil **Expired** walaupun cron belum menyelaraskan row `status`.

Contoh projection label:

```text
effectiveLifecycle=draft + commercialUiState=none
→ Draft

effectiveLifecycle=draft + commercialUiState=pending_initial_publish
→ Menunggu Pembayaran

effectiveLifecycle=draft + commercialUiState=entitlement_active
→ Paket Aktif · Belum Dipublish

effectiveLifecycle=published + commercialUiState=pending_upgrade
→ Published · Upgrade Diproses

effectiveLifecycle=published + commercialUiState=pending_renewal
→ Published · Perpanjangan Diproses

commercialUiState=payment_review
→ Pembayaran Perlu Verifikasi

effectiveLifecycle=expired + commercialUiState=pending_renewal
→ Expired · Perpanjangan Diproses

effectiveLifecycle=expired + commercialUiState selain pending_renewal
→ Expired

effectiveLifecycle=trashed
→ Trash
```

Aksi **hanya** dirender dari `availableActions` server. UX tipikal:
- unpaid draft: Edit, Preview, checkout bila readiness lolos;
- pending initial payment: Edit + lanjut/batalkan pembayaran hanya jika backend mengizinkan;
- paid draft: Edit, Preview, Publish Sekarang tanpa pembayaran kedua;
- published: Edit/Preview/Copy Link dan renewal/upgrade sesuai server;
- expired: read-only summary + recovery/renewal bila tersedia;
- trash: restore hanya bila lifecycle mengizinkan.

Draft Extension hanya ditawarkan bila server menyatakan eligible. **Durasi/produk tidak di-hardcode di File 03**; UI merender pilihan aktif dari `draft_extension_products`/DTO File 01. Paid draft menampilkan expiry paket dan tidak ditawari Draft Extension.

---

#### Task-First Dashboard Rules

Card invitation utama menampilkan preview thumbnail, nama pasangan, status, progress kelengkapan dan dua aksi utama:

```text
[Lanjut Edit] [Preview]
```

`Preview` harus selalu mudah ditemukan. Jangan menampilkan 8–12 icon fitur setara di halaman utama; feature navigation muncul sesuai konteks invitation.

Empty state tidak memakai “Belum ada data”. Gunakan copy actionable seperti:

`Belum ada undangan — pilih tema untuk membuat draft pertama.`

CTA: `Pilih Tema`.

### 3.3 Form Wizard (Buat/Edit Undangan)

Form pembuatan dan pengeditan undangan menggunakan pola **multi-step wizard** dengan tab navigation. Tab dibagi menjadi empat langkah: (1) **Profil & Doa** — data mempelai, orang tua, foto, sapaan pembuka, dan kutipan/doa, (2) **Detail Acara** — daftar acara (Akad, Resepsi, dll) dengan tanggal, waktu, lokasi, dan koordinat peta, (3) **Cerita & Galeri** — chronology/story content dan upload foto galeri, (4) **Pengaturan Lanjutan** — mode privat/PIN, musik latar, visibility section optional, serta **presentation override yang secara eksplisit diizinkan theme**. Pemilihan tema terjadi sebelum wizard, tetapi editor menyediakan aksi ganti theme melalui dedicated flow.

Editor **bukan theme builder bebas**. Typography, ornament set, photo mask, motion preset, divider, layout composition, dan renderer tetap authored oleh theme/File 05. Color/accent picker hanya muncul bila `layout_config.editable_overrides` theme mengizinkannya; theme adat/luxury yang mengunci palette tidak boleh tetap dipaksa mempunyai color picker. Contract allowlist dan penyimpanan override mengikuti File 01 §4.3/§10.4.

#### Initial Editor Hydration

Editor pertama kali harus tampil dari snapshot server terbaru, bukan form kosong yang kemudian berubah setelah user mulai mengetik. Detail `EditorDTO`, ownership/lifecycle check, dan database source-of-truth mengikuti **File 01 §10.1**. UI tidak pernah meng-override invitation tersinkron dengan local draft lama.

#### Auto-Save

Correctness autosave, queue, revision token, local generation, CAS, dan `VERSION_CONFLICT` mengikuti **File 01 §10.2–§10.4**. File ini hanya menetapkan pengalaman pengguna:

- **`Menyimpan...`** — ada save aktif.
- **`Tersimpan`** — hanya setelah perubahan terbaru telah diakui server; state boleh hilang otomatis setelah beberapa detik.
- **`Gagal (Offline)`** — error network/retryable + tombol `Coba Lagi`.
- **`Perubahan di tempat lain`** — autosave berhenti dan menawarkan `Muat versi terbaru`; jangan auto-force-overwrite.
- **`Perlu diperbaiki`** — validation/domain issue tampil dekat field/checklist; toast hanya tambahan.

Jika `Muat versi terbaru` akan mengganti perubahan lokal yang belum tersimpan, tampilkan ConfirmDialog dengan konsekuensi yang jelas sebelum UI memuat snapshot server.

#### Preview Undangan

Kontrak preview owner, flush-save, renderer reuse, target-theme preview, authorization, dan caching mengikuti **File 01 §10.6**.

Dari sisi UX, tombol **Preview Undangan** hanya berpindah setelah perubahan yang dapat disimpan sudah berhasil diakui. Save failure/conflict menahan user di editor dan menunjukkan masalah. Preview harus terlihat seperti renderer publik, tetapi toleran terhadap draft incomplete dengan placeholder yang jelas.

Untuk **target-theme preview** yang allowance-nya lebih kecil, preview tetap menampilkan seluruh content valid yang tersimpan dan menampilkan warning/`limitConflict` dari server. UI **tidak** truncate, menyembunyikan, atau menghapus item agar preview tampak lolos limit. Yang diblokir adalah activation/publish target sampai conflict diselesaikan.

#### Draft Validation vs Publish Validation

Draft harus resumable: navigasi antar-tab membantu menemukan error tetapi tidak memaksa seluruh field publish-ready sejak awal. **`validatePublishReadiness()` di File 01 §10.5** adalah satu-satunya authority untuk progress, checkout gate, dan publish.

UI hanya merender issue list dari validator tersebut menjadi progress/checklist dan deep-link ke tab/field terkait; jangan membuat daftar required kedua di client.

#### Event Form & Timezone

Untuk event dinamis gunakan `useFieldArray` dan bedakan React key dari database identity. Bentuk input UX adalah `date`, `localTime`, dan IANA `timezone`; event draft boleh incomplete.

Konversi ke `TIMESTAMPTZ`, validasi offset/timezone, identity/reorder, dan publish invariant mengikuti **File 01 §4.4 dan §10**. Client tidak membuat kontrak datetime alternatif atau menjadi authority atas instant.

#### Media Upload State

Media upload memakai state eksplisit: `uploading → processing → ready | rejected`. UI tidak boleh menganggap upload selesai hanya karena browser selesai mengirim bytes. Tombol publish dan preview final-media state harus menunggu asset yang direferensikan `ready`; draft preview boleh menunjukkan placeholder processing. Replacement lama tetap tampil sampai media baru `ready`.

Progress error harus actionable (format tidak didukung, size/duration/dimension limit, processing gagal) tanpa membocorkan internal worker error.

#### Template Doa

Banyak calon pengantin bingung menulis teks doa atau kutipan pembuka. Sediakan dropdown "Pilih Template Doa". Sebelum menimpa textarea, cek `formState.dirtyFields.doa`; bila user sudah menulis manual, tampilkan ConfirmDialog standard **"Ganti teks doa?"** dengan tombol **"Ganti dengan Template"**.

#### Guest / Pre-Login Draft Mode

Sebelum login, UX hanya menyediakan personalized draft ringan dan **upload tetap diblokir**. Isi allowlist local draft, versioning, recovery/migration, credential exclusion, `client_ref`, dan transisi menjadi database source of truth mengikuti **File 01 §6.2**. UI tidak menampilkan PIN/payment/private credential sebagai bagian draft lokal.

#### Privacy & PIN Bukan Autosave

PUBLIC↔PRIVATE, set/reset/ganti PIN, dan revoke session adalah **aksi khusus**, bukan bagian dari generic autosave. Security/version/re-auth semantics mengikuti **File 01 §8/§10** dan File 02.

UX wajib: selesaikan save content yang relevan terlebih dahulu, tampilkan konsekuensi melalui ConfirmDialog, jalankan re-auth bila diminta backend, dan pertahankan state dialog/error sampai mutation benar-benar berhasil.

#### Theme Switch & Limit Conflict

Business rule activation/entitlement/checkout dan atomic theme switch mengikuti **File 01 §10.7/§13**. UI hanya bertanggung jawab pada preview dan error yang dapat ditindaklanjuti.

Jika target theme tidak dapat diaktifkan karena content melebihi allowance, jangan menyembunyikan/menghapus content otomatis. Tampilkan jumlah item yang perlu dikurangi dan sediakan jalur kembali ke editor. **Preview tetap non-mutating dan tidak melakukan truncation berbasis allowance**; activation/publish-lah yang tetap blocked. Theme yang belum boleh diaktifkan tetap dapat ditawarkan sebagai preview/upgrade sesuai policy server.

#### Paid-but-Not-Published State

Jika backend mengembalikan entitlement aktif tetapi invitation belum publish-ready, UI menampilkan:

**`Paket aktif — lengkapi undangan untuk dipublish`**

User tidak diminta membayar ulang. Expiry, funded state, publish eligibility, dan race handling mengikuti **File 01 §7/§10.5**.

#### Lifecycle Editing

Lifecycle/editability ditentukan server sesuai **File 01 §10.9/§11**. UI memetakan hasilnya menjadi editable, read-only, restore/renew, atau blocked state yang jelas; deep-link tidak boleh membuat UI menawarkan aksi yang backend larang.

### 3.4 Halaman Tamu

Tabel owner tetap menampilkan data private guest: nama, nomor WA, sapaan, source (`manual/import/public_rsvp`), RSVP, attendance, status ucapan, dan status WA sent. Data ini tidak tersedia pada public guestbook RPC.

Untuk guest manual/import, owner dapat membuat **Personal Link**. Link memakai guest token acak. Tombol **Regenerate Link** wajib memberi warning bahwa link lama langsung invalid.

Untuk RSVP `open`, **requirement field, normalisasi/dedupe, serta invariant RSVP/attendance berasal dari File 01** dan divalidasi server. File 03 hanya mengatur presentasi field, inline validation/error yang aman, dan recovery UX. Jika respondent kehilangan cookie edit, dashboard owner menjadi jalur koreksi/reset manual; jangan membuat matriks business rule kedua di frontend.

Owner juga mengelola moderasi guestbook:
- Approve
- Reject
- Hide
- Edit/delete bila diperlukan

Pada mode manual, edited wish yang sebelumnya approved/rejected kembali pending; hidden tetap hidden.

#### Upload CSV

CSV memakai `dynamicTyping:false`, `header:true`, validasi Zod, chunk server-side, dan normalisasi nomor WA. Duplicate normalized phone per invitation harus ditampilkan sebagai validation error yang jelas sebelum insert.

#### Broadcast WA

Tombol WA tetap menggunakan link `wa.me`. Personal message sebaiknya memakai URL guest token, bukan `?to=` sebagai identity. Setelah owner menekan kirim, `is_wa_sent` dapat dicatat sebagai progress internal.

---

### 3.5 Halaman Rekening (Amplop Digital)

Halaman rekening mengelola daftar rekening/QRIS yang akan ditampilkan sebagai amplop digital. Field dinamis dapat menggunakan `useFieldArray`, tetapi **effective allowance berasal dari server/domain layer** sesuai File 01; UI tidak membaca nama tier atau meng-hardcode limit.

Jika user mencapai/melewati allowance, tampilkan pesan yang menjelaskan jumlah maksimum/aksi yang tersedia berdasarkan response server. Tombol **Salin Nomor** menggunakan Clipboard API dengan fallback yang kompatibel untuk in-app browser dan memberi feedback singkat setelah berhasil.

### 3.6 Pengaturan

Halaman pengaturan memiliki **Profil** dan **Data & Privacy / Danger Zone**.

UX yang wajib tersedia:

- request export per invitation dan full-account export dengan status `Queued / Processing / Ready / Expired`;
- download hanya ditawarkan ketika backend menyatakan artifact masih valid;
- Delete Account selalu melalui re-auth + critical typed confirmation;
- selama deletion/grace state, UI menjelaskan public access/mutation yang sudah dibatasi dan tanggal/aksi recovery yang dikembalikan backend;
- setelah confirmation berhasil, UI tidak mengasumsikan hard-delete selesai secara sinkron.

Lifetime export link/file, grace period, account state transition, suspension, durable deletion workflow, dan recovery rules mengikuti **File 01 §11/§18** dan File 02.

## 4. Halaman Undangan (Publik)

Halaman undangan adalah produk inti yang dilihat tamu. Desain harus memukau, elegan, dan berfungsi dengan baik di semua perangkat, terutama smartphone. **Feature/data contract tetap konsisten, tetapi composition/order visual boleh berbeda menurut renderer theme** sesuai File 05; File 03 tidak mengunci semua theme ke satu susunan visual. Halaman undangan berada di rute `src/app/(wedding)/[slug]/` dengan `page.tsx` sebagai Server Component (SEO/PIN/state) dan renderer tetap server-compatible sejauh mungkin. Interaktivitas GSAP/audio/floating nav/clipboard dibuat sebagai **client island kecil**; `template.tsx` hanya optional route lifecycle wrapper dan tidak menjadikan seluruh renderer Client Component.

### 4.1 Contract Section & Semantics (Composition oleh Theme)

Nomor subbagian di bawah adalah **label capability/semantics untuk dokumentasi UI, bukan urutan presentasi kanonik**. File 05 menjadi SSoT composition/order renderer. File 03 hanya mensyaratkan agar access gate/entry, closing, dependency event↔venue, business/security/readiness behavior, dan aksesibilitas tetap benar saat theme mengubah composition, divider, typography, photo treatment, atau motion.

#### 1. PIN Gate (Jika Privat)

Private invitation menampilkan PIN gate sebelum konten sensitif. Guest token personal dapat mengenali tamu tetapi tidak menggantikan authorization PIN.

Algoritme PIN, session, brute-force threshold, Turnstile/risk policy, signed-media authorization, dan revocation mengikuti **File 01 §8** dan File 02. UI hanya menampilkan challenge/rate-limit/error yang aman, tanpa membeberkan detail internal yang tidak diperlukan.

#### 2. Cover/Hero

Section pembuka memakai viewport mobile-safe: `min-height: 100svh` dengan fallback `100vh` (dan `100dvh` hanya bila perilaku dynamic viewport sudah diuji). Menampilkan nama mempelai (groom & bride) dengan typography yang menarik sesuai tema. Terdapat tombol "Buka Undangan" yang berfungsi ganda: (1) memicu autoplay musik latar (memenuhi kebijakan autoplay browser yang mengharuskan interaksi user pertama), dan (2) melakukan smooth scroll ke section berikutnya. Animasi masuk section ini harus memukau — envelope opening, split-screen, atau fade-in yang elegan, tergantung tema. Pada desain desktop, area di luar container 480px diisi dengan background blur dari foto pasangan (gambar resolusi rendah maks 200px, bukan foto asli) atau CSS gradient solid sebagai fallback.

#### 3. Doa/Quote

Section singkat yang menampilkan doa pembuka atau kutipan inspiratif. Posisi visualnya mengikuti composition theme. Typography mengikuti **theme typography contract File 05**; Playfair Display hanya fallback/opsi theme, bukan font wajib semua undangan. Section ini opsional — jika user tidak mengisi teks doa, renderer tidak menampilkan content block kosong/ornament yatim.

#### 4. Profil Mempelai

Menampilkan foto dan nama kedua mempelai beserta nama orang tua. Foto mempelai ditampilkan dalam format portrait (vertikal). **Penting:** foto profil mempelai **tidak** dihitung terhadap batas galeri per tier — ini adalah entitas terpisah. Layout bisa bervariasi per tema: side-by-side (desktop), stacked vertical (mobile), atau dengan desain frame dekoratif khusus.

#### 5. Detail Acara

Menampilkan kartu untuk setiap event: nama acara, tanggal, waktu, venue, alamat, serta aksi **Simpan ke Kalender**.

Editor menggunakan konsep `date + localTime + IANA timezone`; server membentuk dan memvalidasi instant sesuai **File 01 §4.4**. UI publik menggunakan `Intl.DateTimeFormat` untuk menampilkan waktu venue dari instant kanonik yang sama. Jangan membuat storage/offset contract kedua di File 03.

#### 6. Peta Lokasi

File 03 hanya menentukan **UX capability map**, bukan provider/runtime/CSP. Provider aktif, URL construction/allowlist, API key, dependency MapLibre/OpenFreeMap, dan CSP conditional seluruhnya dimiliki **File 01 §1/§21**.

UI menerima data/presentation state yang sudah tervalidasi, minimal:

```text
venueName
address
navigationUrl
mapPresentation?   # provider-specific payload dari trusted boundary
```

Aturan UX:
- alamat teks + tombol **Buka Navigasi** selalu tersedia, termasuk ketika embedded map gagal/tidak tersedia;
- embedded map lazy-loaded dan mempunyai ukuran/aspect ratio stabil agar tidak menyebabkan layout shift;
- theme boleh mengatur frame/placement/compact-vs-full presentation sesuai File 05, tetapi tidak menghapus akses fungsional ke lokasi ketika `mapPresentation` tersedia;
- bila map gagal load, tampilkan fallback alamat/navigation tanpa error teknis provider;
- pada mobile, hindari scroll-trap; overlay “Ketuk untuk berinteraksi dengan peta” boleh dipakai berdasarkan hasil device testing, bukan sebagai provider policy.

File 03 **tidak** menduplikasi CSP `frame-src`, origin tile/style/worker, billing/quota, atau aturan dual-runtime map.

#### 7. Cerita Cinta

Cerita cinta memakai contract data **tanggal (opsional), judul, body, dan foto opsional**. File 03 tidak mengunci bentuknya menjadi timeline vertikal. Renderer File 05 boleh memilih vertical timeline, alternating editorial, chapter/newspaper, film/contact-sheet, atau composition lain selama urutan/content tetap terbaca, responsif, dan accessible.

#### 8. Galeri

Gallery menampilkan foto final dengan urutan/caption yang diterima renderer. **Composition tidak dikunci ke grid/masonry**: theme boleh memakai editorial masonry, strict grid, soft collage, framed hero + secondary images, ornamental portrait sequence, contact sheet, atau carousel yang sesuai File 05. Shared UX tetap mewajibkan responsive image, placeholder stabil, lazy loading, serta lightbox/interaction yang accessible bila digunakan.

Source-of-truth media/gallery, state `ready`, quota reservation, entitlement allowance, serta serving private media mengikuti **File 01 §4/§5/§16**. Theme/UI tidak menghitung atau mengubah limit sendiri.

#### 9. Video (Capability-Based)

Section video hanya muncul bila renderer menerima capability aktif. MVP menggunakan external embed yang sudah divalidasi dan lazy-loaded. Entitlement gating, allowlist, dan uploaded-video policy mengikuti **File 01**; File 03 tidak hardcode tier/capability.

#### 10. RSVP & Buku Tamu

UI mendukung personalized/private/open RSVP sesuai authorization result dari server. Open RSVP tanpa personal token meminta nama + nomor WhatsApp; edit authority dan identity tidak ditentukan oleh UI.

Authorization matrix, token/edit-cookie semantics, attendance invariant, rate limit/Turnstile, raw-table isolation, dan guestbook moderation mengikuti **File 01 §8** dan File 02. UI hanya mengirim input yang diperlukan, menampilkan result/error aman, dan tidak mengakses raw `guests`.

#### 11. Amplop Digital

Menampilkan rekening/QRIS yang sudah diizinkan renderer dan tombol **Salin Nomor**. Gunakan Clipboard API dengan fallback yang kompatibel untuk in-app browser.

Jumlah rekening, entitlement, storage/media authorization, dan source-of-truth data mengikuti File 01; UI tidak hardcode limit berdasarkan nama tier.

#### 12. Penutup & Footer

Menampilkan pesan penutup dan credit/watermark sesuai data efektif yang diberikan renderer. UI tidak menentukan entitlement atau watermark dari nama tier; source-of-truth mengikuti File 01.

### 4.2 Navigasi Undangan

#### Floating Bottom Navbar

Navigasi utama halaman undangan menggunakan **Floating Bottom Navbar** yang fixed di bagian bawah layar. Navbar menampilkan ikon untuk section utama: Home (Cover), Mempelai, Acara, Galeri, dan Amplop. Klik ikon melakukan scroll ke section terkait; gunakan `behavior: 'smooth'` hanya bila user **tidak** meminta reduced motion, dan `behavior: 'auto'` ketika `prefers-reduced-motion: reduce`. Navbar harus tetap terlihat saat user scroll dan tidak mengganggu konten.

#### In-App Browser Handling

Pengguna sering membuka undangan dari In-App Browser yang memiliki browser chrome/bottom bar sendiri. **Safe-area tidak boleh bergantung pada user-agent sniffing.** Gunakan `viewport-fit=cover` dan `padding-bottom: env(safe-area-inset-bottom)` sebagai baseline CSS pada floating control yang relevan; browser yang tidak mendukung env akan mengabaikannya.

UA/IAB detection hanya boleh menjadi targeted workaround setelah device testing membuktikan bug spesifik dan tidak boleh menjadi syarat untuk safe-area. Navbar juga harus **bisa ditutup (dismissed)** oleh pengguna melalui gesture/tombol yang accessible. Bila navbar disembunyikan, action penting tetap tersedia melalui alur konten/sticky action yang tidak tertutup browser chrome.

#### Desktop

Pada desktop, konten undangan **tidak** ditarik full-width. Konten dibatasi dalam container maksimal **480px** yang di-center di tengah layar, mensimulasikan tampilan mobile. Area di luar container diisi dengan **background blur** dari foto pasangan menggunakan gambar resolusi rendah (maks 200px, bukan foto asli) atau **CSS gradient solid** sebagai fallback jika gambar belum dimuat. Gambar background diberi `loading="lazy"` agar tidak membebani initial paint.

### 4.3 Musik

Kontrak teknis Howler/controller/asset lifecycle berada di **File 05 §26** dan File 01. File 03 hanya menetapkan UX:

- playback pertama terjadi setelah gesture **Buka Undangan**;
- kontrol play/pause selalu mudah dijangkau;
- error audio tidak memblokir isi undangan;
- navigation/theme lifecycle tidak boleh menghasilkan dua audio yang bermain bersamaan.

### 4.4 Animasi & Motion UX

Implementasi GSAP, plugin, lifecycle, motion preset, dan performance budget berada di **File 05 §24/§33**. File 03 menetapkan pengalaman:

- motion tidak boleh menghambat native scrolling, focus, dialog, atau pembacaan konten;
- `prefers-reduced-motion` wajib menghasilkan pengalaman lengkap tanpa choreography kompleks;
- landing/dashboard lebih restrained, sedangkan invitation theme boleh lebih cinematic;
- tier tidak boleh menghasilkan accessibility regression.

### 4.5 Dynamic Theming

Visual token wedding tidak mengikuti dark mode platform. UI menerima theme design token/renderer yang sudah tervalidasi; metadata, registry, entitlement, dan teknik implementasi CSS variable mengikuti **File 01** dan **File 05**. Jangan membuat source-of-truth theme kedua di komponen UI.

### 4.6 SEO & Social Preview

Public invitation harus memiliki preview link yang representatif, sedangkan private invitation memakai metadata generik yang tidak membocorkan nama/foto/venue/detail privat.

OG generation, stable media URL, cache invalidation/versioning, guest-token identity, signed-media prohibition, dan route-cache policy mengikuti **File 01 §5/§8/§10**. UI/copy hanya memastikan judul/deskripsi/preview yang ditampilkan sesuai privacy state dan tetap konsisten saat konten berubah.

### 4.7 UX Pembayaran Midtrans

State machine, idempotency, provider verification, cancellation/refund, entitlement application, dan race handling mengikuti **File 01 §7** dan File 02. File 03 hanya mengatur pengalaman:

- sebelum checkout, tampilkan paket, durasi, harga, dan konsekuensi publish secara jelas;
- `Bayar & Publish` tidak membutuhkan dialog “yakin?” tambahan bila review sudah eksplisit;
- setelah callback browser, tampilkan state **sedang diverifikasi** sampai backend memastikan hasil;
- payment pending/cancel/retry/requires-review harus memiliki status dan aksi yang tidak menjanjikan hasil sebelum server/provider mengonfirmasi;
- funded tetapi belum publish-ready menampilkan paket aktif tanpa meminta pembayaran kedua.

## 5. Dashboard Admin & Security Governance

Dashboard admin adalah interface terpisah. Role server-side terbaru wajib diverifikasi; menyembunyikan tombol di UI bukan authorization.

### 5.1 Overview

Stat cards dapat menampilkan total user, invitation published, revenue settled, growth, payment incident, dan operational health sesuai permission. Jangan menampilkan PII sensitif pada overview.

### 5.2 Manajemen User

Admin dapat mencari metadata aman seperti email, user ID, status akun, tanggal dibuat, dan role. Pencarian default tidak mengindeks guest notes/private content.

`user -> admin` hanya dapat dilakukan super-admin setelah re-auth dan konfirmasi. Penurunan role ke `user` harus menginformasikan bahwa privileged sessions akan dicabut.

### 5.3 Manajemen Undangan & Temporary Support Access

Admin normal melihat metadata invitation: owner, slug, status, theme/tier, expiry, payment state. Isi privat user **tidak otomatis terbuka**.

Jika support diperlukan:

```text
Request Support Access
-> pilih invitation
-> reason code + optional note
-> re-authentication
-> read-only access sampai `expiresAt` yang dikembalikan backend
```

TTL support grant adalah policy File 01 dan **tidak di-hardcode di File 03**. UI selalu menampilkan scope + countdown dari `expiresAt` server. Grant terikat ke Supabase Auth `session_id` yang membuat grant; request dari session lain ditolak. Backend memastikan session tersebut masih aktif pada setiap request support content sehingga logout/revoke segera memutus akses meskipun JWT lama belum expired. Tombol **Elevate to Write** memerlukan re-authentication lagi, reason baru, dan hanya membuka mutation yang di-whitelist.

Secret/credential tidak pernah dirender. Guest phone/notes hanya muncul bila support scope memang mengizinkan. Private media menggunakan signed URL setelah grant valid.

### 5.4 Manajemen Tema, Tier & Produk Retention

Perubahan admin yang berdampak pada katalog/komersial memakai high-impact confirmation dengan **impact preview**. Contoh perubahan harga harus menjelaskan bahwa harga baru hanya berlaku sesuai contract transaksi baru dan tidak mengubah snapshot hak yang sudah dibeli. Disable theme, suspend invitation, role change, dan destructive bulk action tidak boleh hanya mengandalkan Sonner action.

Theme hanya desain + required tier. Harga/limit/durasi berasal dari tabel `tiers`. Admin theme membedakan **broad `category`** dari **`catalog_tags` discoverability**; tag dinormalisasi/ditolak server sesuai File 01 dan tidak boleh dipakai sebagai entitlement gate. Draft extension dikelola melalui `draft_extension_products`. **Monotonic tier/capability adalah invariant server File 01**: UI admin menampilkan validation result + impact preview dari mutation contract, tetapi tidak meng-hardcode ordering/aturan tier sebagai sumber kebenaran kedua.

### 5.5 Security Activity

Owner mempunyai `Settings -> Security -> Security Activity` per invitation. Admin/super-admin juga memiliki console audit sesuai permission.

Owner melihat timeline sanitized seperti:

```text
PIN diubah
Mode privacy diubah
Aktivitas PIN mencurigakan terdeteksi
Heightened protection selesai
Admin support mengakses invitation
```

Owner tidak melihat `ip_hash`, limiter internals, server identifiers, atau secret metadata. Timeline owner read-only.

### 5.6 PIN Security Incident UI

UI security incident mengikuti incident state yang dikembalikan backend; **threshold, risk window, recovery timing, dan PIN policy tidak diduplikasi di File 03** dan mengikuti File 01/02.

Owner melihat critical/recovery state yang dapat dipahami serta aksi security yang tersedia (mis. ubah PIN, privacy setting, revoke session) sesuai authorization server. PIN lama/secret tidak pernah ditampilkan kembali.

### 5.7 Super-Admin Governance

UI governance menampilkan requestor, target, current role, target role, reason, approval state, dan blocked/degraded reason yang dikembalikan backend.

Quorum, approver eligibility, degraded-mode threshold, bootstrap recovery, session revocation, dan authorization mengikuti **File 01 §9** / File 02. UI tidak menyalin aturan governance sebagai logic client.

### 5.8 Audit Purge UI

UI purge hanya tersedia ketika backend mengembalikan permission/action contract yang sesuai. Tampilkan target/filter, impact preview/count, reason, approval state, dan typed confirmation bila diwajibkan.

Batch limit, protected-event rule, re-auth, quorum/emergency approval, dan atomic audit semantics mengikuti **File 01 §9** / File 02; jangan diimplementasikan sebagai policy kedua di client.

### 5.9 Operations: Jobs, Export & Delivery

Admin Operations menampilkan status yang sudah disanitasi:

- failed background jobs + retry hanya bila backend menandai retry-safe;
- scheduler/cron health dan outbox backlog;
- media processing failure;
- email delivery/bounce summary;
- payment reconciliation backlog;
- export/deletion workflow state.

Permission, support-scope exclusion, retry semantics, dan operational thresholds mengikuti File 01/02/04. UI tidak membuat privileged operation hanya karena tombol/action tersedia.

### 5.10 Beranda CMS & Leads

Beranda CMS dan Leads tetap dikelola sesuai permission. Perubahan CMS tidak boleh menjadi jalur untuk memasukkan script/raw HTML berbahaya.

## 6. Performa

Performa adalah prioritas utama karena target market dan benchmark wedding Indonesia bersifat mobile-dominant dengan kualitas koneksi yang bervariasi. Persentase device weplan sendiri harus berasal dari first-party analytics setelah launch, bukan asumsi permanen. Setiap keputusan teknis harus mempertimbangkan dampaknya terhadap waktu loading dan responsivitas.

### 6.1 Optimasi Gambar

Renderer menggunakan image source/variant yang sudah disiapkan pipeline kanonik. Gunakan `sizes` responsif agar device tidak mengunduh variant terbesar tanpa perlu; client-side compression bukan security sanitizer.

Gunakan `next/image` bila sesuai dengan private-media loader/endpoint strategy. Blur placeholder hanya dipakai bila pipeline menyediakan LQIP/`blurDataURL`; jika tidak, pertahankan dimensi/aspect-ratio stabil dan skeleton/background ringan. Background blur desktop memakai derived low-resolution asset atau CSS gradient, bukan foto asli besar.

Media state, signing, authorization, dan credential lifetime mengikuti **File 01 §5/§16**.

### 6.2 Lazy Loading

Section yang berada di bawah fold (bawah viewport awal) di-lazy load menggunakan `next/dynamic` dengan prop `loading: () => <Skeleton />` atau Intersection Observer. Ini mencakup: iframe peta (native `loading="lazy"`), galeri foto, video embed, serta plugin GSAP/komponen berat yang tidak diperlukan above-the-fold. Komponen yang pertama kali terlihat (hero, cover) **tidak** di-lazy load agar pengalaman pertama pengguna instan.

### 6.3 Prefetch Strategy

Strategi prefetch diatur secara selektif, bukan semua-or-tidak-sama-sekali:
- **Default/prefetch aktif:** route public statis/ringan seperti landing, katalog, legal/guide; authenticated route ringan boleh mengikuti default hanya setelah diukur. **Settings dan Dashboard bukan halaman statis** karena membaca data akun.
- **`prefetch={false}`:** link massal/grid menuju halaman data-heavy seperti tabel tamu/detail/edit invitation. Tujuannya mencegah banyak fetch background ketika daftar panjang di-scroll; keputusan ini harus diuji ulang saat versi Next.js berubah karena strategi prefetch dapat berkembang.

Pada halaman yang tidak di-prefetch, **wajib** menyediakan **skeleton loading state** untuk menghindari layar kosong saat navigasi. Skeleton memberikan indikasi visual bahwa konten sedang dimuat.

### 6.4 Bundle Optimization

Code splitting dilakukan per route secara otomatis oleh Next.js App Router. Selain itu, beberapa optimasi manual diterapkan:
- **GSAP core/plugin** hanya dimuat pada wedding theme yang benar-benar membutuhkan; plugin advanced tidak di-import global.
- **Howler.js** hanya di-load ketika invitation memiliki audio `ready` dan audio diizinkan entitlement.
- **Map capability** mengikuti provider aktif dari File 01; UI hanya memuat presentation map ketika dibutuhkan dan tetap lazy/fallback-safe.
- `next-themes` hanya berada pada layout dashboard/admin dynamic; landing/static memakai CSS system theme.
- Font menggunakan `next/font/google` untuk meminimalkan layout shift.

### 6.5 Background Images

Untuk efek background blur di halaman undangan desktop, gunakan gambar resolusi maks 200px yang sudah di-blur via CSS. Jangan gunakan foto resolusi penuh (2-5MB) untuk background blur karena akan memicu GPU compositing berat di monitor 4K. CSS gradient solid selalu disediakan sebagai fallback. Gambar background diberi `loading="lazy"` agar tidak membebani initial paint.

---

### 6.6 Caching Public vs Personalized

UI/renderer membedakan public-cacheable content dari private/personalized content berdasarkan server contract. Public edit harus terlihat setelah invalidation/revalidation selesai; private/personalized page tidak boleh memperoleh stale/shared representation yang membocorkan data user.

Detail cache key/tag, stable media endpoint, signed credential, auth cookie, Proxy matcher, dan no-store rules mengikuti **File 01 §5/§10/§21**. File 03 hanya memastikan loading/error/update UX tetap benar ketika cache sedang direvalidate.

### 6.7 Async UX

Operasi lama (media processing, export, account deletion workflow) memakai persisted server status + polling/realtime yang scoped, bukan spinner request tunggal. Page refresh tidak boleh kehilangan status job.

Implementasi status job tidak boleh mengasumsikan request Cloudflare Worker tetap hidup sampai proses selesai; UI mengikuti state persisted dari database/queue/workflow.

### 6.8 Conversion Metrics & Experimentation

MVP tidak membutuhkan third-party analytics SDK. Simpan event first-party minimal dan privacy-safe:

```text
landing_view
theme_open
theme_demo
personal_preview_start
personal_preview_complete
auth_start
draft_synced
editor_open
checkout_start
payment_funded
```

Jangan merekam nama tamu, nomor WA, PIN, guest token, atau content private sebagai analytics payload.

A/B testing framework **bukan dependency MVP**. Awali dengan sequential copy/layout experiments menggunakan configuration flag sederhana dan bandingkan funnel. Jika traffic sudah cukup untuk simultaneous experiment, baru tambahkan assignment first-party yang kecil; jangan memasang experimentation SaaS berbayar.

## 7. Aksesibilitas

Aksesibilitas memastikan aplikasi bisa digunakan oleh semua orang, termasuk pengguna dengan keterbatasan fisik atau teknologi asisten. Meskipun target utama adalah smartphone, standar aksesibilitas tetap diterapkan untuk menjangkau audiens seluas mungkin dan memenuhi regulasi yang berlaku.

### 7.1 Semantic HTML

Seluruh halaman menggunakan elemen HTML semantik yang benar: `<header>` untuk bagian atas halaman, `<nav>` untuk navigasi, `<main>` untuk konten utama, `<section>` untuk setiap bagian konten, `<article>` untuk konten mandiri, `<aside>` untuk konten samping, dan `<footer>` untuk bagian bawah. Penggunaan semantic HTML bukan hanya soal aksesibilitas — ini juga meningkatkan SEO karena search engine lebih mudah memahami struktur halaman.

### 7.2 ARIA Labels

Semua elemen interaktif yang tidak memiliki teks deskriptif yang jelas (misalnya ikon saja tanpa label teks) **wajib** memiliki `aria-label`. Contoh: tombol hamburger menu harus memiliki `aria-label="Menu"`, tombol toggle musik harus memiliki `aria-label="Toggle Musik"`, tombol copy rekening harus memiliki `aria-label="Salin nomor rekening"`. Elemen yang berubah state (toggle, accordion) menggunakan `aria-expanded` dan `aria-controls`.

### 7.3 Focus Management

Saat modal atau dialog terbuka, focus dipindahkan sesuai primitive semantik dan dikembalikan ke trigger saat ditutup. `Dialog`, `AlertDialog`, dan `Sheet` dari shadcn/ui menangani focus trap; jangan membuat custom modal baru. Untuk confirmation destructive, jangan sengaja menempatkan initial focus pada tombol destructive jika cancel/neutral action lebih aman.

### 7.4 Kontras Warna

Rasio kontras minimum antara teks dan background adalah **4.5:1** untuk teks normal dan **3:1** untuk teks besar (18px+ atau 14px+ bold). Target aksesibilitas adalah **WCAG 2.2 Level AA**. Saat mendesain tema undangan, pastikan kombinasi warna yang dipilih memenuhi rasio ini. Gunakan tools seperti WebAIM Contrast Checker untuk memverifikasi. next-themes juga harus memastikan bahwa baik mode light maupun dark mode memenuhi standar kontras.

### 7.5 Navigasi Keyboard

Semua form harus bisa dinavigasi menggunakan keyboard saja (Tab, Shift+Tab, Enter, Escape). CTA/control penting pada mobile menggunakan target praktis minimal sekitar 44px walaupun WCAG minimum lebih kecil. Tombol dan link harus memiliki focus indicator yang terlihat (outline atau ring). Jangan menghapus focus outline tanpa menyediakan alternatif yang setara jelasnya — pengguna yang mengandalkan keyboard perlu tahu di mana posisi focus mereka. Halaman undangan juga harus bisa di-scroll menggunakan keyboard (Page Up/Down, Space, Arrow keys) tanpa hambatan.

