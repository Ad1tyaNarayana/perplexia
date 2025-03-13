// src/types/index.ts

export interface User {
  id: number;
  email: string;
  username: string;
}

export interface ChatMessage {
  id: number;
  content: string;
  is_user_message: boolean;
  created_at: string;
  searchData?: any;
}

export interface ChatSession {
  id: number;
  name: string;
  created_at: string;
  message_count?: number;
  messages?: ChatMessage[];
}

export interface MindMap {
  title: string;
  nodes: Array<{
    id: string;
    label: string;
    type: string;
  }>;
  links: Array<{
    source: string;
    target: string;
    type: string;
    description?: string;
  }>;
}

export interface PdfDocument {
  id: number;
  filename: string;
  upload_date: string;
  mindmap?: MindMap;
}

export interface ChatRequest {
  message: string;
  session_id?: number;
}

export interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: string;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  id: number;
  answer_text: string;
  is_correct?: boolean;
}

export interface Quiz {
  id: number;
  title: string;
  description: string;
  pdf_document_id: number;
  questions: QuizQuestion[];
}

export interface PdfProgress {
  id: number;
  filename: string;
  has_quiz: boolean;
  quiz_id: number | null;
  has_read: boolean;
  quiz_completed: boolean;
  progress_percentage: number;
}
