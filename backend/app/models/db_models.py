from sqlalchemy import Column, Float, Integer, String, DateTime, ForeignKey, Boolean, Text, TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects import postgresql
from app.core.database import Base, NeonBase
from pgvector.sqlalchemy import Vector
import sqlalchemy as sa

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    clerk_user_id = Column(String, unique=True, index=True) # Clerk user ID
    username = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat_sessions = relationship("ChatSession", back_populates="user")
    pdf_documents = relationship("PDFDocument", back_populates="user")

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, default="New Chat") # Optional chat name
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_sessions")
    messages = relationship("ChatMessage", back_populates="chat_session", lazy="selectin")
    pdf_documents_assoc = relationship("ChatSessionPDF", back_populates="chat_session")
    pdf_documents = relationship("PDFDocument", secondary="chat_session_pdfs", backref="chat_sessions")

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    user_id = Column(Integer, ForeignKey("users.id")) # Optional, for message author if needed
    content = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_user_message = Column(Boolean, default=True) # Flag if message is from user or bot
    search_data = Column(postgresql.JSONB(astext_type=Text), nullable=True)

    chat_session = relationship("ChatSession", back_populates="messages", lazy="selectin")
    user = relationship("User") # Optional user relationship

class PDFDocument(Base):
    __tablename__ = "pdf_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    file_size = Column(Integer)      
    page_count = Column(Integer)     
    mindmap = Column(postgresql.JSONB(astext_type=Text), nullable=True)

    user = relationship("User", back_populates="pdf_documents")
    pdf_chunks = relationship("PDFChunk", back_populates="pdf_document")
    chat_sessions_assoc = relationship("ChatSessionPDF", back_populates="pdf_document")

class PDFChunk(Base):
    __tablename__ = "pdf_chunks_metadata" # Renamed to avoid conflict with NeonDB table name

    id = Column(Integer, primary_key=True, index=True)
    pdf_document_id = Column(Integer, ForeignKey("pdf_documents.id"))
    chunk_index = Column(Integer) # Order of chunk in the PDF
    neon_db_chunk_id = Column(String, index=True) # Store an ID if NeonDB provides one, or generate one if not

    pdf_document = relationship("PDFDocument", back_populates="pdf_chunks")

class ChatSessionPDF(Base): 
    """Association table to link chat sessions with PDF documents."""
    __tablename__ = "chat_session_pdfs"

    id = Column(Integer, primary_key=True, index=True)
    chat_session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    pdf_document_id = Column(Integer, ForeignKey("pdf_documents.id"))
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    chat_session = relationship("ChatSession", back_populates="pdf_documents_assoc")
    pdf_document = relationship("PDFDocument", back_populates="chat_sessions_assoc")

class DocumentChunk(NeonBase):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    chunk_text = Column(String)
    embedding = Column(Vector(768))
    document_metadata = Column(postgresql.JSONB(astext_type=Text))
    created_at = Column(DateTime(timezone=True), server_default=func.now())