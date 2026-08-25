# 08 - AI Agent Execution Guide --- weplan

> **Peran dokumen:** operating manual untuk AI coding agent yang
> mengimplementasikan weplan berdasarkan File 01--07.
>
> **Bukan SSoT business/technical rule baru.** Dokumen ini hanya
> mengatur cara agent membaca specification, memilih scope kerja,
> mengimplementasikan, menguji, dan melaporkan hasil.
>
> **Priority model:**
>
> ``` text
> File 06 → WHAT / WHEN / milestone
> File 07 → DB/domain implementation reference
> File 01–05 → canonical rules sesuai ownership
> Code + migrations + tests → executable evidence
> ```
>
> Jika terjadi konflik antardokumen, gunakan ownership matrix File 01.
> Jangan menyelesaikan konflik dengan menebak.

------------------------------------------------------------------------

## 1. Dokumen yang Wajib Tersedia untuk Agent

Agent harus mempunyai akses ke seluruh:

``` text
01 - arsitektur-dan-konvensi.md
02 - panduan-keamanan.md
03 - panduan-ui-ux.md
04 - enterprise-security-and-edge-cases.md
05 - guide-undangan-pernikahan.md
06 - mvp-implementation-plan.md
07 - database-and-domain-contract-reference.md
08 - ai-agent-execution-guide.md
```

File 06 dan 07 adalah entry point implementasi, bukan pengganti File
01--05.

------------------------------------------------------------------------

## 2. Document Authority

  Area                                                 Authority
  ---------------------------------------------------- -----------
  Domain/business/database/runtime/lifecycle/payment   File 01
  Security checklist/hardening/evidence                File 02
  Platform UI/UX/design tokens/interaction/copy        File 03
  Failure/race/recovery/capacity edge cases            File 04
  Wedding renderer/theme visual                        File 05
  Milestone/order/launch scope                         File 06
  Database/domain implementation reference             File 07
  Agent operating procedure                            File 08

Agent tidak boleh membuat authority baru di source code comments,
ticket, README, atau implementation notes yang bertentangan dengan tabel
ini.

------------------------------------------------------------------------

## 3. Golden Rules untuk AI Agent

1.  Jangan implementasikan seluruh MVP sekaligus.
2.  Kerjakan satu milestone atau satu work package pada satu waktu.
3.  Sebelum coding, baca bagian File 01--05 yang direferensikan File 06.
4.  Jangan membuat business rule berdasarkan asumsi jika dokumen tidak
    menjelaskannya.
5.  Jangan mengubah SSoT hanya agar implementasi lebih mudah.
6.  Jangan menambah dependency jika solusi baseline sudah tersedia.
7.  Jangan membuat mutation surface kedua untuk operasi yang sama.
8.  Jangan menaruh authorization hanya di UI.
9.  Jangan mempercayai client untuk price, entitlement, role, ownership,
    lifecycle, credential, atau payment fact.
10. Jangan menghapus test untuk membuat build hijau.
11. Jangan melemahkan RLS/CSP/validation/security control untuk
    memperbaiki bug.
12. Jangan melakukan destructive migration tanpa recovery plan.
13. Jangan menggunakan provider/free-tier state sebagai business source
    of truth.
14. Jangan menyimpan raw PIN/token/secret/raw IP di log.
15. Jangan menyatakan work package selesai sebelum acceptance criteria
    dan test evidence terpenuhi.

------------------------------------------------------------------------

## 4. Execution Loop

Untuk setiap milestone/work package, agent mengikuti urutan:

``` text
READ
 ↓
PLAN
 ↓
IMPLEMENT
 ↓
TEST
 ↓
VERIFY
 ↓
REPORT
 ↓
STOP FOR REVIEW
```

### READ

Agent membaca: 1. milestone File 06; 2. contract File 07 yang terkait;
3. section File 01--05 yang dirujuk; 4. existing code/migration/test
yang akan disentuh.

### PLAN

Sebelum edit, agent menghasilkan ringkasan singkat:

``` text
Work package:
Goal:
Canonical references:
Files expected to change:
Migration required:
Security requirements:
P0/P1 edge cases:
Tests required:
Explicit non-goals:
```

Jika ditemukan ambiguity yang dapat mengubah business/security contract,
agent berhenti dan meminta keputusan.

### IMPLEMENT

Implementasi harus sekecil mungkin tetapi lengkap terhadap work package.

### TEST

Jalankan test relevan, bukan hanya test baru.

### VERIFY

Periksa Definition of Done File 06.

### REPORT

Laporkan: - perubahan; - migration; - test; - security evidence; -
unresolved issue; - deviation; - next recommended work package.

### STOP FOR REVIEW

Agent tidak otomatis melanjutkan milestone berikutnya kecuali user
secara eksplisit memberi izin autonomous execution.

------------------------------------------------------------------------

## 5. Scope Control

Agent harus membedakan:

### Launch-critical

Harus selesai untuk launch jika termasuk milestone M0--M8.

### Activated-on-demand

Tidak perlu diimplementasikan penuh sebelum capability digunakan.

### Deferred / operational maturity

Jangan dikerjakan hanya karena tercantum dalam arsitektur.

Contoh:

``` text
4 launch themes       → implement
12 themes sekaligus   → jangan

payment idempotency   → implement
advanced dispute UI   → defer bila belum dibutuhkan

outbox reliability    → implement saat side effect terkait aktif
large export workflow → defer bila capability belum aktif
```

------------------------------------------------------------------------

## 6. Repository Reconnaissance

Sebelum milestone pertama atau ketika menerima repository existing,
agent harus memeriksa:

-   package manager + lockfile;
-   Next.js/React/TypeScript versions;
-   source tree;
-   migrations;
-   Supabase config;
-   Cloudflare/OpenNext config;
-   environment schema;
-   current RLS/GRANT;
-   test framework;
-   CI;
-   existing dependencies;
-   duplicate app roots;
-   server/client boundary;
-   existing TODO/temporary bypass.

Agent tidak boleh mengasumsikan repository kosong.

Setelah reconnaissance dan sebelum melakukan instalasi/upgrade/config
yang version-sensitive, agent menjalankan **Official Documentation
Verification** §7.1. Repository memberi fakta tentang kondisi saat ini;
dokumentasi resmi memberi fakta tentang cara yang saat ini didukung.
Keduanya harus diperiksa sebelum agent mengubah dependency atau runtime
configuration.

Jika implementation code bertentangan dengan specification, agent harus
melaporkan conflict sebelum menjadikan existing behavior sebagai
authority.

------------------------------------------------------------------------

## 7. Dependency Policy

Sebelum menambah package, agent harus menjawab:

``` text
Apakah kebutuhan dapat diselesaikan oleh:
1. platform/browser API?
2. React/Next.js?
3. dependency baseline yang sudah dipilih?
4. CSS?
5. PostgreSQL/Supabase?
```

Jika ya, jangan tambah library baru.

Baseline simplicity dari File 01 tetap berlaku: - RHF untuk form; -
React state/context untuk local UI state; - Sonner untuk toast; - shadcn
primitive untuk dialog; - GSAP untuk theme motion yang memang
membutuhkan; - satu map provider aktif; - tidak ada analytics SaaS/AI
API/state manager/carousel engine kedua tanpa keputusan arsitektur baru.

### 7.1 Official Documentation Verification

Untuk framework, runtime, provider, CLI, SDK, atau dependency eksternal
yang dapat berubah, agent **wajib memverifikasi dokumentasi resmi
terbaru sebelum instalasi, upgrade, konfigurasi, atau penggunaan API
yang version-sensitive**. Agent tidak boleh mengandalkan training
knowledge, snippet lama, blog pihak ketiga, atau asumsi bahwa command
yang pernah benar masih berlaku.

Capability yang termasuk aturan ini minimal:

-   Next.js / React;
-   Cloudflare Workers, Wrangler, dan OpenNext adapter yang dipakai;
-   Supabase, termasuk Auth, SSR, Storage, CLI, dan database tooling;
-   Tailwind CSS;
-   shadcn/ui;
-   Midtrans;
-   dependency/provider lain yang API, CLI, compatibility matrix, atau
    setup-nya dapat berubah.

Urutan verifikasi:

``` text
Inspect repository + lockfile
        ↓
Identify existing/pinned version and runtime target
        ↓
Read current official documentation
        ↓
Check compatibility / migration notes
        ↓
Choose version intentionally
        ↓
Pin dependency + commit lockfile
        ↓
Implement using documented current pattern
        ↓
Run typecheck / lint / test / build
        ↓
Run production-like verification when relevant
```

Aturan khusus:

1.  **Existing repository:** jangan menjalankan scaffolding/install
    command yang dapat menimpa konfigurasi sebelum memahami repository.
2.  **Repository baru:** gunakan bootstrap/install path yang saat itu
    direkomendasikan dokumentasi resmi dan cocok dengan keputusan
    arsitektur File 01.
3.  **Versi:** `latest` boleh dipakai untuk discovery, tetapi dependency
    production harus dipin melalui manifest/lockfile sesuai policy File
    1.  
4.  **Compatibility:** jangan upgrade satu dependency secara terisolasi
    bila framework/runtime/provider mempunyai compatibility matrix.
5.  **Breaking change:** jika dokumentasi terbaru mengharuskan perubahan
    yang bertentangan dengan SSoT File 01--07, **STOP FOR REVIEW**.
    Jangan diam-diam mengubah arsitektur atau menurunkan security
    invariant.
6.  **Source priority:** dokumentasi resmi dan release/migration notes
    resmi menang atas tutorial, blog, forum, atau generated snippet.
7.  **Evidence:** pada REPORT, catat versi yang dipilih dan dokumentasi
    resmi yang menjadi dasar bila keputusan instalasi/configuration
    bersifat version-sensitive.

### 7.2 Next.js Bootstrap Gate

Pada M0, sebelum memasang atau mengubah Next.js, agent wajib:

``` text
Check package manager + lockfile
        ↓
Check whether Next.js already exists
        ↓
Check current Next.js / React / TypeScript versions
        ↓
Verify official Next.js documentation
        ↓
Confirm App Router + src/ compatibility
        ↓
Install/upgrade only if required
        ↓
Pin versions and preserve lockfile integrity
        ↓
Verify dev + typecheck + lint + test + build
        ↓
Verify Cloudflare/OpenNext production-like target
```

Agent tidak boleh mengasumsikan bahwa repository harus dibuat ulang
dengan `create-next-app`. Jika repository sudah ada, perubahan harus
minimal dan mengikuti reconnaissance §6. Jika repository kosong,
bootstrap harus menghasilkan struktur yang kompatibel dengan File 01 dan
acceptance criteria M0 File 06.

------------------------------------------------------------------------

## 8. Database Change Procedure

Untuk setiap perubahan DB:

1.  baca File 01 schema/domain authority;
2.  baca File 07 table contract;
3.  buat forward migration;
4.  tentukan FK/delete behavior;
5.  buat/review index;
6.  implement RLS;
7.  implement GRANT;
8.  update RPC/function jika perlu;
9.  update Zod/domain type;
10. test anon/owner A/owner B/privileged/trusted path;
11. jalankan advisor/relevant query verification;
12. dokumentasikan recovery.

Agent dilarang: - edit production DB manual tanpa migration; - direct
mutate `storage.objects`; - broad admin RLS untuk convenience; - expose
credential table ke client; - menaruh relational security fact di JSONB
hanya untuk menghindari schema.

------------------------------------------------------------------------

## 9. Security Execution Procedure

File 02 requirement ID digunakan sebagai evidence mapping.

Setiap security-sensitive work package harus menghasilkan:

``` text
Requirement ID
Implementation location
Automated test
Manual verification (jika diperlukan)
Status
```

Contoh:

``` text
SEC-F07-xx
src/modules/payment/...
tests/integration/payment-webhook...
PASS
```

Jika control belum dapat diuji otomatis, agent harus menyatakan manual
verification yang dibutuhkan; jangan menandainya PASS tanpa evidence.

------------------------------------------------------------------------

## 10. Payment Procedure

Untuk pekerjaan payment:

Agent wajib membaca File 01 payment section + File 02 Fase 7 + File 04
payment edge cases.

Tidak boleh: - mempercayai browser callback; - menghitung final amount
di client; - membuat checkout baru secara buta setelah ambiguous
timeout; - menerapkan entitlement dari webhook yang belum diverifikasi
sesuai canonical contract; - menghapus original transaction pada
refund/reversal; - menandai funded hanya karena Snap UI sukses.

Test minimum: - create; - retry; - same idempotency key; - different
intent same key; - ambiguous timeout; - invalid signature; - provider
mismatch; - duplicate webhook; - out-of-order webhook; - funded
transition; - readiness failure after funded; - cancellation race.

------------------------------------------------------------------------

## 11. Editor Procedure

Agent wajib mempertahankan:

``` text
RHF client form state
        ↓
save generation
        ↓
server validation
        ↓
content_version CAS
        ↓
authoritative persisted state
```

Tidak boleh: - menambahkan Zustand/store kedua untuk form; - force
overwrite conflict otomatis; - memasukkan payment/security/lifecycle
field ke generic autosave; - menganggap response request lama sebagai
state terbaru.

Test two-tab/stale-response merupakan acceptance requirement.

------------------------------------------------------------------------

## 12. Public Guest & Privacy Procedure

Untuk guest/public surface:

-   anonymous tidak raw-query `guests`;
-   response whitelist eksplisit;
-   name/UUID/`to=` bukan credential;
-   private invitation selalu authorization-first;
-   signed/stable media serving mengikuti File 01;
-   public cache tidak menyimpan personalized/private content;
-   raw IP dipseudonimkan sebelum persistence;
-   Turnstile adaptif;
-   rate limiter distributed;
-   attacker tidak boleh memperoleh global hard-lock primitive.

------------------------------------------------------------------------

## 13. Renderer Procedure

Theme menerima canonical DTO/capability, bukan membaca business tables
secara arbitrary.

Agent harus: - mempertahankan server-compatible renderer; - membuat
client island hanya ketika perlu; - mengikuti File 05 ThemeVisualSpec; -
menjaga max font family; - reduced-motion; - lazy heavy media; - shared
semantic section primitives; - theme-specific composition/art direction.

Agent tidak boleh: - menaruh entitlement logic di theme; - membuat
schema tersembunyi dalam theme config; - truncate valid owner content
untuk membuat preview terlihat memenuhi allowance; - menjadikan seluruh
wedding page Client Component hanya karena beberapa section memakai
GSAP.

------------------------------------------------------------------------

## 14. Testing Pyramid

### Unit

Untuk: - pure domain helper; - schema validation; - entitlement
calculation/projection; - readiness evaluator; - transition guard; -
utility security functions.

### Integration

Prioritas tertinggi: - database/RLS; - CAS; - payment transition; -
RPC; - outbox; - queue idempotency; - media state; - guest
authorization.

### E2E

Critical journey:

``` text
signup/login
→ create invitation
→ edit
→ preview
→ checkout sandbox
→ verified funded simulation
→ publish
→ guest open
→ RSVP
```

Tambahkan private invitation journey dan failure journey penting.

Agent tidak boleh mengganti integration test penting dengan mock-only
test.

------------------------------------------------------------------------

## 15. Browser & UI Verification

Untuk UI work package, agent memverifikasi:

-   mobile first;
-   keyboard navigation;
-   focus;
-   dialog accessibility;
-   loading/error/empty state;
-   destructive action behavior;
-   safe-area;
-   responsive desktop;
-   reduced motion;
-   no console error;
-   no hydration error.

Renderer launch theme juga diverifikasi pada: - Safari iOS; - Chrome
Android low-end; - common in-app browser; - desktop constrained stage.

------------------------------------------------------------------------

## 16. Observability Requirement

Feature kritis harus memiliki observability yang cukup untuk menjawab:

``` text
Apa yang gagal?
Untuk resource mana?
Kapan?
Pada transition mana?
Apakah retry aman?
Apakah user perlu tindakan?
```

Gunakan safe correlation identifier.

Dilarang log: - raw PIN; - raw guest/edit token; - raw private-session
secret; - provider credential; - raw IP; - unnecessary guest PII; - Snap
secret/redirect credential.

------------------------------------------------------------------------

## 17. Agent Decision Policy

### Agent boleh memutuskan sendiri

-   nama internal helper;
-   file decomposition yang mengikuti source-tree convention;
-   refactor lokal non-semantic;
-   test organization;
-   SQL query optimization yang tidak mengubah behavior;
-   accessible markup implementation;
-   implementation detail yang sudah memiliki satu canonical outcome.

### Agent harus meminta keputusan

Jika perubahan menyentuh: - business rule baru; -
tier/price/allowance; - lifecycle/state transition baru; - security
threshold; - credential semantics; - entitlement behavior; - payment
semantics; - data retention; - privacy behavior; - new paid
dependency; - provider replacement; - new schema authority; - breaking
API/public behavior; - scope launch yang berubah.

------------------------------------------------------------------------

## 18. Handling Specification Conflict

Jika agent menemukan konflik:

``` text
STOP
↓
identify conflicting statements
↓
apply ownership matrix
↓
if authority resolves → continue
↓
if same authority remains ambiguous → ask user
```

Report format:

``` text
SPEC CONFLICT

Area:
Statement A:
Statement B:
Authority:
Impact:
Recommended interpretation:
Decision required: yes/no
```

Jangan diam-diam memilih versi yang paling mudah diimplementasikan.

------------------------------------------------------------------------

## 19. Handling Existing-Code Conflict

Jika code existing tidak sesuai spec:

Agent harus mengklasifikasikan:

``` text
BUG
TECH DEBT
LEGACY IMPLEMENTATION
SPEC AMBIGUITY
INTENTIONAL DEVIATION
```

Jika jelas bug terhadap canonical contract, agent boleh memperbaiki
dalam scope work package dan menambahkan regression test.

Jika berpotensi intentional deviation, laporkan sebelum perubahan besar.

------------------------------------------------------------------------

## 20. Migration Safety

Untuk destructive/irreversible migration:

Agent wajib menyediakan: - preflight; - affected rows estimate/query; -
backup/recovery assumption; - forward recovery; - compatibility window
bila deploy bertahap; - application deployment order.

Gunakan expand → migrate/backfill → switch → contract bila perubahan
membutuhkan zero/low-downtime compatibility.

------------------------------------------------------------------------

## 21. Commit / Work Package Boundary

Idealnya satu work package menghasilkan perubahan yang dapat direview
sendiri.

Contoh:

``` text
WP-M1-01 profile provisioning
WP-M1-02 invitation schema + RLS
WP-M2-01 content DTO + validation
WP-M2-02 autosave CAS
WP-M3-01 renderer primitives
WP-M3-02 Editorial Ivory
WP-M4-01 payment intent
WP-M4-02 webhook funded transition
```

Jangan mencampur payment refactor, UI redesign, media migration, dan
unrelated dependency upgrade dalam satu work package.

------------------------------------------------------------------------

## 22. Required Completion Report

Setelah setiap work package, agent memberikan:

``` text
WORK PACKAGE COMPLETE

Scope:
Implemented:
Files changed:
Migrations:
Tests added/updated:
Tests executed:
Security requirement evidence:
Edge cases verified:
Manual verification required:
Known limitations:
Spec deviations:
Recommended next work package:
```

Jika test gagal, status bukan COMPLETE.

------------------------------------------------------------------------

# 23. Prompt Template --- Start Project

Gunakan prompt berikut kepada coding agent:

``` text
Anda mengimplementasikan project weplan.

Baca seluruh File 01–08 sebelum membuat keputusan arsitektur.
Gunakan:
- File 06 sebagai implementation roadmap dan scope authority.
- File 07 sebagai database/domain implementation reference.
- File 01–05 sebagai canonical authority sesuai ownership matrix.
- File 08 sebagai execution procedure.

Jangan implementasikan seluruh MVP sekaligus.

Mulai dengan melakukan repository reconnaissance, kemudian kerjakan M0 dari File 06 saja.

Sebelum coding:
1. ringkas goal M0;
2. sebutkan canonical references;
3. identifikasi existing implementation;
4. buat work packages kecil;
5. sebutkan test/verification yang diperlukan.

Setelah itu implementasikan M0.
Jangan lanjut ke M1 sebelum M0 selesai, seluruh acceptance criteria relevan diverifikasi, dan saya menyetujui kelanjutannya.

Jangan membuat business rule baru. Jika specification ambigu atau konflik pada authority yang sama, berhenti dan tanyakan.
```

------------------------------------------------------------------------

# 24. Prompt Template --- Continue Milestone

``` text
Lanjutkan implementasi weplan ke [MILESTONE / WORK PACKAGE].

Gunakan File 06 untuk scope dan acceptance criteria.
Baca File 07 serta seluruh section File 01–05 yang direferensikan milestone tersebut.
Patuhi File 08.

Pertama audit state repository saat ini dan pastikan dependency milestone sebelumnya sudah terpenuhi.

Kerjakan hanya scope milestone/work package ini.
Jangan mengimplementasikan capability deferred hanya karena berdekatan dengan kode yang sedang disentuh.

Jalankan test dan verification relevan.
Berikan completion report sesuai File 08 §22.
Berhenti setelah work package selesai.
```

------------------------------------------------------------------------

# 25. Prompt Template --- Fix Bug

``` text
Investigasi bug berikut pada project weplan:

[BUG]

Jangan langsung patch gejala.

1. Tentukan canonical expected behavior dari File 01–07.
2. Reproduce bug.
3. Klasifikasikan root cause.
4. Periksa apakah bug menunjukkan invariant/test yang hilang.
5. Implementasikan smallest correct fix.
6. Tambahkan regression test.
7. Jalankan affected integration/E2E tests.
8. Laporkan apakah specification perlu diperbarui.

Jangan melemahkan validation, authorization, RLS, CSP, idempotency, atau concurrency guard untuk membuat bug hilang.
```

------------------------------------------------------------------------

# 26. Prompt Template --- Database Work

``` text
Kerjakan database work package berikut:

[WORK PACKAGE]

Gunakan File 01 sebagai canonical domain/schema authority dan File 07 sebagai implementation reference.

Wajib:
- forward migration;
- RLS + GRANT review;
- FK/index review;
- Zod/domain contract update;
- anon/owner-A/owner-B/privileged test;
- concurrency/idempotency test jika relevan;
- recovery note.

Jangan melakukan manual production-only schema edit.
Jangan expose credential/internal table ke browser.
Berikan migration + test evidence pada completion report.
```

------------------------------------------------------------------------

# 27. Prompt Template --- Security Audit

``` text
Audit implementation milestone [MILESTONE] terhadap File 02.

Untuk setiap SEC requirement yang relevan:
- status PASS / FAIL / NOT APPLICABLE;
- implementation location;
- automated test evidence;
- manual evidence bila diperlukan;
- remediation jika FAIL.

Cross-check P0/P1 failure mode terkait di File 04.

Jangan menandai PASS hanya berdasarkan code inspection jika requirement membutuhkan runtime/integration verification.
```

------------------------------------------------------------------------

# 28. Prompt Template --- Autonomous Mode

Autonomous mode boleh digunakan hanya jika user memang menginginkannya.

``` text
Kerjakan [MILESTONE] secara autonomous per work package.

Anda boleh berpindah ke work package berikutnya dalam milestone yang sama hanya jika:
- acceptance criteria work package sebelumnya terpenuhi;
- seluruh test relevan pass;
- tidak ada spec ambiguity;
- tidak ada migration/security/payment decision baru yang membutuhkan persetujuan.

Berhenti segera jika:
- menemukan spec conflict;
- membutuhkan business rule baru;
- membutuhkan paid dependency;
- migration berisiko destructive tanpa recovery yang jelas;
- security invariant tidak dapat dipenuhi;
- test critical gagal dan root cause belum dipahami.

Jangan otomatis berpindah ke milestone berikutnya.
```

------------------------------------------------------------------------

## 29. Recommended Human Review Checkpoints

Human review sangat disarankan setelah:

``` text
M0 → runtime/tooling baseline
M1 → schema/RLS/auth
M2 → editor concurrency
M3 → renderer/theme quality
M4 → payment/entitlement
M5 → public/privacy/guest
M6 → media security
M7 → async reliability
M8 → launch decision
```

Review M1, M4, M5, dan M8 tidak sebaiknya dilewati karena masing-masing
menyentuh data isolation, uang, privacy, dan production risk.

------------------------------------------------------------------------

## 30. Final Launch Instruction

AI agent tidak mempunyai authority untuk menyatakan production launch
aman hanya karena build/test lokal pass.

Launch decision membutuhkan evidence File 06 Launch Gate, termasuk: -
production-like runtime verification; - security evidence; - payment
verification; - RLS/IDOR test; - private data leak test; -
backup/restore evidence; - observability; - unresolved P0 = 0.

Agent boleh menghasilkan **launch readiness report**. Keputusan deploy
production tetap merupakan keputusan operator/user.
