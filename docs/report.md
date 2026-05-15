# DataLens — Final Project Report

**Course:** Generative AI for Business · Spring 2026  
**Team:** [Your names here]

---

## What the Agent Did Well

**1. Boilerplate generation was excellent.**  
When asked to scaffold the FastAPI backend with CORS, SQLAlchemy models, and Pydantic request/response schemas, the agent produced correct, production-quality code on the first attempt. The `database.py` module with proper `get_db()` dependency injection and `Base.metadata.create_all()` on startup was written exactly as a senior Python developer would write it.

**2. Tool-calling schema design.**  
The agent correctly translated our natural-language description ("the LLM needs to be able to filter the data, group it, and get statistics") into a well-structured function-calling schema with the right parameter types and descriptions. The `TOOLS` list in `llm.py` was correct JSON Schema on the first attempt, including the `enum` constraint on the `aggregation` parameter.

**3. Recharts integration.**  
The agent knew the correct Recharts API (ResponsiveContainer, BarChart/Bar, XAxis/YAxis, CartesianGrid, Tooltip) without needing reference documentation. The scatter chart's `data` format (array of `{x, y}` objects rather than named keys) was handled correctly.

**4. pandas NaN/Inf handling.**  
Without being prompted, the agent added a `clean()` utility that recursively sanitizes `np.nan`, `np.inf`, `np.integer`, and `np.floating` types for JSON serialization — a common production issue it anticipated before we encountered it.

---

## Where We Had to Intervene

**1. File size limit.**  
The agent initially set the upload size limit to 500 MB. The spec clearly states 50 MB. When we reviewed the upload endpoint, we caught the discrepancy and corrected it. The agent accepted the correction immediately but would not have caught it unprompted.

**2. Skipping SQLite persistence.**  
On the first iteration, the agent stored all uploaded data in a Python dictionary in memory (`store = {}`). This met the functional requirement for visualization and chat, but completely broke the persistence requirement. We had to explicitly tell the agent: "the spec requires SQLite persistence — page refresh must not lose data." The agent then correctly built the database layer, but only after the intervention.

**3. Chart.js instead of Recharts.**  
The agent initially reached for Chart.js (via react-chartjs-2), which is not in the mandated stack. The spec explicitly requires Recharts or Plotly. We caught this when reviewing the generated `package.json` and redirected: "The spec mandates Recharts — please redo the chart components using Recharts." This is a good example of why reviewing generated code matters even when it looks correct.

**4. Missing executive summary tab.**  
The first version of the app had three tabs (Visualizations, Data Statistics, AI Assistant). The spec requires an executive summary feature. The agent had not included it — it treated the summary as a "nice to have" rather than a core requirement. We had to direct it to implement the `/summary` endpoint and the `Summary.jsx` page.

**5. Function-calling prompt needed explicit framing.**  
When building `chat_with_data()`, the agent's first version used simple `tool_choice="auto"` but didn't include the agentic loop (re-calling the model after tool results). The model would call a tool, get the result, and stop — never producing a final answer. We had to explicitly describe the loop: "After executing the tool call, append the result and call the model again to produce the final answer."

---

## What We Would Do Differently

1. **Write the SPEC.md before opening the agent.** We started experimenting with the agent before the spec was finalized and had to redo two modules when the spec clarified requirements we had already half-implemented.

2. **Test the SQLite persistence on day one.** It was the last thing we verified and the most fundamental. If persistence had been a Day 1 acceptance criterion, we would have caught the in-memory implementation immediately.

3. **Review `package.json` before any frontend code is written.** The wrong chart library (Chart.js) propagated into several components before we caught it. Checking dependencies first would have saved 30 minutes of rework.

4. **Commit after each working slice, not at end of session.** On Week 2 Day 3, we had two slices' worth of code uncommitted. When we encountered a bug, it was harder to isolate.

---

## How the 6 Skills Affected the Agent

**spec-driven-development:** Forced us to write `SPEC.md` before any implementation. When we presented the spec to the agent, it correctly identified the six core features and built them in order rather than defaulting to "build the most interesting part first."

**planning-and-task-breakdown:** The agent produced `tasks/plan.md` as ordered thin vertical slices. This prevented the agent from building the entire frontend before any backend was functional.

**incremental-implementation:** Each slice was implemented, tested, and committed before the next. When the LLM chat wasn't working on Day 13, we hadn't coupled it to anything that would break — we could debug it in isolation.

**test-driven-development:** The agent wrote `test_api.py` tests alongside the backend implementation. On two occasions the tests caught bugs that would have reached the frontend (incorrect null count calculation, missing 404 on `/profile` when no dataset was uploaded).

**documentation-and-adrs:** The ADRs documented real decisions (SQLite schema, LLM provider, tool design). Writing ADR 002 while implementing the schema forced us to articulate why we chose Option B — which made it easier to explain the design to the grader.

**git-workflow-and-versioning:** Atomic commits with descriptive messages made the git history readable. When we needed to roll back the Chart.js implementation, a clean history meant we could identify exactly the right commit.
