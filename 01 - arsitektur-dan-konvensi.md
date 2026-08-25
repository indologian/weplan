# Arsitektur & Konvensi — Platform Undangan Pernikahan Digital (weplan)

> **REVISI KANONIK — 25 Agustus 2026**
>
> Dokumen ini telah diselaraskan dengan seluruh keputusan produk #1–#248, recommendation-mode setelahnya, dan keputusan migrasi target production ke Cloudflare Workers pada 24 Agustus 2026. Untuk **business/domain/database/runtime invariant**, dokumen ini yang berlaku. Untuk aturan yang secara eksplisit dimiliki dokumen spesialis (UI/UX atau wedding renderer), gunakan ownership matrix di bawah dan jangan membuat salinan kedua di File 01.
>
> Prinsip inti yang sudah dikunci:
> - `FREE` hanya kartu marketing/pricing di landing page; **tidak ada theme FREE dan tidak ada entitlement FREE**.
> - Tier riil hanya `BASIC`, `PREMIUM`, `VIP` dan melekat pada kebutuhan theme/entitlement invitation, **bukan user**.
> - Semua user boleh membuat draft dan mencoba theme tier mana pun; publish memerlukan pembayaran entitlement sesuai tier theme.
> - Harga, fitur, limit, watermark, dan durasi berasal dari tabel `tiers`; theme hanya menentukan desain + `tier_id` minimum.
> - Hak yang sudah dibeli disimpan sebagai `entitlement_snapshot` JSONB pada invitation.
> - Semua media berada di bucket private dan serving mengikuti media-access policy kanonik di §5; jangan menyalin TTL ke layer UI/renderer.
> - Tabel `guests` tidak pernah dibaca/ditulis langsung oleh anonymous client; akses publik melalui RPC aman dengan field whitelist.
> - Distributed Redis dipakai untuk rate limiting dan IP dipseudonimkan dengan HMAC sebelum menjadi key.
> - Brute-force PIN memakai Redis terdistribusi, Turnstile adaptif, proteksi lintas-IP tanpa global hard-lock, serta risk/security-incident policy kanonik di §8.
> - **Zero-cost MVP baseline:** seluruh dependency/layanan inti harus dapat dijalankan pada plan gratis/open-source selama masih berada dalam kuota. Tidak boleh ada fitur inti yang diam-diam membutuhkan subscription berbayar. Payment processing fee Midtrans adalah biaya transaksi ketika ada pembayaran, bukan subscription software.
> - **Simplicity-first:** gunakan satu solusi untuk satu masalah; jangan menambah state manager, carousel library, analytics SaaS, AI API, map engine kedua, atau animation engine kedua bila kebutuhan dapat diselesaikan oleh React/RHF, CSS, Server Components, atau dependency yang sudah ada.
> - **Conversion semantics:** copy tidak boleh menyiratkan publish gratis; `FREE` hanya pengalaman membuat/preview draft. Detail palette, CTA hierarchy, geometry, dan copy presentation dimiliki File 03.

> **SINGLE SOURCE OF TRUTH utama File 01:** arsitektur, tech stack/runtime, database/domain model, business rules, lifecycle/state machine, payment/entitlement, security invariant teknis, struktur source tree, dan konvensi koding.
>
> **Ownership lintas-dokumen (anti-drift):**
>
> | Dokumen | SSoT untuk | Tidak boleh menjadi SSoT kedua untuk |
> |---|---|---|
> | **File 01 — Arsitektur & Konvensi** | domain, DB, runtime, business/security invariant, API/use-case contract, source tree | detail visual/interaction renderer |
> | **File 02 — Panduan Keamanan** | checklist/hardening/verifikasi security | angka threshold/state/schema yang sudah kanonik di File 01 |
> | **File 03 — Panduan UI/UX** | design tokens platform, component geometry, z-index, interaction, copy, accessibility, user-visible state | business rule/payment/lifecycle authority |
> | **File 04 — Enterprise Security & Edge-Cases** | failure mode, race, recovery, rare/capacity edge case | normal-flow state machine |
> | **File 05 — Panduan Tema Undangan** | wedding renderer, art direction, section composition, theme visual/motion/media presentation | entitlement, pricing, security, lifecycle |
>
> Bila dua dokumen tampak membahas konsep yang sama, **dokumen pemilik pada tabel di atas menang untuk bidangnya**. Dokumen lain hanya boleh merujuk atau menjelaskan projection/UX-nya, bukan menyalin nilai kanonik.
>
> Menggantikan `implementation_plan.md` lama.
> Terakhir diperbarui: 25 Agustus 2026

> **STABILISASI MVP — 25 Agustus 2026**
>
> File 01 tetap mendefinisikan **invariant yang benar ketika suatu capability aktif**. Urutan pengerjaan dan milestone tidak menjadi SSoT kedua di dokumen ini; execution roadmap akan dirujuk dari File 06. Karena itu, capability yang belum diaktifkan pada launch **tidak boleh diimplementasikan setengah** atau melemahkan invariant di sini hanya demi mengejar scope.
>
> Klasifikasi implementasi:
> - **launch-critical correctness:** auth/authorization, create/edit/preview, payment→entitlement→publish, public/private rendering, guest/RSVP/wishes, media image yang diaktifkan, lifecycle/retention minimum, backup, security baseline, dan observability jalur kritis;
> - **activated-on-demand:** queue/workflow hanya pada side effect atau proses multi-step yang benar-benar membutuhkan durability;
> - **deferred capability:** fitur yang secara eksplisit disebut future/disabled di dokumen ini tetap tidak aktif sampai dependency, budget, QA, dan runbook-nya siap.
>
> **Invariant biaya/correctness:** target launch adalah **zero fixed subscription cost**, bukan asumsi bahwa free tier akan selalu tersedia atau selalu cukup. PostgreSQL/domain state tetap authoritative. Exhaustion/outage Redis, queue, email, map, analytics, atau provider non-authoritative harus menghasilkan degraded mode/alert/retry yang aman sesuai fungsi masing-masing; tidak boleh mengubah funded entitlement, authorization, lifecycle, atau membuka akses secara fail-open.

---

## 1. Tech Stack

Prinsip pemilihan dependency: **stabil, dapat diuji, security boundary jelas, dan tidak mengunci correctness pada free-tier tertentu**. Nomor versi package wajib di-pin pada implementasi dan lockfile wajib dikomit; dokumen ini tidak menganggap angka kuota provider sebagai kontrak permanen.

### 1.1 Framework & Core

| Teknologi | Versi | Fungsi | Aturan |
|---|---|---|---|
| **Next.js App Router** | versi production yang telah diuji & dipin | Full-stack web | Server-first, Server Components default, Route Handlers/Server Actions hanya untuk boundary yang sesuai. |
| **React** | mengikuti Next.js yang dipin | UI | Konten user dirender sebagai text node; raw HTML tidak digunakan kecuali ada kebutuhan eksplisit + sanitizer teruji. |
| **TypeScript** | versi production yang dipin | Type safety | `strict` wajib; `any` dibatasi pada adapter eksternal yang tervalidasi. |

### 1.2 Styling & UI

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **Tailwind CSS** | Utility CSS | Design token melalui CSS variables; hindari dynamic class string yang tidak dapat dipurge/compile aman. |
| **shadcn/ui** | Komponen dashboard/form | Gunakan primitive resmi yang diperlukan saja. `AlertDialog` untuk keputusan/confirmation penting, `Dialog`/`Sheet` untuk workflow/form; jangan install modal library kedua. |
| **next-themes** | Dark mode dashboard/admin | Hanya untuk route authenticated/dynamic; konfigurasi `light|dark|system`, CSP tidak boleh membuka `unsafe-inline` global. Landing/static public memakai CSS `prefers-color-scheme`; tema invitation tetap memakai token visual sendiri. |
| **Lucide React** | Ikon | Import per ikon/tree-shakable. |
| **Sonner** | Toast/feedback | Satu-satunya toast system. Untuk success/error/warning/loading singkat; **bukan** safety confirmation. Error penting tetap memiliki state halaman yang persisten. |

### 1.3 Forms, Validation & Client State

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **React Hook Form** | Form wizard + state editor | `FormProvider`, `useFieldArray`, `watch/useWatch`, dan `reset()` menjadi satu sumber state form di client; jangan menduplikasi state form ke store lain. |
| **Zod** | Schema validation | Validasi ulang di server untuk seluruh mutation, queue payload version, JSONB, dan external response yang penting. |
| **React state/context** | UI state kecil | Hanya untuk state lokal non-form seperti dialog, audio controller, atau status visual. Hindari global store bila state tidak benar-benar lintas-route. |

**Zustand tidak menjadi dependency baseline.** React Hook Form + React state/context sudah mencukupi scope MVP dan menghindari dua source-of-truth client yang rawan drift. Tidak memakai Immer. Untuk nested update gunakan helper murni dan struktur state yang tidak terlalu dalam.

### 1.4 Database, Auth & Storage

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **Supabase PostgreSQL** | Database | RLS pada seluruh tabel exposed; owner-by-default. |
| **Supabase Auth + `@supabase/ssr`** | Authentication | Authorization tidak bergantung pada user-editable metadata/JWT stale. Role terbaru dicek server-side untuk operasi privileged. |
| **Supabase Storage** | Active media storage | Bucket final dan quarantine private; tidak ada public bucket untuk invitation media. |
| **Supabase Cron / pg_cron** | Scheduler timestamp scan | Scheduler kanonik untuk job sub-harian/daily yang dekat dengan database. Cron hanya menemukan work yang due; eksekusi berat tetap ke outbox/queue. |

### 1.5 Payment

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **Midtrans Snap** | Checkout | Harga/entitlement dihitung server-side, snapshot penuh saat checkout, webhook signature + Status API + atomic DB transition. |

### 1.6 Async Jobs & Durable Workflow

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **Cloudflare Queues** | Durable async event delivery | Guaranteed/at-least-once delivery semantics: semua consumer wajib idempotent. Payload minimal, retry terkontrol, dan failed-job ledger tetap di database. |
| **Cloudflare Workflows** | Multi-step durable orchestration | Hanya untuk workflow panjang/stateful seperti account deletion atau export besar; bukan untuk setiap job sederhana. |
| **Transactional Outbox (Postgres)** | DB→queue reliability | Business mutation + outbox insert dalam satu transaksi; dispatcher mengirim event ke Cloudflare Queues. |

**Supabase Cron / pg_cron tetap scheduler kanonik** untuk scan timestamp sub-harian/daily. Cloudflare Cron Triggers boleh dipakai untuk kebutuhan edge-specific, tetapi bukan sumber kebenaran lifecycle invitation.

### 1.7 Media Processing

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **WASM image processor pada Supabase Edge Function Free** | Image decode/resize/re-encode | Baseline MVP: proses gambar di Edge Function berbasis WASM yang diuji; strip metadata dan hasilkan derived variants. Cloudflare request Worker tidak melakukan decode/resize berat. |
| **FFmpeg-capable dedicated runtime** | Future uploaded-video/audio transcoding | **Bukan dependency MVP zero-cost.** Video MVP memakai external embed allowlisted (mis. YouTube). Uploaded video/transcoding baru boleh diaktifkan jika compute gratis yang kompatibel telah dibenchmark dan operasionalnya tetap $0; jika tidak, fitur tetap disabled. |

Client-side compression boleh digunakan sebagai optimasi bandwidth, **bukan security sanitizer** dan bukan sumber validasi final. Audio upload hanya diaktifkan untuk format/size yang pipeline ringan tervalidasi mampu proses; jangan memaksakan transcode berat demi mempertahankan fitur.

### 1.8 Maps, Audio, CSV & Animation

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **Google Maps Embed API** | Embedded venue map | Provider map utama. Render melalui `<iframe>`; saat revisi ini SKU Embed Rp0/unlimited tetapi tetap membutuhkan Google Cloud API key + billing account. Key dibatasi **Maps Embed API only** + HTTP referrer domain produksi. Jangan mengaktifkan Places/Geocoding/Dynamic Maps hanya untuk editor. |
| **MapLibre GL JS + OpenFreeMap** | Contingency map provider | Alternatif gratis tanpa API key bila kebijakan/billing Google tidak dapat digunakan. Bukan dual-runtime default MVP: pilih satu provider melalui konfigurasi agar kode tidak memelihara dua map engine sekaligus. Public OpenFreeMap tidak memiliki SLA; attribution wajib. |
| **Howler.js** | Playback audio | Dipertahankan untuk cross-browser audio/fade/autoplay handling. Lazy-load hanya jika invitation memiliki audio `ready`; state audio scoped ke wedding renderer/context, bukan global Zustand store. |
| **PapaParse** | CSV guest import | Parse/preview client boleh; server tetap memvalidasi row dan batas jumlah. |
| **CSS animations** | Micro-interaction & simple motion | Hover, transition sederhana, fallback reduced-motion. |
| **GSAP 3.13+ + `@gsap/react`** | Animation engine semua tier | BASIC/PREMIUM/VIP boleh memakai GSAP. Import/register plugin selektif (`ScrollTrigger`, `SplitText`, `DrawSVG`, `MorphSVG`, `MotionPath`, dll.) hanya bila theme membutuhkan. Jangan campur engine animasi lain pada property/element yang sama. |

**Lisensi GSAP:** penggunaan komersial dan plugin yang sebelumnya members-only diperbolehkan tanpa biaya berdasarkan Standard GSAP License saat baseline ini dibuat. Produk ini menggunakan GSAP untuk prebuilt invitation themes, **bukan** visual no-code animation builder yang bersaing dengan Webflow. Lisensi tetap diverifikasi ulang saat major upgrade.

**Animation safety:** gunakan `useGSAP()`/`gsap.context()` + cleanup, `gsap.matchMedia()` untuk `prefers-reduced-motion`, dan `ScrollTrigger` untuk lifecycle scroll. Hindari scroll-jacking/`ScrollSmoother` sebagai default; animasi harus mempertahankan native scrolling dan keyboard accessibility. Komponen yang menjalankan GSAP harus berupa client-island kecil (`'use client'`), bukan mengubah seluruh wedding page menjadi Client Component. `SplitText` hanya untuk teks dekoratif/heading dan tidak boleh merusak nama/label semantik atau accessible name.

### 1.9 Anti-Bot, Rate Limit & Email

| Teknologi | Fungsi | Aturan |
|---|---|---|
| **Cloudflare Turnstile** | Adaptive challenge | Free baseline; selalu diverifikasi server-side dan hanya dimunculkan saat risk/policy memang memerlukan. |
| **Upstash Redis Free (REST)** | Distributed rate limiting/risk state | Baseline provider karena REST cocok untuk Cloudflare Workers dan free tier tersedia. IP dipseudonimkan dengan HMAC sebelum persistence. Jangan memakai Redis pada setiap render halaman normal agar kuota tidak terbuang. |
| **Resend Free** | Transactional email + custom SMTP Supabase Auth | Baseline email $0 selama kuota free mencukupi. Pengiriman business email melalui queue, template versioned, webhook delivery/bounce diproses idempotent. |

### 1.10 Security Rendering

- Native React text rendering adalah default untuk semua input user (`wish_message`, nama, notes yang ditampilkan).
- **DOMPurify tidak menjadi dependency default** karena produk tidak membutuhkan user-authored HTML.
- Jika di masa depan ada rich text/HTML, feature tersebut harus mempunyai sanitizer terpisah, allowlist, CSP, dan security review sebelum diaktifkan.

### 1.11 Hosting & Environment

| Layanan | Fungsi | Aturan |
|---|---|---|
| **Cloudflare Workers Free + `@opennextjs/cloudflare`** | Next.js hosting/deployment | Target production MVP kanonik $0 selama kuota mencukupi. App Router/SSR/SSG/ISR/Server Actions berjalan melalui OpenNext. |
| **Cloudflare Queues / Workflows Free** | Async delivery/orchestration | Gunakan hanya untuk side effect/job yang memang perlu durability; jangan mengubah setiap aksi kecil menjadi job. Correctness payment/lifecycle tetap atomic di PostgreSQL. |
| **Supabase Free** | PostgreSQL/Auth/Storage/Cron/Edge Functions | Baseline MVP. Fitur berbayar seperti Image Transformations/PITR/custom domain Supabase bukan dependency. Arsitektur tetap harus bisa pindah plan nanti tanpa mengubah business rules. |

### 1.11.1 Zero-Fixed-Cost MVP Baseline

Target operasional launch adalah **Rp0 fixed subscription infrastructure** selama penggunaan masih di dalam kuota gratis. Ini adalah target biaya operasional awal, **bukan correctness assumption**. Provider/version/kuota wajib diverifikasi ulang sebelum launch karena dapat berubah.

| Kebutuhan | Baseline $0 | Aturan anti-biaya/anti-bug |
|---|---|---|
| Hosting web | Cloudflare Workers Free | Static/ISR sebanyak mungkin; request dynamic tetap ringan. |
| Queue | Cloudflare Queues Free | Payload kecil; hanya job penting; monitor operasi harian. |
| Workflow | Cloudflare Workflows Free | Hanya proses multi-step panjang; jangan dipakai untuk operasi CRUD normal. |
| DB/Auth/Storage | Supabase Free | Tidak bergantung pada paid image transform/PITR; monitor DB, egress, Storage dan Edge Function. |
| Redis | Upstash Redis Free via REST | Satu database; limiter hanya pada endpoint berisiko/mutation; TTL agresif untuk risk keys. |
| Email | Resend Free | Email security/payment/essential diprioritaskan; marketing blast bukan baseline. |
| Map | Google Maps Embed API | SKU Embed tidak berbiaya, tetapi membutuhkan Google Cloud billing account + API key. Hanya aktifkan Maps Embed API. |
| Map tanpa billing account | MapLibre + OpenFreeMap | Fallback konfigurasi; jangan menjalankan dua engine bersamaan. |
| Animation | GSAP + CSS | Tidak ada animation engine kedua. |
| CI | GitHub Actions free allowance | Typecheck/lint/test/build; workflow dibuat ringkas dan cache-aware. |
| Backup off-site | encrypted logical dump + R2 Standard/free allowance atau encrypted operator backup | Backup script wajib portable; R2 bukan source of truth dan harus diberi lifecycle/usage alert. |

**Hard rule biaya:** jangan mengaktifkan auto-upgrade/pay-as-you-go/paid add-on untuk dependency MVP tanpa keputusan eksplisit. Jika free quota mendekati batas, sistem mengirim alert dan optional/non-critical work dapat ditunda; jangan menciptakan tagihan diam-diam.

**Hard rule correctness:** provider quota/availability tidak boleh menjadi source of truth bisnis. Bila layanan non-authoritative tertekan, pertahankan state kanonik di PostgreSQL, fail-closed untuk security/authorization, retry/defer side effect yang aman, dan tampilkan degraded state yang eksplisit bila fungsi user-facing memang tidak tersedia.

**Pengecualian yang memang bukan subscription software:** Midtrans dapat mengenakan merchant transaction fee ketika transaksi pembayaran benar-benar terjadi. Biaya tersebut masuk unit economics/order, bukan alasan memindahkan stack ke layanan berbayar.

Sumber verifikasi baseline 24 Agustus 2026:
- Cloudflare Workers/Queues/Workflows/R2 pricing: `https://developers.cloudflare.com/`
- Supabase pricing: `https://supabase.com/pricing`
- Upstash Redis pricing: `https://upstash.com/pricing/redis`
- Resend pricing: `https://resend.com/pricing`
- Google Maps Embed API usage & billing: `https://developers.google.com/maps/documentation/embed/usage-and-billing`
- OpenFreeMap: `https://openfreemap.org/`

Angka quota tidak di-hardcode sebagai business rule; dokumentasi provider wajib dicek lagi sebelum launch/major upgrade.

### 1.11.2 Cloudflare Runtime Contract

Target deployment Next.js:

```text
Next.js App Router
    ↓
@opennextjs/cloudflare
    ↓
Cloudflare Workers
```

Kontrak implementasi:

- `wrangler` dan `@opennextjs/cloudflare` dipin di lockfile.
- `wrangler.jsonc` menunjuk `main = ".open-next/worker.js"` dan static assets ke `.open-next/assets`.
- `open-next.config.ts` menjadi konfigurasi adapter/caching.
- `compatibility_date` harus direview saat upgrade; baseline proyek baru adalah **>= 2026-08-04**, sehingga Node.js compatibility modern tersedia secara default. Jangan menganggap semua Node API/native addon kompatibel hanya karena `nodejs_compat` tersedia.
- Integrasi test wajib dijalankan melalui `opennextjs-cloudflare preview`, bukan hanya `next dev`.
- Baseline Next.js 16+ tetap **Proxy** (`proxy.ts`). Selama OpenNext Cloudflare belum mendukung Node Middleware, compatibility exception yang disetujui pada 26 Agustus 2026 memakai legacy **Edge Middleware** (`middleware.ts`) hanya untuk refresh session dan coarse auth gate. Boundary ini harus Web/edge-compatible, tidak boleh memakai Node-specific API/native addon, dan harus dikembalikan ke `proxy.ts` setelah dukungan adapter tersedia serta lolos regression test.
- **Cloudflare Free plan** adalah baseline deployment MVP, tetapi bukan correctness contract. Monitor request/CPU/queue/workflow usage; saat mendekati batas, throttle/tunda pekerjaan non-kritis dan beri alert. Upgrade berbayar hanya keputusan bisnis eksplisit, bukan fallback otomatis.
- User invitation media tetap berasal dari derived variants di private Supabase Storage; **Cloudflare Images tidak menjadi dependency wajib**. Jika `next/image` digunakan, loader/optimization harus dipilih agar signed/private media tidak bergantung pada layanan image berbayar.
- R2 boleh dipakai sebagai cache OpenNext/ISR bila diperlukan, tetapi bukan source of truth dan tidak menggantikan private Supabase Storage.
- **Cloudflare Rocket Loader OFF** untuk aplikasi Next.js/OpenNext ini. Jika suatu saat diaktifkan sebagai eksperimen, gunakan Cloudflare Configuration Rule/exclusion atau `data-cfasync="false"` pada script yang perlu dikecualikan sesuai dokumentasi Cloudflare, lalu ulangi hydration/CSP/runtime regression test. Jangan menganggap mengecualikan satu script saja cukup bila script tersebut mempunyai dependency lain.

Batas desain khusus **Cloudflare Workers/Queues/Workflows Free tier** saat dokumen ini direvisi:

> **Capacity note, bukan kontrak:** per 24 Agustus 2026 dokumentasi Cloudflare mencantumkan Workers Free 100.000 request/hari dan 10 ms CPU/request, Queues Free 10.000 operasi/hari, serta Workflows Free 3.000 step/hari. Nilai ini wajib diverifikasi kembali sebelum launch/upgrade.

- request web harus ringan; CPU-heavy hashing, image/video processing, bulk export assembly, dan pekerjaan lama dipindahkan keluar request Worker;
- Cloudflare Queues digunakan untuk offload/retry;
- Cloudflare Workflows digunakan hanya untuk orchestration multi-step;
- jika batas Cloudflare free tier berubah, arsitektur tetap benar karena state utama berada di PostgreSQL dan worker processing terpisah.

### 1.11.3 Argon2id Boundary pada Cloudflare

Keputusan Argon2id **tetap berlaku**. Namun Cloudflare Workers `node:crypto` tidak menyediakan Argon2 dan Free Worker memiliki CPU budget yang terlalu kecil untuk menjadikan password hashing berat sebagai request-path dependency.

Maka:

```text
Cloudflare Worker
├── rate-limit / Turnstile / authorization
├── menerima PIN melalui TLS tanpa logging
└── internal call
      ↓
Supabase Edge Function + audited Argon2id WASM
      ↓
PostgreSQL pin_hash
```

Aturan:

- crypto function hanya menerima internal/authenticated request yang tervalidasi;
- PIN plaintext tidak pernah disimpan, di-log, atau dimasukkan ke queue;
- function mengembalikan hasil hash/verify minimum yang diperlukan;
- parameter Argon2id dibenchmark dan diberi ceiling sebelum production;
- jika implementasi WASM tidak memenuhi benchmark/security review, pindahkan boundary yang sama ke dedicated compute yang mendukung Argon2id native tanpa mengubah schema atau session model.

### 1.12 Komponen yang Sengaja Tidak Dipakai sebagai Fondasi

| Komponen | Keputusan |
|---|---|
| In-memory rate limiter | Dilarang untuk distributed/serverless security state. |
| Public invitation media bucket | Dilarang; gunakan private storage + signed URL. |
| Client-only image sanitizer | Tidak dipercaya; server/worker pipeline authoritative. |
| Fire-and-forget Promise untuk job penting | Dilarang; gunakan outbox + durable queue/workflow. |
| Long-running/CPU-heavy work di request Cloudflare Worker Free | Dilarang; gunakan queue + dedicated processor / Supabase Edge Function yang sesuai. |
| Broad `admin can select all` RLS | Dilarang; gunakan temporary support access/RPC terkontrol. |
| User-authored raw HTML | Tidak didukung pada scope awal. |
| Long-delay queue message untuk durasi Draft Extension/retention jangka panjang | Dilarang; gunakan timestamp DB + scheduler scan. |

## 2. Prinsip Arsitektur

Arsitektur platform ini dirancang untuk solo developer yang membangun produk skala menengah. Setiap keputusan arsitektur memprioritaskan **kemudahan implementasi**, **kebebasan dari bug**, dan **fleksibilitas untuk pertumbuhan**. Berikut adalah prinsip-prinsip inti yang harus dipatuhi dalam setiap keputusan teknis.

### 2.1 Dependency Rule & Composition Boundary

Arsitektur memakai `src/` agar source code terpisah dari konfigurasi project. **`src/app/` adalah routing/composition boundary, bukan service layer dan bukan tempat business workflow.** Aturan dependency dibuat cukup ketat untuk mencegah circular dependency, tetapi tidak memaksa page/layout mengorkestrasi aturan bisnis.

```text
src/app/                 → modules/, shared/, config/
modules/domain/*         → shared/, config/
modules/orchestration/*  → public contract domain modules + shared/, config/
shared/                  → config/
config/                  → ZERO imports
```

**Definisi:**

- **Domain module** = fitur dengan ownership bisnis jelas, misalnya `invitation`, `guest`, `payment`, `storage`, `auth`.
- **Orchestration/use-case module** = modul yang secara eksplisit memiliki satu workflow lintas-domain, misalnya `checkout` untuk `review → create payment → publish setelah funded`. Modul ini boleh mengimpor **public server contract** dari domain yang dibutuhkannya.
- Domain module **tidak boleh** saling mengimpor secara bebas dan **tidak boleh** mengimpor orchestration module.
- `shared/` tidak mengandung business rule dan tidak mengimpor `modules/` atau `app/`.
- `config/` tetap murni konstanta/type tanpa import.

**Acyclic rule:** dependency graph wajib satu arah dan bebas cycle. Cross-domain dependency baru harus memiliki owner use-case yang jelas; jangan membuat import dua arah hanya demi menghindari penulisan adapter kecil.

**Batas atomik:** source-code layering tidak pernah menggantikan transaction boundary. Invariant lintas domain seperti funded payment + entitlement + lifecycle + outbox tetap diselesaikan oleh **satu transaction/RPC PostgreSQL yang idempotent**.

### 2.2 Thin App Layer (Routing & Route Composition)

Folder `src/app/` bertanggung jawab atas:

1. **Routing** — `page.tsx`, `route.ts`, dynamic segment, route group.
2. **Layout & metadata** — `layout.tsx`, `template.tsx`, metadata/OG.
3. **Route-level loading/error state** — `loading.tsx`, `error.tsx`, `not-found.tsx`, `global-error.tsx` pada scope yang tepat.
4. **Data composition** — memanggil query/use-case module lalu menyusun komponen.
5. **HTTP boundary yang memang membutuhkan URL** — webhook, stable media endpoint, OAuth callback, beacon/endpoint kecil yang sengaja diekspos.

**Tidak boleh ada business orchestration di `page.tsx`/`layout.tsx`.** Page boleh memilih presentasi berdasarkan **hasil yang sudah dihitung module**, tetapi tidak boleh menyusun sendiri aturan seperti eligibility tier, payment transition, entitlement, refund, atau security policy.

Contoh:

```typescript
// ✅ page hanya composition
import { PublishPanel } from '@/modules/checkout/components/publish-panel';

export default async function EditPage() {
  return <PublishPanel />;
}
```

Workflow `publish → payment → entitlement` dimiliki module/use-case dan database transaction boundary, bukan fungsi lokal di page.

### 2.3 Feature Modules, Orchestration & Colocation

Gunakan tiga tingkat ownership:

#### A. Route-local UI

Jika komponen hanya dipakai oleh satu route/route-group, **colocate** di private folder `_components/` atau `_lib/` di dalam segment:

```text
src/app/(marketing)/
├── page.tsx
├── _components/
│   ├── hero.tsx
│   ├── trust-strip.tsx
│   └── featured-themes.tsx
└── _lib/
    └── homepage-data.ts
```

Prefix `_` menandai implementation detail dan mencegah kebingungan dengan route. Jangan memindahkan komponen satu-route ke `shared/` hanya agar terlihat reusable.

#### B. Domain module

Kode yang dipakai lintas route dalam satu fitur berada di `modules/<feature>/`:

```text
modules/invitation/
├── server/
│   ├── actions.ts
│   ├── queries.ts
│   └── authorization.ts
├── components/
├── hooks.ts
├── schemas.ts
└── types.ts
```

#### C. Orchestration/use-case module

Workflow lintas domain dimiliki satu module eksplisit, misalnya:

```text
modules/checkout/
├── server/
│   └── actions.ts
└── components/
```

`checkout` boleh membaca public server contracts `invitation`/`payment`, tetapi kedua domain tersebut tidak boleh mengimpor `checkout`.

**Prinsip colocation:** tambah subfolder hanya jika benar-benar ada kelompok file. Jangan membuat lapisan `domain/application/infrastructure/repository/service` seragam untuk setiap fitur kecil bila hanya menambah boilerplate.

### 2.4 Server-First (Prioritas Server Components)

**Aturan default:** Semua komponen adalah Server Component kecuali secara eksplisit ditandai `'use client'`.

Server Component digunakan untuk:
- Fetch data dari database
- Render halaman undangan publik (SEO friendly)
- Layout dan halaman dashboard
- Semua yang tidak membutuhkan interaktivitas

Client Component **hanya** digunakan jika benar-benar membutuhkan:
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (localStorage, geolocation, audio)
- React hooks (useState, useEffect, useReducer)
- Real-time subscriptions (Supabase Realtime)

**Pola praktis:** Jika komponen bisa jadi Server Component, jadikan Server Component. Jika butuh interaktivitas kecil (misalnya toggle), buat komponen Client kecil dan jadikan anak dari Server Component, bukan sebaliknya.

### 2.5 Arsitektur State untuk Onboarding (Gradual Engagement)

Arsitektur aplikasi mendukung **Lazy Registration**. Hal ini mengharuskan pemisahan state management:
1. **Unauthenticated State:** Saat pengguna memulai pembuatan undangan (Form 1) dari Beranda/Katalog tanpa login, state (Pilihan Tema, Nama Mempelai) disimpan murni di *client-side* menggunakan `localStorage` melalui helper draft kecil; tidak ada global state store pada onboarding `(marketing)`.
2. **State Hydration:** Setelah pengguna berhasil login melalui rute `(auth)`, **client/browser** membaca `localStorage`, mengirim draf awal ke Server Action untuk validasi + sync idempotent, menunggu server mengonfirmasi row tersedia, baru menghapus `localStorage` dan redirect ke `/dashboard/[id]/edit`. Next.js Proxy/server **tidak membaca `localStorage`** karena API tersebut hanya tersedia di browser.
3. **Intent Parameter:** Jika mekanisme *localStorage* tidak memungkinkan (karena lintas perangkat), gunakan parameter URL bawaan (contoh: `?intent=theme-slug`) yang diteruskan selama siklus OAuth Supabase.

### 2.6 Fail-Safe Defaults (Default yang Aman dari Kegagalan)

Setiap panggilan eksternal memiliki **timeout** dan klasifikasi error yang eksplisit. Retry/fallback **tidak boleh diterapkan generik**:
1. **Timeout** — gunakan ceiling yang masuk akal per operasi/provider; jangan biarkan request menggantung tanpa batas.
2. **Retry** — hanya untuk operasi yang benar-benar idempotent/retry-safe, dengan exponential backoff + jitter dan batas attempt. Payment create/cancel/refund mengikuti idempotency/state machine khususnya sendiri; jangan dibungkus retry generik.
3. **Fallback** — hanya untuk read/presentation non-kritis bila fallback tidak dapat mengubah authorization/business truth. Auth, authorization, payment, entitlement, security validation, signed-media authorization, dan mutation penting **harus fail closed/return explicit error**, bukan diam-diam mengembalikan data kosong/sukses palsu.

`shared/utils/safe-async.ts` boleh dipakai untuk **non-critical read UX** dengan policy eksplisit (timeout/retry/fallback). Jangan menjadikannya wrapper universal untuk Server Action/payment/security path.

### 2.7 Simplicity Budget & Conversion Architecture

Setiap fitur baru harus lolos dua pertanyaan sebelum dependency/state baru ditambahkan:

1. **Bisakah diselesaikan dengan HTML/CSS/Server Component/React Hook Form/React state yang sudah ada?** Jika ya, jangan tambah library.
2. **Apakah fitur ini meningkatkan conversion atau correctness secara terukur?** Jika tidak, tunda.

Baseline satu-solusi-per-masalah:

```text
Form/editor state       → React Hook Form
Local UI state          → React state/context
Animation kompleks      → GSAP
Micro interaction       → CSS
Icons                   → Lucide
Toast/feedback          → Sonner
Confirmation            → shadcn AlertDialog + shared ConfirmDialog
Workflow modal/panel     → shadcn Dialog / Sheet
Map                     → satu provider aktif dari MAP_PROVIDER
Rate limit/risk         → Upstash Redis REST
Email                   → Resend
Analytics MVP           → first-party aggregate/event minimal di PostgreSQL
```

Tidak ada carousel library baseline. Katalog/vendor/testimonial memakai CSS Grid, native horizontal overflow, atau CSS animation sederhana. Tidak ada AI API untuk copy generator/theme finder; tool marketing memakai template/scoring deterministik di client. Tidak ada third-party behavioral analytics pada MVP.

### 2.8 Conversion UX sebagai Kontrak Arsitektur

Landing/public marketing tetap **server/static-first** agar cepat dan murah. Client island hanya untuk personalized preview/theme finder/form pendek.

Kontrak conversion:

- visual platform netral; **theme preview adalah hero visual**;
- CTA acquisition kanonik: **`Coba Tema Gratis`** / **`Mulai Draft Gratis`**;
- jangan memakai **`Buat Undangan Gratis`** bila dapat ditafsirkan publish gratis;
- primary lead magnet = personalized preview yang **reuse flow onboarding yang sudah ada**, bukan backend baru;
- secondary lead magnet = deterministic Theme Finder, generator teks WhatsApp berbasis template, dan checklist statis; semuanya tanpa AI/API berbayar;
- social proof hanya data nyata; jangan fake counter/testimonial/logo partner;
- promo/countdown hanya untuk periode promo nyata, bukan urgency palsu permanen;
- price/duration/apa-yang-gratis harus jelas sebelum checkout.

---

## 3. Struktur Folder Kanonik — Next.js App Router 2026 (`src/`)

weplan **tetap menggunakan `src/`**. Next.js mendukung root `app/` maupun `src/app/`; pilihan `src/` di sini murni untuk organisasi repository, bukan karena perbedaan performa. **Jangan membuat root `app/` bersamaan dengan `src/app/`.**

Aturan penting:

- source code aplikasi berada di `src/`;
- `public/` **wajib di root project**, bukan `src/public/`;
- Untuk target OpenNext saat ini, compatibility exception Edge Middleware berada di **`src/middleware.ts`**, sejajar dengan `src/app/`; baseline kembali ke `src/proxy.ts` setelah adapter mendukung Node Middleware;
- `src/app/` = routing + route composition, bukan business service layer;
- route-specific UI boleh colocate di `_components/`/`_lib/`;
- Route Handler hanya dibuat ketika benar-benar membutuhkan HTTP endpoint;
- internal dashboard CRUD/form mutation memakai Server Action/use-case module + RPC, bukan REST endpoint duplikat.

```text
weplan/
│
├── src/
│   ├── middleware.ts                  # Temporary Edge compatibility gate for OpenNext
│   │
│   ├── app/
│   │   ├── layout.tsx                 # Root layout + Sonner; tanpa next-themes global
│   │   ├── globals.css                # Platform global tokens/base styles
│   │   ├── error.tsx                  # Root segment error boundary
│   │   ├── global-error.tsx           # Fallback jika error mencapai root layout
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (marketing)/               # Route group marketing/public; tidak mengubah URL
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Landing SSG/ISR
│   │   │   ├── _components/           # Hanya untuk UI marketing route-group
│   │   │   │   ├── hero.tsx
│   │   │   │   ├── trust-strip.tsx
│   │   │   │   ├── featured-themes.tsx
│   │   │   │   ├── pricing.tsx
│   │   │   │   └── faq.tsx
│   │   │   ├── katalog/
│   │   │   │   └── page.tsx
│   │   │   ├── demo/
│   │   │   │   └── [slug]/page.tsx
│   │   │   ├── lead-magnet/
│   │   │   │   └── page.tsx
│   │   │   └── legal/
│   │   │       ├── syarat-ketentuan/page.tsx
│   │   │       └── kebijakan-privasi/page.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── callback/route.ts      # OAuth callback memang HTTP boundary
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx            # Loading hanya scope dashboard
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── create/page.tsx             # authenticated entry/theme selection; memakai createOrSyncInvitation yang sama
│   │   │   ├── settings/page.tsx
│   │   │   └── dashboard/[id]/
│   │   │       ├── layout.tsx
│   │   │       ├── edit/page.tsx
│   │   │       ├── preview/page.tsx          # owner-only draft/published preview; dynamic/no-store
│   │   │       ├── tamu/page.tsx
│   │   │       └── rekening/page.tsx
│   │   │
│   │   ├── (wedding)/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx
│   │   │       ├── layout.tsx
│   │   │       ├── template.tsx
│   │   │       └── opengraph-image.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx
│   │   │   ├── loading.tsx            # Loading hanya scope admin
│   │   │   ├── page.tsx
│   │   │   ├── beranda/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   ├── invitations/page.tsx
│   │   │   ├── themes/page.tsx
│   │   │   └── leads/page.tsx
│   │   │
│   │   └── api/                       # Hanya HTTP boundary yang benar-benar diperlukan
│   │       ├── webhooks/
│   │       │   └── midtrans/route.ts
│   │       ├── media/
│   │       │   └── [mediaId]/[variant]/route.ts
│   │       ├── invitations/
│   │       │   └── [slug]/view/route.ts
│   │       └── guests/
│   │           └── import/route.ts    # Hanya bila chunked HTTP import memang diperlukan
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── server/
│   │   │   │   └── actions.ts
│   │   │   ├── components/
│   │   │   ├── schemas.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── invitation/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── queries.ts
│   │   │   │   └── authorization.ts
│   │   │   ├── components/
│   │   │   ├── hooks.ts
│   │   │   ├── schemas.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── guest/
│   │   │   ├── server/
│   │   │   │   ├── actions.ts         # RSVP normal juga Server Action/RPC; bukan API duplikat
│   │   │   │   └── queries.ts
│   │   │   ├── components/
│   │   │   ├── hooks.ts
│   │   │   ├── schemas.ts
│   │   │   └── types.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── client/
│   │   │   │   └── snap-loader.ts
│   │   │   ├── server/
│   │   │   │   ├── actions.ts
│   │   │   │   ├── service.ts             # Internal payment service/public server contract untuk orchestrator
│   │   │   │   ├── state-machine.ts
│   │   │   │   ├── webhook-handler.ts
│   │   │   │   ├── reconciliation.ts
│   │   │   │   └── provider/
│   │   │   │       └── midtrans/
│   │   │   │           ├── client.ts
│   │   │   │           ├── schemas.ts
│   │   │   │           └── signature.ts
│   │   │   ├── components/
│   │   │   └── types.ts
│   │   │
│   │   ├── checkout/                  # Explicit cross-domain orchestration
│   │   │   ├── server/
│   │   │   │   └── actions.ts
│   │   │   └── components/
│   │   │
│   │   ├── theme/
│   │   │   ├── registry.ts
│   │   │   ├── types.ts
│   │   │   ├── components/            # catalog/editor-facing theme UI; bukan renderer behavior primitive
│   │   │   ├── primitives/            # shared renderer behavior/accessibility: countdown, map-action, lightbox, RSVP, gift, music
│   │   │   ├── shared-sections/       # optional shared functional shells; tidak memaksakan art direction
│   │   │   └── themes/                # renderer + theme CSS/ornament/composition per theme
│   │   │
│   │   ├── storage/
│   │   │   ├── server/
│   │   │   │   └── actions.ts
│   │   │   ├── utils.ts
│   │   │   └── types.ts
│   │   │
│   │   └── analytics/
│   │       ├── server/
│   │       │   └── actions.ts
│   │       └── types.ts
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn primitives
│   │   │   └── shared/                # Reusable app-wide, business-agnostic
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── supabase/
│   │   │   │   ├── server-client.ts
│   │   │   │   ├── browser-client.ts
│   │   │   │   ├── middleware-client.ts
│   │   │   │   ├── service-client.ts
│   │   │   │   └── types.ts
│   │   │   └── env.ts
│   │   ├── animation/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── config/
│       ├── tiers.ts
│       ├── routes.ts
│       └── constants.ts
│
├── public/                             # WAJIB root; jangan taruh di src/
│   ├── templates/
│   │   └── fonts/
│   ├── lead-magnet/
│   │   ├── template-daftar-tamu.csv
│   │   └── checklist-pernikahan.md
│   ├── images/
│   └── sounds/
│
├── supabase/
│   ├── migrations/
│   └── functions/
├── scripts/
├── tests/
│
├── next.config.ts
├── open-next.config.ts
├── wrangler.jsonc
├── postcss.config.mjs
├── eslint.config.mjs
├── tsconfig.json
├── package.json
├── .env.example
└── .gitignore
```

### 3.1 Aturan Folder yang Dikunci

1. **Pilih satu:** `src/app/` dipakai; root `app/` dilarang ada bersamaan.
2. **`public/` berada di root** karena itulah konvensi Next.js untuk static assets.
3. **`src/middleware.ts`** sejajar dengan `src/app/` selama compatibility exception OpenNext berlaku; file ini hanya coarse auth/session gate dan tidak mengubah kewajiban authorization server-side.
4. **Tidak ada root `loading.tsx` default** kecuali benar-benar dibutuhkan untuk seluruh app; loading ditempatkan pada route-group/segment yang membutuhkan.
5. **`global-error.tsx`** disediakan selain `error.tsx`.
6. **`(marketing)`** dipakai menggantikan `(public)` agar tidak rancu dengan root `public/`.
7. Private route helpers/components memakai `_components/` / `_lib/` bila hanya digunakan oleh segment tersebut.
8. `shared/` hanya untuk kode benar-benar lintas-domain dan business-agnostic.
9. Provider-specific Midtrans berada di `modules/payment/`; **jangan** menduplikasi `shared/lib/midtrans`.
10. Folder `server/` yang mengakses secret/database privileged diberi build-time guard `import 'server-only'` pada module non-Server-Action entrypoint.

### 3.2 Route Handler vs Server Action

Gunakan **Server Action/use-case module** untuk mutation yang berasal dari UI weplan sendiri:

- create/update/delete invitation;
- autosave editor;
- RSVP submit;
- update guest/settings;
- payment initiation/cancel request dari UI, dengan provider/state validation server-side.

Gunakan **Route Handler** jika salah satu ini benar:

- provider eksternal harus memanggil URL (`/api/webhooks/midtrans`);
- browser membutuhkan URL resource stabil (`/api/media/...`);
- beacon/event ringan memang membutuhkan endpoint (`/api/invitations/[slug]/view`);
- upload/import benar-benar membutuhkan HTTP streaming/chunk semantics yang lebih cocok daripada Server Action;
- OAuth/provider callback memang HTTP boundary.

**Jangan membuat Route Handler REST hanya sebagai wrapper untuk Server Action yang sama.** Satu use case memiliki satu mutation path agar validation, authorization, idempotency dan test tidak terduplikasi.

### 3.3 Scheduler

Supabase Cron/pg_cron tetap scheduler kanonik. Cleanup/lifecycle yang dapat diselesaikan dengan SQL/RPC **tidak** melewati `app/api/cron/cleanup`. Route cron baru hanya boleh ada jika job benar-benar membutuhkan runtime HTTP/Next.js yang tidak dapat dilakukan scheduler DB + outbox/queue.

### 3.4 Import Alias

`tsconfig.json` mengarahkan alias ke `src/`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Gunakan:

```typescript
import { Button } from '@/shared/components/ui/button';
import { createOrSyncInvitation } from '@/modules/invitation/server/actions';
```

bukan relative path panjang.

### 3.5 Rujukan Next.js yang Diverifikasi

Keputusan struktur ini diverifikasi terhadap dokumentasi resmi Next.js App Router pada 25 Agustus 2026:

- Project Structure: `https://nextjs.org/docs/app/getting-started/project-structure`
- `src` folder: `https://nextjs.org/docs/app/api-reference/file-conventions/src-folder`
- Route Handlers: `https://nextjs.org/docs/app/api-reference/file-conventions/route`
- Server Actions / Backend-for-Frontend guidance: `https://nextjs.org/docs/app/guides/backend-for-frontend`
- Data Security / `server-only`: `https://nextjs.org/docs/app/guides/data-security`
- Next.js 16 Proxy: `https://nextjs.org/docs/app/api-reference/file-conventions/proxy`
- Next.js 16 upgrade (`middleware` Edge compatibility): `https://nextjs.org/docs/app/guides/upgrading/version-16`
- OpenNext Cloudflare supported features: `https://opennext.js.org/cloudflare`

## 4. Desain Database (Supabase PostgreSQL)

Desain database memisahkan **data akun**, **katalog tier**, **desain theme**, **state invitation**, **event terstruktur**, **identitas guest**, **credential internal**, **media lifecycle**, dan **ledger transaksi**. Semua nilai bisnis yang sering berubah (harga/limit/durasi) tidak boleh diduplikasi di theme atau `global_settings`.

### 4.0 Exposure Model, GRANT dan Schema Boundary

Baseline MVP mempertahankan tabel aplikasi di schema `public` agar implementasi `supabase-js`, Server Action, migration, dan observability tetap sederhana. Keamanan **tidak** bergantung pada default grant Supabase:

1. seluruh tabel `public` mengaktifkan RLS;
2. migration lebih dulu mencabut default privilege client;
3. hanya tabel/operasi yang memang dibutuhkan browser yang di-`GRANT` kembali secara eksplisit;
4. tabel credential, payment-provider detail, audit/governance, outbox/job, dan internal lifecycle **tidak mendapat grant `anon`/`authenticated`**;
5. credential hash dipisahkan dari row owner-readable sehingga `SELECT *` pada tabel owner tidak pernah mengeluarkan PIN/token hash;
6. server memakai Supabase **secret key (`sb_secret_...`)** pada trusted backend. Legacy JWT `service_role` key hanya untuk project lama yang belum bermigrasi. Secret key tetap memetakan akses elevated/bypass-RLS, sehingga setiap endpoint server tetap wajib melakukan auth, ownership/scope, state, dan field-whitelist checks sendiri.

Baseline privilege migration:

```sql
-- Berlaku untuk object baru yang dibuat oleh role postgres di public.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

-- sb_secret_... dipetakan ke Postgres role service_role. Elevated backend access
-- dibuat eksplisit, bukan bergantung pada project default yang dapat berubah.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO service_role;

-- Untuk object yang sudah ada, migration juga melakukan REVOKE eksplisit
-- sebelum GRANT whitelist pada Bagian 4.19.

-- Helper database internal/trigger tidak diletakkan pada exposed schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA private
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
```

Schema `private` **tidak boleh** ditambahkan ke daftar exposed schemas Data API. Jika kelak Weplan membutuhkan Data API yang jauh lebih luas, dedicated exposed schema `api` boleh ditambahkan. Itu **bukan dependency MVP** dan tidak diperlukan untuk correctness desain ini.

### 4.1 Tabel: `user_profiles`

Tier **tidak** disimpan pada user. Tidak ada `trial_quota`, `invitation_quota`, `quota_used`, atau `quota_max` sebagai entitlement bisnis. User boleh membuat jumlah draft yang tidak dibatasi; abuse dikendalikan oleh rate limit dan retention.

```sql
CREATE TABLE user_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL, -- convenience mirror; bukan auth/authorization SSoT
  full_name   TEXT NOT NULL DEFAULT '',
  avatar_url  TEXT,
  role        TEXT NOT NULL DEFAULT 'user'
              CHECK (role IN ('user', 'admin', 'super_admin')),
  auth_context_version INT NOT NULL DEFAULT 1 CHECK (auth_context_version > 0),
  is_blocked  BOOLEAN NOT NULL DEFAULT false,
  account_status TEXT NOT NULL DEFAULT 'active'
                 CHECK (account_status IN ('active','pending_deletion','deleting')),
  deletion_requested_at TIMESTAMPTZ,
  deletion_execute_after TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at  TIMESTAMPTZ,
  CHECK (
    account_status = 'active'
    OR (deletion_requested_at IS NOT NULL AND deletion_execute_after IS NOT NULL)
  ),
  CHECK (deletion_execute_after IS NULL OR deletion_requested_at IS NULL OR deletion_execute_after >= deletion_requested_at)
);

CREATE INDEX idx_user_profiles_email_lower ON user_profiles ((lower(email)));
CREATE INDEX idx_user_profiles_deleted_at ON user_profiles(deleted_at)
  WHERE deleted_at IS NOT NULL;
```

`email` adalah mirror untuk kebutuhan UI/operasional. Auth identity tetap berasal dari Supabase Auth; perubahan email harus disinkronkan melalui trusted flow dan `user_profiles.email` tidak boleh digunakan sebagai credential/authorization key.

**Profile provisioning:** setiap login/OAuth callback/first authenticated request menjalankan `ensureUserProfile()` yang idempotent pada trusted server sebelum business mutation. Upsert hanya boleh mengisi/memperbarui field profil aman (`email`, `full_name`, `avatar_url`, `updated_at`); `role`, `auth_context_version`, `is_blocked`, dan lifecycle account tidak pernah berasal dari `user_metadata`. Baseline ini sengaja tidak menjadikan trigger `auth.users -> user_profiles` sebagai correctness dependency, karena kegagalan trigger Auth dapat memblokir signup. Regression test mencakup Auth user yang belum mempunyai row profile dan memastikan first request melakukan self-heal sebelum membuat invitation.

### 4.2 Tabel: `tiers`

`tiers` adalah **Single Source of Truth** untuk harga publish/renewal, capability, limit, watermark, dan durasi. Hanya tiga tier riil yang boleh ada: `basic`, `premium`, `vip`. Kartu `FREE` di landing page bukan row tier.

`tier_rank` adalah **business ordering**, berbeda dari `sort_order` yang hanya presentasi UI.

```sql
CREATE TABLE tiers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                     TEXT NOT NULL UNIQUE
                           CHECK (code IN ('basic', 'premium', 'vip')),
  tier_rank                SMALLINT NOT NULL UNIQUE,
  name                     TEXT NOT NULL,
  price_amount             INT NOT NULL CHECK (price_amount >= 0), -- Rupiah
  original_price_amount    INT CHECK (
                             original_price_amount IS NULL
                             OR original_price_amount >= price_amount
                           ),
  duration_months          INT NOT NULL CHECK (duration_months > 0),
  gallery_limit            INT NOT NULL CHECK (gallery_limit >= 0),
  video_limit              INT NOT NULL CHECK (video_limit >= 0),
  bank_account_limit       INT NOT NULL CHECK (bank_account_limit >= 0),
  audio_enabled            BOOLEAN NOT NULL DEFAULT false,
  audio_size_limit_mb      INT NOT NULL DEFAULT 0 CHECK (audio_size_limit_mb >= 0),
  watermark_enabled        BOOLEAN NOT NULL DEFAULT true,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  sort_order               INT NOT NULL DEFAULT 0,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (code = 'basic'   AND tier_rank = 10) OR
    (code = 'premium' AND tier_rank = 20) OR
    (code = 'vip'     AND tier_rank = 30)
  ),
  CHECK (
    (audio_enabled = false AND audio_size_limit_mb = 0)
    OR (audio_enabled = true AND audio_size_limit_mb > 0)
  )
);
```

**Aturan admin:** konfigurasi capability harus monoton `BASIC <= PREMIUM <= VIP`. Mutation admin dijalankan dalam satu transaksi dan memvalidasi `duration_months`, numeric limits, positive capabilities, serta negative capability seperti watermark. Snapshot entitlement tetap menjadi safety net untuk hak lama. `tier_rank` tidak boleh diedit sebagai angka bebas karena mapping code/rank sudah dikunci oleh CHECK.

### 4.3 Tabel: `themes`

Theme adalah desain. Theme **tidak** menyimpan harga, limit, atau fitur entitlement.

```sql
CREATE TABLE themes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_id       UUID NOT NULL REFERENCES tiers(id),
  renderer_key  TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  slug          TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  category      TEXT NOT NULL DEFAULT 'general'
                CHECK (category IN ('general', 'minimalist', 'floral', 'royal', 'modern', 'traditional')),
  catalog_tags  TEXT[] NOT NULL DEFAULT '{}'::text[]
                CHECK (cardinality(catalog_tags) <= 12),
  preview_image TEXT,
  design_tokens JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(design_tokens) = 'object'),
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(layout_config) = 'object'),
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_themes_tier_id ON themes(tier_id);
CREATE INDEX idx_themes_renderer_key ON themes(renderer_key);
CREATE INDEX idx_themes_active_sort ON themes(sort_order, id) WHERE is_active = true;
CREATE INDEX idx_themes_catalog_tags ON themes USING GIN (catalog_tags) WHERE is_active = true;
```

Tidak dibuat index kedua pada `themes.slug` karena `UNIQUE` sudah membuat B-tree index.

`themes.category` adalah **taksonomi luas dan stabil**, bukan daftar seluruh arketipe visual. `traditional` diproyeksikan UI sebagai **Adat/Tradisional**; sub-gaya Sunda/Jawa/Minang/Batak tidak menjadi enum baru. Arketipe seperti Islamic, editorial, newspaper, atau photojournalistic juga tidak perlu menambah enum `category`.

Untuk discoverability katalog, gunakan `catalog_tags` yang **non-authoritative terhadap entitlement/security**. Trusted admin/server menormalisasi tag menjadi lowercase kebab-case, membatasi jumlahnya, menghapus duplikat, dan menolak tag yang tidak lolos vocabulary/validation produk. Contoh: `Emerald Islamic` dapat memakai `category='general'` + `catalog_tags=['islamic','geometric','emerald']`; `Newspaper Editorial` dapat memakai `category='general'` atau `modern` + `catalog_tags=['editorial','newspaper']`. UI boleh memfilter category dan tag tanpa migration enum setiap kali portfolio desain bertambah.

`themes.tier_id` berarti **minimum entitlement** yang dibutuhkan theme. Perbandingan level selalu menggunakan `tiers.tier_rank`, bukan UUID dan bukan `sort_order`.

`themes.renderer_key` adalah identifier teknis yang menunjuk ke renderer yang tersedia di kode. Metadata presentasi/bisnis (`name`, `description`, `slug`, `category`, `catalog_tags`, `tier_id`, `design_tokens`, `layout_config`) tetap berasal dari database; registry kode **tidak** menduplikasi nama, harga, limit, atau tier. Startup/build verification wajib gagal jelas bila `renderer_key` aktif tidak dikenal oleh registry.

#### Theme authoring vs owner-editable presentation

`design_tokens` dan `layout_config` adalah **theme-author/admin-authored configuration**, bukan form state bebas milik owner. Keduanya boleh mendefinisikan palette, typography token, geometry, ornament/photo treatment, composition, motion preset, dan daftar presentation override yang diizinkan renderer. Owner invitation **tidak** boleh mengubah `renderer_key`, font family, ornament set, photo mask, motion grammar, section divider, atau layout composition melalui generic editor.

Owner-editable presentation memakai allowlist kecil di `invitations.settings`/schema editor yang sudah ada. Baseline MVP:

```text
section_visibility               # hanya section optional yang memang didukung data/theme
accent_override?                 # hanya jika theme layout_config mengizinkan
```

`layout_config.editable_overrides` (atau field config setara yang tervalidasi) menentukan override theme mana yang tersedia untuk invitation tersebut. **Subject focus foto bukan theme override**: perubahan focal point disimpan pada canonical `media_assets.focus_x/focus_y` melalui media mutation khusus (§4.15), sehingga tetap konsisten ketika theme berganti. Jika `accent_override=false`, UI **tidak menampilkan color picker**. Override selalu divalidasi server-side terhadap schema/allowlist theme; arbitrary CSS value/class, font, asset path, SVG/HTML, atau animation config dari user tidak diterima. Generic autosave pada §10.4 hanya boleh membawa whitelist presentation override ini, bukan seluruh `ThemeVisualSpec`.

#### Composition order dan variant representation

**Composition/order renderer sepenuhnya dimiliki File 05.** File 01 hanya mengunci batas domain: perubahan composition tidak boleh mengubah authorization, publish-readiness, entitlement, persisted feature/data contract, atau state machine. Jangan menyalin daftar/urutan section dari File 05 ke schema/business-rule File 01.

Untuk MVP, variant visual tidak membutuhkan `theme_family`/`parent_theme_id` baru. Dua variant yang perlu tampil sebagai pilihan katalog dapat berupa **dua row `themes`** dengan `renderer_key` dan composition yang sama tetapi `design_tokens` berbeda. Istilah *theme family/variant* di File 05 adalah taxonomy desain, bukan schema/database entity tambahan.

**Immutability:** setelah theme pernah dipakai oleh invitation yang memiliki entitlement/published history, `tier_id` dan `renderer_key` tidak boleh diubah in-place. Perubahan breaking membuat theme/revision baru. Mutation admin wajib mengecek penggunaan sebelum update; migration test mengunci invariant ini.

### 4.4 Tabel: `invitations` dan `invitation_events`

Data acara dipisahkan dari JSONB karena mempunyai identity, ordering, waktu absolut, timezone venue, koordinat, dan query/index sendiri. `events JSONB` dan generated `event_date` **tidak digunakan**.

```sql
CREATE TABLE invitations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  theme_id               UUID NOT NULL REFERENCES themes(id),
  slug                   TEXT NOT NULL UNIQUE,

  status                 TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft', 'published', 'expired', 'trashed')),

  entitlement_tier_id    UUID REFERENCES tiers(id),
  entitlement_snapshot   JSONB,

  is_private             BOOLEAN NOT NULL DEFAULT false,
  pin_version            INT NOT NULL DEFAULT 1 CHECK (pin_version > 0),

  rsvp_mode              TEXT NOT NULL DEFAULT 'personal_only'
                         CHECK (rsvp_mode IN ('personal_only', 'open')),
  guestbook_moderation   TEXT NOT NULL DEFAULT 'auto'
                         CHECK (guestbook_moderation IN ('auto', 'manual')),

  client_ref             UUID UNIQUE, -- idempotency correlation; tidak pernah menjadi authorization credential

  couple                 JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(couple) = 'object'),
  love_story             JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(love_story) = 'array'),
  bank_accounts          JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(bank_accounts) = 'array'),
  settings               JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(settings) = 'object'),

  published_at           TIMESTAMPTZ,
  expires_at             TIMESTAMPTZ,
  public_suspended_at    TIMESTAMPTZ,
  suspension_reason      TEXT,

  last_activity_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_retention_until   TIMESTAMPTZ,
  deleted_at             TIMESTAMPTZ,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_version        INT NOT NULL DEFAULT 1 CHECK (content_version > 0),

  UNIQUE (id, user_id),
  CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  CHECK (
    (entitlement_tier_id IS NULL AND entitlement_snapshot IS NULL)
    OR (entitlement_tier_id IS NOT NULL AND entitlement_snapshot IS NOT NULL)
  ),
  CHECK (expires_at IS NULL OR published_at IS NULL OR expires_at > published_at),
  CHECK (paid_retention_until IS NULL OR entitlement_tier_id IS NULL),
  CHECK (
    status <> 'published'
    OR (entitlement_tier_id IS NOT NULL AND published_at IS NOT NULL AND expires_at IS NOT NULL)
  ),
  CHECK (
    status <> 'expired'
    OR (entitlement_tier_id IS NOT NULL AND expires_at IS NOT NULL)
  )
);

ALTER TABLE invitations ADD COLUMN groom_name TEXT
  GENERATED ALWAYS AS (couple->'groom'->>'name') STORED;
ALTER TABLE invitations ADD COLUMN bride_name TEXT
  GENERATED ALWAYS AS (couple->'bride'->>'name') STORED;

CREATE TABLE invitation_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  position        SMALLINT NOT NULL DEFAULT 0 CHECK (position >= 0),
  event_type      TEXT NOT NULL DEFAULT 'other',
  -- Draft harus dapat disimpan walau user belum selesai mengisi event.
  title           TEXT NOT NULL DEFAULT '',
  starts_at       TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  timezone        TEXT CHECK (timezone IS NULL OR char_length(timezone) BETWEEN 3 AND 64),
  venue_name      TEXT NOT NULL DEFAULT '',
  address         TEXT NOT NULL DEFAULT '',
  latitude        NUMERIC(9,6),
  longitude       NUMERIC(9,6),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitation_id, position),
  CHECK (ends_at IS NULL OR starts_at IS NOT NULL),
  CHECK (ends_at IS NULL OR ends_at >= starts_at),
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
  CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

CREATE INDEX idx_invitations_user_id ON invitations(user_id);
CREATE INDEX idx_invitations_theme_id ON invitations(theme_id);
CREATE INDEX idx_invitations_entitlement_tier_id ON invitations(entitlement_tier_id)
  WHERE entitlement_tier_id IS NOT NULL;
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_invitations_entitlement_expires_due ON invitations(expires_at, id)
  WHERE entitlement_tier_id IS NOT NULL
    AND status IN ('draft','published')
    AND expires_at IS NOT NULL;
CREATE INDEX idx_invitations_last_activity_unpaid_draft ON invitations(last_activity_at, id)
  WHERE status = 'draft' AND entitlement_tier_id IS NULL;
CREATE INDEX idx_invitation_events_invitation_start
  ON invitation_events(invitation_id, starts_at, position)
  WHERE starts_at IS NOT NULL;
```

Tidak dibuat index kedua pada `invitations.slug` karena constraint `UNIQUE` sudah mengindeksnya.

**Draft vs publish invariant:** row event boleh incomplete selama invitation masih diedit. `title=''`, `starts_at=NULL`, dan `timezone=NULL` adalah state draft yang sah sehingga autosave tidak gagal saat user baru menambah blok acara. **Publish readiness** yang memaksa minimal satu event publishable: title non-empty, `starts_at` non-NULL, dan timezone IANA valid. Jangan membuat tabel/JSON draft kedua hanya untuk event incomplete.

**Timezone invariant:** `starts_at`/`ends_at` menyimpan instant absolut sebagai `TIMESTAMPTZ`; `timezone` menyimpan IANA venue timezone (contoh `Asia/Jakarta`). Form editor menyimpan konsep `date + localTime + timezone`; server yang menggabungkan dan memvalidasi hubungan local time/timezone menjadi instant. Bila API menerima ISO 8601 dengan offset, server tetap memastikan offset tersebut konsisten dengan IANA timezone pada tanggal terkait. String polos seperti `08:00 WIB` tidak diterima sebagai storage format.

**Dashboard event date:** tanggal acara tidak disimpan sebagai generated cast dari JSON. Query mengambil event primer berdasarkan `position` atau event terawal dari `invitation_events` yang mempunyai `starts_at`; event draft tanpa tanggal tidak dipakai sebagai dashboard event date.

#### Canonical JSONB content contract

JSONB tetap divalidasi Zod di trusted server dan **tidak boleh berkembang diam-diam melalui renderer**. Baseline field yang dipakai File 03/05:

```typescript
type CouplePerson = {
  name?: string;
  nickname?: string;
  parentNames?: string[];
  photoMediaId?: string;              // media_assets purpose=couple_portrait, same invitation
  socialLinks?: Array<{
    provider: 'instagram' | 'tiktok' | 'facebook' | 'website';
    url: string;                       // navigation-only; host/scheme allowlist, bukan server fetch
  }>;
};

type LoveStoryItem = {
  id: string;                          // UUID/stable item identity
  date?: string;
  title?: string;
  body?: string;
  photoMediaId?: string;               // purpose=story_image
};

type BankAccountItem = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrisMediaId?: string;                // purpose=qris_image
};

type InvitationSettings = {
  openingText?: string;
  quoteText?: string;
  backgroundAudioMediaId?: string;     // purpose=background_audio
  videoEmbeds?: Array<{
    id: string;
    kind: 'video' | 'live';
    provider: 'youtube';               // baseline MVP; tambah provider hanya melalui allowlist domain
    externalId: string;                // normalized provider ID; jangan simpan arbitrary iframe HTML
    title?: string;
  }>;
  physicalGift?: {
    enabled: boolean;
    recipient?: string;
    address?: string;
  };
  sectionVisibility?: Record<string, boolean>;
  themeOverrides?: Record<string, unknown>; // tetap dibatasi layout_config.editable_overrides
};
```

Aturan:
- setiap `*MediaId` harus resolve ke `media_assets` **milik invitation yang sama**, kind/purpose yang benar, dan state yang diizinkan;
- draft boleh mereferensikan asset `processing` untuk placeholder, tetapi publish/preview-final hanya memakai asset `ready`;
- `videoEmbeds` dihitung terhadap `video_limit`; raw `<iframe>`/HTML tidak pernah menjadi input;
- `bank_accounts` dihitung terhadap `bank_account_limit`; QRIS adalah presentasi rekening dan tidak membuat “rekening kedua”;
- social link adalah client navigation, bukan URL yang di-fetch server, sehingga tidak menjadi jalur SSRF;
- physical gift adalah optional content contract MVP dan **bukan capability/quota tier terpisah** saat ini; renderer hanya menampilkannya bila `enabled` dan data minimum tersedia. Jika kelak digating, capability baru harus ditambahkan ke File 01/tier snapshot terlebih dahulu.

**Invariant entitlement:**
- sebelum pembayaran: tier efektif checkout = tier theme aktif;
- setelah pembayaran: `entitlement_tier_id` adalah level hak maksimum invitation;
- theme aktif wajib mempunyai `theme.tier_rank <= entitlement.tier_rank`;
- `entitlement_snapshot` hanya ditulis trusted payment/entitlement transaction;
- snapshot schema divalidasi server dan database test;
- upgrade normal tidak boleh mengurangi hak lama: numeric limit memakai `MAX(old, target)`, capability positif memakai `old OR target`, capability negatif seperti watermark tidak boleh memburuk;
- downgrade/reconciliation akibat confirmed reversal/chargeback hanya melalui workflow payment-reconciliation khusus, bukan generic invitation mutation.

**Slug:** regex DB hanya mengunci bentuk kanonik dasar. Reserved-word blocklist (`api`, `admin`, `dashboard`, `login`, dll.) tetap diverifikasi di server karena merupakan policy yang dapat bertambah tanpa migration constraint. Pada MVP, slug **dibuat server-side sebagai identifier opaque/random** (mis. `w-7k3m9p2q`) agar URL private invitation tidak membocorkan nama pasangan, lalu unique constraint menjadi otoritas collision terakhir. Client tidak mengirim slug sebagai business input. Slug baseline **immutable setelah create** agar link yang sudah dibagikan tidak rusak; fitur custom/rename slug di masa depan harus menjadi dedicated workflow dengan redirect/alias policy, bukan autosave field.

**DB guard untuk used theme:** setelah tabel `invitations` tersedia, migration memasang safety net berikut agar bug admin tidak dapat mengubah minimum tier/renderer theme yang sudah mempunyai paid/published history:

```sql
CREATE OR REPLACE FUNCTION private.guard_used_theme_identity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF (NEW.tier_id, NEW.renderer_key) IS DISTINCT FROM (OLD.tier_id, OLD.renderer_key)
     AND EXISTS (
       SELECT 1
       FROM public.invitations i
       WHERE i.theme_id = OLD.id
         AND (i.entitlement_tier_id IS NOT NULL OR i.published_at IS NOT NULL)
     )
  THEN
    RAISE EXCEPTION 'used theme tier_id/renderer_key is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_used_theme_identity
BEFORE UPDATE OF tier_id, renderer_key ON themes
FOR EACH ROW EXECUTE FUNCTION private.guard_used_theme_identity();
```

### 4.5 Credential PIN: `invitation_pin_credentials` & `pin_history`

`pin_hash` **tidak berada di `invitations`**, sehingga owner SELECT terhadap invitation tidak pernah dapat mengeluarkan hash. Tabel credential tidak mendapat grant client.

```sql
CREATE TABLE invitation_pin_credentials (
  invitation_id  UUID PRIMARY KEY REFERENCES invitations(id) ON DELETE CASCADE,
  pin_hash        TEXT NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pin_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id  UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  pin_hash        TEXT NOT NULL,
  replaced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pin_history_invitation
  ON pin_history(invitation_id, replaced_at DESC);
```

PIN memakai **Argon2id**, panjang 6–10 digit numerik, weak-PIN blocklist/pattern validation, dan tidak boleh memakai kembali PIN saat ini + tiga PIN historis terakhir. Saat PIN baru berhasil disimpan, pertahankan maksimal tiga row history terbaru.

**Invariant private mode:** transition `PUBLIC -> PRIVATE` dilakukan dalam satu transaction/RPC yang lebih dulu memastikan row `invitation_pin_credentials` tersedia, lalu mengubah `is_private=true`. `is_private=true` tanpa credential aktif harus ditolak oleh transaction function/test. Invitation public boleh mempertahankan hash credential lama agar owner dapat memilih memakai PIN sebelumnya. Toggle public/private sendiri tidak menaikkan `pin_version`; hanya perubahan PIN atau explicit private-session revoke yang menaikkannya.

Invariant tersebut juga dipaksa pada commit dengan deferred constraint trigger, sehingga urutan `insert credential` dan `set private` boleh berada dalam transaction yang sama tetapi state akhir tidak dapat invalid:

```sql
CREATE OR REPLACE FUNCTION private.assert_private_invitation_has_pin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.is_private
     AND NOT EXISTS (
       SELECT 1 FROM public.invitation_pin_credentials c
       WHERE c.invitation_id = NEW.id
     )
  THEN
    RAISE EXCEPTION 'private invitation requires PIN credential';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION private.prevent_private_pin_credential_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.invitations i
    WHERE i.id = OLD.invitation_id
      AND i.is_private = true
  )
  THEN
    RAISE EXCEPTION 'cannot delete PIN credential while invitation is private';
  END IF;
  RETURN OLD;
END;
$$;

CREATE CONSTRAINT TRIGGER trg_private_invitation_requires_pin
AFTER INSERT OR UPDATE OF is_private ON invitations
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION private.assert_private_invitation_has_pin();

CREATE CONSTRAINT TRIGGER trg_private_invitation_prevent_pin_delete
AFTER DELETE ON invitation_pin_credentials
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION private.prevent_private_pin_credential_delete();
```

### 4.6 Tabel: `guests` & `guest_credentials`

Raw `guests` adalah data private milik owner, tetapi credential token dipisahkan sehingga row guest owner-readable tidak pernah mengeluarkan hash.

```sql
CREATE TABLE guests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id         UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  phone                 TEXT,
  normalized_phone      TEXT,
  title                 TEXT,
  group_name            TEXT,
  notes                 TEXT,
  guest_source          TEXT NOT NULL DEFAULT 'manual'
                        CHECK (guest_source IN ('manual', 'import', 'public_rsvp')),

  rsvp_status           TEXT NOT NULL DEFAULT 'pending'
                        CHECK (rsvp_status IN ('pending', 'confirmed', 'declined')),
  attendance            INT NOT NULL DEFAULT 1,
  wish_message          TEXT CHECK (char_length(wish_message) <= 500),
  wish_status           TEXT NOT NULL DEFAULT 'pending'
                        CHECK (wish_status IN ('pending', 'approved', 'hidden', 'rejected')),

  is_wa_sent            BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (rsvp_status = 'declined' AND attendance = 0)
    OR (rsvp_status IN ('pending','confirmed') AND attendance BETWEEN 1 AND 10)
  )
);

CREATE TABLE guest_credentials (
  guest_id               UUID PRIMARY KEY REFERENCES guests(id) ON DELETE CASCADE,
  access_token_hash      TEXT UNIQUE,
  token_created_at       TIMESTAMPTZ,
  rsvp_edit_token_hash   TEXT UNIQUE,
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (access_token_hash IS NOT NULL OR rsvp_edit_token_hash IS NOT NULL)
);

CREATE INDEX idx_guests_invitation_id ON guests(invitation_id);
CREATE INDEX idx_guests_rsvp ON guests(invitation_id, rsvp_status);
CREATE UNIQUE INDEX uq_guests_invitation_phone
  ON guests(invitation_id, normalized_phone)
  WHERE normalized_phone IS NOT NULL;
```

Tidak dibuat index tambahan pada `guest_credentials.access_token_hash`/`rsvp_edit_token_hash` karena `UNIQUE` sudah membuat index lookup yang diperlukan.

**Token guest:** token asli cryptographically random dan berentropi tinggi. Server membentuk lookup HMAC-SHA-256 menggunakan secret server-only lalu menyimpan hasilnya di `guest_credentials`. Regenerate link mengganti hash sehingga token lama langsung invalid.

**RSVP open:** no-token membutuhkan nama + nomor WhatsApp. Nomor dinormalisasi; nomor sama pada invitation yang sama mengacu ke respondent yang sama. Update RSVP lama hanya diizinkan bila `rsvp_edit_token` cookie valid. Nomor WhatsApp saja tidak menjadi credential.

**Moderasi guestbook:**
- `auto`: wish baru dapat langsung `approved`;
- `manual`: wish baru `pending` sampai owner approve;
- `approved/rejected + edit` -> `pending` pada mode manual;
- `hidden + edit` -> tetap `hidden`;
- public feed hanya mengeluarkan row/status yang memang boleh tampil.

### 4.7 Tabel: `security_audit_logs` dan purge request

Security audit log adalah append-oriented dari perspektif aplikasi dan disimpan **365 hari**. Raw PIN, guest token asli, session token, secret, dan raw IP dilarang masuk log. Jika perlu network correlation, gunakan `ip_hash` HMAC.

```sql
CREATE TABLE security_audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invitation_id  UUID REFERENCES invitations(id) ON DELETE SET NULL,
  actor_user_id  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  event_type     TEXT NOT NULL,
  severity       TEXT NOT NULL DEFAULT 'info'
                 CHECK (severity IN ('info','warning','high','critical')),
  ip_hash        TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  protected      BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE security_audit_purge_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type   TEXT NOT NULL CHECK (request_type = 'emergency_protected'),
  requested_by   UUID NOT NULL, -- historical actor id; sengaja tanpa FK agar account deletion tidak memblokir history
  approved_by    UUID,
  target_spec    JSONB NOT NULL CHECK (jsonb_typeof(target_spec) = 'object'),
  reason_code    TEXT NOT NULL,
  reason_note    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','cancelled','executed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at    TIMESTAMPTZ,
  executed_at    TIMESTAMPTZ,
  CHECK (approved_by IS NULL OR approved_by <> requested_by),
  CHECK (status NOT IN ('approved','executed') OR approved_by IS NOT NULL),
  CHECK (
    (status = 'pending' AND resolved_at IS NULL AND executed_at IS NULL)
    OR (status IN ('approved','rejected','cancelled') AND resolved_at IS NOT NULL AND executed_at IS NULL)
    OR (status = 'executed' AND resolved_at IS NOT NULL AND executed_at IS NOT NULL)
  )
);

CREATE INDEX idx_security_audit_user_created
  ON security_audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_security_audit_invitation_created
  ON security_audit_logs(invitation_id, created_at DESC) WHERE invitation_id IS NOT NULL;
CREATE INDEX idx_security_audit_actor_created
  ON security_audit_logs(actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;
CREATE INDEX idx_security_audit_type_created
  ON security_audit_logs(event_type, created_at DESC);
CREATE INDEX idx_audit_purge_requested_by_created
  ON security_audit_purge_requests(requested_by, created_at DESC);
```

`security_audit_purge`, `security_audit_bulk_purge`, dan `security_audit_emergency_purge` adalah protected audit events. Purge normal tidak boleh menargetkan protected events. Purge dilakukan oleh dedicated privileged operation; generic browser/server CRUD tidak memiliki `UPDATE/DELETE` grant terhadap audit table.

Emergency purge protected event membutuhkan dua super-admin berbeda yang keduanya melakukan sensitive re-auth. Jika active super-admin <2, request tidak dapat dieksekusi.

### 4.8 Tabel: `security_incidents`

Dipakai untuk deduplikasi alert serangan PIN/governance agar email tidak dikirim berulang-ulang.

```sql
CREATE TABLE security_incidents (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_key       TEXT NOT NULL,
  invitation_id      UUID REFERENCES invitations(id) ON DELETE CASCADE,
  incident_type      TEXT NOT NULL,
  status             TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','resolved')),
  started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_suspicious_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at        TIMESTAMPTZ,
  counters           JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(counters) = 'object'),
  alert_sent_at      TIMESTAMPTZ,
  recovery_sent_at   TIMESTAMPTZ,
  CHECK (last_suspicious_at >= started_at),
  CHECK (
    (status = 'open' AND resolved_at IS NULL)
    OR (status = 'resolved' AND resolved_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX uq_security_incident_open_key
  ON security_incidents(incident_key)
  WHERE status = 'open';
CREATE INDEX idx_security_incident_invitation
  ON security_incidents(invitation_id, last_suspicious_at DESC)
  WHERE invitation_id IS NOT NULL;
```

Contoh `incident_key`: `pin:<invitation_uuid>` atau `governance:global`. PIN security incident ditutup setelah **1 jam tanpa aktivitas mencurigakan**. Risk history Redis tetap boleh hidup 6 jam.

### 4.9 Tabel: `admin_support_access`

Admin/super-admin **tidak mendapat SELECT luas ke data user**. Metadata operasional disediakan melalui safe server query. Jika support membutuhkan data invitation tertentu, buat temporary support grant per invitation dan **ikat grant ke Supabase Auth session yang membuatnya**.

```sql
CREATE TABLE admin_support_access (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id   UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  auth_session_id UUID NOT NULL, -- claim session_id; sengaja tanpa FK ke auth.sessions
  access_level    TEXT NOT NULL DEFAULT 'read'
                  CHECK (access_level IN ('read','write')),
  role_at_grant   TEXT NOT NULL CHECK (role_at_grant IN ('admin','super_admin')),
  auth_context_version_at_grant INT NOT NULL CHECK (auth_context_version_at_grant > 0),
  reason_code     TEXT NOT NULL,
  reason_note     TEXT,
  scopes          TEXT[] NOT NULL CHECK (cardinality(scopes) > 0),
  granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  revoked_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > granted_at),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE INDEX idx_support_access_active
  ON admin_support_access(admin_user_id, invitation_id, auth_session_id, expires_at)
  WHERE revoked_at IS NULL;
CREATE INDEX idx_support_access_invitation_active
  ON admin_support_access(invitation_id, expires_at)
  WHERE revoked_at IS NULL;
```

Default support access adalah **read-only selama 30 menit**. Elevasi ke write membutuhkan re-authentication lagi, alasan baru, audit terpisah, dan mutation whitelist.

Support request memverifikasi:

```text
current user = admin_user_id
+ current JWT session_id = auth_session_id
+ role server-side masih admin/super_admin
+ auth_context_version masih sama
+ grant belum expired/revoked
+ scope/action sesuai
+ session_id masih ada di `auth.sessions` pada setiap request support content
```

Tidak dibuat FK ke `auth.sessions` karena row session dikelola Supabase dan akan dihapus saat logout/revocation; keberadaannya diperiksa server-side berdasarkan primary key pada **setiap** request support content. Credential/hash, raw payment credential, secret, dan raw IP tidak pernah masuk support scope.

### 4.10 Tabel: `admin_role_change_requests`

Historical governance row harus survive account deletion dan tidak boleh membuat `auth.users -> user_profiles` cascade gagal. Karena itu actor/target UUID pada request sengaja disimpan sebagai historical identifiers tanpa FK.

```sql
CREATE TABLE admin_role_change_requests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by     UUID NOT NULL,
  target_user_id   UUID NOT NULL,
  current_role     TEXT NOT NULL CHECK (current_role IN ('user','admin','super_admin')),
  target_role      TEXT NOT NULL CHECK (target_role IN ('user','admin','super_admin')),
  reason_code      TEXT NOT NULL,
  reason_note      TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by      UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at      TIMESTAMPTZ,
  CHECK (current_role <> target_role),
  CHECK (approved_by IS NULL OR approved_by <> requested_by),
  CHECK (approved_by IS NULL OR approved_by <> target_user_id),
  CHECK (
    (status = 'pending' AND resolved_at IS NULL)
    OR (status <> 'pending' AND resolved_at IS NOT NULL)
  )
);

CREATE INDEX idx_admin_role_change_target_created
  ON admin_role_change_requests(target_user_id, created_at DESC);
CREATE INDEX idx_admin_role_change_requester_created
  ON admin_role_change_requests(requested_by, created_at DESC);
```

Self-removal request diperbolehkan, tetapi approval tetap berasal dari super-admin lain. Jika active super-admin tinggal satu, sistem masuk **governance degraded mode**; perubahan super-admin dan emergency protected-audit purge diblokir sampai bootstrap administratif eksternal memulihkan jumlah minimal dua.

### 4.11 Tabel: `draft_extension_products`

Draft Extension adalah produk retention **per invitation**, bukan bagian tier publish. Duration product dikunci oleh schema; admin hanya mengelola harga/active/order.

```sql
CREATE TABLE draft_extension_products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT NOT NULL UNIQUE CHECK (code IN ('draft_90d','draft_180d','draft_365d')),
  name          TEXT NOT NULL,
  duration_days INT NOT NULL,
  price_amount  INT NOT NULL CHECK (price_amount > 0),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (code = 'draft_90d'  AND duration_days = 90) OR
    (code = 'draft_180d' AND duration_days = 180) OR
    (code = 'draft_365d' AND duration_days = 365)
  )
);
```

### 4.12 Tabel: `transactions`, `payment_attempts` & `payment_provider_events`

Payment domain dipisahkan menjadi tiga lapisan:

1. `transactions` = commercial ledger/business state;
2. `payment_attempts` = satu percobaan provider checkout; dan
3. `payment_provider_events` = append-only provider observation history.

Semua nilai uang IDR disimpan sebagai **integer Rupiah** (`*_amount_idr`).

```sql
CREATE TABLE transactions (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  invitation_id              UUID REFERENCES invitations(id) ON DELETE SET NULL,

  transaction_type           TEXT NOT NULL
                             CHECK (transaction_type IN ('initial_publish','tier_upgrade','renewal','draft_extension')),
  from_tier_id               UUID REFERENCES tiers(id),
  to_tier_id                 UUID REFERENCES tiers(id),
  draft_extension_product_id UUID REFERENCES draft_extension_products(id),

  amount_idr                 BIGINT NOT NULL CHECK (amount_idr >= 0),
  currency                   TEXT NOT NULL DEFAULT 'IDR' CHECK (currency = 'IDR'),
  pricing_snapshot           JSONB NOT NULL CHECK (jsonb_typeof(pricing_snapshot) = 'object'),
  entitlement_snapshot       JSONB CHECK (entitlement_snapshot IS NULL OR jsonb_typeof(entitlement_snapshot) = 'object'),

  payment_provider           TEXT CHECK (payment_provider IS NULL OR payment_provider = 'midtrans'),
  client_request_id          TEXT,
  idempotency_fingerprint    TEXT,
  payment_state              TEXT NOT NULL DEFAULT 'creating'
                             CHECK (payment_state IN (
                               'creating','provider_create_unknown','awaiting_payment','paid','failed','expired',
                               'cancel_requested','cancelled','partially_reversed','reversed','requires_review'
                             )),
  funded_at                  TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CHECK ((client_request_id IS NULL) = (idempotency_fingerprint IS NULL)),
  CHECK ((amount_idr = 0 AND payment_provider IS NULL) OR (amount_idr > 0 AND payment_provider = 'midtrans')),
  CHECK (
    (transaction_type = 'draft_extension'
      AND from_tier_id IS NULL AND to_tier_id IS NULL
      AND draft_extension_product_id IS NOT NULL
      AND entitlement_snapshot IS NULL)
    OR
    (transaction_type = 'initial_publish'
      AND from_tier_id IS NULL AND to_tier_id IS NOT NULL
      AND draft_extension_product_id IS NULL
      AND entitlement_snapshot IS NOT NULL)
    OR
    (transaction_type = 'tier_upgrade'
      AND from_tier_id IS NOT NULL AND to_tier_id IS NOT NULL
      AND from_tier_id <> to_tier_id
      AND draft_extension_product_id IS NULL
      AND entitlement_snapshot IS NOT NULL)
    OR
    (transaction_type = 'renewal'
      AND from_tier_id IS NOT NULL AND to_tier_id = from_tier_id
      AND draft_extension_product_id IS NULL
      AND entitlement_snapshot IS NOT NULL)
  ),
  CHECK (payment_state NOT IN ('paid','partially_reversed','reversed') OR funded_at IS NOT NULL)
);

CREATE TABLE payment_attempts (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id             UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  provider                   TEXT NOT NULL CHECK (provider = 'midtrans'),
  attempt_no                 INT NOT NULL DEFAULT 1 CHECK (attempt_no >= 1),
  order_id                   TEXT NOT NULL UNIQUE CHECK (char_length(order_id) BETWEEN 1 AND 50),
  snap_token_ciphertext      TEXT,
  redirect_url_ciphertext    TEXT,
  token_key_version          INT CHECK (token_key_version IS NULL OR token_key_version > 0),
  page_expires_at            TIMESTAMPTZ,
  provider_expires_at        TIMESTAMPTZ,
  snap_session_cancelled_at  TIMESTAMPTZ,

  provider_transaction_id    TEXT,
  provider_status            TEXT,
  fraud_status               TEXT,
  payment_type               TEXT,
  channel                    TEXT,
  acquirer                   TEXT,
  gross_amount_idr           BIGINT CHECK (gross_amount_idr IS NULL OR gross_amount_idr >= 0),
  provider_transaction_time  TIMESTAMPTZ,
  provider_settlement_time   TIMESTAMPTZ,

  create_state               TEXT NOT NULL DEFAULT 'requested'
                             CHECK (create_state IN ('requested','created','unknown','failed')),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (transaction_id, attempt_no),
  UNIQUE (id, transaction_id),
  CHECK ((snap_token_ciphertext IS NULL AND redirect_url_ciphertext IS NULL) OR token_key_version IS NOT NULL)
);

CREATE UNIQUE INDEX uq_midtrans_transaction_id
  ON payment_attempts(provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;

CREATE TABLE payment_provider_events (
  id                         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id             UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  payment_attempt_id         UUID,
  source                     TEXT NOT NULL
                             CHECK (source IN ('webhook','status_poll','manual_reconciliation','snap_session_cancel_api','cancel_api','expire_api','refund_api')),
  provider_status            TEXT,
  fraud_status               TEXT,
  payment_type               TEXT,
  currency                   TEXT,
  merchant_id                TEXT,
  status_code                TEXT,
  gross_amount_idr           BIGINT CHECK (gross_amount_idr IS NULL OR gross_amount_idr >= 0),
  provider_transaction_id    TEXT,
  provider_transaction_time  TIMESTAMPTZ,
  provider_settlement_time   TIMESTAMPTZ,
  event_fingerprint          TEXT NOT NULL UNIQUE,
  payload_hash               TEXT NOT NULL,
  applied_at                 TIMESTAMPTZ,
  ignored_reason             TEXT,
  received_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (payment_attempt_id, transaction_id)
    REFERENCES payment_attempts(id, transaction_id),
  CHECK (NOT (applied_at IS NOT NULL AND ignored_reason IS NOT NULL))
);

CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_transactions_invitation_created ON transactions(invitation_id, created_at DESC)
  WHERE invitation_id IS NOT NULL;
CREATE INDEX idx_transactions_reconcile
  ON transactions(updated_at, id)
  WHERE payment_state IN ('creating','provider_create_unknown','awaiting_payment','cancel_requested','requires_review');
CREATE INDEX idx_transactions_from_tier ON transactions(from_tier_id) WHERE from_tier_id IS NOT NULL;
CREATE INDEX idx_transactions_to_tier ON transactions(to_tier_id) WHERE to_tier_id IS NOT NULL;
CREATE INDEX idx_transactions_extension_product ON transactions(draft_extension_product_id)
  WHERE draft_extension_product_id IS NOT NULL;
CREATE UNIQUE INDEX uq_transaction_client_request
  ON transactions(user_id, client_request_id)
  WHERE user_id IS NOT NULL AND client_request_id IS NOT NULL;
CREATE INDEX idx_payment_attempts_provider_status
  ON payment_attempts(provider_status) WHERE provider_status IS NOT NULL;
CREATE INDEX idx_payment_provider_events_transaction_received
  ON payment_provider_events(transaction_id, received_at DESC);
CREATE INDEX idx_payment_provider_events_attempt
  ON payment_provider_events(payment_attempt_id, transaction_id, received_at DESC)
  WHERE payment_attempt_id IS NOT NULL;
CREATE UNIQUE INDEX uq_one_active_commercial_checkout_per_invitation
  ON transactions(invitation_id)
  WHERE invitation_id IS NOT NULL
    AND payment_state IN ('creating','provider_create_unknown','awaiting_payment','cancel_requested','requires_review');
```

`UNIQUE(transaction_id, attempt_no)` sudah menjadi leading index untuk `payment_attempts.transaction_id`; tidak dibuat index duplikat tambahan.

**Relational integrity:** composite FK pada `payment_provider_events` memastikan `payment_attempt_id` benar-benar milik `transaction_id` yang sama. Pola yang sama dipakai pada `payment_adjustments`.

**Immutable commercial facts:** setelah transaction dibuat, `transaction_type`, target tier/product, `amount_idr`, `currency`, `pricing_snapshot`, `entitlement_snapshot`, `client_request_id`, dan `idempotency_fingerprint` tidak boleh ditimpa. Mutation payment terpusat hanya mengubah canonical lifecycle fields seperti `payment_state`, `funded_at`, dan timestamp melalui guarded transaction function.

Database mengunci fakta tersebut dan memastikan `user_id` sesuai owner invitation saat keduanya masih tersedia:

```sql
CREATE OR REPLACE FUNCTION private.guard_transaction_commercial_facts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ROW(
       NEW.transaction_type, NEW.from_tier_id, NEW.to_tier_id,
       NEW.draft_extension_product_id, NEW.amount_idr, NEW.currency,
       NEW.pricing_snapshot, NEW.entitlement_snapshot,
       NEW.payment_provider, NEW.client_request_id, NEW.idempotency_fingerprint
     ) IS DISTINCT FROM ROW(
       OLD.transaction_type, OLD.from_tier_id, OLD.to_tier_id,
       OLD.draft_extension_product_id, OLD.amount_idr, OLD.currency,
       OLD.pricing_snapshot, OLD.entitlement_snapshot,
       OLD.payment_provider, OLD.client_request_id, OLD.idempotency_fingerprint
     )
  THEN
    RAISE EXCEPTION 'commercial transaction facts are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_transaction_commercial_facts
BEFORE UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION private.guard_transaction_commercial_facts();

CREATE OR REPLACE FUNCTION private.assert_transaction_subject_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.invitation_id IS NOT NULL AND NEW.user_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.invitations i
       WHERE i.id = NEW.invitation_id AND i.user_id = NEW.user_id
     )
  THEN
    RAISE EXCEPTION 'transaction user_id does not own invitation_id';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transaction_subject_consistency
BEFORE INSERT OR UPDATE OF user_id, invitation_id ON transactions
FOR EACH ROW EXECUTE FUNCTION private.assert_transaction_subject_consistency();
```

`payment_provider_events` tidak boleh mengubah fakta provider setelah insert. Hanya annotation processing boleh bergerak satu arah (`applied_at` NULL→timestamp atau `ignored_reason` NULL→value):

```sql
CREATE OR REPLACE FUNCTION private.guard_payment_provider_event_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF ROW(
       NEW.transaction_id, NEW.payment_attempt_id, NEW.source,
       NEW.provider_status, NEW.fraud_status, NEW.payment_type, NEW.currency,
       NEW.merchant_id, NEW.status_code, NEW.gross_amount_idr,
       NEW.provider_transaction_id, NEW.provider_transaction_time,
       NEW.provider_settlement_time, NEW.event_fingerprint,
       NEW.payload_hash, NEW.received_at
     ) IS DISTINCT FROM ROW(
       OLD.transaction_id, OLD.payment_attempt_id, OLD.source,
       OLD.provider_status, OLD.fraud_status, OLD.payment_type, OLD.currency,
       OLD.merchant_id, OLD.status_code, OLD.gross_amount_idr,
       OLD.provider_transaction_id, OLD.provider_transaction_time,
       OLD.provider_settlement_time, OLD.event_fingerprint,
       OLD.payload_hash, OLD.received_at
     )
     OR (OLD.applied_at IS NOT NULL AND NEW.applied_at IS DISTINCT FROM OLD.applied_at)
     OR (OLD.ignored_reason IS NOT NULL AND NEW.ignored_reason IS DISTINCT FROM OLD.ignored_reason)
  THEN
    RAISE EXCEPTION 'provider event facts/processed annotation are immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_payment_provider_event_update
BEFORE UPDATE ON payment_provider_events
FOR EACH ROW EXECUTE FUNCTION private.guard_payment_provider_event_update();
```

Regression test wajib mencoba memodifikasi fakta transaksi/provider event dan memastikan ditolak.

Untuk transaksi zero-value, buat `transactions(payment_provider=NULL, payment_state='paid', amount_idr=0, funded_at=NOW())` tanpa `payment_attempts` dan tanpa panggilan Midtrans.

### 4.13 Tabel: `leads`

```sql
CREATE TABLE leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email                  TEXT NOT NULL,
  normalized_email       TEXT NOT NULL,
  phone                  TEXT,
  source                 TEXT NOT NULL DEFAULT 'lead_magnet',
  privacy_notice_version TEXT NOT NULL,
  consent_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_leads_normalized_email
  ON leads(normalized_email);
```

`normalized_email` dihitung/validasi trusted server (`trim + lowercase`) dan bukan credential. Lead magnet hanya mengumpulkan field yang diperlukan dan consent tidak digabung diam-diam dengan marketing preference lain.

### 4.14 Tabel: `global_settings`

`global_settings` hanya untuk konfigurasi global non-entitlement seperti visibilitas section homepage atau maintenance mode.

```sql
CREATE TABLE global_settings (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Harga/limit tier tidak disimpan di `global_settings`.

### 4.15 Tabel Media: `media_assets`, `invitation_gallery_items` & `upload_reservations`

Media lifecycle dan ownership disimpan eksplisit. `owner_id` dipertahankan untuk RLS/performance tetapi **tidak boleh drift**: composite FK mengikatnya ke `(invitation_id, invitations.user_id)`.

```sql
CREATE TABLE media_assets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id         UUID NOT NULL,
  owner_id              UUID NOT NULL,
  kind                  TEXT NOT NULL CHECK (kind IN ('image','audio','video')),
  purpose               TEXT NOT NULL
                        CHECK (purpose IN ('couple_portrait','story_image','gallery','background_audio','qris_image','future_uploaded_video')),
  status                TEXT NOT NULL DEFAULT 'pending_upload'
                        CHECK (status IN ('pending_upload','uploaded','processing','ready','rejected','deleting','deleted')),
  version               INT NOT NULL DEFAULT 1 CHECK (version > 0),
  original_filename     TEXT,
  declared_mime         TEXT,
  detected_mime         TEXT,
  quarantine_path       TEXT,
  final_path            TEXT,
  poster_path           TEXT,
  byte_size             BIGINT CHECK (byte_size IS NULL OR byte_size >= 0),
  width                 INT CHECK (width IS NULL OR width > 0),
  height                INT CHECK (height IS NULL OR height > 0),
  focus_x               NUMERIC(5,4) NOT NULL DEFAULT 0.5 CHECK (focus_x BETWEEN 0 AND 1),
  focus_y               NUMERIC(5,4) NOT NULL DEFAULT 0.5 CHECK (focus_y BETWEEN 0 AND 1),
  duration_seconds      NUMERIC CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  processing_started_at TIMESTAMPTZ,
  failure_code          TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (id, invitation_id),
  FOREIGN KEY (invitation_id, owner_id)
    REFERENCES invitations(id, user_id) ON DELETE CASCADE,
  CHECK (
    (kind = 'image' AND purpose IN ('couple_portrait','story_image','gallery','qris_image'))
    OR (kind = 'audio' AND purpose = 'background_audio')
    OR (kind = 'video' AND purpose = 'future_uploaded_video')
  )
);

CREATE TABLE invitation_gallery_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  media_asset_id  UUID NOT NULL,
  position        SMALLINT NOT NULL CHECK (position >= 0),
  caption         TEXT CHECK (char_length(caption) <= 300),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (invitation_id, position),
  UNIQUE (invitation_id, media_asset_id),
  FOREIGN KEY (media_asset_id, invitation_id)
    REFERENCES media_assets(id, invitation_id) ON DELETE CASCADE
);

CREATE TABLE upload_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id   UUID NOT NULL,
  owner_id        UUID NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('image','audio','video')),
  purpose         TEXT NOT NULL
                  CHECK (purpose IN ('couple_portrait','story_image','gallery','background_audio','qris_image','future_uploaded_video')),
  reserved_count  INT NOT NULL DEFAULT 1 CHECK (reserved_count > 0),
  reserved_bytes  BIGINT NOT NULL DEFAULT 0 CHECK (reserved_bytes >= 0),
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','consumed','released','expired')),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (invitation_id, owner_id)
    REFERENCES invitations(id, user_id) ON DELETE CASCADE,
  CHECK (expires_at > created_at),
  CHECK (
    (kind = 'image' AND purpose IN ('couple_portrait','story_image','gallery','qris_image'))
    OR (kind = 'audio' AND purpose = 'background_audio')
    OR (kind = 'video' AND purpose = 'future_uploaded_video')
  )
);

CREATE INDEX idx_media_assets_invitation_owner_status
  ON media_assets(invitation_id, owner_id, status, kind, purpose);
CREATE INDEX idx_media_assets_owner_updated
  ON media_assets(owner_id, updated_at DESC);
CREATE UNIQUE INDEX uq_media_quarantine_path
  ON media_assets(quarantine_path) WHERE quarantine_path IS NOT NULL;
CREATE UNIQUE INDEX uq_media_final_path
  ON media_assets(final_path) WHERE final_path IS NOT NULL;
-- UNIQUE(invitation_id, position) sudah menjadi ordering index galeri.
CREATE INDEX idx_gallery_media_invitation
  ON invitation_gallery_items(media_asset_id, invitation_id);
CREATE INDEX idx_upload_reservation_active
  ON upload_reservations(invitation_id, owner_id, kind, purpose, expires_at)
  WHERE status = 'active';
CREATE INDEX idx_upload_reservation_owner_active
  ON upload_reservations(owner_id, expires_at)
  WHERE status = 'active';
```

**Semantic media contract:** `kind` menjelaskan format teknis; `purpose` menjelaskan kelas penggunaan untuk validasi/quota. Penempatan spesifik (`groom.photoMediaId`, `bride.photoMediaId`, `love_story[].photoMediaId`, `bank_accounts[].qrisMediaId`, `settings.backgroundAudioMediaId`) tetap berada pada canonical content contract di §4.4 dan harus diverifikasi same-invitation.

`invitation_gallery_items` adalah satu-satunya relasi yang menghitung `gallery_limit`; portrait/story/QRIS image **tidak** ikut gallery quota hanya karena `kind='image'`. Aggregate storage tetap menghitung semua asset non-deleted. `purpose='future_uploaded_video'` hanya merupakan forward-compatible schema reservation; selama uploaded-video belum menjadi capability aktif MVP, upload reservation/finalization untuk purpose tersebut **wajib ditolak server-side**.

`focus_x/focus_y` adalah normalized subject focus yang **asset-owned dan theme-agnostic**. Pergantian theme tidak melakukan destructive crop atau menimpa original/focus. Renderer memetakan focus yang sama ke aspect ratio/mask theme; jika perlu derived crop/rendition baru, hasil dibuat non-destruktif dan asset lama/original tetap tersedia sampai derived variant siap.

Karena beberapa media ID berada di JSONB, mutation delete/replacement **wajib** mengecek reference integrity di trusted transaction: asset yang masih direferensikan tidak boleh hard-delete. Replacement melakukan `new asset ready -> atomic reference swap -> old asset deleting`, sehingga tidak ada broken reference di antara langkah.

`gallery JSONB` tidak menjadi source of truth. Urutan/caption galeri berasal dari `invitation_gallery_items`; file lifecycle berasal dari `media_assets`. Hanya `media_assets.status='ready'` yang boleh ditautkan untuk serving final/publish requirement.

Reservation dibuat **atomic** sebelum signed upload URL diberikan sehingga dua tab tidak dapat melampaui quota bersamaan.

### 4.16 Reliability: `outbox_events`, `failed_jobs`, `scheduled_job_runs`

Outbox menggunakan claim lease agar worker yang mati setelah `status='dispatching'` tidak membuat row macet permanen.

```sql
CREATE TABLE outbox_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        TEXT NOT NULL,
  aggregate_type    TEXT NOT NULL,
  aggregate_id      UUID,
  payload_version   INT NOT NULL DEFAULT 1 CHECK (payload_version > 0),
  payload            JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payload) = 'object'),
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','dispatching','dispatched','failed')),
  attempts           INT NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  available_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_at          TIMESTAMPTZ,
  lock_token         UUID,
  dispatched_at      TIMESTAMPTZ,
  last_error_code    TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (status = 'dispatching' AND locked_at IS NOT NULL AND lock_token IS NOT NULL)
    OR (status <> 'dispatching' AND locked_at IS NULL AND lock_token IS NULL)
  ),
  CHECK (
    (status = 'dispatched' AND dispatched_at IS NOT NULL)
    OR (status <> 'dispatched' AND dispatched_at IS NULL)
  )
);

CREATE TABLE failed_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type          TEXT NOT NULL,
  resource_id       UUID,
  idempotency_key   TEXT NOT NULL UNIQUE,
  attempt_count     INT NOT NULL CHECK (attempt_count > 0),
  error_code        TEXT,
  error_summary     TEXT,
  first_failed_at   TIMESTAMPTZ NOT NULL,
  last_failed_at    TIMESTAMPTZ NOT NULL,
  resolved_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (last_failed_at >= first_failed_at)
);

CREATE TABLE scheduled_job_runs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name          TEXT NOT NULL,
  started_at        TIMESTAMPTZ NOT NULL,
  completed_at      TIMESTAMPTZ,
  status             TEXT NOT NULL CHECK (status IN ('running','succeeded','failed')),
  processed_count   INT NOT NULL DEFAULT 0 CHECK (processed_count >= 0),
  failed_count      INT NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  error_summary     TEXT,
  CHECK (
    (status = 'running' AND completed_at IS NULL)
    OR (status IN ('succeeded','failed') AND completed_at IS NOT NULL)
  ),
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX idx_outbox_due
  ON outbox_events(available_at, id)
  WHERE status = 'pending';
CREATE INDEX idx_outbox_dispatch_lease
  ON outbox_events(locked_at, id)
  WHERE status = 'dispatching';
CREATE INDEX idx_scheduled_runs_job_started
  ON scheduled_job_runs(job_name, started_at DESC);
```

Claim dispatcher memakai short DB transaction + `FOR UPDATE SKIP LOCKED`, mengisi `locked_at/lock_token`, lalu commit. `dispatching` yang lease-nya melewati timeout boleh direclaim secara guarded. Retryable dispatch error mengembalikan row ke `pending` dengan `available_at` backoff; `failed` adalah state terminal setelah retry budget/permanent error dan dicatat ke `failed_jobs`, sehingga index due **hanya** memuat `pending`. Queue tetap dianggap **at-least-once**; duplicate publish/consumer delivery harus idempotent.

`outbox_events.payload` hanya membawa identifier/data routing minimal; worker membaca ulang business state dari database.

### 4.17 Data Portability, Email, Payment Adjustment & Analytics

```sql
CREATE TABLE data_exports (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- requester; self-export requester=subject
  invitation_id       UUID REFERENCES invitations(id) ON DELETE CASCADE,
  scope               TEXT NOT NULL CHECK (scope IN ('invitation','account','admin_bulk')),
  request_idempotency_key TEXT NOT NULL UNIQUE,
  request_fingerprint TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','processing','ready','failed','expired','deleted')),
  object_path         TEXT,
  expires_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at        TIMESTAMPTZ,
  CHECK (
    (scope = 'invitation' AND invitation_id IS NOT NULL)
    OR (scope IN ('account','admin_bulk') AND invitation_id IS NULL)
  ),
  CHECK (status <> 'ready' OR (object_path IS NOT NULL AND expires_at IS NOT NULL AND completed_at IS NOT NULL))
);

CREATE TABLE data_deletion_tombstones (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_user_id       UUID NOT NULL,
  deletion_completed_at TIMESTAMPTZ NOT NULL,
  purge_after           TIMESTAMPTZ NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (purge_after > deletion_completed_at)
);

CREATE TABLE email_deliveries (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invitation_id       UUID REFERENCES invitations(id) ON DELETE SET NULL,
  template_code       TEXT NOT NULL,
  template_version    INT NOT NULL CHECK (template_version > 0),
  idempotency_key     TEXT NOT NULL UNIQUE,
  provider_message_id TEXT,
  status              TEXT NOT NULL DEFAULT 'queued'
                      CHECK (status IN ('queued','sending','sent','delivered','failed','bounced','complained')),
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (status NOT IN ('sent','delivered','bounced','complained') OR sent_at IS NOT NULL),
  CHECK (status <> 'delivered' OR delivered_at IS NOT NULL),
  CHECK (status <> 'failed' OR failed_at IS NOT NULL)
);

CREATE TABLE payment_adjustments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id        UUID NOT NULL REFERENCES transactions(id),
  payment_attempt_id    UUID,
  adjustment_type       TEXT NOT NULL CHECK (adjustment_type IN (
                           'refund','partial_refund','chargeback','partial_chargeback',
                           'chargeback_reversal','provider_reversal','manual_external_refund'
                         )),
  amount_idr            BIGINT NOT NULL CHECK (amount_idr > 0),
  refund_key            TEXT,
  provider_reference    TEXT,
  provider_status       TEXT,
  status                TEXT NOT NULL CHECK (status IN (
                           'requested','provider_approved','bank_confirmed','confirmed',
                           'failed','requires_manual_review','reversed'
                         )),
  reason_code           TEXT,
  reason_note           TEXT,
  requested_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  provider_approved_at  TIMESTAMPTZ,
  bank_confirmed_at     TIMESTAMPTZ,
  confirmed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (payment_attempt_id, transaction_id)
    REFERENCES payment_attempts(id, transaction_id),
  CHECK (
    adjustment_type NOT IN ('refund','partial_refund') OR refund_key IS NOT NULL
  ),
  CHECK (status <> 'provider_approved' OR provider_approved_at IS NOT NULL),
  CHECK (status <> 'bank_confirmed' OR bank_confirmed_at IS NOT NULL),
  CHECK (status <> 'confirmed' OR confirmed_at IS NOT NULL)
);

CREATE TABLE invitation_analytics_daily (
  invitation_id     UUID NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  views             BIGINT NOT NULL DEFAULT 0 CHECK (views >= 0),
  rsvp_submissions  BIGINT NOT NULL DEFAULT 0 CHECK (rsvp_submissions >= 0),
  PRIMARY KEY (invitation_id, date)
);

CREATE UNIQUE INDEX uq_data_export_object_path
  ON data_exports(object_path) WHERE object_path IS NOT NULL;
CREATE INDEX idx_data_exports_user_created
  ON data_exports(user_id, created_at DESC);
CREATE INDEX idx_data_exports_invitation_created
  ON data_exports(invitation_id, created_at DESC)
  WHERE invitation_id IS NOT NULL;
CREATE INDEX idx_email_delivery_user_created
  ON email_deliveries(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_email_delivery_invitation_created
  ON email_deliveries(invitation_id, created_at DESC) WHERE invitation_id IS NOT NULL;
CREATE INDEX idx_email_delivery_pending
  ON email_deliveries(created_at, id) WHERE status IN ('queued','sending');
CREATE UNIQUE INDEX uq_payment_adjustment_refund_key
  ON payment_adjustments(refund_key) WHERE refund_key IS NOT NULL;
CREATE INDEX idx_payment_adjustment_transaction_created
  ON payment_adjustments(transaction_id, created_at DESC);
CREATE INDEX idx_payment_adjustment_attempt
  ON payment_adjustments(payment_attempt_id, transaction_id, created_at DESC)
  WHERE payment_attempt_id IS NOT NULL;
```

`data_deletion_tombstones` sengaja tidak memiliki FK cascade ke `auth.users`, agar restore backup lama tetap dapat menerapkan deletion suppression setelah user aktif sudah dihapus.

Export retry memakai `request_idempotency_key + request_fingerprint`; key sama dengan intent berbeda adalah conflict, bukan membuat file kedua.

### 4.18 Foreign-Key Index Rule

PostgreSQL tidak otomatis membuat index pada child foreign key. Migration wajib memastikan FK yang dipakai join/delete/lifecycle mempunyai leading index. Index di section sebelumnya sudah mencakup hot-path utama; jalankan Supabase Performance Advisor lint `unindexed_foreign_keys` setelah setiap migration.

Prinsip:

- PK/`UNIQUE` yang sudah mempunyai leading columns sesuai **tidak** diberi index duplikat;
- partial/composite index dipilih sesuai query nyata;
- jangan membuat index hanya karena sebuah kolom mempunyai FK jika workload tidak pernah memerlukannya, tetapi advisor finding harus direview eksplisit;
- `EXPLAIN (ANALYZE, BUFFERS)`/Index Advisor digunakan sebelum menambah index mahal pada tabel besar.

### 4.19 RLS, GRANT, Admin Support & Public Boundary

Semua tabel pada exposed schema mengaktifkan RLS. RLS dan GRANT adalah dua lapisan berbeda: `GRANT` menentukan object/operation yang dapat disentuh role, RLS menentukan row yang boleh terlihat.

```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_pin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_provider_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_extension_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_purge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_support_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_role_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_job_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_deletion_tombstones ENABLE ROW LEVEL SECURITY;
```

Owner read policies untuk tabel yang memang boleh dibaca browser:

```sql
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = id);

CREATE POLICY "Users can view own invitations"
ON invitations FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "Owners can view own events"
ON invitation_events FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.id = invitation_events.invitation_id
      AND i.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Owners can view own guests"
ON guests FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.id = guests.invitation_id
      AND i.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can view own transactions"
ON transactions FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own media metadata"
ON media_assets FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = owner_id);

CREATE POLICY "Owners can view own gallery ordering"
ON invitation_gallery_items FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.id = invitation_gallery_items.invitation_id
      AND i.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Owners can view own daily analytics"
ON invitation_analytics_daily FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM invitations i
    WHERE i.id = invitation_analytics_daily.invitation_id
      AND i.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can view own export jobs"
ON data_exports FOR SELECT TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL AND (SELECT auth.uid()) = user_id);

CREATE POLICY "Anyone can view active tiers"
ON tiers FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Anyone can view active themes"
ON themes FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Anyone can view active draft extension products"
ON draft_extension_products FOR SELECT TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Anyone can view public global settings"
ON global_settings FOR SELECT TO anon, authenticated
USING (key IN ('homepage_sections','maintenance_mode'));
```

Kemudian grant dibuat **minimal**:

```sql
-- Mulai dari deny.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Public catalogue read.
GRANT SELECT ON tiers, themes, draft_extension_products, global_settings TO anon, authenticated;

-- Authenticated owner read. Tidak ada generic browser mutation grant.
GRANT SELECT ON user_profiles, invitations, invitation_events, guests,
  transactions, media_assets, invitation_gallery_items, data_exports,
  invitation_analytics_daily TO authenticated;

-- Credential/internal tables sengaja tidak di-GRANT ke anon/authenticated:
-- invitation_pin_credentials, pin_history, guest_credentials,
-- payment_attempts, payment_provider_events, upload_reservations,
-- audit/governance, outbox/jobs, email delivery, payment adjustments,
-- leads, deletion tombstones, dll.
```

Migration production juga memastikan trusted server role/secret-key path mempunyai privilege yang dibutuhkan. **Jangan** berasumsi default grants Supabase akan tetap sama lintas project/version.

Tidak ada generic client `INSERT/UPDATE/DELETE` policy untuk business tables. Mutation invitation/guest/media/payment dilakukan melalui Server Action/trusted transaction function dengan:

```text
authenticated user resolution
+ ownership/scope check
+ explicit field whitelist
+ state/entitlement invariant
+ optimistic content_version bila content mutation
+ atomic transaction/outbox bila diperlukan
```

**Credential isolation:** authenticated owner tidak mempunyai SELECT grant/policy ke `invitation_pin_credentials`, `pin_history`, atau `guest_credentials`. Hash credential tidak pernah muncul pada owner DTO, support DTO, logs, export, atau public response.

**Public rendering:** tidak ada anonymous raw SELECT ke `invitations`/`guests`. Public route menggunakan server query lalu mengeluarkan DTO whitelist setelah memeriksa:

```text
slug canonical
+ status published
+ expires_at > now()
+ public_suspended_at IS NULL
+ privacy/private-session state
+ optional guest-token identity
```

Public guestbook output hanya `display_name`, `attendance`, `wish_message`, `created_at` dari wish yang memang boleh tampil. Phone, notes, group, credential, internal ID, dan server-only metadata tidak keluar.

**Function/view security:** prefer `SECURITY INVOKER`; view client-accessible menggunakan `security_invoker=true`. Jika suatu privileged helper benar-benar membutuhkan `SECURITY DEFINER`, letakkan di non-exposed schema, `SET search_path=''`, schema-qualify seluruh relation, revoke `PUBLIC EXECUTE`, dan hanya expose wrapper/action yang melakukan explicit auth/state check. Jalankan Supabase Security Advisor setelah setiap perubahan function/view/policy/grant.

### 4.20 Optimistic Locking: Atomic Compare-and-Swap

`content_version` hanya merepresentasikan **content revision**, bukan setiap update internal pada row. View counting, lifecycle scanner, suspension, analytics, atau payment reconciliation tidak boleh menyebabkan autosave conflict.

Client mengirim `currentVersion`; content mutation melakukan atomic compare-and-swap:

```sql
UPDATE invitations
SET
  couple = $new_couple,
  love_story = $new_love_story,
  bank_accounts = $new_bank_accounts,
  settings = $new_settings,
  content_version = content_version + 1,
  updated_at = NOW(),
  last_activity_at = NOW()
WHERE id = $invitation_id
  AND user_id = $authenticated_user_id
  AND content_version = $current_version
RETURNING content_version;
```

Server menganggap `0 rows` sebagai conflict (`409`/typed domain error). Client **tidak** menghitung `version + 1` sendiri. Tidak digunakan generic `BEFORE UPDATE` version trigger karena internal update yang tidak mengubah content tidak boleh menaikkan `content_version`.

Event/gallery mutation yang merupakan bagian editor juga dijalankan dalam transaction yang melakukan compare-and-swap terhadap parent invitation sebelum commit, sehingga seluruh wizard tetap mempunyai satu revision token.

## 5. Supabase Storage

### 5.1 Bucket Private

Gunakan dua area private dengan tanggung jawab berbeda:

```text
invitation_upload_quarantine   # file belum dipercaya
invitation_media               # hanya derived media yang sudah lolos processing
```

Path final:

```text
invitation_media/{user_id}/{invitation_id}/{type}/{media_id}/{variant}.{ext}
```

Tidak ada policy public SELECT permanen pada `storage.objects`.

### 5.2 Upload Flow

```text
browser
→ request upload authorization
→ server: auth + ownership + quota + reservation atomic
→ signed upload URL ke quarantine
→ upload direct-to-storage
→ media.status=uploaded
→ outbox/queue
→ worker validate + process
→ media.status=ready
→ final private media
```

Signed upload URL hanya dibuat setelah `upload_reservations` berhasil. Client filename, extension, dan `Content-Type` tidak dipercaya sebagai security boundary.

### 5.3 Processing Rules

- Validasi actual byte size, magic bytes, detected MIME, decoder success, dimensions/pixel count, dan duration.
- Strip EXIF/GPS/device metadata yang tidak diperlukan.
- Image: decode lalu re-encode dan hasilkan `thumbnail`, `medium`, `large` sesuai kebutuhan theme.
- Audio: probe/validate dan transcode hanya bila pipeline ringan/free-compatible memang diperlukan; hasil original quarantine tidak digunakan sebagai serving asset normal. **Video upload tidak aktif pada zero-cost MVP**; `video_limit` mengatur external embed allowlisted. Jika uploaded-video diaktifkan di masa depan, ia wajib kembali ke quarantine + probe/transcode async yang sama.
- SVG user-uploaded tidak didukung pada scope awal.
- Worker memiliki timeout, memory ceiling, max pixels, max duration, dan max output size.
- `rejected`/failed processing melepas reservation sehingga quota tidak terpakai permanen.
- Incomplete/orphan quarantine object dihapus otomatis setelah 24 jam.

### 5.4 Serving Model

Hanya `media.status='ready'` yang boleh mendapatkan signed URL.

**Public invitation:** authorization memeriksa `published` + belum expired + tidak suspended. Untuk halaman yang boleh shared-cache/ISR, HTML **tidak boleh menyimpan signed Storage URL**. Render stable app media URL/ID (mis. `/api/media/<media_id>/<variant>`); route media dynamic/no-store melakukan authorization ringan lalu mengeluarkan redirect/response menuju signed Storage URL **15 menit**. Dengan demikian cache HTML tidak menjadi rusak ketika signed URL kedaluwarsa.

**Private/personalized invitation:** page dan media endpoint dynamic/no-store; server memeriksa private HMAC session 6 jam (serta guest identity jika relevan) sebelum membuat signed URL **15 menit**.

```text
private invitation session = 6 jam
signed Storage URL          = 15 menit
cacheable public HTML       = stable app media URL/ID, bukan signed URL
```

Admin support tidak menjadi bypass: private media support tetap membutuhkan grant + scope + signed URL. Stable media endpoint tidak boleh menerima arbitrary Storage path; hanya `media_id`/variant yang di-resolve server-side.

### 5.5 Replace & Delete

Replacement tidak overwrite object yang sama:

```text
old READY
+ new PROCESSING
→ new READY
→ atomic reference switch
→ old media asynchronous cleanup
```

Delete:

```text
ready → deleting/deleted
→ hilang dari invitation segera
→ object cleanup asynchronous + idempotent
```

### 5.6 OG/Social Preview

Jangan menaruh signed/private object URL sebagai OG permanen. **Public invitation menggunakan stable app URL** `/<slug>/opengraph-image` yang dirender oleh `opengraph-image.tsx`/`ImageResponse`; server boleh membaca derived private media setelah authorization internal tetapi URL object signed 15 menit **tidak pernah** dimasukkan ke metadata. Response OG dapat dicache sebagai public derived representation dan diinvalidasi/versioned saat konten penting berubah. Private invitation selalu memakai metadata/OG generik yang tidak membocorkan nama, foto, venue, atau detail private.

## 6. Auth Flow (Disederhanakan)

Alur autentikasi dirancang seminimal mungkin dengan hanya 2 state: **draft** dan **synced**. Tidak ada state machine kompleks, tidak ada BroadcastChannel, tidak ada Web Locks.

### 6.1 Supabase Client Management

Ada **3 session-context client** plus **1 privileged server-only client** di `shared/lib/supabase/`. Pemisahan ini mencegah secret/elevated client bercampur dengan user-session client:

- **`server-client.ts`** — Digunakan di Server Components dan Server Actions. Menggunakan `@supabase/ssr` dengan cookie handling dan public Supabase URL/publishable key dari validated env; secret key (`sb_secret_...`) tidak pernah dipakai sebagai user-session client.
- **`browser-client.ts`** — Digunakan di Client Components. Menggunakan `@supabase/ssr` untuk sinkronisasi cookie.
- **`middleware-client.ts`** — Compatibility client yang digunakan di `middleware.ts` untuk refresh token dan coarse route gate selama OpenNext belum mendukung Node Middleware.
- **`service-client.ts`** — Memakai Supabase secret key (`sb_secret_...`; legacy `service_role` key hanya untuk project lama) dan **hanya** boleh di-import trusted Server Action/Route Handler/worker yang sudah melakukan authentication + explicit ownership/scope check. Tidak pernah masuk Client Component, shared browser bundle, atau preview tidak tepercaya.

**Penting:** Gunakan factory yang sesuai; jangan membuat Supabase client ad-hoc. Read owner biasa dapat memakai server client + RLS. Mutation yang tidak diberi direct client policy menggunakan service client/repository server-side setelah whitelist + ownership check. Critical multi-table transition tetap melalui satu atomic PostgreSQL RPC/transaction.

### 6.2 Guest-to-Login & Canonical Invitation Creation

Alur onboarding tetap hanya mempunyai dua sumber state: local draft sebelum login dan database setelah sync. **Tidak boleh ada dua primitive create yang berbeda** antara guest flow dan user yang sudah login.

```text
Landing / Pricing / Catalog / Demo
        ↓
pilih theme tier apa pun
        ↓
isi personalized preview / draft awal
        ↓
register/login bila ingin lanjut
        ↓
createOrSyncInvitation()
        ↓
Dashboard Editor
```

**State 1 — LOCAL DRAFT:** localStorage hanya menyimpan envelope versioned dan allowlist data onboarding yang tidak sensitif:

```typescript
type LocalInvitationDraftV1 = {
  draftSchemaVersion: 1;
  clientRef: string;       // UUID
  createdAt: string;
  updatedAt: string;
  themeId: string;
  coupleNames: {
    groomName?: string;
    brideName?: string;
  };
  weddingDate?: string;    // optional marketing/personalized preview hint; bukan DB event instant
  openingText?: string;
};
```

Dilarang menyimpan PIN/plaintext credential, bank account, guest list/phone, payment state/token, signed URL, private-session material, atau file media di localStorage/sessionStorage. Unknown `draftSchemaVersion` tidak boleh diparse dengan asumsi shape lama; lakukan migration eksplisit atau tawarkan reset sambil mempertahankan recovery copy sampai user memilih.

**State 2 — SYNCED:** database menjadi source of truth. Baik user berasal dari guest onboarding maupun sudah authenticated dari `/create`, keduanya memanggil use-case yang sama:

```typescript
// pseudocode — satu creation primitive kanonik
export async function createOrSyncInvitation(input: unknown) {
  const user = await requireUser();
  await ensureUserProfile(user);
  const draft = invitationCreateOrSyncSchema.parse(input);

  return runAtomicCreateOrSync({
    userId: user.id,
    clientRef: draft.clientRef,
    themeId: draft.themeId,
    couple: draft.couple,
    initialEventDraft: draft.initialEventDraft,
  });
}
```

`runAtomicCreateOrSync()` wajib satu transaction/RPC:

```text
BEGIN
  validate authenticated owner + active theme
  lookup client_ref
    existing milik user yang sama -> return existing row
    existing milik user lain      -> conflict; JANGAN pernah return row orang lain
    belum ada                      -> lanjut
  generate opaque random slug server-side + collision retry terbatas
  INSERT invitations
  INSERT initial invitation_events bila ada draft event
COMMIT
return invitation_id + slug + content_version
```

`client_ref` hanya idempotency correlation, bukan credential. Jika request timeout sesudah commit, retry key yang sama mengembalikan invitation milik user yang sama dan tidak membuat row kedua. localStorage baru dihapus setelah server mengonfirmasi invitation tersedia. Backup sessionStorage sebelum sync hanya boleh berisi envelope allowlist yang sama.

---

### 6.3 Protected Routes via Edge Middleware Compatibility Gate

Baseline Next.js 16+ adalah `src/proxy.ts`, tetapi Proxy tersebut memakai Node.js runtime yang belum didukung OpenNext Cloudflare. Compatibility exception yang disetujui memakai legacy Edge `src/middleware.ts` selama keterbatasan adapter itu berlaku. Middleware hanya menangani refresh cookie session dan coarse route gate; **authorization bisnis/role tetap diulang di Server Component/Server Action/Route Handler**. Untuk identity verification server, jangan mempercayai `getSession()` sebagai authorization source; gunakan verified claims (`getClaims()`) atau fresh `getUser()` ketika benar-benar membutuhkan user record terbaru.

```typescript
// src/middleware.ts — temporary Edge compatibility exception untuk OpenNext
import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseMiddlewareClient } from '@/shared/lib/supabase/middleware-client';

export async function middleware(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request);
  const { data: claimsData, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(claimsData?.claims?.sub);

  const pathname = request.nextUrl.pathname;
  const needsAuth =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname === '/create' ||
    pathname.startsWith('/settings');

  if (needsAuth && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /admin tetap wajib server-side current-role check; Middleware bukan final authorization.
  return getResponse();
}

export const config = {
  // Jangan jalankan auth refresh pada landing/katalog/static ISR.
  matcher: ['/dashboard/:path*', '/admin/:path*', '/create', '/settings/:path*'],
};
```

Jika user belum login dan mengakses route terproteksi, redirect ke `/login?redirect={originalPath}`. Setelah login berhasil, redirect kembali ke path internal yang sudah divalidasi. `redirect` tidak boleh menerima arbitrary external URL.

---

### 6.4 Session Management

- Menggunakan `@supabase/ssr` untuk cookie-based session management.
- Supabase Auth session disimpan dalam cookie yang dikelola `@supabase/ssr`; **jangan memaksa access/refresh token menjadi custom `HttpOnly` cookie**, karena browser Supabase client perlu mengakses/merotasi session sesuai contract package.
- Refresh token/session cookie dikelola oleh `@supabase/ssr` melalui Proxy sesuai contract package. **Proxy auth tidak dijalankan pada landing/katalog/static ISR**, sehingga response public cacheable tidak membawa refresh `Set-Cookie`.
- Response yang melakukan session refresh harus menerapkan cache headers dari `@supabase/ssr`/`private, no-store`; jangan pernah shared-cache response tersebut.
- Server Components dan Server Actions mendapatkan session melalui cookie yang dikirim browser.
- Client Components mendapatkan session melalui Supabase browser client.

---

## 7. Payment, Entitlement, Upgrade, Renewal & Draft Extension

### 7.1 Model Komersial dan Pemisahan State

```text
Theme -> tier minimum -> harga/fitur/limit dari `tiers`
                         ↓
                 commercial transaction
                         ↓
                  payment attempt
                         ↓
                       Midtrans
```

`FREE` bukan entitlement. Semua user dapat mencoba theme BASIC/PREMIUM/VIP sebagai draft. Publish pertama selalu membeli tier theme aktif pada saat checkout dibuat.

Jangan menyamakan `transaction_status` Midtrans dengan status bisnis internal. Midtrans provider state disimpan di `payment_attempts.provider_status`; hasil bisnis disimpan di `transactions.payment_state`.

Provider status yang saat ini harus dikenali: `authorize`, `capture`, `settlement`, `pending`, `deny`, `cancel`, `expire`, `failure`, `refund`, `partial_refund`, `chargeback`, `partial_chargeback`. Kolom raw provider tetap `TEXT` tanpa restrictive CHECK; nilai baru/tidak dikenal tidak boleh membuat webhook DB-fail dan harus dipetakan ke `requires_review` sampai adapter diperbarui.

Canonical state internal:

```text
creating
provider_create_unknown
awaiting_payment
paid
failed
expired
cancel_requested
cancelled
partially_reversed
reversed
requires_review
```

`settlement` **bukan final selamanya**: refund, chargeback, partial reversal, card cancel sesudah capture, dan provider reversal tetap dapat mengubah funded commercial credit.

### 7.2 Transaction Snapshot dan Unit Uang

Saat checkout dibuat, server membaca katalog aktif dan membekukan **pricing facts** serta **entitlement target/result** secara terpisah. Perubahan admin setelah checkout tidak memodifikasi transaksi lama.

`pricing_snapshot` memakai schema versioned dan snake_case:

```json
{
  "schema_version": 1,
  "transaction_type": "initial_publish",
  "tier_code": "premium",
  "price_amount_idr": 99000,
  "currency": "IDR"
}
```

Untuk `initial_publish`, `tier_upgrade`, dan `renewal`, `entitlement_snapshot` menyimpan hak historis yang akan/akhirnya diterapkan pada invitation:

```json
{
  "schema_version": 1,
  "tier_code": "premium",
  "duration_months": 6,
  "gallery_limit": 8,
  "video_limit": 1,
  "bank_account_limit": 5,
  "audio_enabled": true,
  "audio_size_limit_mb": 10,
  "watermark_enabled": false
}
```

Untuk `draft_extension`, `entitlement_snapshot=NULL`; `pricing_snapshot` menyimpan `product_code`, `duration_days`, `price_amount_idr`, dan `currency`. `invitations.entitlement_snapshot` memakai schema entitlement yang sama dengan hasil transaction funded terakhir/merge yang diterapkan, sehingga UI/editor tidak membaca katalog tier terbaru untuk hak historis.

Semua nominal database/API internal menggunakan integer Rupiah (`amount_idr`). Response Midtrans seperti `gross_amount="99000.00"` diparse dengan decimal-safe parser ke Rupiah; jangan memakai floating point. Fractional IDR non-zero (mis. `99000.50`) dianggap invariant violation/review, bukan dibulatkan diam-diam. Sebelum funded transition, `order_id`, merchant/environment, currency, dan `gross_amount` harus cocok dengan transaksi lokal.

### 7.3 Payment Creation: Idempotency, Order ID, Snap Token

Flow create payment:

```text
client request + client_request_id
  ↓
auth + ownership + rate limit
  ↓
atomic create/reuse commercial transaction
  ↓
generate order_id = ntx_<ULID> (<=50 char, no PII, unique per attempt)
  ↓
insert payment_attempt(create_state=requested)
  ↓
POST Snap via native fetch()
  ↓
created OR unknown OR failed
```

Aturan:

1. `transactions.client_request_id` unik per user membuat double-click/retry mengembalikan commercial transaction yang sama sebelum provider call kedua terjadi. Server juga menyimpan `idempotency_fingerprint`; jika key yang sama dikirim dengan invitation/type/target/amount intent berbeda, balas conflict (`409`) dan **jangan** reuse transaksi lama untuk intent baru.
2. `order_id` unik untuk satu payment attempt dan tidak pernah memuat email, nama, slug, telepon, atau data guest. Jangan reuse untuk **commercial transaction/attempt berbeda**. Re-submit `order_id` yang sama hanya diperbolehkan sebagai recovery dari attempt yang sama ketika hasil Create Snap ambigu; ini bukan pembuatan commercial transaction baru.
3. Midtrans client di Cloudflare memakai typed REST wrapper berbasis native `fetch()` untuk Create Snap, Get Status, Cancel Snap Session, Cancel Transaction, Expire, dan Refund; jangan bergantung pada callback browser untuk correctness.
4. Snap token/redirect URL adalah transport credential. Jangan log keduanya. Jika disimpan agar checkout dapat dilanjutkan, encrypt server-side dengan AES-GCM + key version (`PAYMENT_TOKEN_ENCRYPTION_KEY`) dan hanya kembalikan ke owner yang berhak; hapus ciphertext setelah expiry/retention operasional berakhir.
5. Baseline checkout expiry: **3 jam**, dikirim ke Midtrans dengan explicit `start_time` + `expiry`; page expiry juga diselaraskan. Nilai dapat menjadi konfigurasi server tetapi tidak boleh tak terbatas.
6. Snap callback `onSuccess/onPending/onError/onClose` hanya mengubah UX ke “sedang diverifikasi”; callback **tidak pernah** publish/upgrade/renew secara langsung.

#### Ambiguous create timeout

Jika POST Snap timeout setelah request terkirim, jangan langsung membuat `order_id` baru.

```text
POST Snap
  ↓
timeout / network unknown
  ↓
transactions.payment_state = provider_create_unknown
payment_attempt.create_state = unknown
  ↓
GET Status(order_id)
  ├─ ditemukan  -> recover attempt/state
  └─ belum ada  -> bila masih within expiry, retry Create Snap dengan ORDER_ID YANG SAMA; jangan buat order_id baru
```

Ini mencegah dua checkout provider untuk satu intent pembayaran.

### 7.4 Funded Success dan Initial Publish

Pembayaran dianggap **funded-success** hanya jika data provider telah diverifikasi dan salah satu kondisi berikut benar:

```text
transaction_status = settlement
AND status_code = 200
AND fraud_status absent/accept

OR

transaction_status = capture
AND status_code = 200
AND fraud_status = accept
```

`capture + accept` dianggap pembayaran sukses untuk card dan tidak perlu menunggu `settlement`. `capture + challenge`, `authorize`, atau status ambigu tidak memberikan entitlement dan masuk `requires_review`/`awaiting_payment` sesuai hasil Status API.

Untuk initial publish:

1. Invitation harus `draft`, belum memiliki entitlement, tidak memiliki active commercial checkout lain, dan **lolos `validatePublishReadiness()`** pada saat checkout dimulai.
2. Server membaca theme aktif -> `theme.tier_id` -> row `tiers`, lalu membekukan pricing + entitlement snapshot transaction.
3. Buat transaction + payment attempt secara idempotent.
4. Selama checkout aktif, content editor boleh tetap dipakai, tetapi theme hanya boleh diganti ke theme dengan **tier yang sama** dan setiap mutation tetap tunduk pada state/usage invariant. Karena user dapat mengedit dari tab/perangkat lain, readiness **harus diperiksa ulang** saat funded-success.
5. Saat funded-success terkonfirmasi, satu RPC/DB transaction atomic:
   - idempotently set `payment_state='paid'` + `funded_at` bila belum paid;
   - set/merge `entitlement_tier_id` dan `entitlement_snapshot` dari transaction yang sudah dibekukan;
   - set expiry berdasarkan aturan transaksi/funded time; package duration tetap mulai dari funded baseline walau state akhirnya paid-draft;
   - jalankan publish-readiness check terbaru di dalam trusted transaction boundary;
   - jika masih ready: set `published_at` jika masih NULL dan `status='published'`;
   - jika tidak lagi ready karena race/content berubah: **tetap `status='draft'` dengan entitlement berbayar aktif**; pembayaran tidak dianggap gagal dan tidak diulang. UI menampilkan `Paket Aktif · Lengkapi untuk Publish` serta tanggal expiry paket;
   - insert outbox event receipt/notification, dan event publish hanya bila benar-benar menjadi published.
6. Draft yang sudah mempunyai entitlement dapat memanggil `publishPaidDraftIfReady()` tanpa pembayaran kedua. Use-case ini memvalidasi readiness + lifecycle + expiry lalu publish secara atomic.

Duplicate `capture`, `settlement`, webhook retry, atau Status poll tidak boleh memberi entitlement/credit dua kali. `validatePublishReadiness()` saat checkout adalah UX/business gate; funded-success tetap harus memberikan hak yang dibayar walau readiness berubah sesudah checkout dibuat.

### 7.5 Cancel Pending Payment dan Snap Session

Tombol **Batalkan Pembayaran** tidak boleh melakukan local-cancel saja. Gunakan cancellation API Midtrans sesuai fase checkout.

#### A. Snap Session masih berupa token/page session

Jika `snap_token` tersedia dan belum ada bukti provider transaction berjalan, lakukan **Cancel Snap Session** menggunakan token.

```text
user cancel
  ↓
transactions.payment_state = cancel_requested
  ↓
POST /snap/v1/transactions/{token}/cancel
  ├─ success / already cancelled
  │    ↓
  │  Status API/order verification bila relevan
  │    ↓
  │  payment_state = cancelled
  │    ↓
  │  unlock tier
  │
  └─ transaction is in progress / ambiguous
       ↓
     GET Status(order_id/transaction_id)
       ↓
     ikuti jalur B
```

Snap Session cancel mencegah halaman/token dipakai untuk melanjutkan checkout. Token/redirect credential tidak lagi dikembalikan ke client setelah `cancel_requested`.

#### B. Provider transaction sudah berjalan

Selalu baca Status API **sebelum** menentukan tindakan:

```text
GET Status
  ├─ pending / authorize / non-funded cancellable state
  │    ↓
  │  Cancel Transaction API
  │    ↓
  │  GET Status confirm cancel/expire/deny
  │    ↓
  │  payment_state = cancelled/expired
  │    ↓
  │  unlock tier
  │
  └─ capture+accept / settlement (funded-success)
       ↓
     apply paid state atomically bila belum applied
       ↓
     JANGAN auto Cancel Transaction dari stale user-cancel intent
       ↓
     bila user tetap meminta pengembalian dana → controlled refund workflow
```

`capture+challenge`/status ambigu masuk review sesuai state machine dan tidak dianggap funded. Jika cancel API gagal karena provider state berubah secara concurrent, jangan paksa local state; ambil Status API terbaru dan jalankan state machine. Uang yang benar-benar telah diterima tidak boleh diabaikan atau dibatalkan berdasarkan state lokal yang stale.

`page_expiry` dan blanket `expiry` baseline 3 jam tetap dipakai sebagai safety net. Perhatikan bahwa Snap **page expiry tidak selalu membatalkan payment code yang sudah dibuat**; payment-method expiry dapat hidup lebih lama. Karena itu cancellation/reconciliation harus melihat transaction status, bukan hanya page expiry.

### 7.6 Tier Upgrade dan Lifetime Tier Credit

Setelah entitlement ada, theme boleh aktif hanya jika `theme.tier_rank <= entitlement.tier_rank`. Theme lebih tinggi boleh preview tetapi tidak boleh menjadi active theme sebelum upgrade funded-success.

```text
lifetime_tier_credit =
  net confirmed funded amount initial_publish + tier_upgrade
  - confirmed eligible reversals/refund/chargeback

amount_due = MAX(current_target_tier_price - lifetime_tier_credit, 0)
```

Gunakan **funded commercial state**, bukan string provider `settlement`, sebagai sumber kebenaran. Renewal dan draft extension tidak menambah lifetime tier credit.

Jika `amount_due = 0`, buat transaction `payment_state='paid'`, `amount_idr=0`, provider NULL tanpa Midtrans call.

Saat upgrade funded-success:
- target tier menjadi entitlement max baru;
- snapshot di-merge agar hak lama tidak berkurang;
- `published_at` pertama tidak berubah;
- expiry tidak boleh memotong renewal/time yang sudah dibeli;
- kelebihan lifetime credit tidak menjadi refund/wallet/saldo.

### 7.7 Renewal

Renewal hanya memperpanjang tier entitlement yang sama dan membayar harga tier saat checkout dibuat secara penuh. Renewal tidak menjadi lifetime tier credit.

Pada funded-success renewal dini, capability/limit snapshot baru yang **lebih baik** boleh aktif segera, tetapi hak historis tidak pernah menurun:

```text
numeric_limit = MAX(old, renewal)
positive_capability = old OR renewal
no-watermark tidak boleh kembali watermark
base_date = MAX(current_expires_at, funded_at)
new_expires_at = base_date + duration snapshot renewal
```

Tidak ada lagi keputusan terbuka mengenai early renewal: merge monotonic di atas adalah aturan final.

### 7.8 Draft Extension

Draft Extension hanya untuk invitation yang belum pernah memperoleh entitlement/publish.

Produk: +90, +180, +365 hari. Setelah funded-success:

```text
current_effective_retention_until = MAX(last_activity_at + 90 hari, paid_retention_until)
base = MAX(current_effective_retention_until, funded_at)
paid_retention_until = base + purchased_duration
```

Jika draft berada dalam grace/Trash yang masih recoverable, funded extension dapat restore ke `draft` secara atomic.

### 7.9 Midtrans Webhook: Authentication, Status API, Ordering

Webhook Midtrans adalah **trigger**, bukan satu-satunya ground truth. Endpoint production:

```text
POST /api/webhooks/midtrans
HTTPS / port 443
no cache
no redirect
no login
no Turnstile/browser challenge
```

Cloudflare WAF/rate protection tidak boleh mengubah endpoint menjadi interactive browser challenge.
Notification URL dikonfigurasi sebagai server/environment constant. Jangan membentuk atau mengizinkan `X-Override-Notification`/`X-Append-Notification` dari input user, invitation data, atau URL arbitrary.

#### Signature

Verifikasi notification signature dengan exact raw string fields:

```text
SHA512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
```

`gross_amount` harus menggunakan representasi string notification (mis. `"99000.00"`) sebelum normalisasi. Bandingkan signature dengan constant-time comparison. Setelah signature valid, panggil Midtrans **GET Status API** dan gunakan hasil Status API untuk business transition.

#### Invariant sebelum funded transition

Wajib cocok:

- environment/merchant yang diharapkan;
- `order_id` milik payment attempt;
- `provider_transaction_id` konsisten/unik bila tersedia;
- currency = IDR;
- `gross_amount` = `transactions.amount_idr` secara decimal-safe;
- `status_code`, `transaction_status`, dan `fraud_status` memenuhi funded-success rule.

Jika satu invariant gagal: **jangan beri entitlement**, tulis provider event sanitized, set `requires_review` bila perlu, dan alert operator untuk mismatch penting.

#### Out-of-order dan duplicate webhook

Jangan memakai rule “status final = abaikan semua event berikutnya”. Midtrans dapat mengirim duplicate/out-of-order event dan provider state dapat berubah setelah settlement.

Setiap notification/status poll:

1. append/dedupe `payment_provider_events` menggunakan `event_fingerprint` SHA-256 dari canonical provider event subset (provider + order_id + transaction_id + transaction_status + status_code + raw gross_amount + event/refund identifier/timestamp yang relevan); raw body tidak digunakan sebagai business key;
2. baca state terbaru dari Status API;
3. map provider status ke canonical `payment_state` melalui satu state-machine server;
4. jalankan satu idempotent Postgres RPC untuk payment + entitlement/adjustment;
5. set `applied_at` atau `ignored_reason` pada provider event.

### 7.10 Webhook Response dan Retry Contract

Balas **HTTP 200 hanya jika**:

- event berhasil diterapkan; atau
- event valid terbukti duplicate/idempotent dan state database sudah benar; atau
- event valid tetapi memang tidak membutuhkan perubahan state.

Untuk temporary infrastructure failure (DB unavailable, provider Status API transient error) balas non-200/`503` agar Midtrans dapat retry. Jangan `catch(error) => 200`. Retry cadence/count adalah kontrak provider dan tidak di-hardcode sebagai correctness assumption; reconciliation tetap menjadi backstop.

Target handler <5 detik; correctness path harus pendek: verify -> Status API -> satu RPC -> 200. Email/analytics/receipt dikirim setelah commit via outbox/queue.

### 7.11 Reconciliation

Supabase Cron menjadi safety net, bukan mekanisme pembayaran utama. Reconciliation harus **state-aware**, bukan hanya `pending`:

```text
provider_create_unknown   → frequent sampai resolved
awaiting_payment          → berkala sampai provider expiry
capture/paid-not-settled  → follow-up sampai settlement/reversal window
refund requested/approved → sampai bank_confirmed/failed
cancel_requested          → frequent sampai Snap/session/transaction cancel terkonfirmasi
requires_review           → periodic + manual queue
recent funded payments    → short backstop window untuk reversal
```

Setelah `provider_transaction_id` tersedia, prioritaskan identifier tersebut untuk Status/Refund API; fallback `order_id` bila belum ada.

### 7.12 Refund dan Partial Refund

Tidak ada self-service refund pada versi awal. Admin workflow wajib sensitive-auth, structured reason, provider capability check, dan provider verification.

Aturan:

1. Original transaction tidak dihapus/ditimpa; semua reversal masuk `payment_adjustments`.
2. Refund API hanya dipakai bila payment method/provider state mendukung. Jika provider tidak mendukung, gunakan `manual_external_refund` setelah admin benar-benar mengembalikan dana dan bukti operasional dicatat.
3. Setiap Midtrans refund memakai merchant-generated `refund_key` unik. Retry dari **request refund yang sama** memakai key yang sama; refund baru memakai key baru.
4. Lifecycle refund:

```text
requested
→ provider_approved
→ bank_confirmed
```

`bank_confirmed_at`/provider-confirmed state adalah sinyal kuat bahwa refund benar-benar dikonfirmasi. Failed/retriable refund tidak mengurangi lifetime credit sebelum confirmed.
5. Partial refund yang tidak dapat dipetakan aman ke entitlement => `requires_manual_review`; jangan menebak downgrade.
6. Capability matrix server-side minimal menyimpan/menentukan `supports_api_refund`, `supports_partial_refund`, refund window, dan identifier requirement per `payment_type`/channel. Matrix diperbarui ketika kontrak Midtrans berubah.

### 7.13 Chargeback, Partial Chargeback, dan Provider Reversal

`payment_adjustments.adjustment_type` membedakan:

```text
chargeback
partial_chargeback
chargeback_reversal
provider_reversal
```

Chargeback/partial chargeback terkonfirmasi mengurangi net funded commercial credit secara deterministic. Chargeback penuh atau provider reversal yang membatalkan funded payment menyebabkan invitation **public-suspended** sambil menunggu resolution; content tidak hard-delete.

Provider reversal juga mencakup kasus langka seperti `settlement -> deny` atau card funded state yang kemudian dicancel/reversed. Jangan menganggap `settlement` final secara permanen.

Untuk dispute/chargeback, simpan evidence package minimum dan privacy-safe:
- invoice/order reference;
- tier/product yang dibeli;
- account/invitation ID;
- payment/funded timestamp;
- publish/service-activation timestamp;
- TOS version yang diterima;
- correspondence/support evidence yang relevan.

Buat critical admin alert + deadline tracking. Jangan menyimpan card credential/CVV/full PAN.

### 7.14 Card Security / FDS / 3DS

Untuk kartu kredit Snap, **3DS wajib diaktifkan** (`credit_card.secure=true`) dan FDS tetap digunakan. Jangan mematikan 3DS demi conversion tanpa security review khusus.

Kirim `customer_details` dan `item_details` secukupnya agar fraud/risk evaluation memiliki konteks. Jumlah seluruh item harus sama dengan `gross_amount`. Jangan kirim PIN invitation, guest token, guest list, private notes, atau secret lainnya ke Midtrans.

### 7.15 Midtrans Environment & Secrets

Gunakan explicit environment allowlist:

```text
MIDTRANS_ENV=sandbox|production
MIDTRANS_MERCHANT_ID=...
MIDTRANS_SERVER_KEY=...
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=...
```

`MIDTRANS_ENV` memilih endpoint dari constant internal; jangan menerima arbitrary Midtrans base URL dari browser/user input.

Sandbox, preview, dan production memakai credential terpisah. Production secret tidak pernah tersedia di preview deployment. Server key hanya berada di Cloudflare secret binding/server environment dan tidak pernah diberi prefix `NEXT_PUBLIC_`.

### 7.16 Payment Observability

Minimum metrics/alerts:

```text
payment_create_unknown_count
webhook_invalid_signature_count
webhook_processing_latency
provider_status_mismatch_count
payment_requires_review_count
reconciliation_backlog_age
funded_without_entitlement_count
entitlement_without_funded_payment_count
refund_pending_bank_confirmation
chargeback_open_count
```

Alert P0/P1 bila ada funded payment tanpa entitlement, entitlement tanpa funded payment, amount/order mismatch, atau provider reversal/chargeback yang gagal direkonsiliasi.

## 8. Rate Limiting, Guest Identity, PIN & Anti-Bot

### 8.1 Distributed Rate Limiting

Gunakan **distributed Redis** (Upstash Redis atau Redis setara), bukan in-memory Map dan bukan database sebagai limiter utama. Dipakai untuk RSVP, PIN, guest-token lookup, create payment, create draft, upload, public form, dan view counting.

Alamat IP tidak disimpan mentah sebagai key. Server membentuk:

```text
ip_hash = HMAC_SHA256(RATE_LIMIT_HMAC_SECRET, normalized_ip)
```

Contoh key:

```text
rl:rsvp:<invitation_id>:<ip_hash>
rl:pin:<invitation_id>:<ip_hash>
rl:payment:<user_id>:<ip_hash>
```

### 8.2 RSVP Open Anti-Spam

Mode `open` selalu memiliki rate limit. Turnstile bersifat **adaptif**: tamu normal tidak selalu mendapat challenge; traffic mencurigakan, request terlalu cepat, atau pola abuse dapat meningkatkan challenge/penolakan. Server wajib memverifikasi token Turnstile.

### 8.3 Guest Token

Personal link menggunakan token acak, bukan nama atau UUID database sebagai credential.

```text
/[slug]?guest=<high-entropy-token>
```

DB hanya menyimpan hash/HMAC token. Satu guest memiliki satu token aktif; regenerate link membuat token lama invalid. Parameter presentasi seperti `to=` boleh dipakai untuk display legacy, tetapi **tidak dipercaya sebagai identitas**.

### 8.4 Private Invitation PIN, Brute-Force Defense & Session

#### PIN credential

- PIN wajib numerik **6–10 digit**.
- PIN lemah ditolak: semua digit sama, urutan sederhana naik/turun, pola pendek berulang, dan common-PIN blocklist.
- PIN disimpan dengan **Argon2id**. PIN plaintext tidak disimpan, tidak dapat dilihat kembali, dan jika lupa hanya dapat diganti.
- Owner boleh memakai PIN yang sama pada invitation berbeda; salt Argon2id memastikan hash berbeda.
- PIN baru tidak boleh sama dengan PIN saat ini atau 3 PIN historis terakhir.
- Ganti PIN membutuhkan `sensitive_auth` owner yang valid, menaikkan `pin_version`, dan mencabut seluruh private session lama.

Guest token **tidak menggantikan PIN**:

```text
guest token = identity
PIN session = authorization
```

#### Per-IP / per-invitation defense

Limiter memakai distributed Redis dengan key `invitation_id + ip_hash` dan risk history TTL **6 jam**:

```text
5 gagal  -> Turnstile wajib
10 gagal -> temporary block 15 menit
20 gagal -> temporary block 1 jam
```

PIN sukses melalui request yang diizinkan dapat membersihkan temporary block lokal, tetapi histori/risk counter tetap hidup sampai TTL habis. Tidak ada permanent global invitation lock.

#### Distributed attack detection

Agregasi per invitation memakai total gagal + jumlah IP unik + velocity:

```text
>=20 gagal DAN >=5 IP unik dalam 10 menit
-> Turnstile wajib untuk semua percobaan PIN invitation

>=50 gagal DAN >=10 IP unik dalam 10 menit
-> heightened protection
```

Heightened protection:

```text
Turnstile wajib
+ maksimal 2 percobaan PIN / 15 menit / IP
+ security incident
+ dashboard alert owner
+ 1 email alert owner
```

Incident ditutup setelah **1 jam tanpa aktivitas mencurigakan** dan mengirim **1 recovery email**. Event berikutnya selama incident yang sama hanya memperbarui counter/dashboard; jangan spam email. Invitation tidak di-hard-lock.

#### Private access session

Setelah PIN benar, server membuat **custom HMAC-signed stateless cookie** berlaku 6 jam. Token bukan JWT dan tidak dienkripsi karena payload hanya metadata non-rahasia:

```text
invitation_id
pin_version
issued_at
expires_at
key_version
```

Cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, `Max-Age=21600`. Signature dibandingkan constant-time. Server selalu memverifikasi signature, expiry, invitation target, dan `invitations.pin_version` terbaru.

Key session memakai **key versioning current + previous** di server-side environment variables. Previous key hanya dipertahankan selama token lama masih mungkin hidup (maksimal 6 jam). Emergency rotation boleh membuang previous key sehingga semua session lama invalid.

Private session payload dilarang memuat PIN, guest token, nama, email, nomor WA, atau data sensitif.

#### Privacy toggle

`PUBLIC <-> PRIVATE` selalu membutuhkan `sensitive_auth` owner valid, tetapi toggle privacy **tidak otomatis menaikkan `pin_version`**. Saat `PUBLIC -> PRIVATE`, owner memilih memakai PIN lama atau membuat PIN baru. Jika belum pernah mempunyai PIN, owner wajib membuat PIN baru. Private mode tanpa PIN tidak diizinkan.

Konsekuensi yang disengaja: jika owner memakai PIN lama tanpa menaikkan `pin_version`, private session lama yang belum expired secara teknis dapat valid kembali saat mode private diaktifkan lagi. Jika owner ingin revoke, pilih PIN baru atau explicit session revoke.

### 8.5 Sensitive Re-Authentication Owner

Tindakan sensitif seperti ganti PIN, toggle privacy, permanent delete, atau security action tertentu membutuhkan **re-authentication mengikuti metode login akun**: password untuk email/password, provider re-auth untuk OAuth, dan mekanisme setara untuk provider lain.

Setelah re-auth sukses, server membuat signed `sensitive_auth` HttpOnly cookie berlaku **10 menit**, account-wide tetapi tetap tidak menggantikan ownership check. Payload minimal:

```text
user_id
auth_context_version
issued_at
expires_at
```

`user_profiles.auth_context_version` adalah source of truth revoke sensitive-auth. Version naik untuk **perubahan keamanan akun** seperti password/email login berubah, logout semua perangkat, identity/provider utama berubah, atau emergency account revoke. Perubahan PIN invitation menggunakan `pin_version`, bukan `auth_context_version`.

Cookie sensitive-auth menjadi invalid jika 10 menit habis atau `auth_context_version` tidak cocok.

### 8.6 RSVP Authorization Matrix

| Invitation | RSVP mode | Guest token | PIN session | Boleh RSVP |
|---|---|---:|---:|---:|
| Private | apa pun | wajib | wajib | ya |
| Public | `personal_only` | wajib | tidak perlu | ya |
| Public | `open` + token | valid | tidak perlu | ya |
| Public | `open` tanpa token | opsional | tidak perlu | ya, dengan nama + WA + anti-spam |

Untuk open RSVP tanpa token, server membuat/menemukan guest berdasarkan normalized WhatsApp number. **Tidak ada OTP WhatsApp pada flow ini.** RSVP pertama menghasilkan edit token acak; DB menyimpan hash, browser menerima cookie `HttpOnly`. Browser yang kehilangan cookie tidak dapat overwrite RSVP hanya dengan mengetahui nomor WA.

### 8.7 Public Guestbook

Public client tidak subscribe langsung ke raw `guests`. Gunakan RPC/feed aman yang hanya mengembalikan entry `approved` dan field whitelist. Realtime opsional dapat dibangun di atas channel/endpoint yang tidak mengekspos raw row.

## 9. Security Audit, Admin Governance & Temporary Support Access

### 9.1 Security Audit Log

- Retention: **365 hari**.
- Owner melihat timeline **Security Activity** per invitation dalam bentuk sanitized dan read-only.
- Admin melihat detail sesuai kewenangan tetapi tidak dapat edit/delete event biasa.
- Super-admin dapat manual purge untuk kasus sah dengan `sensitive_auth`, structured reason, dan typed confirmation.
- Purge event individual meminta operator mengetik **event ID** target.
- Bulk purge hanya memakai filter whitelist (`invitation_id`, `user_id`, `event_type`, `created_before`, `created_after`), maksimal **1.000 event per batch**, dan konfirmasi `PURGE N EVENTS`.
- Setiap batch bulk purge atomic: delete target + tulis audit purge harus all-or-nothing, dan tiap batch menghasilkan audit event sendiri.
- `security_audit_purge` dan `security_audit_bulk_purge` adalah protected events dan tidak boleh menjadi target purge biasa.
- Protected event hanya dapat dihapus lewat **emergency purge** dengan dua super-admin berbeda, keduanya re-auth; requestor tidak dapat approve sendiri. Tidak ada break-glass one-person override.
- Emergency purge menghasilkan protected `security_audit_emergency_purge` baru.
- Purge reason memakai enum terstruktur seperti `data_erasure_request`, `incorrect_event`, `security_incident`, `legal_requirement`, `operational_cleanup`, `other`; `other` wajib `reason_note`.

### 9.2 Governance Role

Role hierarchy eksplisit:

```text
user -> admin -> super_admin
```

Role database/server-side adalah source of truth; UI/JWT stale tidak boleh menjadi authorization final.

- Initial `super_admin` dibuat melalui bootstrap administratif/deployment, bukan UI.
- `user -> admin`: hanya super-admin, wajib re-auth + audit.
- `admin -> user`: hanya super-admin, wajib re-auth + audit; `auth_context_version++` dan privileged sessions lama dicabut.
- `super_admin -> user`: target role eksplisit, privileged sessions dicabut dan `auth_context_version++`.
- `super_admin -> admin`: role terbaru harus ditegakkan server-side segera; session lama tidak boleh mempertahankan privilege super-admin.
- Promosi ke atau pencabutan `super_admin` setelah sistem mempunyai >=2 super-admin membutuhkan **dua super-admin berbeda**: requestor + approver. Target perubahan role tidak boleh menjadi approver atas dirinya sendiri.
- Self-removal request boleh dibuat, tetapi harus disetujui super-admin lain.
- Perubahan role efektif segera setelah approval sah.
- Jika active super-admin turun menjadi satu, platform masuk **governance degraded mode**. Emergency protected-audit purge dan perubahan super-admin via aplikasi diblokir sampai bootstrap administratif eksternal mengembalikan jumlah minimal dua.
- Governance degraded mengirim 1 email + critical dashboard alert saat mulai, dan 1 recovery email saat pulih; keduanya masuk security audit log.

### 9.3 Temporary Admin Support Access

Admin default hanya melihat metadata operasional yang aman. Untuk membaca isi invitation user, admin/super-admin harus membuat grant support **per invitation**:

```text
read support access: TTL/default policy mengikuti kontrak kanonik §4.9; response grant mengembalikan `expires_at`
write support elevation: explicit, re-auth lagi, reason baru
```

Read-only adalah default. Write hanya untuk mutation/resource whitelist. Semua start/stop/elevation dicatat ke security audit; owner dapat melihat sanitized support-access event di Security Activity.

Setiap grant menyimpan `auth_session_id` dari claim JWT `session_id`. Request support berikutnya harus berasal dari **session yang sama**; mismatch ditolak. Server juga memastikan `auth_session_id` masih ada pada `auth.sessions` pada setiap request support content, sehingga logout/revocation tidak menunggu JWT lama habis. Jangan membuat FK ke `auth.sessions` karena tabel Auth dikelola Supabase dan row session memang hilang saat revoke/logout.

Akses support tidak pernah membuka credential/secret (`pin_hash`, guest token hash, RSVP edit token hash, session material, env secret, Midtrans server credential, raw IP). Guest phone/notes hanya dibuka jika support scope benar-benar memerlukannya dan flow elevated support mengizinkan.

Private media support tetap memakai signed URL setelah support authorization berhasil; mengetahui storage path bukan authorization.

Bulk export/download data user **bukan** bagian dari support access biasa dan harus memakai domain/kontrol terpisah.

## 10. Auto-Save, Sync & Editing

### 10.1 Editor Source of Truth & Initial Hydration

Setelah invitation berstatus `synced`, database adalah source of truth. `/dashboard/[id]/edit` adalah Server Component yang melakukan ownership + lifecycle check dan fetch `EditorDTO` terbaru (`invitations`, ordered `invitation_events`, gallery/media summary, effective limits, `content_version`) **sebelum** merender client editor. Client editor menerima `initialData`; jangan mount form kosong lalu melakukan Server Action fetch kedua yang kemudian `reset()` dan berisiko menimpa input awal user.

React Hook Form `useFieldArray().field.id` hanya React render key. Identity database harus field terpisah seperti `eventId`/`galleryItemId`; jangan mengirim RHF-generated `field.id` sebagai UUID database.

### 10.2 Auto-Save Queue

Autosave mempunyai **empat lapis**: debounce 1 detik, periodic safety save, pagehide best-effort, dan single-flight queue. Correctness utama berasal dari save normal + optimistic CAS; `pagehide` bukan jaminan penyimpanan.

State minimum:

```text
isSaving
pendingSave
lastSavedContentVersion
localEditGeneration
lastAckedGeneration
saveConflict
```

Aturan:

1. Hanya satu save request aktif.
2. Setiap perubahan lokal menaikkan `localEditGeneration` dan menandai form dirty.
3. Request membawa snapshot payload, `currentVersion`, dan `generation` saat request dibuat.
4. Jika user mengedit saat request aktif, jangan `reset()` live form ketika response lama kembali; response hanya mengakui `content_version` + generation yang disimpan. Bila `localEditGeneration > response.generation`, set `pendingSave=true` dan kirim snapshot terbaru sesudah request selesai.
5. State `Tersimpan` hanya boleh tampil bila `lastAckedGeneration === localEditGeneration`.
6. `pagehide` hanya best-effort dan tetap membawa expected `content_version`; request stale tidak boleh menimpa revision yang lebih baru. Local recovery snapshot kecil boleh dipakai untuk content non-sensitive, tetapi tidak menggantikan DB source of truth.

### 10.3 Optimistic Locking & Conflict UX

Setiap content save membawa `content_version` terakhir yang diakui server. Update menggunakan compare-and-swap (`WHERE content_version = currentVersion`) dan server menaikkan `content_version = content_version + 1` dalam statement yang sama; client tidak menaikkannya sendiri. Internal lifecycle/analytics/payment update tidak menyentuh `content_version`.

Jika CAS menghasilkan zero rows, server mengembalikan typed `VERSION_CONFLICT` + current server version. Editor **pause autosave**, mempertahankan perubahan lokal di memory, dan menampilkan persistent state:

```text
Undangan ini berubah di tab atau perangkat lain.
[Muat versi terbaru]
```

Baseline tidak menyediakan force-overwrite otomatis. `Muat versi terbaru` meminta konfirmasi bila ada perubahan lokal yang belum tersimpan, refetch `EditorDTO`, lalu reset form secara eksplisit. Ini menjaga implementasi tetap sederhana tanpa BroadcastChannel/Web Locks.

### 10.4 Mutation Classes: Generic Autosave vs Dedicated Actions

Generic autosave hanya untuk content yang aman/reversible, misalnya `couple`, `love_story`, event draft, section settings, accent/theme presentation settings, dan konfigurasi embed yang tervalidasi.

**Tidak pernah masuk generic autosave/localStorage/sessionStorage:** PIN plaintext/hash, `is_private` transition, `pin_version`, reset/ganti PIN, revoke private session, guest token, payment state/token, entitlement fields, lifecycle status, atau server-controlled security fields.

`PUBLIC <-> PRIVATE`, set/reset PIN, dan explicit session revoke memakai dedicated Server Action/RPC + ownership + sensitive-auth + confirmation sesuai security contract. Sebelum privacy toggle, flush autosave; toggle `is_private` melakukan CAS terhadap `content_version`, menaikkan `content_version`, lalu mengembalikan revision baru ke editor karena perubahan akses memengaruhi render/cache. PUBLIC->PRIVATE commit atomically memastikan credential PIN tersedia. Rotasi PIN tanpa perubahan content memakai `pin_version` sebagai revocation token dan tidak perlu menaikkan `content_version`, tetapi action tetap mengembalikan state security terbaru.

### 10.5 Draft-Friendly Validation & Publish Readiness

Draft boleh incomplete. Tab/wizard validation membantu UX tetapi **bukan** publication authority. Server menyediakan satu `validatePublishReadiness(invitationId)` yang menjadi SSoT untuk progress kelengkapan, checkout gate, dan actual publish.

Minimum readiness baseline:

```text
couple.groom.name non-empty
couple.bride.name non-empty
>= 1 invitation_event publishable
  - title non-empty
  - starts_at non-NULL
  - IANA timezone valid
active theme valid + renderer tersedia
effective gallery/video/bank usage <= allowance
semua media yang direferensikan untuk final render berstatus ready
private invitation -> PIN credential tersedia
renderer/config required fields valid
```

Field optional boleh tetap kosong. Validator mengembalikan typed issue list (`code`, `path`, user message) agar dashboard progress, editor checklist, dan checkout menggunakan hasil yang sama—jangan menduplikasi aturan required di tiga tempat.

### 10.6 Owner Preview

Draft tidak boleh dibuka melalui public `/<slug>` karena public route mensyaratkan published. Route kanonik preview owner:

```text
/dashboard/[id]/preview
/dashboard/[id]/preview?theme=<themeId>   # optional target-theme preview; bukan activation
```

Optional `theme` hanya menerima theme ID aktif yang berhasil di-resolve server. Parameter ini tidak mengubah `invitations.theme_id`, tidak mengubah entitlement, dan tidak menjadi authorization credential. Ia digunakan untuk preview theme di atas entitlement/target theme sebelum user memilih activation/upgrade.

**Preview dan activation adalah dua kontrak berbeda.** Jika current content melebihi allowance target, owner preview **tetap merender seluruh content valid yang tersimpan** (hingga global technical safety cap) dan menerima typed `limitConflict`/warning. Renderer/UI tidak boleh diam-diam menghapus, menyembunyikan, atau truncate item hanya agar preview tampak “valid”. Conflict tersebut memblokir **activation/publish ke target**, bukan hak untuk melihat preview. Bila renderer tidak mampu menampilkan content pada rentang yang masih diizinkan technical safety cap, itu adalah defect renderer/theme dan harus gagal jelas, bukan mengubah data.

Kontrak:

```text
authenticated + ownership
status draft|published (bukan expired/trashed)
dynamic/no-store
renderer/theme pipeline yang sama dengan public invitation
boleh merender incomplete draft secara graceful
credential/private data tetap tidak dibocorkan
```

Saat user menekan **Preview Undangan**, editor lebih dulu meminta `flushSaveQueue()`. Navigasi hanya dilakukan setelah seluruh dirty generation yang dapat disimpan sudah di-ack; jika save gagal/conflict, tetap di editor dan tampilkan error. Preview membaca latest saved DB state, bukan membuat renderer kedua dari localStorage/RHF state.

### 10.7 Theme Switching

Gunakan dedicated `changeInvitationTheme(invitationId, targetThemeId, currentVersion)` dalam transaction:

```text
ownership + editable lifecycle
validate target theme active/known renderer
jika entitlement ada: target.tier_rank <= entitlement.tier_rank
jika active checkout: target tier harus sama dengan checkout target tier
validate current gallery/video/bank usage <= effective allowance target
CAS parent content_version
update theme_id
increment content_version
commit
```

Jika target theme/tier memiliki allowance lebih kecil dari content saat ini, mutation ditolak dengan typed issue (`THEME_LIMIT_CONFLICT`) dan UI menjelaskan item yang perlu dikurangi. Jangan diam-diam menyembunyikan/menghapus content. Theme di atas entitlement hanya owner preview/upsell dan tidak mengubah `theme_id` live sebelum upgrade funded-success.

### 10.8 Atomic Event/Gallery Mutation & Reorder

Event/gallery adalah bagian editor dan memakai parent `content_version` sebagai satu revision token. Add/update/delete/reorder berjalan dalam transaction yang melakukan ownership + CAS parent sebelum commit.

Karena `(invitation_id, position)` UNIQUE, reorder tidak boleh melakukan naive independent update yang dapat collision sementara. Gunakan satu RPC/repository transaction yang menulis posisi temporer di namespace aman (mis. offset besar) atau teknik set-based equivalent, lalu menetapkan posisi final `0..n-1`, dan menaikkan `content_version` sekali.

### 10.9 Lifecycle Edit Matrix

Server—not UI—mengunci matrix berikut:

| Invitation/account state | Content edit | Preview owner | Aksi berikutnya |
|---|---:|---:|---|
| unpaid `draft`, account active | Ya | Ya | Lengkapi / checkout |
| paid `draft`, `now() < expires_at` | Ya | Ya | Lengkapi / publish tanpa bayar lagi |
| `published`, `now() < expires_at` | Ya | Ya | Save langsung + cache invalidation |
| `expired` **atau entitlement `expires_at <= now()` walau cron belum sync** | Tidak | read-only summary bila diperlukan | Renewal dulu |
| `trashed` | Tidak | Tidak | Restore/renewal server flow dulu |
| account `pending_deletion`/`deleting` | Tidak | Tidak | cancel deletion bila masih grace atau tunggu deletion |

Deep-link manual ke `/dashboard/[id]/edit` tidak boleh melewati matrix ini.

### 10.10 Published Editing & Cache Invalidation

Invitation `published` tetap boleh diedit langsung. Save yang lolos entitlement + readiness-of-changed-resource langsung menjadi source of truth. Setelah DB commit sukses:

```text
invalidate/revalidate public invitation cache/tag
invalidate/version OG representation bila field yang memengaruhi OG berubah
```

Untuk published content mutation, transaction juga menulis outbox event `invitation_content_changed` (payload minimal: invitation id + committed `content_version` + invalidation scope). Setelah commit, aplikasi boleh melakukan invalidation langsung untuk latency rendah, tetapi outbox consumer menjadi recovery path idempotent bila invalidation langsung gagal. Kegagalan cache invalidation tidak boleh rollback content DB dan tidak boleh kehilangan eventual invalidation.

Validasi entitlement menggunakan **snapshot invitation**, bukan konfigurasi tier terbaru:

```text
count(invitation_gallery_items) <= entitlement_snapshot.gallery_limit
video <= entitlement_snapshot.video_limit
bank_accounts <= entitlement_snapshot.bank_account_limit
active_theme.tier_rank <= entitlement_tier.tier_rank
```

Theme lebih tinggi hanya preview sampai upgrade selesai.

## 11. Data Lifecycle & Retention

### 11.1 Draft Tanpa Entitlement (Belum Pernah Paid/Publish)

Tidak ada batas jumlah draft. Rule inactivity hanya berlaku ketika `status='draft' AND entitlement_tier_id IS NULL`.

```text
normal_retention_until = last_activity_at + 90 hari
effective_retention_until = MAX(normal_retention_until, paid_retention_until)
```

Jika `effective_retention_until` terlewati:
1. set `status='trashed'`, `deleted_at=NOW()`;
2. grace 30 hari;
3. setelah grace hard-delete DB + Storage.

Setiap aktivitas edit nyata memperbarui `last_activity_at`. Paid Draft Extension tidak hilang ketika user aktif kembali; effective retention selalu mengambil periode terpanjang.

Draft Extension hanya untuk invitation yang **belum pernah memperoleh entitlement/publish**. Ia dapat dibeli ketika unpaid draft masih aktif atau dalam trash grace. Hard-deleted draft tidak dapat dipulihkan.

### 11.2 Invitation Ber-Entitlement: Published maupun Paid Draft

Funded initial publish dapat menghasilkan dua state yang sama-sama mempunyai `entitlement_tier_id` + `expires_at`:

```text
draft + entitlement   # payment funded tetapi readiness berubah sebelum publish
published             # sudah live
```

Keduanya memakai package expiry yang sama dan **tidak** mengikuti 90-day unpaid-draft inactivity retention / Draft Extension.

```text
draft + entitlement ─┐
                     ├─ expires_at -> expired — 30 hari -> trashed — 30 hari -> permanent delete
published ───────────┘
```

`published_at` mencatat first actual publication dan boleh NULL untuk paid draft yang belum pernah live. `publishPaidDraftIfReady()` hanya boleh publish ketika `now() < expires_at`; setelah expiry user harus renewal sesuai policy.

Saat `expires_at` tercapai, request authorization/editor memperlakukan invitation sebagai **effectively expired** walaupun cron belum menyelaraskan `status`. Cron memakai `entitlement_tier_id IS NOT NULL AND status IN ('draft','published') AND expires_at <= now()` lalu mengubah state ke `expired`. Public page selalu menolak akses setelah expiry.

Dashboard/UI **tidak boleh menurunkan lifecycle langsung dari `invitations.status` mentah**. Server/use-case mengembalikan projection seperti:

```typescript
type InvitationWorkspaceState = {
  effectiveLifecycle: 'draft' | 'published' | 'expired' | 'trashed';
  commercialUiState:
    | 'none'
    | 'pending_initial_publish'
    | 'pending_upgrade'
    | 'pending_renewal'
    | 'entitlement_active'
    | 'payment_review';
  editable: boolean;
  availableActions: string[]; // dihitung server; UI hanya merender
  expiresAt?: string;
};
```

`effectiveLifecycle='expired'` harus menang ketika authoritative timestamp sudah lewat walaupun row cache masih `status='published'`. Pending payment/upgrade/renewal tidak dicampur ke lifecycle dan tidak boleh membuat client membangun state machine kedua.

Selama 30 hari `expired`, invitation tetap ada di dashboard dan dapat renewal tier yang sama. Setelah masuk `trashed`, restore/renewal harus melewati server flow aman sebelum hard delete.

### 11.3 Reminder & Upsell

- Unpaid draft: reminder sebelum effective inactivity retention habis + Draft Extension.
- Paid draft: tampilkan `Paket aktif sampai <tanggal>` + reminder untuk menyelesaikan publish sebelum `expires_at`; **jangan** tawarkan Draft Extension.
- Published: reminder sebelum `expires_at` + renewal tier yang sama.
- Reminder schedule exact dapat dikonfigurasi tanpa mengubah lifecycle inti.

## 12. View Counting

Tidak ada hot-row `invitations.views_count`. View counting diakumulasi ke `invitation_analytics_daily` dengan atomic upsert/increment, sedangkan dedup/rate limit menggunakan **distributed Redis + HMAC IP**, bukan in-memory Map.

Contoh: satu view count per hashed-IP/invitation/window. Tidak perlu menyimpan raw IP atau analytics lokasi.

## 13. Monetisasi & Tier

### 13.1 Arti `FREE`

`FREE` hanya kartu marketing di pricing homepage untuk menjelaskan bahwa calon user dapat **membuat dan preview draft tanpa membayar**. Tidak ada:

```text
theme tier = FREE
user tier = FREE
entitlement tier = FREE
```

Harga kartu FREE dapat ditampilkan sebagai Rp0 untuk fase pembuatan/preview, tetapi tombol publish tetap membawa user ke harga BASIC/PREMIUM/VIP sesuai theme aktif.

### 13.2 Tier Riil

Tier riil hanya:

```text
BASIC
PREMIUM
VIP
```

Semua harga, original price, limit, capability, watermark, dan duration dibaca dari tabel `tiers`. Jangan hardcode nominal ke `config/tiers.ts`, theme, atau UI.

`config/tiers.ts` hanya boleh berisi tipe/helper statis yang **tidak menduplikasi business ordering**, misalnya:

```typescript
export type TierCode = 'basic' | 'premium' | 'vip';
```

Jangan membuat `TIER_ORDER`/rank kedua di TypeScript. Authorization/gating membaca `tiers.tier_rank` dari data server; urutan visual membaca `sort_order`.

### 13.3 Theme vs Entitlement

```text
Theme = visual/layout + minimum tier
Tier = price + feature + limit + duration
Invitation entitlement = hak tier yang sudah dibeli + snapshot historis
```

Sebelum pembayaran, ganti theme berarti harga/tier checkout mengikuti **theme terakhir**. Setelah entitlement dibeli, user dapat berganti ke theme mana pun dengan `theme.tier_rank <= entitlement.tier_rank` tanpa kehilangan entitlement yang sudah dibayar.

### 13.4 Add-on

Add-on yang sudah dikunci saat ini hanya **Draft Extension** untuk invitation yang belum pernah memperoleh entitlement/publish. Paid draft (`status=draft` + entitlement) tidak memenuhi syarat. Add-on lama seperti “hapus watermark” atau “tambah quota invitation” tidak berlaku karena watermark berasal dari tier dan draft tidak memiliki quota bisnis.

---

## 14. Konvensi Koding

Bagian ini adalah **referensi wajib** untuk semua kode yang ditulis dalam project. Konvensi ini dirancang untuk mencegah circular dependency, menjaga konsistensi, dan memudahkan onboarding (baik untuk developer sendiri di masa depan maupun kolaborator potensial).

### 14.1 Dependency Rules (STRICT — Acyclic)

Dependency harus tetap satu arah, tetapi `app/` **tidak** dijadikan service/orchestration layer.

```text
src/app/
   │
   ├──────────────→ modules/domain/*
   │
   ├──────────────→ modules/orchestration/*
   │
   ├──────────────→ shared/
   └──────────────→ config/

modules/orchestration/*
   ├──────────────→ public server contract domain modules
   ├──────────────→ shared/
   └──────────────→ config/

modules/domain/*
   ├──────────────→ shared/
   └──────────────→ config/

shared/
   └──────────────→ config/

config/
   └──────────────→ ZERO imports
```

**Aturan detail:**

1. `src/app/` → route composition saja; boleh import module/shared/config tetapi tidak memiliki business workflow.
2. Domain module (`invitation`, `guest`, `payment`, `storage`, `auth`) → tidak mengimpor domain module lain secara bebas.
3. Orchestration/use-case module (`checkout`, dan module sejenis bila benar-benar diperlukan) → boleh mengimpor **public server contract** dari domain yang dibutuhkan.
4. Domain module tidak boleh mengimpor orchestration module.
5. `shared/` → hanya `config/`; dilarang mengimpor `modules/` atau `app/`.
6. `config/` → ZERO imports.
7. Import graph wajib bebas circular dependency dan diverifikasi lint/test.
8. Provider adapter tidak ditempatkan di `shared` jika provider tersebut milik satu domain. Contoh: Midtrans sepenuhnya milik `modules/payment/`.

**Contoh cross-domain yang benar:**

```typescript
// modules/checkout/server/actions.ts
'use server';

import { getPublishContext } from '@/modules/invitation/server/queries';
import { createPaymentAttempt } from '@/modules/payment/server/service';

export async function startPublishCheckout(invitationId: string) {
  const context = await getPublishContext(invitationId);
  return createPaymentAttempt(context);
}
```

`page.tsx` hanya memanggil/render entrypoint checkout; tidak menghitung entitlement atau menyusun workflow payment sendiri.

### 14.2 Naming Conventions

#### File Naming
- **Komponen:** `kebab-case.tsx` — contoh: `invitation-wizard.tsx`, `rsvp-form.tsx`
- **Utils/Actions/Types:** `kebab-case.ts` — contoh: `supabase-client.ts`, `actions.ts`, `types.ts`
- **CSS:** `kebab-case.css` — contoh: `theme.css`, `animations.css`
- **Folder:** `kebab-case` — contoh: `guest/`, `love-story-form/`
- **Route folders:** mengikuti konvensi Next.js App Router

#### Code Naming
- **Komponen React:** `PascalCase` — contoh: `InvitationWizard`, `RsvpForm`, `GuestTable`
- **Hooks:** `useCamelCase` — contoh: `useInvitationForm`, `useGuestList`, `useMounted`
- **Server Actions:** `camelCase` dengan prefix verb — contoh: `createOrSyncInvitation`, `updateGuest`, `deletePhoto`, `publishPaidDraftIfReady`
- **Types/Interfaces:** `PascalCase` dengan suffix deskriptif — contoh: `InvitationData`, `GuestRow`, `PaymentStatus`, `CoupleData`
- **Zod Schemas:** `camelCase` dengan suffix `Schema` — contoh: `invitationSchema`, `guestImportSchema`, `rsvpFormSchema`
- **Constants:** `SCREAMING_SNAKE_CASE` — contoh: `MAX_UPLOAD_SIZE`, `AUTO_SAVE_DELAY`, `PIN_MIN_LENGTH`, `PIN_MAX_LENGTH`
- **Enum/Union type values:** `snake_case` — contoh canonical payment `'awaiting_payment'`, `'paid'`, tier `'basic'`, `'premium'`; raw provider status seperti `'capture'`/`'settlement'` tetap hanya di provider layer

#### Database Naming
- **Kolom tabel:** `snake_case` — contoh: `user_id`, `created_at`, `entitlement_tier_id`, `pin_hash`
- **Nama tabel:** `snake_case` plural — contoh: `user_profiles`, `invitations`, `guests`, `transactions`
- **JSONB keys:** `camelCase` — contoh: `bankName`, `accountNumber`, `photoMediaId`

#### Environment Variables
- **Client-side:** wajib prefix `NEXT_PUBLIC_` — contoh: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- **Server-side:** tanpa prefix — contoh: `SUPABASE_SECRET_KEY`, `MIDTRANS_SERVER_KEY`
- **Semua uppercase dengan underscore separator**

### 14.3 File Organization Rules

1. **Satu komponen per file** — kecuali sub-komponen kecil yang benar-benar private ke file tersebut.
2. **Route-local component** — gunakan `src/app/<segment>/_components/` bila hanya dipakai route/route-group itu.
3. **Domain component** — gunakan `modules/<feature>/components/` bila dipakai lintas route dalam domain yang sama.
4. **Shared component** — `shared/components/` hanya untuk komponen lintas-domain/business-agnostic.
5. **Types/schema** di-co-locate dengan owner module; jangan membuat giant global types file.
6. **Server Actions domain** berada di `modules/<feature>/server/actions.ts`; file memakai `'use server'`.
7. **Server query/service/authorization module** yang mengakses secret, Supabase elevated secret-key client, Redis, payment provider atau privileged DB memakai `import 'server-only'`.
8. **Client hooks** berada di module owner (`hooks.ts`) atau `shared/hooks/` bila benar-benar lintas-domain.
9. **Provider-specific code** berada di domain pemilik. Midtrans berada di `modules/payment/{client,server/provider/midtrans}`; tidak ada `shared/lib/midtrans`.
10. **Supabase generic clients** tetap di `shared/lib/supabase/` karena dipakai lintas domain.
11. **Route Handler** hanya untuk HTTP boundary yang memang diperlukan; internal CRUD/autosave/RSVP tidak dibuat REST duplikat bila Server Action/use-case sudah menjadi mutation path.
12. **Private folder `_components`/`_lib`** digunakan hanya di dalam `app` untuk implementation detail route. Folder top-level `modules`, `shared`, `config` tidak perlu prefix `_`.
13. **Tambah subfolder hanya ketika ada kelompok file nyata.** Jangan menerapkan layer berlebihan secara seragam pada modul kecil.
14. **shadcn/ui primitives** tetap di `shared/components/ui/` dan direview seperti source code repo sendiri.

### 14.4 Import Order (Ditegakkan via ESLint)

Urutan import dalam setiap file HARUS mengikuti urutan ini. Gunakan plugin ESLint `import/order` untuk menegakkan secara otomatis.

```typescript
// 1. React & Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 2. Third-party libraries
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';

// 3. config/ (konstanta)
import type { TierCode } from '@/config/tiers';
import { ROUTES } from '@/config/routes';

// 4. shared/ (komponen, hooks, utils bersama)
import { Button } from '@/shared/components/ui/button';
import { useMounted } from '@/shared/hooks/use-mounted';
import { cn } from '@/shared/utils/cn';

// 5. modules/ (sesuai domain/orchestration dependency rule)
import { createOrSyncInvitation } from '@/modules/invitation/server/actions';
import { useInvitationForm } from '@/modules/invitation/hooks';
import type { InvitationData } from '@/modules/invitation/types';

// 6. Relative imports (./, ../)
import { SubComponent } from './sub-component';
import { localHelper } from './utils';
```

**Separator:** Gunakan empty line antar grup. Plugin `eslint-plugin-import` dengan konfigurasi `import/order` bisa mengotomatisasi ini.

### 14.5 TypeScript Rules

- **Strict mode WAJIB aktif** di `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noUncheckedIndexedAccess": true,
      "noImplicitReturns": true
    }
  }
  ```

- **Tidak boleh ada `any`** — gunakan `unknown` jika tipenya benar-benar tidak diketahui, lalu narrow dengan type guard.
- **Semua API response HARUS bertipe** — gunakan generic `ApiResponse<T>`:
  ```typescript
  type ApiResponse<T> = { success: boolean; data?: T; error?: string; message?: string };
  ```
- **Semua struktur JSONB HARUS memiliki Zod schema** — schema digunakan untuk validasi runtime dan type inference:
  ```typescript
  const coupleSchema = z.object({
    groom: z.object({ name: z.string(), nickname: z.string(), ... }),
    bride: z.object({ name: z.string(), nickname: z.string(), ... }),
  });
  type CoupleData = z.infer<typeof coupleSchema>;
  ```
- **Supabase query results HARUS bertipe** — gunakan generated types dari `supabase gen types`:
  ```typescript
  import type { Database } from '@/shared/lib/supabase/types';
  type InvitationRow = Database['public']['Tables']['invitations']['Row'];
  ```
- **Gunakan `satisfies`** untuk memastikan objek memenuhi tipe tanpa mengubah inference:
  ```typescript
  const supportedTierCodes = ['basic', 'premium', 'vip'] as const
    satisfies readonly TierCode[];
  ```

### 14.6 Error Handling

Konvensi error handling memastikan konsistensi di seluruh aplikasi dan mencegah kebocoran informasi sensitif.

#### Server Actions

Semua Server Actions HARUS mengembalikan typed result yang membedakan error domain yang perlu ditangani UI. Pesan tetap ramah user dan stack/SQL detail tidak pernah keluar.

```typescript
type ActionErrorCode =
  | 'VALIDATION_ERROR'
  | 'VERSION_CONFLICT'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_STATE'
  | 'RATE_LIMITED'
  | 'THEME_LIMIT_CONFLICT'
  | 'TEMPORARY_ERROR';

type ActionResult<T = void> =
  | { success: true; data: T }
  | {
      success: false;
      code: ActionErrorCode;
      error: string;
      serverVersion?: number;
      fieldErrors?: Record<string, string[]>;
    };
```

Creation tidak boleh berupa raw insert tunggal karena schema normalized mempunyai `invitations` + `invitation_events` dan harus idempotent terhadap `client_ref`:

```typescript
'use server';
export async function createOrSyncInvitation(
  input: unknown,
): Promise<ActionResult<{ invitationId: string; slug: string; contentVersion: number }>> {
  try {
    const user = await requireUser();
    await ensureUserProfile(user);
    const validated = invitationCreateOrSyncSchema.parse(input);

    const result = await invitationRepository.createOrSyncAtomic({
      userId: user.id,
      clientRef: validated.clientRef,
      themeId: validated.themeId,
      couple: validated.couple,
      initialEventDraft: validated.initialEventDraft,
      // slug/server-controlled entitlement/status/security fields tidak diterima dari client
    });

    return { success: true, data: result };
  } catch (error) {
    return mapInvitationActionError(error); // log server-side sanitized + typed domain result
  }
}
```

Update/delete memakai ownership assertion + lifecycle state check + optimistic `content_version`. Event/gallery multi-table mutation menggunakan atomic transaction/RPC, bukan rangkaian `.update()` terpisah dari client. Jangan pernah meneruskan object client mentah ke `.insert()`/`.update()`.

#### API Routes

Semua API routes HARUS mengembalikan JSON dengan format konsisten:

```typescript
// Success
return Response.json({ success: true, data: { ... } }, { status: 200 });

// Error
return Response.json({ success: false, error: 'Pesan error ramah user' }, { status: 400 });
```

#### Client Feedback & Confirmation Boundary

Primitive dependency tetap **Sonner + shadcn `AlertDialog`/`Dialog`/`Sheet` + shared `ConfirmDialog`**, tetapi **seluruh pemetaan UX** (kapan toast/dialog dipakai, anti-friction, copy, focus, geometry, dan z-index) dimiliki **File 03 §1.4/§1.8**. File 01 tidak memelihara matriks kedua.

File 01 hanya mengunci boundary teknis: native `alert()/confirm()/prompt()` tidak menjadi workflow aplikasi; dialog client bukan security boundary; authorization/re-auth/state machine/idempotency tetap server-side; dan error yang memblokir correctness harus tersedia sebagai state respons/halaman yang dapat ditindaklanjuti, bukan hilang bersama toast.

#### Global Error Handler

- `src/app/error.tsx` menangkap error pada root route segment yang berada di bawah root layout.
- `src/app/global-error.tsx` menjadi fallback bila error mencapai root layout; file ini harus menyediakan `<html>` dan `<body>` sesuai konvensi Next.js.
- Loading/error boundary tambahan ditempatkan sedekat mungkin dengan route yang membutuhkannya; jangan menaruh root `loading.tsx` hanya karena tersedia.
- `src/app/layout.tsx` membungkus app dengan `<Toaster />` dari Sonner.
- **JANGAN PERNAH** mengekspos stack trace, env vars, atau detail error teknis ke client.
- Log error lengkap ke `console.error` (atau service logging jika ada) untuk debugging server-side.

### 14.7 Environment Variable Usage

**Daftar nama, visibility, dan fungsi env yang kanonik hanya berada di Bagian 23.** Jangan memelihara daftar kedua di bagian coding convention.

Aturan implementasi:

- validasi env dilakukan di `shared/lib/env.ts` dengan Zod; **bukan** `config/env.ts`, karena `config/` wajib zero imports;
- client hanya menerima variable `NEXT_PUBLIC_*` yang memang public (Supabase URL/publishable key, Midtrans client key, Turnstile site key, Maps Embed key);
- Supabase secret key, Midtrans server key, HMAC keys, Redis credential, payment-token encryption key, dan email webhook secret hanya server/Worker secret;
- conditional validation wajib: `MAP_PROVIDER=google_embed` membutuhkan Maps Embed key; `openfreemap` tidak;
- production/preview/development memakai credential terpisah sesuai provider; production secret tidak disalin ke preview;
- ketika env baru ditambahkan, update **Bagian 23 + `shared/lib/env.ts` + deployment secret/binding config** dalam perubahan yang sama;
- aplikasi harus gagal start/deploy secara jelas bila required env tidak valid.

`shared/lib/env.ts` boleh mengimpor Zod karena berada di layer `shared`; `config/` tetap murni konstanta tanpa import.

## 15. UI/UX & Theme Presentation Ownership

### 15.1 Platform Design System

**File 03 adalah SSoT** untuk palette Champagne Slate, Tailwind `@theme` token, typography platform, CTA hierarchy, component/dialog geometry, confirmation UX, responsive behavior, dan skala z-index. File 01 tidak menyimpan salinan angka/hex/radius/z-index tersebut.

Boundary arsitektural yang tetap dimiliki File 01:

- `globals.css` adalah global platform stylesheet; theme CSS wajib ter-scope ke wrapper renderer dan tidak bocor ke dashboard;
- arbitrary CSS/class/font/SVG/HTML/animation config dari owner tidak diterima sebagai input;
- wedding theme tidak mengikuti dark mode platform;
- harga/limit/tier tidak boleh ditaruh di design token/theme source;
- renderer registry tidak menduplikasi metadata bisnis database.

Perubahan visual dilakukan di File 03 (platform UI) atau File 05 (wedding renderer) sesuai ownership matrix; File 01 hanya berubah bila perubahan tersebut membutuhkan contract domain/runtime/schema baru.

### 15.2 Legacy Theme Seed Migration

File 01 **tidak menyimpan palette/hex legacy** karena visual token adalah ownership File 05 dan source migration yang versioned. Jika repository lama mempunyai preset seed, migration membaca nilai lama dari migration/fixture sumber, memetakannya ke `design_tokens`/`layout_config` kanonik, lalu renderer mengikuti token contract File 05. Jangan memelihara tabel palette contoh kedua di dokumen arsitektur.

Business migration tetap mengikuti File 01: tidak ada tier `FREE`; bila data legacy benar-benar mempunyai label tier `Free`, mapping migrasi menjadi **BASIC** sebelum masuk schema kanonik. Existing valid `BASIC/PREMIUM/VIP` dipertahankan berdasarkan `tier_id`/tier code yang tervalidasi, bukan berdasarkan nama warna/preset.

## 16. Media Upload & Processing

Keputusan #187–#215 berlaku sebagai invariant. Untuk **zero-cost MVP**, media yang memerlukan transcode video server-side tidak diaktifkan; `video_limit` baseline mengontrol jumlah **external video embed allowlisted**. Uploaded-video pipeline adalah future capability dan tidak boleh diam-diam mengaktifkan compute berbayar.

1. File langsung masuk **private quarantine**, bukan bucket final.
2. Signed upload URL dibuat setelah ownership + **validated media `purpose`** + entitlement/preview allowance yang relevan + aggregate storage limit + atomic reservation; gallery quota hanya direservasi untuk `purpose='gallery'`.
3. Lifecycle: `pending_upload → uploaded → processing → ready | rejected → deleting/deleted`.
4. Worker idempotent; duplicate queue delivery tidak membuat derived object/DB side effect ganda.
5. File final selalu hasil processing; original upload tidak menjadi serving asset normal.
6. Replace bersifat copy-on-success, bukan overwrite.
7. Processing gagal melepas quota reservation.
8. Quarantine stale/incomplete dibersihkan setelah 24 jam.

Sebelum entitlement pertama, editor boleh memakai allowance dari tier theme yang sedang dipilih untuk preview. Setelah entitlement ada, quota final selalu membaca `entitlement_snapshot` historis.

## 17. Background Jobs, Outbox, Scheduler & Workflow

### 17.1 Transactional Outbox

Untuk business mutation yang membutuhkan side effect asynchronous:

```text
BEGIN
  business mutation
  INSERT outbox_event
COMMIT
```

Dispatcher mengklaim batch due row memakai `FOR UPDATE SKIP LOCKED`, mengubahnya ke `dispatching`, lalu mengisi `locked_at` + `lock_token`. Lease `dispatching` yang melewati timeout dianggap stale dan boleh direclaim secara atomic. Partial index `idx_outbox_due` dan `idx_outbox_dispatch_lease` menjaga scanner tidak full-scan.

Dispatcher mengirim outbox ke durable queue menggunakan idempotency key. Crash setelah queue-send tetapi sebelum `dispatched_at` aman karena publish/consumer harus idempotent; crash sebelum publish tidak membuat row macet permanen karena stale lease direclaim.

### 17.2 Queue Consumer

- Delivery dianggap **at-least-once**.
- Job payload minimal: `resource_id`, `event_id`, `job_version`.
- Worker membaca ulang resource/status/config dari DB; jangan mempercayai snapshot business dari queue payload.
- Retry: exponential backoff + jitter; bedakan retryable vs permanent error.
- Tidak ada infinite retry; final failure masuk `failed_jobs`.
- Manual retry admin hanya untuk job yang retry-safe dan menghasilkan audit event.
- Concurrency lock/guard menggunakan DB state/atomic transition, bukan process-local mutex.

### 17.3 Scheduler

Timestamp database adalah source of truth. **Supabase Cron/pg_cron** menjadi scheduler kanonik untuk scanner sub-harian/daily pada arsitektur ini; scanner hanya menemukan row yang `due` dan mendorong pekerjaan ke outbox/queue.

Baseline:

```text
outbox dispatch/recovery         → frequent/sub-hourly sesuai load
invitation expiry                → hourly
payment reconciliation           → frequent untuk unknown/urgent; hourly baseline untuk backlog normal
stale media/job recovery         → hourly
export cleanup                   → hourly
draft/trash/quarantine cleanup   → daily
security audit retention         → daily
backup health check              → daily
```

Jika satu run terlambat, query tetap menggunakan `WHERE due_at <= now()` sehingga run berikutnya menangkap backlog.

### 17.4 Durable Workflow

Gunakan workflow multi-step hanya untuk proses yang memang membutuhkan checkpoint/retry per langkah:

- account hard deletion;
- full-account export besar;
- large administrative purge/export;
- disaster/recovery orchestration tertentu.

Payment entitlement **tidak** menunggu workflow/queue: webhook + Status API + atomic Postgres transition harus menyelesaikan correctness terlebih dahulu.

## 18. Data Export, Backup & Deletion

### 18.1 Self-Service Export

User dapat mengekspor satu invitation atau seluruh account. Full-account export adalah sensitive action.

Output:

```text
export.zip
├── manifest.json
├── account.json
├── invitations/<id>/invitation.json
├── invitations/<id>/guests.csv
├── invitations/<id>/transactions.csv
└── invitations/<id>/media/...
```

Credential/hash/secret/raw IP tidak pernah ikut. File export disimpan private maksimal **24 jam** dan download memakai signed URL **15 menit**.

Bulk administrative export berada di luar support grant biasa: hanya `super_admin` + sensitive-auth + structured reason + whitelist scope/filter + audit.

### 18.2 Backup Requirement

Target produksi: **backup database harian dengan retention efektif 30 hari**, plus backup terpisah untuk object Storage. Supabase Free tidak menyediakan automatic backup sebagai dependency yang boleh diasumsikan, sehingga backup dibuat di luar fitur paid Supabase.

**Zero-cost baseline:**
- workflow GitHub Actions terjadwal menjalankan logical dump (`supabase db dump`/Postgres-compatible dump) menggunakan secret CI minimal;
- dump dienkripsi sebelum keluar runner;
- archive dapat disimpan pada R2 Standard **selama tetap di free allowance** dengan lifecycle 30 hari, atau pada encrypted operator-controlled off-site storage bila R2 subscription tidak ingin digunakan;
- object Storage memiliki manifest + backup script terpisah; backup DB tidak dianggap mencakup object media;
- job memeriksa ukuran/usage dan gagal dengan alert sebelum sengaja berpindah ke paid usage;
- restore test minimum **quarterly**;
- backup tidak tersedia untuk admin support biasa.

Script backup harus portable dan version-controlled agar provider storage dapat diganti tanpa mengubah schema/business logic.

### 18.3 Deletion Tombstone

Hard deletion membuat `data_deletion_tombstones` yang dipertahankan setidaknya melewati seluruh backup retention window. Setelah restore backup lama, tombstone diproses kembali sebelum data dianggap aktif sehingga data yang sudah dihapus tidak hidup kembali.

### 18.4 Account Deletion

```text
active
→ pending_deletion (30 hari grace)
→ deleting
→ deleted
```

Saat request dibuat:
- re-authentication + typed confirmation;
- semua invitation langsung mendapat `public_suspended_at` + `suspension_reason=account_deletion`;
- transaksi baru dilarang;
- user boleh membatalkan selama grace setelah auth valid;
- UI menawarkan export tetapi export bukan syarat deletion.

Hard delete adalah workflow idempotent dengan urutan aman: (1) hapus seluruh object Storage user/invitation/export melalui **Supabase Storage API**—jangan menghapus row `storage.objects` dengan SQL; (2) pastikan tidak ada object ownership yang masih dapat memblokir penghapusan Auth user; (3) hapus data DB user-owned/cascade; (4) hapus `auth.users` melalui Admin/Auth API sebagai langkah akhir; dan (5) pastikan `data_deletion_tombstones` tercatat setelah deletion berhasil agar restore backup lama tetap tersuppress. Retry setiap langkah harus aman setelah crash. Payment/security record yang memang masih diperlukan hanya mempertahankan minimum data yang dibutuhkan dan mengikuti retention/legal policy tersendiri.

### 18.5 Invitation Permanent Delete

Owner membutuhkan ownership + sensitive-auth + typed confirmation. Penghapusan invitation tidak sama dengan refund. Storage cleanup asynchronous dan idempotent.

## 19. Email & Notification Architecture

- Resend Free menjadi baseline transactional email dan custom SMTP Supabase Auth. Essential security/payment/auth email diprioritaskan terhadap kuota; marketing email blast bukan fitur MVP dan tidak boleh memaksa upgrade plan.
- Seluruh email non-auth business dikirim melalui outbox + queue dengan `email_deliveries.idempotency_key`.
- Template memiliki `template_code` + `template_version`; jangan mengubah arti template historis diam-diam.
- Security alert, payment receipt/status penting, account deletion, dan governance incident adalah transactional/essential; jangan dicampur marketing.
- Reminder draft/renewal dapat memiliki preference user, tetapi perubahan preference tidak boleh menonaktifkan security-critical email.
- Domain email production harus dikonfigurasi SPF/DKIM/DMARC sesuai provider.
- Provider webhook delivery/bounce/complaint diverifikasi dan diproses idempotent.
- Hard bounce/complaint masuk suppression untuk email non-security; security-critical fallback ditangani sesuai kebijakan account/support tanpa melakukan spam retry.
- Email tidak memuat PIN, guest token, private session token, raw IP, atau data tamu yang tidak diperlukan.

## 20. Observability, Analytics & Privacy

### 20.1 Operational Observability

Pantau minimal:

```text
HTTP 5xx rate + p95 latency jalur dynamic
publish success/failure rate
RSVP/wishes mutation error rate
queue depth / oldest message age
outbox backlog
job duration / retry / permanent failure
cron last success + duration
stale processing count
payment reconciliation backlog + oldest unresolved payment
webhook failure rate
signed media processing failure
email delivery/bounce rate
DB/storage/Redis/queue/email quota pressure
```

Log bersifat structured dengan `request_id`/`correlation_id`; jangan memasukkan PIN/token/secret/raw IP.

### 20.2 Invitation Analytics

Owner analytics menggunakan agregat harian (`invitation_analytics_daily`). MVP memakai first-party analytics ini saja—tidak perlu SaaS analytics berbayar. View dedup menggunakan Redis + HMAC IP/window dan tidak mempersist raw IP/lokasi presisi.

Private invitation tidak menggunakan third-party behavioral tracker yang dapat melihat private content. Analytics platform/landing dan operational metrics dipisahkan dari guest PII.

## 21. API & Web Security Baseline

- Semua mutation: server validation + authentication + authorization + resource ownership/scope.
- Cookie-auth mutation memverifikasi same-origin (`Origin`/`Host`) dan CSRF protection yang sesuai; `SameSite=Lax` bukan satu-satunya kontrol.
- CORS default same-origin; buka origin hanya jika ada API yang memang membutuhkan.
- Security headers minimum: CSP yang ketat dan kompatibel dengan Snap/Turnstile, HSTS production, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`.
- CSP dibuat route-aware. Jangan menggunakan `unsafe-eval` di production dan **jangan membuka `unsafe-inline` global hanya untuk dark mode**.
- Dashboard/admin yang dynamic boleh memakai nonce untuk `next-themes`; nonce tidak diterapkan ke landing/static route karena nonce memaksa dynamic rendering dan menonaktifkan static optimization/ISR. Public static dark mode memakai CSS `prefers-color-scheme`.
- Response yang melakukan Supabase auth session refresh/`Set-Cookie` wajib private/no-store dan **tidak** boleh masuk ISR/shared CDN; Proxy matcher dikecilkan agar landing/katalog/static route tidak menjalankan refresh.
- Cacheable public invitation HTML tidak boleh menyimpan signed Storage URL 15 menit; gunakan stable app media endpoint/ID seperti Bagian 5.4.
- Invitation yang memakai Google Maps Embed menambahkan `frame-src https://www.google.com` (dan origin lain hanya jika benar-benar dibutuhkan). Jangan membuka `frame-src *`. Midtrans Snap/Turnstile allowlist tetap direview terpisah. Jika `MAP_PROVIDER=openfreemap`, CSP diganti/ditambah secara eksplisit untuk tile/style/worker origin OpenFreeMap/MapLibre; jangan membiarkan allowlist Google dan OpenFreeMap terbuka bersamaan tanpa provider aktif.
- Request body/file limits diterapkan sebelum parser/process berat.
- External URL input tidak boleh menjadi arbitrary server fetch/SSRF. Gunakan provider/host allowlist atau simpan URL sebagai client navigation saja.
- Redirect destination divalidasi terhadap internal route/allowlist.
- Error client tidak mengandung stack trace, SQL detail, secret, atau raw provider payload.
- Public RPC `SECURITY DEFINER` hanya jika benar-benar diperlukan: non-exposed schema, revoke `PUBLIC EXECUTE`, `SET search_path`, explicit auth/state check, minimal output.

## 22. Testing, CI/CD & Production Readiness

### 22.1 Automated Tests

Minimum suite:

- unit: pricing/upgrade/renewal/entitlement merge, retention, token utilities, validation;
- database: RLS owner isolation, SECURITY DEFINER grants, constraints, idempotent RPC;
- integration: Midtrans sandbox create/status/webhook/cancel/expire/refund, `capture+accept`, `capture+challenge`, duplicate/out-of-order webhook, create-timeout unknown recovery, late payment, refund bank-confirmation, chargeback/provider reversal, outbox dispatcher, queue duplicate delivery;
- E2E: guest→login, create draft, publish payment flow, private PIN, RSVP modes, support access, account deletion;
- media: malformed MIME, decompression bomb dimension guard, retry/crash/replacement;
- security: IDOR/BOLA regression, CSRF/origin, rate-limit, stale role/session, signed URL authorization.
- UI/runtime: GSAP cleanup + reduced-motion + mobile performance smoke test; Howler single-instance/cleanup; Google Maps iframe CSP/referrer-key test; dark-mode dashboard/admin hydration + landing ISR/static-cache regression; CTA/lead-magnet smoke flow `landing → theme → personalized preview → auth → editor`.

### 22.2 Migration & Environment

- Migration SQL version-controlled; production schema tidak diedit manual tanpa migration trail.
- Preview/staging tidak menggunakan production database/storage/secrets.
- Supabase secret key (`sb_secret_...`; legacy `service_role` key bila masih migrasi) dan payment server secret tidak tersedia di client maupun untrusted preview.
- Dependency versions dipin dan lockfile dikomit.
- CI menjalankan typecheck, lint, unit/integration test, migration validation, dan build sebelum production deploy.

### 22.3 Production Gate

Sebelum go-live:

1. RLS/security advisors reviewed;
2. custom SMTP/email domain verified;
3. Midtrans production keys/environment/Merchant ID + HTTPS no-redirect webhook + Cloudflare WAF bypass-for-challenge tested;
4. Redis/Turnstile configured;
5. Cloudflare Queue/Workflow consumer health verified;
6. `opennextjs-cloudflare preview` + production-like integration test lolos;
7. scheduler heartbeat verified;
8. backup + restore test procedure documented;
9. object Storage backup strategy aktif;
10. security headers/CSP verified terhadap Snap/Turnstile/Google Maps Embed; dark-mode route split tidak mematikan ISR landing;
11. support/governance roles bootstrapped dan audit log bekerja.

### 22.4 Executable Contract Gate

Markdown bukan satu-satunya tempat business/security rule boleh hidup. Setiap capability yang diimplementasikan harus mempunyai kontrak executable yang sesuai:

```text
input/output validation      → Zod/schema typed
database invariant           → constraint/index/transaction/RPC
authorization                → RLS/GRANT + trusted server check
state transition             → satu domain function/RPC kanonik
idempotency/concurrency      → key/fingerprint/version/CAS + test
external provider mapping    → adapter tervalidasi + contract test
security requirement         → automated/manual verification evidence
```

**Definition of Done minimum** untuk feature yang masuk milestone implementasi:

1. migration/schema dan rollback/forward-recovery diketahui;
2. server-side validation + authorization selesai;
3. happy-path dan negative authorization test tersedia;
4. idempotency/concurrency test tersedia bila mutation dapat diretry/berlomba;
5. error UX dan typed domain error tersedia;
6. observability untuk jalur gagal penting tersedia;
7. accessibility/mobile/runtime test dilakukan bila user-facing;
8. dokumentasi kanonik diperbarui bila contract berubah.

File 06 boleh mengurutkan pekerjaan dan menunjuk test/artefak tersebut, tetapi tidak boleh mendefinisikan ulang business rule File 01.

## 23. Environment Variables

| Variable | Lingkungan | Deskripsi |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Client & Server | Canonical app URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | Public Supabase publishable key; legacy anon key hanya jika project lama memang masih menggunakannya |
| `SUPABASE_SECRET_KEY` | Server Only | Supabase `sb_secret_...` privileged backend key; legacy `SUPABASE_SERVICE_ROLE_KEY` hanya untuk migrasi project lama |
| `RATE_LIMIT_HMAC_SECRET` | Server Only | HMAC IP limiter |
| `GUEST_TOKEN_HMAC_SECRET` | Server Only | Guest token lookup |
| `RSVP_EDIT_TOKEN_HMAC_SECRET` | Server Only | RSVP edit token lookup |
| `PRIVATE_SESSION_KEY_CURRENT` | Server Only | HMAC private session current key |
| `PRIVATE_SESSION_KEY_CURRENT_VERSION` | Server Only | Current key version |
| `PRIVATE_SESSION_KEY_PREVIOUS` | Server Only | Previous rotation key, optional |
| `PRIVATE_SESSION_KEY_PREVIOUS_VERSION` | Server Only | Previous version, optional |
| `SENSITIVE_AUTH_HMAC_SECRET` | Server Only | Sensitive re-auth cookie signature |
| `REDIS_URL` / provider equivalent | Server Only | Distributed Redis endpoint |
| `REDIS_TOKEN` / provider equivalent | Server Only | Distributed Redis credential |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Client | Snap client key |
| `MIDTRANS_ENV` | Server Only | `sandbox` / `production`; endpoint dari allowlist internal |
| `MIDTRANS_MERCHANT_ID` | Server Only | Merchant ID untuk provider invariant check |
| `MIDTRANS_SERVER_KEY` | Server Only | Midtrans server key |
| `PAYMENT_TOKEN_ENCRYPTION_KEY` | Server Only | AES-GCM key untuk Snap token/redirect URL yang dipersist; versioned rotation |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client | Turnstile site key |
| `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY` | Client/Public | Google Maps Embed API key; API-restricted + HTTP-referrer restricted. Optional bila provider map yang dipilih OpenFreeMap. |
| `MAP_PROVIDER` | Server Config | `google_embed` (default) atau `openfreemap`; renderer dipilih sekali, tidak menjalankan dua provider bersamaan. |
| `TURNSTILE_SECRET_KEY` | Server Only | Turnstile verification secret |
| `RESEND_API_KEY` | Server Only | Transactional email |
| `RESEND_WEBHOOK_SECRET` | Server Only | Email webhook verification |
| Cloudflare Queue/Workflow bindings | Worker Binding | Dideklarasikan di `wrangler.jsonc`; bukan `NEXT_PUBLIC_*` dan bukan credential client |
| `MEDIA_WORKER_*` | Server Only | Dedicated worker config if processing runtime terpisah |

Jangan menyalin production secrets ke preview environment.

### 23.9 Midtrans Hardening Final

Payment integration memakai canonical business state terpisah dari Midtrans `transaction_status`, funded-success `capture+accept`/`settlement`, provider event ledger, idempotent create + intent fingerprint + ambiguous-timeout recovery, funded-aware Snap session/transaction cancel + expiry, state-aware reconciliation, refund `refund_key` + bank confirmation, chargeback/partial chargeback/provider reversal, 3DS/FDS, dan strict amount/order/environment invariant.

---

## Lampiran: Daftar Pengecekan (Checklist) Sebelum Coding

Gunakan checklist ini sebelum mulai mengimplementasikan fitur baru:

- [ ] Apakah fitur ini masuk ke modul yang sudah ada atau perlu modul baru?
- [ ] Apakah import graph mengikuti domain/orchestration rule dan bebas circular dependency?
- [ ] Apakah Server Action mengembalikan `ActionResult<T>` dengan typed domain error bila UI perlu membedakan conflict/state/validation?
- [ ] Jika membuat invitation, apakah semua jalur memakai `createOrSyncInvitation()` + `client_ref` yang sama dan bukan raw INSERT kedua?
- [ ] Jika mutation menyentuh event/gallery, apakah parent `content_version` di-CAS dalam transaction yang sama?
- [ ] Apakah PIN/privacy/security mutation dipisahkan dari generic autosave/local draft?
- [ ] Apakah publish/check-out menggunakan `validatePublishReadiness()` server-side yang sama dengan progress UI?
- [ ] Apakah published content mutation menjadwalkan cache/OG invalidation retry-safe setelah DB commit?
- [ ] Apakah JSONB structure memiliki Zod schema?
- [ ] Apakah ada field JSONB yang perlu di-query? (perlu Generated Column?)
- [ ] Apakah komponen ini bisa jadi Server Component? (jika ya, jangan tambahkan 'use client')
- [ ] Apakah ada external call yang perlu timeout + retry + fallback?
- [ ] Apakah ada env var baru? (tambahkan ke `shared/lib/env.ts` dan Bagian 23)
- [ ] Apakah ada data sensitif yang bisa bocor ke client? (cek response, error message)
- [ ] Apakah animasi ini cukup CSS, atau memang membutuhkan GSAP? Jika GSAP: plugin di-load selektif, cleanup `useGSAP/gsap.context` benar, dan `prefers-reduced-motion` diuji.
- [ ] Apakah dependency/provider baru benar-benar diperlukan? Jika kebutuhan dapat diselesaikan dependency existing/native API, **jangan tambah dependency**.
- [ ] Apakah fitur baseline tetap $0 dalam provider free tier? Paid add-on/pay-as-you-go tidak boleh aktif otomatis.
- [ ] Apakah mutation UI ini benar-benar membutuhkan Route Handler? Jika tidak, gunakan Server Action/use-case yang sudah ada.
- [ ] Apakah module server-only sudah memakai `import 'server-only'` pada boundary yang tepat?
- [ ] Apakah static asset berada di root `public/`, bukan `src/public/`?
- [ ] Apakah repository hanya memiliki `src/app/` dan tidak sekaligus root `app/`?
- [ ] Apakah copy FREE transparan (`buat + preview`, bukan publish gratis)?
- [ ] Apakah UI ini membutuhkan client state baru? Jika ya, pastikan tidak menduplikasi React Hook Form/DB source of truth.

---

> **Dokumen ini bersifat hidup.** Update saat ada keputusan arsitektur baru. Setiap perubahan harus didiskusikan dan didokumentasikan di sini sebelum diimplementasikan di kode.
