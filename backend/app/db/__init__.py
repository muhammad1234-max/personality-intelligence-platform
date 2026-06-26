# app/db/__init__.py
"""Database utilities."""

from .mongodb import (
    test_connection,
    save_assessment,
    get_assessment_by_id,
    get_all_assessments,
    get_assessment_count,
    delete_assessment,
)

__all__ = [
    'test_connection',
    'save_assessment',
    'get_assessment_by_id',
    'get_all_assessments',
    'get_assessment_count',
    'delete_assessment',
]
