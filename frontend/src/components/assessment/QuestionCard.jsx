import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDevAutoFill } from '../../dev';
import { questionMeanings } from '../../data/questionMeanings';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, FastForward, Clock, Activity, Lightbulb } from 'lucide-react';
import { cn } from '../../lib/utils';

const getTime = () => window.performance.now();

function QuestionTooltip({ questionId, children }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const meaning = questionMeanings[questionId];

  if (!meaning) return children;

  return (
    <span 
      className="relative cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      <AnimatePresence>
        {showTooltip && (
          <motion.span 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-80 p-4 bg-foreground text-background text-sm rounded-2xl shadow-2xl -top-4 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none"
          >
            <span className="flex items-start gap-3">
              <Lightbulb className="text-accent-500 shrink-0 mt-0.5" size={18} />
              <span className="leading-relaxed font-medium">{meaning}</span>
            </span>
            <span className="absolute bottom-[-8px] left-1/2 -translate-x-1/2 border-[8px] border-transparent border-t-foreground" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function QuestionCard({ onComplete, userData, surveyStartTime, questions, likertOptions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [questionTimestamps, setQuestionTimestamps] = useState({});
  const questionStartTimeRef = useRef(0);
  const mountTimeRef = useRef(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const prevIndexRef = useRef(0);
  const [viewMode, setViewMode] = useState('sequential'); // 'sequential' | 'review'
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [direction, setDirection] = useState(1);
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const { autoFillResponses, isDevMode } = useDevAutoFill(setResponses, setQuestionTimestamps);

  useEffect(() => {
    const now = getTime();
    mountTimeRef.current = now;
    questionStartTimeRef.current = now;
  }, []);

  useEffect(() => {
    if (prevIndexRef.current !== currentIndex) {
      prevIndexRef.current = currentIndex;
      questionStartTimeRef.current = getTime();
    }
  }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (mountTimeRef.current) setElapsedTime(getTime() - mountTimeRef.current);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showCompletionModal) return;
      if (e.key >= '1' && e.key <= '5') {
        const value = parseInt(e.key);
        const option = likertOptions.find(o => o.value === value);
        if (option) handleSelect(value);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCompletionModal, currentIndex, likertOptions]);

  const unansweredQuestions = useMemo(() => questions.filter(q => !responses[q.id]), [questions, responses]);
  const answeredCount = questions.length - unansweredQuestions.length;
  const allAnswered = unansweredQuestions.length === 0;

  const currentQuestion = useMemo(() => {
    if (viewMode === 'review' && unansweredQuestions.length > 0) {
      return unansweredQuestions[Math.min(currentIndex, unansweredQuestions.length - 1)];
    }
    return questions[currentIndex];
  }, [viewMode, currentIndex, questions, unansweredQuestions]);

  const originalIndex = useMemo(() => {
    if (!currentQuestion) return 0;
    return questions.findIndex(q => q.id === currentQuestion.id);
  }, [currentQuestion, questions]);

  const handleSelect = useCallback((value) => {
    const now = getTime();
    const timeSpent = now - questionStartTimeRef.current;
    const questionId = currentQuestion?.id;
    
    if (!questionId) return;
    
    setResponses(prev => ({ ...prev, [questionId]: value }));
    setQuestionTimestamps(prev => ({
      ...prev,
      [questionId]: {
        questionId: questionId,
        startTime: Math.round(questionStartTimeRef.current),
        endTime: Math.round(now),
        duration: Math.round(timeSpent)
      }
    }));

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      if (viewMode === 'review') {
        const remainingUnanswered = unansweredQuestions.filter(q => q.id !== questionId);
        if (remainingUnanswered.length === 0) setShowCompletionModal(true);
      } else {
        if (currentIndex < questions.length - 1) {
          setDirection(1);
          setCurrentIndex(prev => prev + 1);
        } else if (unansweredQuestions.length > 1) {
          setViewMode('review');
          setCurrentIndex(0);
        } else if (unansweredQuestions.length === 1 && unansweredQuestions[0].id === questionId) {
          setShowCompletionModal(true);
        }
      }
    }, 400); // Wait for micro-animation before advancing
  }, [currentIndex, currentQuestion, questions, viewMode, unansweredQuestions, responses]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    const maxIndex = viewMode === 'review' ? unansweredQuestions.length - 1 : questions.length - 1;
    if (currentIndex < maxIndex) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, viewMode, questions.length, unansweredQuestions.length]);

  const handleSubmit = useCallback(() => {
    if (!allAnswered) return;
    const now = getTime();
    const surveyEndTime = surveyStartTime + (now - mountTimeRef.current);
    const totalDuration = surveyEndTime - surveyStartTime;

    onComplete({
      userData,
      responses,
      timestamps: {
        surveyStartTime,
        surveyEndTime: Math.round(surveyEndTime),
        totalDuration: Math.round(totalDuration),
        questionTimestamps
      }
    });
  }, [allAnswered, responses, surveyStartTime, userData, onComplete, questionTimestamps]);

  const formatTime = useCallback((ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  }, []);

  const answeredProgress = (answeredCount / questions.length) * 100;
  const selectedValue = currentQuestion ? (responses[currentQuestion.id] ?? null) : null;

  if (!currentQuestion && !showCompletionModal) {
    if (questions && questions.length > 0 && currentIndex >= questions.length) {
      // Failsafe: if we somehow went out of bounds, recover instantly
      setCurrentIndex(questions.length - 1);
      return null;
    }
    return <div className="min-h-screen flex items-center justify-center">Processing...</div>;
  }

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({ x: direction > 0 ? 50 : -50, opacity: 0 }),
    center: { zIndex: 1, x: 0, opacity: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 50 : -50, opacity: 0 })
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      
      {/* Top Minimal Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-border z-50">
        <motion.div 
          className="h-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${answeredProgress}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Header Info */}
      <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-40 pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
            {userData.name.charAt(0).toUpperCase()}
          </div>
          <span className="font-medium text-foreground/60">{userData.name}</span>
        </div>
        <div className="flex items-center gap-6">
          {isDevMode && (
            <button 
              onClick={autoFillResponses}
              className="pointer-events-auto px-4 py-2 bg-amber-500/10 text-amber-600 rounded-lg text-sm font-semibold hover:bg-amber-500/20 transition-colors"
            >
              Dev: Auto-Fill
            </button>
          )}
          <div className="flex items-center gap-2 text-foreground/50 font-mono text-sm">
            <Clock size={16} />
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Main Assessment Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto z-10 relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentQuestion?.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center text-center"
          >
            {/* Question Counter */}
            <div className="mb-8 text-brand-500 font-dashboard font-semibold text-sm tracking-widest uppercase">
              Question {originalIndex + 1} of {questions.length}
            </div>

            {/* Question Text */}
            <h2 className="font-heading font-bold text-foreground leading-[1.1] mb-16 max-w-3xl"
                style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)' }}>
              <QuestionTooltip questionId={currentQuestion?.id}>
                {currentQuestion?.text}
              </QuestionTooltip>
            </h2>

            {/* Likert Scale */}
            <div className="w-full max-w-2xl relative">
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center w-full gap-3 sm:gap-2 md:gap-4">
                {likertOptions.map(option => {
                  const isSelected = selectedValue === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className="group flex flex-row sm:flex-col items-center sm:justify-center gap-4 sm:gap-3 flex-1 relative w-full sm:w-auto bg-card sm:bg-transparent p-2 sm:p-0 rounded-2xl sm:rounded-none border sm:border-none border-border hover:border-brand-500/30 transition-all"
                    >
                      <div className={cn(
                        "w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-full border-2 flex items-center justify-center text-lg md:text-xl font-bold transition-all duration-300 ease-out-expo relative z-10 bg-background",
                        isSelected 
                          ? "border-brand-500 bg-brand-500 text-white scale-110 shadow-lg shadow-brand-500/30" 
                          : "border-border text-foreground/60 group-hover:border-brand-300 group-hover:text-brand-500"
                      )}>
                        {option.value}
                        {isSelected && (
                          <motion.div 
                            layoutId="selected-indicator" 
                            className="absolute inset-0 rounded-full border-4 border-brand-500/30 -m-2"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                          />
                        )}
                      </div>
                      <span className={cn(
                        "text-sm md:text-sm font-medium transition-colors sm:max-w-[80px] leading-tight text-left sm:text-center",
                        isSelected ? "text-brand-600 dark:text-brand-400" : "text-foreground/60"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {/* Connector line behind circles (hidden on mobile) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-[calc(50%+1rem)] md:-translate-y-[calc(50%+1.25rem)] w-[calc(100%-80px)] max-w-[600px] h-0.5 bg-border -z-10 hidden sm:block" />
            </div>

          </motion.div>
        </AnimatePresence>

        {/* Keyboard Hint */}
        <div className="absolute bottom-24 opacity-50 text-xs text-foreground/60 flex items-center gap-2 font-mono">
          <span>Use numbers</span>
          <kbd className="px-2 py-1 rounded bg-muted border border-border">1</kbd>
          <span>to</span>
          <kbd className="px-2 py-1 rounded bg-muted border border-border">5</kbd>
          <span>to select</span>
        </div>
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full p-6 flex justify-between items-center z-40">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-full text-foreground/80 hover:text-foreground hover:bg-foreground/5 disabled:opacity-0 transition-all font-medium"
        >
          <ChevronLeft size={20} />
          <span>Previous</span>
        </button>

        {!selectedValue && viewMode === 'sequential' && (
          <button
            onClick={() => handleNext()}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-all font-medium"
          >
            <span>Skip for now</span>
            <FastForward size={16} />
          </button>
        )}
      </div>

      {/* Floating Submit Action */}
      <AnimatePresence>
        {(allAnswered && !showCompletionModal) && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-50"
          >
            <button
              onClick={() => setShowCompletionModal(true)}
              className="flex items-center gap-3 px-8 py-4 bg-brand-600 text-white rounded-full font-bold shadow-2xl hover:bg-brand-700 hover:scale-105 transition-all"
            >
              <span>Submit Assessment</span>
              <Check size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion Modal */}
      <AnimatePresence>
        {showCompletionModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-card border rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-success-100 text-success-600 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner rotate-3">
                <Check size={40} />
              </div>
              <h2 className="text-3xl font-heading font-bold mb-4">Assessment Complete</h2>
              <p className="text-foreground/70 mb-8">
                Your responses have been recorded successfully. We're ready to generate your psychological profile.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="p-4 bg-background border rounded-2xl flex flex-col items-center">
                  <span className="text-sm text-foreground/50 font-medium mb-1 uppercase tracking-wider">Time</span>
                  <span className="text-2xl font-dashboard font-bold text-brand-600">{formatTime(elapsedTime)}</span>
                </div>
                <div className="p-4 bg-background border rounded-2xl flex flex-col items-center">
                  <span className="text-sm text-foreground/50 font-medium mb-1 uppercase tracking-wider">Items</span>
                  <span className="text-2xl font-dashboard font-bold text-brand-600">{questions.length}</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setShowCompletionModal(false); setViewMode('sequential'); setCurrentIndex(0); }}
                  className="flex-1 py-4 font-semibold text-foreground/70 hover:bg-muted rounded-2xl transition-colors"
                >
                  Review Answers
                </button>
                <button 
                  onClick={handleSubmit}
                  className="flex-1 py-4 bg-brand-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-brand-700 transition-all duration-300 ease-out-expo flex items-center justify-center gap-2"
                >
                  Generate Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default QuestionCard;
