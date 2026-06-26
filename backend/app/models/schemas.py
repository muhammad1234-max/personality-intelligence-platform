# app/models/schemas.py
"""Pydantic models for API validation."""

from pydantic import BaseModel
from typing import Dict, List, Optional, Any


class QuestionResponse(BaseModel):
    """IPIP-50 question."""
    id: int
    text: str
    trait: str
    reversed: bool


class LikertOption(BaseModel):
    """Likert scale option."""
    value: int
    label: str


class SessionData(BaseModel):
    """Session timing data."""
    surveyStartTime: Optional[int] = None
    surveyEndTime: Optional[int] = None
    totalDuration: Optional[int] = None
    questionTimestamps: Optional[Dict[str, Any]] = None


class AssessmentRequest(BaseModel):
    """Assessment submission request."""
    responses: Dict[str, int]
    userData: Dict[str, Any]
    timestamps: Optional[SessionData] = None


class TraitResult(BaseModel):
    """Single trait result."""
    name: str
    rawScore: int
    maxScore: int
    percentile: float
    tScore: float
    interpretation: str
    populationMean: float
    populationStd: float


class PredictionResult(BaseModel):
    """Outcome prediction result."""
    score: float
    interpretation: str
    contributingTraits: List[Dict[str, Any]]


class AssessmentResult(BaseModel):
    """Complete assessment response."""
    assessmentId: Optional[str] = None
    traits: Dict[str, TraitResult]
    predictions: Dict[str, PredictionResult]
    savedToDatabase: bool = False
