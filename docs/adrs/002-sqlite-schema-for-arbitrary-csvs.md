# ADR 002 — SQLite Schema for Arbitrary CSVs

**Date:** 2026-05-15  
**Status:** Accepted

---

## Context

DataLens must persist uploaded CSV datasets so that a page refresh does not lose the data. The core challenge is that CSV files have arbitrary, unpredictable schemas — each file may have completely different column names and types. We needed a persistence strategy that works for any CSV without requiring schema migrations.

## Options Considered

**Option A: One SQLite table per CSV upload (dynamic table creation)**
- Each uploaded CSV becomes its own SQLite table with matching columns
- Pro: Fully normalized, SQL queries possible directly
- Con: Requires DDL at runtime, schema migration risk, complex multi-dataset queries, SQLite has no easy way to list "data tables" vs "metadata tables"

**Option B: Store CSV as text in a metadata table (chosen)**
- One `datasets` table holds metadata + the raw CSV content as a TEXT column
- One `chat_messages` table holds conversation history
- Data loaded into Pandas on each request
- Pro: Works for any CSV schema; no runtime DDL; simple; easy to switch active dataset
- Con: Not efficient for very large files (mitigated by 50 MB limit); no SQL querying of data (mitigated by Pandas)

**Option C: Key-value blob storage (JSON column for each row)**
- Store each CSV row as a JSON object in a `rows` table
- Pro: Queryable via JSON functions
- Con: Complex, slow for large datasets, loses type information

## Decision

**Option B — raw CSV text stored in `datasets` table.**

## Trade-offs

**What we gain:**
- Complete schema flexibility — any CSV just works
- Simple implementation: `Dataset.csv_content` is a TEXT column; loading is `pd.read_csv(io.StringIO(ds.csv_content))`
- Easy to switch active dataset (just update `is_active` flag)
- Full Pandas power for profiling, charting, and LLM context

**What we give up:**
- Re-parsing CSV from text on every request adds ~10-50ms overhead for typical files
- Storing large CSVs as text is less space-efficient than a compressed blob; mitigated by 50 MB limit
- Cannot SQL-query the data directly from SQLite (not needed for our use case)

## Consequences

- `database.py` defines: `Dataset` (id, filename, rows, columns, column_info JSON, profile JSON, csv_content TEXT, is_active)
- Every endpoint that needs data calls `_load_df(ds)` which does `pd.read_csv(io.StringIO(ds.csv_content))`
- The `is_active` flag allows switching between previously uploaded datasets without deleting them
