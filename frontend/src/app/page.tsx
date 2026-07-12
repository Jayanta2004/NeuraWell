"use client";

import { useState } from "react";
import { X } from "lucide-react";
import ChatInterface from "@/components/ChatInterface";
import ActionPlan from "@/components/ActionPlan";
import MoodWidget from "@/components/MoodWidget";

export default function Home() {
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMoodUpdate = (newMood: string, newSeverity: number) => {
    setMood(newMood);
    setSeverity(newSeverity);
  };

  return (
    <main className="flex flex-col md:flex-row h-[100dvh] w-full bg-background overflow-hidden relative">
      {/* Chat Interface */}
      <section className="w-full md:w-[70%] flex-1 min-h-0 flex flex-col relative z-10">
        <ChatInterface
          onNewActionPlan={setActionPlan}
          onMoodUpdate={handleMoodUpdate}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </section>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <section className={`fixed md:relative top-0 right-0 z-50 md:z-10 w-full max-w-sm md:max-w-none md:w-[30%] h-full flex flex-col gap-6 bg-slate-50 dark:bg-[#0B0F19] backdrop-blur-3xl border-l border-white/80 dark:border-white/5 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
        
        {/* Mobile Sidebar Header with Close Button */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-stone-200 dark:border-white/5 bg-white/50 dark:bg-navy/20 backdrop-blur-md sticky top-0 z-20">
          <span className="font-bold text-slate-700 dark:text-white">Insights & Plan</span>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <MoodWidget mood={mood} severity={severity} />
        <ActionPlan plan={actionPlan} />
      </section>

      {/* Aurora Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-background transition-colors duration-500">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-sky-200/30 dark:bg-violet-900/30 blur-[120px] mix-blend-normal dark:mix-blend-screen animate-aurora"></div>
        <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-indigo-200/20 dark:bg-cyan-900/20 blur-[100px] mix-blend-normal dark:mix-blend-screen animate-aurora-fast" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[80%] h-[80%] rounded-full bg-teal-100/30 dark:bg-rose-900/10 blur-[140px] mix-blend-normal dark:mix-blend-screen animate-aurora" style={{ animationDelay: '4s' }}></div>
      </div>
    </main>
  );
}
