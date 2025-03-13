from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from sqlalchemy import text
from app.api import chat, pdfs, auth, edu  # Import API routers
from app.core.database import engine, Base, neon_engine, NeonBase 
import logging 

logging.basicConfig(level=logging.INFO) 
logger = logging.getLogger(__name__) 

async def lifespan(app: FastAPI):
    # Create Supabase tables (common tables) if they don't exist
    async with engine.begin() as conn:

        await conn.run_sync(Base.metadata.create_all)
    logger.info("Supabase tables verified/created")

    # Create NeonDB tables (vector‑specific models) if they don't exist
    async with neon_engine.begin() as neon_conn:
        try:
            await neon_conn.run_sync(NeonBase.metadata.create_all)
            logger.info("Neon tables verified/created")
            
        except Exception as e:
            logger.error(f"Error setting up Neon database: {str(e)}")
    logger.info("Neon tables verified/created")
    
    yield  # This is where the app runs
    
    # Shutdown: Add any cleanup code here
    logger.info("Shutting down application")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://perplexia.netlify.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/chat", tags=["Chat"])
app.include_router(pdfs.router, prefix="/pdf", tags=["Pdf"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"]) 
app.include_router(edu.router, prefix="/edu", tags=["Edu"]) 

@app.get("/health")
async def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)