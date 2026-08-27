# Weplan Cross-Milestone Compliance Audit

Date: 2026-08-27

Status: **INCOMPLETE — production launch blocked**

Audited commit: `15cf67aed382b5dcf7fad8f2dac09e892bb671fc`

## 1. Scope and authority

Audit ini membandingkan repository aktual dengan:

- File 06 sebagai authority roadmap dan scope;
- File 07 sebagai database/domain implementation reference;
- File 01–05 sebagai canonical authority sesuai ownership masing-masing;
- File 08 sebagai execution dan completion procedure;
- `IMPLEMENTATION-RECORD.md` sebagai execution evidence, bukan specification authority.

Evidence yang diperiksa mencakup source code, migrations, tests, scripts, CI configuration, Git status/history, hasil quality gate lokal, dan status GitHub Actions terbaru.

Audit ini tidak mengubah business rule dan tidak melakukan remediation code.

## 2. Executive conclusion

Repository belum memenuhi launch gate File 06. Fondasi TypeScript, module structure, Supabase client separation, sebagian RLS/GRANT, editor CAS, private storage, dan PIN Argon2id sudah tersedia. Namun clean migration chain, core commercial flow, payment correctness, operational endpoint security, media pipeline, durable queue, recovery, observability, production-like verification, dan CI evidence belum memenuhi acceptance criteria.

Kesimpulan `production-ready` pada entry M8 sebelumnya tidak berlaku untuk current HEAD berdasarkan evidence audit ini.

## 3. Launch-blocking findings

### AUD-P0-01 — Clean migration chain tidak valid

Severity: **P0 — launch blocker**

Evidence:

- `20260827010000_payment_tables.sql` membuat foreign key ke `draft_extension_products`.
- Tabel `draft_extension_products` baru dibuat oleh migration yang lebih akhir, `20260827080000_remaining_tables.sql`.
- `20260827070000_cron_jobs.sql` membentuk header authorization dengan ekspresi SQL yang berada di dalam string literal secara tidak valid.
- Tidak ada migration yang membuat extension `pg_cron` atau `pg_net` sebelum `cron.schedule` dan `net.http_get` digunakan.
- `scripts/verify-migrations.mjs` hanya memeriksa format nama dan file kosong; verifier tidak mengeksekusi atau mem-parse SQL.

Impact:

- Database baru tidak dapat dipercaya untuk direkonstruksi dari migration history.
- M1, M4, M7, database CI, dan disaster recovery evidence tidak sah sampai clean reset berhasil.

Required proof:

- `supabase db reset` dari environment bersih lulus.
- Seluruh pgTAP dan `supabase db lint --level error` lulus.
- Urutan migration diperbaiki secara forward-safe sesuai deployment history aktual.

### AUD-P0-02 — Payment funded transition belum atomic dan invariant belum lengkap

Severity: **P0 — launch blocker**

Evidence:

- Webhook melakukan update invitation, payment attempt, transaction, provider event, dan enqueue email melalui beberapa operasi terpisah.
- Tidak ada satu RPC/database transaction yang menjamin funded entitlement diterapkan tepat satu kali.
- Amount diproses dengan `parseFloat()` dan `Math.round()`, bukan decimal-safe parser.
- Response Status API tidak dibandingkan secara lengkap dengan local `amount_idr`, currency, merchant, dan expected environment sebelum entitlement diterapkan.
- Concurrent duplicate webhook dapat melewati read-before-insert dedupe dan tetap menjalankan funded path.
- Handler `payment_reconciliation` mengembalikan sukses tanpa memanggil Status API atau menerapkan transition.
- Lifecycle reconciliation hanya membuat outbox event baru; tidak ada actual reconciliation consumer.
- Tidak ada integration test untuk create-timeout unknown, mismatch, duplicate/out-of-order webhook, funded-once, cancel race, atau reconciliation.

Impact:

- Risiko entitlement ganda, partial commit, receipt ganda, status pembayaran tidak pulih, atau entitlement diberikan untuk provider data yang mismatch.

Required proof:

- Satu canonical atomic funded-transition RPC.
- Strict order/amount/currency/merchant/environment verification.
- Idempotent duplicate/out-of-order integration tests dan sandbox verification.
- Reconciliation consumer benar-benar menjalankan Status API dan guarded transition.

### AUD-P0-03 — Operational endpoints dan Resend webhook tidak mempunyai authentication yang benar

Severity: **P0 — launch blocker**

Evidence:

- `/api/cron/dispatch` dan `/api/cron/lifecycle` tidak memverifikasi bearer cron secret.
- `/api/admin/metrics` tidak memerlukan authenticated admin atau server-to-server credential.
- Middleware hanya mencakup page routes dan tidak mencakup endpoint API tersebut.
- Resend webhook menerima request tanpa signature ketika signature header kosong.
- Resend webhook menggunakan `resend-signature` dan custom hex HMAC, bukan canonical Svix headers dan verification flow.
- Bila Resend env gagal diparse, handler membalas sukses tanpa observability yang memadai.

Impact:

- Pihak eksternal dapat memicu dispatcher/lifecycle work, membaca operational aggregates, atau memalsukan bounce/complaint event.

Required proof:

- Constant-time cron secret verification atau internal binding boundary.
- Admin authorization pada metrics.
- Resend SDK/Svix raw-body verification dengan replay protection dan negative tests.

Reference:

- https://resend.com/docs/webhooks/verify-webhooks-requests

### AUD-P0-04 — Core create, checkout, publish, dan RSVP flow belum end-to-end

Severity: **P0 — launch blocker**

Evidence:

- `/create` memanggil `/api/invitation/create`, tetapi Route Handler tersebut tidak ada.
- Canonical `createOrSyncInvitation` Server Action tersedia tetapi tidak digunakan oleh create page.
- `createCheckout`, `cancelCheckout`, dan `publishPaidDraft` tidak mempunyai caller dari UI atau Server Action boundary.
- Tidak ada checkout/publish UI route pada application tree.
- `RsvpForm` tidak digunakan oleh launch renderer mana pun.
- Tidak ada browser E2E untuk guest → login → create → edit → preview → checkout → webhook → publish → PIN/RSVP.

Impact:

- Happy path utama produk tidak dapat diselesaikan dari aplikasi meskipun beberapa use-case functions sudah ada.

Required proof:

- Satu first-party mutation path per operation.
- End-to-end launch flow berjalan pada production-like environment.

### AUD-P0-05 — Media pipeline belum memenuhi M6

Severity: **P0 — launch blocker untuk media yang diaktifkan**

Evidence:

- `validateMagicBytes` diimpor oleh upload route tetapi tidak pernah dipanggil.
- Audio path tidak melakukan magic-byte/decoder validation.
- Upload reservation tidak menghitung effective entitlement quota secara atomic.
- Image processing memakai native `sharp` secara synchronous di request cycle Next/OpenNext.
- `pg_try_advisory_lock` dipanggil sebagai RPC tanpa migration wrapper; RPC error tidak diperiksa.
- Session-level advisory lock tidak dipertahankan selama seluruh processing work.
- Edge Function `media-process` hanya menyalin byte yang sama untuk variants, menerima owner/path fields dari request, dan tidak menjadi processing path yang digunakan aplikasi.

Impact:

- MIME spoofing, quota bypass, duplicate processing, CPU pressure pada request Worker, dan ketidakcocokan production runtime.

Required proof:

- Atomic reservation RPC.
- Bounded byte/decoder/dimension validation.
- Durable idempotent media worker/consumer.
- Production-like runtime test dengan actual supported image processor.

## 4. High-severity findings

### AUD-P1-06 — PIN/Turnstile adaptive defense tidak dapat digunakan sesuai policy

Evidence:

- PIN gate tidak merender Turnstile dan tidak mengirim `turnstileToken`.
- Setelah threshold challenge tercapai, legitimate guest tidak mempunyai UI untuk menyelesaikan challenge.
- Branch `heightened` dikecualikan dari Turnstile verification meskipun result menyatakan `requiresTurnstile: true`.
- Missing Turnstile secret menyebabkan verification sukses tanpa membatasi perilaku tersebut hanya untuk development/test.
- Distributed threshold test mendefinisikan ulang policy di dalam test, bukan membaca canonical production policy.

Required proof:

- Render + token lifecycle + server verification E2E.
- Production env fail-closed.
- Tests memakai canonical production policy/constants.

Reference:

- https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

### AUD-P1-07 — CSP tidak benar-benar route-aware dan integration script belum diizinkan dengan aman

Evidence:

- Static CSP menetapkan `script-src 'self'` tanpa nonce/hash.
- Midtrans dan Turnstile berada pada `frame-src`/`connect-src`, tetapi external JavaScript hosts tidak berada pada `script-src`.
- Global, API, dan webhook header rules overlap; webhook rule tidak menghapus CSP global.
- Security-header tests menyalin string expected sendiri dan tidak membaca `next.config.ts` atau response production-like.

Impact:

- Hydration atau provider UI dapat terblokir di browser, sementara unit test tetap hijau.

Required proof:

- Nonce/hash-based CSP atau route-aware policy yang kompatibel dengan Next.js dan provider.
- Browser verification untuk auth, dashboard, Midtrans, Turnstile, Maps, dan public renderer.

Reference:

- https://nextjs.org/docs/app/guides/content-security-policy

### AUD-P1-08 — Durable queue, recovery, dan critical alert belum tersedia

Evidence:

- `wrangler.jsonc` tidak mempunyai Queue/Workflow binding atau observability configuration.
- Dispatcher mengeksekusi handler langsung dari cron route, bukan publish ke durable queue.
- Tidak ada database backup workflow, Storage backup manifest, atau actual restore-test artifact.
- Metrics hanya menghasilkan alert code dalam JSON; tidak ada delivery, owner, escalation, atau runbook binding.
- Tidak ada scheduler heartbeat record yang digunakan untuk alert.

Impact:

- M7/M8 acceptance criteria dan launch gate recovery/observability belum terpenuhi.

### AUD-P1-09 — Test dan implementation evidence melebihkan status aktual

Evidence:

- Current lint gagal dengan 7 errors dan 26 warnings.
- Current Vitest gagal pada 2 suites karena `@testing-library/dom` tidak tersedia; 188 tests lain lulus.
- Security-header test dan threshold test menguji duplicate constants, bukan production integration.
- Tidak ada payment webhook integration test, queue redelivery test, media worker integration test, browser E2E, backup restore test, atau production-like CSP test.
- Lima GitHub CI runs terbaru berstatus failure; latest HEAD berhenti pada `supabase start` dan langkah berikutnya di-skip.
- M8 dicatat `COMPLETE` walaupun entry yang sama menyatakan backup/restore dan critical alert belum tersedia.

Impact:

- Checklist `COMPLETE`, launch-gate checkbox, dan readiness conclusion tidak merepresentasikan executable evidence.

## 5. Architecture and marketing findings

Bagian ini membedakan dua jenis gap:

- **Architecture violation**: implementation aktual melanggar dependency/ownership/runtime rule yang sudah dikunci.
- **Canonical implementation gap**: target folder atau capability canonical belum tersedia; ini tidak selalu berarti file yang ada salah tempat, tetapi milestone/launch surface belum lengkap.

### 5.1 Classification summary

| ID | Severity | Category | Classification | Summary |
|---|---|---|---|---|
| AUD-P1-10 | P1 | Dependency graph | Architecture violation | Cycle `invitation ↔ theme` dan deep import lintas-domain. |
| AUD-P1-11 | P1 | App boundary | Architecture violation | Route/page menjalankan business orchestration. |
| AUD-P2-12 | P2 | Ownership and file organization | Architecture violation | Business policy, server-only code, config, dan component ownership belum konsisten. |
| AUD-P1-13 | P1 | Marketing/conversion | Canonical implementation gap | Landing dan acquisition flow belum memenuhi launch contract. |
| AUD-P2-14 | P2 | Automated enforcement | Architecture control gap | Verifier tidak mendeteksi cycle/deep import/import ordering. |
| AUD-P2-15 | P2 | Canonical coverage | Canonical implementation gap | Dashboard, admin, payment, orchestration, E2E, dan public asset tree belum lengkap. |

### 5.2 Detailed findings

#### AUD-P1-10 — Dependency graph domain tidak acyclic

Evidence:

- `src/modules/theme/types.ts` mengimpor schema milik `invitation`.
- `src/modules/invitation/server/public-queries.ts` dan `src/modules/invitation/theme-registry.ts` mengimpor `theme`, sehingga membentuk dependency dua arah `invitation ↔ theme`.
- `invitation` mengimpor implementation internal `auth/server/*` secara langsung.
- `jobs/server/enqueue.ts` mengimpor contract dari `email/server/actions.ts`, bukan public contract yang sempit.
- Read-only import scan menemukan enam edge lintas-domain: `invitation → auth`, `invitation → theme`, `jobs → email`, dan `theme → invitation` pada enam source files.

Impact:

- Module tidak dapat dikembangkan dan diuji sebagai boundary yang stabil.
- Perubahan schema invitation dapat merambat ke renderer theme dan kembali lagi ke invitation.
- Risiko circular initialization, coupling tersembunyi, dan perluasan akses terhadap server implementation meningkat.

Required proof:

- Invitation DTO/schema publik mempunyai satu owner dan tidak bergantung kembali pada theme.
- Integrasi lintas-domain menggunakan public contract yang sempit atau module orchestration dengan dependency satu arah.
- Automated boundary check menolak cycle dan deep import lintas-domain yang tidak diizinkan.

#### AUD-P1-11 — `src/app` belum menjadi composition dan HTTP boundary yang tipis

Evidence:

- `src/app/api/webhooks/midtrans/route.ts` berisi sekitar 234 baris payment, invitation, dan email/job orchestration.
- `src/app/api/cron/dispatch/route.ts` menyusun handler lintas-domain dan menjalankan dispatch workflow langsung.
- `src/app/api/guest/verify-pin/route.ts` mengoordinasikan PIN, rate limit, Turnstile, dan incident workflow pada Route Handler.
- `src/app/(dashboard)/create/page.tsx` adalah Client Component yang membaca Supabase secara langsung dan memanggil internal endpoint `/api/invitation/create` yang tidak tersedia.
- Belum ada explicit `checkout` orchestration module atau canonical payment webhook handler pada module layer.

Impact:

- Business workflow tersebar di routing layer dan sulit digunakan ulang dari Server Action, worker, reconciliation, atau test.
- HTTP contract dan domain transition berubah bersama, memperbesar risiko regression pada flow pembayaran dan onboarding.

Required proof:

- Route Handler hanya melakukan authentication/request verification, parsing, delegation, dan response mapping.
- Payment/checkout, cron dispatch, guest verification, dan media upload mempunyai canonical module-level use-case.
- Internal first-party mutations menggunakan Server Action/use-case yang sama dan tidak membuat duplicate API primitive.

#### AUD-P2-12 — Ownership internal module, `shared`, dan `config` belum konsisten

Evidence:

- PIN/private-invitation defense policy berada di `src/shared/lib/security`, walaupun policy tersebut dimiliki guest/private invitation domain; `shared` seharusnya business-agnostic.
- `src/modules/payment/provider/midtrans` dan root `payment/state-machine.ts` memuat server-only/payment lifecycle concerns di luar canonical `payment/server/*` boundary.
- `src/modules/invitation/components/invitation-editor.tsx` berukuran sekitar 562 baris dan memuat beberapa komponen utama dalam satu file.
- `src/config/` berada di lokasi yang benar tetapi masih untracked, belum digunakan oleh source, dan beberapa constants tetap diduplikasi pada module implementation.
- Direktori kosong `src/modules/storage/components`, `src/modules/theme/shared-sections`, dan `src/shared/hooks` ada pada working tree walaupun belum mempunyai kelompok file nyata.

Impact:

- Nama/lokasi file tidak cukup menunjukkan runtime, ownership, atau dependency yang aman.
- Policy mudah diduplikasi dan komponen besar menjadi sulit diuji serta dirawat.

Required proof:

- Business policy kembali ke owning module; hanya mechanism generik yang berada di `shared`.
- Server-only payment/provider code berada di `modules/payment/server` dan ditandai `server-only` bila relevan.
- Editor dipecah berdasarkan tanggung jawab nyata tanpa membuat folder placeholder.
- `config` hanya memuat constants/types statis, mempunyai zero imports, dan benar-benar dikonsumsi tanpa menjadi source of truth bisnis kedua.

#### AUD-P1-13 — Marketing launch surface belum memenuhi conversion contract

Evidence:

- `src/app/(marketing)/page.tsx` hanya berisi hero sederhana sekitar 27 baris dengan CTA `Masuk` dan `Daftar`.
- Route group `(marketing)` dan Server Component statis sudah benar, tetapi belum mempunyai `layout.tsx` dan route-local `_components`.
- Navbar, theme-preview hero, Featured Themes, Personalized Preview, Cara Kerja/Core Benefits, Pricing, Privacy/Security, FAQ, Final CTA, dan Footer belum tersedia.
- Route canonical `/katalog`, `/demo/[slug]`, `/lead-magnet`, serta legal pages belum tersedia.
- CTA acquisition canonical `Coba Tema Gratis`/`Mulai Draft Gratis` dan flow `theme → personalized preview → auth/sync → editor` belum terhubung.
- Landing memakai internal `<a>` links, hardcoded hex colors, dan target tombol sekitar 40px; belum menggunakan `next/link`, design tokens penuh, focus treatment yang terbukti, atau baseline target mobile sekitar 44px.
- Root layout masih memakai system font, bukan Plus Jakarta Sans melalui `next/font`.
- Metadata hanya berisi title/description generik; favicon/app icon, homepage Open Graph image, `robots.ts`, dan `sitemap.ts` tidak tersedia.
- Landing static belum mempunyai CSS `prefers-color-scheme` yang diwajibkan untuk public-static dark mode tanpa client theme script.

Impact:

- Acquisition flow utama berhenti pada login/register sebelum user merasakan nilai personalized theme preview.
- Landing belum memenuhi launch UI, SEO, accessibility, dan conversion acceptance criteria File 01/File 03.

Required proof:

- Landing server/static-first menyusun section melalui `(marketing)/_components`, dengan client island hanya untuk preview/filter/form pendek.
- Featured themes dan BASIC/PREMIUM/VIP pricing membaca canonical active catalogue; kartu FREE tetap marketing-only dan tidak membuat tier bisnis baru.
- Tidak ada fake testimonial, counter, partner, promo, atau capability yang belum aktif.
- Browser smoke/E2E membuktikan `landing → theme → personalized preview → auth → editor`, responsive mobile, keyboard focus, reduced motion, dan static-cache behavior.
- Metadata, OG image, sitemap, robots, semantic landmarks, optimized font, dan responsive images tervalidasi.

#### AUD-P2-14 — Architecture verifier memberikan coverage yang terlalu sempit

Evidence:

- `npm run verify:structure` dan `npm run verify:boundaries` lulus walaupun dependency cycle dan deep cross-domain imports di atas tetap ada.
- `scripts/verify-boundaries.ts` hanya berfokus pada client-to-server path heuristic.
- `eslint-plugin-boundaries` terpasang tetapi tidak dikonfigurasi pada `eslint.config.mjs`.
- Tidak ada enforcement `import/order` sebagaimana diwajibkan konvensi.

Impact:

- Quality gate dapat hijau sementara canonical dependency graph sudah dilanggar.

Required proof:

- ESLint/boundary verifier memodelkan `app`, `modules`, `shared`, dan `config`, termasuk larangan cycle serta deep import yang tidak diizinkan.
- Import ordering dan public module contracts ditegakkan oleh CI.

#### AUD-P2-15 — Canonical target structure belum lengkap

Classification: **Canonical implementation gap**, bukan bukti bahwa seluruh file yang sudah ada salah ditempatkan.

Evidence:

- Dashboard invitation tree belum mempunyai `dashboard/[id]/layout.tsx`, `tamu/page.tsx`, dan `rekening/page.tsx`.
- Wedding route belum mempunyai canonical `template.tsx`.
- Admin UI tree (`admin/layout.tsx`, landing/beranda, users, invitations, themes, dan leads) belum tersedia; yang ada baru metrics API/module server.
- Payment module belum mempunyai `client/snap-loader.ts`, `server/service.ts`, `server/webhook-handler.ts`, dan `server/reconciliation.ts` pada canonical boundary.
- Explicit `modules/checkout` orchestration dan canonical `modules/analytics` belum tersedia.
- `tests/e2e` dan `playwright.config.ts` tidak tersedia meskipun `@playwright/test` sudah menjadi dependency dan acceptance criteria mewajibkan browser E2E.
- Root `public/` baru berisi `_headers`; canonical asset groups `templates/fonts`, `lead-magnet`, `images`, dan `sounds` belum tersedia.
- Marketing route gaps dicatat terpisah pada AUD-P1-13 agar conversion readiness tidak tercampur dengan inventory folder umum.

Impact:

- Struktur repository belum merepresentasikan seluruh target product surface File 01 dan launch acceptance evidence File 03/File 06.
- Dependency Playwright belum menghasilkan executable E2E suite atau configuration.
- Tidak adanya orchestration/payment service boundary mempertahankan business workflow di `src/app`.

Required proof:

- Tambahkan route/module hanya ketika work package dan capability terkait disetujui; jangan membuat folder kosong untuk sekadar menyerupai diagram canonical.
- Setiap route baru mempunyai owning use-case, authorization, loading/error behavior, dan test evidence yang relevan.
- Payment/checkout structure dibentuk bersama pemindahan workflow, bukan melalui file wrapper kosong.
- Playwright configuration dan E2E mencakup flow launch utama pada environment production-like.
- Public asset group hanya dibuat ketika mempunyai asset nyata dan ownership/optimization policy yang jelas.

## 6. Verification results

| Verification | Result | Notes |
|---|---|---|
| `npm run typecheck` | PASS | TypeScript strict compilation lulus. |
| `npm run lint` | FAIL | 7 errors, 26 warnings. |
| `npm run verify:structure` | PASS | Canonical `src/app` structure check lulus. |
| `npm run verify:boundaries` | PASS, insufficient | Client/server path heuristic lulus tetapi tidak mendeteksi cross-domain cycle/deep import. |
| Read-only cross-domain import scan | FAIL | Enam edge lintas-domain terdeteksi; terdapat cycle `invitation ↔ theme`. |
| Canonical target path inventory | INCOMPLETE | Dashboard child routes, admin UI, payment/checkout boundaries, E2E setup, dan public asset groups belum lengkap. |
| `npm run test` | FAIL | 2 suites gagal; 188 tests lulus. |
| `npm run functions:check` | PASS | 3 PIN crypto tests lulus. |
| `npm run verify:migrations` | PASS, insufficient | Hanya memeriksa filename/empty file. |
| `npm run build` | PASS | Next.js production build lulus. |
| `npm run build:cloudflare` | NOT PROVEN | Local Windows build gagal saat membuat symlink `sharp`; bukan production-like success evidence. |
| `npm audit` | PASS | 0 known vulnerabilities pada dependency tree saat audit. |
| `supabase db reset/test/lint` | NOT RUN LOCALLY | Docker tidak tersedia. Migration-order defect tetap terkonfirmasi melalui static dependency inspection. |
| GitHub Actions latest HEAD | FAIL | Run `33073971910`; gagal pada `supabase start`, langkah database dan quality berikutnya di-skip. |

CI evidence:

- https://github.com/indologian/weplan/actions/runs/33073971910

## 7. Milestone assessment

| Milestone | Audit status | Principal reason |
|---|---|---|
| M0 | PARTIAL | CI dan production-like Cloudflare preview tidak lulus. |
| M1 | INCOMPLETE | Clean migration chain tidak valid. |
| M2 | PARTIAL | Editor foundation tersedia, tetapi create UI memakai endpoint yang tidak ada dan dashboard `tamu`/`rekening` belum tersedia. |
| M3 | PARTIAL / UNPROVEN | Renderer tersedia; wedding template, marketing launch surface, dan device/accessibility/performance browser QA tidak mempunyai evidence. |
| M4 | INCOMPLETE | Payment correctness, canonical payment/checkout structure, reconciliation, integration, dan UI flow belum memenuhi acceptance. |
| M5 | PARTIAL | Public/private foundation tersedia; Turnstile/RSVP integration dan E2E belum lengkap. |
| M6 | INCOMPLETE | Validation, quota reservation, processing lock, worker model, dan runtime proof belum memenuhi acceptance. |
| M7 | INCOMPLETE | Tidak ada durable queue consumer; reconciliation no-op; cron endpoint terbuka. |
| M8 | INCOMPLETE | Backup/restore, alert delivery, secured metrics, dan production evidence belum tersedia. |
| Launch gate | FAIL | Masih ada unresolved P0 dan required evidence yang hilang. |

## 8. Verified strengths

- TypeScript strict configuration dan basic structure guard tersedia.
- Generic Supabase browser/server/service client separation tersedia.
- Core M1 tables mempunyai explicit RLS/GRANT separation pada migration foundation.
- Credential PIN dipisahkan dari invitation owner-readable row.
- PIN hashing memakai Argon2id dan bounded Edge Function request.
- Editor mempunyai content version/CAS foundations dan typed action results.
- Storage buckets dikonfigurasi private dan serving memakai stable application endpoint.
- Route group `(marketing)` sudah benar dan homepage tetap berupa Server Component statis tanpa client bundle yang tidak diperlukan.
- Next.js production build lulus.
- Dependency audit tidak menemukan known vulnerability saat audit dilakukan.

Strength tersebut belum menghapus launch blockers di atas.

## 9. Recommended remediation sequence

Remediation belum dimulai dan memerlukan persetujuan user per work package.

1. **WP-AUDIT-REMEDIATION-01 — Migration chain and CI recovery** (`AUD-P0-01`, `AUD-P1-09`)
   - Perbaiki dependency order dan cron migration secara forward-safe.
   - Pulihkan clean `db reset`, pgTAP, db lint, lint, unit tests, dan CI.
2. **WP-AUDIT-REMEDIATION-02 — Operational boundary security** (`AUD-P0-03`, `AUD-P1-07`)
   - Lindungi cron/metrics; perbaiki Resend verification; tambah negative integration tests.
3. **WP-AUDIT-REMEDIATION-03 — Atomic payment correctness** (`AUD-P0-02`)
   - Canonical funded RPC, strict invariants, actual reconciliation, dan duplicate/race tests.
4. **WP-AUDIT-REMEDIATION-04 — Complete product happy path** (`AUD-P0-04`)
   - Sambungkan create, checkout, publish, public renderer, PIN, dan RSVP melalui canonical mutation paths.
5. **WP-AUDIT-REMEDIATION-05 — Architecture boundaries** (`AUD-P1-10`, `AUD-P1-11`, `AUD-P2-12`, `AUD-P2-14`)
   - Putus dependency cycle, bentuk public contracts/orchestration, tipiskan `src/app`, rapikan ownership, dan perluas automated boundary enforcement.
6. **WP-AUDIT-REMEDIATION-06 — Marketing and canonical product surface** (`AUD-P1-13`, `AUD-P2-15`)
   - Lengkapi landing/katalog/demo/onboarding, dashboard child routes, admin/payment surface yang masuk milestone, serta E2E tanpa membuat placeholder folder.
7. **WP-AUDIT-REMEDIATION-07 — Media and anti-abuse completion** (`AUD-P0-05`, `AUD-P1-06`)
   - Atomic quota, validation, durable processing, and Turnstile UX/E2E.
8. **WP-AUDIT-REMEDIATION-08 — Recovery, observability, and launch proof** (`AUD-P1-08`)
   - Queue consumer, backup/Storage recovery, restore test, heartbeat/critical alerts, browser and production-like verification.

Jangan menandai milestone terkait `COMPLETE` sampai seluruh acceptance criteria relevan dan evidence pada work package tersebut lulus.

## 10. Repository state during audit

Pre-existing uncommitted changes observed:

- modified: `package.json`
- modified: `package-lock.json`
- untracked: `src/config/`
- untracked: `src/shared/components/`

Audit mempertahankan perubahan tersebut. Tidak ada secret, token, credential, PII, atau raw production payload yang dicatat dalam laporan ini.
