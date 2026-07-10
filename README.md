# 🧠 NeuraWell

NeuraWell is an AI-powered mental wellness application that offers users a safe space to navigate their emotions. With a compassionate AI agent, NeuraWell provides emotional analysis, actionable grounding plans, and creative interventions (like storytelling and poetry) tailored to the user's current mood.

## ✨ Key Features

- **Empathetic AI Chatbot:** Driven by `gpt-4o-mini`, providing context-aware and compassionate responses.
- **Emotion & Severity Analysis:** Automatically analyzes the user's sentiment to route them to the appropriate agent (e.g., Planner Agent for actionable steps, Intervention Agent for creative soothing, or Emergency Guardrail for severe cases).
- **Long-term Conversation Memory:** Utilizes **ChromaDB** (Vector Database) and OpenAI Embeddings to persist chat history for context-aware continued conversations.
- **Modern UI/UX:** A stunning, responsive frontend built with Next.js, React, Tailwind CSS, and glassmorphism design principles.

## 📁 Project Structure

- `frontend/`: Next.js web application with a dynamic and beautiful chat interface.
- `backend/`: Python Flask REST API integrating LangChain, OpenAI, and ChromaDB.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (3.9 or higher)
- OpenAI API Key

### 1. Backend Setup

The backend handles the AI logic, routing, and database storage.

```bash
cd backend
python -m venv test_venv

# Activate Virtual Environment (Windows)
test_venv\Scripts\activate
# Activate Virtual Environment (macOS/Linux)
source test_venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

**Environment Variables:**
Create a `.env` file in the `backend` directory:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

**Start the Server:**
```bash
python app.py
```
*The backend will run on `http://127.0.0.1:5000`.*

### 2. Frontend Setup

The frontend provides the sleek user interface.

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

*Open [http://localhost:3000](http://localhost:3000) in your browser.*

## 🛠️ Technologies Used

### Frontend
- Next.js
- React
- Tailwind CSS
- Lucide React (Icons)

### Backend & AI Core
- Python & Flask
- **LangChain:** Orchestrates LLM chains and agents
- **OpenAI (`gpt-4o-mini`):** Powers the core conversational and analysis models
- **ChromaDB:** Local vector database for persistent conversation embeddings
- **Pydantic:** Structured LLM outputs for agent routing

## 📄 License

This project is licensed under the MIT License.
