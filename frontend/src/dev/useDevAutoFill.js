/**
 * Development Helper Hook
 * =======================
 * 
 * Provides auto-fill functionality for testing
 * 
 * Usage in QuestionCard.jsx:
 * 
 * import { useDevAutoFill } from '../../dev/useDevAutoFill';
 * 
 * // Inside component:
 * const { autoFillResponses, isDevMode } = useDevAutoFill(setResponses, setQuestionTimestamps);
 * 
 * // Add button in JSX (only shows in development):
 * {isDevMode && (
 *   <button onClick={autoFillResponses} className="dev-auto-fill">
 *     🚀 Auto-Fill (Dev)
 *   </button>
 * )}
 */

import { useCallback } from 'react';
import { devResponses } from './testAnswers';

// Check if we're in development mode
const isDevMode = import.meta.env.DEV;

export function useDevAutoFill(setResponses, setQuestionTimestamps) {
  const autoFillResponses = useCallback(() => {
    if (!isDevMode) {
      console.warn('Auto-fill is only available in development mode');
      return;
    }

    // Set all responses
    setResponses(devResponses);

    // Generate fake timestamps
    const now = performance.now();
    const timestamps = {};
    Object.keys(devResponses).forEach((questionId, index) => {
      timestamps[questionId] = {
        questionId: parseInt(questionId),
        startTime: Math.round(now + (index * 2000)),
        endTime: Math.round(now + (index * 2000) + 1500),
        duration: 1500 + Math.round(Math.random() * 1000)
      };
    });
    setQuestionTimestamps(timestamps);

    console.log('✅ Auto-filled leadership profile responses');
    console.log('📊 Total responses:', Object.keys(devResponses).length);
  }, [setResponses, setQuestionTimestamps]);

  return {
    autoFillResponses,
    isDevMode,
    devResponses
  };
}

export default useDevAutoFill;
