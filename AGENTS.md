# Weplan Agent Bootstrap

Instruksi ini berlaku untuk seluruh repository. File ini hanya bootstrap pointer; jangan menyalin atau membuat business rule di sini.

## Required Reading

Sebelum membuat keputusan arsitektur, mengubah code, migration, configuration, atau documentation:

1. Baca seluruh File 01–08.
2. Baca seluruh `IMPLEMENTATION-RECORD.md`, terutama entry terbaru.
3. Periksa repository aktual dengan `git status`, Git history terbaru, source code, migrations, tests, dan CI configuration.
4. Jangan menganggap implementation record benar tanpa mencocokkannya dengan repository dan test evidence.

## Authority Order

- File 06: implementation roadmap dan scope authority.
- File 07: database/domain implementation reference.
- File 01–05: canonical authority sesuai ownership matrix.
- File 08: execution procedure.
- `IMPLEMENTATION-RECORD.md`: execution evidence, bukan specification authority.

Jika specification ambigu atau conflict pada authority yang sama, berhenti dan minta keputusan user. Jangan membuat business rule baru.

## Execution Rules

- Lakukan repository reconnaissance sebelum coding.
- Kerjakan hanya milestone/work package yang disetujui user.
- Jangan mengulang work package berstatus `COMPLETE` kecuali evidence menunjukkan regression atau user meminta perubahan.
- Sebelum coding, laporkan goal, canonical references, existing implementation, gap, work packages kecil, dan verification plan.
- Jangan melanjutkan ke milestone/work package berikutnya sebelum target selesai, seluruh acceptance criteria relevan lulus, dan user menyetujui kelanjutannya.
- Pertahankan perubahan user dan hindari perubahan di luar scope.
- Gunakan migration forward-only setelah migration pernah diterapkan ke shared/production environment.

## Completion Rules

- Jalankan verification yang proporsional terhadap risiko dan scope.
- Jangan menandai pekerjaan `COMPLETE` jika test atau acceptance criteria relevan gagal.
- Berikan completion report sesuai File 08 §22.
- Setelah completion verification, append record ke `IMPLEMENTATION-RECORD.md` sesuai File 08 §22.1 sebelum handoff atau pekerjaan berikutnya.
- Record harus menyertakan commit dan CI/deployment evidence bila tersedia, serta tidak boleh memuat secret, token, credential, PII, atau raw production payload.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
