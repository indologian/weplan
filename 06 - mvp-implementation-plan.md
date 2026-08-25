# 06 - MVP Implementation Plan --- weplan

> **Peran dokumen:** execution roadmap untuk mengimplementasikan File
> 01--05.
>
> **Bukan SSoT business rule baru.** Jika terdapat konflik, authority
> tetap: - File 01: domain, database, runtime, lifecycle, payment,
> entitlement, security invariant teknis. - File 02: security
> hardening/checklist. - File 03: platform UI/UX. - File 04: failure
> mode, race, recovery, capacity edge-case. - File 05: wedding
> renderer/theme visual.
>
> **Prinsip scope:** launch-critical dikerjakan terlebih dahulu;
> capability activated-on-demand hanya menjadi blocker ketika capability
> diaktifkan; operational maturity tidak boleh menghambat launch kecuali
> melindungi auth, payment, privacy, data integrity, atau recovery
> fundamental.
>
> **Target biaya:** zero fixed subscription cost selama kuota provider
> mencukupi. Correctness tidak boleh bergantung pada free tier.

------------------------------------------------------------------------

## 1. Tujuan MVP

MVP dianggap berhasil ketika user dapat menjalani alur utama secara
aman:

``` text
Landing / Theme Catalog
        ↓
Try / Preview Theme
        ↓
Authentication
        ↓
Create Invitation Draft
        ↓
Editor + Autosave
        ↓
Preview
        ↓
Payment
        ↓
Entitlement
        ↓
Publish
        ↓
Guest opens invitation
        ↓
RSVP / Wishes / Gift / Venue
```

Launch theme awal mengikuti File 05 hasil audit: 1. Modern Editorial
Ivory 2. Romantic Floral Watercolor 3. Javanese Heritage 4. Luxury
Midnight

Archetype lain tetap berada dalam roadmap katalog dan bukan launch
blocker.

------------------------------------------------------------------------

## 2. Aturan Eksekusi

### 2.1 Definition of Done universal

Sebuah capability belum selesai hanya karena UI bekerja. Untuk setiap
work package yang relevan:

-   [ ] schema/migration selesai dan reversible/forward-recoverable;
-   [ ] constraint/index/FK sesuai contract;
-   [ ] RLS + GRANT diuji;
-   [ ] server-side validation tersedia;
-   [ ] authorization/ownership check tersedia;
-   [ ] happy-path automated test;
-   [ ] negative/authorization test;
-   [ ] idempotency/concurrency test bila relevan;
-   [ ] typed error + user-visible error state;
-   [ ] observability minimum tersedia;
-   [ ] accessibility/responsive test untuk UI;
-   [ ] recovery/rollback diketahui;
-   [ ] security requirement File 02 terkait memiliki evidence;
-   [ ] edge-case P0 File 04 terkait telah diuji;
-   [ ] dokumen kanonik diperbarui jika contract berubah.

### 2.2 Aturan dependency

``` text
Database/Auth
    ↓
Domain + Authorization
    ↓
Invitation Creation
    ↓
Editor
    ↓
Renderer/Preview
    ↓
Payment/Entitlement
    ↓
Publish/Public Access
    ↓
Guest Interaction
    ↓
Media/Async Hardening
    ↓
Production Readiness
```

Jangan mengimplementasikan UI sebagai sumber business rule. UI
mengonsumsi use-case/domain contract.

### 2.3 Mutation surface

Gunakan satu mutation path untuk satu business operation. Server Action
cocok untuk mutation first-party app. Route Handler hanya dibuat ketika
ada alasan HTTP eksplisit seperti webhook/callback, stable media
resource, beacon, atau streaming/chunk requirement.

------------------------------------------------------------------------

# M0 --- Repository, Runtime & Quality Gate

## Tujuan

Membuat project dapat dibangun, diuji, dan dideploy pada runtime
production-like sebelum business feature dibuat.

## Implementasi

-   Next.js App Router + TypeScript strict.
-   Struktur `src/` mengikuti File 01.
-   Tailwind CSS + shadcn/ui baseline.
-   Supabase server/browser client boundary.
-   Environment validation.
-   ESLint/import boundary/server-only guard.
-   Test runner + integration-test infrastructure.
-   Cloudflare/OpenNext preview.
-   CI: typecheck, lint, test, build, migration validation.
-   Preview environment tidak memakai production secret.

## Acceptance criteria

-   [ ] local dev berjalan;
-   [ ] production-like Cloudflare preview berjalan;
-   [ ] client import terhadap `server-only` gagal;
-   [ ] CI menolak type/lint/test/build failure;
-   [ ] tidak ada root `app/` paralel dengan `src/app/`;
-   [ ] secret tidak masuk client bundle.

## Referensi

File 01 §1, §3, §14, §22, §23; File 02 Fase 1/14/15; File 04 §15/17.

------------------------------------------------------------------------

# M1 --- Database Foundation, Auth & Authorization

## Tujuan

Membangun identity dan database boundary sebelum editor/public surface.

## Implementasi

Prioritas schema: - `user_profiles` - `tiers` - `themes` -
`invitations` - `invitation_events` - credential tables yang
diperlukan - security audit foundation

Implementasikan: - migration versioning; - RLS seluruh exposed tables; -
explicit GRANT; - trusted profile provisioning; - owner authorization
helper; - role authorization server-side; - sensitive field
separation; - canonical invitation create transaction; - slug uniqueness
tanpa information leak.

## Acceptance criteria

-   [ ] anon tidak dapat membaca owner table;
-   [ ] user A tidak dapat membaca/mengubah resource user B;
-   [ ] role tidak dipercaya dari request body/user metadata;
-   [ ] create retry menghasilkan invitation yang sama;
-   [ ] provisioning profile idempotent;
-   [ ] credential/hash tidak keluar dari owner-readable row.

## Referensi

File 01 §4, §6, §8--9; File 02 Fase 1--4/8; File 04 §1/8.

------------------------------------------------------------------------

# M2 --- Core Invitation Domain & Editor

## Tujuan

User dapat membuat dan mengedit draft dengan aman.

## Implementasi

-   canonical draft DTO;
-   React Hook Form sebagai client form source of truth;
-   Zod server validation;
-   generic autosave hanya untuk allowlisted content;
-   `content_version`;
-   atomic compare-and-swap;
-   save queue;
-   conflict handling;
-   dedicated action untuk privacy/theme/sensitive mutation;
-   event CRUD + transactional reorder;
-   publish-readiness evaluator;
-   lifecycle edit guard.

## Acceptance criteria

-   [ ] stale save tidak menimpa revision baru;
-   [ ] response save lama tidak menandai edit baru sebagai clean;
-   [ ] two-tab conflict menghasilkan typed conflict;
-   [ ] generic autosave tidak dapat mengubah payment/security/lifecycle
    fields;
-   [ ] reorder tidak menghasilkan duplicate position;
-   [ ] incomplete draft boleh disimpan tetapi tidak dianggap
    publish-ready.

## Referensi

File 01 §4.20, §10, §14; File 02 Fase 9; File 03 editor UX; File 04
§5--6.

------------------------------------------------------------------------

# M3 --- Renderer, Preview & Launch Themes

## Tujuan

Draft dapat dipreview menggunakan renderer yang sama secara semantik
dengan public invitation.

## Implementasi

Shared renderer primitives: - cover/access gate; - opening; - couple; -
event/countdown; - venue/navigation; - gallery; - RSVP/wishes shell; -
gift; - closing; - optional section projection hanya dari canonical DTO.

Launch themes: - Modern Editorial Ivory; - Romantic Floral Watercolor; -
Javanese Heritage; - Luxury Midnight.

Performance: - server-compatible renderer; - client island hanya untuk
audio/motion/browser interaction; - lazy map/video/audio; - reduced
motion; - mobile stage; - image focal-point support.

## Acceptance criteria

-   [ ] preview tidak mengubah live theme/entitlement;
-   [ ] preview menunggu latest savable generation;
-   [ ] theme tidak menyimpan business state;
-   [ ] empat launch theme lulus responsive/accessibility/performance
    QA;
-   [ ] low-end Android, Safari iOS, dan in-app browser diuji;
-   [ ] featured-theme UI tidak menjalankan banyak heavy renderer
    sekaligus.

## Referensi

File 01 §10.6--10.7, §15; File 03; File 05; File 04 §6/13.

------------------------------------------------------------------------

# M4 --- Payment, Entitlement & Publish

## Tujuan

Menghasilkan commercial flow yang deterministic dan idempotent.

## Implementasi

Schema/use-case: - `transactions`; - `payment_attempts`; -
`payment_provider_events`; - entitlement snapshot pada invitation; -
create-payment idempotency + intent fingerprint; - Midtrans Snap; -
webhook signature verification; - Status API verification; - atomic
funded transition; - publish-readiness recheck; - cancel pending; -
reconciliation baseline; - audited adjustment foundation.

Rule: browser callback hanya UX, bukan authority.

## Acceptance criteria

-   [ ] client tidak menentukan amount/tier entitlement;
-   [ ] duplicate create tidak membuat transaksi komersial ganda;
-   [ ] ambiguous provider timeout direcover;
-   [ ] duplicate/out-of-order webhook aman;
-   [ ] funded-success memberi entitlement tepat satu kali;
-   [ ] readiness failure setelah payment mempertahankan entitlement dan
    invitation tetap draft;
-   [ ] publish kedua tidak meminta pembayaran ulang untuk hak yang
    sudah dimiliki;
-   [ ] webhook mismatch tidak mengubah entitlement.

## Referensi

File 01 §7/§13; File 02 Fase 7; File 04 §3--4/6.

------------------------------------------------------------------------

# M5 --- Public Invitation, Privacy, Guest Identity & RSVP

## Tujuan

Invitation yang published dapat dibuka tamu tanpa membocorkan private
data.

## Implementasi

-   public invitation resolver;
-   lifecycle/expiry guard;
-   private PIN gate;
-   private session;
-   guest token;
-   public RSVP RPC/server endpoint;
-   wishes/guestbook;
-   explicit response whitelist;
-   distributed rate limit;
-   IP HMAC pseudonymization;
-   adaptive Turnstile;
-   brute-force/risk policy;
-   generic OG untuk private invitation.

## Acceptance criteria

-   [ ] `guests` tidak mempunyai anonymous raw-table access;
-   [ ] UUID/nama/`to=` bukan credential;
-   [ ] private content tidak keluar sebelum valid authorization;
-   [ ] PIN plaintext tidak pernah dipersist/log;
-   [ ] token revoke/regenerate efektif;
-   [ ] open RSVP rate-limited;
-   [ ] attacker tidak dapat membuat global hard-lock invitation;
-   [ ] private media/data tidak bocor melalui OG/cache.

## Referensi

File 01 §8, §11; File 02 Fase 3--6; File 04 §7/13.

------------------------------------------------------------------------

# M6 --- Media Pipeline

## Tujuan

Owner dapat mengunggah media tanpa membuat bucket public atau
mempercayai file client.

## Implementasi

-   private quarantine/final storage;
-   `media_assets`;
-   `invitation_gallery_items`;
-   `upload_reservations`;
-   atomic quota reservation;
-   byte/decoder/dimension validation;
-   image processing;
-   metadata stripping;
-   derived variants;
-   READY serving gate;
-   stable media endpoint;
-   replacement/delete semantics.

Uploaded-video transcoding bukan launch dependency. External video embed
hanya allowlisted.

## Acceptance criteria

-   [ ] tidak ada anonymous public Storage SELECT;
-   [ ] MIME/extension spoof ditolak;
-   [ ] EXIF/GPS tidak ada pada derived image;
-   [ ] duplicate processing aman;
-   [ ] replacement failure mempertahankan asset READY lama;
-   [ ] quarantine/rejected/deleted asset tidak memperoleh serving URL;
-   [ ] private/personalized media tidak masuk shared cache.

## Referensi

File 01 §5, §16; File 02 Fase 6/11; File 04 §10/13.

------------------------------------------------------------------------

# M7 --- Async Reliability, Email & Lifecycle Jobs

## Tujuan

Side effect penting tahan retry tanpa memindahkan source of truth dari
PostgreSQL.

## Implementasi

-   `outbox_events`;
-   queue dispatcher;
-   idempotent consumer;
-   retry/backoff/jitter;
-   `failed_jobs`;
-   `scheduled_job_runs`;
-   Supabase Cron due scanner;
-   email queue + template version;
-   delivery/bounce webhook;
-   lifecycle reminder/expiry jobs.

Gunakan queue untuk email, media, invalidation, cleanup dan side effect
yang memang memerlukan durability. CRUD normal tetap synchronous.

## Acceptance criteria

-   [ ] DB commit + queue failure meninggalkan outbox pending;
-   [ ] duplicate queue delivery aman;
-   [ ] poison job berhenti di failed-job ledger;
-   [ ] cron overlap aman;
-   [ ] correctness lifecycle ditentukan timestamp authoritative, bukan
    ketepatan cron;
-   [ ] bounce/complaint tidak membuat resend loop.

## Referensi

File 01 §17/§19; File 02 Fase 12--13; File 04 §11--12.

------------------------------------------------------------------------

# M8 --- Production Security, Recovery & Observability

## Tujuan

Membuktikan MVP aman dan dapat dioperasikan.

## Minimum telemetry

-   HTTP 5xx rate;
-   p95 latency;
-   payment pending age;
-   reconciliation backlog;
-   outbox backlog;
-   oldest pending job;
-   failed jobs;
-   media processing failures;
-   email failures;
-   cron heartbeat;
-   Redis/provider quota/error;
-   DB/storage quota;
-   publish success/failure;
-   RSVP error rate.

Correlation identifiers yang aman: `request_id`, `invitation_id`,
`transaction_id`, `outbox_event_id`, `job_id`.

Jangan log raw IP, PIN, token, payment credential, guest PII yang tidak
diperlukan.

## Recovery verification

-   DB backup/restore;
-   Storage recovery terpisah;
-   queue retry;
-   payment reconciliation;
-   deletion tombstone foundation;
-   CSP/CSRF/SSRF/header verification;
-   free-tier quota alert/degraded behavior.

## Acceptance criteria

-   [ ] seluruh P0 File 04 relevan lulus;
-   [ ] seluruh security requirement launch-critical File 02 mempunyai
    evidence;
-   [ ] restore test berhasil;
-   [ ] payment reconciliation dapat dijalankan;
-   [ ] alert tersedia untuk heartbeat/backlog/failure kritis;
-   [ ] free-tier pressure tidak menyebabkan auth/payment/security
    fail-open.

## Referensi

File 01 §18/§20--22; File 02 Fase 8/10/14/15; File 04 §9/14--15.

------------------------------------------------------------------------

## 3. Capability yang Tidak Menjadi Launch Blocker

Capability berikut tidak dihapus dari arsitektur, tetapi implementasi
penuh dapat dilakukan setelah core MVP stabil bila belum diperlukan:

-   tambahan 8 archetype theme di luar empat launch theme;
-   sophisticated experimentation/lead magnet;
-   bulk admin operations;
-   advanced support-elevation UI;
-   automation partial-chargeback yang tidak dapat dipetakan aman;
-   large-export durable workflow bila volume belum membutuhkan;
-   uploaded video/audio transcoding berat;
-   advanced analytics product;
-   operational tooling yang hanya relevan pada scale lebih tinggi.

Jika capability diaktifkan, seluruh invariant/security/edge-case yang
terkait otomatis menjadi gate sebelum production activation.

------------------------------------------------------------------------

## 4. Milestone Dependency Matrix

  Milestone         Depends on            Unlocks
  ----------------- --------------------- ----------------------
  M0 Runtime        ---                   seluruh development
  M1 DB/Auth        M0                    owner-scoped domain
  M2 Editor         M1                    usable draft
  M3 Renderer       M2                    preview/theme QA
  M4 Payment        M1, M2                entitlement/publish
  M5 Public/Guest   M3, M4                guest experience
  M6 Media          M1, M2                production media
  M7 Async          M1, M4/M6 as needed   durable side effects
  M8 Production     M0--M7                launch

M4 dan M6 dapat dikerjakan paralel setelah contract M1/M2 stabil. M5
membutuhkan renderer dan publish/entitlement semantics yang stabil.

------------------------------------------------------------------------

## 5. Recommended Contractor Work Packages

Setiap ticket harus memuat: - tujuan; - source references; - schema/API
yang disentuh; - explicit non-goals; - acceptance criteria; - security
requirement IDs; - P0/P1 edge-case terkait; - migration/recovery
notes; - test evidence.

Contoh:

``` text
WP-PAY-03 Apply Funded Payment

Sources:
File 01 §7.4, §7.9–7.11
File 02 SEC-F07-*
File 04 §3

Deliverable:
Atomic provider-verified funded transition + entitlement snapshot.

Must prove:
- duplicate event safe
- amount/order/environment mismatch rejected
- entitlement applied once
- readiness failure does not remove purchased rights
```

------------------------------------------------------------------------

## 6. Launch Gate

Launch hanya dilakukan jika:

-   [ ] M0--M8 launch-critical selesai;
-   [ ] empat launch themes QA pass;
-   [ ] payment sandbox + production-like verification pass;
-   [ ] RLS/GRANT/IDOR test pass;
-   [ ] private invitation/media leak test pass;
-   [ ] editor concurrency test pass;
-   [ ] duplicate webhook/queue test pass;
-   [ ] backup/restore evidence tersedia;
-   [ ] CSP/security-header test pass;
-   [ ] observability + critical alert tersedia;
-   [ ] tidak ada unresolved P0;
-   [ ] tidak ada secret production pada preview;
-   [ ] billing auto-upgrade/pay-as-you-go yang tidak disetujui tetap
    disabled.

------------------------------------------------------------------------

## 7. Post-Launch Order

``` text
Telemetry stabilization
        ↓
Theme Wave 2
        ↓
Conversion experiments
        ↓
Admin/support maturity
        ↓
Theme Wave 3
        ↓
Advanced governance / scale tooling
```

Keputusan post-launch harus didorong oleh production telemetry dan
kebutuhan operasional, bukan sekadar menambah dependency.
