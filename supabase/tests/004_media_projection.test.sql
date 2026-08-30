begin;

select plan(9);

select ok(
  has_table_privilege('authenticated', 'public.media_assets', 'select'),
  'authenticated users can reach media metadata through the Data API'
);
select ok(
  not has_table_privilege('anon', 'public.media_assets', 'select'),
  'anonymous users cannot read owner media metadata'
);
select ok(
  has_table_privilege('authenticated', 'public.invitation_gallery_items', 'select'),
  'authenticated users can reach gallery ordering through the Data API'
);
select ok(
  not has_table_privilege('anon', 'public.invitation_gallery_items', 'select'),
  'anonymous users cannot read owner gallery ordering'
);
select ok(
  not has_table_privilege('authenticated', 'public.media_assets', 'insert'),
  'authenticated users cannot write media metadata directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.invitation_gallery_items', 'insert'),
  'authenticated users cannot write gallery ordering directly'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.replace_invitation_gallery(uuid, uuid, integer, uuid[])',
    'execute'
  ),
  'service role can execute the canonical gallery mutation'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.replace_invitation_gallery(uuid, uuid, integer, uuid[])',
    'execute'
  ),
  'authenticated users cannot execute the gallery mutation directly'
);
select is(
  (
    select procedure.prosecdef
    from pg_proc procedure
    join pg_namespace namespace on namespace.oid = procedure.pronamespace
    where namespace.nspname = 'public'
      and procedure.proname = 'replace_invitation_gallery'
  ),
  false,
  'gallery mutation remains invoker-rights'
);

select * from finish();

rollback;

