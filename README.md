# Event-Driven E-Commerce Platform

An enterprise-grade, event-driven microservices e-commerce platform built with **TypeScript**, **Node.js (Fastify 4)**, **Next.js 14**, **Kafka / Redpanda**, **BullMQ**, and a **Supabase PostgreSQL** persistence layer (logically isolated with one schema per service). Events travel through a **transactional outbox** with guaranteed at-least-once delivery; authentication and identity are managed via **Supabase Auth** with offline JWKS verification, RBAC, Redis-backed rate limiting, and an end-to-end defense-in-depth API perimeter.

---

## Workspace & Service Architecture

| Package | Port | Role & Technology |
|---|---|---|
| `packages/gateway` | 5460 | API Gateway: reverse proxy, CORS, load-nothing CSP, rate limiting, correlation ID tracing, JWKS token verification |
| `packages/admin` | 5461 | Admin Portal: React 18 + Vite SPA, TOTP MFA gate, role permissions matrix, live queue/event inspection, sales rankings |
| `packages/client` | 5462 | Storefront: Next.js 14 (App Router SSR), Tailwind CSS, Zustand, TanStack Query, Stripe / PayPal checkout UI |
| `packages/ms-user` | 5463 | User & Identity: Fastify, Prisma (schema `ms_user`), Supabase Auth proxy & webhook hooks, profile & audit log management |
| `packages/ms-product` | 5464 | Product Catalog: Fastify, PostgreSQL JSONB documents (schema `ms_product`), Elasticsearch search, Redis cache-aside, S3/RustFS |
| `packages/ms-order` | 5465 | Order & Payments: Fastify, Prisma (schema `ms_order`), BullMQ sagas, price verification, transactional outbox relay |
| `packages/ms-inventory` | 5466 | Inventory: Fastify, PostgreSQL (schema `ms_inventory`), row-locked reservations, Kafka consumer, outbox relay |
| `packages/ms-analytics` | 5467 | Analytics & Rankings: Fastify, PostgreSQL (schema `ms_analytics`), real-time Redis ZSET leaderboards, Kafka consumer |
| `packages/shared/*` | — | Shared libraries: `constants`, `types`, `utils`, `database`, `messaging`, `security` |
| `packages/tests` | — | Performance & stress test harness (BullMQ queue drain, Kafka fan-out latency) |
| `packages/scripts` | — | Kubernetes manifests, Prisma environment derivation, ETL migration tooling |

---

## Key Architectural Highlights

1. **Transactional Outbox & Exactly-Once Semantics**:
   - `ms-order` and `ms-inventory` write domain events (`order.created`, `order.confirmed`, `order.cancelled`, `inventory.reserved`, `payment.captured`) into an `outbox_events` table within the same PostgreSQL ACID transaction as business changes.
   - Background `OutboxRelay` instances drain rows using `SELECT ... FOR UPDATE SKIP LOCKED` and database-clock leases to ensure at-least-once, partition-key-ordered delivery to Kafka.
   - Downstream consumers (`ms-inventory`, `ms-analytics`) claim events in a `processed_events` ledger within the consumer's database transaction to ensure idempotent processing.
2. **Perimeter Defense & Security Defense Layer (`@ecommerce/shared-security`)**:
   - **Identity**: Supabase Auth (GoTrue) integration; offline token verification using Supabase JWKS (asymmetric ES256); short-lived HS256 tokens for inter-service communication.
   - **RBAC**: 4 distinct roles (`ADMIN`, `VENDOR`, `CUSTOMER`, `SERVICE`) with resource-scoped permissions (`resource:action[:scope]`) and `requireOwnerOrAny` ownership protection against BOLA/IDOR.
   - **Rate Limiting**: Multi-tiered rate limiters (by IP, user, email, search query) backed by Redis (with in-memory fallback) and fail-fast timeouts.
   - **Rollout Modes**: Configurable `AUTH_ENFORCE` and `RATE_LIMIT_ENFORCE` switches (`report` for log-only monitoring or `enforce` for blocking).
3. **Price-Safe Product Caching (`ProductCache`)**:
   - Redis cache-aside for `GET /api/v1/products/:id` with single-flight request coalescing and distributed locks (`lock:fetch:product:{id}`) to prevent cache stampedes.
   - Dual-step invalidation (immediate DEL + delayed second DEL) to eliminate stale writes from database replication lag.
   - Service identity bypass: `ms-order`'s server-side `PriceVerifier` explicitly bypasses cache to evaluate authoritative database prices during checkout.
4. **Real-Time Windowed Sales Rankings (`RankingEngine`)**:
   - `ms-analytics` maintains sliding-window sales leaderboards in Redis Sorted Sets (`ZSET`), updated directly from consumed `order.created` events.
   - Persistent `sales_lines` PostgreSQL table allows full ZSET rebuilds, with automated background timer pruning.
5. **Observability & End-to-End Correlation**:
   - Unified `x-correlation-id` propagation across HTTP headers, BullMQ jobs, and Kafka event envelopes via Node.js `AsyncLocalStorage`.
   - Structured JSON logging with Pino (Loki-ready) and Prometheus `/metrics` endpoints.

---

## Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **pnpm**: v10.0.0+ (`corepack enable pnpm`)
- **Docker & Docker Compose** (for local backing infrastructure)
- **Supabase Project**: PostgreSQL connection string (`SUPABASE_DB_URL`) and API keys

### Setup

1. **Clone repository and configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your SUPABASE_URL, SUPABASE_DB_URL, SUPABASE_ANON_KEY, and SERVICE_AUTH_SECRET
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Generate Prisma clients**:
   ```bash
   pnpm run db:generate
   ```

4. **Start backing infrastructure (Redis, Kafka, Elasticsearch, S3)**:
   ```bash
   # If using sibling infra-hub or local compose:
   docker-compose up -d
   ```

5. **Run all services in development mode**:
   ```bash
   pnpm run dev
   ```
   Or run backend services only:
   ```bash
   pnpm run dev:backend
   ```

---

## Service Endpoints & Swagger Documentation

Each Fastify microservice exposes an OpenAPI 3.0 specification and Swagger UI:

| Service | Base URL | Swagger UI Docs |
|---|---|---|
| **API Gateway** | `http://localhost:5460` | `http://localhost:5460/api-docs` |
| **Admin Portal** | `http://localhost:5461` | — |
| **Client Storefront**| `http://localhost:5462` | — |
| **User Service** | `http://localhost:5463` | `http://localhost:5463/api-docs` |
| **Product Service** | `http://localhost:5464` | `http://localhost:5464/api-docs` |
| **Order Service** | `http://localhost:5465` | `http://localhost:5465/api-docs` |
| **Inventory Service**| `http://localhost:5466` | `http://localhost:5466/api-docs` |
| **Analytics Service**| `http://localhost:5467` | `http://localhost:5467/api-docs` |

---

## Operational Scripts

```bash
# Build
pnpm run build                # Build all packages in topological order
pnpm run build:shared         # Build @ecommerce/shared-* packages only

# Testing & Quality
pnpm test                     # Run all unit and integration test suites
pnpm run test:watch           # Run tests in watch mode
pnpm run lint                 # Check ESLint rules across workspace
pnpm run lint:fix             # Autofix linting violations
pnpm run format               # Format code with Prettier

# Database & Migrations
pnpm run db:generate          # Run prisma:generate for ms-user and ms-order
pnpm run db:migrate           # Run Prisma migrations against target schemas

# Security Tooling
pnpm run totp                 # Generate dev TOTP code for Admin MFA testing

# Stress & Load Testing
pnpm run stress               # Run queue and event stress suites
pnpm run stress:queues        # Stress test BullMQ task workers
pnpm run stress:events        # Stress test Kafka outbox fan-out and consumer lag
```

---

## Documentation Index

| Topic | Document |
|---|---|
| Getting Started, Docker & Workspace Setup | [docs/getting-started.md](docs/getting-started.md) |
| Database Schemas, Outbox & Idempotency | [docs/database.md](docs/database.md) |
| Security, Auth, RBAC & Rate Limiting | [docs/security.md](docs/security.md) |
| Distributed Task Queues (BullMQ) | [docs/task-queues.md](docs/task-queues.md) |
| Event Backbone (Kafka / Redpanda) | [docs/events-kafka.md](docs/events-kafka.md) |
| Ports, Caches, Search & Observability | [docs/infrastructure.md](docs/infrastructure.md) |
| Deployment & CI/CD Pipelines | [docs/deployment.md](docs/deployment.md) |
| Testing & Performance Benchmarks | [docs/testing.md](docs/testing.md) |
| **Full Architecture Notes & Design Patterns** | [Architecture Notes](docs/architecture.md) |

---

## License

MIT License. See [LICENSE](LICENSE) for details.
