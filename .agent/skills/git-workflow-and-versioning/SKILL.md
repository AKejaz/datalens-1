# SKILL: Git Workflow and Versioning

## Description
Maintain a clean, readable git history with atomic commits and descriptive messages. Activates whenever code is ready to commit or the user mentions git.

## Workflow

### When to activate
- A slice is complete and ready to commit
- User says "commit this", "let's push", "git"
- More than ~50 lines have been written since last commit

### Commit format
```
<type>: <short description> — <what it does>

Types: feat, fix, test, docs, refactor, chore
```

### Examples of good commits
```
feat: csv-upload — POST /upload with validation, SQLite persistence, dropzone UI
feat: data-profile — column type detection, descriptive stats, profile page
feat: visualizations — 4-6 Recharts charts auto-generated from column types
feat: global-filters — filter bar updates all charts simultaneously
feat: llm-chat — Groq tool-calling with 5 data query tools
feat: executive-summary — AI-generated business summary endpoint and page
test: backend — 14 pytest tests covering all core endpoints
docs: adrs — LLM provider, SQLite schema, tool-calling pattern decisions
```

### Examples of bad commits
```
WIP
stuff
fix
update files
final version
```

### Rules
- One logical change per commit — not one commit per file
- Never commit: `.env`, `__pycache__`, `node_modules`, `*.pyc`, `datalens.db`
- Commit after each working, tested slice
- Do not commit failing tests
- Work spread across all 3 weeks — not everything on Day 20

### .gitignore must include
```
.env
__pycache__/
*.pyc
*.pyo
node_modules/
dist/
build/
*.db
*.sqlite
.DS_Store
venv/
.venv/
```
