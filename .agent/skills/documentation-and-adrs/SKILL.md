# SKILL: Documentation and ADRs

## Description
Document architectural decisions as they happen. Ship Architecture Decision Records (ADRs) with every significant technical choice. Activates when a design decision is being made.

## Workflow

### When to activate
- A technology choice is being made (framework, library, pattern)
- Two or more approaches are being compared
- User says "document this decision", "write an ADR", "why did we choose X"
- A significant trade-off is accepted

### ADR Format: docs/adrs/NNN-short-title.md

```markdown
# ADR NNN — Short Descriptive Title

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded

## Context
What situation led to this decision? What problem are we solving?

## Options Considered
List each option with honest pros and cons.

## Decision
What did we choose?

## Trade-offs
What did we give up? What risks does this introduce?

## Consequences
What changes in the codebase as a result of this decision?
```

### Good ADR topics for DataLens
- Which LLM provider and why
- How to store arbitrary CSV schemas in SQLite
- Tool-calling pattern design
- Frontend chart library selection
- Filter propagation architecture

### Bad ADR topics
- "We chose React" (mandated by spec, not a decision)
- "We used Python" (mandated)
- Trivial implementation details

### README requirements
- Project purpose (2-3 sentences)
- Prerequisites with exact versions
- Step-by-step setup (assume non-developer reader)
- How to obtain each API key
- Single command to start the application
- How to run tests
- Troubleshooting section

### Rules
- Write the ADR at decision time, not retrospectively
- Be honest about trade-offs — do not write ADRs that only say positive things
- Number ADRs sequentially: 001, 002, 003
