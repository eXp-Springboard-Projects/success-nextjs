# Architecture Decision Records (ADRs)

> Document significant technical decisions and their rationale.  
> **Newest entries at TOP.** Format: `ADR-XXX`

---

<!-- 
=======================================================
  📝 ADD NEW ADRs BELOW THIS LINE
=======================================================
-->

## ADR-007 — Bootstrap Protocol for AI-Assisted Development (2025-12-17)

**Status:** Accepted

### Context

This project is developed with AI assistance (Claude Code, Codex CLI, etc.). Without a standardized protocol:
- Context is lost between sessions
- Decisions aren't documented
- Changes aren't tracked consistently
- New contributors (human or AI) lack project history

The project already had 100+ markdown documentation files but no structured system for tracking development sessions or architectural decisions.

### Decision

Implement a Bootstrap Protocol that requires AI agents to:
1. Create/verify documentation structure on first interaction
2. Load project context before any work
3. Declare session objectives explicitly
4. Update documentation at the end of every session

This includes four core files:
- `AGENTS.md` - Protocol instructions
- `CHANGELOG.md` - User-visible changes
- `docs/DEV_SESSION_LOG.md` - Development session records
- `docs/DECISIONS.md` - Architectural decisions (this file)

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| No protocol | No overhead | Context loss, inconsistency | Rejected: unsustainable |
| Git commits only | Built into workflow | Lacks reasoning, hard to search | Rejected: insufficient |
| Wiki-style docs | Flexible | No structure, easy to forget | Rejected: too unstructured |
| **Bootstrap Protocol** | Structured, enforceable, comprehensive | Some overhead per session | Selected: best balance |

### Consequences

**Positive:**
- Consistent documentation across all sessions
- Clear context for future AI/human developers
- Audit trail of all changes and decisions
- Easier onboarding and handoffs

**Negative:**
- Adds ~5 minutes overhead per session for documentation

**Neutral:**
- Documentation style now standardized to ISO 8601 timestamps

### Related

- Code: `AGENTS.md`, `CHANGELOG.md`, `docs/DEV_SESSION_LOG.md`

---

## ADR-006 — Domain-Restricted Staff Authentication (2025-01-10)

**Status:** Accepted

### Context

Staff members need secure access to the admin dashboard. Requirements:
- Only SUCCESS Magazine employees should have access
- Easy onboarding for new staff
- Strong security without complex setup
- Forced password changes for security

### Decision

Implement authentication with:
1. **Domain restriction**: Only @success.com emails can register/login
2. **Default password system**: All new staff get `SUCCESS123!` as temporary password
3. **Forced password change**: Staff must change password before accessing admin
4. **Self-registration**: Staff can register themselves at /register
5. **Invite codes**: External contributors can be invited with codes

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Email/password only | Simple | Anyone can register | Rejected: not secure |
| OAuth (Google Workspace) | SSO convenience | Requires Google setup | Deferred: future enhancement |
| IP whitelist | Very secure | Inflexible, VPN issues | Rejected: too restrictive |
| **Domain restriction + default pwd** | Secure, easy onboarding | Temporary password visible | Selected: good balance |

### Consequences

**Positive:**
- Only @success.com employees can access
- Easy onboarding (self-registration)
- Security enforced (password change required)
- No external service dependencies

**Negative:**
- Default password is known (but must be changed)
- No 2FA (yet)

### Related

- Code: `lib/auth-validation.ts`, `pages/api/auth/register.ts`
- Docs: `AUTHENTICATION_SYSTEM_COMPLETE.md`

---

## ADR-005 — Prisma ORM with PostgreSQL (2025-01-06)

**Status:** Accepted

### Context

Platform needs a robust database layer for users, content, subscriptions, CRM, analytics, and operations. Options considered: raw SQL, Knex.js, TypeORM, Prisma.

### Decision

Use Prisma ORM with PostgreSQL:
- Type-safe database queries with auto-generated types
- Declarative schema with migrations
- Excellent Next.js and Vercel integration
- Connection pooling via Prisma Accelerate for serverless

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Raw SQL | Full control | No type safety, manual queries | Rejected: too error-prone |
| Knex.js | Lightweight | Limited TypeScript | Rejected: want full types |
| TypeORM | Mature, decorators | Complex, poor Vercel support | Rejected: complexity |
| **Prisma** | Type-safe, great DX | Learning curve, schema DSL | Selected: best for Next.js |

### Consequences

**Positive:**
- Auto-generated TypeScript types
- Easy migrations and schema changes
- Excellent Vercel Postgres integration
- Prisma Studio for database browsing

**Negative:**
- Raw queries needed for complex operations
- Some N+1 query potential

### Related

- Code: `prisma/schema.prisma`, `lib/prisma.js`

---

## ADR-004 — WordPress as Headless CMS (2025-01-05)

**Status:** Accepted

### Context

SUCCESS Magazine has years of content in WordPress. Options:
1. Migrate all content to new CMS
2. Use WordPress as headless CMS
3. Build custom content database

### Decision

Use WordPress as headless CMS via REST API:
- Fetch content from https://www.success.com/wp-json/wp/v2
- Use ISR (Incremental Static Regeneration) with 10-minute revalidation
- Automated cron jobs sync content daily
- Plan future migration to Prisma database

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Full migration | Clean break | Risky, time-consuming | Rejected: too risky now |
| Keep WordPress frontend | No work needed | Slow, outdated | Rejected: defeats purpose |
| **Headless WordPress** | Keep content, new frontend | Two systems to maintain | Selected: pragmatic |
| Custom CMS | Full control | Build from scratch | Rejected: not needed |

### Consequences

**Positive:**
- Existing content immediately available
- Staff continue using familiar WordPress admin
- Fast modern frontend with ISR
- Gradual migration possible

**Negative:**
- Cannot edit content from Next.js admin (read-only)
- Need WordPress Application Password for write access

### Related

- Code: `lib/wordpress.js`, `pages/blog/[slug].tsx`
- Docs: `CLAUDE.md`

---

## ADR-003 — Next.js Pages Router (2025-01-04)

**Status:** Accepted

### Context

Next.js offers two routing systems: Pages Router (stable) and App Router (newer). Need to choose one for the project.

### Decision

Use Pages Router for this project:
- More mature and stable
- Better ISR support at the time
- More documentation and examples
- Team familiarity

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **Pages Router** | Stable, mature, familiar | Older patterns | Selected: reliability |
| App Router | Server components, newer | Less stable, learning curve | Rejected: too new at start |

### Consequences

**Positive:**
- Stable, predictable behavior
- Plenty of documentation
- ISR works reliably

**Negative:**
- Missing some newer React features
- May need migration later

### Related

- Code: All `pages/*.tsx` files

---

## ADR-002 — NextAuth.js for Authentication (2025-01-04)

**Status:** Accepted

### Context

Need authentication system supporting:
- Email/password login
- JWT sessions (stateless)
- Role-based access control
- Potential OAuth in future

### Decision

Use NextAuth.js with credentials provider:
- JWT-based sessions stored in HTTP-only cookies
- Credentials provider for email/password
- Session includes user role for RBAC
- Easy to add OAuth providers later

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Custom auth | Full control | Security risks, time | Rejected: don't reinvent |
| Auth0 | Enterprise features | Cost, vendor lock-in | Rejected: overkill |
| Clerk | Modern DX | Cost, less flexible | Rejected: cost |
| **NextAuth.js** | Free, flexible, popular | Some complexity | Selected: best fit |

### Consequences

**Positive:**
- Free and open source
- Great Next.js integration
- Flexible provider system
- Active community

**Negative:**
- Manual role management
- Some configuration complexity

### Related

- Code: `pages/api/auth/[...nextauth].ts`

---

## ADR-001 — Vercel for Deployment (2025-01-04)

**Status:** Accepted

### Context

Need hosting platform for Next.js application with:
- Automatic deployments from GitHub
- Serverless functions support
- Edge caching
- Easy environment management
- PostgreSQL database

### Decision

Use Vercel for deployment:
- Purpose-built for Next.js
- Automatic deployments on push
- Built-in cron jobs
- Vercel Postgres for database
- Generous free tier

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| AWS Amplify | AWS ecosystem | Complex setup | Backup option |
| Netlify | Good DX | Less Next.js features | Rejected: less optimized |
| Self-hosted | Full control | Maintenance burden | Rejected: not needed |
| **Vercel** | Best Next.js support | Vendor lock-in | Selected: optimal |

### Consequences

**Positive:**
- Zero-config deployments
- Excellent performance
- Built-in analytics
- Great developer experience

**Negative:**
- Some vendor lock-in
- Costs scale with usage

### Related

- Code: `vercel.json`
- Docs: `VERCEL_DEPLOYMENT.md`

---

<!-- 
=======================================================
  📝 ADD NEW ADRs ABOVE THIS LINE  
=======================================================
-->

---

## 📋 ADR Template (for AI reference)

<!--
Copy this template for each new decision:

## ADR-XXX — [Decision Title] (YYYY-MM-DD)

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX

### Context

What situation, problem, or question prompted this decision?  
What constraints or requirements exist?

### Decision

What we decided to do. Be specific.

### Alternatives Considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| Option A | ... | ... | Rejected: [reason] |
| Option B | ... | ... | Rejected: [reason] |
| **Chosen** | ... | ... | Selected: [reason] |

### Consequences

**Positive:**
- [benefit]

**Negative:**
- [tradeoff]

**Neutral:**
- [implication]

### Related

- Code: `path/to/implementation`
- Docs: `docs/related-doc.md`
- Issue: #XXX

---
-->

---

## When to Write an ADR

Create an ADR when:
- ✅ Choosing between frameworks, libraries, or tools
- ✅ Establishing new patterns or conventions  
- ✅ Making breaking changes
- ✅ Deviating from existing patterns
- ✅ Trade-offs that future devs should understand
- ✅ Security or compliance decisions
