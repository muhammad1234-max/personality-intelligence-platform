import { motion } from 'framer-motion';
import { ArrowRight, Brain, Target, Compass, Sparkles, ChevronRight, Activity, LineChart, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { NetworkParticles } from '../ui/NetworkParticles';
import { InteractiveTraits } from '../ui/InteractiveTraits';
import { InsightMarquee } from '../ui/InsightMarquee';

const FADE_UP_ANIMATION_VARIANTS = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

const STAGGER_CONTAINER = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export function LandingPage({ onStartAssessment, isApiReady }) {
  return (
    <div className="w-full relative overflow-hidden bg-background">
      
      {/* HERO WRAPPER */}
      <div className="relative w-full overflow-hidden">
        {/* Background Gradients and Particles */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <NetworkParticles />
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand-500/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-40 animate-pulse" />
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-accent-500/20 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-40" />
        </div>

        {/* HERO TOP COPY SECTION */}
        <section className="relative pt-32 pb-12 md:pt-40 md:pb-16 px-6 flex flex-col items-center justify-center">
          
          <div className="max-w-6xl mx-auto w-full flex flex-col items-center text-center z-10">
          
          {/* Top Centered Copy & CTA */}
          <motion.div 
            className="flex flex-col items-center text-center w-full max-w-4xl"
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300 border border-brand-200 dark:border-brand-500/20 shadow-sm">
              <Sparkles size={16} className="text-brand-500" />
              <span className="text-sm font-semibold tracking-wide">Scientifically Validated Big Five Assessment</span>
            </motion.div>

            <motion.h1 
              variants={FADE_UP_ANIMATION_VARIANTS}
              className="font-heading font-extrabold text-foreground leading-[1.05] tracking-tighter mb-8 text-balance"
              style={{ fontSize: 'clamp(3rem, 8vw, 5.25rem)' }}
            >
              Understand Your <br className="hidden md:block" />
              <span className="text-brand-600 dark:text-brand-400">
                Personality
              </span>
              <br className="hidden md:block" /> Through Science.
            </motion.h1>

            <motion.p 
              variants={FADE_UP_ANIMATION_VARIANTS}
              className="text-xl md:text-2xl text-foreground/70 mb-12 max-w-2xl mx-auto leading-relaxed font-light text-pretty"
            >
              Take a scientifically grounded assessment and receive ontology-powered insights, personalized recommendations, and a professional report.
            </motion.p>

            <motion.div variants={FADE_UP_ANIMATION_VARIANTS} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <button
                onClick={onStartAssessment}
                disabled={!isApiReady}
                className={cn(
                  "flex items-center justify-center gap-2 px-10 py-4 bg-brand-600 text-white text-lg font-semibold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1",
                  !isApiReady && "opacity-50 cursor-not-allowed"
                )}
              >
                Start Assessment
                <ArrowRight size={20} />
              </button>
              <button
                onClick={() => document.getElementById('ai-insights')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-2 px-10 py-4 bg-card text-foreground text-lg font-semibold rounded-2xl transition-all shadow-sm border border-border hover:bg-foreground/5"
              >
                View Sample Report
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      </div>

      {/* BENTO GRID SECTION */}
      <section className="relative pb-24 md:pb-32 px-6 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="max-w-6xl mx-auto w-full flex flex-col items-center text-center z-10">
          {/* Bento Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full mt-24 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {/* Bento 1: Large Main Card */}
            <div className="md:col-span-2 lg:col-span-2 bg-card/60 backdrop-blur-xl border border-foreground/5 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-brand-500/10 blur-[80px] rounded-full group-hover:bg-brand-500/20 transition-all duration-700" />
              <div className="relative z-10 mb-8">
                <Brain size={32} className="text-brand-500 mb-4" />
                <h3 className="text-2xl font-bold mb-2">Deep Ontology Mapping</h3>
                <p className="text-foreground/60 text-sm leading-relaxed max-w-sm">
                  We don't just score you. We map your answers to a sophisticated semantic knowledge graph for unparalleled accuracy.
                </p>
              </div>
              
              <div className="relative z-10 bg-background/80 rounded-2xl p-4 border border-border/50 shadow-inner">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full bg-success-500" />
                  <div className="text-xs font-semibold text-foreground/50 uppercase tracking-widest">Live Analysis</div>
                </div>
                <div className="flex gap-2">
                  <div className="h-2 flex-1 bg-brand-500 rounded-full" />
                  <div className="h-2 flex-[2] bg-brand-500/20 rounded-full" />
                  <div className="h-2 flex-1 bg-brand-500/40 rounded-full" />
                </div>
              </div>
            </div>

            {/* Bento 2: Score Card */}
            <div className="md:col-span-1 lg:col-span-1 bg-brand-600 text-white rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col justify-between overflow-hidden relative group">
              <div className="absolute -right-8 -top-8 text-white/10 group-hover:rotate-12 transition-transform duration-700 ease-out-expo">
                <Target size={160} />
              </div>
              <div className="relative z-10">
                <div className="text-sm font-semibold uppercase tracking-wider opacity-80 mb-4">IPIP-NEO Standard</div>
                <div className="flex items-end gap-2 mb-2">
                  <div className="w-4 h-12 bg-white/40 rounded-t-sm" />
                  <div className="w-4 h-16 bg-white/60 rounded-t-sm" />
                  <div className="w-4 h-24 bg-white rounded-t-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                  <div className="w-4 h-10 bg-white/30 rounded-t-sm" />
                </div>
              </div>
              <div className="relative z-10 mt-8">
                <h4 className="font-bold text-lg leading-tight mb-1">Scientific Rigor</h4>
                <p className="text-sm opacity-90 text-pretty">Not a buzzfeed quiz. Real psychological methodology.</p>
              </div>
            </div>

            {/* Bento 3: AI Card */}
            <div className="md:col-span-3 lg:col-span-1 bg-card/60 backdrop-blur-xl border border-foreground/5 rounded-[2rem] p-6 md:p-8 shadow-xl flex flex-col justify-between overflow-hidden relative group">
              <div className="relative z-10">
                <Sparkles size={28} className="text-accent-500 mb-4" />
                <h3 className="text-xl font-bold mb-2">AI Synthesized</h3>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  FastAPI backend powers an LLM agent that interprets your specific trait combination.
                </p>
              </div>
              <div className="relative z-10 mt-8">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-blue-500 flex items-center justify-center text-white text-xs font-bold">O</div>
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">C</div>
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-amber-500 flex items-center justify-center text-white text-xs font-bold">E</div>
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-rose-500 flex items-center justify-center text-white text-xs font-bold">A</div>
                  <div className="w-10 h-10 rounded-full border-2 border-background bg-purple-500 flex items-center justify-center text-white text-xs font-bold">N</div>
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* INSIGHT MARQUEE */}
      <InsightMarquee />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 bg-card/50 border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">The Science Behind The Platform</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto text-lg">A rigorous four-step process designed to extract deep psychological insights.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line (hidden on mobile) */}
            <div className="hidden md:block absolute top-[45px] left-[10%] right-[10%] h-0.5 bg-border z-0" />
            
            {[
              { step: "01", title: "Answer 50 Questions", desc: "Complete the IPIP-validated Big Five questionnaire.", icon: <FileText size={24} /> },
              { step: "02", title: "Ontology Scoring", desc: "Answers map to a semantic web ontology for precise scoring.", icon: <Brain size={24} /> },
              { step: "03", title: "AI Analysis", desc: "LLMs analyze your unique trait combinations for insights.", icon: <LineChart size={24} /> },
              { step: "04", title: "Growth Report", desc: "Receive a professional, exportable PDF report.", icon: <Target size={24} /> }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-2xl bg-card border shadow-sm flex flex-col items-center justify-center mb-6 text-brand-600 group-hover:shadow-lg group-hover:border-brand-500/50 transition-all duration-500 ease-out">
                  <span className="text-sm font-bold opacity-50 mb-1">{item.step}</span>
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-balance">{item.title}</h3>
                <p className="text-foreground/70 text-sm leading-relaxed text-pretty">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BIG FIVE TRAITS */}
      <section id="big-five" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:w-2/3">
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">The Big Five Dimensions</h2>
            <p className="text-foreground/70 text-lg leading-relaxed">
              We measure the OCEAN model—the only scientifically consensus-backed framework for personality assessment. Discover what each trait reveals about your behavioral patterns.
            </p>
          </div>

          <InteractiveTraits />
        </div>
      </section>

      {/* AI INSIGHTS & CTA */}
      <section id="ai-insights" className="py-24 px-6 bg-gradient-to-b from-card to-background border-t pb-[max(6rem,env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-300 mb-8 border border-accent-200 dark:border-accent-500/20">
            <Compass size={16} />
            <span className="text-sm font-semibold">Beyond Simple Scores</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-8">AI-Powered Actionable Intelligence.</h2>
          <p className="text-xl text-foreground/70 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your scores aren't just numbers. Our integration with FastAPI and LLMs dynamically translates your trait combinations into actionable career advice, relationship insights, and tailored growth strategies.
          </p>

          <div className="p-6 md:p-12 bg-card border rounded-3xl shadow-2xl relative overflow-hidden text-left max-w-4xl mx-auto">
            <div className="absolute top-0 right-0 w-48 h-48 md:w-64 md:h-64 bg-brand-500/10 blur-[100px]" />
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">Ready to discover yourself?</h3>
                <p className="text-foreground/70">The assessment takes roughly 5-10 minutes. Requires honest answers for accurate scoring.</p>
              </div>
              <button
                onClick={onStartAssessment}
                className="w-full md:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background font-semibold rounded-2xl transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                Start Assessment Now
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default LandingPage;
