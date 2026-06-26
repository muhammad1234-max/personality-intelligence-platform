"""
RAG Service - Simple Knowledge Retrieval
Uses direct file reading for knowledge retrieval (no vector store needed for this size)
"""
import os
from pathlib import Path
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()


class RAGService:
    """Service for managing the knowledge base and retrieval"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if RAGService._initialized:
            return
        
        # Knowledge base path
        self.knowledge_path = Path(__file__).parent.parent / "knowledge"
        
        # Load all knowledge documents into memory
        self.knowledge_base: Dict[str, str] = {}
        self._load_knowledge_base()
        
        RAGService._initialized = True
    
    def _load_knowledge_base(self) -> None:
        """Load all markdown files from knowledge directory into memory"""
        if not self.knowledge_path.exists():
            print(f"Knowledge path does not exist: {self.knowledge_path}")
            return
        
        for md_file in self.knowledge_path.glob("*.md"):
            with open(md_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            topic = md_file.stem  # filename without extension
            self.knowledge_base[topic] = content
            print(f"Loaded knowledge document: {md_file.name}")
        
        print(f"Loaded {len(self.knowledge_base)} knowledge documents into memory")
    
    def initialize_vector_store(self, force_rebuild: bool = False) -> None:
        """Initialize knowledge base (reload files if force_rebuild)"""
        if force_rebuild:
            self.knowledge_base = {}
            self._load_knowledge_base()
        print("Knowledge base initialized successfully")
    
    def get_trait_context(self, trait_name: str) -> str:
        """Get context for a specific trait"""
        trait_key = trait_name.lower()
        return self.knowledge_base.get(trait_key, "")
    
    def get_career_context(self) -> str:
        """Get career guidance context"""
        return self.knowledge_base.get("career_guidance", "")
    
    def get_growth_context(self) -> str:
        """Get personal growth context"""
        return self.knowledge_base.get("personal_growth", "")
    
    def get_trait_specific_context(
        self, 
        traits: Dict[str, Dict[str, Any]],
        include_career: bool = True,
        include_growth: bool = True
    ) -> str:
        """
        Get context relevant to specific trait scores
        
        Args:
            traits: Dictionary of trait results with scores and interpretations
            include_career: Whether to include career guidance
            include_growth: Whether to include personal growth strategies
        
        Returns:
            Combined relevant context as a string
        """
        all_context = []
        
        # Get context for each trait
        for trait_name, trait_data in traits.items():
            percentile = trait_data.get("percentile", 50)
            
            # Determine level for relevance
            if percentile >= 70:
                level = "High"
            elif percentile <= 30:
                level = "Low"
            else:
                level = "Average"
            
            trait_content = self.get_trait_context(trait_name)
            if trait_content:
                # Extract relevant section based on level
                relevant_section = self._extract_level_section(trait_content, level)
                if relevant_section:
                    all_context.append(f"[{trait_name} - {level}]\n{relevant_section}")
        
        # Add career guidance if requested
        if include_career:
            career_content = self.get_career_context()
            if career_content:
                all_context.append(f"[Career Guidance]\n{career_content[:3000]}")  # Limit size
        
        # Add growth strategies if requested
        if include_growth:
            growth_content = self.get_growth_context()
            if growth_content:
                all_context.append(f"[Growth Strategies]\n{growth_content[:2000]}")  # Limit size
        
        return "\n\n---\n\n".join(all_context)
    
    def _extract_level_section(self, content: str, level: str) -> str:
        """Extract the section relevant to a specific level (High/Average/Low)"""
        lines = content.split('\n')
        result_lines = []
        capturing = False
        
        for line in lines:
            # Check for level headers
            if f"## {level}" in line or f"### {level}" in line:
                capturing = True
                result_lines.append(line)
            elif capturing:
                # Stop at next major section
                if line.startswith('## ') and f"{level}" not in line:
                    break
                result_lines.append(line)
        
        # If no specific section found, return first 1500 chars
        if not result_lines:
            return content[:1500]
        
        return '\n'.join(result_lines)[:2000]  # Limit size
    
    def get_ontology_graph_context(self, traits: Dict[str, Dict[str, Any]]) -> str:
        """
        Extract explicit semantic relationships directly from the OWL ontology 
        based on the user's extreme traits, formatting them as Graph Paths.
        """
        try:
            from .ontology_service import ontology_service
            if not ontology_service.is_loaded:
                return ""
            
            correlations = ontology_service.get_correlations()
            if not correlations:
                return ""
            
            graph_paths = []
            graph_paths.append("## Ontological Knowledge Graph Paths\n")
            graph_paths.append("These are scientifically validated predictive relationships extracted directly from the semantic ontology graph:\n")
            
            for trait_name, trait_data in traits.items():
                percentile = trait_data.get("percentile", 50)
                
                # Only extract correlations for highly expressive traits
                if percentile >= 60:
                    level = "High"
                elif percentile <= 40:
                    level = "Low"
                else:
                    continue
                
                # Find correlations for this trait across all outcomes
                for outcome, trait_corrs in correlations.items():
                    # Check if the trait exists in the correlations map
                    trait_corr = trait_corrs.get(trait_name)
                    if trait_corr:
                        corr_value = trait_corr.get('value', 0)
                        num_studies = trait_corr.get('num_studies', 0)
                        
                        if abs(corr_value) < 0.05:
                            continue # Ignore negligible correlations
                            
                        # Format outcome name
                        outcome_display = outcome.replace('_', ' ').title()
                        
                        # Determine effect
                        effect = "INCREASES" if (level == "High" and corr_value > 0) or (level == "Low" and corr_value < 0) else "DECREASES"
                        strength = abs(corr_value)
                        
                        path = f"- [User] -> [hasTrait: {level} {trait_name}] -> [predictsOutcome: {effect} {outcome_display}] (Correlation Strength: {strength:.2f}, Evidence: {num_studies} studies)"
                        graph_paths.append(path)
            
            if len(graph_paths) > 2:
                return "\n".join(graph_paths)
            return ""
        except Exception as e:
            print(f"Error extracting ontology graph context: {e}")
            return ""
            
    def get_comprehensive_context(
        self,
        traits: Dict[str, Dict[str, Any]],
        lifestyle_answers: Dict[str, str]
    ) -> str:
        """
        Get comprehensive context based on traits and lifestyle answers
        """
        all_context = []
        
        # Get trait-specific context
        trait_context = self.get_trait_specific_context(
            traits,
            include_career=True,
            include_growth=True
        )
        all_context.append(trait_context)
        
        # Get ontology graph context
        graph_context = self.get_ontology_graph_context(traits)
        if graph_context:
            all_context.append(f"[Ontology GraphRAG]\n{graph_context}")
        
        # Get context based on career goal from lifestyle answers
        career_goal = lifestyle_answers.get("Career Goal (3-5 years)", "")
        if "business" in career_goal.lower() or "entrepreneur" in career_goal.lower():
            all_context.append("[Entrepreneurship Focus]\nConsider traits that support entrepreneurship: High Openness for innovation, moderate Conscientiousness for planning, and emotional stability for handling uncertainty.")
        elif "leadership" in career_goal.lower() or "management" in career_goal.lower():
            all_context.append("[Leadership Focus]\nLeadership effectiveness correlates with Extraversion, emotional stability (low Neuroticism), and Openness to experience.")
        
        # Get context based on main challenge
        challenge = lifestyle_answers.get("Main Challenge", "")
        if "stress" in challenge.lower() or "anxiety" in challenge.lower():
            all_context.append("[Stress Management]\nHigh Neuroticism individuals benefit from cognitive behavioral techniques, mindfulness, and structured routines for managing stress.")
        elif "confidence" in challenge.lower() or "self-doubt" in challenge.lower():
            all_context.append("[Building Confidence]\nFocus on small wins, strength-based development, and gradual exposure to challenging situations.")
        
        return "\n\n---\n\n".join(all_context)


# Singleton accessor - lazy initialization
_rag_service_instance = None

def get_rag_service() -> RAGService:
    """Get or create the RAG service singleton"""
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    return _rag_service_instance
