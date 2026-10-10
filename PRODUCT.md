# Product

<!-- impeccable:product-schema 1 -->

> Inferred from docs/PRD.md, README.md and the codebase. No interview answer was available in this session; items marked (inferred) need owner confirmation.

## Platform

web

## Users
Individual owners pooling the free tiers of their own cloud accounts into one drive (inferred from PRD "Bring-Your-Own-Cloud"). They connect buckets, upload and download files, and check capacity. Small teams (seats on paid plans) are a later phase.

## Product Purpose
NexusCloud is a control plane over cloud storage the user already owns. It connects AWS S3, Azure Blob, GCS, Cloudflare R2, Backblaze B2, Oracle and IBM COS, routes each upload to the best cloud, and shows pooled quota with a per-cloud breakdown. File bytes go directly between browser and cloud; NexusCloud stores only metadata.

## Positioning
Bring-your-own-cloud orchestration with zero data touch: the router scores connected clouds (capacity, egress, permanence, fit) before any byte moves.

## Operating Context
Authenticated app routes: /app (overview), /app/files, /app/clouds, /app/router (read-only placement preview), /app/quota, /app/activity (audit log), /app/settings (profile, plan, password, account deletion). Public landing page at /landing/index.html is protected and must not change. Backend API contract (/api/v1/*) is immutable.

## Capabilities and Constraints
- Credentials are encrypted at rest and never returned; the UI must never display secrets.
- Plan upgrades require billing, which is not implemented; only downgrade to Free works.
- Disconnecting a cloud and deleting an account are blocked while files remain tracked.
- Large files can stripe across two providers.
- Only data the API returns may be shown; no invented metrics, costs or routing decisions.

## Brand Commitments
Name NEXUS CLOUD, the two-peaks-over-gold-dot glyph, Syne / Instrument Sans / JetBrains Mono, night-blue ground with one gold accent (from the existing landing page and DESIGN.md).

## Evidence on Hand
No testimonials, customer logos or benchmarks exist; do not fabricate any. Provider free-tier capacities come from GET /api/v1/providers.

## Product Principles
1. Show only what the API supports; say plainly when a value is unavailable.
2. Destructive actions explain their consequence and blockers before the user commits.
3. The cloud and its capacity are the subject; chrome stays quiet.
4. Every state (loading, empty, error, expired session) has a recovery path.

## Accessibility & Inclusion
Keyboard-operable, visible focus, WCAG AA contrast, reduced-motion support (inferred standard).
