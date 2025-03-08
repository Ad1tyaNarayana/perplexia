import io
from PyPDF2 import PdfReader
from fastapi import HTTPException, UploadFile

from app.models import db_models
from app.models.db_models import PDFDocument, PDFChunk, DocumentChunk
from sqlalchemy.orm import Session
import json
import logging
from sqlalchemy import select
from app.core.database import NeonAsyncSessionLocal

from app.services import embedding_service
from app.services.gemini_service import generate_mindmap_with_gemini

logger = logging.getLogger(__name__)

async def process_pdf_and_store(file: UploadFile, user_id: int, db: Session):
    """Processes PDF, generates embeddings, stores in NeonDB and metadata in PostgreSQL."""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        # Reset file pointer and read the content
        await file.seek(0)
        pdf_bytes = await file.read()
        
        # Basic validation that it's a PDF
        if not pdf_bytes.startswith(b'%PDF'):
            raise HTTPException(status_code=400, detail="Invalid PDF format")
            
        pdf_stream = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_stream)
        
        # Extract text from each page
        text_parts = []
        for page in reader.pages:
            try:
                text = page.extract_text() or ""
                text_parts.append(text)
                logger.info(f"Extracted {len(text)} characters from page")
            except Exception as e:
                logger.warning(f"Error extracting text from page: {str(e)}")
                
        text = "\n".join(text_parts)
        sanitized_text = text.replace('\x00', '')

        if not sanitized_text.strip():
            raise HTTPException(status_code=400, detail="No text found in the PDF")
        
        mindmap = await generate_mindmap_with_gemini(sanitized_text, file.filename)

        print(mindmap)

        # Store PDF Document metadata in PostgreSQL
        pdf_document_db = db_models.PDFDocument(
            user_id=user_id, 
            filename=file.filename,
            file_size=len(pdf_bytes),
            page_count=len(reader.pages),
            mindmap=mindmap,
        )

        db.add(pdf_document_db)
        await db.commit()
        await db.refresh(pdf_document_db)

        pdf_id = pdf_document_db.id  # Save ID before any potential rollback
        
        # No chunking - just use the whole document text
        # Create a NeonDB session
        neon_db = NeonAsyncSessionLocal()
        try:
            # Check if document_chunks table exists in NEON
            from sqlalchemy import text
            check_result = await neon_db.execute(text(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'document_chunks')"
            ))
            chunks_table_exists = check_result.scalar()
            
            if not chunks_table_exists:
                logger.error("document_chunks table does not exist in NeonDB")
                return {
                    "id": pdf_id,
                    "filename": file.filename,
                    "upload_date": pdf_document_db.upload_date,
                    "page_count": len(reader.pages),
                    "message": "PDF metadata saved, but vector could not be stored (database issue)",
                    "warning": "Vector database is not properly configured"
                }
            
            # Process the entire document as one chunk
            try:
                # Generate embedding for the entire document
                embedding = embedding_service.get_embedding(sanitized_text)
                
                # Create document chunk in NEON - storing the entire PDF content
                document_chunk = db_models.DocumentChunk(
                    chunk_text=sanitized_text,
                    embedding=embedding,
                    document_metadata=json.dumps({
                        "pdf_document_id": str(pdf_id),
                        "user_id": str(user_id),
                        "filename": file.filename,
                        "full_document": "true"  # Flag to indicate this is a whole document
                    })
                )
                neon_db.add(document_chunk)
                await neon_db.flush()
                
                # Store reference in PDF chunks table (in PostgreSQL)
                pdf_chunk = db_models.PDFChunk(
                    pdf_document_id=pdf_id,
                    chunk_index=0,  # Only one chunk now
                    neon_db_chunk_id=str(document_chunk.id)
                )
                db.add(pdf_chunk)
                logger.info(f"Added full document with ID {document_chunk.id}")
                
                # Commit both databases
                await neon_db.commit()
                await db.commit()
                
            except Exception as e:
                logger.error(f"Error processing document: {str(e)}", exc_info=True)
                return {
                    "id": pdf_id,
                    "filename": file.filename,
                    "upload_date": pdf_document_db.upload_date,
                    "page_count": len(reader.pages),
                    "message": "PDF metadata saved, but vector processing failed",
                    "warning": str(e)
                }
            
        finally:
            # Always close the NeonDB session
            await neon_db.close()
        
        return {
            "id": pdf_id,
            "filename": file.filename,
            "upload_date": pdf_document_db.upload_date,
            "page_count": len(reader.pages),
            "message": "PDF uploaded and processed successfully!"
        }
    except Exception as e:
        # Make sure to rollback on failure
        try:
            await db.rollback()
        except:
            pass
        logger.error(f"Error processing PDF: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")

async def list_user_pdfs_handler(current_user: db_models.User, db: Session) -> list[dict]:
    """Handler for listing user PDFs, offloaded from route."""
    pdfs = await db.execute(
        select(db_models.PDFDocument)
        .filter(db_models.PDFDocument.user_id == current_user.id)
    )
    pdfs = pdfs.scalars().all()
    return [{"id": pdf.id, "filename": pdf.filename, "upload_date": pdf.upload_date, "mindmap": pdf.mindmap} for pdf in pdfs]
