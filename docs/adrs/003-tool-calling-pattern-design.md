# ADR 003 — Tool-Calling Pattern Design for LLM Chat

**Date:** 2026-05-15  
**Status:** Accepted

---

## Context

The LLM chat interface must provide data-grounded answers — it cannot hallucinate statistics. The spec mandates tool-use / function-calling. We needed to decide: (a) which tools to expose, (b) how to execute them, and (c) how to handle multi-turn tool loops.

## Options Considered

**Option A: Single "run Python code" tool**
- One tool that accepts arbitrary Python/Pandas code and executes it
- Pro: Maximum flexibility
- Con: Serious security risk (code injection); hard to sandbox; Groq would need to write valid Pandas — hallucination risk

**Option B: Narrow purpose-built tools (chosen)**
- Define 5 specific tools: `get_statistics`, `query_data`, `get_column_names`, `get_value_counts`, `get_correlation`
- Each tool takes structured parameters and executes safe, predefined Pandas operations
- Pro: No code injection risk; deterministic execution; easy to test; LLM parameters are validated
- Con: Less flexible — user questions that don't map to these tools may get weaker answers

**Option C: SQL generation (Text-to-SQL)**
- LLM generates SQL; we run it against the CSV data via DuckDB
- Pro: Very flexible
- Con: DuckDB adds a dependency; SQL generation requires careful prompt engineering; error handling complex

## Decision

**Option B — 5 narrow purpose-built tools executed server-side.**

## Tool Inventory

| Tool | Parameters | Returns |
|------|-----------|---------|
| `get_column_names` | none | column names + dtypes |
| `get_statistics` | `columns[]` | mean, median, std, min, max, nulls per column |
| `query_data` | `group_by, aggregate_column, aggregation, filter_column, filter_value, top_n` | aggregated table |
| `get_value_counts` | `column, top_n` | top N value frequencies |
| `get_correlation` | `column_a, column_b` | Pearson correlation coefficient |

## Agentic Loop Design

The `chat_with_data()` function runs an agentic loop (up to 5 rounds):
1. Send user message + history to Groq with tools available
2. If model returns tool calls, execute each via `execute_tool()`
3. Append tool results to message history
4. Re-call the model with tool results in context
5. Repeat until no more tool calls or 5 rounds exceeded

## Trade-offs

**What we gain:**
- Safe, testable, deterministic data access
- Clear separation: LLM decides *what* to compute; Python computes it correctly
- Tool results are appended to conversation history, so multi-step reasoning works

**What we give up:**
- Cannot answer questions outside the 5 tool operations (e.g., complex joins, regex searches)
- Adding new query capabilities requires defining a new tool + deploying

## Consequences

- `llm.py` contains `TOOLS` list (Groq function-calling schema), `execute_tool()`, and `chat_with_data()`
- All tool execution is in Python — no user-controlled code runs
- Chat history (last 20 messages) stored in `chat_messages` SQLite table and passed on each request
