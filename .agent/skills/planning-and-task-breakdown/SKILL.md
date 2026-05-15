# SKILL: Planning and Task Breakdown

## Description
Decompose a spec into an ordered implementation plan and a granular task list. Activates when a spec exists and it's time to plan implementation.

## Workflow

### When to activate
- SPEC.md exists and user says "let's plan", "break this into tasks", "what do we build first"
- Before any implementation begins

### What to produce

**tasks/plan.md** — Implementation order as thin vertical slices
- Each slice delivers end-to-end value (not "backend layer" then "frontend layer")
- Slices ordered by dependency: each slice can be tested independently
- Each slice has explicit acceptance criteria

**tasks/todo.md** — Granular task breakdown
- Each task touches ~5 files or fewer
- Each task has a checkbox and acceptance criteria
- Tasks are ordered within each slice

### Rules
- Thin vertical slices — build the simplest possible version of each feature end-to-end
- No big-bang integrations — never plan "build all backend, then all frontend"
- Identify and call out all dependencies between slices
- Identify risks and mitigation strategies

### What a good slice looks like
```
### Slice 2: CSV Upload + Persistence
- backend/app/main.py — POST /upload endpoint
- backend/app/database.py — SQLAlchemy Dataset model
- frontend/src/utils/api.js — uploadCSV function
- frontend/src/App.jsx — dropzone component
Acceptance: Upload CSV → metadata returned; SQLite file created; data survives server restart
```

### Anti-patterns to avoid
- "Build all the models first" — this is not a thin slice
- Tasks with no acceptance criteria
- Slices that can't be independently tested
