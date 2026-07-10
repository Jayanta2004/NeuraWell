# 🧠 NeuraWell

NeuraWell is an AI-powered mental wellness application that offers users a safe space to navigate their emotions. With a compassionate AI agent, NeuraWell provides emotional analysis, actionable grounding plans, and creative interventions (like storytelling and poetry) tailored to the user's current mood.

## ✨ Key Features

- **Empathetic AI Chatbot:** Driven by concurrent LLM architectures, providing context-aware and compassionate responses.
- **Emotion & Severity Analysis:** Automatically analyzes the user's sentiment to route them to the appropriate agent logic.
- **Concurrent Agent Processing:** Uses `asyncio` to run the Planner Agent (generating actionable steps via `gpt-3.5-turbo`) and the Intervention Agent (providing creative, soothing conversation via `gpt-4o`) in parallel for lightning-fast responses.
- **Real-Time SSE Streaming:** Utilizes Server-Sent Events to stream AI text tokens to the UI in real-time, eliminating loading delays.
- **Long-term Conversation Memory:** Utilizes **ChromaDB** (Vector Database) and OpenAI Embeddings to persist chat history for context-aware continued conversations.
- **Modern UI/UX:** A stunning, responsive frontend built with Next.js, React, Tailwind CSS, and elegant glassmorphism design.

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
```

**Environment Variables:**
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
```

**Start the Client:**
```bash
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
- Python & Flask (with `flask[async]`)
- **Server-Sent Events (SSE):** Streams multiplexed JSON tokens for real-time rendering.
- **LangChain:** Orchestrates LLM chains and agents
- **OpenAI (`gpt-3.5-turbo` & `gpt-4o`):** Balances speed and high-quality creative output.
- **ChromaDB:** Local vector database for persistent conversation embeddings
- **Pydantic:** Structured LLM outputs for agent routing

## 📄 License

This project is licensed under the MIT License.
