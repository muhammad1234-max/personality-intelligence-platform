# app/services/assessment_service.py
"""Assessment service layer - handles scoring and prediction logic."""

from scipy import stats
from typing import Dict, Any, Optional, List
from .ontology_service import ontology_service


class AssessmentService:
    """Service for processing personality assessments."""
    
    def __init__(self):
        self.ontology = ontology_service
    
    def calculate_trait_scores(self, responses: Dict[int, int]) -> Dict[str, Dict[str, Any]]:
        """
        Calculate trait scores from responses.
        
        Args:
            responses: Dict mapping question IDs to scores (1-5)
            
        Returns:
            Dict with trait results including raw scores, percentiles, etc.
        """
        is_short = len(responses) <= 25
        questions_by_trait = self.ontology.get_questions_by_trait(short=is_short)
        norms = self.ontology.get_norms()
        score_categories = self.ontology.get_score_categories()
        trait_names = self.ontology.get_trait_names()
        
        trait_results = {}
        
        for trait, questions in questions_by_trait.items():
            # Calculate raw score
            raw_score = 0
            for q_id in questions['positive']:
                raw_score += responses.get(q_id, 3)
            for q_id in questions['negative']:
                raw_score += (6 - responses.get(q_id, 3))  # Reverse score
                
            # Scale raw score if using short form (4 questions instead of 10)
            num_questions = len(questions['positive']) + len(questions['negative'])
            if num_questions > 0 and num_questions < 10:
                raw_score = int(round(raw_score * (10 / num_questions)))
            
            # Calculate percentile and T-score
            norm = norms.get(trait, {'mean': 30, 'std': 5})
            z_score = (raw_score - norm['mean']) / norm['std'] if norm['std'] != 0 else 0
            percentile = round(stats.norm.cdf(z_score) * 100, 1)
            t_score = round(50 + (10 * z_score), 1)
            
            # Get interpretation
            interpretation = "Very High"
            for cat in score_categories:
                if cat['min'] <= percentile < cat['max']:
                    interpretation = cat['name']
                    break
            
            trait_results[trait] = {
                'name': trait_names.get(trait, trait.capitalize()),
                'rawScore': raw_score,
                'maxScore': 50,
                'percentile': percentile,
                'tScore': t_score,
                'interpretation': interpretation,
                'populationMean': norm['mean'],
                'populationStd': norm['std']
            }
        
        return trait_results
    
    def calculate_predictions(self, trait_results: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Calculate outcome predictions based on trait scores.
        
        Args:
            trait_results: Dict of calculated trait results
            
        Returns:
            Dict with predictions for each outcome
        """
        correlations = self.ontology.get_correlations()
        trait_names = self.ontology.get_trait_names()
        
        outcome_names = {
            'job_performance': 'Job Performance',
            'academic_performance': 'Academic Performance',
            'leadership_effectiveness': 'Leadership Effectiveness'
        }
        
        predictions = {}
        
        for outcome, trait_correlations in correlations.items():
            if not trait_correlations:
                continue
            
            weighted_sum = 0
            total_weight = 0
            contributing = []
            
            for trait, corr_data in trait_correlations.items():
                if trait in trait_results:
                    normalized_score = trait_results[trait]['percentile'] / 100
                    weight = abs(corr_data['value'])
                    contribution = normalized_score * corr_data['value']
                    weighted_sum += contribution
                    total_weight += weight
                    contributing.append({
                        'trait': trait_names.get(trait, trait.capitalize()),
                        'correlation': corr_data['value'],
                        'numStudies': corr_data['num_studies']
                    })
            
            if total_weight > 0:
                prediction_score = 50 + (weighted_sum / total_weight) * 50
                
                if prediction_score < 30:
                    interp = "Below Average"
                elif prediction_score < 45:
                    interp = "Slightly Below Average"
                elif prediction_score < 55:
                    interp = "Average"
                elif prediction_score < 70:
                    interp = "Above Average"
                else:
                    interp = "Well Above Average"
                
                predictions[outcome] = {
                    'score': round(prediction_score, 1),
                    'interpretation': interp,
                    'contributingTraits': contributing
                }
        
        return predictions
    
    def process_assessment(
        self, 
        responses: Dict[str, int],
        user_data: Dict[str, Any],
        timestamps: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a complete assessment.
        
        Args:
            responses: Dict mapping question IDs (as strings) to scores
            user_data: User information
            timestamps: Optional timing data
            
        Returns:
            Complete assessment result
        """
        # Convert string keys to int
        int_responses = {int(k): v for k, v in responses.items()}
        
        # Calculate scores
        trait_results = self.calculate_trait_scores(int_responses)
        predictions = self.calculate_predictions(trait_results)
        
        return {
            'traits': trait_results,
            'predictions': predictions,
            'userData': user_data,
            'timestamps': timestamps
        }
    
    def get_interpretation_text(self, trait: str, percentile: float) -> str:
        """
        Get detailed interpretation text for a trait score.
        
        Args:
            trait: Trait name
            percentile: Percentile score
            
        Returns:
            Interpretation text
        """
        interpretations = {
            'extraversion': {
                'low': "You tend to be reserved and prefer solitary activities. You may find large social gatherings draining.",
                'medium': "You have a balanced approach to social interaction, enjoying both social activities and time alone.",
                'high': "You are outgoing and energetic. You thrive in social situations and enjoy being around others."
            },
            'agreeableness': {
                'low': "You tend to be more competitive and skeptical. You prioritize your own interests and may challenge others' ideas.",
                'medium': "You balance cooperation with healthy skepticism. You can work well with others while maintaining boundaries.",
                'high': "You are cooperative and trusting. You value harmony and tend to put others' needs before your own."
            },
            'conscientiousness': {
                'low': "You prefer flexibility and spontaneity over structure. You may find strict schedules constraining.",
                'medium': "You balance organization with flexibility. You can follow plans but adapt when needed.",
                'high': "You are organized and disciplined. You set clear goals and work diligently to achieve them."
            },
            'neuroticism': {
                'low': "You tend to be emotionally stable and resilient. You handle stress well and remain calm under pressure.",
                'medium': "You experience normal emotional fluctuations. You can manage stress but may feel overwhelmed occasionally.",
                'high': "You tend to experience emotions intensely. You may be more sensitive to stress and negative experiences."
            },
            'openness': {
                'low': "You prefer familiar routines and practical approaches. You value tradition and conventional methods.",
                'medium': "You appreciate both new ideas and proven methods. You can adapt while valuing stability.",
                'high': "You are curious and creative. You enjoy exploring new ideas, art, and unconventional perspectives."
            }
        }
        
        trait_lower = trait.lower()
        if trait_lower not in interpretations:
            return ""
        
        if percentile < 35:
            return interpretations[trait_lower]['low']
        elif percentile < 65:
            return interpretations[trait_lower]['medium']
        else:
            return interpretations[trait_lower]['high']
    
    def get_career_recommendations(self, trait_results: Dict[str, Dict[str, Any]]) -> List[str]:
        """
        Get career recommendations based on trait profile.
        
        Args:
            trait_results: Dict of calculated trait results
            
        Returns:
            List of career recommendation strings
        """
        recommendations = []
        
        # Extract percentiles
        e = trait_results.get('extraversion', {}).get('percentile', 50)
        a = trait_results.get('agreeableness', {}).get('percentile', 50)
        c = trait_results.get('conscientiousness', {}).get('percentile', 50)
        n = trait_results.get('neuroticism', {}).get('percentile', 50)
        o = trait_results.get('openness', {}).get('percentile', 50)
        
        # Leadership potential
        if e >= 60 and c >= 60 and n <= 50:
            recommendations.append("Strong leadership potential - consider management or executive roles")
        
        # Creative fields
        if o >= 65:
            recommendations.append("High openness suggests aptitude for creative fields, research, or innovation")
        
        # Service-oriented roles
        if a >= 65 and e >= 50:
            recommendations.append("Strong people skills - consider roles in customer service, HR, or counseling")
        
        # Detail-oriented work
        if c >= 65:
            recommendations.append("High conscientiousness suits roles requiring attention to detail - finance, engineering, project management")
        
        # Independent work
        if e <= 40 and c >= 50:
            recommendations.append("May excel in independent roles - research, writing, technical work")
        
        # Stress management
        if n <= 35:
            recommendations.append("Emotional stability is an asset for high-pressure roles")
        elif n >= 65:
            recommendations.append("Consider roles with supportive environments and manageable stress levels")
        
        return recommendations


# Global service instance
assessment_service = AssessmentService()
