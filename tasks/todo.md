# DataLens — Task Breakdown

Each task is ~5 files or fewer. Check off as completed.

## Slice 1: Scaffold
- [x] `backend/app/main.py` — FastAPI app with CORS and `/health`
- [x] `frontend/index.html` + `src/main.jsx` — Vite entry
- [x] `frontend/src/index.css` — Tailwind directives
- [x] `frontend/tailwind.config.js` + `postcss.config.js`
- [x] `frontend/vite.config.js`

**Acceptance criteria:** Both servers start without errors.

## Slice 2: Upload + Persistence
- [x] `backend/app/database.py` — SQLAlchemy models (Dataset, ChatMessage)
- [x] `backend/app/main.py` — POST `/upload`, GET `/datasets`, DELETE `/reset`
- [x] `frontend/src/utils/api.js` — axios client
- [x] `frontend/src/App.jsx` — dropzone upload UI with progress
- [x] `.env.example` + `.env`

**Acceptance criteria:** Upload CSV → returned metadata; datalens.db file created.

## Slice 3: Data Profiling
- [x] `backend/app/profiler.py` — `detect_column_type`, `profile_dataframe`
- [x] `backend/app/main.py` — GET `/profile`
- [x] `frontend/src/pages/DataProfile.jsx`

**Acceptance criteria:** Profile table shows all columns with correct types and stats.

## Slice 4: Visualizations
- [x] `backend/app/charts.py` — `generate_charts`
- [x] `backend/app/main.py` — GET `/visualizations`
- [x] `frontend/src/pages/Visualizations.jsx` — Recharts rendering
- [x] `frontend/src/App.jsx` — tabs added

**Acceptance criteria:** 4–6 charts render for any CSV.

## Slice 5: Filters
- [x] `backend/app/main.py` — GET `/filter-options`, filter logic in `/visualizations`
- [x] `frontend/src/pages/Visualizations.jsx` — filter bar

**Acceptance criteria:** Selecting filter updates all charts; clear restores.

## Slice 6: LLM Chat
- [x] `backend/app/llm.py` — tool definitions + `execute_tool` + `chat_with_data`
- [x] `backend/app/main.py` — POST `/chat`, DELETE `/chat/history`
- [x] `frontend/src/pages/AIAssistant.jsx`

**Acceptance criteria:** Chat uses tool-calling; answers reference actual data values.

## Slice 7: Executive Summary
- [x] `backend/app/llm.py` — `generate_executive_summary`
- [x] `backend/app/main.py` — GET `/summary`
- [x] `frontend/src/pages/Summary.jsx`

**Acceptance criteria:** Summary references specific column names and values.

## Slice 8: Tests + Docs
- [x] `backend/tests/test_api.py` — 14 pytest tests
- [x] `frontend/src/test/components.test.jsx` — 8 Vitest tests
- [x] `SPEC.md`, `README.md`, ADRs, `report.md`
- [x] `.agent/skills/` folder with 6 SKILL.md files
- [x] `tasks/plan.md`, `tasks/todo.md`

**Acceptance criteria:** All tests pass; README setup works on clean machine.
