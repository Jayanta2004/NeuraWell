import os
import asyncio
import threading
import json
from pydantic import BaseModel, Field
from typing import List, Literal
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from dotenv import load_dotenv

load_dotenv()

# We need a persistent directory for ChromaDB
persist_directory = "./chroma_db"

# Initialize embeddings and vector store
try:
    embeddings = OpenAIEmbeddings()
    vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
except Exception as e:
    print(f"Warning: Could not initialize ChromaDB/OpenAI. Make sure OPENAI_API_KEY is set. Error: {e}")
    embeddings = None
    vectorstore = None

# Emotion Analysis Agent Output Schema
class EmotionAnalysisOutput(BaseModel):
    detected_mood: str = Field(description="The detected mood of the user (e.g., anxious, sad, happy).")
    severity: int = Field(description="Severity of the mood from 1 to 10.", ge=1, le=10)

# Planner Agent Output Schema
class PlannerOutput(BaseModel):
    action_plan: List[str] = Field(description="A 3-step actionable plan.", min_items=3, max_items=3)

# Initialize memory
memory = InMemoryChatMessageHistory()

def save_to_vectorstore_async(text: str):
    def _save():
        try:
            if vectorstore is not None:
                vectorstore.add_texts([text])
        except Exception as e:
            print(f"Background thread error saving to ChromaDB: {e}")
    threading.Thread(target=_save, daemon=True).start()

def clear_memory():
    global memory
    memory.clear()

async def process_chat_stream(user_message: str):
    # Ensure OPENAI_API_KEY is available
    if not os.environ.get("OPENAI_API_KEY"):
        yield f"data: {json.dumps({'type': 'token', 'content': 'Error: OPENAI_API_KEY is not set. Please check your .env file.'})}\n\n"
        yield f"data: {json.dumps({'type': 'plan', 'content': ['Set up OpenAI API Key.', 'Restart the server.', 'Try again.']})}\n\n"
        return
        
    # Re-initialize vectorstore if it failed previously due to missing API key
    global vectorstore, embeddings
    if vectorstore is None:
        embeddings = OpenAIEmbeddings()
        vectorstore = Chroma(persist_directory=persist_directory, embedding_function=embeddings)

    # 1. Save user message to vector store for long-term tracking
    save_to_vectorstore_async(f"User: {user_message}")
    
    # Get conversation history
    history = memory.messages
    
    # Initialize LLMs
    analysis_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0)
    planner_llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
    intervention_llm = ChatOpenAI(model="gpt-4o", temperature=0.9, streaming=True)

    # Create structured LLMs
    analyzer_agent = analysis_llm.with_structured_output(EmotionAnalysisOutput)
    planner_agent = planner_llm.with_structured_output(PlannerOutput)
    
    # 2. Emotion Analysis
    analysis_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an emotion analysis agent. Analyze the user's message and determine their mood and severity. "
                   "Severity scoring criteria: "
                   "1-4: normal stress. "
                   "5-8: acute anxiety. "
                   "9-10: STRICTLY for mentions of self-harm or severe crisis."),
        ("user", "{message}")
    ])
    
    analysis_chain = analysis_prompt | analyzer_agent
    analysis_result = await analysis_chain.ainvoke({"message": user_message})
    
    # Critical Escalation Guardrail
    if analysis_result.severity >= 9:
        emergency_reply = "I'm so sorry you're feeling this way, but please know you are not alone. There is support available right now."
        action_plan = [
            "Call or text 988 (Suicide & Crisis Lifeline) available 24/7.",
            "Reach out to a trusted friend or family member immediately.",
            "Seek immediate professional help or go to the nearest emergency room."
        ]
        
        memory.add_user_message(user_message)
        memory.add_ai_message(emergency_reply)
        save_to_vectorstore_async(f"AI: {emergency_reply}")
        
        yield f"data: {json.dumps({'type': 'metadata', 'mood': analysis_result.detected_mood, 'severity': analysis_result.severity, 'is_emergency': True})}\n\n"
        yield f"data: {json.dumps({'type': 'token', 'content': emergency_reply})}\n\n"
        yield f"data: {json.dumps({'type': 'plan', 'content': action_plan})}\n\n"
        return
        
    # 3. Concurrent Execution
    yield f"data: {json.dumps({'type': 'metadata', 'mood': analysis_result.detected_mood, 'severity': analysis_result.severity, 'is_emergency': False})}\n\n"
    
    planner_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a grounding planner agent. The user's mood is {mood} (Severity: {severity}/10). Generate a 3-step actionable grounding plan. Do not write poems or stories, just output the plan."),
        ("placeholder", "{history}"),
        ("user", "{message}")
    ])
    planner_chain = planner_prompt | planner_agent
    
    intervention_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an intervention agent with a deeply calming tone. The user's mood is {mood} (Severity: {severity}/10). Write a calming, conversational reply. If they asked for a poem or story, provide it, drawing inspiration from natural imagery (rivers, quiet spaces) and the spiritual depth of Bengali folk music. Do not provide a list or action plan, just the conversational response."),
        ("placeholder", "{history}"),
        ("user", "{message}")
    ])
    intervention_chain = intervention_prompt | intervention_llm | StrOutputParser()

    planner_task = asyncio.create_task(planner_chain.ainvoke({
        "mood": analysis_result.detected_mood, 
        "severity": analysis_result.severity,
        "history": history,
        "message": user_message
    }))
    
    full_reply = ""
    async for chunk in intervention_chain.astream({
        "mood": analysis_result.detected_mood, 
        "severity": analysis_result.severity,
        "history": history,
        "message": user_message
    }):
        full_reply += chunk
        yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"

    planner_res = await planner_task
    yield f"data: {json.dumps({'type': 'plan', 'content': planner_res.action_plan})}\n\n"
        
    # 4. Save to memory
    memory.add_user_message(user_message)
    memory.add_ai_message(full_reply)
    save_to_vectorstore_async(f"AI: {full_reply}")
