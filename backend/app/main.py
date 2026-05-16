from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.routes.auth import router as auth_router
from app.routes.jobs import router as jobs_router
from app.routes.proof import router as proof_router
from app.routes.resume import router as resume_router


def create_app() -> FastAPI:
    app = FastAPI(title="VeriHire API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def _startup() -> None:
        init_db()

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    app.include_router(resume_router, prefix="/resume", tags=["resume"])
    app.include_router(proof_router, prefix="/proof", tags=["proof"])
    app.include_router(jobs_router, prefix="/jobs", tags=["jobs"])

    return app


app = create_app()
