import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    NEOND_DB_HOST = os.environ.get("NEOND_DB_HOST")
    NEOND_DB_NAME = os.environ.get("NEOND_DB_NAME")
    NEOND_DB_USER = os.environ.get("NEOND_DB_USER")
    NEOND_DB_PASSWORD = os.environ.get("NEOND_DB_PASSWORD")

    POSTGRES_DB_URL = os.environ.get("POSTGRES_DB_URL")
    
    SUPABASE_DB_USER = os.getenv("SUPABASE_DB_USER")
    SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
    SUPABASE_DB_HOST = os.getenv("SUPABASE_DB_HOST")
    SUPABASE_DB_PORT = os.getenv("SUPABASE_DB_PORT")
    SUPABASE_DB_DBNAME = os.getenv("SUPABASE_DB_DBNAME")


    JINAAI_API_KEY = os.environ.get("JINAAI_API_KEY")
    GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
    GOOGLE_VERTEX_API_KEY = os.environ.get("GOOGLE_VERTEX_API_KEY")

    CLERK_SECRET_KEY = os.environ.get("CLERK_SECRET_KEY")
    TAVILY_API_KEY = os.environ.get("TAVILY_API_KEY")

settings = Settings()