# 07 - Database & Domain Contract Reference --- weplan

> **Peran dokumen:** implementation reference untuk database/domain
> contract yang sudah ditetapkan File 01.
>
> **Authority tetap File 01.** File ini tidak boleh menciptakan business
> rule, threshold, lifecycle, tier allowance, TTL, atau payment state
> baru. Jika terjadi konflik, File 01 menang dan File 07 harus
> diperbarui.
>
> **Tujuan:** memberi contractor satu peta implementasi schema,
> ownership, access boundary, invariant, dan mutation pattern tanpa
> menjadikan dokumentasi ini source of truth kedua.
>
> **Aturan penting:** SQL migration aktual adalah executable artifact.
> Setelah implementasi dimulai, schema detail di dokumen ini harus
> diverifikasi terhadap migration/DB introspection dalam CI.

------------------------------------------------------------------------

## 1. Database Principles

1.  PostgreSQL adalah authoritative business state.
2.  RLS dan GRANT digunakan bersama.
3.  Browser tidak menerima service-role/elevated credential.
4.  Anonymous guest tidak mengakses raw `guests`.
5.  Credential/hash dipisahkan dari owner-readable row.
6.  Commercial fact tidak dapat diubah generic client mutation.
7.  JSONB yang menjadi domain contract divalidasi server-side.
8.  Foreign key yang dipakai untuk join/delete/lookup harus memiliki
    index yang sesuai.
9.  Timestamp authoritative menentukan lifecycle; cron hanya
    menyinkronkan/menemukan due work.
10. Semua transition yang memberi hak komersial harus atomic dan
    idempotent.
11. Queue/Redis/provider bukan source of truth.
12. Soft/deferred processing state tidak boleh membuat private data
    menjadi public.

------------------------------------------------------------------------

## 2. Schema Exposure Model

Gunakan exposure model File 01 §4.0.

### Public/browser-facing boundary

Browser hanya memperoleh: - row owner-scoped yang memang aman; -
RPC/Server Action dengan explicit output; - public projection yang sudah
di-whitelist.

### Internal/credential boundary

Deny-by-default untuk `anon` dan `authenticated` bila tabel berisi: -
PIN hash/history; - guest/edit credential hash; - payment provider
raw/internal event; - privileged governance state; - internal
job/reliability state yang tidak perlu client; - security incident
internals.

### Service boundary

Elevated access hanya melalui trusted server/runtime/RPC yang melakukan
explicit auth/state checks.

------------------------------------------------------------------------

## 3. Core Entity Map

``` text
auth.users
   │
   └── user_profiles
          │
          └── invitations
                ├── invitation_events
                ├── invitation_pin_credentials
                │      └── pin_history
                ├── guests
                │      └── guest_credentials
                ├── media_assets
                │      └── invitation_gallery_items
                ├── upload_reservations
                ├── transactions
                │      ├── payment_attempts
                │      └── payment_provider_events
                └── entitlement_snapshot (on invitation)

tiers ─────── themes
   │            │
   └────────────┴── minimum theme entitlement relation

operational:
security_audit_logs
security_incidents
admin_support_access
admin_role_change_requests
draft_extension_products
leads
global_settings
outbox_events
failed_jobs
scheduled_job_runs
export/deletion/email/analytics supporting tables
```

Exact columns, enum/check constraints, and canonical states remain
defined by File 01 §4 and migrations.

------------------------------------------------------------------------

# 4. Table Contracts

## 4.1 `user_profiles`

**Purpose:** trusted application profile linked to Supabase Auth.

**Ownership:** one authenticated identity.

**Rules:** - role/security-sensitive state cannot be trusted from
editable user metadata; - provisioning must be idempotent; - privileged
role changes use dedicated trusted workflow; - role downgrade must
invalidate stale privileged context according to File 01.

**Access:** - owner may read/update only explicitly allowed profile
fields; - privileged fields are not generic client-writable.

------------------------------------------------------------------------

## 4.2 `tiers`

**Purpose:** canonical commercial tier configuration.

Real tiers: `BASIC`, `PREMIUM`, `VIP`.

`FREE` is marketing-only and must not become a tier entitlement
row/semantic that grants publish rights.

**Contains canonical commercial configuration such as:** - price; -
feature/allowance; - watermark behavior; - duration.

**Rules:** - theme does not duplicate price/allowance; - checkout
snapshots commercial facts; - historical entitlement is not
retroactively changed when tier catalog changes.

**Mutation:** admin/trusted only.

------------------------------------------------------------------------

## 4.3 `themes`

**Purpose:** theme catalog/revision metadata and minimum `tier_id`.

**Rules:** - theme determines design + minimum entitlement
requirement; - price/limits are not owned by theme; - breaking
renderer/minimum-entitlement semantic change creates revision/new
compatible representation rather than silently rewriting paid history; -
publication/catalog readiness is separate from owner entitlement.

**Launch portfolio:** four initial themes are a File 05 rollout
decision, not a database invariant.

------------------------------------------------------------------------

## 4.4 `invitations`

**Purpose:** aggregate root untuk invitation.

Conceptual responsibilities: - owner; - slug/public identity; - selected
theme/revision; - lifecycle/publication state; - privacy state; -
content/config JSONB defined by File 01; - `content_version`; -
authoritative expiry/retention timestamps; - commercial entitlement
snapshot; - view/operational fields that File 01 explicitly owns.

**Critical rules:** - entitlement belongs to invitation, not user; -
draft may use/preview any theme; - publish requires effective paid
entitlement for selected theme; - generic autosave cannot modify
lifecycle/payment/security/entitlement fields; - published/private
access always re-evaluates authoritative state; - entitlement snapshot
preserves purchased rights.

**Concurrency:** mutations that edit versioned content use atomic CAS.

------------------------------------------------------------------------

## 4.5 `invitation_events`

**Purpose:** canonical wedding/event schedule rows.

**Rules:** - belongs to invitation; - ordering/reorder transactional; -
position uniqueness must not create transient collision; -
renderer/countdown consumes canonical event instant; - draft validation
may be permissive; publish-readiness is stricter.

------------------------------------------------------------------------

## 4.6 `invitation_pin_credentials`

**Purpose:** current private-invitation PIN credential.

**Security boundary:** - not owner-readable raw credential row; -
plaintext PIN never stored; - hash algorithm/version and rotation
semantics follow File 01 §8.4; - reset/rotation is dedicated sensitive
mutation; - `pin_version`/revocation semantics invalidate stale private
session as defined by File 01.

------------------------------------------------------------------------

## 4.7 `pin_history`

**Purpose:** enforce credential history/no-reuse policy where File 01
requires it.

**Access:** trusted server only.

**Rules:** - no plaintext; - retention/history count follows canonical
policy; - not exposed through support/export/public response.

------------------------------------------------------------------------

## 4.8 `guests`

**Purpose:** invitation guest business data.

**Hard boundary:** anonymous browser never performs raw table
read/write.

Public RSVP/personalization goes through: - trusted server endpoint;
or - hardened RPC with explicit whitelist.

**Rules:** - name, UUID, `to=` and phone are not authentication
credentials; - sensitive/internal guest fields are not returned to
public response; - owner access remains invitation ownership-scoped.

------------------------------------------------------------------------

## 4.9 `guest_credentials`

**Purpose:** hashed random authority for personalized/edit guest
operation.

**Rules:** - store hash/HMAC, not raw token; - revoke/regenerate
supported; - token is not logged; - credential is excluded from
owner/public/export/support projections unless an explicit safe workflow
says otherwise.

------------------------------------------------------------------------

## 4.10 `security_audit_logs`

**Purpose:** append-oriented security/governance audit.

**Rules:** - no PIN/token/secret/raw IP; - owner Security Activity is
sanitized projection; - normal admin does not receive broad
owner-private content; - purge follows protected governance workflow.

------------------------------------------------------------------------

## 4.11 `security_incidents`

**Purpose:** durable incident/risk lifecycle where required.

**Rules:** - provider/Redis risk state does not replace DB incident
authority where File 01 requires durable record; - dedupe/TTL/closure
semantics follow File 01; - incident logic must not enable
attacker-controlled global invitation DoS.

------------------------------------------------------------------------

## 4.12 `admin_support_access`

**Purpose:** temporary scoped support grant.

**Contract:** - per-resource; - time-bound; - scope-bound; - default
read-only; - invalid after expiry/revoke/session/context/role changes; -
no implicit super-admin bypass to private content.

Credential/hash fields remain excluded even under support access.

------------------------------------------------------------------------

## 4.13 `admin_role_change_requests`

**Purpose:** governed privileged-role change.

**Rules:** - target cannot self-approve where governance requires
separation; - quorum/degraded-mode semantics follow File 01; - audited
and re-authenticated as required.

------------------------------------------------------------------------

## 4.14 `draft_extension_products`

**Purpose:** commercial configuration for eligible draft-extension
product.

**Rules:** - not a generic resurrection mechanism; - cannot revive
hard-deleted invitation; - paid/published history cannot accidentally
enter unpaid-draft extension path.

------------------------------------------------------------------------

## 4.15 `transactions`

**Purpose:** canonical commercial transaction/ledger fact.

**Must snapshot provider-independent commercial facts required by File
01**, including amount/currency/tier/product/entitlement intent as
applicable.

**Rules:** - server calculates price; - original transaction is not
deleted on refund/chargeback/reversal; - browser callback does not fund
transaction; - generic update cannot mutate commercial facts; - state
transition is idempotent.

------------------------------------------------------------------------

## 4.16 `payment_attempts`

**Purpose:** provider checkout/create attempt and recovery identity.

**Rules:** - idempotency key + intent fingerprint; - same key +
different intent rejected; - ambiguous provider timeout recovers same
attempt; - Snap/redirect secret must not be logged; - provider
identifiers remain linked to local commercial transaction.

------------------------------------------------------------------------

## 4.17 `payment_provider_events`

**Purpose:** provider event ledger/dedupe/reconciliation evidence.

**Rules:** - signature verified before trusted processing; - provider
facts verified against Status API according to File 01; -
duplicate/out-of-order events safe; - raw payload retention/redaction
must follow security/privacy policy; - applied event must not duplicate
entitlement.

------------------------------------------------------------------------

## 4.18 `leads`

**Purpose:** acquisition/lead data only where File 03 flow actually
collects it.

**Rules:** - collect minimum necessary data; - personalized preview
before auth must not silently create private DB/upload state; - lead
data is not invitation/auth authority.

------------------------------------------------------------------------

## 4.19 `global_settings`

**Purpose:** trusted operational/product configuration explicitly
allowed by File 01.

**Rules:** - not a dumping ground for business state; -
security-critical configuration changes require appropriate
authorization/audit; - secrets remain environment/secret manager
concerns, not ordinary settings rows.

------------------------------------------------------------------------

## 4.20 `media_assets`

**Purpose:** canonical media metadata/state.

Conceptual contract includes: - invitation/owner relation; - media
type; - processing state; - storage object identity; - derived
representation metadata; - focal point (`focus_x`, `focus_y`) where
defined; - processing `version` distinct from invitation
`content_version`.

**Rules:** - only READY derived media can be served; -
quarantine/rejected/deleted is never public; - replacement failure
preserves previous READY asset; - path/object ID is not authorization.

------------------------------------------------------------------------

## 4.21 `invitation_gallery_items`

**Purpose:** ordered association of invitation gallery content.

**Rules:** - references valid media; - reorder transactional; - renderer
only receives allowed READY media; - gallery allowance enforced by
domain/tier policy, not theme CSS.

------------------------------------------------------------------------

## 4.22 `upload_reservations`

**Purpose:** atomic quota/concurrency reservation before direct upload.

**Rules:** - prevents two-tab quota overshoot; - reservation
expires/releases according to canonical policy; - reservation is not
proof that uploaded bytes are safe; - server/worker still validates
content.

------------------------------------------------------------------------

## 4.23 `outbox_events`

**Purpose:** transactional DB→queue reliability.

**Contract:** business mutation + outbox insert occur in one DB
transaction.

Recommended conceptual fields: - event ID; - aggregate/resource
identity; - event type; - payload version; - minimal payload; - created
timestamp; - dispatch/lease metadata; - attempt/error metadata as
required.

**Rules:** - dispatcher can reclaim expired lease; - duplicate queue
publish is acceptable because consumer is idempotent; - payload contains
no unnecessary secret/PII.

------------------------------------------------------------------------

## 4.24 `failed_jobs`

**Purpose:** terminal failed-job ledger after bounded retries.

**Rules:** - poison jobs do not retry forever; - operator can
inspect/retry safely; - retry uses idempotency/authoritative DB reread.

------------------------------------------------------------------------

## 4.25 `scheduled_job_runs`

**Purpose:** scheduler heartbeat/run observability and dedupe where
required.

**Rules:** - cron is a scanner, not business authority; - overlapping
run must be safe; - lifecycle correctness uses authoritative timestamps.

------------------------------------------------------------------------

## 4.26 Supporting operational tables

File 01 §4.17/§18--20 defines supporting contracts for: - data export; -
deletion/tombstone; - email delivery/event tracking; - payment
adjustment; - analytics.

Implement only the tables required by activated capability, but do not
invent alternate state in Redis/queue/provider.

------------------------------------------------------------------------

# 5. Relationship & Delete Policy Checklist

For every FK migration:

-   [ ] ownership path is explicit;
-   [ ] `ON DELETE` behavior is intentional;
-   [ ] FK lookup/delete path indexed;
-   [ ] deleting parent cannot bypass retention/audit/payment
    obligations;
-   [ ] credential/history cleanup follows security policy;
-   [ ] Storage object deletion is done via Storage API, not direct
    mutation of `storage.objects`;
-   [ ] Auth user deletion occurs only after required
    application/storage cleanup.

Do not cascade-delete financial/audit facts merely for convenience.

------------------------------------------------------------------------

# 6. RLS / GRANT Matrix

This is a conceptual implementation matrix; exact policy SQL remains
migration-owned.

  -----------------------------------------------------------------------------------
  Resource              anon           authenticated   admin/support   trusted server
                                       owner                           
  --------------------- -------------- --------------- --------------- --------------
  user profile safe     no/direct      own safe        scoped          yes
  fields                limited        projection                      

  tiers/themes public   safe read      safe read       managed scope   yes
  catalog               projection                                     

  invitations           public         own rows        scoped grant    yes
                        projection                     only            
                        only                                           

  PIN                   no             no raw read     no raw          yes
  credentials/history                                  credential      

  guests                no raw access  owner-scoped    scoped          yes
                                       safe access                     

  guest credentials     no             no raw          excluded        yes
                                       secret/hash                     
                                       projection                      

  transactions          no             owner-safe      audited scope   yes
                                       projection                      

  provider events       no             no raw access   operational     yes
                                                       scope           

  media metadata        public         own             scoped          yes
                        projection                                     
                        only                                           

  audit/incidents       no             sanitized       governed        yes
                                       activity only                   

  outbox/jobs           no             no              operational     yes
                                                       scope           
  -----------------------------------------------------------------------------------

Any broader policy requires explicit security review.

------------------------------------------------------------------------

# 7. Mutation Classes

## Class A --- Generic content autosave

May update only allowlisted invitation content.

Must not update: - payment; - entitlement; - PIN/security; - privacy
revocation semantics; - lifecycle; - privileged role; - credential; -
commercial facts.

Uses: `expected_content_version → atomic CAS → new_content_version`.

## Class B --- Dedicated sensitive/business action

Examples: - privacy toggle; - PIN reset/rotation; - theme action that
changes checkout target; - publish; - payment cancel; - support grant; -
role change; - permanent delete.

Requires operation-specific: auth + ownership + state/version +
re-auth/idempotency/provider verification as applicable.

## Class C --- Public guest mutation

RSVP/wishes only through explicit endpoint/RPC with: - authorization
mode; - token/private-session checks as applicable; - rate limit; -
field whitelist; - server validation; - safe response projection.

## Class D --- Provider/system mutation

Webhook/queue/cron/worker: - authenticated/verifiable source; -
idempotent; - guarded transition; - authoritative DB reread; - minimal
payload; - audit/observability.

------------------------------------------------------------------------

# 8. Atomicity Contracts

The following must not be split into unrelated best-effort writes:

### Invitation creation

Parent + required initial state created atomically/idempotently.

### Editor CAS

Version check and content update in one atomic statement/transaction.

### Reorder

Position changes transactionally avoid uniqueness collision.

### Payment funded transition

Verified provider fact + transaction transition + entitlement
application are atomic according to File 01.

### Outbox

Business mutation + outbox insert share transaction.

### Upload reservation

Quota/concurrency reservation atomic before upload.

### Governance

Approval/role transition/audit follows canonical transaction boundary.

------------------------------------------------------------------------

# 9. Indexing Rules

At minimum review indexes for: - every foreign key used in
ownership/join/delete path; - invitation owner; - invitation slug/public
resolver; - invitation lifecycle/expiry due scan; - guest invitation
relation; - hashed guest credential lookup; - transaction
owner/invitation/order/provider identifiers; - payment event
dedupe/provider identifiers; - media invitation/state; - outbox
pending/lease scan; - failed-job operational query; - scheduled
due/heartbeat queries; - security incident active/dedupe queries.

Avoid duplicate/redundant indexes. Run Supabase/Postgres advisor and
inspect query plans for critical paths.

------------------------------------------------------------------------

# 10. JSONB Contract

JSONB is allowed only where flexible structured content is intentional.

Rules: - define TypeScript/Zod schema; - validate every server
mutation; - version queue payloads; - do not place credentials/secrets
in content JSONB; - do not use JSONB to avoid relational integrity for
payment, credential, guest authority, or lifecycle facts; - entitlement
snapshot is immutable historical commercial evidence except through
explicit audited adjustment semantics; - theme visual configuration
cannot become hidden owner/business state.

------------------------------------------------------------------------

# 11. Migration Order

Recommended dependency order:

``` text
001 extensions / helper types
002 user_profiles
003 tiers
004 themes
005 invitations
006 invitation_events
007 credentials
008 guests + guest_credentials
009 security/governance
010 transactions/payment
011 media
012 reliability/outbox/jobs
013 export/deletion/email/analytics support
014 RLS + GRANT hardening
015 RPC / SECURITY DEFINER functions
016 seed canonical tiers/themes
017 verification indexes/advisor fixes
```

Actual numbering may differ. Never reorder already-applied production
migrations; create forward migrations.

------------------------------------------------------------------------

# 12. Database Test Matrix

Every production migration set should prove:

### Authorization

-   anon;
-   owner A;
-   owner B;
-   admin;
-   super-admin/support grant;
-   trusted server.

### Critical invariants

-   cross-owner IDOR fails;
-   credential/hash disclosure fails;
-   stale `content_version` fails;
-   duplicate payment event is safe;
-   entitlement applies once;
-   guest raw-table anonymous access fails;
-   private media resolver fails without authorization;
-   upload reservation prevents quota race;
-   outbox duplicate delivery is safe;
-   expiry timestamp blocks invalid action even before cron status sync.

### Recovery

-   transaction rollback leaves no half-created aggregate;
-   dispatcher lease recoverable;
-   duplicate provider/queue request does not duplicate side effect;
-   deletion tombstone remains effective through restore procedure.

------------------------------------------------------------------------

# 13. Schema Change Protocol

Any schema change that affects domain behavior must:

1.  update File 01 first if canonical contract changes;
2.  update migration;
3.  update Zod/TypeScript contract;
4.  update RLS/GRANT;
5.  update integration tests;
6.  update File 02 evidence mapping if security affected;
7.  update File 04 if new failure/recovery behavior exists;
8.  update this reference;
9.  provide forward-recovery/rollback strategy.

File 07 must never be used to silently override File 01.

------------------------------------------------------------------------

# 14. Contractor Handoff Checklist

Before a database work package is accepted:

-   [ ] migration committed;
-   [ ] migration applies from clean DB;
-   [ ] migration applies as forward change from previous baseline;
-   [ ] RLS/GRANT tests pass;
-   [ ] FK/index review complete;
-   [ ] Zod/domain schema updated;
-   [ ] generated/database TypeScript types refreshed if project uses
    them;
-   [ ] no service credential in browser;
-   [ ] no raw secret/PII in logs;
-   [ ] concurrency/idempotency test added where applicable;
-   [ ] File 01/File 07 remain consistent;
-   [ ] security evidence linked to File 02 requirement IDs.
