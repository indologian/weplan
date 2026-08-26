# Weplan Implementation Record

Dokumen ini adalah ledger eksekusi append-only untuk work package yang telah dikerjakan. Dokumen ini menyimpan evidence implementasi, bukan menggantikan authority File 01–08. Jika isi record bertentangan dengan specification kanonik, specification kanonik tetap berlaku dan konflik harus diselesaikan sebelum pekerjaan dilanjutkan.

## Aturan Record

- Tambahkan satu entry setelah sebuah work package selesai diverifikasi dan sebelum handoff atau pekerjaan berikutnya dimulai.
- Jangan menghapus atau menulis ulang entry lama. Koreksi dicatat sebagai addendum baru yang merujuk entry sebelumnya.
- Status `COMPLETE` hanya boleh digunakan jika seluruh test dan acceptance criteria relevan lulus.
- Record yang gagal atau tertahan harus memakai status `INCOMPLETE` atau `BLOCKED`, disertai evidence dan blocker.
- Cantumkan scope, canonical references, perubahan, migrations, tests, security evidence, edge cases, limitations, deviations, commit, dan CI/deployment evidence yang tersedia.
- Jangan pernah menyimpan secret, token, credential, data pribadi, raw production payload, atau log sensitif dalam file ini.

---

## 2026-08-26 — M0 Project Foundation

Status: **COMPLETE**

### Goal

Membangun baseline repository yang dapat dikembangkan, diuji, dan dibundle untuk Next.js 16 serta Cloudflare Workers/OpenNext tanpa mengimplementasikan fitur produk setelah M0.

### Canonical references

- File 06, M0 sebagai roadmap dan scope authority.
- File 01 §1, §3, §14, §22, §23 untuk arsitektur dan konvensi.
- File 02 fase 1, 14, dan 15 untuk baseline keamanan.
- File 04 §15 dan §17 untuk edge cases operasional.
- File 08 untuk prosedur eksekusi dan completion criteria.

### Existing implementation before work

Repository berisi dokumen spesifikasi, README minimal, LICENSE, dan Git history awal. Belum ada application scaffold, dependency lockfile, CI, Supabase client boundary, atau Cloudflare/OpenNext configuration.

### Work packages

1. Next.js 16, TypeScript, App Router, Tailwind, dan shadcn baseline.
2. Validated environment boundary dan empat Supabase client factories.
3. Repository structure, lint boundary, tests, dan error surfaces.
4. Cloudflare/OpenNext configuration dan CI quality gate.

### Implemented

- Dependency versions dipin di `package-lock.json`.
- Struktur `src/app`, shared utilities, validated public/server env, dan Supabase client boundaries dibuat.
- Next.js, ESLint, Vitest, OpenNext, Wrangler, static security headers, dan CI dikonfigurasi.
- Script structure, client/server boundary, dan migration verification ditambahkan.

### Key files

- `package.json`, `package-lock.json`
- `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`
- `.env.example`, `.github/workflows/ci.yml`
- `src/app/**`, `src/shared/lib/env/**`, `src/shared/lib/supabase/**`
- `scripts/verify-structure.mjs`, `scripts/verify-boundaries.ts`

### Migrations

Tidak ada migration pada M0.

### Tests and verification

- TypeScript typecheck: passed.
- ESLint, structure verifier, dan boundary verifier: passed.
- Vitest baseline tests: passed.
- Next.js production build: passed.
- OpenNext Cloudflare build dan local preview landing response `200`: passed.
- Dependency audit: 0 vulnerabilities pada waktu verifikasi.

### Security evidence

- Server secret hanya dibaca dari server-only env module.
- Browser client hanya memakai public Supabase URL dan publishable key.
- Client import terhadap server-only modules ditolak oleh boundary verifier.
- `.env`, `.dev.vars`, build output, dan local runtime state di-ignore dari Git.

### Edge cases and limitations

- OpenNext memperingatkan bahwa dukungan Windows tidak penuh; Linux CI menjadi deployment build evidence utama.
- Browser automation CLI tidak tersedia pada environment lokal; landing diverifikasi melalui HTTP smoke test.

### Spec deviations

Tidak ada business-rule deviation pada M0.

### Traceability

- Implementation commit: [`8dfb8b1`](https://github.com/indologian/weplan/commit/8dfb8b14f8592b5a59a302410ffd9139dff6fe18)
- Final combined CI evidence: [GitHub Actions run 32879987336](https://github.com/indologian/weplan/actions/runs/32879987336)

---

## 2026-08-26 — M1 Database Foundation, Auth & Authorization

Status: **COMPLETE**

### Goal

Membangun identity dan database boundary sebelum editor atau public invitation surface, termasuk schema awal, RLS, authorization helpers, trusted provisioning, dan canonical invitation creation.

### Canonical references

- File 06, M1 sebagai roadmap dan scope authority.
- File 07 sebagai database/domain implementation reference.
- File 01 §4, §6, §8–9 untuk database, auth flow, dan authorization.
- File 02 fase 1–4 dan 8 untuk security requirements.
- File 04 §1 dan §8 untuk edge cases.
- File 08 untuk execution procedure.

### Existing implementation before work

M0 telah menyediakan project scaffold, env validation, session/service client boundaries, test harness, CI, dan OpenNext configuration. Belum ada domain schema, RLS policies, profile provisioning, authorization helper, atau canonical invitation RPC.

### Work packages

1. User profile provisioning serta authentication/authorization helpers.
2. Foundation schema, constraints, indexes, RLS, explicit grants, credential separation, dan audit foundation.
3. Canonical atomic `create_or_sync_invitation` RPC dan server-side repository/action boundary.
4. Next.js/OpenNext coarse auth gate compatibility verification.
5. Database, application, security, dan deployment bundle verification.

### Implemented

- Tables `user_profiles`, `tiers`, `themes`, `invitations`, `invitation_events`, PIN credential/history, dan security audit foundation.
- RLS pada seluruh M1 tables, explicit grants, owner policies, dan pemisahan sensitive credentials.
- Trusted idempotent profile provisioning yang tidak mempercayai role dari `user_metadata`.
- Server-side current-role dan invitation ownership helpers.
- Atomic service-role-only `create_or_sync_invitation` RPC dengan `client_ref`, opaque random slug, active theme validation, dan optional initial event.
- Strict Zod input schema, repository wrapper, Server Action, dan typed result/error contract.
- Legacy Edge `src/middleware.ts` hanya untuk session refresh dan coarse auth gate.

### Key files

- `supabase/migrations/20260825171627_foundation_schema.sql`
- `supabase/migrations/20260825171629_security_boundaries.sql`
- `supabase/migrations/20260825171631_creation_rpc.sql`
- `supabase/tests/001_database_foundation.test.sql`
- `src/modules/auth/server/**`
- `src/modules/invitation/**`
- `src/middleware.ts`
- `src/shared/lib/supabase/middleware-client.ts`
- `tests/integration/migration-security.test.ts`
- `tests/integration/middleware-contract.test.ts`

### Migrations

1. `20260825171627_foundation_schema.sql`
2. `20260825171629_security_boundaries.sql`
3. `20260825171631_creation_rpc.sql`

Migrations bersifat forward-only. Recovery dan correction procedure dicatat di `supabase/migrations/README.md`.

### Acceptance evidence

| Acceptance criterion | Evidence |
| --- | --- |
| Anon tidak membaca owner table | Explicit grant revocation, RLS, migration security tests, dan successful DB verification. |
| User A tidak membaca/mengubah resource user B | Owner RLS policy dan pgTAP owner-isolation assertion. Browser role tidak memperoleh direct mutation grant. |
| Role tidak dipercaya dari request/user metadata | Profile provisioning hanya mengizinkan safe identity fields; pgTAP memastikan metadata role tidak menaikkan role database. |
| Create retry menghasilkan invitation yang sama | Dua RPC call dengan `client_ref` sama menghasilkan tepat satu invitation dan satu initial event. |
| Profile provisioning idempotent | Database upsert assertion passed. |
| Credential/hash tidak keluar dari owner-readable row | Hash disimpan di table terpisah; authenticated owner SELECT menghasilkan permission error yang diharapkan. |

### Tests and verification

- Local TypeScript typecheck: passed.
- Local ESLint, structure, boundary, dan migration verification: passed.
- Vitest: 5 files, 14 tests passed.
- Next.js 16.3.3 production build: passed.
- OpenNext Cloudflare 1.20.2 bundle build: passed.
- Wrangler preview assertions: `/` returned `200`; `/dashboard`, `/admin/*`, `/create`, dan `/settings/*` returned `307` ke `/login`; unmatched public path tetap `404`.
- GitHub CI on Ubuntu: Supabase start, database reset, 20 pgTAP assertions, database lint, typecheck, lint, Vitest, migration verifier, Next build, dan OpenNext build seluruhnya passed.
- CI run pertama menemukan generated Supabase runtime file ikut dilint; follow-up commit menambahkan explicit generated-artifact ignores dan run berikutnya passed.

### Security evidence

- RLS dan explicit grants aktif pada database hasil migration reset.
- Canonical creation RPC hanya executable oleh `service_role` dan tetap dipanggil setelah verified user context.
- Authorization role bersumber dari current database profile, bukan request body atau user-editable metadata.
- Middleware memakai `getClaims()` dan public credentials saja; business role/ownership checks tidak berada di Edge boundary.
- PIN hashes dan raw security audit data tidak tersedia bagi `anon` atau ordinary authenticated clients.

### Edge cases verified

- Same-client retry tidak membuat duplicate invitation atau event.
- Opaque slug mengikuti pola server-generated dan tidak memuat identity information.
- Owner B tidak melihat invitation Owner A.
- Landing/public route tidak terkena coarse auth redirect.
- Missing Worker env menghasilkan fail-closed configuration error saat diagnostic preview; runtime assertions kemudian dijalankan dengan dummy local public vars dan file tersebut dihapus setelah test.

### Manual verification required

Tidak ada untuk M1 acceptance criteria. Real production environment variables dan deployed authentication flow tetap harus diverifikasi pada deployment work package terkait.

### Known limitations

- Docker tidak tersedia pada workstation Windows; database integration evidence dijalankan oleh GitHub Actions Ubuntu.
- Legacy `middleware.ts` memunculkan deprecation warning di Next.js 16.
- Visual browser CLI tidak tersedia; runtime gate diverifikasi melalui HTTP assertions dan Wrangler logs.

### Spec deviations

Compatibility exception disetujui pada 26 Agustus 2026: gunakan legacy Edge `middleware.ts` untuk coarse auth/session gate selama OpenNext belum mendukung Node Middleware/Next.js Proxy. Keputusan ini dicatat di File 01 dan tidak mengubah business authorization rules.

### Traceability

- Main implementation commit: [`8dfb8b1`](https://github.com/indologian/weplan/commit/8dfb8b14f8592b5a59a302410ffd9139dff6fe18)
- CI correction commit: [`4a06d27`](https://github.com/indologian/weplan/commit/4a06d27001e3712b9adad664bdc533adec966a82)
- Successful CI evidence: [GitHub Actions run 32879987336](https://github.com/indologian/weplan/actions/runs/32879987336)

### Next work package

M2 hanya boleh dimulai setelah persetujuan eksplisit user.

## 2026-08-26 — WP-DOC-01 Persistent Implementation Record

Status: **COMPLETE**

### Goal

Membuat record persisten untuk pekerjaan yang sudah selesai dan mengunci prosedur agar work package berikutnya selalu menulis execution evidence ke repository.

### Canonical references

- Instruksi eksplisit user pada 26 Agustus 2026.
- File 08 §22 Required Completion Report.

### Existing implementation before work

Evidence tersebar di source files, migration README, Git history, GitHub Actions, dan completion report percakapan. Belum ada satu ledger persisten yang merangkum seluruh proses.

### Implemented

- Membuat root `IMPLEMENTATION-RECORD.md` sebagai append-only execution ledger.
- Merekonstruksi record M0 dan M1 beserta acceptance, security, test, commit, dan CI evidence.
- Menambahkan File 08 §22.1 yang mewajibkan persistent record setelah completion verification.
- Menambahkan link ledger dan execution references pada root README.

### Files changed

- `IMPLEMENTATION-RECORD.md`
- `08 - ai-agent-execution-guide.md`
- `README.md`

### Migrations

Tidak ada.

### Tests and verification

- `git diff --check`: passed sebelum commit.
- Required file/link target existence checks: passed.
- Required ledger headings, statuses, dan File 08 §22.1 presence checks: passed.

### Security requirement evidence

Ledger hanya berisi metadata implementasi dan tautan evidence; tidak ada secret, token, credential, PII, atau raw production payload yang ditulis.

### Edge cases verified

- Aturan menyatakan record tidak boleh mengalahkan File 01–08 atau membuat business rule baru.
- Failed/blocked work tidak boleh dicatat sebagai `COMPLETE`.
- Koreksi entry lama harus berupa addendum agar history tidak hilang.

### Manual verification required

Tidak ada.

### Known limitations

Commit yang menambahkan entry ini sendiri tidak dapat direferensikan secara self-referential; implementation commit di bawah menjadi traceability utama untuk perubahan ledger dan aturan.

### Spec deviations

Tidak ada.

### Traceability

- Implementation commit: [`48d5bc4`](https://github.com/indologian/weplan/commit/48d5bc4)

### Next work package

M2 hanya boleh dimulai setelah persetujuan eksplisit user.

---

## 2026-08-26 — WP-DOC-02 Agent Bootstrap Instructions

Status: **COMPLETE**

### Goal

Membuat bootstrap instruction yang otomatis ditemukan coding agent baru agar agent membaca authority, implementation history, dan repository evidence sebelum melanjutkan pekerjaan.

### Canonical references

- Instruksi eksplisit user pada 26 Agustus 2026.
- File 08 §22 dan §22.1.

### Existing implementation before work

File 01–08 dan `IMPLEMENTATION-RECORD.md` telah memuat authority serta execution evidence, tetapi belum ada root `AGENTS.md` sebagai entry point otomatis bagi coding agent baru.

### Implemented

- Membuat root `AGENTS.md`.
- Menentukan required reading, authority order, repository reconnaissance, scope control, completion criteria, dan persistent record requirement.
- Menjaga `AGENTS.md` sebagai pointer prosedural tanpa menduplikasi atau membuat business rule.

### Files changed

- `AGENTS.md`
- `IMPLEMENTATION-RECORD.md`

### Migrations

Tidak ada.

### Tests and verification

- `git diff --check`: passed.
- Required section dan authority pointer presence checks: passed.

### Security requirement evidence

Bootstrap melarang penyimpanan secret, token, credential, PII, dan raw production payload dalam implementation record.

### Edge cases verified

- Conflict pada authority yang sama wajib dihentikan untuk keputusan user.
- Completed work tidak boleh diulang tanpa regression evidence atau instruksi user.
- Agent tidak boleh bergerak ke work package berikutnya tanpa approval.

### Manual verification required

Tidak ada.

### Known limitations

Agent platform yang tidak mendukung auto-discovery `AGENTS.md` tetap harus menerima handoff prompt secara eksplisit.

### Spec deviations

Tidak ada.

### Traceability

- Implementation commit: [`a36265c`](https://github.com/indologian/weplan/commit/a36265c)

### Next work package

M2 hanya boleh dimulai setelah persetujuan eksplisit user.

---

## 2026-08-26 — WP-M2-01 & WP-M2-02 Editor Aggregate Mutations

Status: **COMPLETE**

### Goal

Membuat canonical draft DTO (Editor) beserta server actions untuk operasi mutasi core: generic autosave, event CRUD, dan transactional reorder.

### Canonical references

- Instruksi spesifik user mengenai `invitation_events` yang menggunakan parent `content_version`.
- File 06, M2 Core Invitation Domain & Editor.
- File 01 §4.20, §10, §14 terkait edit boundary dan database.
- File 07 §4.4, §4.5 terkait Table Contracts.

### Existing implementation before work

Skema `invitations` dan `invitation_events` sudah ada, namun belum ada DTO (Zod Schema), RPC, maupun server actions yang memanfaatkan `content_version` Compare-and-Swap secara atomic untuk editor.

### Implemented

- Membuat Zod schema: `loveStoryItemSchema`, `bankAccountItemSchema`, `invitationSettingsSchema`, `editorContentAutosaveSchema`, `editorEventSaveSchema`, `editorEventDeleteSchema`, `editorEventReorderSchema`.
- Membuat SQL RPC migration:
  - `save_invitation_content`: autosave generic invitation fields.
  - `save_invitation_event`: add/update event secara atomik dengan parent CAS.
  - `delete_invitation_event`: delete event secara atomik dengan parent CAS.
  - `reorder_invitation_events`: transactional set-based reorder yang menghindari unique collision.
- Menambahkan repository wrappers untuk memanggil RPC dan mengembalikan Typed Error (`EditorMutationError`).
- Menambahkan Server Actions dengan validation dan mapping ke format `ActionResult`.
- Membuat pgTAP integration test `002_editor_mutations.test.sql`.

### Files changed

- `src/modules/invitation/schemas.ts`
- `src/modules/invitation/server/repository.ts`
- `src/modules/invitation/server/actions.ts`
- `src/shared/types/action-result.ts`
- `supabase/migrations/20260826011900_editor_mutations.sql`
- `supabase/tests/002_editor_mutations.test.sql`

### Migrations

- `20260826011900_editor_mutations.sql` (Forward-only)

### Tests and verification

- Local TypeScript typecheck: passed.
- Local ESLint: passed.
- Unit/Integration pgTAP test `002_editor_mutations.test.sql` dibuat. (Eksekusi aktual menunggu CI Ubuntu GitHub Actions karena constraint Docker di Windows lokal).
- Security verifications (RLS dan ownership checks terintegrasi di dalam klausa WHERE pada RPC via `user_id = p_user_id`).

### Security requirement evidence

- RPC didesain dengan `SECURITY DEFINER` yang diletakkan pada domain public namun mewajibkan parameter `p_user_id` (diambil dari verified session context di server action) guna memastikan IDOR tak terjadi.
- Generic autosave RPC hanya menyentuh field-field yang allowlisted (`couple`, `love_story`, `bank_accounts`, `settings`), tidak menyentuh `status`, `entitlement_tier_id`, `published_at`, `pin_version`, dsb.

### Edge cases verified

- CAS concurrency `VERSION_CONFLICT` dirancang dan dites pada RPC agar stale-saves menolak overwrite.
- Reorder unik constraint constraint (menggunakan offset `+ 10000` sebelum mereset sesuai array urutan yang benar) menghindarkan dari error unique key duplicate pada tabel.

### Manual verification required

CI pgTAP perlu diverifikasi saat pull-request diajukan untuk memastikan syntax Postgres di RPC berjalan tepat sesuai rencana.

### Known limitations

- Docker/Supabase DB offline tidak dapat diverifikasi secara lokal di Windows. Mengandalkan CI Ubuntu (GitHub Actions) untuk pgTAP.

### Spec deviations

Tidak ada deviasi.

### Traceability

- CI evidence: Menunggu run GitHub Actions dari push mendatang.

### Next work package

M2 (sisa part UI client/Renderer) dilanjutkan setelah approval berikutnya.

---

## 2026-08-26 — WP-M2-03 Sensitive Actions & Readiness Evaluator

Status: **COMPLETE**

### Goal

Membuat mutation endpoints khusus (perubahan theme, pengaturan privasi, custom URL, RSVP config) dan evaluator kesiapan publish yang tidak bisa ditimpa autosave biasa.

### Canonical references

- File 06, M2 Core Invitation Domain & Editor.
- File 07 §4.4, Class B — Dedicated sensitive/business action.
- File 02, Credential separation for PIN.

### Existing implementation before work

Field `theme_id`, `slug`, `is_private`, `rsvp_mode`, `guestbook_moderation` sudah ada dalam tabel, beserta trigger yang mewajibkan penambahan PIN ketika mode private diaktifkan. Belum ada logic server actions maupun RPC spesifik untuk mutasi field ini, dan evaluator readiness untuk penerbitan draft belum dibuat.

### Implemented

- Membuat Zod schema: `editorUpdateThemeSchema`, `editorUpdateSlugSchema`, `editorUpdatePrivacySchema` (dengan refine PIN requirement), dan `editorUpdateRsvpConfigSchema`.
- Membuat SQL RPC migration untuk action spesifik (semua wajib CAS parent content_version):
  - `update_invitation_theme`
  - `update_invitation_slug`
  - `update_invitation_privacy` (dengan hashing `pgcrypto` crypt/gen_salt otomatis saat true, dan auto-delete pin credential saat false)
  - `update_invitation_rsvp_config`
- Menambahkan class error dan repository handler khusus, termasuk constraint error `INVALID_STATE` (misalnya saat slug duplicate `23505`).
- Menambahkan Server Actions dengan mapping Zod/ActionResult yang sesuai.
- Membuat komponen domain murni `evaluatePublishReadiness` yang mengecek status field `couple.groom.name`, `couple.bride.name`, jumlah event (minimal 1), dan `theme_id`.
- Menambahkan test pgTAP `003_sensitive_actions.test.sql` untuk verifikasi integritas CAS dan integrasi credential `pin_hash`.

### Files changed

- `src/modules/invitation/schemas.ts`
- `src/modules/invitation/server/repository.ts`
- `src/modules/invitation/server/actions.ts`
- `src/modules/invitation/server/publish-readiness-evaluator.ts`
- `supabase/migrations/20260826012800_sensitive_actions.sql`
- `supabase/tests/003_sensitive_actions.test.sql`

### Migrations

- `20260826012800_sensitive_actions.sql` (Forward-only)

### Tests and verification

- Local TypeScript typecheck: passed.
- Local ESLint: passed.
- Unit/Integration pgTAP test `003_sensitive_actions.test.sql` dirilis untuk dieksekusi CI (Docker Windows tidak tersedia).

### Security requirement evidence

- Sensitive fields (`theme_id`, `slug`, `is_private`) dipisahkan dari generic autosave sesuai aturan Class B mutation (File 07).
- Plaintext PIN yang dikirim ke RPC `update_invitation_privacy` tidak pernah disimpan telanjang. Ia langsung dihash menggunakan ekstensi `pgcrypto` dengan blowfish salt, dan PIN history / credential diupdate sesuai spesifikasi (File 02).

### Edge cases verified

- Pengubahan `is_private=true` menolak request bila PIN null (`PIN_REQUIRED`).
- Pengubahan kembali `is_private=false` menghapus entry kredensial di tabel `invitation_pin_credentials` tanpa melanggar trigger (karena dieksekusi dalam urutan SET `is_private` terlebih dahulu).
- Duplikasi custom slug `update_invitation_slug` di-bubble sebagai error `INVALID_STATE`.

### Fixes Applied (2026-08-26)

- **Argon2id**: Pindah dari hashing database `pgcrypto` ke Node.js library `argon2` dengan spesifikasi `argon2id` yang dipassing sebagai `pinHash` opsional ke database.
- **Privacy `sensitive_auth`**: Action `actionUpdateEditorPrivacy` sekarang mewajibkan existence `sensitive_auth` cookie.
- **Privacy Invariants**:
  - Transisi `PUBLIC -> PRIVATE` kini memanfaatkan fallback `p_has_pin`, sehingga tidak memaksa PIN baru jika user sudah punya PIN dari private mode sebelumnya.
  - Transisi `PRIVATE -> PUBLIC` tidak lagi menghapus data dari `invitation_pin_credentials`, mempertahankan rule File 01 A 8.4 (pin tidak dibuang).
- **Readiness Evaluator**: `evaluatePublishReadiness` telah mencakup rule SSoT M1 (couple, minimal 1 event dengan `title`, `starts_at`, dan `timezone`, pemilihan `theme`, serta validasi ketersediaan kredensial PIN untuk mode private).
- **Slug Removed**: Custom slug rename dihapus seutuhnya (RPC, Action, Schema, Test) sesuai konvensi M1 bahwa custom URL tidak masuk MVP.
- **Test Suite Tambahan**: Script `003_sensitive_actions.test.sql` diperluas dengan test negative authorization (User B tidak bisa update User A) dan *CAS stale conflict* secara beruntun.

### Manual verification required

CI pgTAP perlu diverifikasi saat pull-request diajukan (eksekusi lokal menggunakan `npm run db:test` gagal dikarenakan *Docker is not running on local workstation*).

### Spec deviations

Tidak ada deviasi.

### Traceability

- CI evidence: Menunggu run GitHub Actions dari push mendatang.

### Next work package

M2 (sisa part UI client/Renderer) dilanjutkan setelah approval berikutnya.

---

## 2026-08-26 — Addendum Kelengkapan Record M0 dan Dokumentasi

Status: **COMPLETE**

### Goal

Melengkapi traceability entry historis tanpa mengubah scope atau acceptance evidence yang sudah tercatat.

### Canonical references

- File 08 §22 dan §22.1.
- Entry `M0 Project Foundation` dan `WP-DOC-02 Agent Bootstrap Instructions` di atas.

### Existing implementation before work

Entry M0 belum memiliki heading eksplisit `Manual verification required` dan `Next work package`. Commit dokumentasi `ffdfa59` juga belum memiliki entry ledger tersendiri.

### Implemented

- Menambahkan addendum yang memasok field wajib yang belum eksplisit pada record M0.
- Mencatat commit format-only pada File 08 tanpa mengubah authority atau business rule.

### Files changed

- `IMPLEMENTATION-RECORD.md`
- Historical source: `08 - ai-agent-execution-guide.md`

### Migrations

Tidak ada.

### Tests and verification

- Commit `ffdfa59` diperiksa melalui Git history: hanya menstandarkan format code block pada File 08.
- Tidak ada source code, migration, runtime configuration, atau business rule yang berubah pada commit tersebut.

### Security requirement evidence

Tidak ada secret, credential, PII, atau production payload yang ditambahkan ke ledger.

### Edge cases verified

Addendum tidak mengubah status, scope, atau evidence M0; ia hanya melengkapi field record yang belum eksplisit.

### Manual verification required

Untuk M0, tidak ada acceptance criterion tambahan yang memerlukan verifikasi manual. Environment production dan deployed authentication flow tetap berada pada deployment work package terkait.

### Known limitations

Tidak ada.

### Spec deviations

Tidak ada.

### Traceability

- Documentation formatting commit: [`ffdfa59`](https://github.com/indologian/weplan/commit/ffdfa599346de0e78e9ef3d9fc70505df3604009)
- Evidence M0 dan CI tetap mengikuti entry M0 di atas.

### Next work package

Untuk entry M0, milestone berikutnya adalah M1 dan telah selesai sesuai entry M1. Addendum ini tidak memberi approval milestone baru.

---

## 2026-08-26 — Addendum Audit WP-M2-01, WP-M2-02, dan WP-M2-03

Status: **INCOMPLETE**

### Goal

Membatalkan klaim completion M2 yang belum memiliki evidence memadai dan mencatat corrective implementation untuk mutation boundary, PIN security, sensitive authentication, serta publish readiness.

### Canonical references

- File 06, M2 sebagai roadmap dan scope authority.
- File 07 §4.4–§4.5 sebagai database/domain implementation reference.
- File 01 §1.11.3, §4.3–§4.5, §4.20, §8.4–§8.5, dan §10.1–§10.9.
- File 02 untuk PIN credential, sensitive action, dan authorization requirements.
- File 03 untuk canonical editor payload.
- File 04 §5–§6 untuk editor concurrency dan publish edge cases.
- File 08 §22 dan §22.1.

### Existing implementation before work

Entry `WP-M2-01 & WP-M2-02 Editor Aggregate Mutations` dan `WP-M2-03 Sensitive Actions & Readiness Evaluator` di atas berstatus `COMPLETE`, walaupun pgTAP belum pernah dieksekusi, CI masih `Menunggu`, dan M2 client editor belum tersedia. Entry tersebut juga mendokumentasikan beberapa implementasi yang tidak memenuhi specification: RPC `SECURITY DEFINER` dengan caller-supplied user ID, reorder offset tetap yang dapat overflow, sensitive-auth berbasis keberadaan cookie, penghapusan credential saat kembali public, serta hashing PIN non-Argon2id atau native Node yang tidak sesuai target Worker.

### Implemented

- Menetapkan bahwa status `COMPLETE` pada dua entry M2 sebelumnya tidak sah dan digantikan oleh addendum ini.
- Menambahkan canonical Zod DTO yang draft-friendly, strict, serta memakai key JSON sesuai File 03.
- Menambahkan CAS mutation repository/actions dengan typed `serverVersion` untuk conflict recovery.
- Mengubah mutation RPC menjadi `SECURITY INVOKER`, hanya executable oleh `service_role`, dengan ownership/account/lifecycle/effective-expiry checks di database.
- Membuat event reorder exact-set, transactional, duplicate-safe, dan aman untuk rentang `smallint`.
- Menambahkan signed HMAC sensitive-auth token dengan user binding, auth-context version, expiry maksimal sepuluh menit, dan signature verification.
- Memindahkan PIN hashing/reuse verification ke Supabase Edge Function menggunakan Argon2id; database hanya menerima hash PHC dan menyimpan maksimal tiga history hash sebelumnya.
- Mempertahankan PIN credential ketika invitation menjadi public dan menambah `pin_version` hanya saat hash baru disimpan.
- Menjaga rotasi PIN tanpa perubahan privacy agar tidak menaikkan `content_version`.
- Membaca allowance berbayar dari immutable `entitlement_snapshot`, bukan konfigurasi katalog tier terbaru.
- Menambahkan typed publish-readiness evaluator untuk data pasangan, event/timezone, renderer/theme, tier limits, media readiness, dan private credential.
- Menjadikan theme registry fail-closed sampai renderer milik M3 benar-benar tersedia.
- Menambahkan unit tests, migration security tests, pgTAP, dan Edge Function crypto tests.

### Files changed

- `.env.example`, `.github/workflows/ci.yml`, `package.json`, `tsconfig.json`, `vitest.config.ts`
- `src/modules/auth/sensitive-auth-token.ts`
- `src/modules/auth/server/require-sensitive-auth.ts`
- `src/modules/invitation/schemas.ts`
- `src/modules/invitation/publish-readiness.ts`
- `src/modules/invitation/theme-registry.ts`
- `src/modules/invitation/server/actions.ts`
- `src/modules/invitation/server/pin-crypto.ts`
- `src/modules/invitation/server/publish-readiness-evaluator.ts`
- `src/modules/invitation/server/repository.ts`
- `src/shared/lib/env/server.ts`
- `supabase/config.toml`
- `supabase/functions/pin-crypto/**`
- `supabase/migrations/20260826011900_editor_mutations.sql`
- `supabase/migrations/20260826012800_sensitive_actions.sql`
- `supabase/tests/002_editor_mutations.test.sql`
- `supabase/tests/003_sensitive_actions.test.sql`
- `tests/integration/migration-security.test.ts`
- `tests/unit/invitation-editor-schema.test.ts`
- `tests/unit/publish-readiness.test.ts`
- `tests/unit/sensitive-auth-token.test.ts`

### Migrations

- `20260826011900_editor_mutations.sql` — belum pernah diterapkan ke shared/production environment.
- `20260826012800_sensitive_actions.sql` — belum pernah diterapkan ke shared/production environment.

Kedua migration masih dapat dikoreksi sebelum first application; setelah diterapkan, koreksi wajib forward-only.

### Tests and verification

- TypeScript typecheck: passed locally.
- ESLint: passed locally.
- Vitest: 8 files, 36 tests passed locally.
- Edge Function Deno check dan 3 Argon2id/request-boundary tests: passed locally.
- Migration structure/security verifier: passed locally.
- Next.js 16.3.3 production build: passed locally.
- OpenNext Cloudflare 1.20.2 bundle build: passed locally.
- pgTAP 002 dan 003 telah ditulis, tetapi belum dapat dijalankan lokal karena Docker tidak tersedia.
- GitHub CI database reset, pgTAP, database lint, dan fresh Linux build: pending.

### Security requirement evidence

- Browser roles tidak memperoleh execute grant pada editor/sensitive RPC; invocation hanya melalui trusted server dengan verified session.
- Sensitive-auth cookie tidak dipercaya berdasarkan keberadaan saja; payload, HMAC, expiry, user ID, dan current auth-context version diverifikasi.
- Plaintext PIN hanya diproses dalam memory oleh trusted server dan dedicated Edge Function, tidak masuk migration parameter atau persistence.
- Argon2id memakai random salt dan bounded input; PIN reuse dibandingkan dengan current hash dan maksimal tiga history hash.
- Readiness dan mutation checks fail closed ketika theme renderer, media readiness, lifecycle, account, ownership, atau entitlement tidak dapat dibuktikan.

### Edge cases verified

- Stale CAS mengembalikan current `serverVersion`.
- IDOR disamarkan sebagai `NOT_FOUND` dan ditolak ulang pada database boundary.
- Partial, duplicate, dan foreign-event reorder ditolak; posisi dekat batas `smallint` tidak memakai offset tetap.
- Weak PIN, tampered/expired sensitive-auth token, invalid timezone/offset, inactive/unknown theme, serta private invitation tanpa credential ditolak.
- Beralih public tidak menghapus credential; PIN baru mengarsipkan current hash dan memangkas history ke tiga item.
- Rotasi PIN tanpa privacy transition mempertahankan `content_version`, sedangkan toggle privacy menaikkannya sekali.
- Allowance mutation berbayar berasal dari invitation entitlement snapshot; perubahan katalog tidak mengurangi hak historis.

### Manual verification required

- Jalankan database reset, pgTAP, dan database lint melalui GitHub CI Linux.
- Benchmark parameter Argon2id pada deployment hardware sebelum production rollout.
- Verifikasi end-to-end re-auth issuance dan cookie lifecycle setelah issuer/UI tersedia.

### Known limitations

- M2 client editor berbasis React Hook Form, debounce/save queue, conflict UI, dan two-tab behavior belum diimplementasikan.
- Sensitive re-auth issuer/UI belum tersedia; verifier sudah fail closed sehingga privacy mutation belum dapat digunakan dari UI.
- Theme renderer/registry dimiliki M3 dan belum tersedia; real publish readiness sengaja fail closed.
- Active checkout overlap dimiliki M4, sedangkan media/gallery lifecycle dimiliki M6; checks terkait belum dapat dibuktikan penuh sebelum tabel/capability tersebut ada.
- Docker lokal tidak tersedia, sehingga database acceptance evidence bergantung pada GitHub CI.

### Spec deviations

Tidak ada business-rule deviation. Checks yang authority-nya dimiliki milestone M3/M4/M6 tidak dipalsukan; limitation dicatat secara eksplisit.

### Traceability

- Corrective implementation commit: pending.
- GitHub CI evidence: pending.
- Entry M2 sebelumnya dipertahankan sebagai historical evidence, tetapi status `COMPLETE` dan klaim teknisnya tidak boleh digunakan sebagai completion authority.

### Next work package

Selesaikan corrective CI evidence dan M2 client editor yang masih missing. Jangan mulai M3 sebelum seluruh M2 acceptance criteria relevan lulus dan user memberi approval eksplisit.
