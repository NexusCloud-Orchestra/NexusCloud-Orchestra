# NexusCloud — Product Requirements Document (PRD)

> **Document Version**: 1.0.0  
> **Status**: Living Document  
> **Last Updated**: October 2026  
> **Owner**: NexusCloud Product Team  
> **Stakeholders**: Engineering, Design, Business Development, QA  
> **Classification**: Internal — Product & Engineering

---

## Table of Contents

1. [Overview & Objectives](#1-overview--objectives)
2. [Target Users & Personas](#2-target-users--personas)
3. [User Stories & Acceptance Criteria](#3-user-stories--acceptance-criteria)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [System Architecture Requirements](#6-system-architecture-requirements)
7. [API Specification](#7-api-specification)
8. [Data Models & Schema](#8-data-models--schema)
9. [UI/UX Requirements](#9-uiux-requirements)
10. [Security Requirements](#10-security-requirements)
11. [Integration Requirements](#11-integration-requirements)
12. [Testing Requirements](#12-testing-requirements)
13. [Release Criteria & Phasing](#13-release-criteria--phasing)
14. [Metrics & Success Criteria](#14-metrics--success-criteria)
15. [Open Questions & Risks](#15-open-questions--risks)

---

## 1. Overview & Objectives

### 1.1 Product Vision

NexusCloud is a multi-cloud storage orchestration platform that aggregates free-tier cloud storage from multiple providers into a single unified virtual drive. Through a **Bring-Your-Own-Cloud (BYOC)** model and **Zero Data Touch** architecture, NexusCloud enables users to manage **70+ GB of always-free storage** without NexusCloud ever handling file data directly.

### 1.2 Product Objectives

| Objective | Measurable Target | Timeline |
|---|---|---|
| **O1**: Deliver a functional multi-cloud storage platform | MVP supporting ≥3 cloud providers with end-to-end upload/download | Phase 1 |
| **O2**: Achieve zero-cost data architecture | 0 bytes of user data stored on NexusCloud infrastructure | Phase 1 |
| **O3**: Enable intelligent cloud routing | Smart Router algorithm with ≥95% optimal placement accuracy | Phase 1 |
| **O4**: Establish subscription revenue | 200 paying subscribers within 6 months of launch | Phase 2 |
| **O5**: Support team collaboration | Multi-seat team workspace with role-based access | Phase 3 |
| **O6**: Implement advanced file operations | Cross-cloud file splitting and striping for Pro/Team tiers | Phase 3 |

### 1.3 Scope

**In Scope (MVP — Phase 1):**
- User registration, authentication (JWT), and profile management
- Cloud provider connection management (AWS S3, Azure Blob, GCP GCS, Cloudflare R2, Backblaze B2, Oracle OCI)
- Smart Router file placement with presigned URL upload/download
- Storage quota tracking and enforcement with Redis caching
- Responsive React dashboard with file manager, cloud manager, and analytics
- Subscription tier selection and plan management
- Appearance customization engine

**Out of Scope (Phase 1):**
- Mobile native applications (iOS/Android)
- File versioning and conflict resolution
- Real-time collaborative editing
- Folder hierarchy and nested directory structures
- Third-party OAuth integrations (Google Sign-In, GitHub SSO)
- Automated backup and disaster recovery orchestration

---

## 2. Target Users & Personas

### Persona 1: Arjun — The Cost-Conscious Student

| Attribute | Detail |
|---|---|
| **Age** | 20 |
| **Location** | Bengaluru, India |
| **Occupation** | Computer Science undergraduate |
| **Storage Need** | 30–50 GB for coursework, projects, and media |
| **Current Solution** | Google Drive (15 GB) + scattered USB drives |
| **Pain Points** | Cannot afford paid storage; files are fragmented; runs out of space regularly |
| **Goal** | Aggregate free tiers from multiple clouds into one dashboard |
| **Plan** | Free (2 clouds, 5 GB) → Starter (₹249/mo when earnings begin) |

### Persona 2: Priya — The Freelance Designer

| Attribute | Detail |
|---|---|
| **Age** | 28 |
| **Location** | Mumbai, India |
| **Occupation** | Freelance graphic designer |
| **Storage Need** | 50–100 GB for client deliverables and asset libraries |
| **Current Solution** | Dropbox Basic (2 GB) + AWS S3 (haphazard manual management) |
| **Pain Points** | Egress costs on AWS are unpredictable; managing multiple consoles wastes time |
| **Goal** | Unified file management with smart routing to minimize costs |
| **Plan** | Pro (₹749/mo) |

### Persona 3: DevOps Team at a Startup

| Attribute | Detail |
|---|---|
| **Team Size** | 5–10 engineers |
| **Location** | Remote (India + Southeast Asia) |
| **Storage Need** | 200+ GB for build artifacts, logs, and documentation |
| **Current Solution** | AWS S3 (single provider, growing costs) |
| **Pain Points** | Vendor lock-in; no cost optimization; no centralized access control |
| **Goal** | Multi-cloud redundancy with team-wide access and quota management |
| **Plan** | Team (₹2,499/mo, 10 seats) |

---

## 3. User Stories & Acceptance Criteria

### 3.1 Authentication & Account Management

#### US-001: User Registration
> **As a** new user, **I want to** register with my name, email, and password **so that** I can create a NexusCloud account.

**Acceptance Criteria:**
- [ ] Registration form validates: first name (required), last name (required), email (valid format, unique), password (≥8 characters), confirm password (must match)
- [ ] On successful registration, user is redirected to the login page with success message
- [ ] Duplicate email returns HTTP 409 with descriptive error message
- [ ] Password is hashed with bcrypt before storage

#### US-002: User Login
> **As a** registered user, **I want to** log in with my email and password **so that** I can access my dashboard.

**Acceptance Criteria:**
- [ ] Login returns JWT `access_token` and `refresh_token`
- [ ] Tokens are stored in browser `localStorage`
- [ ] Invalid credentials return HTTP 401 with generic error (no credential enumeration)
- [ ] "Remember Me" option persists session
- [ ] Demo mode available for exploration without backend

#### US-003: Password Recovery
> **As a** user who forgot their password, **I want to** reset it via email token **so that** I can regain account access.

**Acceptance Criteria:**
- [ ] Forgot password accepts email and generates a time-limited reset token
- [ ] Reset password validates token, email, and new password (≥8 chars)
- [ ] Successful reset redirects to login after 3 seconds
- [ ] Expired/invalid tokens return appropriate error

#### US-004: Profile Viewing
> **As a** logged-in user, **I want to** view my profile details **so that** I can verify my account information.

**Acceptance Criteria:**
- [ ] Displays first name, last name, email, current plan
- [ ] 401 responses trigger automatic logout and redirect to login

### 3.2 Cloud Connection Management

#### US-005: Connect a Cloud Provider
> **As a** user, **I want to** connect my cloud storage account (AWS, Azure, GCP, R2, B2, OCI) **so that** NexusCloud can orchestrate storage across it.

**Acceptance Criteria:**
- [ ] Provider selection shows 6 options with dedicated credential forms:
  - AWS: Account ID, Access Key ID, Secret Access Key, Bucket Name, Region
  - Azure: Storage Account Name, Container Name, Account Key / Connection String
  - GCP: Project ID, Service Account JSON, Bucket Name
  - Oracle OCI: Tenancy OCID, User OCID, PEM Private Key, Key Fingerprint, Bucket Name
  - Backblaze B2: Key ID, Application Key, Bucket Name
  - Cloudflare R2: Account ID, Access Key ID, Secret Access Key, Bucket Name
- [ ] Credentials are encrypted with AES-256-GCM before database storage
- [ ] Connection is validated against the provider on creation
- [ ] Plan-based connection limits enforced (Free: 2, Starter: 7, Pro: unlimited, Team: unlimited)
- [ ] Connected cloud appears in dashboard with status indicator

#### US-006: Disconnect a Cloud Provider
> **As a** user, **I want to** remove a connected cloud account **so that** its credentials are purged and storage is no longer orchestrated.

**Acceptance Criteria:**
- [ ] Confirmation dialog before deletion
- [ ] Encrypted credentials are permanently deleted
- [ ] Quota is recalculated to exclude the disconnected provider
- [ ] Existing files on that provider remain accessible until explicitly deleted

#### US-007: Batch Cloud Onboarding
> **As a** new subscriber, **I want to** connect multiple cloud providers in sequence **so that** I can quickly set up my entire storage pool.

**Acceptance Criteria:**
- [ ] Subscription page allows selecting multiple providers (up to plan limit)
- [ ] "Connect Selected" button routes to `/connect-cloud?selected=aws,azure,gcp`
- [ ] ConnectCloud page displays step-by-step wizard ("Step 1 of 3")
- [ ] Each successful connection advances to the next provider automatically

### 3.3 File Operations

#### US-008: Upload a File
> **As a** user, **I want to** upload a file through NexusCloud's UI **so that** it is stored on the optimal cloud provider.

**Acceptance Criteria:**
- [ ] File selection via drag-and-drop or browse button
- [ ] Upload request sends metadata (`original_name`, `size_bytes`, `mime_type`) to Smart Router
- [ ] Smart Router returns `file_id`, selected `provider`, and presigned `upload_url`
- [ ] Browser uploads file directly to presigned URL (PUT) — zero proxy
- [ ] Real-time progress bar showing upload percentage via XMLHttpRequest
- [ ] On completion: confirm upload → quota atomically decremented
- [ ] Desktop notification + audio chime on upload completion
- [ ] Insufficient quota returns HTTP 400 with clear message

#### US-009: Download a File
> **As a** user, **I want to** download a file **so that** I can access it on my local device.

**Acceptance Criteria:**
- [ ] Click "Download" generates presigned GET URL from the hosting provider
- [ ] Browser opens presigned URL in new tab → direct cloud-to-browser download
- [ ] Downloaded file byte content matches original upload exactly

#### US-010: Delete a File
> **As a** user, **I want to** delete a file **so that** it is removed from the cloud and my quota is reclaimed.

**Acceptance Criteria:**
- [ ] Confirmation dialog before deletion
- [ ] File object deleted from cloud provider
- [ ] File metadata deleted from database
- [ ] Quota atomically reclaimed (used_storage decreased, remaining_storage increased)
- [ ] Cache invalidated immediately

#### US-011: View File Listing
> **As a** user, **I want to** see all my files **so that** I can browse, search, and manage them.

**Acceptance Criteria:**
- [ ] File list shows: name, provider badge, size (human-readable), upload date, status
- [ ] Files sorted by most recently uploaded
- [ ] Each file has download and delete action buttons
- [ ] Empty state displays guidance to upload first file

### 3.4 Quota & Storage Management

#### US-012: View Quota Summary
> **As a** user, **I want to** see my storage quota breakdown **so that** I know how much capacity is available.

**Acceptance Criteria:**
- [ ] Dashboard displays: total pool (bytes), used storage, remaining storage, usage percentage
- [ ] Donut chart shows proportional breakdown by cloud provider
- [ ] Data served from Redis cache (900s TTL) with DB fallback
- [ ] Quota updates reflect within 1 second after file operations (cache invalidation)

#### US-013: Upgrade/Downgrade Subscription
> **As a** user, **I want to** change my subscription tier **so that** I can access more clouds and storage capacity.

**Acceptance Criteria:**
- [ ] Subscription page displays all tiers with current plan highlighted
- [ ] Upgrade increases connection limit and storage cap immediately
- [ ] Downgrade validates current connections don't exceed new tier limit
- [ ] Plan change persists to user profile

### 3.5 Appearance & Customization

#### US-014: Customize Appearance
> **As a** user, **I want to** personalize the application's look and feel **so that** it matches my preferences.

**Acceptance Criteria:**
- [ ] Theme selection: Light, Dark, System (follows OS preference)
- [ ] Accent color: 6 presets (Blue, Green, Purple, Orange, Red, Gray)
- [ ] Font size: 12px, 14px, 16px, 18px
- [ ] Font family: Inter, System UI
- [ ] Interface density: Compact, Comfortable, Spacious
- [ ] Sidebar mode: Expanded, Icons Only
- [ ] Animations toggle: Enable/Disable
- [ ] Live preview updates in real-time before saving
- [ ] Settings persist across sessions via `localStorage`
- [ ] "Restore Defaults" button available

### 3.6 Security & Account Protection

#### US-015: Account Security Dashboard
> **As a** user, **I want to** view and manage my security settings **so that** my account remains protected.

**Acceptance Criteria:**
- [ ] Security score displayed as percentage with rating (Excellent/Good/Fair/Poor)
- [ ] Password change with current password verification
- [ ] Two-Factor Authentication (2FA) configuration
- [ ] Active sessions list with device termination
- [ ] Login history with timestamps and IP addresses
- [ ] API key generation and revocation
- [ ] Email verification status
- [ ] Recovery options management
- [ ] Notification preferences for security alerts
- [ ] Privacy controls

---

## 4. Functional Requirements

### FR-001: Smart Router Algorithm

The Smart Router MUST score all connected clouds when a file upload is requested and select the optimal destination.

**Scoring Formula:**

$$\text{Score} = (Q_{\text{free}} \times 0.40) + (E_{\text{cost}} \times 0.30) + (T_{\text{perm}} \times 0.20) + (F_{\text{fit}} \times 0.10)$$

Where:
- $Q_{\text{free}}$ = Normalized free quota remaining (0–1)
- $E_{\text{cost}}$ = Inverse normalized egress cost (0–1, lower cost = higher score)
- $T_{\text{perm}}$ = Tier permanence (1.0 for permanent free tiers, 0.5 for trial tiers)
- $F_{\text{fit}}$ = File-to-quota fit ratio (1.0 if file comfortably fits, decreasing as quota approaches capacity)

**Requirements:**
- [ ] FR-001.1: Router MUST evaluate all active connections per upload request
- [ ] FR-001.2: Router MUST reject uploads exceeding total remaining quota (HTTP 400)
- [ ] FR-001.3: Router MUST prefer providers with \$0 egress cost over paid egress
- [ ] FR-001.4: Router MUST prefer permanent free tiers over time-limited trial tiers
- [ ] FR-001.5: Router response MUST include `file_id`, `provider`, and `upload_url` within 200ms

### FR-002: Presigned URL Engine

- [ ] FR-002.1: Upload URLs MUST be provider-specific presigned PUT URLs with ≤15 minute expiry
- [ ] FR-002.2: Download URLs MUST be presigned GET URLs with ≤60 minute expiry
- [ ] FR-002.3: Credentials MUST be decrypted only at URL generation time and never logged
- [ ] FR-002.4: URL generation MUST support AWS S3, Azure Blob SAS, GCP Signed URLs, and S3-compatible protocols

### FR-003: Quota Engine

- [ ] FR-003.1: Each user MUST have exactly one quota record (1:1 relationship enforced at DB level)
- [ ] FR-003.2: File upload MUST atomically deduct from `remaining_storage` and increment `used_storage` in a single transaction
- [ ] FR-003.3: File deletion MUST atomically reclaim quota in a single transaction
- [ ] FR-003.4: Quota summary MUST be cached in Redis with 900-second TTL
- [ ] FR-003.5: Any mutation (upload, delete, quota update) MUST invalidate the Redis cache immediately
- [ ] FR-003.6: Redis failures MUST NOT block operations — transparent fallback to PostgreSQL
- [ ] FR-003.7: Negative quota values MUST be prevented (clamped to 0)

### FR-004: Subscription Enforcement

- [ ] FR-004.1: Free plan MUST limit connections to 2 and managed storage to 5 GB
- [ ] FR-004.2: Starter plan MUST allow all 7 providers and 50 GB managed storage
- [ ] FR-004.3: Pro plan MUST allow unlimited connections and unlimited storage
- [ ] FR-004.4: Team plan MUST support 10 seats with shared billing
- [ ] FR-004.5: Connection attempts exceeding plan limits MUST be rejected with plan upgrade guidance

---

## 5. Non-Functional Requirements

### NFR-001: Performance

| Metric | Requirement | Target |
|---|---|---|
| API Response Time (P95) | ≤200ms for cached endpoints, ≤500ms for DB queries | Phase 1 |
| Upload Initiation Latency | ≤300ms from request to presigned URL delivery | Phase 1 |
| Dashboard Load Time | ≤2 seconds (First Contentful Paint) | Phase 1 |
| Concurrent Users | Support ≥500 concurrent authenticated sessions | Phase 2 |
| Cache Hit Ratio | ≥85% for quota summary requests | Phase 1 |

### NFR-002: Availability & Reliability

| Metric | Requirement |
|---|---|
| Uptime SLA | 99.5% (control plane; data plane depends on cloud providers) |
| Data Durability | Metadata: PostgreSQL with WAL + point-in-time recovery |
| Graceful Degradation | Redis failure → transparent DB fallback (no user-facing errors) |
| Zero Data Loss | Atomic transactions prevent quota-file desynchronization |

### NFR-003: Scalability

| Component | Scaling Strategy |
|---|---|
| API Servers | Horizontal scaling via GCP Cloud Run autoscaling |
| Database | Vertical scaling initially; read replicas at >10K users |
| Redis | Redis Cluster at >50K cached quota entries |
| Celery Workers | Horizontal worker scaling via Redis broker |

### NFR-004: Security

- All API endpoints MUST require JWT Bearer authentication (except `/health`, `/`, auth routes)
- Passwords MUST be hashed with bcrypt (cost factor ≥12)
- Cloud credentials MUST be encrypted at rest with AES-256-GCM
- All inter-service communication MUST use HTTPS/TLS 1.3
- Rate limiting MUST be enforced on authentication endpoints (≤10 attempts/minute)
- CORS MUST be restricted to configured allowed origins
- SQL injection MUST be prevented via parameterized ORM queries (SQLAlchemy)

### NFR-005: Observability

- Application logs MUST include structured JSON with request ID, user ID, and timestamps
- Health check endpoints (`/health`, `/redis-health`) MUST be available for monitoring
- Database connection pool metrics MUST be trackable
- Error rates, latency percentiles, and throughput MUST be dashboardable

---

## 6. System Architecture Requirements

### AR-001: Service Topology

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │───▶│  API Gateway │───▶│ Quota Engine │
│  (React SPA) │     │  (FastAPI)   │     │  (FastAPI)   │
│  Cloudflare  │     │  Cloud Run   │     │  Cloud Run   │
│    Pages     │     │              │     │              │
└──────────────┘     └──────┬───────┘     └──────┬───────┘
                            │                     │
                     ┌──────┴───────┐      ┌──────┴───────┐
                     │ PostgreSQL   │      │    Redis     │
                     │    16        │◀─────│     7        │
                     └──────────────┘      └──────┬───────┘
                                                  │
                                           ┌──────┴───────┐
                                           │   Celery     │
                                           │   Workers    │
                                           └──────────────┘
```

### AR-002: Data Flow Constraints

- [ ] AR-002.1: User file bytes MUST NOT transit any NexusCloud-controlled server or network
- [ ] AR-002.2: Presigned URLs MUST be the exclusive mechanism for file transfer
- [ ] AR-002.3: Cloud credentials MUST exist in plaintext only in ephemeral memory during URL generation
- [ ] AR-002.4: Database MUST be the authoritative source of truth; Redis is a performance cache only

---

## 7. API Specification

### 7.1 Platform API (NexusCloud Orchestrator)

**Base URL**: `/api/v1`

#### Authentication Endpoints

| Method | Path | Description | Auth | Request Body | Response |
|---|---|---|---|---|---|
| `POST` | `/auth/register` | Register new user | No | `{ first_name, last_name, email, password }` | `201` User created |
| `POST` | `/auth/login` | Authenticate user | No | `{ email, password }` | `200` `{ access_token, refresh_token }` |
| `POST` | `/auth/refresh` | Rotate access token | Bearer | — | `200` `{ access_token }` |
| `GET` | `/auth/me` | Get authenticated profile | Bearer | — | `200` User profile |
| `POST` | `/auth/forgot-password` | Request password reset | No | `{ email }` | `200` Token dispatched |
| `POST` | `/auth/reset-password` | Reset password with token | No | `{ email, token, new_password }` | `200` Password updated |
| `POST` | `/auth/change-password` | Change password (logged in) | Bearer | `{ current_password, new_password }` | `200` Password changed |
| `POST` | `/auth/plan` | Update subscription plan | Bearer | `{ plan }` | `200` Plan updated |
| `GET` | `/auth/audit-logs` | Get activity audit trail | Bearer | — | `200` Log entries |

#### Connection Endpoints

| Method | Path | Description | Auth | Request Body | Response |
|---|---|---|---|---|---|
| `POST` | `/connections` | Connect cloud provider | Bearer | Provider-specific credentials | `201` Connection created |
| `GET` | `/connections` | List active connections | Bearer | — | `200` Connection list |
| `DELETE` | `/connections/{id}` | Disconnect provider | Bearer | — | `204` Deleted |

#### File Endpoints

| Method | Path | Description | Auth | Request Body | Response |
|---|---|---|---|---|---|
| `POST` | `/files/upload-request` | Request presigned upload URL | Bearer | `{ original_name, size_bytes, mime_type }` | `200` `{ file_id, provider, upload_url }` |
| `POST` | `/files/confirm-upload/{id}` | Confirm upload completion | Bearer | — | `200` File confirmed |
| `GET` | `/files` | List all files | Bearer | — | `200` File list |
| `GET` | `/files/download/{id}` | Get presigned download URL | Bearer | — | `200` `{ download_url }` |
| `DELETE` | `/files/{id}` | Delete file | Bearer | — | `204` Deleted |

#### Quota Endpoints

| Method | Path | Description | Auth | Response |
|---|---|---|---|---|
| `GET` | `/quota/summary` | Aggregated quota summary | Bearer | `200` `{ total, used, remaining, percentage, by_connection }` |

### 7.2 Quota Engine API (Microservice)

**Base URL**: `/` (standalone service)

| Method | Path | Description | Response |
|---|---|---|---|
| `GET` | `/` | API status | `200` |
| `GET` | `/health` | Liveness probe | `200` |
| `GET` | `/redis-health` | Redis connectivity | `200` |
| `POST` | `/users/` | Create user | `201` |
| `GET` | `/users/` | List all users | `200` |
| `GET` | `/users/{id}` | Get user by ID | `200` |
| `DELETE` | `/users/{id}` | Delete user (cascade) | `204` |
| `POST` | `/quota/{user_id}` | Create quota allocation | `201` |
| `GET` | `/quota/{user_id}` | Get raw quota | `200` |
| `GET` | `/quota/{user_id}/summary` | Cached quota summary | `200` |
| `PUT` | `/quota/{user_id}` | Update total storage | `200` |
| `DELETE` | `/quota/{user_id}` | Delete quota | `204` |
| `POST` | `/files/{user_id}` | Register file + deduct quota | `201` |
| `GET` | `/files/{user_id}` | List user files | `200` |
| `GET` | `/files/{user_id}/{file_id}` | Get specific file | `200` |
| `DELETE` | `/files/{user_id}/{file_id}` | Delete file + reclaim quota | `204` |

---

## 8. Data Models & Schema

### 8.1 Platform Models (NexusCloud Orchestrator)

```python
class User(Base):
    __tablename__ = "users"
    id:            Mapped[int]   # PK, auto-increment
    first_name:    Mapped[str]   # String(50), not null
    last_name:     Mapped[str]   # String(100), not null
    email:         Mapped[str]   # String(100), unique, indexed
    password:      Mapped[str]   # String(250), bcrypt hash
    is_active:     Mapped[bool]  # Boolean, default True
    plan:          Mapped[str]   # String(20), default "free"
    # Relationships: connections (1:N), file_records (1:N), audit_logs (1:N)

class CloudConnection(Base):
    __tablename__ = "cloud_connections"
    id:            Mapped[int]   # PK
    user_id:       Mapped[int]   # FK -> users.id, CASCADE
    provider:      Mapped[str]   # Enum: aws, azure, gcp, r2, b2, oracle
    display_name:  Mapped[str]   # User-friendly label
    bucket_name:   Mapped[str]   # Target bucket/container
    credentials:   Mapped[str]   # AES-256-GCM encrypted JSON blob
    region:        Mapped[str]   # Cloud region identifier

class FileRecord(Base):
    __tablename__ = "file_records"
    id:            Mapped[int]   # PK
    user_id:       Mapped[int]   # FK -> users.id, CASCADE
    filename:      Mapped[str]   # Original file name
    size:          Mapped[int]   # File size in bytes (BigInteger)
    provider:      Mapped[str]   # Cloud provider that stores the file
    mime_type:     Mapped[str]   # MIME type
    status:        Mapped[str]   # pending, active, deleted
    connection_id: Mapped[int]   # FK -> cloud_connections.id
    cloud_object_key: Mapped[str] # Object key/path in cloud bucket

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id:            Mapped[int]   # PK
    user_id:       Mapped[int]   # FK -> users.id, CASCADE
    action:        Mapped[str]   # Action performed
    details:       Mapped[str]   # JSON details
    ip_address:    Mapped[str]   # Client IP
    timestamp:     Mapped[datetime]
```

### 8.2 Quota Engine Models

```python
class User(Base):
    __tablename__ = "users"
    id:         Mapped[int]       # PK, indexed
    name:       Mapped[str]       # String(100)
    email:      Mapped[str]       # String(255), unique, indexed
    created_at: Mapped[datetime]  # server_default=func.now()
    # Relationships: files (1:N), quota (1:1)

class File(Base):
    __tablename__ = "files"
    id:          Mapped[int]      # PK, indexed
    user_id:     Mapped[int]      # FK -> users.id, CASCADE, indexed
    filename:    Mapped[str]      # String(255)
    size:        Mapped[int]      # BigInteger
    provider:    Mapped[str]      # String(50)
    uploaded_at: Mapped[datetime] # server_default=func.now()

class Quota(Base):
    __tablename__ = "quotas"
    id:                Mapped[int]  # PK, indexed
    user_id:           Mapped[int]  # FK -> users.id, CASCADE, unique (1:1)
    total_storage:     Mapped[int]  # BigInteger
    used_storage:      Mapped[int]  # BigInteger, default=0
    remaining_storage: Mapped[int]  # BigInteger
    updated_at:        Mapped[datetime]  # auto-updated
```

---

## 9. UI/UX Requirements

### 9.1 Layout Architecture

**Dual-Shell Pattern:**
- **Public Shell** (unauthenticated): Clean full-screen layouts for landing, login, register, and password recovery. Features NeuralBackground canvas animation.
- **Application Shell** (authenticated): Left sidebar (260px / 68px collapsed) + top navbar + scrollable content area.

### 9.2 Page Requirements

| Page | Required Elements | Priority |
|---|---|---|
| **Landing (Home)** | Hero section, feature grid, provider logos, pricing preview, CTAs | P0 |
| **Login** | Email/password form, demo mode button, NeuralBackground, "Forgot Password" link | P0 |
| **Register** | Name/email/password form with validation, NeuralBackground | P0 |
| **Dashboard** | 6 KPI cards, storage donut chart, recent files table, AI insights, activity timeline | P0 |
| **Files** | Upload zone (drag-and-drop), file table with actions, progress bar, notifications | P0 |
| **Clouds** | Connection cards with status/usage, link/unlink modal | P0 |
| **ConnectCloud** | Step-by-step wizard, provider-specific credential forms, queue progress | P0 |
| **Storage** | Donut chart, capacity breakdown, analytics integration | P1 |
| **Analytics** | Bandwidth stats, speed benchmarks, cost efficiency metrics | P1 |
| **Subscription** | Tier comparison cards, provider selection matrix, upgrade/downgrade | P1 |
| **Settings** | Password change form | P1 |
| **Account Security** | 12-module security dashboard (2-column layout) | P1 |
| **Appearance** | Theme/accent/font/density pickers with live preview | P2 |
| **Help & Support** | FAQ accordion, guides, ticket form, system status, downloads | P2 |
| **Profile** | Read-only user details | P2 |

### 9.3 Responsive Breakpoints

| Breakpoint | Layout Adjustments |
|---|---|
| **>1200px** | Full multi-column grid layouts, expanded sidebar |
| **992–1200px** | Reduced grid columns (6→3, 4→2) |
| **768–992px** | Single-column stacking, sidebar collapse |
| **480–768px** | Compact navbar, touch-friendly targets |
| **<480px** | Single column, full-width buttons, minimal padding |

### 9.4 Theme System Requirements

- [ ] Light/Dark/System theme toggle persisted to `localStorage`
- [ ] System mode MUST follow OS `prefers-color-scheme` media query
- [ ] 6 accent color presets applied via CSS custom properties
- [ ] Font size adjustable (12/14/16/18px) via `--base-font-size`
- [ ] Interface density affects padding, margins, and element spacing
- [ ] Animation toggle via `data-animations-enabled` attribute
- [ ] All changes preview in real-time before explicit save

### 9.5 Accessibility Requirements

- [ ] Keyboard navigation indicators
- [ ] Reduced motion support (`data-reduce-motion` / `prefers-reduced-motion`)
- [ ] High contrast mode option
- [ ] WCAG 2.1 AA color contrast ratios for all text
- [ ] Semantic HTML and ARIA labels for interactive elements

---

## 10. Security Requirements

### SEC-001: Authentication Security

- [ ] JWT tokens with configurable expiry (access: 30min, refresh: 7 days)
- [ ] bcrypt password hashing with cost factor ≥12
- [ ] Rate limiting on login endpoint (≤10 attempts/min/IP)
- [ ] No credential enumeration (generic error messages)
- [ ] Secure token rotation on refresh

### SEC-002: Data Protection

- [ ] Cloud credentials encrypted at rest with AES-256-GCM
- [ ] Encryption key stored in environment variables (→ HashiCorp Vault in production)
- [ ] Credentials decrypted only in ephemeral memory during presigned URL generation
- [ ] No credential logging in any log level
- [ ] File content never stored on NexusCloud servers

### SEC-003: Access Control

- [ ] All API endpoints (except auth/public) require valid JWT Bearer token
- [ ] Resource queries scoped by authenticated `user_id`
- [ ] File access double-scoped: `WHERE file.id = :file_id AND file.user_id = :user_id`
- [ ] Plan-based feature gating enforced server-side

### SEC-004: Infrastructure Security

- [ ] HTTPS/TLS 1.3 for all external communication
- [ ] CORS restricted to configured allowed origins
- [ ] SQL injection prevention via SQLAlchemy parameterized queries
- [ ] XSS prevention via React's default output escaping
- [ ] Sensitive environment variables excluded from version control

---

## 11. Integration Requirements

### 11.1 Cloud Provider SDKs

| Provider | SDK / Protocol | Integration Method |
|---|---|---|
| AWS S3 | `boto3` | Native SDK — `generate_presigned_url()` |
| Azure Blob | Azure Storage SDK | SAS token generation |
| GCP GCS | `google-cloud-storage` | `generate_signed_url()` |
| Cloudflare R2 | `boto3` (S3-compatible) | S3-compatible presigned URLs |
| Backblaze B2 | `boto3` (S3-compatible) | S3-compatible presigned URLs |
| Oracle OCI | OCI SDK | Pre-Authenticated Requests |

### 11.2 Infrastructure Dependencies

| Dependency | Purpose | Version | Criticality |
|---|---|---|---|
| PostgreSQL | Primary data store | 16 | Critical |
| Redis | Cache + message broker | 7 | High (degraded mode without) |
| Celery | Background task processing | 5.6 | Medium |

---

## 12. Testing Requirements

### 12.1 Test Categories

| Category | Scope | Tool | Coverage Target |
|---|---|---|---|
| **Unit Tests** | Service layer, utility functions, validators | pytest | ≥80% |
| **Integration Tests** | API endpoints, DB operations, Redis caching | pytest + httpx | Full API surface |
| **End-to-End Tests** | Complete user flows (register → upload → download → delete) | Custom test_flow.py | All critical paths |
| **Security Tests** | Auth bypass, injection, privilege escalation | Manual + automated | All auth endpoints |
| **Performance Tests** | API latency, cache performance, concurrent load | locust / k6 | P95 targets met |

### 12.2 Required E2E Test Flow

The existing `tests/test_flow.py` validates the complete lifecycle:

1. Register user → 2. Login → 3. Verify profile → 4. Connect cloud → 5. Verify connection → 6. Check initial quota → 7. Request upload → 8. Upload to presigned URL → 9. Confirm upload → 10. Verify quota decremented → 11. List files → 12. Download via presigned URL → 13. Verify byte equality → 14. Delete file → 15. Verify file removed → 16. Verify quota reclaimed → 17. Test password reset

---

## 13. Release Criteria & Phasing

### Phase 1 — MVP Foundation (Current)

| Criteria | Status |
|---|---|
| User auth (register, login, JWT, password recovery) | ✅ Complete |
| Cloud connection for ≥3 providers | ✅ Complete (6 providers) |
| Smart Router with presigned upload/download | ✅ Complete |
| Quota Engine with Redis caching | ✅ Complete |
| React dashboard with file manager | ✅ Complete |
| E2E test suite passing | ✅ Complete |
| Docker Compose dev environment | ✅ Complete |

### Phase 2 — Production Readiness

| Criteria | Status |
|---|---|
| Production Dockerfile and CI/CD pipeline | 🟡 Images, CI and registry release configured; cloud deployment pending |
| RLaaS rate limiter deployment | 🔲 Planned |
| IBM Cloud Object Storage integration | 🔲 Planned |
| Monitoring and alerting (Prometheus + Grafana) | 🔲 Planned |
| Load testing passed (500 concurrent users) | 🔲 Planned |
| Security audit completed | 🔲 Planned |

### Phase 3 — Growth Features

| Criteria | Status |
|---|---|
| File splitting across multiple clouds (Pro tier) | 🔲 Planned |
| Team workspace with RBAC (10 seats) | 🔲 Planned |
| Payment integration (Razorpay/Stripe) | 🔲 Planned |
| Folder hierarchy and directory structures | 🔲 Planned |
| Mobile PWA optimization | 🔲 Planned |
| WebSocket real-time sync notifications | 🔲 Planned |

---

## 14. Metrics & Success Criteria

### 14.1 Product Metrics

| Metric | Target | Measurement |
|---|---|---|
| **Monthly Active Users (MAU)** | 1,000 within 3 months of launch | Auth endpoint unique user count |
| **Files Uploaded / Month** | 10,000 within 3 months | File creation events |
| **Paid Conversion Rate** | ≥5% of Free → Starter/Pro | Plan change events |
| **Cloud Connections / User** | Average ≥2.5 | Connection count / active users |
| **Churn Rate (Monthly)** | <8% | Inactive subscriptions |

### 14.2 Technical Metrics

| Metric | Target | Measurement |
|---|---|---|
| **API P95 Latency** | ≤200ms (cached), ≤500ms (DB) | APM instrumentation |
| **Cache Hit Ratio** | ≥85% | Redis stats |
| **Error Rate** | <0.5% of requests | Error logging |
| **Uptime** | 99.5% | Health check monitoring |
| **Upload Success Rate** | ≥99% | Confirm-upload / upload-request ratio |

---

## 15. Open Questions & Risks

### 15.1 Open Questions

| # | Question | Owner | Status |
|---|---|---|---|
| OQ-1 | Should we support folder/directory hierarchy in Phase 2 or Phase 3? | Product | Open |
| OQ-2 | Which payment gateway for Indian market — Razorpay or Stripe India? | Business | Open |
| OQ-3 | Should file splitting chunk size be user-configurable or automatic? | Engineering | Open |
| OQ-4 | Do we need SOC 2 compliance for enterprise/team tier? | Security | Open |
| OQ-5 | Should the RLaaS rate limiter be a sidecar or standalone deployment? | Platform | Open |

### 15.2 Risk Register

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| **Cloud provider changes free tier** | High — reduces value proposition | Medium | Monitor provider announcements; maintain ≥5 alternatives; tier permanence scoring |
| **Presigned URL abuse** | Medium — unauthorized access to user files | Low | Short expiry (15 min upload, 60 min download); URLs are user-scoped |
| **Redis outage** | Low — degraded performance | Medium | Transparent DB fallback; Redis Sentinel for HA |
| **Credential breach** | Critical — user cloud access compromised | Low | AES-256-GCM encryption; planned Vault migration; credential rotation reminders |
| **Single-region failure** | High — full service outage | Low | Multi-region Cloud Run deployment (Phase 2) |

---

*This PRD is a living document. All sections are subject to revision as the product evolves. Changes are tracked via version history in the document header.*
