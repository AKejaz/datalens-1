# SKILL: Test-Driven Development

## Description
Write tests alongside (or before) implementation. Tests are a first-class artifact, not an afterthought. Activates whenever implementation begins or tests are mentioned.

## Workflow

### When to activate
- Implementation of any endpoint or component begins
- User says "write tests", "add test coverage", "TDD this"
- A slice is "done" — verify tests exist before checking it off

### Backend (pytest)
- Test file: `backend/tests/test_<module>.py`
- Use `TestClient` from FastAPI for endpoint tests
- Fresh database per test via fixture:
```python
@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    init_db()
    yield
    Base.metadata.drop_all(bind=engine)
```
- Every endpoint gets at least: happy path + error path
- Minimum 10 backend tests total

### Frontend (Vitest)
- Test file: `frontend/src/test/<component>.test.jsx`
- Mock all API calls: `vi.mock('../utils/api')`
- Use `@testing-library/react` — test behavior, not implementation
- Minimum 5 frontend tests total

### What must be tested
- Upload: valid file, wrong extension, empty file, oversized file
- Profile: correct stats for numeric columns, null counts
- Charts: endpoint returns 4-6 charts
- Filters: applying filter reduces row count
- Persistence: data survives after reset cycle

### Anti-patterns to avoid
- "I'll add tests at the end" — write them now
- Testing implementation details (private methods) instead of behavior
- Tests that always pass regardless of code correctness
- Not running tests before committing
