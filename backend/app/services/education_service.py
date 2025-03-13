import google.generativeai as genai
import json
import logging
from app.core.config import settings
from app.models import db_models

logger = logging.getLogger(__name__)

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

async def generate_pdf_summary(text: str, filename: str) -> str:
    """Generate a concise summary of the PDF content."""
    try:
        prompt = f"""
        Please provide a concise summary of the following document titled "{filename}".
        Focus on the key points, main arguments, and important conclusions.
        The summary should be 3-5 paragraphs long.
        
        DOCUMENT TEXT:
        {text}
        
        SUMMARY:
        """
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,
                "max_output_tokens": 2048,
                "response_mime_type": "text/plain"
            },
        )
        
        return response.text
    except Exception as e:
        logger.error(f"Error generating PDF summary: {str(e)}", exc_info=True)
        return f"Summary generation failed: {str(e)}"

async def generate_quiz_for_pdf(text: str, pdf_id: int, db) -> dict:
    """Generate a quiz based on PDF content and save it to the database."""
    try:
        prompt = f"""
        Create a multiple-choice quiz based on the following content.
        The quiz should test understanding of the key concepts and information.
        Generate 5 multiple-choice questions, each with 4 answer options.
        
        Include exactly one correct answer for each question.

        Format your response as JSON with this structure:
        {{
            "title": "Quiz title related to the content",
            "questions": [
                {{
                    "question": "Question text?",
                    "type": "multiple_choice",
                    "answers": [
                        {{ "text": "Answer option 1", "correct": true/false }},
                        {{ "text": "Answer option 2", "correct": true/false }},
                        {{ "text": "Answer option 3", "correct": true/false }},
                        {{ "text": "Answer option 4", "correct": true/false }}
                    ]
                }}
            ]
        }}
        
        CONTENT:
        {text[:15000]}  # Limiting to first 15K chars for prompt size
        
        """
        
        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.3,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json"
            },
        )
        
        # Parse the quiz JSON
        quiz_data = json.loads(response.text)
        
        # Create quiz in database
        quiz = db_models.Quiz(
            pdf_document_id=pdf_id,
            title=quiz_data['title'],
            description="Auto-generated quiz"
        )
        
        db.add(quiz)
        await db.flush()  # Get the ID without full commit
        
        # Create questions and answers
        for q_data in quiz_data['questions']:
            question = db_models.QuizQuestion(
                quiz_id=quiz.id,
                question_text=q_data['question'],
                question_type=q_data.get('type', 'multiple_choice')
            )
            
            db.add(question)
            await db.flush()
            
            for a_data in q_data['answers']:
                answer = db_models.QuizAnswer(
                    question_id=question.id,
                    answer_text=a_data['text'],
                    is_correct=a_data['correct']
                )
                db.add(answer)
        
        await db.commit()
        return {"quiz_id": quiz.id, "title": quiz.title}
    
    except Exception as e:
        await db.rollback()
        logger.error(f"Error generating quiz: {str(e)}", exc_info=True)
        raise

async def track_pdf_opened_in_session(user_id: int, pdf_id: int, session_id: int, db) -> None:
    """Track that a user has opened a PDF in a specific session."""
    from sqlalchemy import select
    
    # Check if progress entry exists
    stmt = select(db_models.UserProgress).where(
        db_models.UserProgress.user_id == user_id,
        db_models.UserProgress.pdf_document_id == pdf_id,
        db_models.UserProgress.chat_session_id == session_id
    )
    
    result = await db.execute(stmt)
    progress = result.scalar_one_or_none()
    
    if progress:
        # Update existing progress
        progress.has_read = True
        if not progress.quiz_completed:
            progress.progress_percentage = 50.0  # Reading is 50% of progress
    else:
        # Create new progress entry
        progress = db_models.UserProgress(
            user_id=user_id,
            pdf_document_id=pdf_id,
            chat_session_id=session_id,
            has_read=True,
            progress_percentage=50.0
        )
        db.add(progress)
    
    await db.commit()

async def submit_quiz(user_id: int, quiz_id: int, session_id: int, answers: dict, db) -> dict:
    """Process quiz submission and update progress."""
    from sqlalchemy import select
    
    # Verify the quiz exists and get its questions
    stmt = select(db_models.Quiz).where(db_models.Quiz.id == quiz_id)
    result = await db.execute(stmt)
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise ValueError("Quiz not found")
    
    # Get all questions with their correct answers
    questions_stmt = select(db_models.QuizQuestion).where(
        db_models.QuizQuestion.quiz_id == quiz_id
    )
    questions_result = await db.execute(questions_stmt)
    questions = questions_result.scalars().all()
    
    # Grade the quiz
    total_questions = len(questions)
    correct_answers = 0
    
    for question in questions:
        # Get the correct answer for this question
        answers_stmt = select(db_models.QuizAnswer).where(
            db_models.QuizAnswer.question_id == question.id,
            db_models.QuizAnswer.is_correct == True
        )
        answers_result = await db.execute(answers_stmt)
        correct_answer = answers_result.scalar_one_or_none()
        
        # Check if the user's answer matches the correct answer
        if correct_answer and str(question.id) in answers:
            if answers[str(question.id)] == correct_answer.id:
                correct_answers += 1
    
    # Calculate score as percentage
    score = (correct_answers / total_questions) * 100 if total_questions > 0 else 0
    
    # Save the submission
    submission = db_models.UserQuizSubmission(
        user_id=user_id,
        quiz_id=quiz_id,
        chat_session_id=session_id,
        score=score
    )
    db.add(submission)
    
    # Update user progress
    pdf_id = quiz.pdf_document_id
    
    progress_stmt = select(db_models.UserProgress).where(
        db_models.UserProgress.user_id == user_id,
        db_models.UserProgress.pdf_document_id == pdf_id,
        db_models.UserProgress.chat_session_id == session_id
    )
    progress_result = await db.execute(progress_stmt)
    progress = progress_result.scalar_one_or_none()
    
    if progress:
        progress.quiz_completed = True
        # If they've read the document, they get 50% + (quiz score / 2)
        # If they haven't read it, they just get quiz score / 2
        base_progress = 50.0 if progress.has_read else 0.0
        progress.progress_percentage = base_progress + (score / 2)
    else:
        # Create new progress entry if it doesn't exist
        progress = db_models.UserProgress(
            user_id=user_id,
            pdf_document_id=pdf_id,
            chat_session_id=session_id,
            has_read=False,
            quiz_completed=True,
            progress_percentage=score / 2  # Quiz is 50% of progress
        )
        db.add(progress)
    
    await db.commit()
    
    return {
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "progress": progress.progress_percentage
    }