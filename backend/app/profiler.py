"""Data profiling."""
import pandas as pd
import numpy as np
import math
from typing import Any


def clean(obj: Any) -> Any:
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    if isinstance(obj, (np.integer,)):
        return int(obj)
    if isinstance(obj, (np.floating,)):
        return None if (math.isnan(obj) or math.isinf(obj)) else float(obj)
    if isinstance(obj, np.ndarray):
        return clean(obj.tolist())
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(i) for i in obj]
    return obj


def detect_column_type(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "categorical"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    sample = series.dropna().head(100).astype(str)
    try:
        parsed = pd.to_datetime(sample, errors="coerce")
        if parsed.notna().mean() > 0.8:
            return "datetime"
    except Exception:
        pass
    if series.nunique() / max(len(series), 1) < 0.5 and series.nunique() <= 100:
        return "categorical"
    return "text"


def profile_dataframe(df: pd.DataFrame) -> list:
    result = []
    for col in df.columns:
        series = df[col]
        col_type = detect_column_type(series)
        info = {
            "column": col,
            "type": col_type,
            "dtype": str(series.dtype),
            "count": int(series.count()),
            "nulls": int(series.isna().sum()),
            "null_pct": round(series.isna().mean() * 100, 2),
            "unique": int(series.nunique()),
        }
        if col_type == "numeric":
            s = series.astype(float)
            info.update({
                "mean": s.mean(),
                "median": s.median(),
                "std": s.std(),
                "min": s.min(),
                "max": s.max(),
                "q25": s.quantile(0.25),
                "q75": s.quantile(0.75),
                "top_values": None,
                "top_counts": None,
            })
        elif col_type in ("categorical", "text"):
            top = series.value_counts().head(10)
            info.update({
                "mean": None, "median": None, "std": None,
                "min": None, "max": None, "q25": None, "q75": None,
                "top_values": [str(x) for x in top.index.tolist()],
                "top_counts": top.values.tolist(),
            })
        elif col_type == "datetime":
            parsed = pd.to_datetime(series, errors="coerce")
            info.update({
                "mean": None, "median": None, "std": None,
                "min": str(parsed.min()) if parsed.notna().any() else None,
                "max": str(parsed.max()) if parsed.notna().any() else None,
                "q25": None, "q75": None,
                "top_values": None, "top_counts": None,
            })
        result.append(clean(info))
    return result


def get_column_info(df: pd.DataFrame) -> list:
    return [{"name": c, "dtype": str(df[c].dtype), "type": detect_column_type(df[c])} for c in df.columns]
