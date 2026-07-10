import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface Message {
  role: 'user' | 'bot';
  content: string;
  isEmergency?: boolean;
  timestamp?: string;
}

interface ChatInterfaceProps {
  onNewActionPlan: (plan: string[]) => void;
  onMoodUpdate: (mood: string, severity: number) => void;
}

export default function ChatInterface({ onNewActionPlan, onMoodUpdate }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      content: 'Hello! I am NeuraWell. How are you feeling today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Set initial timestamp on mount to avoid SSR hydration mismatch
    setMessages(prev => {
      if (prev.length > 0 && !prev[0].timestamp) {
        const newMessages = [...prev];
        newMessages[0] = { ...newMessages[0], timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        return newMessages;
      }
      return prev;
    });
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: timeNow }]);
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: data.reply,
        isEmergency: data.is_emergency,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      if (data.action_plan) {
        onNewActionPlan(data.action_plan);
      }
      if (data.mood && data.severity) {
        onMoodUpdate(data.mood, data.severity);
      }
    } catch (error) {
      console.error("Error communicating with the backend:", error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: 'Sorry, I am having trouble connecting to the server.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    console.log("Clear chat button clicked");
    try {
      console.log("Calling /api/clear");
      await fetch('http://127.0.0.1:5000/api/clear', { method: 'POST' });
      setMessages([{ 
        role: 'bot', 
        content: 'Hello! I am NeuraWell. How are you feeling today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      onNewActionPlan([]);
      onMoodUpdate('', 0);
    } catch (error) {
      console.error('Failed to clear chat memory:', error);
    }
  };

  const handleExportChat = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Export chat button clicked, generating file...");
    const chatText = messages.map(m => `${m.role === 'bot' ? 'NeuraWell' : 'You'}: ${m.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.setAttribute('download', 'NeuraWell_Chat_Export.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Delay revocation to ensure the browser has time to start the download
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please try Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result) => result.transcript)
        .join('');
      
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const icebreakers = [
    "I'm feeling a bit anxious.",
    "Can you guide me through a breathing exercise?",
    "I'm having trouble sleeping.",
    "Tell me a calming story."
  ];

  return (
    <div className="flex flex-col h-full bg-transparent border-r border-white/40 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/80 dark:border-white/5 bg-white/70 dark:bg-navy/40 backdrop-blur-3xl sticky top-0 z-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/20 transition-colors duration-300">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple to-indigo-600 flex items-center justify-center text-white mr-4 shadow-md shadow-purple/20">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-700 dark:text-white drop-shadow-sm dark:drop-shadow-md transition-colors duration-300">NeuraWell Chat</h1>
            <p className="text-sm text-stone-400 dark:text-stone-300 font-medium transition-colors duration-300">Your safe space to talk</p>
          </div>
        </div>
        
        {/* Chat Controls */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          <button onClick={handleExportChat} className="text-xs font-semibold px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-slate-600 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            Export
          </button>
          <button onClick={handleClearChat} className="text-xs font-semibold px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 text-red-500 dark:text-red-400 hover:bg-red-500/15 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300">
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => {
          const isPoem = msg.role === 'bot' && !msg.isEmergency && msg.content.split('\n').length > 3;
          
          return (
            <div key={idx} className={`flex animate-slide-up-fade ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm dark:shadow-md ${msg.role === 'user' ? 'bg-gradient-to-br from-sky-500 to-indigo-500 ml-3 shadow-sky-500/20' : 'bg-white/70 dark:bg-navy/60 border border-white/80 dark:border-white/10 mr-3 transition-colors duration-300'}`}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-purple" />}
                </div>
                <div className={`p-4 rounded-2xl whitespace-pre-wrap transition-colors duration-300 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white rounded-tr-none shadow-md dark:shadow-lg shadow-sky-500/20 border-t border-white/20 border-l border-white/10' 
                    : msg.isEmergency
                      ? 'bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-rose-100 border-t border-red-100 dark:border-red-500/50 border-l border-red-50 dark:border-red-500/20 backdrop-blur-xl rounded-tl-none shadow-[0_8px_30px_rgba(239,68,68,0.1)] dark:shadow-[0_8px_30px_rgba(239,68,68,0.15)]'
                      : isPoem
                        ? 'bg-white/70 dark:bg-navy/60 text-stone-500 dark:text-slate-200 border-t border-purple/10 dark:border-purple/40 border-l border-purple/5 dark:border-purple/20 backdrop-blur-xl rounded-tl-none shadow-[0_8px_30px_rgba(139,92,246,0.08)] dark:shadow-[0_8px_30px_rgba(139,92,246,0.15)] font-serif tracking-wide'
                        : 'bg-white/80 dark:bg-navy/40 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-none dark:border-t dark:border-white/10 dark:border-l dark:border-white/5 backdrop-blur-xl rounded-tl-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/20'
                }`}>
                  {msg.content}
                  {msg.timestamp && (
                    <span className={`text-[10px] block mt-1.5 opacity-60 font-medium ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-start mb-6 animate-slide-up-fade">
            <div className="flex flex-row max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 dark:bg-navy/60 border border-white/80 dark:border-white/10 mr-3 flex items-center justify-center shadow-sm dark:shadow-md transition-colors duration-300">
                <Bot size={16} className="text-purple" />
              </div>
              <div className="flex items-center space-x-1.5 px-5 py-4 rounded-2xl bg-white/70 dark:bg-navy/40 backdrop-blur-xl border border-white/80 dark:border-none dark:border-t dark:border-white/10 dark:border-l dark:border-white/5 text-stone-300 rounded-tl-none shadow-sm shadow-stone-200/50 dark:shadow-lg dark:shadow-black/20 h-[58px] transition-colors duration-300">
                <span className="w-2 h-2 rounded-full bg-purple-light" style={{ animation: 'typingDot 1.4s infinite both', animationDelay: '0s' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-light" style={{ animation: 'typingDot 1.4s infinite both', animationDelay: '0.2s' }}></span>
                <span className="w-2 h-2 rounded-full bg-purple-light" style={{ animation: 'typingDot 1.4s infinite both', animationDelay: '0.4s' }}></span>
              </div>
            </div>
          </div>
        )}
        {/* Icebreaker Prompts */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-col items-center justify-center mt-10 space-y-4 animate-slide-up-fade">
            <p className="text-sm text-foreground/50 mb-2">Not sure what to say? Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-3 max-w-[80%]">
              {icebreakers.map((text, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setInput(text);
                    setTimeout(() => document.getElementById('send-btn')?.click(), 50);
                  }}
                  className="px-5 py-2.5 rounded-full border border-purple/20 dark:border-purple/30 bg-black/5 dark:bg-white/5 backdrop-blur-md text-purple-dark dark:text-purple-light font-medium text-sm hover:bg-purple/10 dark:hover:bg-purple/20 hover:border-purple/40 dark:hover:border-purple/50 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_4px_20px_rgba(139,92,246,0.2)] transition-all duration-300 cursor-pointer"
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-6 bg-white/70 dark:bg-navy/20 backdrop-blur-3xl border-t border-white/80 dark:border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.02)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.3)] relative z-10 transition-colors duration-300">
        <div className="relative flex items-center max-w-4xl mx-auto w-full">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isListening ? "Listening..." : "Type your message here..."}
            className="w-full bg-white/80 dark:bg-black/30 border border-stone-100/60 dark:border-white/10 focus:border-purple focus:ring-1 focus:ring-purple rounded-full py-4 pl-6 pr-32 text-slate-700 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-400 transition-all shadow-sm dark:shadow-inner backdrop-blur-2xl font-medium"
            disabled={isLoading}
          />
          <button
            onClick={toggleListening}
            title={isListening ? "Stop listening" : "Start voice dictation"}
            className={`absolute right-16 p-2.5 rounded-full transition-all duration-300 ${
              isListening ? 'bg-red-50 dark:bg-red-500/20 text-red-500 dark:text-red-400 animate-pulse' : 'text-stone-400 hover:text-stone-500 dark:hover:text-white hover:bg-stone-100/50 dark:hover:bg-white/10'
            }`}
          >
            <Mic size={20} />
          </button>
          <button 
            id="send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-3.5 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white disabled:opacity-50 transition-all duration-300 shadow-md shadow-indigo-600/30 hover:shadow-lg hover:shadow-indigo-600/40 hover:-translate-y-0.5"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
