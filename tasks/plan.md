# DataLens — Implementation Plan

## Phase Order (Thin Vertical Slices)

Each slice is independently runnable and testable before moving to the next.

### Slice 1: Project Scaffold + Health Check
- Initialize FastAPI app with CORS, health endpoint
- Initialize Vite + React + Tailwind frontend
- Confirm both servers run and connect
- **Acceptance:** `GET /health` returns `{"status": "ok"}`; frontend loads at port 5173

### Slice 2: CSV Upload + SQLite Persistence
- POST `/upload` endpoint with validation (size, extension, format)
- SQLite schema: `datasets` table via SQLAlchemy
- Store CSV content, metadata, column info
- Frontend: dropzone component with progress bar
- **Acceptance:** Upload a CSV → metadata returned; database file created; refresh → data still accessible

### Slice 3: Data Profiling
- `profiler.py`: detect column types, compute stats per column
- GET `/profile` endpoint
- Frontend: DataProfile page with searchable/filterable table
- **Acceptance:** Profile shows correct mean/min/max for numeric columns; null counts match actual NaN cells

### Slice 4: Visualizations Dashboard
- `charts.py`: generate 4–6 chart specs from DataFrame
- GET `/visualizations` endpoint
- Frontend: Visualizations page with Recharts rendering
- **Acceptance:** 4–6 charts render without errors; chart types match column types (bar for categorical, scatter for two numerics, etc.)

### Slice 5: Global Filters
- GET `/filter-options` endpoint (categorical columns with ≤50 unique values)
- Filter parameters passed to `/visualizations`
- Frontend: filter bar above charts; all charts update on filter change
- **Acceptance:** Selecting a filter value reduces visible data in all charts; clearing restores original view

### Slice 6: LLM Chat with Tool-Calling
- `llm.py`: 5 tools (get_statistics, query_data, get_column_names, get_value_counts, get_correlation)
- POST `/chat` endpoint; chat history persisted in SQLite
- Frontend: AIAssistant page with sidebar, suggestions, message bubbles
- **Acceptance:** Sending "which city appears most?" triggers tool call and returns correct answer

### Slice 7: Executive Summary
- `generate_executive_summary()` in `llm.py`
- GET `/summary` endpoint
- Frontend: Summary page with generate button, formatted markdown output
- **Acceptance:** Summary references actual column names and numeric values from the dataset

### Slice 8: Multi-Dataset Support + Polish
- Uploading new CSV deactivates old; `/datasets` endpoint lists all
- Error handling improvements
- Loading states, empty states
- **Acceptance:** Upload dataset A, then dataset B → app works with B; upload A again → works with A

## Dependencies
- Slices 3, 4, 5, 6, 7 all depend on Slice 2 (upload + DB)
- Slice 5 depends on Slice 4 (filters need charts to filter)
- Slice 6 can be built in parallel with Slice 4
- Slice 7 depends on Slice 6 (reuses LLM client)

## Risks
- Groq API rate limits on large datasets: mitigate by summarizing stats rather than sending raw data
- NaN serialization to JSON: handled by `clean()` utility throughout
- Large CSV parsing time: Pandas with `low_memory=False`; async file read
