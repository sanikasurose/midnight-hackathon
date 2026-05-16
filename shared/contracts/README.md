# Shared Contracts (Phase 0)

This folder is a lightweight place to keep the team aligned on request/response shapes.

- Backend source of truth: FastAPI OpenAPI at `http://localhost:8000/openapi.json`
- Frontend uses `NEXT_PUBLIC_API_URL` to call the backend.

Phase 0: contracts are mirrored as minimal TypeScript types in `shared/contracts/http.ts`.

