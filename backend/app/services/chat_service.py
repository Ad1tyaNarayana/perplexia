from fastapi import HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
import time
import json
from app.services import neon_service, tavily_service, gemini_service, embedding_service
from app.models.chat_models import ChatRequest
from app.models import db_models
import logging

logger = logging.getLogger(__name__)

async def chat_stream_handler(chat_req: ChatRequest, request: Request, db: Session, current_user: db_models.User) -> StreamingResponse:
    """Handles the chat stream logic, offloaded from the route."""
    query = chat_req.query
    start_time = time.time()
    session_id = chat_req.session_id
    context_pdfs = chat_req.context_pdfs or []
    
    # Create or get chat session
    if session_id:
        session_result = await db.execute(
            select(db_models.ChatSession).filter(
                db_models.ChatSession.id == session_id, 
                db_models.ChatSession.user_id == current_user.id
            )
        )
        chat_session = session_result.scalar_one_or_none()
        if not chat_session:
            raise HTTPException(status_code=404, detail="Chat session not found or not owned by user")
        chat_session_id = session_id
    else:
        chat_session = db_models.ChatSession(user_id=current_user.id)
        db.add(chat_session)
        await db.commit()
        await db.refresh(chat_session)
        chat_session_id = chat_session.id

    chat_history_str = await get_chat_history_str(db, chat_session_id)
    
    # PDF context processing
    pdf_context = ""
    if context_pdfs:
        try:
            query_embedding = embedding_service.get_embedding(query)
            retrieved_chunks = await neon_service.search_neon_chunks(db, query_embedding, top_n=5)
            pdf_context = "\n".join(retrieved_chunks) if retrieved_chunks else "No relevant PDFs found."
        except Exception as e:
            logger.error(f"Error retrieving PDF context: {e}")
            pdf_context = "Error retrieving PDF context."
    
    # Search context if requested
    tavily_context = ""
    if chat_req.isSearchMode:
        tavily_info = tavily_service.fetch_tavily_data(query)
        tavily_context = json.dumps(tavily_info) if isinstance(tavily_info, dict) else str(tavily_info)
        if not tavily_context:
            tavily_context = "No additional web info found."

    prompt = f"""
    You are a helpful assistant. Use the context provided to answer the user question at the end.

    **Document Context:**
    {pdf_context}

    **Chat History:**
    {chat_history_str}

    **User Question:** {query}"""

    async def sse_generator():
        # Send metadata with session ID first
        metadata = {"search": tavily_context, "duration": time.time() - start_time, "chat_session_id": chat_session_id}
        yield f"data: {json.dumps({'type': 'metadata', 'data': metadata})}\n\n"

        full_answer = ""

        # Stream the model response
        async for chunk in gemini_service.generate_response_with_gemini_streaming(prompt):
            if await request.is_disconnected():
                logger.info("Client disconnected, stopping stream.")
                break
            
            # Parse the chunk and extract text
            try:
                chunk_data = json.loads(chunk.removeprefix("data: ").removesuffix("\n\n"))
                chunk_text = chunk_data.get('text', '')
                full_answer += chunk_text
                
                # Send chunk as SSE
                yield f"data: {json.dumps({'type': 'content', 'text': chunk_text})}\n\n"
            except Exception as e:
                logger.error(f"Error processing chunk: {e}")
                continue

        # Save the messages to the database
        user_message = db_models.ChatMessage(
            session_id=chat_session_id, user_id=current_user.id, content=query, is_user_message=True
        )
        bot_message = db_models.ChatMessage(
            session_id=chat_session_id, user_id=None, content=full_answer, is_user_message=False
        )
        db.add_all([user_message, bot_message])
        await db.commit()
        
        # Send completion notification
        yield f"data: {json.dumps({'type': 'end'})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

async def get_chat_history_str(db: Session, chat_session_id: int) -> str:
    """Retrieves and formats chat history as a string."""

    from sqlalchemy import select as sqlalchemy_select
    chat_history = []
    if chat_session_id:
        query = sqlalchemy_select(db_models.ChatMessage).where(
            db_models.ChatMessage.session_id == chat_session_id
        ).order_by(db_models.ChatMessage.created_at.desc()).limit(10)
        
        # Execute the query
        messages_result = await db.execute(query)
        messages = messages_result.scalars().all()
        messages = list(reversed(messages))
        
        for msg in messages:
            role = "user" if msg.is_user_message else "assistant"
            chat_history.append(f"{role}: {msg.content}")
    
    return "\n".join(chat_history) if chat_history else "No previous messages in this chat."