# API — Implementation Guidelines

Thin HTTP wrapper over `./python_backend.md`. Owns request/response shapes and error translation only.

## Conventions

**Framework**: FastAPI. All routes in `src/budget/api/app.py`.

**Wiring**: Services/stores are module-level singletons, instantiated once at startup with injected port implementations.

**Request bodies**: Inline `pydantic.BaseModel` in `app.py`, directly above the route. Name: `<Action><Resource>Request`. Shared shapes go in `src/budget/models/requests.py`.

**Responses**: `.model_dump(mode="json")` for single objects. `[item.model_dump(mode="json") for item in results]` for lists. No envelope wrapper.

**Errors**: Catch `ValueError` → `HTTPException(status_code=400, detail=str(e))`. All else propagates as 500.

**Route conventions**:

| Operation           | Method | Path                      |
|---------------------|--------|---------------------------|
| List / read         | GET    | `/<resource>`             |
| Specialised read    | GET    | `/<resource>/<sub>`       |
| Create              | POST   | `/<resource>`             |
| Mutate (non-create) | POST   | `/<resource>/<action>`    |
| Delete              | POST   | `/<resource>/remove`      |

No `PUT`, `PATCH`, or `DELETE`. Mutations use POST with an action suffix.

**File upload**: `fastapi.UploadFile`. `await file.read()` → decode `"utf-8-sig"`, fall back to `"latin-1"` on `UnicodeDecodeError`.

**Side effects**: triggered in the route handler after the primary operation. Document with inline comment.