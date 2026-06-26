import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Calendar, MapPin, GraduationCap, Lock, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

const countries = [
  "Afghanistan", "Australia",
  "France", "Germany", "Greece", "Saudi Arabia",
  "Pakistan", "Poland",
  "Qatar", "South Africa",
  "UAE", "Ukraine", "United Kingdom", "United States", "Other"
];

export function WelcomeForm({ onStart, onBack }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    country: '',
    university: '',
    assessmentType: 'deep'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      newErrors.age = 'Valid age required (13-120)';
    }
    if (!formData.country) newErrors.country = 'Please select a country';
    if (!formData.university.trim()) newErrors.university = 'Institution is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      // Small delay for smooth animation transition
      setTimeout(() => {
        onStart({
          ...formData,
          age: parseInt(formData.age)
        });
      }, 400);
    }
  };

  const inputClasses = (error) => cn(
    "w-full px-4 py-3.5 bg-background border-2 rounded-xl text-foreground font-medium transition-all focus:outline-none focus:ring-4 placeholder:text-foreground/30 appearance-none",
    error 
      ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/10" 
      : "border-border focus:border-brand-500 focus:ring-brand-500/10 hover:border-brand-500/30"
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative w-full max-w-lg bg-card border rounded-[2rem] shadow-2xl p-8 md:p-10"
      >
        {/* Back Button */}
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-8 left-8 p-2 -ml-2 rounded-full text-foreground/50 hover:bg-muted hover:text-foreground transition-colors group"
            title="Go back"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        )}

        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-heading font-bold text-foreground mb-3">Participant Details</h1>
          <p className="text-foreground/60 font-medium">Please provide your context for the ontology baseline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <User size={14} className="text-brand-500" /> Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              className={inputClasses(errors.name)}
            />
            {errors.name && <span className="text-red-500 text-xs font-medium">{errors.name}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Age */}
            <div className="space-y-1.5">
              <label htmlFor="age" className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                <Calendar size={14} className="text-brand-500" /> Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Years"
                min="13"
                max="120"
                className={inputClasses(errors.age)}
              />
              {errors.age && <span className="text-red-500 text-xs font-medium">{errors.age}</span>}
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label htmlFor="country" className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                <MapPin size={14} className="text-brand-500" /> Country
              </label>
              <div className="relative">
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={cn(inputClasses(errors.country), "pr-10 cursor-pointer")}
                >
                  <option value="" disabled>Select...</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/40">
                  <ChevronRight size={16} className="rotate-90" />
                </div>
              </div>
              {errors.country && <span className="text-red-500 text-xs font-medium">{errors.country}</span>}
            </div>
          </div>

          {/* University / Institution */}
          <div className="space-y-1.5">
            <label htmlFor="university" className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <GraduationCap size={14} className="text-brand-500" /> Institution
            </label>
            <input
              type="text"
              id="university"
              name="university"
              value={formData.university}
              onChange={handleChange}
              placeholder="University or organization name"
              className={inputClasses(errors.university)}
            />
            {errors.university && <span className="text-red-500 text-xs font-medium">{errors.university}</span>}
          </div>

          <div className="space-y-3 pt-2 mt-4">
            <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              Assessment Length
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                formData.assessmentType === 'short' 
                  ? "border-brand-500 bg-brand-500/5 text-brand-700 dark:text-brand-300" 
                  : "border-border hover:border-brand-500/30 text-foreground/70"
              )}>
                <input 
                  type="radio" 
                  name="assessmentType" 
                  value="short" 
                  checked={formData.assessmentType === 'short'}
                  onChange={handleChange}
                  className="sr-only" 
                />
                <span className="font-bold text-sm">Quick Test</span>
                <span className="text-xs mt-1 opacity-70">20 Items (2 mins)</span>
              </label>
              
              <label className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                formData.assessmentType === 'deep' 
                  ? "border-brand-500 bg-brand-500/5 text-brand-700 dark:text-brand-300" 
                  : "border-border hover:border-brand-500/30 text-foreground/70"
              )}>
                <input 
                  type="radio" 
                  name="assessmentType" 
                  value="deep" 
                  checked={formData.assessmentType === 'deep'}
                  onChange={handleChange}
                  className="sr-only" 
                />
                <span className="font-bold text-sm">Deep Test</span>
                <span className="text-xs mt-1 opacity-70">50 Items (5 mins)</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-4 mt-6 bg-foreground text-background rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-foreground/20 disabled:opacity-70 disabled:hover:scale-100 group"
          >
            {isSubmitting ? (
              <div className="w-6 h-6 border-2 border-background border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Begin Assessment</span>
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-2 text-foreground/50">
          <Lock size={14} />
          <p className="text-xs font-medium">
            Confidential & encrypted for ontological processing.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default WelcomeForm;
