import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const foundation = readFileSync("supabase/migrations/20260825171627_foundation_schema.sql", "utf8");
const boundaries = readFileSync("supabase/migrations/20260825171629_security_boundaries.sql", "utf8");
const creation = readFileSync("supabase/migrations/20260825171631_creation_rpc.sql", "utf8");
const editor = readFileSync("supabase/migrations/20260826011900_editor_mutations.sql", "utf8");
const sensitive = readFileSync("supabase/migrations/20260826012800_sensitive_actions.sql", "utf8");

describe("M1 migration security contracts", () => {
  it("enables RLS on every M1 public table", () => {
    const tables = [
      "user_profiles", "tiers", "themes", "invitations", "invitation_events",
      "invitation_pin_credentials", "pin_history", "security_audit_logs",
    ];
    tables.forEach((table) => expect(boundaries).toContain(`alter table public.${table} enable row level security`));
  });

  it("keeps credential and audit tables outside authenticated grants", () => {
    expect(boundaries).not.toMatch(/grant select on[^;]*(invitation_pin_credentials|pin_history|security_audit_logs)/s);
  });

  it("does not expose creation RPC to browser roles", () => {
    expect(creation).toMatch(/revoke all on function public\.create_or_sync_invitation[\s\S]*from public, anon, authenticated/);
    expect(creation).toMatch(/grant execute on function public\.create_or_sync_invitation[\s\S]*to service_role/);
  });

  it("separates credential hashes from invitations", () => {
    const invitationsDefinition = foundation.match(/create table public\.invitations \([\s\S]*?\n\);/)?.[0] ?? "";
    expect(invitationsDefinition).not.toContain("pin_hash");
    expect(foundation).toContain("create table public.invitation_pin_credentials");
  });

  it("keeps M2 RPCs invoker-rights and service-role-only", () => {
    expect(editor).not.toMatch(/security definer/i);
    expect(sensitive).not.toMatch(/security definer/i);
    expect(editor).toMatch(/grant execute on function public\.save_invitation_content[\s\S]*to service_role/);
    expect(sensitive).toMatch(/grant execute on function public\.update_invitation_privacy[\s\S]*to service_role/);
    expect(editor).toMatch(/revoke all on function public\.reorder_invitation_events[\s\S]*from public, anon, authenticated/);
  });

  it("enforces lifecycle and exact event-set guards inside the trusted transaction", () => {
    expect(editor).toContain("v_row.status not in ('draft', 'published')");
    expect(editor).toContain("v_input_count <> v_event_count");
    expect(editor).not.toContain("position = position + 10000");
  });
});
