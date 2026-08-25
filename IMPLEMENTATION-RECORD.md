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
