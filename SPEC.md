# DataLens — Project Specification

**Course:** Generative AI for Business · Spring 2026  
**Version:** 1.0.0  
**Status:** Approved

---

## 1. Objective

### What We Are Building
DataLens is a generic data analytics web application that allows any user to upload a CSV file and immediately receive:
- Automatic data profiling (column type detection, null counts, statistics)
- A filterable dashboard with 4–6 auto-generated visualizations
- Per-column descriptive statistics (mean, median, std, min, max, Q25, Q75, nulls)
- An LLM-powered chat interface using tool/function-calling to query data
- An AI-generated executive summary of key business insights

### User Stories
1. As a business analyst, I can upload any CSV file and see it profiled automatically within 5 seconds.
2. As a dashboard user, I can apply global filters and watch all charts update simultaneously.
3. As a data consumer, I can ask natural language questions and receive data-grounded answers.
4. As a decision-maker, I can read an executive summary that surfaces key patterns in plain English.
5. As a repeat user, my previously uploaded datasets persist after a page refresh.

### Success Criteria (Specific and Testable)
- CSV upload completes and dashboard renders within 5 seconds for files ≤ 10 MB
- Upload correctly rejects non-CSV files with a descriptive error message
- Upload enforces the 50 MB size limit
- Profile page shows correct null counts matching actual CSV null cells
- Dashboard displays exactly 4–6 charts appropriate to the detected column types
- Applying a filter to a categorical column updates all charts within 2 seconds
- Chat interface returns a data-grounded answer using at least one tool call per question
- Executive summary references specific column names and numeric values from the dataset
- Uploading a second CSV correctly replaces the active dataset
- Page refresh does not lose uploaded dataset (SQLite persistence verified)

---

## 2. Commands

```bash
# Backend — start dev server
cd backend && uvicorn app.main:app --reload --port 8000

# Backend — run tests
pytest backend/tests/ -v

# Frontend — install and start (port 5173)
cd frontend && npm install && npm run dev

# Frontend — run tests
cd frontend && npm test

# Full project start (both servers)
# Terminal 1:
cd backend && uvicorn app.main:app --reload --port 8000
# Terminal 2:
cd frontend && npm run dev
```

---

## 3. Project Structure

```
DataLens/
├── README.md                    # Setup, run, troubleshoot
├── SPEC.md                      # This document
├── pyproject.toml               # Python deps (uv)
├── .env.example                 # Documented env vars
├── .env                         # Local env (not committed)
├── .gitignore
│
├── .agent/skills/               # 6 mandatory agent skills
│   ├── spec-driven-development/SKILL.md
│   ├── planning-and-task-breakdown/SKILL.md
│   ├── incremental-implementation/SKILL.md
│   ├── test-driven-development/SKILL.md
│   ├── documentation-and-adrs/SKILL.md
│   └── git-workflow-and-versioning/SKILL.md
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app, all endpoints
│   │   ├── database.py          # SQLAlchemy models, SQLite setup
│   │   ├── profiler.py          # Column type detection, statistics
│   │   ├── charts.py            # Chart spec generation
│   │   └── llm.py               # Groq tool-calling integration
│   └── tests/
│       ├── __init__.py
│       └── test_api.py          # pytest tests (14 tests)
│
├── frontend/
│   ├── index.html               # Vite entry
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx             # React entry point
│       ├── App.jsx              # Root component, upload flow
│       ├── index.css            # Tailwind directives
│       ├── utils/api.js         # Axios API client
│       ├── pages/
│       │   ├── Visualizations.jsx   # 4–6 Recharts charts + filters
│       │   ├── DataProfile.jsx      # Descriptive stats table
│       │   ├── Summary.jsx          # Executive summary page
│       │   └── AIAssistant.jsx      # LLM chat interface
│       └── test/
│           ├── setup.js
│           └── components.test.jsx
│
├── docs/
│   ├── adrs/
│   │   ├── 001-llm-provider-selection.md
│   │   ├── 002-sqlite-schema-for-arbitrary-csvs.md
│   │   └── 003-tool-calling-pattern-design.md
│   └── report.md
│
└── tasks/
    ├── plan.md
    └── todo.md
```

---

## 4. Code Style

### Python
```python
# Use type hints on all function signatures
def profile_dataframe(df: pd.DataFrame) -> list[dict]:
    """Docstring on every public function."""
    ...

# Pydantic models for all request/response bodies
class ChatRequest(BaseModel):
    message: str
```
- Black-compatible formatting (4-space indent)
- All FastAPI dependencies injected via `Depends()`
- No raw SQL — use SQLAlchemy ORM
- Environment variables via `python-dotenv`; never hardcode secrets

### JavaScript/React
```jsx
// Functional components only, named exports
export default function Visualizations({ fileInfo }) {
  const [charts, setCharts] = useState([])
  // ...
}
```
- Tailwind utility classes only (no custom CSS files)
- All API calls via `src/utils/api.js` — no inline axios
- `.jsx` extension for all React files

---

## 5. Testing Strategy

### Backend — pytest
- Location: `backend/tests/`
- Minimum: 14 tests
- Uses `TestClient` from FastAPI for endpoint tests
- Fresh SQLite DB per test via fixture
- Covers: health, upload (valid/invalid/empty/oversize), profile (stats, nulls), charts, filters, datasets list, reset

### Frontend — Vitest
- Location: `frontend/src/test/`
- Minimum: 8 tests
- Uses `@testing-library/react`
- API calls mocked via `vi.mock('../utils/api')`
- Covers: App landing, DataProfile, Visualizations, Summary, AIAssistant

---

## 6. Boundaries

### Always Do
- Validate file extension AND content before processing
- Return meaningful HTTP error messages (400 with `detail` field)
- Persist every uploaded dataset to SQLite
- Use tool-calling for every LLM chat response
- Handle NaN/Inf values before JSON serialization

### Ask First
- Changing the LLM model name (may affect tool-calling support)
- Adding new chart types beyond the six defined
- Modifying the SQLite schema (migration needed)

### Never Do
- Store the API key anywhere except `.env` (not in code, not in git)
- Commit `.env` to git
- Return unformatted Python exceptions to the frontend
- Break multi-dataset support (app must work with any CSV, not just the test dataset)
- Skip tests — write them alongside implementation
