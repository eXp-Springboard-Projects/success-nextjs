# Architecture Decision Records (ADRs)

> Document significant technical decisions and their rationale.  
> **Newest entries at TOP.** Format: `ADR-XXX`

---

<!-- 
=======================================================
  📝 ADD NEW ADRs BELOW THIS LINE
=======================================================
-->

## ADR-001 — Bootstrap Protocol for AI-Assisted Development (2025-12-17)

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
- Requires discipline to maintain

**Neutral:**
- Documentation style now standardized to ISO 8601 timestamps

### Related

- Code: `AGENTS.md`, `CHANGELOG.md`, `docs/DEV_SESSION_LOG.md`
- Docs: This file

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

