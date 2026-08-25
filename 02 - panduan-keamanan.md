# Panduan Keamanan

> **Peran dokumen:** checklist implementasi dan verifikasi keamanan.
>
> **Business/runtime security authority:** `01 - arsitektur-dan-konvensi.md` untuk nilai kanonik, state machine, schema, lifecycle, payment, editor concurrency, dan struktur runtime. Dokumen ini adalah **SSoT checklist/hardening keamanan**, tetapi tidak menyalin angka/state/schema File 01.
>
> **Edge-case lanjutan:** lihat `04 - enterprise-security-and-edge-cases.md`.
>
> **Zero-cost security baseline:** kontrol keamanan inti tidak boleh bergantung pada paid add-on. Bila kuota provider tertekan, sistem harus fail-safe/alert; jangan fail-open atau mengaktifkan biaya otomatis.

> **Traceability contract:** setiap checklist mempunyai ID stabil `SEC-F<fase>-<nomor>`. ID tersebut harus dipakai oleh test plan/CI evidence/manual verification pada implementation roadmap. Bila wording requirement berubah tetapi maknanya sama, pertahankan ID; bila requirement baru ditambahkan, buat ID baru dan jangan mendaur ulang ID yang sudah pernah dipakai.
>
> Status `[ ]` di dokumen ini berarti **acceptance/security requirement**, bukan urutan pengerjaan. File 06 boleh mengelompokkan ID ke milestone, tetapi tidak boleh mengubah threshold/state/schema kanonik File 01.

---

## Fase 1: Fondasi Keamanan

- [ ] SEC-F01-01 Semua secret/elevated credential hanya berada pada server boundary; module yang relevan memakai `server-only`/boundary server yang sesuai.
- [ ] SEC-F01-02 Tidak ada secret Supabase, Midtrans server key, HMAC/session key, Redis credential, atau secret provider lain pada `NEXT_PUBLIC_*`, browser bundle, log, analytics, atau error response.
- [ ] SEC-F01-03 Seluruh mutation dan input eksternal divalidasi ulang server-side; client validation hanya UX.
- [ ] SEC-F01-04 Konten user dirender sebagai text node; raw HTML hanya boleh ada setelah kebutuhan eksplisit, sanitizer allowlist, CSP, dan security review.
- [ ] SEC-F01-05 Error publik tidak mengeluarkan stack trace, SQL detail, env, token, PIN, signed credential, atau provider secret.
- [ ] SEC-F01-06 Boundary HTTP, source tree, runtime Cloudflare/OpenNext, scheduler, dan module ownership mengikuti File 01; jangan membuat mutation surface paralel dengan validation berbeda.
- [ ] SEC-F01-07 RLS **dan** Postgres GRANT diaudit bersama; tabel credential/internal deny-by-default untuk `anon/authenticated`.
- [ ] SEC-F01-08 Credential hash dipisahkan dari row owner-readable; owner/client SELECT tidak pernah mengeluarkan PIN hash, guest token hash, atau edit-token hash.
- [ ] SEC-F01-09 Supabase Security Advisor/Performance Advisor dijalankan setelah migration; duplicate index dan unindexed foreign-key finding direview.
- [ ] SEC-F01-10 Security control yang memakai Redis/Turnstile/provider mengikuti policy kanonik File 01; provider state tidak menjadi business source of truth.

## Fase 2: Authentication, Sensitive Re-Auth & Role Authorization

- [ ] SEC-F02-01 Identity server berasal dari Supabase verified auth context, bukan user ID/role dari request body atau `user_metadata`.
- [ ] SEC-F02-02 `proxy.ts` hanya coarse session/route gate; authorization bisnis/role/resource selalu diverifikasi ulang pada server boundary.
- [ ] SEC-F02-03 Jangan memakai session cache/stale client state sebagai sumber authorization kritis; gunakan mekanisme Supabase server-side sesuai File 01.
- [ ] SEC-F02-04 Sensitive action membutuhkan re-auth provider-aware sesuai policy kanonik dan tetap melakukan ownership/resource/role check.
- [ ] SEC-F02-05 `auth_context_version` hanya dapat berubah lewat trusted server/RPC dan merevoke sensitive/privileged context sesuai File 01.
- [ ] SEC-F02-06 Role downgrade tidak boleh menyisakan privileged session efektif dari JWT/UI stale.

## Fase 3: Guest Identity, RSVP & Guestbook

> Authorization matrix, token semantics, attendance invariant, dan moderation state **mengikuti File 01 §8**. File ini hanya memverifikasi boundary keamanan.

- [ ] SEC-F03-01 Anonymous client tidak memiliki direct raw-table access ke `guests` atau credential table.
- [ ] SEC-F03-02 Public RSVP/guestbook hanya melalui RPC/server endpoint dengan explicit response whitelist.
- [ ] SEC-F03-03 Nama/`to=`/UUID internal bukan credential; personal/edit authority selalu berasal dari random token/cookie yang diverifikasi server-side.
- [ ] SEC-F03-04 Token lookup menyimpan hash/HMAC, mendukung revoke/regenerate, dan tidak membocorkan token/hash/phone/notes/internal metadata ke response publik.
- [ ] SEC-F03-05 Open RSVP tetap rate-limited dan tidak menganggap nomor WhatsApp sebagai edit credential.
- [ ] SEC-F03-06 Test matrix mencakup private, public personal-only, public open dengan token, dan public open tanpa token.

## Fase 4: PIN Credential & Private Session

> Panjang PIN, algoritme hash, history/no-reuse, `pin_version`, private-session lifetime/payload/key rotation, serta privacy-toggle semantics mengikuti File 01 §8.4.

- [ ] SEC-F04-01 PIN plaintext tidak pernah dipersist, dilog, dianalytics-kan, dimasukkan queue, localStorage/sessionStorage, atau dikembalikan ke owner.
- [ ] SEC-F04-02 PIN credential tidak berada pada row owner-readable dan tidak memiliki direct client grant.
- [ ] SEC-F04-03 Reset/rotation PIN memerlukan authorization + sensitive re-auth sesuai policy dan menghasilkan audit event yang aman.
- [ ] SEC-F04-04 Private-session verification selalu mengecek signature, expiry, target invitation, dan revocation version terbaru.
- [ ] SEC-F04-05 Session cookie memakai atribut keamanan yang ditetapkan File 01 dan tidak memuat PIN/guest PII.
- [ ] SEC-F04-06 Key rotation current/previous serta emergency revoke diuji end-to-end.

## Fase 5: Brute-Force, Turnstile & Distributed Rate Limit

> Threshold, risk window, distributed-attack detection, heightened mode, incident lifecycle, dan no-global-hard-lock mengikuti File 01 §8.1–§8.4. Jangan menduplikasi angka policy di dokumen ini.

- [ ] SEC-F05-01 Limiter security tidak memakai in-memory Map pada distributed edge/serverless.
- [ ] SEC-F05-02 Raw IP tidak dipersist; limiter/risk key memakai pseudonymization HMAC sesuai File 01.
- [ ] SEC-F05-03 Turnstile diverifikasi server-side dan tetap adaptif; traffic normal tidak selalu dichallenge.
- [ ] SEC-F05-04 Seluruh temporary block/incident state memiliki TTL/dedupe dan tidak dapat digunakan attacker untuk global DoS invitation.
- [ ] SEC-F05-05 Test suite membaca threshold kanonik dari configuration/policy yang sama dengan production, bukan angka copy-paste di test.

## Fase 6: Storage & Media Authorization

> Bucket, stable media endpoint, signed-URL lifetime, cache interaction, dan media state machine mengikuti File 01 §5/§16.

- [ ] SEC-F06-01 Tidak ada anonymous public Storage SELECT policy untuk invitation media.
- [ ] SEC-F06-02 Storage path/object ID bukan authorization; setiap serving request mengecek invitation/public/private/support scope yang berlaku.
- [ ] SEC-F06-03 Private/personalized media tidak keluar sebelum authorization valid dan tidak bocor melalui OG/social metadata.
- [ ] SEC-F06-04 Cacheable HTML tidak menyimpan expiring Storage credential.
- [ ] SEC-F06-05 Quarantine/processing/rejected/deleted object tidak pernah memperoleh serving URL.

## Fase 7: Payment & Midtrans Security

> Business/payment state machine, funded-success, entitlement, renewal/upgrade, cancellation, reconciliation, dan adjustment semantics mengikuti **File 01 §7**. Dokumen ini hanya memuat security controls.

- [ ] SEC-F07-01 Browser callback Midtrans hanya UX; tidak pernah menjadi sumber publish/entitlement/renewal/upgrade.
- [ ] SEC-F07-02 Webhook endpoint HTTPS, no-cache, no interactive challenge; signature diverifikasi constant-time sebelum processing.
- [ ] SEC-F07-03 Setelah signature valid, provider facts diverifikasi terhadap Status API dan invariant order/amount/currency/merchant/environment sebelum business transition.
- [ ] SEC-F07-04 Create-payment memakai idempotency key + intent fingerprint; ambiguous provider timeout tidak boleh menghasilkan checkout kedua secara buta.
- [ ] SEC-F07-05 Snap token/redirect credential tidak dilog; bila dipersist harus encrypted-at-rest dan scope owner.
- [ ] SEC-F07-06 Transaction/provider event processing idempotent terhadap duplicate/out-of-order webhook.
- [ ] SEC-F07-07 Commercial fact fields tidak dapat diubah melalui generic update/client write.
- [ ] SEC-F07-08 HTTP success hanya diberikan setelah event applied/idempotent-safe; transient infra failure tetap memungkinkan provider retry.
- [ ] SEC-F07-09 3DS/FDS dan environment separation diterapkan; PAN/CVV/card secret tidak pernah disimpan atau dilog.
- [ ] SEC-F07-10 Refund/chargeback/reversal memakai audited adjustment workflow; jangan menghapus original transaction.

## Fase 8: Security Audit, Governance & Support Access

> Retention, role model, two-person governance, degraded mode, dan support-grant contract mengikuti File 01 §9.

- [ ] SEC-F08-01 Security audit append-only untuk jalur normal; event tidak berisi PIN/token/secret/raw IP.
- [ ] SEC-F08-02 Owner hanya melihat Security Activity yang sudah disanitasi; admin normal read-only sesuai scope.
- [ ] SEC-F08-03 Protected purge/governance action menggunakan re-auth, reason, approval, dan audit sesuai policy kanonik.
- [ ] SEC-F08-04 Tidak ada broad `admin can select all` RLS pada owner tables.
- [ ] SEC-F08-05 Support access bersifat per-resource, time-bound, scope-bound, default read-only, dan invalid setelah revoke/role/session/context berubah.
- [ ] SEC-F08-06 Super-admin bukan implicit bypass untuk membaca private user content.
- [ ] SEC-F08-07 Credential/hash fields tidak pernah dapat dimasukkan ke support response.

## Fase 9: Editor Mutation Security

> Autosave queue, `content_version`, CAS, conflict UX, preview, publish-readiness, theme switch, event/gallery reorder, dan lifecycle matrix mengikuti **File 01 §10**.

- [ ] SEC-F09-01 Generic autosave menerima allowlist content saja; tidak menerima PIN/privacy revoke/payment/entitlement/lifecycle/security fields.
- [ ] SEC-F09-02 Sensitive editor actions memakai dedicated Server Action/RPC dengan auth, ownership, state/version check, dan re-auth bila diwajibkan.
- [ ] SEC-F09-03 Stale tab/device tidak dapat melewati CAS atau memaksa overwrite state yang lebih baru.
- [ ] SEC-F09-04 Published/expired/trashed/account-deletion state tetap diverifikasi server-side; deep link/UI bypass tidak mengubah authorization.
- [ ] SEC-F09-05 Preview tidak menjadi authorization bypass dan tidak memaparkan credential/private-session data.

## Fase 10: Data Export, Backup & Deletion

- [ ] SEC-F10-01 Full-account export memerlukan sensitive auth; invitation export tetap ownership-scoped.
- [ ] SEC-F10-02 Export request memakai idempotency key + request fingerprint; credential/hash/token/raw IP dikeluarkan dari hasil.
- [ ] SEC-F10-03 Export artifact private, short-lived, dan download URL signed sesuai File 01.
- [ ] SEC-F10-04 Account deletion segera menghentikan public access sesuai lifecycle dan memblokir mutation/commercial action yang tidak aman.
- [ ] SEC-F10-05 Hard-delete workflow idempotent; storage object dibersihkan melalui Storage API sebelum Auth user dihapus.
- [ ] SEC-F10-06 Deletion tombstone tetap efektif setelah backup restore.
- [ ] SEC-F10-07 Database backup dan Storage backup diuji sebagai dua concern terpisah; restore test benar-benar memakai artifact backup.

## Fase 11: Media Quarantine & Worker Security

- [ ] SEC-F11-01 Upload reservation atomic sebelum direct-to-private-quarantine agar quota/concurrency tidak overshoot.
- [ ] SEC-F11-02 Declared extension/MIME tidak dipercaya; worker memvalidasi bytes/decoder/dimension/duration dan menolak resource bomb.
- [ ] SEC-F11-03 EXIF/GPS disingkirkan dari derived image; user SVG tidak menjadi baseline upload.
- [ ] SEC-F11-04 Worker idempotent dan resource-limited; duplicate queue delivery/retry tidak menggandakan side effect.
- [ ] SEC-F11-05 Replacement gagal mempertahankan asset lama yang READY; hanya derived READY yang dapat disajikan.

## Fase 12: Queue, Outbox, Cron & Workflow Security

- [ ] SEC-F12-01 Business mutation + outbox insert atomic.
- [ ] SEC-F12-02 Queue diperlakukan at-least-once; consumer memiliki idempotency/guarded transition.
- [ ] SEC-F12-03 Dispatcher lease/claim dapat direcover setelah crash tanpa double side effect.
- [ ] SEC-F12-04 Retry memiliki backoff+jitter; permanent failure berakhir di failed-job ledger, bukan infinite retry.
- [ ] SEC-F12-05 Payload minimal + versioned dan worker reread authoritative DB state.
- [ ] SEC-F12-06 Scheduler hanya menemukan due work; correctness tidak bergantung pada satu cron invocation tepat waktu.
- [ ] SEC-F12-07 Payment entitlement selesai atomic sebelum side-effect di-enqueue.

## Fase 13: Email, Webhook & Notification Security

- [ ] SEC-F13-01 Transactional/security email dikirim melalui idempotent async path dan tidak memuat PIN/token/session/raw IP/guest PII yang tidak diperlukan.
- [ ] SEC-F13-02 Provider email webhook signature diverifikasi; duplicate delivery aman.
- [ ] SEC-F13-03 Bounce/complaint tidak memicu resend loop.
- [ ] SEC-F13-04 SPF/DKIM/DMARC dikonfigurasi pada production.
- [ ] SEC-F13-05 Security/payment/governance notification dipisahkan dari marketing preference.

## Fase 14: API/Web Security Headers

- [ ] SEC-F14-01 Cookie-auth mutation memiliki Origin/Host validation + CSRF defense yang sesuai.
- [ ] SEC-F14-02 CORS default same-origin.
- [ ] SEC-F14-03 CSP route-aware dan diuji dengan Midtrans Snap, Turnstile, Maps Embed, dashboard dark mode, dan invitation renderer; jangan membuka wildcard/`unsafe-inline` global hanya demi kompatibilitas.
- [ ] SEC-F14-04 Public-but-restricted API key hanya diberi API/referrer scope minimum dan dipisahkan antar environment.
- [ ] SEC-F14-05 HSTS, `frame-ancestors`, Referrer-Policy, Permissions-Policy, `nosniff`, request-size limit, redirect validation, dan SSRF defense diuji.
- [ ] SEC-F14-06 `SECURITY DEFINER` function: fixed `search_path`, revoke PUBLIC execute, explicit auth/state check.

## Fase 15: Production Verification

- [ ] SEC-F15-01 Test RLS/GRANT/IDOR dengan anon, dua owner berbeda, admin, dan super-admin.
- [ ] SEC-F15-02 Test stale role/session, sensitive-auth revoke, support-grant revoke, private-session/key rotation, guest token revoke, dan credential non-disclosure.
- [ ] SEC-F15-03 Test rate-limit/Turnstile/incident menggunakan policy kanonik File 01, termasuk no-global-hard-lock.
- [ ] SEC-F15-04 Test Midtrans create/retry/ambiguous timeout/webhook/status/cancel/refund/chargeback/reversal dan invariant mismatch.
- [ ] SEC-F15-05 Test duplicate queue delivery, worker crash/retry, export/deletion recovery, tombstone restore, dan backup restore.
- [ ] SEC-F15-06 Test signed media/cache behavior melewati lifetime credential dan pastikan private/personalized response tidak masuk shared cache.
- [ ] SEC-F15-07 Test CSP/CSRF/SSRF/header policy pada preview dan production-like environment.
- [ ] SEC-F15-08 Pastikan preview tidak mempunyai production DB/storage/payment secret.

## Fase 16: Marketing & Confirmation Security Boundary

> Visual/copy contract berada di File 03. Bagian ini hanya memastikan UI tidak mengurangi security boundary.

- [ ] SEC-F16-01 Copy `FREE`, pricing, social proof, promo, dan countdown tidak boleh memalsukan state bisnis atau data yang belum nyata.
- [ ] SEC-F16-02 Lead magnet/personalized preview tidak mengumpulkan PII/upload yang tidak diperlukan sebelum user memilih lanjut.
- [ ] SEC-F16-03 Sonner/toast bukan authorization atau safety confirmation.
- [ ] SEC-F16-04 Dialog/typed confirmation tidak menggantikan ownership, re-auth, idempotency, state/version, atau provider verification.
- [ ] SEC-F16-05 Destructive/high-impact action tidak close optimistis sebelum server mengonfirmasi hasil.
- [ ] SEC-F16-06 Raw secret/PIN/token/payment credential tidak masuk dialog, toast, analytics, atau client log.
- [ ] SEC-F16-07 Sticky/floating UI tidak menutupi Turnstile, focused input, keyboard, atau dialog security.

---

> **Aturan anti-duplikasi:** jika nilai, threshold, state, schema, atau lifecycle sudah didefinisikan di File 01, update hanya File 01. File 02 harus merujuk policy tersebut dan menguji implementasinya, bukan menyalin ulang angkanya.
