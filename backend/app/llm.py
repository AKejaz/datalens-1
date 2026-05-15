"""LLM integration with tool-calling / function-calling pattern."""
import os
import json
import pandas as pd
import numpy as np
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
MODEL = "llama-3.3-70b-versatile"

# ── Tool definitions (function-calling schema) ──────────────────────────────

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_statistics",
            "description": "Get descriptive statistics (mean, median, std, min, max, nulls, unique) for one or more columns.",
            "parameters": {
                "type": "object",
                "properties": {
                    "columns": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Column names to compute statistics for. Pass [] for all columns.",
                    }
                },
                "required": ["columns"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "query_data",
            "description": "Filter and aggregate the dataset. Returns a summary table as JSON.",
            "parameters": {
                "type": "object",
                "properties": {
                    "group_by": {"type": "string", "description": "Column to group by (optional)."},
                    "aggregate_column": {"type": "string", "description": "Numeric column to aggregate."},
                    "aggregation": {"type": "string", "enum": ["mean", "sum", "count", "max", "min"], "description": "Aggregation function."},
                    "filter_column": {"type": "string", "description": "Column to filter on (optional)."},
                    "filter_value": {"type": "string", "description": "Value to filter for (optional)."},
                    "top_n": {"type": "integer", "description": "Return only top N rows.", "default": 10},
                },
                "required": ["aggregation"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_column_names",
            "description": "List all column names and their types in the dataset.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_value_counts",
            "description": "Get top N value counts for a categorical column.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column": {"type": "string"},
                    "top_n": {"type": "integer", "default": 10},
                },
                "required": ["column"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_correlation",
            "description": "Compute correlation between two numeric columns.",
            "parameters": {
                "type": "object",
                "properties": {
                    "column_a": {"type": "string"},
                    "column_b": {"type": "string"},
                },
                "required": ["column_a", "column_b"],
            },
        },
    },
]


# ── Tool executor ────────────────────────────────────────────────────────────

def _safe(v):
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return None if (np.isnan(v) or np.isinf(v)) else float(v)
    return v


def execute_tool(name: str, args: dict, df: pd.DataFrame) -> str:
    try:
        if name == "get_column_names":
            cols = [{"column": c, "type": str(df[c].dtype)} for c in df.columns]
            return json.dumps(cols)

        elif name == "get_statistics":
            cols = args.get("columns") or df.columns.tolist()
            cols = [c for c in cols if c in df.columns]
            if not cols:
                cols = df.select_dtypes(include=np.number).columns.tolist()[:5]
            result = {}
            for c in cols:
                s = df[c]
                if pd.api.types.is_numeric_dtype(s):
                    result[c] = {
                        "mean": _safe(s.mean()), "median": _safe(s.median()),
                        "std": _safe(s.std()), "min": _safe(s.min()), "max": _safe(s.max()),
                        "nulls": int(s.isna().sum()), "unique": int(s.nunique()),
                    }
                else:
                    result[c] = {"unique": int(s.nunique()), "nulls": int(s.isna().sum()),
                                 "top": s.value_counts().head(5).to_dict()}
            return json.dumps(result)

        elif name == "query_data":
            tmp = df.copy()
            fc, fv = args.get("filter_column"), args.get("filter_value")
            if fc and fv and fc in tmp.columns:
                tmp = tmp[tmp[fc].astype(str) == str(fv)]
            gb = args.get("group_by")
            ac = args.get("aggregate_column")
            agg = args.get("aggregation", "count")
            top = args.get("top_n", 10)
            if gb and gb in tmp.columns:
                if ac and ac in tmp.columns:
                    r = getattr(tmp.groupby(gb)[ac], agg)().reset_index()
                else:
                    r = tmp.groupby(gb).size().reset_index(name="count")
                r = r.sort_values(r.columns[-1], ascending=False).head(top)
                return r.to_json(orient="records")
            else:
                if ac and ac in tmp.columns:
                    val = getattr(tmp[ac], agg)()
                    return json.dumps({f"{agg}({ac})": _safe(val)})
                return json.dumps({"count": len(tmp)})

        elif name == "get_value_counts":
            col = args.get("column")
            top = args.get("top_n", 10)
            if col not in df.columns:
                return json.dumps({"error": f"Column '{col}' not found."})
            vc = df[col].value_counts().head(top).to_dict()
            return json.dumps({str(k): int(v) for k, v in vc.items()})

        elif name == "get_correlation":
            ca, cb = args.get("column_a"), args.get("column_b")
            if ca not in df.columns or cb not in df.columns:
                return json.dumps({"error": "One or both columns not found."})
            corr = df[ca].corr(df[cb])
            return json.dumps({"correlation": _safe(corr), "columns": [ca, cb]})

        return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


# ── Main chat function ───────────────────────────────────────────────────────

def chat_with_data(user_message: str, df: pd.DataFrame, history: list[dict]) -> str:
    """Run one chat turn with tool-calling against the dataframe."""
    system = (
        f"You are DataLens AI, a data analyst assistant. "
        f"The user has uploaded a dataset with {len(df)} rows and {len(df.columns)} columns: "
        f"{', '.join(df.columns.tolist()[:20])}. "
        "Use the provided tools to query the actual data before answering. "
        "Give concise, data-grounded answers. Format numbers clearly."
    )

    messages = [{"role": "system", "content": system}] + history + [{"role": "user", "content": user_message}]

    # First call — may invoke tools
    response = client.chat.completions.create(
        model=MODEL, messages=messages, tools=TOOLS, tool_choice="auto", max_tokens=1500,
    )

    msg = response.choices[0].message

    # Handle tool calls (agentic loop — up to 5 rounds)
    rounds = 0
    while msg.tool_calls and rounds < 5:
        rounds += 1
        messages.append({"role": "assistant", "content": msg.content or "", "tool_calls": [
            {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
            for tc in msg.tool_calls
        ]})
        for tc in msg.tool_calls:
            args = json.loads(tc.function.arguments)
            result = execute_tool(tc.function.name, args, df)
            messages.append({"role": "tool", "tool_call_id": tc.id, "content": result})

        response = client.chat.completions.create(
            model=MODEL, messages=messages, tools=TOOLS, tool_choice="auto", max_tokens=1500,
        )
        msg = response.choices[0].message

    return msg.content or "I could not generate a response."


def generate_executive_summary(df: pd.DataFrame) -> str:
    """Generate a business-analyst-style executive summary of the dataset."""
    import numpy as np

    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    cat_cols = [c for c in df.columns if df[c].dtype == object and df[c].nunique() <= 50]

    stats_lines = []
    for col in numeric_cols[:6]:
        s = df[col]
        stats_lines.append(f"  - {col}: mean={s.mean():.2f}, min={s.min():.2f}, max={s.max():.2f}, nulls={s.isna().sum()}")
    for col in cat_cols[:4]:
        top = df[col].value_counts().head(3)
        stats_lines.append(f"  - {col}: {dict(top)}")

    null_summary = {c: int(df[c].isna().sum()) for c in df.columns if df[c].isna().any()}

    prompt = f"""You are a senior business analyst. Write a concise executive summary (3-5 paragraphs) of the following dataset.

Dataset: {len(df)} rows, {len(df.columns)} columns.
Columns: {', '.join(df.columns.tolist())}

Key statistics:
{chr(10).join(stats_lines)}

Missing data: {null_summary if null_summary else 'None'}

Your summary should:
1. Describe what the dataset appears to represent
2. Highlight the most important patterns and trends
3. Call out any notable outliers or data quality issues
4. Provide 2-3 actionable insights a business decision-maker could use
Write in plain business English — not technical jargon."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
    )
    return response.choices[0].message.content
