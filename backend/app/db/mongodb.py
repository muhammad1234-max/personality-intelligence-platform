# app/db/mongodb.py

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
import os


# MongoDB connection string (overridden by MONGODB_URI env var)
MONGODB_URI = os.getenv(
    "MONGODB_URI",
    "mongodb+srv://k230061_db_user:RSM2K62jjlHUOUC5@personalitydata.g4n8qni.mongodb.net/?appName=personalityData"
)

client = AsyncIOMotorClient(MONGODB_URI, server_api=ServerApi('1'))
db = client["personality_assessment"]

# Collections
assessments_collection = db["assessments"]


async def save_assessment(
    user: Dict[str, Any],
    responses: Dict[str, int],
    scores: Dict[str, Any],
    predictions: Dict[str, Any],
    timestamps: Optional[Dict[str, Any]] = None
) -> str:
    """Persist minimal assessment data."""
    ts = timestamps or {}
    session = ts.get("session", {})

    doc = {
        "user": {
            "userId": user.get("userId"),
            "name": user.get("name", "Anonymous"),
            "country": user.get("country"),
            "university": user.get("university"),
        },
        "session": {
            "startTimeMs": session.get("startTimeMs"),
            "endTimeMs": session.get("endTimeMs"),
            "totalDurationMs": session.get("totalDurationMs"),
            "startTimeSec": session.get("startTimeSec"),
            "endTimeSec": session.get("endTimeSec"),
            "totalDurationSec": session.get("totalDurationSec"),
            "totalDurationMin": session.get("totalDurationMin"),
            "totalDurationHour": session.get("totalDurationHour"),
            "completedAt": datetime.utcnow()
        },
        "responses": responses,
        "questionTimestamps": ts.get("questionTimestamps", {}),
        "scores": scores,
        "predictions": predictions,
        "createdAt": datetime.utcnow()
    }
    result = await assessments_collection.insert_one(doc)
    return str(result.inserted_id)


async def get_assessment_by_id(assessment_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve assessment by ID."""
    try:
        doc = await assessments_collection.find_one({"_id": ObjectId(assessment_id)})
        if doc:
            doc["_id"] = str(doc["_id"])
        return doc
    except Exception:
        return None


async def get_all_assessments(limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
    """Get assessments with pagination."""
    cursor = assessments_collection.find().sort("createdAt", -1).skip(skip).limit(limit)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results


async def get_assessment_count() -> int:
    """Get total assessment count."""
    return await assessments_collection.count_documents({})


async def delete_assessment(assessment_id: str) -> bool:
    """Delete assessment by ID."""
    try:
        result = await assessments_collection.delete_one({"_id": ObjectId(assessment_id)})
        return result.deleted_count > 0
    except Exception:
        return False


async def test_connection() -> bool:
    """Test MongoDB connection."""
    try:
        await client.admin.command('ping')
        return True
    except Exception:
        return False
