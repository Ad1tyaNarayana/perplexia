from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import db_models
from sqlalchemy import and_, func, select
from app.api import auth
from app.services import education_service
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/summary/{pdf_id}", response_model=dict)
async def get_pdf_summary(
    pdf_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(auth.get_current_user)
):
    """Get the summary of a PDF document."""
    stmt = select(db_models.PDFDocument).where(
        db_models.PDFDocument.id == pdf_id,
        db_models.PDFDocument.user_id == current_user.id
    )
    result = await db.execute(stmt)
    pdf = result.scalar_one_or_none()
    
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    return {"summary": pdf.pdf_summary or "No summary available."}

@router.get("/quiz/{pdf_id}", response_model=dict)
async def get_pdf_quiz(
    pdf_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(auth.get_current_user)
):
    """Get the quiz for a PDF document."""
    # First check if the PDF exists and belongs to the user
    pdf_stmt = select(db_models.PDFDocument).where(
        db_models.PDFDocument.id == pdf_id,
        db_models.PDFDocument.user_id == current_user.id
    )
    pdf_result = await db.execute(pdf_stmt)
    pdf = pdf_result.scalar_one_or_none()
    
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    # Get the quiz for this PDF
    quiz_stmt = select(db_models.Quiz).where(db_models.Quiz.pdf_document_id == pdf_id)
    quiz_result = await db.execute(quiz_stmt)
    quiz = quiz_result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="No quiz available for this PDF")
    
    # Get all questions with their answers
    questions_stmt = select(db_models.QuizQuestion).where(
        db_models.QuizQuestion.quiz_id == quiz.id
    )
    questions_result = await db.execute(questions_stmt)
    questions = questions_result.scalars().all()
    
    quiz_data = {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "questions": []
    }
    
    # Collect questions and answers
    for question in questions:
        answers_stmt = select(db_models.QuizAnswer).where(
            db_models.QuizAnswer.question_id == question.id
        )
        answers_result = await db.execute(answers_stmt)
        answers = answers_result.scalars().all()
        
        question_data = {
            "id": question.id,
            "text": question.question_text,
            "type": question.question_type,
            "answers": [{"id": answer.id, "text": answer.answer_text} for answer in answers]
        }
        
        quiz_data["questions"].append(question_data)
    
    return quiz_data

@router.post("/quiz/{quiz_id}/submit", response_model=dict)
async def submit_quiz_answers(
    quiz_id: int,
    session_id: int,
    answers: dict,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(auth.get_current_user)
):
    """Submit answers for a quiz and get results."""
    try:
        # Validate that the session belongs to the user
        session_stmt = select(db_models.ChatSession).where(
            db_models.ChatSession.id == session_id,
            db_models.ChatSession.user_id == current_user.id
        )
        session_result = await db.execute(session_stmt)
        session = session_result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Submit and grade the quiz
        result = await education_service.submit_quiz(
            current_user.id, quiz_id, session_id, answers, db
        )
        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting quiz: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process quiz submission")

@router.post("/track/{pdf_id}/read", response_model=dict)
async def track_pdf_read(
    pdf_id: int,
    session_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(auth.get_current_user)
):
    """Track that a user has read a PDF in a specific session."""
    try:
        # Validate that the session belongs to the user
        session_stmt = select(db_models.ChatSession).where(
            db_models.ChatSession.id == session_id,
            db_models.ChatSession.user_id == current_user.id
        )
        session_result = await db.execute(session_stmt)
        session = session_result.scalar_one_or_none()
        
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
        
        # Validate that the PDF belongs to the user
        pdf_stmt = select(db_models.PDFDocument).where(
            db_models.PDFDocument.id == pdf_id,
            db_models.PDFDocument.user_id == current_user.id
        )
        pdf_result = await db.execute(pdf_stmt)
        pdf = pdf_result.scalar_one_or_none()
        
        if not pdf:
            raise HTTPException(status_code=404, detail="PDF not found")
        
        # Track the reading
        await education_service.track_pdf_opened_in_session(
            current_user.id, pdf_id, session_id, db
        )
        
        return {"message": "Reading progress tracked successfully"}
    
    except Exception as e:
        logger.error(f"Error tracking PDF read: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to track reading progress")

@router.get("/progress/session/{session_id}", response_model=list[dict])
async def get_session_progress(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(auth.get_current_user)
):
    """Get all PDF progress records for a session with additional data."""
    # Verify the session belongs to the user
    session_result = await db.execute(
        select(db_models.ChatSession).where(
            db_models.ChatSession.id == session_id,
            db_models.ChatSession.user_id == current_user.id
        )
    )
    session = session_result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Get all PDFs associated with the session, even those without progress
    query = (
        select(
            db_models.PDFDocument, 
            db_models.UserProgress
        )
        .join(
            db_models.ChatSessionPDF, 
            db_models.ChatSessionPDF.pdf_document_id == db_models.PDFDocument.id
        )
        .outerjoin(
            db_models.UserProgress,
            and_(
                db_models.UserProgress.pdf_document_id == db_models.PDFDocument.id,
                db_models.UserProgress.chat_session_id == session_id,
                db_models.UserProgress.user_id == current_user.id
            )
        )
        .where(
            db_models.ChatSessionPDF.chat_session_id == session_id,
            db_models.PDFDocument.user_id == current_user.id
        )
    )
    
    result = await db.execute(query)
    rows = result.all()
    
    # Extract PDF IDs for further queries
    pdf_ids = [row[0].id for row in rows]
    
    if not pdf_ids:
        return []  # No PDFs found, return empty list
    
    # Get all quizzes for these PDFs in a single query
    quizzes_query = select(db_models.Quiz).where(db_models.Quiz.pdf_document_id.in_(pdf_ids))
    quizzes_result = await db.execute(quizzes_query)
    quizzes = {quiz.pdf_document_id: quiz for quiz in quizzes_result.scalars().all()}
    
    # Get all quiz scores in a single query instead of querying for each PDF
    quiz_ids = [quiz.id for quiz in quizzes.values()]
    if quiz_ids:
        scores_query = (
            select(
                db_models.UserQuizSubmission.quiz_id,
                func.max(db_models.UserQuizSubmission.score).label("max_score")
            )
            .where(
                db_models.UserQuizSubmission.quiz_id.in_(quiz_ids),
                db_models.UserQuizSubmission.user_id == current_user.id,
                db_models.UserQuizSubmission.chat_session_id == session_id
            )
            .group_by(db_models.UserQuizSubmission.quiz_id)
        )
        scores_result = await db.execute(scores_query)
        quiz_scores = {row.quiz_id: row.max_score for row in scores_result}
    else:
        quiz_scores = {}
    
    # Build the response data
    progress_data = []
    
    for pdf, progress in rows:
        # Determine quiz information
        has_quiz = pdf.id in quizzes
        quiz_id = quizzes[pdf.id].id if has_quiz else None
        quiz_score = None
        
        # Get score if available
        if quiz_id and quiz_id in quiz_scores:
            quiz_score = quiz_scores[quiz_id]
        
        # Get progress information
        if progress:
            quiz_completed = progress.quiz_completed or False
            has_read = progress.has_read or False
            progress_percentage = progress.progress_percentage or 0
        else:
            has_read = False
            quiz_completed = False
            progress_percentage = 0

        # Add to response data
        progress_data.append({
            "id": pdf.id,
            "filename": pdf.filename,
            "has_quiz": has_quiz,
            "quiz_id": quiz_id,
            "has_read": has_read,
            "quiz_completed": quiz_completed,
            "progress_percentage": progress_percentage,
            "quiz_score": quiz_score,
            "mindmap": pdf.mindmap,
            "summary": pdf.pdf_summary
        })
    
    return progress_data