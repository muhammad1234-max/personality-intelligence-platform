import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';

const traits = [
  {
    name: "Openness",
    color: "bg-blue-500",
    textClass: "text-blue-500",
    lowLabel: "Consistent & Cautious",
    highLabel: "Inventive & Curious",
    lowDesc: "You prefer routine, value traditions, and take a practical, pragmatic approach to solving problems rather than seeking out novelty.",
    midDesc: "You balance a respect for tradition with an openness to new experiences, adapting when necessary but valuing stability.",
    highDesc: "You are highly imaginative, appreciate art and aesthetics, and constantly seek out new, unconventional ideas and experiences."
  },
  {
    name: "Conscientiousness",
    color: "bg-emerald-500",
    textClass: "text-emerald-500",
    lowLabel: "Flexible & Spontaneous",
    highLabel: "Organized & Disciplined",
    lowDesc: "You are adaptable, prefer going with the flow, and may find strict schedules or rigid planning to be overly restrictive.",
    midDesc: "You can be organized when a task requires it, but you also maintain enough flexibility to handle unexpected changes.",
    highDesc: "You are highly self-disciplined, goal-oriented, and prefer planned rather than spontaneous behavior. You are highly reliable."
  },
  {
    name: "Extraversion",
    color: "bg-amber-500",
    textClass: "text-amber-500",
    lowLabel: "Reserved & Reflective",
    highLabel: "Outgoing & Energetic",
    lowDesc: "You recharge your energy through solitude, prefer deep one-on-one conversations, and think carefully before speaking.",
    midDesc: "You are an ambivert. You enjoy social interactions but also need and value your quiet time to recharge and reflect.",
    highDesc: "You draw energy from being around others, thrive in dynamic group settings, and tend to be assertive and enthusiastic."
  },
  {
    name: "Agreeableness",
    color: "bg-rose-500",
    textClass: "text-rose-500",
    lowLabel: "Competitive & Critical",
    highLabel: "Cooperative & Compassionate",
    lowDesc: "You are analytical, objective, and aren't afraid of conflict. You value logic and straightforwardness over group harmony.",
    midDesc: "You are generally friendly but can be firm when necessary. You balance compassion with a healthy degree of skepticism.",
    highDesc: "You place a high value on getting along with others. You are empathetic, trusting, and willing to compromise for the greater good."
  },
  {
    name: "Neuroticism",
    color: "bg-purple-500",
    textClass: "text-purple-500",
    lowLabel: "Calm & Resilient",
    highLabel: "Sensitive & Vigilant",
    lowDesc: "You are emotionally stable, highly resilient under stress, and rarely experience negative emotional spikes like anxiety or anger.",
    midDesc: "You are generally calm but can experience stress and self-doubt in challenging situations, responding normally to life's ups and downs.",
    highDesc: "You are highly emotionally responsive, deeply feeling, and highly attuned to potential risks and threats in your environment."
  }
];

export function InteractiveTraits() {
  const [sliderValues, setSliderValues] = useState({
    Openness: 50,
    Conscientiousness: 50,
    Extraversion: 50,
    Agreeableness: 50,
    Neuroticism: 50
  });

  const handleSliderChange = (traitName, value) => {
    setSliderValues(prev => ({ ...prev, [traitName]: parseInt(value) }));
  };

  const getDescription = (trait, value) => {
    if (value < 35) return trait.lowDesc;
    if (value > 65) return trait.highDesc;
    return trait.midDesc;
  };

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12 lg:gap-x-16">
      {traits.map((trait, i) => {
        const value = sliderValues[trait.name];
        const isLow = value < 35;
        const isHigh = value > 65;
        
        return (
          <motion.div 
            key={trait.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex flex-col group bg-card border rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden",
              i === 3 ? "md:col-span-1 lg:col-span-2" : "",
              i === 4 ? "md:col-span-2 lg:col-span-1" : ""
            )}
          >
            {/* Background glowing orb reflecting current state */}
            <div 
              className={cn(
                "absolute top-0 w-48 h-48 md:w-64 md:h-64 rounded-full blur-[80px] opacity-10 transition-all duration-700",
                trait.color,
                value < 50 ? "-left-16" : "-right-16"
              )} 
            />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className={cn("w-4 h-4 rounded-full shadow-sm", trait.color)} />
                <h3 className="text-2xl font-heading font-bold text-balance">{trait.name}</h3>
              </div>
              
              {/* Slider UI */}
              <div className="mb-8">
                <div className="flex justify-between text-[10px] sm:text-xs font-semibold text-foreground/50 uppercase tracking-widest mb-4 gap-2">
                  <span className={cn("transition-colors duration-300 text-balance text-left max-w-[48%]", isLow ? trait.textClass : "")}>
                    {trait.lowLabel}
                  </span>
                  <span className={cn("transition-colors duration-300 text-balance text-right max-w-[48%]", isHigh ? trait.textClass : "")}>
                    {trait.highLabel}
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => handleSliderChange(trait.name, e.target.value)}
                  className={cn(
                    "w-full h-2 rounded-full appearance-none bg-muted outline-none cursor-pointer",
                    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
                  )}
                  style={{
                    background: `linear-gradient(to right, var(--color-${trait.color.split('-')[1]}-500) ${value}%, var(--color-muted) ${value}%)`,
                  }}
                />
              </div>

              {/* Dynamic Description */}
              <div className="min-h-[120px]">
                <p className="text-foreground/80 leading-relaxed text-pretty text-lg font-medium transition-all duration-300">
                  {getDescription(trait, value)}
                </p>
              </div>

              <div className="mt-8 flex items-center text-sm font-semibold text-brand-600 transition-colors group-hover:text-brand-700 cursor-pointer">
                Measured precisely in the report <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
