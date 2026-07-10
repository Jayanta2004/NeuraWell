import { Activity, BrainCircuit } from 'lucide-react';

interface MoodWidgetProps {
  mood: string | null;
  severity: number | null;
}

export default function MoodWidget({ mood, severity }: MoodWidgetProps) {
  if (!mood || severity === null) {
    return null;
  }

  // Determine styling based on severity
  let severityColor = "text-green-400";
  let severityBg = "bg-green-500/10";
  let severityBorder = "border-green-500/30";

  if (severity >= 5 && severity <= 7) {
    severityColor = "text-orange-400";
    severityBg = "bg-orange-500/10";
    severityBorder = "border-orange-500/30";
  } else if (severity >= 8) {
    severityColor = "text-red-400";
    severityBg = "bg-red-500/10";
    severityBorder = "border-red-500/30";
  }

  return (
    <div className="p-6 mx-6 mt-6 rounded-2xl bg-white/60 dark:bg-navy/40 backdrop-blur-xl border border-stone-100/60 dark:border-none dark:border-t dark:border-white/10 dark:border-l dark:border-white/5 shadow-sm shadow-stone-200/50 dark:shadow-lg dark:shadow-black/20 animate-slide-up-fade relative overflow-hidden group hover:shadow-md hover:shadow-stone-200/60 dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.3)] transition-all duration-500">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple/10 rounded-full blur-[40px] pointer-events-none group-hover:bg-purple/20 transition-all duration-700"></div>
      
      <div className="flex items-center space-x-3 mb-5 relative z-10">
        <div className="w-8 h-8 rounded-full bg-stone-50/50 dark:bg-white/5 border border-stone-100 dark:border-white/10 flex items-center justify-center shadow-sm dark:shadow-inner transition-colors duration-300">
          <BrainCircuit size={16} className="text-purple" />
        </div>
        <h3 className="text-sm font-bold tracking-wide text-stone-600 dark:text-white drop-shadow-sm transition-colors duration-300">AI Insight</h3>
      </div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <span className="text-[10px] text-stone-400 dark:text-stone-400 uppercase tracking-widest font-bold mb-1 transition-colors duration-300">Detected Mood</span>
          <span className="text-lg text-stone-600 dark:text-slate-100 capitalize font-medium transition-colors duration-300">{mood}</span>
        </div>
        
        <div className="flex flex-col items-end">
          <span className="text-[10px] text-stone-400 dark:text-stone-400 uppercase tracking-widest font-bold mb-1 transition-colors duration-300">Severity</span>
          <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border shadow-sm ${severityBorder} ${severityBg}`}>
            <Activity size={14} className={severityColor} />
            <span className={`text-sm font-bold ${severityColor}`}>{severity}/10</span>
          </div>
        </div>
      </div>
    </div>
  );
}
