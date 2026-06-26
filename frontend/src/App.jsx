import { useState, useCallback, useEffect } from 'react';
import { LandingPage, WelcomeForm, QuestionCard, Results, AdminLogin, AdminPanel } from './components';
import { fetchQuestions, fetchTraits, checkApiHealth } from './services/api';
import { Moon, Sun, Lock, Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// Screen states as constants for type safety and maintainability
const SCREENS = {
  LANDING: 'landing',
  WELCOME: 'welcome',
  ASSESSMENT: 'assessment',
  RESULTS: 'results',
  ADMIN_LOGIN: 'admin_login',
  ADMIN_PANEL: 'admin_panel',
  LOADING: 'loading',
  ERROR: 'error'
};

function App() {
  // UI State
  const [currentScreen, setCurrentScreen] = useState(SCREENS.LANDING);
  
  // Theme State - persisted to localStorage
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  // User Data State
  const [userData, setUserData] = useState(null);
  const [surveyStartTime, setSurveyStartTime] = useState(0);
  const [assessmentData, setAssessmentData] = useState(null);
  
  // API Data State
  const [questions, setQuestions] = useState([]);
  const [likertOptions, setLikertOptions] = useState([]);
  const [traitInfo, setTraitInfo] = useState({});
  
  // API Status State
  const [apiError, setApiError] = useState(null);
  const [isApiReady, setIsApiReady] = useState(false);
  
  // Admin State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Theme effect - sync with document
  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Check for admin route on mount
  useEffect(() => {
    if (window.location.pathname === '/admin') {
      const storedToken = sessionStorage.getItem('adminToken');
      if (storedToken) {
        setIsAdminAuthenticated(true);
        setCurrentScreen(SCREENS.ADMIN_PANEL);
      } else {
        setCurrentScreen(SCREENS.ADMIN_LOGIN);
      }
    }
  }, []);

  // Load questions from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Checking API health...');
        const isHealthy = await checkApiHealth();
        if (!isHealthy) {
          console.error('❌ Backend API health check failed!');
          setApiError('Backend API is not running. Please start the FastAPI server.');
          return;
        }

        console.log('✅ API is healthy, fetching data...');
        const questionsData = await fetchQuestions();
        setQuestions(questionsData.questions);
        setLikertOptions(questionsData.likertOptions);

        const traitsData = await fetchTraits();
        const traitsMap = {};
        traitsData.traits.forEach(trait => {
          traitsMap[trait.key] = {
            name: trait.name,
            color: trait.color,
            label: trait.label
          };
        });
        setTraitInfo(traitsMap);
        setIsApiReady(true);
        console.log('✅ All data loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load data from API:', error.message);
        setApiError(`Failed to connect to API: ${error.message}`);
      }
    };

    loadData();
  }, []);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  const handleStartAssessment = useCallback(() => {
    if (!isApiReady) {
      setCurrentScreen(SCREENS.ERROR);
      return;
    }
    setCurrentScreen(SCREENS.WELCOME);
  }, [isApiReady]);

  const handleWelcomeComplete = useCallback(async (data) => {
    setUserData(data);
    
    // Fetch correct questions length based on selection
    if (data.assessmentType === 'short') {
      try {
        const questionsData = await fetchQuestions(true);
        setQuestions(questionsData.questions);
      } catch (err) {
        console.error('Failed to fetch short questions:', err);
      }
    } else {
      // Re-fetch deep test just in case it was short before
      try {
        const questionsData = await fetchQuestions(false);
        setQuestions(questionsData.questions);
      } catch (err) {
        console.error('Failed to fetch deep questions:', err);
      }
    }
    
    setSurveyStartTime(Date.now());
    setCurrentScreen(SCREENS.ASSESSMENT);
  }, []);

  const handleAssessmentComplete = useCallback((data) => {
    setAssessmentData(data);
    setCurrentScreen(SCREENS.RESULTS);
  }, []);

  const handleRestart = useCallback(() => {
    setUserData(null);
    setSurveyStartTime(0);
    setAssessmentData(null);
    setCurrentScreen(SCREENS.LANDING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleAdminLogin = useCallback((success) => {
    if (success) {
      setIsAdminAuthenticated(true);
      setCurrentScreen(SCREENS.ADMIN_PANEL);
    }
  }, []);

  const handleAdminLogout = useCallback(() => {
    sessionStorage.removeItem('adminToken');
    setIsAdminAuthenticated(false);
    setCurrentScreen(SCREENS.LANDING);
    window.history.pushState({}, '', '/');
  }, []);

  const handleGoToAdmin = useCallback(() => {
    window.history.pushState({}, '', '/admin');
    const storedToken = sessionStorage.getItem('adminToken');
    if (storedToken) {
      setIsAdminAuthenticated(true);
      setCurrentScreen(SCREENS.ADMIN_PANEL);
    } else {
      setCurrentScreen(SCREENS.ADMIN_LOGIN);
    }
  }, []);

  // Admin screens bypass layout
  if (currentScreen === SCREENS.ADMIN_LOGIN) {
    return <AdminLogin onLogin={handleAdminLogin} isDark={isDark} />;
  }

  if (currentScreen === SCREENS.ADMIN_PANEL && isAdminAuthenticated) {
    return <AdminPanel onLogout={handleAdminLogout} isDark={isDark} />;
  }

  // Show error if API is not available
  if (apiError && currentScreen !== SCREENS.LANDING) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">⚠️ Connection Error</h2>
        <p className="text-red-500 dark:text-red-400 mb-4">{apiError}</p>
        <p className="text-foreground/80 mb-4">Make sure the FastAPI backend is running:</p>
        <code className="bg-card border text-blue-pro px-4 py-2 rounded-lg font-mono text-sm mb-6">
          cd backend && uvicorn api:app --reload
        </code>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-all shadow-md"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const hideNavigation = currentScreen === SCREENS.ASSESSMENT;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      
      {/* Sticky Premium Navigation (Hidden during Assessment) */}
      <AnimatePresence>
        {!hideNavigation && (
          <motion.nav 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
          >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => currentScreen !== SCREENS.LANDING && setCurrentScreen(SCREENS.LANDING)}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:shadow-md transition-all">
                  P
                </div>
                <span className="font-heading font-semibold text-lg tracking-tight hidden sm:block">
                  Personality Intelligence
                </span>
              </div>

              {/* Center Links (Landing Page Only) */}
              {currentScreen === SCREENS.LANDING && (
                <div className="hidden md:flex items-center gap-4 lg:gap-8 text-sm font-medium text-foreground/70">
                  <a href="#how-it-works" className="hover:text-brand-500 transition-colors">How It Works</a>
                  <a href="#big-five" className="hover:text-brand-500 transition-colors">Big Five Traits</a>
                  <a href="#ai-insights" className="hover:text-brand-500 transition-colors">AI Insights</a>
                </div>
              )}

              {/* Right Side Actions */}
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-colors"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                
                <button
                  onClick={handleGoToAdmin}
                  className="hidden md:flex text-sm font-medium text-foreground/70 hover:text-foreground transition-colors items-center gap-1.5"
                >
                  <Lock size={16} className="text-foreground/50" />
                  <span>Sign In</span>
                </button>

                {currentScreen !== SCREENS.WELCOME && currentScreen !== SCREENS.RESULTS && (
                  <button 
                    onClick={handleStartAssessment}
                    className="hidden sm:block ml-2 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-full hover:scale-105 transition-transform shadow-sm"
                  >
                    Start Assessment
                  </button>
                )}
                
                {/* Mobile Menu Toggle */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-full hover:bg-foreground/5 text-foreground/70 hover:text-foreground transition-colors"
                >
                  {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="md:hidden border-b bg-background/95 backdrop-blur-xl overflow-hidden"
                >
                  <div className="px-6 py-4 flex flex-col gap-4">
                    {currentScreen === SCREENS.LANDING && (
                      <>
                        <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-foreground/70 hover:text-brand-500 py-2 border-b border-border/50">How It Works</a>
                        <a href="#big-five" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-foreground/70 hover:text-brand-500 py-2 border-b border-border/50">Big Five Traits</a>
                        <a href="#ai-insights" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-foreground/70 hover:text-brand-500 py-2 border-b border-border/50">AI Insights</a>
                      </>
                    )}
                    <button
                      onClick={() => { setIsMobileMenuOpen(false); handleGoToAdmin(); }}
                      className="text-lg font-medium text-foreground/70 hover:text-foreground py-2 flex items-center gap-2"
                    >
                      <Lock size={18} className="text-foreground/50" />
                      Sign In
                    </button>
                    {currentScreen !== SCREENS.WELCOME && currentScreen !== SCREENS.RESULTS && (
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); handleStartAssessment(); }}
                        className="mt-2 w-full px-4 py-3 bg-foreground text-background text-base font-semibold rounded-xl hover:scale-[1.02] transition-transform shadow-sm flex justify-center"
                      >
                        Start Assessment
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentScreen === SCREENS.LANDING && (
          <LandingPage 
            onStartAssessment={handleStartAssessment} 
            isApiReady={isApiReady}
            apiError={apiError}
          />
        )}

        {currentScreen === SCREENS.WELCOME && (
          <WelcomeForm 
            onStart={handleWelcomeComplete} 
            onBack={() => setCurrentScreen(SCREENS.LANDING)} 
          />
        )}
        
        {currentScreen === SCREENS.ASSESSMENT && userData && questions.length > 0 && (
          <QuestionCard
            userData={userData}
            surveyStartTime={surveyStartTime}
            onComplete={handleAssessmentComplete}
            questions={questions}
            likertOptions={likertOptions}
          />
        )}
        
        {currentScreen === SCREENS.RESULTS && assessmentData && (
          <div className="w-full">
            <Results 
              assessmentData={assessmentData} 
              questions={questions}
              traitInfo={traitInfo}
            />
            <div className="flex justify-center py-16 bg-background">
              <button 
                className="px-8 py-4 bg-brand-500 text-white font-semibold rounded-full hover:bg-brand-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                onClick={handleRestart}
              >
                Take Another Assessment
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

export default App;