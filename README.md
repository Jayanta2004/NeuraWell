# NeuraWell

NeuraWell is a mental wellness web application featuring an AI-powered chatbot designed to help users navigate their mental health, build action plans, and track their moods.

## Project Structure

The project consists of two main components:

- **Frontend**: A modern, responsive web application built with [Next.js](https://nextjs.org/), React, and Tailwind CSS.
- **Backend**: A robust API server built with Python, Flask, and an AI agent core (handling conversational logic).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Python (3.9 or higher)

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (recommended):
   ```bash
   python -m venv test_venv
   # On Windows:
   test_venv\Scripts\activate
   # On macOS/Linux:
   source test_venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up your environment variables:
   Create a `.env` file in the `backend` directory based on the provided `.env.example` file and add your API keys.
5. Start the backend server:
   ```bash
   python app.py
   ```

## Technologies Used

- **Frontend**: Next.js, React, Tailwind CSS, Lucide React (Icons)
- **Backend**: Python, Flask, Flask-CORS
- **AI Core**: LangChain / Custom LLM Integrations, ChromaDB (Vector Database)

## License

This project is licensed under the MIT License.
