import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, Menu, X, Trash2, Download } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000';

interface Message {
  role: 'user' | 'bot';
  content: string;
  isEmergency?: boolean;
  timestamp?: string;
}

interface ChatInterfaceProps {
  onNewActionPlan: (plan: string[]) => void;
  onMoodUpdate: (mood: string, severity: number) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function ChatInterface({ onNewActionPlan, onMoodUpdate, onToggleSidebar, isSidebarOpen }: ChatInterfaceProps) {
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
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
        signal: abortControllerRef.current.signal
      });
      
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader available");
      
      const decoder = new TextDecoder();
      let botMessageIndex = -1;
      let buffer = '';

      setMessages(prev => {
        botMessageIndex = prev.length;
        return [...prev, { role: 'bot', content: '', timestamp: timeNow }];
      });
      
      setIsLoading(false); // Hide the loading skeleton

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || ''; 
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (!dataStr.trim()) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'metadata') {
                if (data.mood && data.severity !== undefined) {
                  onMoodUpdate(data.mood, data.severity);
                }
                if (data.is_emergency !== undefined) {
                  setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[botMessageIndex] = {
                      ...newMessages[botMessageIndex],
                      isEmergency: data.is_emergency
                    };
                    return newMessages;
                  });
                }
              } else if (data.type === 'token') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[botMessageIndex] = {
                    ...newMessages[botMessageIndex],
                    content: newMessages[botMessageIndex].content + data.content
                  };
                  return newMessages;
                });
              } else if (data.type === 'plan') {
                onNewActionPlan(data.content);
              }
            } catch (e) {
              console.error("Error parsing SSE data", e, dataStr);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log("Fetch aborted");
        return;
      }
      console.error("Error communicating with the backend:", error);
      setIsLoading(false);
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === 'bot' && !lastMsg.content) {
            const newMsgs = [...prev];
            newMsgs[newMsgs.length - 1].content = 'Sorry, I am having trouble connecting to the server.';
            return newMsgs;
        }
        return [...prev, { 
          role: 'bot', 
          content: 'Sorry, I am having trouble connecting to the server.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }];
      });
    }
  };

  const handleClearChat = async () => {
    console.log("Clear chat button clicked");
    try {
      console.log("Calling /api/clear");
      await fetch(`${API_URL}/api/clear`, { method: 'POST' });
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

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    <div className="flex-1 min-h-0 w-full flex flex-col h-full bg-transparent border-r border-white/40 dark:border-white/5 relative overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/40 dark:border-white/5 bg-background/95 backdrop-blur shadow-sm shrink-0 z-50">
        <div className="flex items-center min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-3 sm:mr-4 shadow-md shadow-purple/20 overflow-hidden bg-white shrink-0">
            <Image src="/NeuraWell_logo.jpg" alt="NeuraWell Logo" width={40} height={40} className="object-cover w-full h-full" />
          </div>
          <div className="min-w-0 pr-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-700 dark:text-white drop-shadow-sm dark:drop-shadow-md transition-colors duration-300 truncate">NeuraWell Chat</h1>
            <p className="hidden sm:block text-sm text-stone-400 dark:text-stone-300 font-medium transition-colors duration-300">Your safe space to talk</p>
          </div>
        </div>
        
        {/* Chat Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex">
            <ThemeToggle />
          </div>
          <button onClick={handleExportChat} title="Export Chat" className="flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors">
            <Download size={20} className="sm:mr-1.5" />
            <span className="hidden sm:block text-xs font-semibold">Export</span>
          </button>
          <button onClick={handleClearChat} title="Clear Chat" className="flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Trash2 size={20} className="sm:mr-1.5" />
            <span className="hidden sm:block text-xs font-semibold">Clear</span>
          </button>
          {onToggleSidebar && (
            <button 
              onClick={onToggleSidebar}
              className="md:hidden flex items-center justify-center p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/10 transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>
      
      {/* MAIN CHAT AREA */}
      <main className="flex-1 min-h-0 flex flex-col relative">
        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 relative">
        {messages.map((msg, idx) => {
          const isPoem = msg.role === 'bot' && !msg.isEmergency && msg.content.split('\n').length > 3;
          
          return (
            <div key={idx} className={`flex animate-slide-up-fade ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[95%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm dark:shadow-md ${msg.role === 'user' ? 'bg-gradient-to-br from-sky-500 to-indigo-500 ml-3 shadow-sky-500/20' : 'bg-white/70 dark:bg-navy/60 border border-white/80 dark:border-white/10 mr-3 transition-colors duration-300 animate-pulse'}`}>
                  {msg.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-purple" />}
                </div>
                <div className={`p-4 rounded-2xl whitespace-pre-wrap transition-colors duration-300 ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white rounded-tr-none shadow-md dark:shadow-lg shadow-sky-500/20 border-t border-white/20 border-l border-white/10' 
                    : msg.isEmergency
                      ? 'bg-red-50/80 dark:bg-red-950/40 text-red-800 dark:text-rose-100 border-t border-red-100 dark:border-red-500/50 border-l border-red-50 dark:border-red-500/20 backdrop-blur-xl rounded-tl-none shadow-[0_8px_30px_rgba(239,68,68,0.1)] dark:shadow-[0_8px_30px_rgba(239,68,68,0.15)]'
                      : isPoem
                        ? 'bg-white/70 dark:bg-navy/60 text-stone-500 dark:text-slate-200 border-t border-purple/10 dark:border-purple/40 border-l border-purple/5 dark:border-purple/20 backdrop-blur-xl rounded-tl-none shadow-[0_8px_30px_rgba(139,92,246,0.08)] dark:shadow-[0_8px_30px_rgba(139,92,246,0.15)] font-serif tracking-wide'
                        : 'bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-white/5 backdrop-blur-xl rounded-tl-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-lg dark:shadow-black/20'
                }`}>
                  {msg.content}
                  {msg.timestamp && (
                    <span className={`text-[10px] block mt-1.5 font-medium text-gray-400 dark:text-white/60 ${msg.role === 'user' ? 'text-right text-white/80' : 'text-left'}`}>
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
            <div className="flex flex-row max-w-[95%] sm:max-w-[80%]">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/70 dark:bg-navy/60 border border-white/80 dark:border-white/10 mr-3 flex items-center justify-center shadow-sm dark:shadow-md transition-colors duration-300 animate-pulse">
                <Bot size={16} className="text-purple" />
              </div>
              <div className="flex items-center space-x-3 px-5 py-4 rounded-2xl bg-white/70 dark:bg-navy/40 backdrop-blur-xl border border-white/80 dark:border-none dark:border-t dark:border-white/10 dark:border-l dark:border-white/5 text-slate-500 dark:text-slate-300 rounded-tl-none shadow-sm shadow-stone-200/50 dark:shadow-lg dark:shadow-black/20 h-[58px] transition-colors duration-300">
                <span className="text-sm font-medium animate-pulse">NeuraWell is thinking...</span>
                <div className="flex space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple/50 dark:bg-purple-light/50" style={{ animation: 'typingDot 1.4s infinite both', animationDelay: '0s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple/50 dark:bg-purple-light/50" style={{ animation: 'typingDot 1.4s infinite both', animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-purple/50 dark:bg-purple-light/50" style={{ animation: 'typingDot 1.4s infinite both', animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Icebreaker Prompts */}
        {messages.length === 1 && !isLoading && (
          <div className="flex flex-col items-center justify-center mt-10 space-y-4 animate-slide-up-fade px-2 text-center">
            <p className="text-sm text-foreground/50 mb-2">Not sure what to say? Try one of these:</p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-full sm:max-w-[80%]">
              {icebreakers.map((text, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    setInput(text);
                    setTimeout(() => document.getElementById('send-btn')?.click(), 50);
                  }}
                  className="px-5 py-2.5 rounded-full border border-purple/20 dark:border-purple/30 bg-black/5 dark:bg-white/5 backdrop-blur-md text-purple-dark dark:text-purple-light font-medium text-sm hover:bg-purple-800/30 dark:hover:bg-purple-800/30 hover:border-purple/40 dark:hover:border-purple/50 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(139,92,246,0.15)] dark:hover:shadow-[0_4px_20px_rgba(139,92,246,0.2)] transition-all duration-200 ease-in-out cursor-pointer"
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
      <div className="sticky bottom-0 left-0 w-full bg-background border-t border-border/50 z-40 p-4 pb-0 mb-0 mt-auto shrink-0">
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
      </main>
    </div>
  );
}
