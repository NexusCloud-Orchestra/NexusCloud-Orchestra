# NexusCloud — Project Context Document

> **Version**: 1.0.0  
> **Last Updated**: October 2026  
> **Classification**: Internal — Engineering & Product  
> **Authors**: NexusCloud Orchestra Team

---

## 1. Executive Summary

**NexusCloud** is a multi-cloud storage orchestration platform that unifies fragmented free-tier cloud storage into a single, intelligent virtual drive. By leveraging a **Bring-Your-Own-Cloud (BYOC)** architecture, NexusCloud enables users to aggregate **70+ GB of always-free storage** across major cloud providers — without NexusCloud ever touching, storing, or proxying user file data.

The platform acts as a **control plane** — orchestrating metadata, routing decisions, quota tracking, and presigned URL generation — while the **data plane** (actual file bytes) flows directly between the user's browser and their cloud provider via presigned URLs. This **Zero Data Touch** design eliminates bandwidth costs, reduces latency, simplifies compliance, and makes the platform operationally lean.

---

## 2. The Problem

### 2.1 Market Pain Points

Cloud storage is abundant, but fragmented:

- **Every major provider offers free tiers**, but each is small (5–25 GB) and siloed behind its own console, SDK, and authentication scheme.
- **Individual users** cannot realistically manage credentials, quotas, and file distribution across 5–7 different cloud dashboards.
- **Small teams and developers** pay for storage that sits idle on one provider while another's free tier is untouched.
- **Students and price-sensitive users** in emerging markets (India, Southeast Asia, Africa) need storage but cannot justify even \$5/month subscriptions.

### 2.2 Why Existing Solutions Fail

| Solution | Limitation |
|---|---|
| **Google Drive / Dropbox / OneDrive** | Single-provider lock-in; free tier capped at 5–15 GB |
| **MultCloud / Rclone** | Manual sync tools; no intelligent routing or unified quota |
| **Self-hosted (Nextcloud)** | Requires infrastructure; user bears all storage costs |
| **Cyberduck / Mountain Duck** | Desktop-only; file browser without orchestration logic |

**NexusCloud fills the gap**: an intelligent orchestration layer that treats multiple clouds as one pooled drive with automatic routing, zero egress cost optimization, and a consumer-grade UI.

---

## 3. The Solution — How NexusCloud Works

### 3.1 Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │  React    │───▶│  API Gateway │───▶│  Presigned URL Engine │  │
│  │  Frontend │    │  (FastAPI)   │    │  (Zero Data Touch)    │  │
│  └──────────┘    └──────┬───────┘    └───────────┬───────────┘  │
│                         │                         │              │
│                         ▼                         ▼              │
│               ┌─────────────────┐      ┌──────────────────┐     │
│               │   Smart Router  │      │  Direct Upload/  │     │
│               │   (Scoring Algo)│      │  Download via     │     │
│               └────────┬────────┘      │  Presigned PUT/  │     │
│                        │               │  GET URLs        │     │
│                        ▼               └────────┬─────────┘     │
│               ┌─────────────────┐               │               │
│               │  Quota Engine   │               │               │
│               │  (PostgreSQL +  │               │               │
│               │   Redis Cache)  │               │               │
│               └─────────────────┘               │               │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                    ┌─────────────────────────────┼──────────────┐
                    │         CLOUD PROVIDERS      │              │
                    │                              ▼              │
                    │  ┌─────┐ ┌──────┐ ┌─────┐ ┌──────┐        │
                    │  │ AWS │ │Azure │ │ GCP │ │  R2  │ ...    │
                    │  │ S3  │ │ Blob │ │ GCS │ │      │        │
                    │  └─────┘ └──────┘ └─────┘ └──────┘        │
                    └────────────────────────────────────────────┘
```

### 3.2 Key Design Principles

1. **Zero Data Touch**: File bytes never transit NexusCloud servers. The platform generates presigned URLs; uploads/downloads happen directly between browser and cloud provider.

2. **Smart Router Scoring**: When a user uploads a file, the Smart Router evaluates all connected clouds and selects the optimal destination using a weighted scoring formula:

   $$\text{Score} = (\text{Free Quota Left} \times 0.40) + (\text{Egress Cost} \times 0.30) + (\text{Tier Permanence} \times 0.20) + (\text{File-to-Quota Fit} \times 0.10)$$

3. **BYOC (Bring Your Own Cloud)**: Users supply their own cloud credentials. NexusCloud encrypts them with AES-256-GCM and uses them solely to generate presigned URLs and manage object lifecycle.

4. **Atomic Quota Integrity**: File creation and quota deduction occur in a single database transaction. File deletion and quota reclamation are similarly atomic. Quota drift is architecturally impossible.

5. **Cache-Aside Performance**: Quota summaries are cached in Redis with a 15-minute TTL. Cache is proactively invalidated on any mutation (upload, delete, quota change). Database remains the source of truth with transparent fallback.

### 3.3 Supported Cloud Providers

| Provider | Free Tier | Egress Cost | Tier Type | SDK/Protocol |
|---|---|---|---|---|
| **Cloudflare R2** | 10 GB | \$0 (always free egress) | Permanent | S3-compatible (boto3) |
| **Oracle Cloud (OCI)** | 20 GB | \$0 (always free egress) | Permanent | OCI SDK |
| **Backblaze B2** | 10 GB | \$0 (via Cloudflare CDN) | Permanent | S3-compatible (boto3) |
| **Google Cloud Storage** | 5 GB | Standard GCP pricing | Permanent | google-cloud-storage |
| **IBM Cloud Object Storage** | 25 GB | Lite tier pricing | Permanent | S3-compatible |
| **AWS S3** | 5 GB | Standard AWS pricing | 12-month trial | boto3 |
| **Azure Blob Storage** | 5 GB | Standard Azure pricing | 12-month trial | Azure SDK |

**Combined Always-Free Pool**: **70+ GB** (aggregated across permanent free tiers).

---

## 4. Product Architecture

### 4.1 System Components

| Component | Technology | Purpose |
|---|---|---|
| **Frontend SPA** | React 18 + Vite 5 | Consumer-grade dashboard, file manager, cloud connection wizard |
| **API Gateway** | FastAPI + Uvicorn (Python 3.12) | Authentication, routing, presigned URL generation, connection management |
| **Quota Engine** | FastAPI (Python 3.13) | Storage quota tracking, file metadata, cache-aside optimization |
| **Database** | PostgreSQL 16 | Persistent storage for users, connections, files, quotas, audit logs |
| **Cache Layer** | Redis 7 | Quota summary caching (900s TTL), session data, rate limit counters |
| **Task Queue** | Celery 5.6 + Redis broker | Background jobs: quota recalculation, cache warming, notifications |
| **Rate Limiter (RLaaS)** | Java 21 + Spring Boot + Redis | Token Bucket, Sliding Window, Fixed Window algorithms |
| **Migrations** | Alembic (async) | Schema versioning and migration management |
| **Infrastructure** | Docker Compose (dev), GCP Cloud Run (prod) | Container orchestration and deployment |

### 4.2 Database Schema

```
┌──────────────────────┐        1:N        ┌───────────────────────┐
│        users         │ ────────────────▶│     cloud_connections │
│                      │                   │                       │
│ • id (PK)            │                   │ • id (PK)             │
│ • first_name         │                   │ • user_id (FK)        │
│ • last_name          │                   │ • provider (enum)     │
│ • email (unique)     │                   │ • display_name        │
│ • password (bcrypt)  │                   │ • bucket_name         │
│ • is_active          │                   │ • credentials (AES)   │
│ • plan (enum)        │                   │ • region              │
│ • created_at         │                   │ • status              │
└──────────┬───────────┘                   └───────────────────────┘
           │
           │ 1:N                 1:1
           ├──────────────────────────────┐
           │                              │
           ▼                              ▼
┌──────────────────────┐      ┌──────────────────────────┐
│     file_records     │      │         quotas           │
│                      │      │                          │
│ • id (PK)            │      │ • id (PK)                │
│ • user_id (FK)       │      │ • user_id (FK, unique)   │
│ • filename           │      │ • total_storage (bytes)  │
│ • size (BigInt)      │      │ • used_storage (bytes)   │
│ • provider           │      │ • remaining_storage      │
│ • mime_type          │      │ • updated_at             │
│ • status             │      └──────────────────────────┘
│ • connection_id (FK) │
│ • cloud_object_key   │      ┌──────────────────────────┐
│ • uploaded_at        │      │       audit_logs         │
└──────────────────────┘      │                          │
           ▲                  │ • id (PK)                │
           │                  │ • user_id (FK)           │
           │ 1:N              │ • action                 │
           └──────────────────│ • details (JSON)         │
                              │ • ip_address             │
                              │ • timestamp              │
                              └──────────────────────────┘
```

### 4.3 Authentication & Security

- **JWT Bearer Tokens**: Access tokens issued on login, stored in browser `localStorage`, sent as `Authorization: Bearer <token>` headers.
- **Password Hashing**: bcrypt via `passlib`.
- **Credential Encryption**: Cloud provider credentials are encrypted at rest using AES-256-GCM symmetric encryption (`ENCRYPTION_KEY`). NexusCloud decrypts them only at the moment of presigned URL generation, then discards the plaintext.
- **Resource Isolation**: All database queries are scoped by `user_id`. File access queries additionally filter by both `user_id` AND `file_id`, preventing horizontal privilege escalation.
- **Password Recovery**: Token-based reset flow (`forgot-password` → email token → `reset-password`).

---

## 5. User Experience

### 5.1 User Journey

```
Landing Page → Register → Login → Dashboard
                                      │
                    ┌─────────────────┼─────────────────────┐
                    │                 │                     │
                    ▼                 ▼                     ▼
             Connect Clouds    Upload Files           View Analytics
             (Step-by-Step     (Smart Router          (Storage breakdown,
              Wizard)           selects cloud)          cost savings)
                    │                 │
                    ▼                 ▼
             Manage Quotas     Download / Delete
             & Subscription    (Presigned URLs)
```

### 5.2 Key User Flows

1. **Cloud Onboarding**: User selects providers → enters credentials per provider (AWS keys, Azure connection string, GCP JSON, OCI PEM key, etc.) → NexusCloud validates and encrypts credentials → connection appears in dashboard.

2. **File Upload (Zero Data Touch)**:
   - User selects file → browser sends metadata to `/files/upload-request`
   - Smart Router scores all clouds → selects optimal provider → generates presigned PUT URL
   - Browser uploads directly to cloud via `XMLHttpRequest` with real-time progress bar
   - Browser confirms upload → quota is atomically decremented
   - Desktop notification + audio chime on completion

3. **File Download**: User clicks download → NexusCloud generates presigned GET URL → browser opens URL in new tab → file downloads directly from cloud provider.

### 5.3 Frontend Feature Set

| Feature | Description |
|---|---|
| **Dashboard** | Storage pool metrics, connected clouds count, file count, sync health, AI routing insights, activity timeline |
| **File Manager** | Upload (drag-and-drop + browse), download, delete, progress tracking, provider badges |
| **Cloud Manager** | Connect/disconnect providers, per-cloud usage bars, status indicators |
| **Storage Analytics** | Donut chart by provider, capacity breakdown, usage percentage |
| **Subscription** | Plan selection (Free/Starter/Pro/Team), provider selection matrix with plan-based caps |
| **Appearance Studio** | Theme (light/dark/system), 6 accent colors, font size/family, density, animations, sidebar modes, live preview |
| **Account Security** | Security score, 2FA, active sessions, login history, API keys, privacy controls |
| **Help & Support** | Searchable FAQs, cloud setup guides, support tickets, system status, downloads, emergency SLA |
| **Global Search** | `Ctrl+K` omnibox with keyboard navigation, history, category filtering |

---

## 6. Monetization & Pricing

### 6.1 Subscription Tiers

| Tier | Price (INR) | Connected Clouds | Storage Managed | Key Features |
|---|---|---|---|---|
| **Free** | ₹0/month | 2 | 5 GB | Basic smart routing |
| **Starter** | ₹249/month | All 7 providers | 50 GB | Full cloud pool aggregation |
| **Pro** | ₹749/month | Unlimited | Unlimited | File splitting, multi-cloud striping |
| **Team** | ₹2,499/month | Unlimited | Unlimited | 10 seats, unified admin billing |

### 6.2 Unit Economics

- **Infrastructure Cost**: ~₹1,000/month (API servers, database, Redis — no storage or bandwidth costs due to Zero Data Touch)
- **Gross Margin**: ~97% at 200 paying subscribers
- **Break-Even**: ~4 Starter subscribers or ~2 Pro subscribers

---

## 7. Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + Vite | 18.3 + 5.4 |
| **UI Routing** | react-router-dom | 6.21 |
| **Icons** | Lucide React | 1.34 |
| **API Framework** | FastAPI + Uvicorn | 0.136+ |
| **Language** | Python | 3.12 / 3.13 |
| **ORM** | SQLAlchemy (async) | 2.0+ |
| **Database** | PostgreSQL | 16 (Alpine) |
| **DB Driver** | asyncpg | 0.31+ |
| **Migrations** | Alembic | 1.18+ |
| **Cache / Broker** | Redis | 7 (Alpine) |
| **Task Queue** | Celery | 5.6+ |
| **Validation** | Pydantic v2 | 2.13+ |
| **Auth Crypto** | passlib[bcrypt] + python-jose | Latest |
| **Cloud SDKs** | boto3, google-cloud-storage | Latest |
| **HTTP Client** | httpx | 0.28+ |
| **Rate Limiter** | Java 21 + Spring Boot + Redis | Custom RLaaS |
| **Package Manager** | uv (Astral) | Latest |
| **Containerization** | Docker + Docker Compose | Latest |
| **Deployment** | GCP Cloud Run (API), Cloudflare Pages (Frontend) | — |

---

## 8. Repository Structure

```
NexusCloud/
├── main.py                      # Root entrypoint placeholder
├── pyproject.toml               # Root Python dependencies (uv)
├── uv.lock                      # Locked dependency resolution
├── alembic.ini                  # Alembic migration configuration
├── alembic/                     # Database migration scripts
│   ├── env.py                   # Async migration runner
│   └── versions/                # Versioned migration files
├── docker-compose.yml           # PostgreSQL 16 + Redis 7 services
├── Dockerfile                   # Production container (placeholder)
├── .env.example                 # Environment variable template
├── tests/
│   └── test_flow.py             # End-to-end integration tests
├── frontend/                    # React SPA
│   ├── package.json             # Node dependencies
│   ├── vite.config.js           # Vite dev server config
│   └── src/
│       ├── App.jsx              # Root app with dual-shell layout
│       ├── config.js            # API URL configuration
│       ├── services/            # API client abstractions
│       ├── context/             # React Context definitions
│       ├── provider/            # Context providers
│       ├── hooks/               # Custom React hooks
│       ├── pages/               # Route-level page components
│       ├── components/          # Reusable UI components
│       ├── css/                 # Theme stylesheets & variables
│       └── assets/              # Cloud provider SVG icons
├── quota-engine/                # Standalone Quota Engine microservice
│   ├── pyproject.toml           # Quota Engine dependencies
│   ├── .env.example             # Quota Engine env template
│   └── app/
│       ├── main.py              # FastAPI app with lifespan events
│       ├── database.py          # Async engine & session factory
│       ├── deps.py              # FastAPI dependency injection
│       ├── exceptions.py        # Domain exception hierarchy
│       ├── models.py            # SQLAlchemy ORM models
│       ├── routers/             # REST endpoint controllers
│       ├── schemas/             # Pydantic request/response schemas
│       ├── services/            # Business logic & data access
│       └── worker/              # Celery task definitions
└── storage/                     # Local file storage (dev/test)
```

---

## 9. Current State & Development Roadmap

### 9.1 What's Built (as of October 2026)

- ✅ Full React frontend with 16 pages and 40+ components
- ✅ FastAPI backend with JWT auth, CRUD, and presigned URL engine
- ✅ Quota Engine microservice with Redis cache-aside pattern
- ✅ Celery worker infrastructure with Redis broker
- ✅ PostgreSQL schema with Alembic async migrations
- ✅ Cloud connection workflows for 6 providers (AWS, Azure, GCP, OCI, B2, R2)
- ✅ End-to-end integration test suite
- ✅ Docker Compose development environment
- ✅ Comprehensive appearance/theming system
- ✅ Demo mode for frontend exploration without backend

### 9.2 Planned / In Progress

- 🔲 RLaaS rate limiter microservice (Java 21 + Spring Boot)
- 🔲 File splitting across multiple clouds (Pro tier)
- 🔲 Team workspace with multi-seat management
- 🔲 IBM Cloud Object Storage integration
- 🔲 Production Dockerfile and CI/CD pipeline
- 🔲 HashiCorp Vault integration for credential management
- 🔲 Mobile-responsive PWA enhancements
- 🔲 Real-time WebSocket sync notifications

---

## 10. Key Differentiators

1. **Zero infrastructure cost for storage** — users bring their own clouds, NexusCloud orchestrates
2. **70+ GB free** by aggregating permanent free tiers across 7 providers
3. **Zero Data Touch** — file bytes never touch NexusCloud servers (privacy, compliance, cost)
4. **Intelligent routing** — algorithmic cloud selection optimizing cost, capacity, and permanence
5. **₹0 to start** — generous free tier with a clear upgrade path
6. **Emerging market pricing** — INR-denominated plans designed for Indian and Southeast Asian users
7. **97% gross margins** — operational cost is nearly zero due to architecture

---

*This document serves as the canonical reference for understanding NexusCloud's vision, architecture, and implementation. For detailed requirements, see the accompanying PRD and BRD documents.*
