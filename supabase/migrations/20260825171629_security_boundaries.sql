alter table public.user_profiles enable row level security;
alter table public.tiers enable row level security;
alter table public.themes enable row level security;
alter table public.invitations enable row level security;
alter table public.invitation_events enable row level security;
alter table public.invitation_pin_credentials enable row level security;
alter table public.pin_history enable row level security;
alter table public.security_audit_logs enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

grant select on public.tiers, public.themes to anon, authenticated;
grant select on public.user_profiles, public.invitations, public.invitation_events to authenticated;

create policy "Anyone can view active tiers"
on public.tiers for select to anon, authenticated
using (is_active = true);

create policy "Anyone can view active themes"
on public.themes for select to anon, authenticated
using (is_active = true);

create policy "Users can view own profile"
on public.user_profiles for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "Users can view own invitations"
on public.invitations for select to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Owners can view own events"
on public.invitation_events for select to authenticated
using (
  exists (
    select 1
    from public.invitations i
    where i.id = invitation_events.invitation_id
      and i.user_id = (select auth.uid())
  )
);

revoke all on function private.guard_used_theme_identity() from public, anon, authenticated;
revoke all on function private.assert_private_invitation_has_pin() from public, anon, authenticated;
revoke all on function private.prevent_private_pin_credential_delete() from public, anon, authenticated;
