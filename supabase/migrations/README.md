# Migrations

M1 memperkenalkan tiga migration forward-only:

1. foundation schema, constraints, indexes, credential separation, dan trigger invariant;
2. explicit RLS/GRANT boundaries;
3. canonical atomic create-or-sync RPC.

Tidak ada seed harga, allowance, atau theme pada M1 karena nilainya belum diberikan sebagai data kanonik. Database tests membuat fixture di dalam transaction lalu melakukan rollback.

Verification pada environment dengan Docker-compatible runtime:

```text
supabase start
supabase db reset
supabase test db
supabase db lint --level error
```

Migration ini hanya menambah object baru. Sebelum production pertama, recovery dilakukan dengan memperbaiki migration dan menjalankan ulang database disposable. Setelah pernah diterapkan ke shared/production environment, jangan mengubah file lama; buat forward migration korektif melalui `supabase migration new <name>`.
