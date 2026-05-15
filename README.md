# DataLens 🔍

**AI-Powered CSV Data Analytics Dashboard**

Upload any CSV file and instantly get smart visualizations, per-column descriptive statistics, an AI-generated executive summary, and a chat assistant that queries your data using tool-calling — all powered by Groq's LLaMA 3.3 70B.

---

## Features

| Tab | What it does |
|-----|-------------|
| 📊 **Visualizations** | 4–6 auto-generated Recharts charts (bar, histogram, doughnut/pie, scatter, line, correlation heatmap) with global filter dropdowns |
| 📋 **Data Profile** | Per-column statistics: count, null %, unique values, mean, median, std dev, min, max, Q25, Q75. Searchable and filterable by type |
| 📝 **Executive Summary** | LLM-generated business analyst narrative covering key patterns, outliers, and actionable insights |
| 🤖 **AI Assistant** | Chat with your data using Groq tool-calling — the AI queries actual data values, never hallucinating |

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | **3.11 or higher** | https://python.org/downloads |
| Node.js | **18 or higher** | https://nodejs.org |
| npm | **9 or higher** | Included with Node.js |
| uv (Python package manager) | latest | `pip install uv` or https://docs.astral.sh/uv/getting-started/installation/ |

Verify your versions:
```bash
python --version      # must be 3.11+
node --version        # must be 18+
npm --version         # must be 9+
uv --version
```

---

## Getting Your Groq API Key

1. Go to https://console.groq.com
2. Sign up for a free account (no credit card required)
3. Navigate to **API Keys** in the left sidebar
4. Click **Create API Key**
5. Copy the key — it starts with `gsk_`

---

## Setup Instructions

### Step 1: Clone the repository

```bash
git clone <your-repo-url>
cd DataLens
```

### Step 2: Configure environment variables

```bash
cp .env.example .env
```

Open `.env` in any text editor and fill in your Groq API key:

```
GROQ_API_KEY=gsk_your_key_here
```

The other values can stay as defaults.

### Step 3: Install backend dependencies

```bash
uv sync
```

If you don't have `uv`, you can use pip instead:
```bash
pip install -r requirements-fallback.txt
```

### Step 4: Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

You need two terminal windows open simultaneously.

**Terminal 1 — Backend (API server):**
```bash
uvicorn backend.app.main:app --reload --port 8000
```

**Terminal 2 — Frontend (UI):**
```bash
cd frontend
npm run dev
```

Open your browser at **http://localhost:5173**

The backend API runs at http://localhost:8000 (API docs at http://localhost:8000/docs).

---

## Running Tests

**Backend tests (pytest):**
```bash
pytest backend/tests/ -v
```
Expected output: 14 tests passing.

**Frontend tests (Vitest):**
```bash
cd frontend
npm test
```
Expected output: 8 tests passing.

---

## How to Use DataLens

1. **Upload** — Drag and drop any CSV file (up to 50 MB) onto the landing page, or click to browse.
2. **Visualizations** — Charts generate automatically. Use the filter dropdowns to filter by categorical column values — all charts update simultaneously. Click **Clear** to restore original view.
3. **Data Profile** — Browse per-column statistics. Use the search box to find specific columns. Filter by type (numeric, categorical, datetime).
4. **Executive Summary** — Click **Generate Executive Summary** to have the AI analyze your data and produce a business-ready narrative.
5. **AI Assistant** — Type any question about your data. The AI uses tool-calling to query actual values. Try the suggested questions in the sidebar.
6. **New File** — Click **↩ New File** in the header to upload a different CSV. Your previous dataset is preserved in the database.

---

## Project Structure

```
DataLens/
├── README.md
├── SPEC.md                          # Project specification
├── pyproject.toml                   # Python dependencies (uv)
├── .env.example                     # Environment variable template
├── .env                             # Your local config (not in git)
│
├── .agent/skills/                   # 6 mandatory agent skills
│   ├── spec-driven-development/
│   ├── planning-and-task-breakdown/
│   ├── incremental-implementation/
│   ├── test-driven-development/
│   ├── documentation-and-adrs/
│   └── git-workflow-and-versioning/
│
├── backend/
│   ├── app/
│   │   ├── main.py       # FastAPI app, all API endpoints
│   │   ├── database.py   # SQLAlchemy models, SQLite setup
│   │   ├── profiler.py   # Column type detection, statistics
│   │   ├── charts.py     # Auto-generate chart specs
│   │   └── llm.py        # Groq tool-calling integration
│   └── tests/
│       └── test_api.py   # 14 pytest tests
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── src/
│   │   ├── App.jsx                  # Root + upload flow
│   │   ├── utils/api.js             # API client (axios)
│   │   ├── pages/
│   │   │   ├── Visualizations.jsx   # Charts + filters (Recharts)
│   │   │   ├── DataProfile.jsx      # Statistics table
│   │   │   ├── Summary.jsx          # Executive summary
│   │   │   └── AIAssistant.jsx      # Chat interface
│   │   └── test/
│   │       └── components.test.jsx  # 8 Vitest tests
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

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/upload` | Upload a CSV file (max 50 MB) |
| GET | `/datasets` | List all uploaded datasets |
| POST | `/datasets/{id}/activate` | Switch active dataset |
| GET | `/profile` | Per-column descriptive statistics |
| GET | `/visualizations` | Chart specs (supports `?filters={}`) |
| GET | `/filter-options` | Categorical column values for dropdowns |
| POST | `/chat` | Chat with AI (tool-calling) |
| DELETE | `/chat/history` | Clear chat history |
| GET | `/summary` | Generate executive summary |
| DELETE | `/reset` | Clear all data |

Interactive API docs: http://localhost:8000/docs

---

## Troubleshooting

**"Module not found" on backend start**
```bash
# Make sure you're in the project root (DataLens/), not inside backend/
uvicorn backend.app.main:app --reload --port 8000
```

**"GROQ_API_KEY not set" error**
```bash
# Check that .env exists and contains your key
cat .env | grep GROQ
# If empty, copy .env.example and fill it in
cp .env.example .env
```

**Frontend can't connect to backend (CORS errors)**
- Make sure the backend is running on port 8000 before starting the frontend
- Check `vite.config.js` — the proxy should forward `/api` to `http://localhost:8000`

**"File too large" error**
- DataLens accepts CSV files up to 50 MB
- For larger files, consider sampling the CSV before upload

**Charts don't appear after upload**
- Open the browser console (F12) and check for errors
- Verify the backend `/visualizations` endpoint works: http://localhost:8000/visualizations

**SQLite database errors**
```bash
# Delete the database file and restart — it will be recreated
rm datalens.db
```

**`uv sync` fails**
```bash
# Install pip fallback dependencies
pip install fastapi uvicorn[standard] python-multipart pandas numpy groq pydantic python-dotenv aiosqlite sqlalchemy
```

**npm install fails**
```bash
# Clear npm cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend framework | React 18 + Vite (port 5173) |
| Styling | Tailwind CSS |
| Charts | Recharts |
| Frontend testing | Vitest + Testing Library |
| Backend framework | FastAPI (Python 3.11+) |
| Package manager | uv + pyproject.toml |
| Data processing | Pandas + NumPy |
| Database | SQLite via SQLAlchemy |
| LLM provider | Groq (`llama-3.3-70b-versatile`) |
| LLM pattern | Tool-calling / function-calling |
| Backend testing | pytest |

---

## Team

| Name | Contribution |
|------|-------------|
| [Student 1] | [e.g., Backend API, LLM integration, ADRs] |
| [Student 2] | [e.g., Frontend components, tests, documentation] |

**Dataset assigned:** [Your assigned dataset name here]

---

## Course Information

**Course:** Generative AI for Business · Spring 2026  
**Project:** DataLens — Agentic Development of a Data Analytics Dashboard  
**Coding agent used:** Claude (claude.ai)
