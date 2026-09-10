from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.routes_auth import router as auth_router
from app.api.v1.routes_reports import router as reports_router


# Create FastAPI application instance
app = FastAPI(
    title="iFind - Campus Lost & Found API",
    description="Backend API for iFind Campus Lost & Found System",
    version="0.1.0"
)


# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (will be restricted in production)
    allow_credentials=False,  # Must be False when allow_origins is "*" (browser CORS spec)
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Authentication"]
)

app.include_router(
    reports_router,
    prefix="/api/v1",
    tags=["Reports"]
)


# Mount static files for uploads
uploads_dir = Path(__file__).parent / "uploads"
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


# Health check endpoint
@app.get("/", tags=["Health"])
async def health_check() -> dict[str, str]:
    """
    Health check endpoint to verify the API is running.
    
    Returns:
        dict: Status message
    """
    return {"status": "iFind API running"}