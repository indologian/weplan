create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges for role postgres in schema public
  grant usage, select on sequences to service_role;
alter default privileges for role postgres in schema private
  revoke execute on functions from public;

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  auth_context_version integer not null default 1 check (auth_context_version > 0),
  is_blocked boolean not null default false,
  account_status text not null default 'active'
    check (account_status in ('active', 'pending_deletion', 'deleting')),
  deletion_requested_at timestamptz,
  deletion_execute_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (
    account_status = 'active'
    or (deletion_requested_at is not null and deletion_execute_after is not null)
  ),
  check (
    deletion_execute_after is null
    or deletion_requested_at is null
    or deletion_execute_after >= deletion_requested_at
  )
);

create index idx_user_profiles_email_lower on public.user_profiles ((lower(email)));
create index idx_user_profiles_deleted_at on public.user_profiles(deleted_at)
  where deleted_at is not null;

create table public.tiers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('basic', 'premium', 'vip')),
  tier_rank smallint not null unique,
  name text not null,
  price_amount integer not null check (price_amount >= 0),
  original_price_amount integer check (
    original_price_amount is null or original_price_amount >= price_amount
  ),
  duration_months integer not null check (duration_months > 0),
  gallery_limit integer not null check (gallery_limit >= 0),
  video_limit integer not null check (video_limit >= 0),
  bank_account_limit integer not null check (bank_account_limit >= 0),
  audio_enabled boolean not null default false,
  audio_size_limit_mb integer not null default 0 check (audio_size_limit_mb >= 0),
  watermark_enabled boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (code = 'basic' and tier_rank = 10)
    or (code = 'premium' and tier_rank = 20)
    or (code = 'vip' and tier_rank = 30)
  ),
  check (
    (audio_enabled = false and audio_size_limit_mb = 0)
    or (audio_enabled = true and audio_size_limit_mb > 0)
  )
);

create table public.themes (
  id uuid primary key default gen_random_uuid(),
  tier_id uuid not null references public.tiers(id),
  renderer_key text not null,
  name text not null,
  description text not null default '',
  slug text not null unique,
  is_active boolean not null default true,
  category text not null default 'general'
    check (category in ('general', 'minimalist', 'floral', 'royal', 'modern', 'traditional')),
  catalog_tags text[] not null default '{}'::text[] check (cardinality(catalog_tags) <= 12),
  preview_image text,
  design_tokens jsonb not null default '{}'::jsonb check (jsonb_typeof(design_tokens) = 'object'),
  layout_config jsonb not null default '{}'::jsonb check (jsonb_typeof(layout_config) = 'object'),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_themes_tier_id on public.themes(tier_id);
create index idx_themes_renderer_key on public.themes(renderer_key);
create index idx_themes_active_sort on public.themes(sort_order, id) where is_active = true;
create index idx_themes_catalog_tags on public.themes using gin (catalog_tags) where is_active = true;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  theme_id uuid not null references public.themes(id),
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published', 'expired', 'trashed')),
  entitlement_tier_id uuid references public.tiers(id),
  entitlement_snapshot jsonb,
  is_private boolean not null default false,
  pin_version integer not null default 1 check (pin_version > 0),
  rsvp_mode text not null default 'personal_only' check (rsvp_mode in ('personal_only', 'open')),
  guestbook_moderation text not null default 'auto' check (guestbook_moderation in ('auto', 'manual')),
  client_ref uuid unique,
  couple jsonb not null default '{}'::jsonb check (jsonb_typeof(couple) = 'object'),
  love_story jsonb not null default '[]'::jsonb check (jsonb_typeof(love_story) = 'array'),
  bank_accounts jsonb not null default '[]'::jsonb check (jsonb_typeof(bank_accounts) = 'array'),
  settings jsonb not null default '{}'::jsonb check (jsonb_typeof(settings) = 'object'),
  published_at timestamptz,
  expires_at timestamptz,
  public_suspended_at timestamptz,
  suspension_reason text,
  last_activity_at timestamptz not null default now(),
  paid_retention_until timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_version integer not null default 1 check (content_version > 0),
  groom_name text generated always as (couple->'groom'->>'name') stored,
  bride_name text generated always as (couple->'bride'->>'name') stored,
  unique (id, user_id),
  check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  check (
    (entitlement_tier_id is null and entitlement_snapshot is null)
    or (entitlement_tier_id is not null and entitlement_snapshot is not null)
  ),
  check (expires_at is null or published_at is null or expires_at > published_at),
  check (paid_retention_until is null or entitlement_tier_id is null),
  check (
    status <> 'published'
    or (entitlement_tier_id is not null and published_at is not null and expires_at is not null)
  ),
  check (status <> 'expired' or (entitlement_tier_id is not null and expires_at is not null))
);

create table public.invitation_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  position smallint not null default 0 check (position >= 0),
  event_type text not null default 'other',
  title text not null default '',
  starts_at timestamptz,
  ends_at timestamptz,
  timezone text check (timezone is null or char_length(timezone) between 3 and 64),
  venue_name text not null default '',
  address text not null default '',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id, position),
  check (ends_at is null or starts_at is not null),
  check (ends_at is null or ends_at >= starts_at),
  check ((latitude is null) = (longitude is null)),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create table public.invitation_pin_credentials (
  invitation_id uuid primary key references public.invitations(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

create table public.pin_history (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  pin_hash text not null,
  replaced_at timestamptz not null default now()
);

create index idx_pin_history_invitation
  on public.pin_history(invitation_id, replaced_at desc);

create table public.security_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.user_profiles(id) on delete set null,
  invitation_id uuid references public.invitations(id) on delete set null,
  actor_user_id uuid references public.user_profiles(id) on delete set null,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'high', 'critical')),
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  protected boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_invitations_user_id on public.invitations(user_id);
create index idx_invitations_theme_id on public.invitations(theme_id);
create index idx_invitations_entitlement_tier_id on public.invitations(entitlement_tier_id)
  where entitlement_tier_id is not null;
create index idx_invitations_status on public.invitations(status);
create index idx_invitations_entitlement_expires_due on public.invitations(expires_at, id)
  where entitlement_tier_id is not null and status in ('draft', 'published') and expires_at is not null;
create index idx_invitations_last_activity_unpaid_draft on public.invitations(last_activity_at, id)
  where status = 'draft' and entitlement_tier_id is null;
create index idx_invitation_events_invitation_start
  on public.invitation_events(invitation_id, starts_at, position) where starts_at is not null;
create index idx_security_audit_user_created
  on public.security_audit_logs(user_id, created_at desc) where user_id is not null;
create index idx_security_audit_invitation_created
  on public.security_audit_logs(invitation_id, created_at desc) where invitation_id is not null;
create index idx_security_audit_actor_created
  on public.security_audit_logs(actor_user_id, created_at desc) where actor_user_id is not null;
create index idx_security_audit_type_created
  on public.security_audit_logs(event_type, created_at desc);

create or replace function private.guard_used_theme_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.invitations i
    where i.theme_id = old.id
      and (i.entitlement_tier_id is not null or i.published_at is not null)
  ) then
    raise exception 'used theme tier and renderer are immutable';
  end if;
  return new;
end;
$$;

create trigger trg_guard_used_theme_identity
before update of tier_id, renderer_key on public.themes
for each row execute function private.guard_used_theme_identity();

create or replace function private.assert_private_invitation_has_pin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_private and not exists (
    select 1 from public.invitation_pin_credentials c where c.invitation_id = new.id
  ) then
    raise exception 'private invitation requires PIN credential';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_private_pin_credential_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.invitations i
    where i.id = old.invitation_id and i.is_private = true
  ) then
    raise exception 'cannot delete PIN credential while invitation is private';
  end if;
  return old;
end;
$$;

create constraint trigger trg_private_invitation_requires_pin
after insert or update of is_private on public.invitations
deferrable initially deferred
for each row execute function private.assert_private_invitation_has_pin();

create constraint trigger trg_private_invitation_prevent_pin_delete
after delete on public.invitation_pin_credentials
deferrable initially deferred
for each row execute function private.prevent_private_pin_credential_delete();
