"""DataLens FastAPI backend."""
import io
import json
import os
import pandas as pd
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import get_db, init_db, Dataset, ChatMessage
from .profiler import profile_dataframe, get_column_info, clean
from .charts import generate_charts
from .llm import chat_with_data, generate_executive_summary

load_dotenv()

MAX_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 52428800))  # 50 MB default

app = FastAPI(title="DataLens API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_active_dataset(db: Session) -> Dataset:
    ds = db.query(Dataset).filter(Dataset.is_active == 1).order_by(Dataset.id.desc()).first()
    if not ds:
        raise HTTPException(status_code=404, detail="No dataset uploaded yet.")
    return ds


def _load_df(ds: Dataset) -> pd.DataFrame:
    return pd.read_csv(io.StringIO(ds.csv_content), low_memory=False)


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/upload")
async def upload_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Accept a CSV file, validate it, profile it, and persist to SQLite."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are accepted.")

    content = await file.read()

    if len(content) > MAX_BYTES:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_BYTES // 1024 // 1024} MB limit.")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty.")

    try:
        csv_text = content.decode("utf-8", errors="replace")
        df = pd.read_csv(io.StringIO(csv_text), low_memory=False)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {str(e)}")

    if df.empty or len(df.columns) == 0:
        raise HTTPException(status_code=400, detail="CSV has no data or no columns.")

    # Deactivate previous datasets
    db.query(Dataset).update({"is_active": 0})
    db.commit()

    col_info = get_column_info(df)
    profile = profile_dataframe(df)

    ds = Dataset(
        filename=file.filename,
        original_filename=file.filename,
        rows=len(df),
        columns=len(df.columns),
        column_info=col_info,
        profile=profile,
        csv_content=csv_text,
        is_active=1,
    )
    db.add(ds)
    db.commit()
    db.refresh(ds)

    return clean({
        "dataset_id": ds.id,
        "filename": ds.filename,
        "rows": ds.rows,
        "columns": ds.columns,
        "column_info": col_info,
        "uploaded_at": ds.uploaded_at.isoformat(),
    })


@app.get("/datasets")
def list_datasets(db: Session = Depends(get_db)):
    """List all uploaded datasets (persistence across page refresh)."""
    all_ds = db.query(Dataset).order_by(Dataset.id.desc()).all()
    return [
        {"id": d.id, "filename": d.filename, "rows": d.rows, "columns": d.columns,
         "uploaded_at": d.uploaded_at.isoformat(), "is_active": d.is_active}
        for d in all_ds
    ]


@app.post("/datasets/{dataset_id}/activate")
def activate_dataset(dataset_id: int, db: Session = Depends(get_db)):
    db.query(Dataset).update({"is_active": 0})
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    ds.is_active = 1
    db.commit()
    return {"message": f"Dataset {dataset_id} is now active."}


@app.get("/profile")
def get_profile(db: Session = Depends(get_db)):
    """Return per-column descriptive statistics."""
    ds = _get_active_dataset(db)
    return ds.profile


@app.get("/visualizations")
def get_visualizations(filters: str = None, db: Session = Depends(get_db)):
    """Return 4-6 chart specs, optionally filtered."""
    ds = _get_active_dataset(db)
    df = _load_df(ds)

    if filters:
        try:
            fdict = json.loads(filters)
            for col, val in fdict.items():
                if col not in df.columns:
                    continue
                if val in (None, "", "all", "All", "__all__"):
                    continue
                # numeric range filter: val is {"min": x, "max": y}
                if isinstance(val, dict) and "min" in val and "max" in val:
                    try:
                        s = pd.to_numeric(df[col], errors="coerce")
                        df = df[s.between(float(val["min"]), float(val["max"]))]
                    except Exception:
                        pass
                else:
                    # categorical exact match
                    df = df[df[col].astype(str) == str(val)]
        except Exception:
            pass

    charts = generate_charts(df)
    return {"charts": charts, "filtered_rows": len(df), "total_rows": ds.rows}


@app.get("/filter-options")
def get_filter_options(db: Session = Depends(get_db)):
    """Return filter options for all columns — categorical dropdowns + numeric ranges."""
    ds = _get_active_dataset(db)
    df = _load_df(ds)
    options = {}
    for col in df.columns:
        is_bool = pd.api.types.is_bool_dtype(df[col])
        is_numeric = pd.api.types.is_numeric_dtype(df[col]) and not is_bool
        n_unique = df[col].nunique()
        if is_bool:
            # boolean as categorical
            options[col] = {
                "type": "categorical",
                "values": ["True", "False"],
            }
        elif is_numeric:
            s = df[col].dropna().astype(float)
            if len(s) == 0:
                continue
            options[col] = {
                "type": "numeric",
                "min": float(round(s.min(), 4)),
                "max": float(round(s.max(), 4)),
            }
        elif n_unique <= 100:
            vals = sorted(df[col].dropna().astype(str).unique().tolist())
            options[col] = {
                "type": "categorical",
                "values": vals,
            }
        else:
            # high-cardinality text — skip
            continue
    return options


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db)):
    """LLM chat with tool-calling against the active dataset."""
    ds = _get_active_dataset(db)
    df = _load_df(ds)

    # Load recent chat history
    history_rows = (
        db.query(ChatMessage)
        .filter(ChatMessage.dataset_id == ds.id)
        .order_by(ChatMessage.id.desc())
        .limit(20)
        .all()
    )
    history = [{"role": r.role, "content": r.content} for r in reversed(history_rows)]

    reply = chat_with_data(req.message, df, history)

    # Persist messages
    db.add(ChatMessage(dataset_id=ds.id, role="user", content=req.message))
    db.add(ChatMessage(dataset_id=ds.id, role="assistant", content=reply))
    db.commit()

    return {"reply": reply}


@app.delete("/chat/history")
def clear_chat_history(db: Session = Depends(get_db)):
    ds = _get_active_dataset(db)
    db.query(ChatMessage).filter(ChatMessage.dataset_id == ds.id).delete()
    db.commit()
    return {"message": "Chat history cleared."}


@app.get("/summary")
def get_executive_summary(db: Session = Depends(get_db)):
    """Generate an LLM executive summary of the active dataset."""
    ds = _get_active_dataset(db)
    df = _load_df(ds)
    summary = generate_executive_summary(df)
    return {"summary": summary, "filename": ds.filename, "rows": ds.rows, "columns": ds.columns}


@app.delete("/reset")
def reset(db: Session = Depends(get_db)):
    db.query(ChatMessage).delete()
    db.query(Dataset).delete()
    db.commit()
    return {"message": "All data cleared."}
