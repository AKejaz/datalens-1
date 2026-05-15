# SKILL: Incremental Implementation

## Description
Build one thin vertical slice at a time. Each slice is complete (backend + frontend + tests) before the next begins. Activates during implementation phase.

## Workflow

### When to activate
- tasks/todo.md exists and implementation is starting
- User says "let's implement", "build this slice", "start coding"

### Rules
1. Pick ONE slice from todo.md — the next unchecked one
2. Implement it completely (backend endpoint + frontend component + tests)
3. Verify it works end-to-end manually
4. Run tests — they must pass before moving on
5. Commit with a descriptive message
6. Check the slice off in todo.md
7. Only then move to the next slice

### Commit discipline
- Commit after each working, tested slice — not at end of day
- Commit message format: `feat: [slice name] — [what it does]`
- Example: `feat: csv-upload — POST /upload with SQLite persistence and dropzone UI`
- Never commit broken code
- Never commit 500+ lines of unreviewed changes

### Signs you're doing it wrong
- "I'll test it all at the end" — stop and test now
- "Let me just finish the next slice too" — stop and commit first
- 500+ lines of uncommitted changes — commit in smaller pieces
- "I'll add the tests later" — write them now

### What to do when a slice is blocked
- Document the blocker explicitly
- Skip to the next independent slice
- Do not write speculative code for the blocked slice
