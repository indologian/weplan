# Panduan Enterprise Security & Edge-Cases

> **Peran dokumen:** hanya failure mode, race condition, recovery, dan kondisi langka yang belum cukup dijelaskan oleh baseline.
>
> **Normal-flow authority:** `01 - arsitektur-dan-konvensi.md`.
> **Security checklist:** `02 - panduan-keamanan.md`.
> **UI/renderer projection:** File 03/05 sesuai ownership; File 04 hanya menambah failure/race/recovery behavior.
>
> Dokumen ini **tidak mengulang** tier model, create flow, RSVP matrix, PIN threshold, private-session contract, payment state machine, autosave algorithm, atau storage rules yang sudah kanonik. Bila sebuah edge-case membutuhkan nilai tersebut, implementasi membaca File 01.
>
> Free-tier exhaustion adalah **capacity edge-case**, bukan alasan fail-open atau auto-upgrade berbayar.

---

## 0. Verification Priority

Checklist edge-case dibagi berdasarkan kapan harus dibuktikan, tanpa mengubah invariant File 01:

| Prioritas | Wajib sebelum launch | Dapat menyusul ketika capability aktif |
|---|---|---|
| **P0 — launch blocker** | creation/auth recovery; payment funded/idempotency/reconciliation dasar; editor CAS; publish race; private/cache/security boundary; media pipeline yang diaktifkan; queue/outbox yang benar-benar dipakai; production/runtime recovery | — |
| **P1 — capability blocker** | — | refund/chargeback tooling lanjutan, support elevation/governance quorum, full export/bulk admin workflow, dan edge-case lain untuk capability yang belum diaktifkan |
| **P2 — operational maturity** | monitoring kapasitas dan runbook minimum tetap wajib | optimasi manual tooling, rare disaster orchestration, dan automation yang tidak memengaruhi correctness launch |

**Aturan:** `P1/P2` bukan izin mengabaikan edge-case pada capability yang sudah aktif. Begitu capability diaktifkan, seluruh checklist relevannya menjadi release gate capability tersebut. File 06 hanya memetakan checklist ini ke milestone/test evidence.

---

## 1. Creation & Authentication Recovery Edge-Cases

- [ ] Retry setelah timeout pada create/sync harus kembali ke invitation yang sama; conflict key milik user lain tidak boleh mengungkap row/data tersebut.
- [ ] Crash setelah sebagian proses onboarding tidak boleh meninggalkan parent/initial event setengah jadi; atomic create boundary mengikuti File 01.
- [ ] Auth valid tetapi `user_profiles` belum terbentuk harus self-heal secara idempotent melalui trusted provisioning; role/security state tidak diambil dari metadata user.
- [ ] Local draft baru dihapus setelah server mengonfirmasi invitation tersedia; unknown draft schema tidak boleh silently parse/delete.

## 2. Theme / Entitlement Edge-Cases

- [ ] Theme/revision yang sudah dipakai pada paid/published history tidak boleh mengubah semantic renderer/minimum entitlement in-place; breaking change membuat revision baru sesuai File 01.
- [ ] Aktivasi theme yang allowance-nya lebih kecil harus gagal dengan typed conflict; content existing tidak dihapus atau disembunyikan otomatis. **Owner target-theme preview tetap boleh merender seluruh content valid + warning conflict**; preview tidak boleh truncate content hanya agar tampak lolos allowance.
- [ ] Saat checkout initial publish aktif, theme change tunduk pada target checkout kanonik; stale UI tidak boleh mengubah purchase intent.
- [ ] Paid entitlement tidak boleh berkurang karena katalog/admin berubah; reconciliation negatif hanya melalui payment-adjustment workflow.

## 3. Payment Provider & Ledger Edge-Cases

> State/transition normal mengikuti File 01 §7; bagian ini hanya membahas kondisi ambigu/rare.

- [ ] Create Snap timeout setelah request terkirim masuk recovery attempt yang sama; jangan otomatis membuat order/checkout baru.
- [ ] Duplicate/out-of-order webhook, Status API poll, dan retry provider tidak boleh menggandakan entitlement/credit/adjustment.
- [ ] Cancel intent yang stale tidak boleh mengalahkan provider fact funded; status provider terbaru menentukan apakah cancel, expire, atau refund workflow yang berlaku.
- [ ] `settlement -> deny`, card cancel after capture, refund, chargeback, partial chargeback, dan provider reversal direkonsiliasi deterministik tanpa menghapus original transaction.
- [ ] Zero-value upgrade tetap mempunyai ledger audit tetapi tidak memanggil provider.
- [ ] Jika provider transaction ID baru tersedia setelah create, recovery/status/refund memakai identifier yang diwajibkan channel tanpa memutus hubungan ke commercial transaction lokal.
- [ ] Full chargeback/provider reversal dapat men-suspend public access sambil mempertahankan content untuk dispute/review.
- [ ] Partial adjustment yang tidak dapat dipetakan aman ke entitlement masuk manual review; jangan menebak downgrade.
- [ ] Chargeback evidence package harus privacy-safe dan deadline mempunyai critical admin alert.
- [ ] Reconciliation backlog mencakup unknown create, pending, capture-not-settled, ambiguous cancel, refund pending, requires-review, dan recent-funded reversal window.

## 4. Renewal, Upgrade & Retention Edge-Cases

- [ ] Early renewal tidak boleh memendekkan expiry yang sudah dimiliki.
- [ ] Upgrade setelah renewal mempertahankan masa aktif yang sudah dibeli; entitlement merge mengikuti prinsip no-rights-regression File 01.
- [ ] Draft extension tidak boleh menghidupkan kembali invitation setelah hard delete.
- [ ] Invitation yang pernah paid/published tidak boleh secara salah masuk jalur unpaid-draft extension karena status cron terlambat.
- [ ] Effective expiry/retention ditentukan authoritative timestamp, bukan hanya label status yang mungkin belum disinkron cron.

## 5. Concurrency & Editor Edge-Cases

> Algoritme autosave/CAS normal mengikuti File 01 §10.

- [ ] Response save lama tidak boleh menandai form clean atau menimpa edit yang dibuat setelah request dimulai.
- [ ] Two-tab/device conflict berhenti aman dengan typed conflict; tidak ada automatic force overwrite.
- [ ] `pagehide` request stale tidak boleh mengalahkan revision yang lebih baru.
- [ ] Event/gallery reorder dilakukan transactionally agar UNIQUE position tidak mengalami collision sementara.
- [ ] Privacy/theme/sensitive action yang dibuka dari state UI lama harus re-check version/state ketika commit.
- [ ] Published edit yang sukses DB tetapi gagal cache/OG invalidation harus dapat diretry tanpa mengulang business mutation.
- [ ] Server tetap menolak write pada lifecycle/account state yang tidak editable walaupun request dikirim dari deep link atau tab lama.

## 6. Draft Preview & Publish Race Edge-Cases

- [ ] Preview hanya berpindah setelah latest savable generation tersimpan; conflict/save failure menahan user di editor.
- [ ] Target-theme preview tidak boleh memutasi live theme/entitlement atau menjadi authorization input.
- [ ] Renderer preview toleran terhadap draft incomplete tetapi menggunakan composition/query yang sama dengan public renderer.
- [ ] Async media yang belum final dapat membuat readiness berubah setelah checkout dimulai.
- [ ] Funded-success tetap memberikan entitlement yang dibayar walaupun readiness terbaru gagal; invitation tetap draft dan publish berikutnya tidak meminta pembayaran kedua.
- [ ] Expiry authoritative harus memblokir publish/edit walaupun cron belum mengganti label status.

## 7. Slug, URL & Social Preview Edge-Cases

- [ ] Future slug change harus dedicated workflow dengan redirect/history policy; jangan diperkenalkan sebagai autosave field.
- [ ] Private invitation selalu menghasilkan social preview generik; private media tidak boleh bocor melalui OG crawler/cache.
- [ ] Public OG generation failure tidak boleh memaksa membuka bucket private; gunakan derived/stable representation sesuai File 01.

## 8. Governance & Support Authorization Edge-Cases

- [ ] Governance degraded mode ketika active super-admin kurang dari batas kanonik harus memblokir action yang membutuhkan quorum sampai external recovery.
- [ ] Target role change tidak dapat menjadi approver dirinya sendiri.
- [ ] Stale JWT/UI privilege tidak boleh bertahan setelah downgrade/revoke.
- [ ] Support grant invalid setelah expiry/revoke, role/context/session change, logout, atau invitation deletion.
- [ ] Support request harus berasal dari session yang sama dengan grant dan memverifikasi session masih hidup; jangan membuat FK permanen ke `auth.sessions`.
- [ ] Super-admin tetap tidak menjadi broad bypass untuk owner-private content.
- [ ] Credential/hash fields selalu dikeluarkan dari support response, termasuk write-elevated support.

## 9. Data Export, Deletion & Backup Edge-Cases

- [ ] Export retry dengan idempotency key yang sama tidak membuat dua final artifact; key sama dengan intent berbeda ditolak.
- [ ] Account deletion langsung menonaktifkan public access meski hard delete menunggu grace period.
- [ ] Active commercial checkout saat deletion harus direconcile/cancel/expire dengan provider-aware flow; jangan local status flip saja.
- [ ] Hard-delete workflow dapat dilanjutkan setelah crash/partial cleanup tanpa double side effect.
- [ ] Storage object cleanup selesai melalui Storage API sebelum Auth user delete; direct SQL mutation `storage.objects` dilarang.
- [ ] Deletion tombstone survive user deletion dan tetap diterapkan setelah restore backup.
- [ ] Database restore dianggap belum lengkap sebelum object-storage recovery procedure juga diuji.

## 10. Media Pipeline Edge-Cases

- [ ] Dua tab upload bersamaan memakai reservation atomic agar quota tidak overshoot.
- [ ] Magic-byte/MIME mismatch, decode failure, extreme pixel count, duration/size overflow menghasilkan permanent reject yang observabel.
- [ ] Duplicate processing job/queue redelivery aman.
- [ ] Worker crash setelah derived object tertulis tetapi sebelum DB update harus mendeteksi output + **media processing `version`** dan reconcile; jangan campur dengan invitation `content_version`.
- [ ] Replacement failure mempertahankan asset lama yang READY.
- [ ] Deleted/rejected/quarantine media tidak pernah mendapatkan serving URL.

## 11. Queue, Outbox & Scheduler Edge-Cases

- [ ] DB commit sukses + queue publish gagal meninggalkan outbox pending untuk retry.
- [ ] Dispatcher claim memakai short transaction/lease yang dapat direclaim setelah worker mati.
- [ ] Queue publish sukses + dispatcher crash sebelum mark-dispatched menghasilkan duplicate publish yang tetap aman melalui idempotency.
- [ ] Consumer crash setelah external side effect tidak menggandakan efek saat retry.
- [ ] Cron overlap aman; scanner menggunakan due-query + locking/guarded transition.
- [ ] Poison job berakhir pada failed-job ledger; tidak ada infinite retry.
- [ ] Queue payload version mismatch gagal eksplisit dan observabel.

## 12. Email & Notification Edge-Cases

- [ ] Duplicate security/payment/governance email dicegah idempotency key.
- [ ] Delivery/bounce/complaint edge-case mengikuti invariant email File 02; File 04 hanya menguji retry/out-of-order/provider failure dan tidak menyalin rule normal-flow kedua.
- [ ] Recovery/incident email dedupe tidak bergantung pada process memory lokal.
- [ ] Security-critical email tidak berisi PIN/token/session/raw IP/guest PII yang tidak perlu.

## 13. API, Cache & Web Security Edge-Cases

- [ ] Shared/public cache tidak pernah menyimpan private/personalized guest content, auth `Set-Cookie`, atau expiring signed media URL.
- [ ] Stable media URL tetap bekerja ketika cache HTML hidup lebih lama daripada signed credential underlying.
- [ ] Cookie-auth mutation yang direplay dari origin lain tetap gagal CSRF/origin check.
- [ ] External URL input tidak dapat memicu arbitrary server fetch (SSRF).
- [ ] CSP change diuji terhadap seluruh provider resmi sebelum rollout; jangan memperlebar wildcard untuk memperbaiki satu integrasi.
- [ ] `SECURITY DEFINER` RPC tetap fixed-search-path, revoked PUBLIC execute, dan explicit auth/state check setelah migration/refactor.
- [ ] Personalized Preview sebelum auth tidak boleh diam-diam membuat DB row/upload private data sebelum user memilih lanjut.
- [ ] Featured theme grid tidak boleh menjalankan banyak renderer/GSAP/audio/map iframe penuh bersamaan hingga menghabiskan resource.

## 14. Production & Recovery Edge-Cases

- [ ] Preview environment tidak dapat mengakses production DB/storage/payment secret.
- [ ] Irreversible migration memiliki preflight backup + rollback/forward-recovery plan.
- [ ] Quarterly restore test merekam hasil dan action item; Storage diuji terpisah dari database.
- [ ] Scheduler heartbeat, outbox backlog, failed jobs, dan oldest-message age memiliki alert owner/runbook.
- [ ] Free-tier quota warning diuji; mendekati limit → alert + defer optional work, sedangkan auth/payment/security tidak fail-open.
- [ ] Paid add-on/pay-as-you-go/auto-upgrade disabled by default; billing change adalah operational change eksplisit.
- [ ] External video embed tetap allowlisted dan tidak digunakan sebagai SSRF fetch.

## 15. Cloudflare Workers / OpenNext Capacity Edge-Cases

> Runtime baseline mengikuti File 01 §1/§17; bagian ini hanya failure/capacity behavior.

- [ ] `opennextjs-cloudflare preview`/production-like verification menangkap dependency Node/native yang tidak kompatibel sebelum deploy.
- [ ] CPU-heavy crypto/media/bulk work tidak dipindah ke request Worker hanya karena endpoint berhasil di local Node runtime.
- [ ] Queue/Workflow free-tier pressure terdeteksi sebelum backlog menjadi outage; queue retention bukan source of truth.
- [ ] Redis risk key selalu ber-TTL; normal static GET tidak menghabiskan limiter quota.
- [ ] Email quota diprioritaskan untuk auth/security/payment; marketing bulk tidak boleh menghabiskan jalur kritis.
- [ ] Tidak ada paid image/AI/map engine kedua yang diam-diam menjadi dependency baseline.

## 16. Confirmation / Popup Edge-Cases

> Primitive/copy/accessibility normal mengikuti File 03 §1.4.

- [ ] Double-click confirm/network retry tidak membuat duplicate destructive mutation; server idempotency/version/state guard tetap menentukan hasil.
- [ ] Escape/backdrop close tidak menjalankan side effect.
- [ ] Destructive dialog tidak close optimistis; failure mempertahankan context untuk retry/decision.
- [ ] `Undo` hanya ada bila server menyediakan rollback nyata, authorized, idempotent, dan masih valid.
- [ ] Multiple tabs: dialog pada tab A gagal aman jika state sudah berubah di tab B.
- [ ] Payment cancel dialog selalu re-check provider/business state; stale dialog tidak dapat membatalkan funded transaction.
- [ ] Admin price/tier/theme confirmation tidak mengubah historical entitlement snapshot.
- [ ] Critical dialog tidak memuat secret/raw token/PIN/sensitive audit detail/PII yang tidak diperlukan.
- [ ] Focus/safe-area/z-index diuji ketika Dialog, Sheet, Turnstile, keyboard, dan floating UI saling overlap.

## 17. Next.js Folder & Boundary Edge-Cases

> Struktur dan ownership normal mengikuti File 01 §3/§14.

- [ ] CI gagal bila root `app/` dan `src/app/` muncul bersamaan atau asset diletakkan pada path non-kanonik.
- [ ] Client Component mengimpor module `server-only` harus gagal build; jangan menghapus guard untuk memaksa import.
- [ ] Mutation yang muncul lewat Server Action dan REST internal dengan validation berbeda dianggap duplicate mutation surface dan dikonsolidasikan.
- [ ] Cleanup SQL/RPC tidak diberi HTTP cron endpoint kedua tanpa alasan nyata.
- [ ] Provider helper (khususnya payment) tidak boleh tersebar di module berbeda hingga policy signature/status/refund drift.
- [ ] Circular dependency antar domain/orchestrator harus ditolak lint/build gate.
- [ ] Route-local `_components` tidak boleh menjadi pemilik entitlement/payment/security rule.
- [ ] Loading/error boundary tetap scoped dan root production fallback tidak hilang setelah refactor.
- [ ] Route Handler baru wajib mempunyai alasan HTTP eksplisit: callback/webhook, stable resource URL, beacon, atau streaming/chunk requirement.

---

> **Aturan anti-duplikasi:** File 04 tidak mendefinisikan kembali baseline. Jika suatu edge-case membutuhkan nilai kanonik (threshold, TTL, tier rank, status, expiry, schema), referensikan File 01 dan hanya dokumentasikan apa yang terjadi ketika kondisi gagal/berlomba/terputus.
