import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import engine, Base
from routers import projects, materials, machines, finishes, config, calculations, export

Base.metadata.create_all(bind=engine)

os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="DIFORMA APU Calculator", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
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

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/")
def root():
    return {"message": "DIFORMA APU Calculator API v1.0"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
