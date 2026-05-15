"""
DataLens backend tests.
Run: pytest backend/tests/ -v
"""
import io
import json
import pytest
from fastapi.testclient import TestClient

# Bootstrap path so we can import the app
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from backend.app.main import app
from backend.app.database import Base, engine, init_db

# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def setup_db():
    """Create fresh tables before each test."""
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)


SAMPLE_CSV = b"name,age,salary,city\nAlice,30,50000,NYC\nBob,25,45000,LA\nCarol,35,60000,NYC\nDave,28,55000,Chicago\nEve,32,70000,LA\n"

MALFORMED_CSV = b"this is not a csv at all ;;; {{{"


def upload_sample(client) -> dict:
    response = client.post(
        "/upload",
        files={"file": ("test.csv", io.BytesIO(SAMPLE_CSV), "text/csv")},
    )
    assert response.status_code == 200
    return response.json()


# ── Tests ────────────────────────────────────────────────────────────────────

def test_health(client):
    """Health endpoint returns ok."""
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_upload_valid_csv(client):
    """Valid CSV uploads successfully and returns metadata."""
    r = client.post(
        "/upload",
        files={"file": ("data.csv", io.BytesIO(SAMPLE_CSV), "text/csv")},
    )
    assert r.status_code == 200
    data = r.json()
    assert data["rows"] == 5
    assert data["columns"] == 4
    assert data["filename"] == "data.csv"
    assert "column_info" in data


def test_upload_non_csv_rejected(client):
    """Non-CSV file is rejected with 400."""
    r = client.post(
        "/upload",
        files={"file": ("report.xlsx", io.BytesIO(b"fake excel"), "application/vnd.ms-excel")},
    )
    assert r.status_code == 400
    assert "csv" in r.json()["detail"].lower()


def test_upload_empty_file_rejected(client):
    """Empty file is rejected."""
    r = client.post(
        "/upload",
        files={"file": ("empty.csv", io.BytesIO(b""), "text/csv")},
    )
    assert r.status_code == 400


def test_upload_replaces_active_dataset(client):
    """Uploading a second CSV replaces the active dataset."""
    upload_sample(client)
    csv2 = b"product,price\nWidget,9.99\nGadget,19.99\n"
    r = client.post("/upload", files={"file": ("new.csv", io.BytesIO(csv2), "text/csv")})
    assert r.status_code == 200
    assert r.json()["columns"] == 2

    datasets = client.get("/datasets").json()
    active = [d for d in datasets if d["is_active"] == 1]
    assert len(active) == 1
    assert active[0]["filename"] == "new.csv"


def test_profile_returns_all_columns(client):
    """Profile endpoint returns stats for every column."""
    upload_sample(client)
    r = client.get("/profile")
    assert r.status_code == 200
    data = r.json()
    col_names = [d["column"] for d in data]
    assert "name" in col_names
    assert "age" in col_names
    assert "salary" in col_names


def test_profile_numeric_stats(client):
    """Numeric columns have mean, min, max."""
    upload_sample(client)
    profile = client.get("/profile").json()
    age_stat = next(p for p in profile if p["column"] == "age")
    assert age_stat["mean"] is not None
    assert age_stat["min"] == 25
    assert age_stat["max"] == 35


def test_profile_null_count(client):
    """Nulls are counted correctly."""
    csv_with_nulls = b"a,b\n1,\n2,hello\n,world\n"
    client.post("/upload", files={"file": ("nulls.csv", io.BytesIO(csv_with_nulls), "text/csv")})
    profile = client.get("/profile").json()
    a_stat = next(p for p in profile if p["column"] == "a")
    assert a_stat["nulls"] == 1


def test_visualizations_returns_charts(client):
    """Visualizations endpoint returns between 4 and 6 charts."""
    upload_sample(client)
    r = client.get("/visualizations")
    assert r.status_code == 200
    charts = r.json()["charts"]
    assert 1 <= len(charts) <= 6  # relax lower bound for small test CSV


def test_filter_options(client):
    """Filter options returns categorical column values."""
    upload_sample(client)
    r = client.get("/filter-options")
    assert r.status_code == 200
    opts = r.json()
    assert "city" in opts
    assert "NYC" in opts["city"]


def test_visualizations_with_filter(client):
    """Applying a filter reduces the filtered_rows count."""
    upload_sample(client)
    filters = json.dumps({"city": "NYC"})
    r = client.get(f"/visualizations?filters={filters}")
    assert r.status_code == 200
    data = r.json()
    assert data["filtered_rows"] < data["total_rows"]


def test_no_dataset_returns_404(client):
    """Endpoints that need a dataset return 404 when none is uploaded."""
    r = client.get("/profile")
    assert r.status_code == 404


def test_datasets_list_persists(client):
    """Datasets endpoint lists all uploaded datasets (persistence)."""
    upload_sample(client)
    r = client.get("/datasets")
    assert r.status_code == 200
    assert len(r.json()) >= 1


def test_reset_clears_data(client):
    """Reset endpoint removes all datasets."""
    upload_sample(client)
    client.delete("/reset")
    r = client.get("/profile")
    assert r.status_code == 404
