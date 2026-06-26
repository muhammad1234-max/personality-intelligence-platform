# app/services/ontology_service.py
"""Ontology service layer - handles all OWL ontology operations."""

from owlready2 import get_ontology
from typing import Dict, List, Optional, Any, Tuple
import os


class OntologyService:
    """Service for interacting with the Big Five personality ontology."""
    
    _instance = None
    _ontology = None
    _namespace = None
    
    def __new__(cls):
        """Singleton pattern to ensure ontology is loaded once."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    @property
    def onto(self):
        return self._ontology
    
    @property
    def ns(self):
        return self._namespace
    
    @property
    def is_loaded(self) -> bool:
        return self._namespace is not None
    
    def load_ontology(self, base_path: str = None) -> bool:
        """
        Load the ontology from file.
        
        Args:
            base_path: Base directory to search for ontology files
            
        Returns:
            True if loaded successfully, False otherwise
        """
        if self._namespace is not None:
            return True
            
        if base_path is None:
            base_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        
        ontology_files = [
            "app/bigfive.rdf",
            "app/ontology.owl",
            "bigfive.rdf",
            "ontology.owl"
        ]
        
        for ontology_file in ontology_files:
            ontology_path = os.path.join(base_path, ontology_file)
            if os.path.exists(ontology_path):
                print(f"Loading ontology from: {ontology_path}")
                self._ontology = get_ontology(f"file://{ontology_path}").load()
                self._namespace = self._ontology.get_namespace("http://www.personality-ontology.org/bigfive#")
                print("Ontology loaded successfully!")
                return True
        
        raise FileNotFoundError(f"Could not find ontology file. Tried: {ontology_files}")
    
    def get_trait_map(self) -> Dict:
        """Map trait instances to trait names."""
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return {}
        return {
            self.ns.ExtraversionTrait: 'extraversion',
            self.ns.AgreeablenessTrait: 'agreeableness',
            self.ns.ConscientiousnessTrait: 'conscientiousness',
            self.ns.NeuroticismTrait: 'neuroticism',
            self.ns.OpennessTrait: 'openness'
        }
    
    def get_trait_names(self) -> Dict[str, str]:
        """Get display names for traits."""
        return {
            'extraversion': 'Extraversion',
            'agreeableness': 'Agreeableness',
            'conscientiousness': 'Conscientiousness',
            'neuroticism': 'Neuroticism',
            'openness': 'Openness'
        }
    
    def get_questions(self, short: bool = False) -> Tuple[List[Dict], List[Dict]]:
        """
        Get all questions from the ontology.
        
        Args:
            short: If True, returns a 20-question mini version (2 pos, 2 neg per trait)
            
        Returns:
            Tuple of (questions list, likert options list)
        """
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return [], []
        
        trait_map = self.get_trait_map()
        questions = []
        
        trait_counts = {t: {'positive': 0, 'negative': 0} for t in self.get_trait_names().keys()}
        
        # Get positively keyed questions
        pos_instances = list(self.ns.PositivelyKeyedQuestion.instances())
        pos_instances.sort(key=lambda q: q.questionID[0] if q.questionID else "")
        
        for q in pos_instances:
            trait_instance = q.measuresTrait[0] if q.measuresTrait else None
            if trait_instance in trait_map:
                trait_key = trait_map[trait_instance]
                if short and trait_counts[trait_key]['positive'] >= 2:
                    continue
                    
                q_id = q.questionID[0] if q.questionID else None
                q_text = q.questionText[0] if q.questionText else ''
                if q_id and q_text:
                    questions.append({
                        'id': q_id,
                        'text': q_text,
                        'trait': trait_map[trait_instance][0].upper(),
                        'reversed': False
                    })
                    trait_counts[trait_key]['positive'] += 1
        
        # Get negatively keyed questions
        neg_instances = list(self.ns.NegativelyKeyedQuestion.instances())
        neg_instances.sort(key=lambda q: q.questionID[0] if q.questionID else "")
        
        for q in neg_instances:
            trait_instance = q.measuresTrait[0] if q.measuresTrait else None
            if trait_instance in trait_map:
                trait_key = trait_map[trait_instance]
                if short and trait_counts[trait_key]['negative'] >= 2:
                    continue
                    
                q_id = q.questionID[0] if q.questionID else None
                q_text = q.questionText[0] if q.questionText else ''
                if q_id and q_text:
                    questions.append({
                        'id': q_id,
                        'text': q_text,
                        'trait': trait_map[trait_instance][0].upper(),
                        'reversed': True
                    })
                    trait_counts[trait_key]['negative'] += 1
        
        # Sort by question ID
        questions.sort(key=lambda x: x['id'])
        
        # Get Likert options
        likert_options = []
        for opt in self.ns.LikertOption.instances():
            value = opt.likertValue[0] if opt.likertValue else None
            label = opt.likertLabel[0] if opt.likertLabel else ''
            if value is not None:
                likert_options.append({'value': value, 'label': label})
        
        likert_options.sort(key=lambda x: x['value'])
        
        return questions, likert_options
    
    def get_questions_by_trait(self, short: bool = False) -> Dict[str, Dict[str, List[int]]]:
        """
        Get question IDs grouped by trait and keying.
        
        Args:
            short: If True, returns a 20-question mini version
            
        Returns:
            Dict with structure: {trait: {'positive': [ids], 'negative': [ids]}}
        """
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return {}
        
        trait_map = self.get_trait_map()
        questions_by_trait = {
            'extraversion': {'positive': [], 'negative': []},
            'agreeableness': {'positive': [], 'negative': []},
            'conscientiousness': {'positive': [], 'negative': []},
            'neuroticism': {'positive': [], 'negative': []},
            'openness': {'positive': [], 'negative': []}
        }
        
        pos_instances = list(self.ns.PositivelyKeyedQuestion.instances())
        pos_instances.sort(key=lambda q: q.questionID[0] if q.questionID else "")
        
        for q in pos_instances:
            trait_instance = q.measuresTrait[0] if q.measuresTrait else None
            if trait_instance in trait_map:
                trait_key = trait_map[trait_instance]
                if short and len(questions_by_trait[trait_key]['positive']) >= 2:
                    continue
                    
                q_id = q.questionID[0] if q.questionID else None
                if q_id:
                    questions_by_trait[trait_key]['positive'].append(q_id)
        
        neg_instances = list(self.ns.NegativelyKeyedQuestion.instances())
        neg_instances.sort(key=lambda q: q.questionID[0] if q.questionID else "")
        
        for q in neg_instances:
            trait_instance = q.measuresTrait[0] if q.measuresTrait else None
            if trait_instance in trait_map:
                trait_key = trait_map[trait_instance]
                if short and len(questions_by_trait[trait_key]['negative']) >= 2:
                    continue
                    
                q_id = q.questionID[0] if q.questionID else None
                if q_id:
                    questions_by_trait[trait_key]['negative'].append(q_id)
        
        return questions_by_trait
    
    def get_norms(self) -> Dict[str, Dict[str, float]]:
        """
        Get population norms from ontology.
        
        Returns:
            Dict with structure: {trait: {'mean': float, 'std': float}}
        """
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return {}
        
        norms = {}
        norm_map = {
            self.ns.ExtraversionNorm: 'extraversion',
            self.ns.AgreeablenessNorm: 'agreeableness',
            self.ns.ConscientiousnessNorm: 'conscientiousness',
            self.ns.NeuroticismNorm: 'neuroticism',
            self.ns.OpennessNorm: 'openness'
        }
        
        for norm_instance, trait_name in norm_map.items():
            if norm_instance:
                norms[trait_name] = {
                    'mean': norm_instance.populationMean[0] if norm_instance.populationMean else 0,
                    'std': norm_instance.populationStd[0] if norm_instance.populationStd else 1
                }
        
        return norms
    
    def get_score_categories(self) -> List[Dict[str, Any]]:
        """
        Get score category definitions from ontology.
        
        Returns:
            List of category dicts with name, min, max percentiles
        """
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return []
        
        categories = []
        for cat in self.ns.ScoreCategory.instances():
            categories.append({
                'name': cat.categoryName[0] if cat.categoryName else '',
                'min': cat.categoryMinPercentile[0] if cat.categoryMinPercentile else 0,
                'max': cat.categoryMaxPercentile[0] if cat.categoryMaxPercentile else 100
            })
        
        categories.sort(key=lambda x: x['min'])
        return categories
    
    def get_correlations(self) -> Dict[str, Dict[str, Dict[str, Any]]]:
        """
        Get correlation findings for outcome predictions.
        
        Returns:
            Dict with structure: {outcome: {trait: {'value': float, 'num_studies': int}}}
        """
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return {}
        
        trait_map = self.get_trait_map()
        correlations = {
            'job_performance': {},
            'academic_performance': {},
            'leadership_effectiveness': {}
        }
        
        outcome_map = {
            self.ns.JobPerformanceOutcome: 'job_performance',
            self.ns.AcademicPerformanceOutcome: 'academic_performance',
            self.ns.LeadershipEffectivenessOutcome: 'leadership_effectiveness'
        }
        
        for corr in self.ns.CorrelationFinding.instances():
            outcome_instance = corr.forOutcome[0] if corr.forOutcome else None
            trait_instance = corr.regardingTrait[0] if corr.regardingTrait else None
            
            if outcome_instance in outcome_map and trait_instance in trait_map:
                outcome_name = outcome_map[outcome_instance]
                trait_name = trait_map[trait_instance]
                correlations[outcome_name][trait_name] = {
                    'value': corr.correlationValue[0] if corr.correlationValue else 0,
                    'num_studies': corr.numberOfStudies[0] if corr.numberOfStudies else 0
                }
        
        return correlations
    
    def get_trait_info(self) -> List[Dict[str, str]]:
        """
        Get trait information for display.
        
        Returns:
            List of trait info dicts with key, name, color, label
        """
        if not self.is_loaded:
            self.load_ontology()
            
        if not self.ns:
            return []
        
        traits = []
        trait_classes = [
            (self.ns.ExtraversionTrait, 'Extraversion', '#ef4444'),
            (self.ns.AgreeablenessTrait, 'Agreeableness', '#22c55e'),
            (self.ns.ConscientiousnessTrait, 'Conscientiousness', '#3b82f6'),
            (self.ns.NeuroticismTrait, 'Neuroticism', '#f59e0b'),
            (self.ns.OpennessTrait, 'Openness', '#8b5cf6')
        ]
        
        for trait_instance, name, color in trait_classes:
            if trait_instance:
                traits.append({
                    'key': name[0],
                    'name': name,
                    'color': color,
                    'label': trait_instance.label[0] if trait_instance.label else name
                })
        
        return traits


# Global singleton instance
ontology_service = OntologyService()
