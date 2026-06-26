import { motion } from 'framer-motion';
import { Bot, TrendingUp, Compass, Target, Brain } from 'lucide-react';
import { cn } from '../../lib/utils';

const insights = [
  {
    icon: <Brain size={18} className="text-blue-500" />,
    text: "Your high Openness combined with mid-level Conscientiousness suggests a career in design strategy...",
    tag: "Career Direction"
  },
  {
    icon: <Target size={18} className="text-emerald-500" />,
    text: "To leverage your high Agreeableness without burning out, establish firm boundaries in project scopes.",
    tag: "Actionable Advice"
  },
  {
    icon: <TrendingUp size={18} className="text-amber-500" />,
    text: "Your trait combo indicates an 82% predicted success rate in cross-functional leadership roles.",
    tag: "Predictive Analytics"
  },
  {
    icon: <Compass size={18} className="text-purple-500" />,
    text: "Because of your low Neuroticism, you will excel in high-stakes environments like crisis management.",
    tag: "Environment Fit"
  },
  {
    icon: <Bot size={18} className="text-rose-500" />,
    text: "Warning: Your extreme Conscientiousness could lead to perfectionism. Focus on 'done' over 'perfect'.",
    tag: "Risk Assessment"
  }
];

export function InsightMarquee() {
  // Duplicate array for seamless infinite scroll
  const duplicatedInsights = [...insights, ...insights];

  return (
    <div className="w-full overflow-hidden py-12 relative bg-background border-t border-border/50">
      {/* Gradient masks for smooth fade on edges */}
      <div className="absolute top-0 left-0 w-16 md:w-48 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 md:w-48 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 mb-8 flex flex-col items-center text-center">
        <h3 className="text-sm font-bold tracking-widest text-brand-500 uppercase">Live Synthesized Insights</h3>
        <p className="text-foreground/50 text-sm mt-1">Glimpse into the AI strategy engine</p>
      </div>

      <motion.div
        className="flex gap-6 w-max px-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 35,
        }}
      >
        {duplicatedInsights.map((insight, idx) => (
          <div 
            key={idx} 
            className="w-[350px] md:w-[450px] bg-card border border-foreground/5 rounded-[2rem] p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                {insight.icon}
              </div>
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">{insight.tag}</span>
            </div>
            <p className="text-foreground/80 font-medium leading-relaxed text-pretty">
              "{insight.text}"
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
