import uvicorn
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base
from routers import projects, materials, machines, finishes, config, calculations, export

IS_VERCEL = bool(os.environ.get("VERCEL"))

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = "/tmp/uploads" if IS_VERCEL else "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="DIFORMA APU Calculator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(materials.router, prefix="/api/materials", tags=["materials"])
app.include_router(machines.router, prefix="/api/machines", tags=["machines"])
app.include_router(finishes.router, prefix="/api/finishes", tags=["finishes"])
app.include_router(config.router, prefix="/api/config", tags=["config"])
app.include_router(calculations.router, prefix="/api", tags=["calculations"])
app.include_router(export.router, prefix="/api/export", tags=["export"])

# Serve uploaded files only in local dev (Vercel filesystem is ephemeral)
if not IS_VERCEL:
    app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
async def startup_event():
    """Auto-seed the database on every cold start."""
    import sys
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    from seed_data import seed
    seed()


@app.get("/")
def root():
    return {"message": "DIFORMA APU Calculator API v1.0"}


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
