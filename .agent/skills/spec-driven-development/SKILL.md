# SKILL: Spec-Driven Development

## Description
Write a structured specification before writing any code. This skill activates when the user mentions writing a spec, defining requirements, planning a feature, or starting a new project.

## Workflow

### When to activate
- User says "let's write a spec", "spec out this feature", "define requirements", "start a new project"
- A new feature or module is about to be implemented without a spec

### What to produce: SPEC.md

A SPEC.md must cover exactly these six sections:

1. **Objective** — What are we building and why? Include user stories and specific, testable success criteria. Bad: "make it fast." Good: "dashboard renders within 2 seconds of upload completion."

2. **Commands** — Full, copy-paste-ready commands for: build, test, lint, dev server start.

3. **Project Structure** — Directory tree with one-line description per file/folder.

4. **Code Style** — One code example showing key conventions. Naming, formatting, patterns.

5. **Testing Strategy** — Framework(s), test file locations, what is covered, minimum test counts.

6. **Boundaries** — Three lists: Always Do / Ask First / Never Do.

### Rules
- Surface ALL assumptions explicitly — never silently assume
- Success criteria must be measurable and binary (pass/fail)
- Do not start implementation until SPEC.md is reviewed and approved
- If a requirement is ambiguous, write two interpretations and ask which is correct

### Anti-patterns to avoid
- Writing a spec that is so vague it could describe any project
- Putting success criteria like "the app should be responsive" (not testable)
- Starting to code before the spec is done ("I'll refine it as we go")
