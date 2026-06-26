import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, CheckCircle2, ChevronRight, RefreshCw, X, Database, Bot } from 'lucide-react';
import { cn } from '../../../lib/utils';

function GuidanceChat({ assessmentId, userName, onClose }) {
  const [step, setStep] = useState('questions'); // 'questions' | 'loading' | 'guidance'
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [guidance, setGuidance] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const guidanceRef = useRef(null);

  // Fetch lifestyle questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Auto-scroll during streaming
  useEffect(() => {
    if (guidanceRef.current && isStreaming) {
      guidanceRef.current.scrollTop = guidanceRef.current.scrollHeight;
    }
  }, [guidance, isStreaming]);

  const fetchQuestions = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const targetUrl = `${apiUrl}/guidance/questions`;
      
      const response = await fetch(targetUrl);
      
      if (!response.ok) throw new Error('Failed to fetch questions');
      const data = await response.json();
      setQuestions(data.questions);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const allQuestionsAnswered = questions.length > 0 && 
    questions.every(q => answers[q.id] && answers[q.id].trim() !== '');

  const generateGuidance = async () => {
    setStep('loading');
    setError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
      const targetUrl = `${apiUrl}/guidance/generate/stream`;
      
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: assessmentId,
          lifestyle_answers: {
            current_situation: answers.current_situation || '',
            career_goal: answers.career_goal || '',
            work_environment: answers.work_environment || '',
            main_challenge: answers.main_challenge || '',
            life_priority: answers.life_priority || ''
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate guidance');
      }

      setStep('guidance');
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.chunk) {
                setGuidance(prev => prev + data.chunk);
              }
              if (data.done) {
                setIsStreaming(false);
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      setIsStreaming(false);
    } catch (err) {
      setError(err.message);
      setStep('questions');
    }
  };

  // Render markdown-like content with premium styling
  const renderGuidance = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const elements = [];
    
    lines.forEach((line, index) => {
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-xl font-heading font-bold text-foreground mt-8 mb-4 flex items-center gap-2">
            <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-2xl font-heading font-bold text-foreground mt-10 mb-6 pb-4 border-b border-border">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('# ')) {
        elements.push(
          <h1 key={index} className="text-3xl font-heading font-bold text-foreground mt-8 mb-6">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('- **') || line.startsWith('* **')) {
        const content = line.slice(2);
        const boldMatch = content.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
        if (boldMatch) {
          elements.push(
            <li key={index} className="ml-4 mb-3 text-foreground/80 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-success-500 shrink-0 mt-0.5" />
              <span>
                <span className="font-bold text-foreground">{boldMatch[1]}</span>
                {boldMatch[2] && <span className="opacity-80">: {boldMatch[2]}</span>}
              </span>
            </li>
          );
        } else {
          elements.push(
            <li key={index} className="ml-4 mb-2 text-foreground/80 flex items-start gap-2">
              <span className="text-brand-500 mt-1">•</span>
              {content}
            </li>
          );
        }
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={index} className="ml-4 mb-2 text-foreground/80 flex items-start gap-2">
            <span className="text-brand-500 mt-1">•</span>
            {line.slice(2)}
          </li>
        );
      } else if (line.match(/^\d+\.\s/)) {
        elements.push(
          <li key={index} className="ml-6 mb-2 text-foreground/80 list-decimal marker:text-brand-500 marker:font-bold">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={index} className="h-4" />);
      } else {
        // Handle inline bold
        const parts = line.split(/\*\*(.+?)\*\*/g);
        const formattedLine = parts.map((part, i) => 
          i % 2 === 1 ? <strong key={i} className="font-bold text-foreground">{part}</strong> : part
        );
        elements.push(
          <p key={index} className="text-foreground/80 mb-4 leading-relaxed text-lg">{formattedLine}</p>
        );
      }
    });
    
    return elements;
  };

  const renderedGuidance = useMemo(() => renderGuidance(guidance), [guidance]);

  const slideVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="bg-card border rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-card z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-500/10 text-accent-500 rounded-xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-foreground leading-none text-balance">AI Intelligence</h2>
              <p className="text-foreground/50 text-sm font-medium mt-1">
                {step === 'questions' && 'Context Gathering'}
                {step === 'loading' && 'Analysis in Progress'}
                {step === 'guidance' && `Personalized Strategy for ${userName}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center rounded-full bg-muted text-foreground/50 hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-card scroll-smooth" ref={guidanceRef}>
          <div className="p-8">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl p-4 mb-8 font-medium flex items-center gap-3"
                >
                  <X size={20} />
                  {error}
                </motion.div>
              )}

              {step === 'questions' && (
                <motion.div key="questions" variants={slideVariants} initial="enter" animate="center" exit="exit" className="space-y-8 max-w-3xl mx-auto">
                  <div className="bg-accent-500/5 border border-accent-500/20 rounded-2xl p-6 mb-8 flex gap-4">
                    <Brain className="text-accent-500 shrink-0" size={24} />
                    <div>
                      <h3 className="font-bold text-foreground mb-2 text-balance">Enhance your analysis</h3>
                      <p className="text-foreground/70 text-sm leading-relaxed mb-4 text-pretty">
                        We have your Big Five ontology mapping ready. To provide the most actionable insights, please share a bit about your current life context.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <div key={question.id} className="group">
                        <label className="block text-foreground font-bold mb-3 flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent-500/20 text-accent-600 text-xs">
                            {index + 1}
                          </span>
                          {question.question}
                        </label>
                        <select
                          value={answers[question.id] || ''}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="w-full p-4 border-2 border-border rounded-xl focus:border-accent-500 focus:ring-4 focus:ring-accent-500/10 transition-all bg-background text-foreground font-medium outline-none appearance-none cursor-pointer group-hover:border-accent-500/50"
                          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.5em 1.5em' }}
                        >
                          <option value="" disabled>Select an option...</option>
                          {question.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 'loading' && (
                <motion.div key="loading" variants={slideVariants} initial="enter" animate="center" exit="exit" className="flex flex-col items-center justify-center py-20">
                  <div className="relative w-24 h-24 flex items-center justify-center mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                      className="absolute inset-0 border-4 border-dashed border-accent-500/30 rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                      className="absolute inset-2 border-4 border-brand-500/40 rounded-full border-t-transparent"
                    />
                    <Sparkles className="text-accent-500" size={32} />
                  </div>
                  
                  <h3 className="text-2xl font-heading font-bold text-foreground mb-4 text-balance">Synthesizing Insights</h3>
                  <p className="text-foreground/60 text-center max-w-md font-medium text-pretty">
                    Combining your OWL ontology profile with contextual markers...
                  </p>
                  
                  <div className="flex flex-wrap justify-center gap-3 mt-8">
                    <span className="flex items-center gap-2 px-4 py-2 bg-brand-500/10 text-brand-600 rounded-full text-sm font-bold">
                      <Database size={16} /> Vector Retrieval
                    </span>
                    <span className="flex items-center gap-2 px-4 py-2 bg-accent-500/10 text-accent-600 rounded-full text-sm font-bold">
                      <Bot size={16} /> LLM Generation
                    </span>
                  </div>
                </motion.div>
              )}

              {step === 'guidance' && (
                <motion.div key="guidance" variants={slideVariants} initial="enter" animate="center" exit="exit" className="max-w-3xl mx-auto">
                  <div className="bg-brand-500/5 rounded-2xl p-6 mb-8 border border-brand-500/20">
                    <p className="text-brand-700 dark:text-brand-300 font-medium leading-relaxed text-pretty">
                      This strategy is generated in real-time by analyzing your Big Five profile against psychological knowledge bases, customized for your current goals.
                    </p>
                  </div>
                  
                  <div className="prose-custom">
                    {renderedGuidance}
                    {isStreaming && (
                      <motion.span 
                        animate={{ opacity: [1, 0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="inline-block w-3 h-5 bg-accent-500 ml-2 align-middle rounded-sm"
                      />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-border bg-card z-10">
          {step === 'questions' && (
            <div className="flex justify-between items-center max-w-3xl mx-auto">
              <div className="flex items-center gap-2 text-foreground/50 font-bold text-sm">
                <span className="text-accent-500">{Object.keys(answers).length}</span> / {questions.length} Answered
              </div>
              <button
                onClick={generateGuidance}
                disabled={!allQuestionsAnswered}
                className={cn(
                  "px-8 py-4 rounded-full font-bold transition-all duration-300 ease-out-expo flex items-center gap-3",
                  allQuestionsAnswered
                    ? "bg-foreground text-background hover:scale-105 hover:shadow-xl shadow-foreground/20"
                    : "bg-muted text-foreground/40 cursor-not-allowed"
                )}
              >
                <span>Generate Strategy</span>
                <ChevronRight size={20} />
              </button>
            </div>
          )}

          {step === 'guidance' && !isStreaming && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 max-w-3xl mx-auto">
              <p className="text-foreground/40 text-sm font-medium flex items-center gap-2">
                <Bot size={16} /> Generated via Semantic RAG Pipeline
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => { setStep('questions'); setGuidance(''); }}
                  className="px-6 py-3 rounded-full font-bold text-foreground/70 bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} /> Regenerate
                </button>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 hover:shadow-lg transition-all duration-300 ease-out-expo"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default GuidanceChat;
