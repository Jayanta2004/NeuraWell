"use client";

import { useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import ActionPlan from "@/components/ActionPlan";
import MoodWidget from "@/components/MoodWidget";

export default function Home() {
  const [actionPlan, setActionPlan] = useState<string[]>([]);
  const [mood, setMood] = useState<string | null>(null);
  const [severity, setSeverity] = useState<number | null>(null);

  const handleMoodUpdate = (newMood: string, newSeverity: number) => {
    setMood(newMood);
    setSeverity(newSeverity);
  };

  return (
    <main className="flex h-screen w-full bg-background overflow-hidden">
      {/* 70% Chat Interface */}
      <section className="w-[70%] h-full flex flex-col relative z-10">
        <ChatInterface 
          onNewActionPlan={setActionPlan} 
          onMoodUpdate={handleMoodUpdate}
        />
      </section>

      {/* 30% Sidebar */}
      <section className="w-[30%] h-full flex flex-col relative z-10 bg-slate-50 dark:bg-[#0B0F19] backdrop-blur-3xl border-l border-white/80 dark:border-white/5 transition-colors duration-500">
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
