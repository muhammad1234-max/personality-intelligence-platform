import { useState, useEffect, useMemo, useCallback } from 'react';
import { submitAssessment } from '../../services/api';
import GuidanceChat from '../guidance/GuidanceChat';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { FileText, Sparkles, Brain, Clock, Activity, Target, Zap, Heart, Shield, Eye, Download } from 'lucide-react';
import { cn } from '../../lib/utils';

// Trait metadata for UI
const traitMeta = {
  extraversion: { color: '#ef4444', tailwindColor: 'bg-red-500', icon: Zap, label: 'Extraversion' },
  agreeableness: { color: '#22c55e', tailwindColor: 'bg-green-500', icon: Heart, label: 'Agreeableness' },
  conscientiousness: { color: '#3b82f6', tailwindColor: 'bg-blue-500', icon: Target, label: 'Conscientiousness' },
  neuroticism: { color: '#f59e0b', tailwindColor: 'bg-amber-500', icon: Shield, label: 'Neuroticism' },
  openness: { color: '#8b5cf6', tailwindColor: 'bg-purple-500', icon: Eye, label: 'Openness' }
};

export function Results({ assessmentData, questions }) {
  const { userData, responses, timestamps } = assessmentData;
  const [apiResults, setApiResults] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentId, setAssessmentId] = useState(null);
  const [showGuidance, setShowGuidance] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Fetch results from API
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        const result = await submitAssessment({
          responses,
          userData,
          timestamps: {
            surveyStartTime: timestamps.surveyStartTime,
            surveyEndTime: timestamps.surveyEndTime,
            totalDuration: timestamps.totalDuration,
            questionTimestamps: timestamps.questionTimestamps
          }
        });
        setApiResults(result);
        if (result.assessmentId) {
          setAssessmentId(result.assessmentId);
        }
      } catch (err) {
        console.error('Failed to fetch results from API:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [responses, userData, timestamps]);

  const formatDuration = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }, []);

  const avgQuestionTime = useMemo(() => {
    const times = Object.values(timestamps.questionTimestamps);
    if (times.length === 0) return 0;
    return times.reduce((sum, t) => sum + t.duration, 0) / times.length;
  }, [timestamps.questionTimestamps]);

  // Format data for Recharts Radar
  const radarData = useMemo(() => {
    if (!apiResults?.traits) return [];
    
    // Ensure fixed order for radar chart (OCEAN)
    const order = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'];
    
    return order.map(key => {
      const trait = apiResults.traits[key];
      if (!trait) return null;
      return {
        subject: traitMeta[key].label,
        score: Math.round(trait.percentile),
        fullMark: 100,
        color: traitMeta[key].color
      };
    }).filter(Boolean);
  }, [apiResults]);

  const traitScores = useMemo(() => {
    if (!apiResults?.traits) return [];
    
    return Object.entries(apiResults.traits).map(([key, trait]) => {
      const percentage = Math.round(trait.percentile);
      let level;
      if (percentage >= 70) level = 'High';
      else if (percentage >= 40) level = 'Moderate';
      else level = 'Low';

      return {
        key: key.charAt(0).toUpperCase(),
        traitKey: key,
        name: trait.name,
        meta: traitMeta[key] || traitMeta.extraversion,
        rawScore: trait.rawScore,
        maxScore: trait.maxScore,
        percentage,
        percentile: trait.percentile,
        tScore: trait.tScore,
        level,
        interpretation: trait.interpretation,
        description: getTraitDescription(key.charAt(0).toUpperCase(), level)
      };
    });
  }, [apiResults]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="w-24 h-24 mb-8 bg-brand-500/20 rounded-full flex items-center justify-center"
        >
          <Brain size={40} className="text-brand-500" />
        </motion.div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-2 text-balance">Analyzing Profile</h2>
        <p className="text-foreground/60 font-medium text-pretty">Processing semantic ontology data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <Activity size={32} />
        </div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-4 text-balance">Analysis Failed</h2>
        <p className="text-foreground/60 max-w-md mb-8 text-pretty">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-brand-600 text-white rounded-full font-bold hover:bg-brand-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header / Summary */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card border rounded-3xl p-8 shadow-sm"
        >
          <div>
            <h1 className="text-4xl font-heading font-bold text-foreground mb-2">
              Profile Results
            </h1>
            <p className="text-foreground/60 text-lg flex items-center gap-2">
              <span className="font-semibold text-foreground">{userData.name}</span> • 
              <span>{userData.age} yrs</span> • 
              <span>{userData.country}</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl">
              <Clock className="text-brand-500" size={20} />
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/50 font-bold">Total Time</div>
                <div className="text-foreground font-dashboard font-bold">{formatDuration(timestamps.totalDuration)}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-muted px-4 py-3 rounded-2xl">
              <Activity className="text-brand-500" size={20} />
              <div>
                <div className="text-xs uppercase tracking-wider text-foreground/50 font-bold">Avg/Q</div>
                <div className="text-foreground font-dashboard font-bold">{(avgQuestionTime / 1000).toFixed(1)}s</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Radar Chart */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 bg-card border rounded-3xl p-8 shadow-sm flex flex-col"
          >
            <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2 text-balance">
              <Target className="text-brand-500" />
              Trait Constellation
            </h2>
            <div className="flex-1 min-h-[400px] w-full flex items-center justify-center -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: 'var(--color-foreground)', opacity: 0.7, fontSize: 12, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name="Percentile"
                    dataKey="score"
                    stroke="var(--color-brand-500)"
                    strokeWidth={3}
                    fill="var(--color-brand-500)"
                    fillOpacity={0.2}
                  />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: 'var(--color-foreground)', fontWeight: 'bold' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Right Column: Trait Bars */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 bg-card border rounded-3xl p-8 shadow-sm flex flex-col gap-6"
          >
            <h2 className="text-2xl font-heading font-bold mb-2 flex items-center gap-2 text-balance">
              <Brain className="text-brand-500" />
              Detailed Breakdown
            </h2>
            <div className="flex-1 flex flex-col justify-between space-y-6">
              {traitScores.map((trait, index) => {
                const Icon = trait.meta.icon;
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + (index * 0.05), ease: [0.16, 1, 0.3, 1] }}
                    key={trait.key} 
                    className="flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white", trait.meta.tailwindColor)}>
                          <Icon size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground leading-none">{trait.name}</h3>
                          <span className="text-xs text-foreground/50 font-medium">T-Score: {trait.tScore.toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold block" style={{ color: trait.meta.color }}>
                          {trait.interpretation || trait.level}
                        </span>
                        <span className="text-2xl font-dashboard font-bold leading-none text-foreground tabular-nums">
                          {trait.percentage}%
                        </span>
                      </div>
                    </div>
                    {/* Linear Progress */}
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${trait.percentage}%` }}
                        transition={{ duration: 0.8, delay: 0.4 + (index * 0.05), ease: [0.16, 1, 0.3, 1] }}
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{ backgroundColor: trait.meta.color }}
                      />
                    </div>
                    <p className="text-sm text-foreground/60 leading-relaxed mt-1 text-pretty">
                      {trait.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </div>

        {/* Predictions / Insights Grid */}
        {apiResults?.predictions && Object.keys(apiResults.predictions).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border rounded-3xl p-8 shadow-sm"
          >
            <h2 className="text-2xl font-heading font-bold mb-6 flex items-center gap-2 text-balance">
              <Sparkles className="text-accent-500" />
              Predicted Outcomes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 pt-4">
              {Object.entries(apiResults.predictions).map(([key, prediction], index) => (
                <div key={key} className="relative flex flex-col group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Target size={64} />
                  </div>
                  <h4 className="font-bold text-lg text-foreground mb-4 relative z-10 text-balance">{formatPredictionName(key)}</h4>
                  <div className="flex items-end gap-3 mb-2 relative z-10">
                    <span className="text-4xl font-dashboard font-bold text-accent-600 leading-none tabular-nums">
                      {prediction.score.toFixed(0)}
                    </span>
                    <span className="text-sm font-medium text-foreground/50 mb-1">/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-4 relative z-10">
                    <div 
                      className="h-full bg-accent-500 rounded-full"
                      style={{ width: `${prediction.score}%` }}
                    />
                  </div>
                  <p className="text-sm font-medium text-foreground/70 mb-4 relative z-10 text-pretty">
                    {prediction.interpretation}
                  </p>
                  <div className="flex flex-wrap gap-2 relative z-10 mt-auto">
                    {prediction.contributingTraits?.slice(0,2).map((ct, idx) => (
                      <span key={idx} className="text-[10px] uppercase tracking-wider font-bold px-2 py-1 bg-muted rounded-md text-foreground/60">
                        {ct.trait.slice(0,3)} (r={ct.correlation.toFixed(2)})
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row justify-center gap-4 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]"
        >
          <button 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-foreground text-background font-bold rounded-2xl hover:scale-105 hover:shadow-xl hover:shadow-foreground/20 transition-all disabled:opacity-50 disabled:hover:scale-100"
            onClick={() => setShowGuidance(true)}
            disabled={!assessmentId}
          >
            <Sparkles size={20} />
            <span>AI Insights & Guidance</span>
          </button>
          
          <button 
            className="flex items-center justify-center gap-3 px-8 py-4 bg-background border-2 border-border text-foreground font-bold rounded-2xl hover:bg-muted hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
            onClick={() => downloadPDF(assessmentId, userData.name, () => setIsDownloadingPdf(true), () => setIsDownloadingPdf(false))}
            disabled={!assessmentId || isDownloadingPdf}
          >
            {isDownloadingPdf ? (
              <div className="w-5 h-5 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={20} />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download Full Report'}</span>
          </button>
        </motion.div>

      </div>

      {/* Guidance Modal */}
      <AnimatePresence>
        {showGuidance && (
          <GuidanceChat 
            assessmentId={assessmentId}
            userName={userData.name}
            onClose={() => setShowGuidance(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

async function downloadPDF(assessmentId, userName, onStart, onComplete) {
  if (!assessmentId) {
    alert('Results must be saved to database to export PDF');
    return;
  }
  
  try {
    if (onStart) onStart();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const targetUrl = `${apiUrl}/export/pdf/${assessmentId}`;
    
    const response = await fetch(targetUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to generate PDF. Status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personality-report-${userName.replace(/\s+/g, '-')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('PDF download error:', error);
    alert('Failed to download PDF. Please ensure the backend is running.');
  } finally {
    if (onComplete) onComplete();
  }
}

function formatPredictionName(key) {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getTraitDescription(trait, level) {
  const descriptions = {
    E: {
      High: 'You are outgoing, energetic, and thrive in social situations. You enjoy being around others and often take the lead.',
      Moderate: 'You have a balanced approach to socializing. You enjoy company but also value your alone time.',
      Low: 'You prefer solitude or small groups. You recharge through quiet time and introspection.'
    },
    A: {
      High: 'You are cooperative, trusting, and considerate of others. Building harmony is important to you.',
      Moderate: 'You balance assertiveness with cooperation. You can be both competitive and collaborative.',
      Low: 'You tend to be more competitive and skeptical. You prioritize your own interests and speak your mind.'
    },
    C: {
      High: 'You are organized, disciplined, and goal-oriented. You plan ahead and follow through on commitments.',
      Moderate: 'You balance structure with flexibility. You can be organized when needed but also spontaneous.',
      Low: 'You prefer flexibility and spontaneity. You may find strict schedules constraining.'
    },
    N: {
      High: 'You experience emotions intensely and may be prone to stress. You are sensitive to your environment.',
      Moderate: 'You have typical emotional responses. You handle stress reasonably well most of the time.',
      Low: 'You are emotionally stable and resilient. You tend to stay calm under pressure.'
    },
    O: {
      High: 'You are curious, creative, and open to new experiences. You appreciate art, ideas, and adventure.',
      Moderate: 'You balance tradition with openness. You appreciate new ideas while valuing familiarity.',
      Low: 'You prefer routine and familiarity. You are practical and prefer concrete over abstract.'
    }
  };
  return descriptions[trait]?.[level] || '';
}

export default Results;
