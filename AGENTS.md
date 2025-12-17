# AGENTS.md

> This file defines the behavior-shaping agents for the platform.  
> Claude Code, Codex CLI and contributors should treat these as persistent instructions.  
> Global → Project → Subfolder files merge, with lower levels overriding.

---

## 🚀 BOOTSTRAP PROTOCOL

On first interaction with any project, ALWAYS execute this:

### Step 1: Check & Create Required Structure

```
CHECK docs/ directory
  → IF NOT EXISTS: Create docs/

CHECK docs/DEV_SESSION_LOG.md
  → IF NOT EXISTS: Create with INITIALIZATION TEMPLATE below
  
CHECK docs/DECISIONS.md  
  → IF NOT EXISTS: Create with INITIALIZATION TEMPLATE below
  
CHECK CHANGELOG.md (project root)
  → IF NOT EXISTS: Create with INITIALIZATION TEMPLATE below
```

### Step 2: Load Project Context

```
READ (in order, if they exist):
  1. AGENTS.md (if no Agents.md file create one)
  2. README.md
  3. docs/DEV_SESSION_LOG.md (last 3 entries)
  4. docs/DECISIONS.md (last 3 entries)
  5. CHANGELOG.md (Unreleased section)
  6. package.json / pyproject.toml / go.mod / Cargo.toml
  7. Any docs/*.md relevant to the task
```

### Step 3: Declare Session Context

Output this block before any work:

```
┌─────────────────────────────────────────────────────────┐
│ 🔧 BOOTSTRAP: [Complete ✅ | Files created: X, Y, Z]    │
│ 📚 Docs Loaded: [list files you read]                   │
│ 🎯 Objective: [one sentence goal for this session]      │
│ 🚫 Non-Goals: [what we're explicitly NOT doing]         │
│ ✅ Done When:                                           │
│    1. [deliverable]                                     │
│    2. [deliverable]                                     │
│    3. Documentation updated                             │
│ 📋 Plan:                                                │
│    1. [step]                                            │
│    2. [step]                                            │
│    3. [step]                                            │
│    4. Update docs (CHANGELOG, SESSION_LOG, DECISIONS)   │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 SESSION LIFECYCLE

### 🟢 Starting a Session

**Checklist:**
- □ Bootstrap Protocol complete (files exist)
- □ Read recent session logs (understand current state)
- □ Session Context block output
- □ Plan confirmed with user

### 🟡 During a Session

- □ Update plan if scope changes
- □ Ask before assuming (patterns, conventions, scope)
- □ Match existing code style EXACTLY
- □ Test changes when possible
- □ Flag blockers or concerns immediately
- □ Keep user informed of progress

### 🔴 Ending a Session

- □ Summarize what was accomplished
- □ Update CHANGELOG.md (if user-visible changes)
- □ Add entry to docs/DEV_SESSION_LOG.md
- □ Add ADR to docs/DECISIONS.md (if notable decision)
- □ List follow-up items for next session
- □ Confirm docs are saved

---

## 📝 DOCUMENTATION STANDARDS

### Required Fields

| Document | Required Fields |
|----------|-----------------|
| All | ISO 8601 Timestamp (2025-01-15T14:30:00) |
| CHANGELOG | Category, Title, Why, What, Files, Impact |
| SESSION_LOG | Context, Summary, Changes, Follow-up |
| DECISIONS | Status, Context, Decision, Alternatives, Consequences |

### Timestamp Format

```
✅ Correct: 2025-01-15T14:30:00
✅ Correct: 2025-01-15T14:30:00Z (UTC)
❌ Wrong:  Jan 15, 2025
❌ Wrong:  1/15/25
❌ Wrong:  2025-01-15 (missing time)
```

### Writing Style

```
✅ DO:
- Explain WHY, not just WHAT
- Use active voice
- Be specific and concrete
- Link to related code/docs
- Keep entries scannable

❌ DON'T:
- Write vague summaries
- Skip the reasoning
- Use jargon without context
- Write walls of text
```

---

## 💻 CODING STANDARDS

### Before Making Changes

```
1. READ the file + surrounding context first
2. IDENTIFY existing patterns:
   - Naming conventions (camelCase, snake_case, etc.)
   - File organization
   - Error handling approach  
   - Testing patterns
   - Import style
3. CHECK for existing utilities to reuse
4. CONFIRM scope—don't add unrequested features
```

### While Coding

```
✅ DO:
- Match existing style exactly
- Keep changes minimal and focused
- Reuse existing abstractions (DRY)
- Add JSDoc/docstrings for exports
- Handle errors like rest of codebase
- Write tests if project has them

❌ DON'T:
- Refactor unrelated code
- Add "nice to have" features  
- Over-engineer solutions
- Change formatting of untouched code
- Add dependencies without asking
- Ignore existing patterns
```

### Feature Flags

When adding significant features:
1. Add behind a flag (default: OFF)
2. Document the flag in code
3. Note cleanup plan in session log
4. Example: `const FEATURE_X_ENABLED = false;`

---

## 🚨 CRITICAL RULES

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️  NEVER SKIP THESE                                           │
├─────────────────────────────────────────────────────────────────┤
│  □ Run Bootstrap on first interaction with ANY project          │
│  □ Declare Session Context before coding                        │
│  □ Update docs at end of EVERY session                          │
│  □ Include timestamps on ALL entries (ISO 8601)                 │
│  □ Explain WHY for every change, not just WHAT                  │
│  □ List ALL files changed                                       │
│  □ Match existing code patterns exactly                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📋 COPY-PASTE TEMPLATES

### Quick Session Start

```
🔧 Bootstrap: Complete ✅
📚 Docs Loaded: README.md, docs/DEV_SESSION_LOG.md (last 2 entries)
🎯 Objective: [FILL IN]
🚫 Non-Goals: [FILL IN]
✅ Done When:
   1. [FILL IN]
   2. [FILL IN]
   3. Documentation updated
📋 Plan:
   1. [FILL IN]
   2. [FILL IN]
   3. Update docs
```

### Quick Session End Summary

```
## Session Complete

**Accomplished:**
- [what was done]

**Files Changed:**
- `path/file.ext` - [change]

**Docs Updated:**
- [x] CHANGELOG.md
- [x] docs/DEV_SESSION_LOG.md  
- [ ] docs/DECISIONS.md (no ADR needed)

**Next Steps:**
- [ ] [follow-up item]
```

---

## 🔧 EDGE CASES

### New/Empty Project
1. Create all three doc files from templates
2. Note "Initial setup" in first session log entry
3. Proceed normally

### Joining Mid-Project
1. Read ALL existing docs thoroughly
2. Read last 5 session log entries
3. Understand current state before changes
4. Continue the documentation chain—don't start fresh

### Existing Docs Use Different Format
1. Adapt to existing format if it captures same info
2. Consistency with project > this template
3. Note any format changes in session log

### Long Session / Multiple Features
1. Can add multiple CHANGELOG entries
2. One SESSION_LOG entry per session
3. Multiple ADRs if multiple decisions made

### Tiny Change (typo fix, etc.)
1. Still update SESSION_LOG (brief is fine)
2. CHANGELOG only if user-visible
3. No ADR needed

---

## ✅ VALIDATION CHECKLIST

Before ending any session, verify:

- □ All timestamps are ISO 8601 with time component
- □ All CHANGELOG entries have: Category, Why, What, Files, Impact
- □ SESSION_LOG entry includes: Context, Summary, Changes, Follow-up
- □ Any ADRs include: Status, Context, Decision, Alternatives, Consequences
- □ File paths are accurate and complete
- □ Entries are at TOP of their respective files
- □ No placeholder text remains

