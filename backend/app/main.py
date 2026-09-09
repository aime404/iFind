from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings


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


# Health check endpoint
@app.get("/", tags=["Health"])
async def health_check() -> dict[str, str]:
    """
    Health check endpoint to verify the API is running.
    
    Returns:
        dict: Status message
    """
    return {"status": "iFind API running"}