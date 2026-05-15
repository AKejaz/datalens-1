"""Auto-generate 4-8 chart specs from a DataFrame."""
import pandas as pd
import numpy as np
import math
from typing import Any


def _clean(obj: Any) -> Any:
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return None if (math.isnan(obj) or math.isinf(obj)) else float(obj)
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_clean(i) for i in obj]
    if isinstance(obj, np.ndarray):
        return _clean(obj.tolist())
    return obj


def generate_charts(df: pd.DataFrame) -> list[dict]:
    charts = []
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    # exclude booleans from numeric for charting
    numeric_cols = [c for c in numeric_cols if not pd.api.types.is_bool_dtype(df[c])]
    cat_cols = [c for c in df.columns if df[c].dtype == object and df[c].nunique() <= 50]
    time_cols = []
    for c in df.columns:
        try:
            parsed = pd.to_datetime(df[c].dropna().head(50), errors="coerce")
            if parsed.notna().mean() > 0.7:
                time_cols.append(c)
        except Exception:
            pass

    # 1. Histogram of first numeric column
    if numeric_cols:
        col = numeric_cols[0]
        values = df[col].dropna().astype(float)
        hist, edges = np.histogram(values, bins=20)
        charts.append({
            "id": "hist_1", "chartType": "bar",
            "title": f"Distribution of {col}",
            "description": f"Frequency histogram of {col}",
            "data": {
                "labels": [f"{edges[i]:.2f}–{edges[i+1]:.2f}" for i in range(len(hist))],
                "datasets": [{"name": col, "values": hist.tolist()}],
            },
        })

    # 2. Bar chart for first categorical column
    if cat_cols:
        col = cat_cols[0]
        top = df[col].value_counts().head(15)
        charts.append({
            "id": "bar_cat_1", "chartType": "bar",
            "title": f"Top Values — {col}",
            "description": f"Most frequent values in {col}",
            "data": {
                "labels": top.index.tolist(),
                "datasets": [{"name": "Count", "values": top.values.tolist()}],
            },
        })

    # 3. Pie for second categorical (or first if only one)
    pie_col = cat_cols[1] if len(cat_cols) > 1 else (cat_cols[0] if cat_cols else None)
    if pie_col:
        top = df[pie_col].value_counts().head(8)
        charts.append({
            "id": "pie_1", "chartType": "pie",
            "title": f"Breakdown — {pie_col}",
            "description": f"Proportional breakdown of {pie_col}",
            "data": {
                "labels": top.index.tolist(),
                "datasets": [{"name": "Share", "values": top.values.tolist()}],
            },
        })

    # 4. Scatter: first two numeric columns
    if len(numeric_cols) >= 2:
        cx, cy = numeric_cols[0], numeric_cols[1]
        sample = df[[cx, cy]].dropna().astype(float).sample(min(300, len(df)), random_state=42)
        charts.append({
            "id": "scatter_1", "chartType": "scatter",
            "title": f"{cx} vs {cy}",
            "description": f"Relationship between {cx} and {cy}",
            "data": {
                "labels": [],
                "datasets": [{"name": f"{cx} vs {cy}",
                    "values": [{"x": float(r[cx]), "y": float(r[cy])} for _, r in sample.iterrows()]}],
            },
            "xKey": cx, "yKeys": [cy],
        })

    # 5. Area/Line chart over time
    if time_cols and numeric_cols:
        tc, nc = time_cols[0], numeric_cols[0]
        try:
            tmp = df[[tc, nc]].copy()
            tmp[tc] = pd.to_datetime(tmp[tc], errors="coerce")
            tmp[nc] = pd.to_numeric(tmp[nc], errors="coerce")
            tmp = tmp.dropna().sort_values(tc)
            grouped = tmp.groupby(tc)[nc].mean().reset_index().head(100)
            charts.append({
                "id": "line_time_1", "chartType": "line",
                "title": f"{nc} Over Time",
                "description": f"Trend of {nc} across {tc}",
                "data": {
                    "labels": grouped[tc].astype(str).tolist(),
                    "datasets": [{"name": nc, "values": grouped[nc].tolist()}],
                },
            })
        except Exception:
            pass

    # 6. Correlation heatmap (top 6 numeric cols)
    if len(numeric_cols) >= 3:
        top6 = numeric_cols[:6]
        corr = df[top6].astype(float).corr().round(3)
        charts.append({
            "id": "heatmap_1", "chartType": "heatmap",
            "title": "Correlation Matrix",
            "description": "Pearson correlation between numeric columns",
            "data": {
                "labels": top6,
                "matrix": corr.values.tolist(),
            },
        })

    # 7. NEW: Radar chart — mean of top numeric cols (normalised 0-1)
    if len(numeric_cols) >= 3:
        top5 = numeric_cols[:5]
        means = df[top5].astype(float).mean()
        mins  = df[top5].astype(float).min()
        maxs  = df[top5].astype(float).max()
        normed = ((means - mins) / (maxs - mins + 1e-9) * 100).round(1)
        charts.append({
            "id": "radar_1", "chartType": "radar",
            "title": "Numeric Profile (Radar)",
            "description": "Normalised mean values across numeric columns",
            "data": {
                "labels": top5,
                "datasets": [{"name": "Normalised Mean %", "values": normed.tolist()}],
            },
        })

    # 8. NEW: Area chart — top 2 numeric cols over row index (trend)
    if len(numeric_cols) >= 2 and not time_cols:
        sample = df[numeric_cols[:2]].astype(float).dropna().head(80)
        labels = list(range(len(sample)))
        charts.append({
            "id": "area_trend_1", "chartType": "area",
            "title": f"Trend — {numeric_cols[0]} & {numeric_cols[1]}",
            "description": "Side-by-side area trend across rows",
            "data": {
                "labels": labels,
                "datasets": [
                    {"name": numeric_cols[0], "values": sample[numeric_cols[0]].tolist()},
                    {"name": numeric_cols[1], "values": sample[numeric_cols[1]].tolist()},
                ],
            },
        })
    elif len(numeric_cols) >= 2 and len(charts) < 8:
        col = numeric_cols[1]
        hist2, edges2 = np.histogram(df[col].dropna().astype(float), bins=15)
        charts.append({
            "id": "hist_2", "chartType": "bar",
            "title": f"Distribution of {col}",
            "description": f"Frequency histogram of {col}",
            "data": {
                "labels": [f"{edges2[i]:.2f}–{edges2[i+1]:.2f}" for i in range(len(hist2))],
                "datasets": [{"name": col, "values": hist2.tolist()}],
            },
        })

    return _clean(charts[:8])
