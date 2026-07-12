import { CheckCircle2, ListTodo } from 'lucide-react';

interface ActionPlanProps {
  plan: string[];
}

export default function ActionPlan({ plan }: ActionPlanProps) {
  return (
    <div className="flex-1 min-h-0 bg-transparent flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-white/80 dark:border-white/5 bg-white/70 dark:bg-navy/20 backdrop-blur-3xl sticky top-0 z-10 flex items-center shadow-sm shadow-stone-200/40 dark:shadow-lg dark:shadow-black/30 transition-colors duration-300">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple flex items-center justify-center text-white mr-4 shadow-md shadow-purple/20">
          <ListTodo size={20} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-stone-600 dark:text-white drop-shadow-sm dark:drop-shadow-md transition-colors duration-300">Daily Action Plan</h2>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {plan.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70 dark:opacity-60 transition-opacity">
            <div className="w-20 h-20 rounded-full bg-stone-50/50 dark:bg-purple-900/20 flex items-center justify-center mb-2 shadow-sm dark:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-colors duration-300">
              <ListTodo size={32} className="text-slate-400 dark:text-purple-400" />
            </div>
            <p className="text-slate-400 dark:text-slate-400 font-medium max-w-[80%] transition-colors duration-300">Share how you're feeling to get your personalized action plan.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plan.map((step, idx) => (
              <div 
                key={idx} 
                className="group flex items-start space-x-4 p-5 rounded-2xl bg-white dark:bg-navy/40 border border-gray-200 dark:border-none dark:border-t dark:border-white/10 dark:border-l dark:border-white/5 transition-all duration-500 shadow-sm hover:shadow-md hover:-translate-y-1 cursor-default"
                style={{ animation: `fadeIn 0.5s ease-out ${idx * 0.1}s both` }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-6 h-6 rounded-full bg-purple/10 dark:bg-purple/20 flex items-center justify-center group-hover:bg-purple/30 dark:group-hover:bg-purple/40 group-hover:scale-110 transition-all duration-300">
                    <CheckCircle2 size={14} className="text-purple-dark dark:text-purple-light group-hover:text-purple-900 dark:group-hover:text-white transition-colors" />
                  </div>
                </div>
                <p className="text-gray-700 dark:text-slate-200 leading-relaxed text-sm font-medium transition-colors duration-300">{step.replace(/^\d+[\.\)]\s*/, '')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
