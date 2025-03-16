# Perplexia Education Edition

Perplexia Education Edition is an AI-powered RAG chat application that enhances Learning with real-time web search and document processing capabilities.

## ✨ Features

- **AI-Powered Chat** – Engage in meaningful conversations with an advanced AI model.
- **Web Search Mode** – Toggle search mode to receive responses backed by real-time web data.
- **Source Citations** – Verify information with direct links to the sources used.
- **PDF Document Processing** – Upload PDFs and interact with their contents via chat.
- **Mind Maps** – Mind Maps for each PDF to learn visually.
- **Progress Tracker** – Track Progress of learning through uploaded PDFS.
- **Dynamic PDF based Quizzes** – Dynamic quizzes to test your knowledge.
- **User Authentication** – Secure account management powered by Clerk.
- **Session Management** – Create, rename, and manage multiple chat sessions.
- **Responsive Design** – Sleek, modern UI optimized for all devices.

## 🚀 Tech Stack

### Frontend

- React
- TypeScript
- Vite
- TanStack Router
- Tailwind CSS
- Radix UI Components
- Shadcn UI Components
- Axios (API requests)

### Backend

- FastAPI (Python)
- SQLAlchemy
- Gemini API (AI model)
- Tavily Search API
- Neon Vector Database
- Supabase PostgresSQL Database
- PDF processing

## 📋 Prerequisites

- Node.js 18+ and PNPM
- Python 3.10+
- API keys for:
- Clerk (authentication)
- Gemini (AI model)
- Tavily (search)

## ⚙️ Installation

### Backend Setup

# Clone the repository
```
git clone https://github.com/Ad1tyaNarayana/perplexia.git
cd perplexia/backend
```

# Create and activate virtual environment
```
python -m venv venv
source venv/bin/activate # Windows: venv\\Scripts\\activate
```
# Install dependencies
```
pip install -r requirements.txt
```
# Start the backend server
```
uvicorn app.main:app --reload
```
### Frontend Setup
```
# Navigate to frontend directory
cd ../frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

## 📝 Usage

1. **Register/Login** – Sign up or log in with your account.
2. **Start a Chat** – Create a new conversation or pick up where you left off.
3. **Toggle Search Mode** – Enable search mode for AI answers powered by real-time web data.
4. **Upload Documents** – Use the PDF uploader to chat with your documents.
5. **View Sources** – Click \"View Sources\" on AI responses to check the citations.
