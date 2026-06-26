"""
LLM Service - Groq-powered Personalized Guidance Generation
Uses LangChain with Groq's fast LLM for generating psychiatrist-level personalized advice
"""
import os
from typing import Dict, Any, List, Optional, AsyncGenerator
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage, SystemMessage
from dotenv import load_dotenv

from .rag_service import get_rag_service

load_dotenv()


class LLMService:
    """Service for generating personalized guidance using Groq LLM"""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if LLMService._initialized:
            return
            
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        
        # Initialize Groq model (llama-3.3-70b-versatile is great for this task)
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=self.api_key,
            temperature=0.45,
            max_tokens=4096,
        )
        
        # Get RAG service for context retrieval
        self.rag_service = get_rag_service()
        
        LLMService._initialized = True
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for the guidance generation"""
        return """You are an expert personality psychologist and career counselor. Provide BRIEF, ACTIONABLE guidance.

CRITICAL RULES:
- Keep your response SHORT and SCANNABLE (max 550 words total)
- If Ontological Knowledge Graph Paths are provided, GROUND your career and performance advice STRICTLY in those paths.
- Use bullet points for all recommendations
- Be direct - no lengthy introductions or filler text
- Every bullet must be specific to their exact trait scores
- Focus on 2-3 KEY insights, not everything possible
- End with a clear "ACTION ITEMS" section with 3-5 specific things to work on

Do NOT use Markdown syntax (**, __, *, or ###).
Do NOT use asterisks or symbols for emphasis.
use plain text and bold only where specified.

You speak directly to the person using "you". Be warm but concise."""

    def _build_user_prompt(
        self,
        user_name: str,
        traits: Dict[str, Dict[str, Any]],
        predictions: Dict[str, Any],
        lifestyle_answers: Dict[str, str],
        context: str,
        age: int = None,
        country: str = None
    ) -> str:
        """Build the user prompt with all assessment data"""
        
        # Format demographic info
        demographic_info = []
        if age:
            demographic_info.append(f"- **Age**: {age} years old")
            # Add life stage context
            if age < 20:
                demographic_info.append(f"- **Life Stage**: Late teenager - exploring identity, education focused")
            elif age < 25:
                demographic_info.append(f"- **Life Stage**: Early adult - establishing career, building independence")
            elif age < 30:
                demographic_info.append(f"- **Life Stage**: Young professional - career growth, relationship building")
            elif age < 40:
                demographic_info.append(f"- **Life Stage**: Established adult - career advancement, possibly family")
            elif age < 50:
                demographic_info.append(f"- **Life Stage**: Mid-career - leadership roles, legacy building")
            elif age < 60:
                demographic_info.append(f"- **Life Stage**: Senior professional - mentoring, wisdom sharing")
            else:
                demographic_info.append(f"- **Life Stage**: Experienced professional - reflection, transition planning")
        
        if country:
            demographic_info.append(f"- **Country**: {country}")
        
        # Format trait scores
        trait_summary = []
        for trait_name, trait_data in traits.items():
            percentile = trait_data.get("percentile", 50)
            interpretation = trait_data.get("interpretation", "Average")
            raw_score = trait_data.get("rawScore", 0)
            trait_summary.append(
                f"- **{trait_name}**: {percentile:.0f}th percentile ({interpretation}) - Raw Score: {raw_score}/50"
            )
        
        # Format predictions
        prediction_summary = []
        for pred_name, pred_data in predictions.items():
            if isinstance(pred_data, dict):
                score = pred_data.get("score", 0)
                interp = pred_data.get("interpretation", "Average")
                prediction_summary.append(f"- **{pred_name}**: {score:.0f}/100 ({interp})")
            else:
                prediction_summary.append(f"- **{pred_name}**: {pred_data}")
        
        # Format lifestyle answers
        lifestyle_summary = []
        for question, answer in lifestyle_answers.items():
            lifestyle_summary.append(f"- **{question}**: {answer}")
        
        # Build demographic section
        demographic_section = ""
        if demographic_info:
            demographic_section = f"""## Demographics (IMPORTANT - tailor advice to their age and cultural context!)
{chr(10).join(demographic_info)}

"""
        
        return f"""Generate BRIEF personalized guidance for {user_name}.

{demographic_section}## Their Profile
{chr(10).join(trait_summary)}

## Predictions
{chr(10).join(prediction_summary)}

## Their Situation
{chr(10).join(lifestyle_summary)}

## Context
{context}

---

## YOUR RESPONSE FORMAT (Keep it SHORT!):

### 🎯 Quick Profile Summary
2-3 sentences max about their unique personality blend.

### 💪 Your Top Strengths
• Bullet 1 (specific to their scores)
• Bullet 2
• Bullet 3

### 🚀 Career Direction
• Best path: Job OR Business (explain briefly why based on their traits)
• 2-3 specific roles/industries that fit

### ⚠️ Watch Out For
• 1-2 potential challenges based on their trait combination

### ✅ ACTION ITEMS (Things to Work On)
1. [Specific action] - Brief explanation
2. [Specific action] - Brief explanation  
3. [Specific action] - Brief explanation
4. [Specific action] - Brief explanation (optional)
5. [Specific action] - Brief explanation (optional)

### 💬 Final Note
1-2 encouraging sentences.

REMEMBER: Be BRIEF. Bold text when necessary, User won't read walls of text. Max 600 words total."""

    async def generate_guidance(
        self,
        user_name: str,
        traits: Dict[str, Dict[str, Any]],
        predictions: Dict[str, Any],
        lifestyle_answers: Dict[str, str],
        age: int = None,
        country: str = None
    ) -> str:
        """Generate personalized guidance based on assessment results"""
        
        # Get relevant context from RAG
        context = self.rag_service.get_comprehensive_context(traits, lifestyle_answers)
        
        # Build prompts
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(
            user_name, traits, predictions, lifestyle_answers, context, age, country
        )
        
        # Generate response
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        response = await self.llm.ainvoke(messages)
        return response.content

    async def generate_guidance_stream(
        self,
        user_name: str,
        traits: Dict[str, Dict[str, Any]],
        predictions: Dict[str, Any],
        lifestyle_answers: Dict[str, str],
        age: int = None,
        country: str = None
    ) -> AsyncGenerator[str, None]:
        """Generate personalized guidance with streaming response"""
        
        # Get relevant context from RAG
        context = self.rag_service.get_comprehensive_context(traits, lifestyle_answers)
        
        # Build prompts
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(
            user_name, traits, predictions, lifestyle_answers, context, age, country
        )
        
        # Generate streaming response
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt)
        ]
        
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content

    def get_lifestyle_questions(self) -> List[Dict[str, Any]]:
        """Get the lifestyle questions for personalization"""
        return [
            {
                "id": "current_situation",
                "question": "What best describes your current situation?",
                "type": "select",
                "options": [
                    "High school student",
                    "University/college student",
                    "Graduate student (Master's/PhD)",
                    "Early career professional (0-5 years)",
                    "Mid-career professional (5-15 years)",
                    "Senior professional/executive (15+ years)",
                    "Career transition/between jobs",
                    "Entrepreneur/business owner",
                    "Homemaker/caregiver",
                    "Other"
                ]
            },
            {
                "id": "career_goal",
                "question": "What is your primary career goal for the next 3-5 years?",
                "type": "select",
                "options": [
                    "Get my first job / enter the workforce",
                    "Advance in my current career path",
                    "Make a career change to a different field",
                    "Start my own business or freelance",
                    "Achieve better work-life balance",
                    "Develop new skills / stay relevant",
                    "Transition to leadership/management",
                    "Find more meaningful/purposeful work",
                    "Increase my income significantly",
                    "I'm not sure yet"
                ]
            },
            {
                "id": "work_environment",
                "question": "What type of work environment do you thrive in or desire?",
                "type": "select",
                "options": [
                    "Large corporation (structured, resources)",
                    "Small company/startup (dynamic, flexible)",
                    "Government/public sector (stability)",
                    "Nonprofit/NGO (mission-driven)",
                    "Academia/research (intellectual)",
                    "Freelance/self-employed (autonomy)",
                    "Remote work (location flexibility)",
                    "Hybrid (mix of office and remote)",
                    "On-site/in-person (collaboration)",
                    "I'm open to different environments"
                ]
            },
            {
                "id": "main_challenge",
                "question": "What is your biggest personal or professional challenge right now?",
                "type": "select",
                "options": [
                    "Managing stress and anxiety",
                    "Building confidence / overcoming self-doubt",
                    "Improving relationships (work or personal)",
                    "Finding motivation and staying disciplined",
                    "Making important decisions",
                    "Communicating effectively",
                    "Managing time and priorities",
                    "Dealing with conflict",
                    "Building leadership skills",
                    "Finding work-life balance",
                    "Networking and building connections",
                    "Other"
                ]
            },
            {
                "id": "life_priority",
                "question": "What matters most to you in life right now?",
                "type": "select",
                "options": [
                    "Financial security and wealth building",
                    "Career achievement and professional success",
                    "Family and close relationships",
                    "Personal growth and self-improvement",
                    "Health and well-being",
                    "Freedom and independence",
                    "Making a positive impact on society",
                    "Creativity and self-expression",
                    "Adventure and new experiences",
                    "Stability and security",
                    "Work-life balance"
                ]
            }
        ]


# Singleton accessor
_llm_service_instance = None

def get_llm_service() -> LLMService:
    """Get or create the LLM service singleton"""
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
