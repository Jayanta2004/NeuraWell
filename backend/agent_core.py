import os
import threading
from pydantic import BaseModel, Field
from typing import List, Literal
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_chroma import Chroma
from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.prompts import ChatPromptTemplate
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
    routing_decision: Literal['planner', 'intervention'] = Field(description="Route to 'intervention' if the user asks for a poem, story, or creative coping mechanism. Otherwise, route to 'planner'.")

# Planner/Intervention Agent Output Schema
class AgentOutput(BaseModel):
    reply: str = Field(description="The conversational reply to the user.")
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

def process_chat(user_message: str) -> dict:
    # Ensure OPENAI_API_KEY is available
    if not os.environ.get("OPENAI_API_KEY"):
        return {
            "reply": "Error: OPENAI_API_KEY is not set. Please check your .env file.",
            "action_plan": ["Set up OpenAI API Key.", "Restart the server.", "Try again."]
        }
        
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
    analysis_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    planner_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    intervention_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.9)

    # Create structured LLMs
    analyzer_agent = analysis_llm.with_structured_output(EmotionAnalysisOutput)
    planner_agent = planner_llm.with_structured_output(AgentOutput)
    intervention_agent = intervention_llm.with_structured_output(AgentOutput)
    
    # 2. Emotion Analysis
    analysis_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an emotion analysis agent. Analyze the user's message and determine their mood, severity, and routing. "
                   "Severity scoring criteria: "
                   "1-4: normal stress. "
                   "5-8: acute anxiety. "
                   "9-10: STRICTLY for mentions of self-harm or severe crisis. "
                   "Route to 'intervention' ONLY if the user explicitly asks for a poem, story, or creative writing. Otherwise route to 'planner'."),
        ("user", "{message}")
    ])
    
    analysis_chain = analysis_prompt | analyzer_agent
    analysis_result = analysis_chain.invoke({"message": user_message})
    
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
        
        return {
            "reply": emergency_reply,
            "action_plan": action_plan,
            "is_emergency": True,
            "mood": analysis_result.detected_mood,
            "severity": analysis_result.severity
        }
        
    # 3. Routing
    if analysis_result.routing_decision == 'planner':
        planner_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are a grounding planner agent. The user's mood is {mood} (Severity: {severity}/10). Generate a compassionate reply and a 3-step actionable grounding plan. Do not write poems or stories."),
            ("placeholder", "{history}"),
            ("user", "{message}")
        ])
        chain = planner_prompt | planner_agent
        result = chain.invoke({
            "mood": analysis_result.detected_mood, 
            "severity": analysis_result.severity,
            "history": history,
            "message": user_message
        })
    else:
        # Intervention Agent
        intervention_prompt = ChatPromptTemplate.from_messages([
            ("system", "You are an intervention agent with a deeply calming tone. The user's mood is {mood} (Severity: {severity}/10). Write a calming poem, story, or creative coping mechanism as requested, drawing inspiration from natural imagery (rivers, quiet spaces) and the spiritual depth of Bengali folk music. Bypass standard breathing exercises in your text, but provide a 3-step mindful action plan focused on reflection."),
            ("placeholder", "{history}"),
            ("user", "{message}")
        ])
        chain = intervention_prompt | intervention_agent
        result = chain.invoke({
            "mood": analysis_result.detected_mood, 
            "severity": analysis_result.severity,
            "history": history,
            "message": user_message
        })
        
    # 4. Save to memory
    memory.add_user_message(user_message)
    memory.add_ai_message(result.reply)
    save_to_vectorstore_async(f"AI: {result.reply}")
    
    return {
        "reply": result.reply,
        "action_plan": result.action_plan,
        "is_emergency": False,
        "mood": analysis_result.detected_mood,
        "severity": analysis_result.severity
    }
