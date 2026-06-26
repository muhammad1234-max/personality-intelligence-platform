// API service for Big Five Personality Assessment

// Configure API URL based on environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://139.59.64.246:8000/api';

// Enable for debugging (set to false in production)
const DEBUG = import.meta.env.DEV;
const log = (...args) => DEBUG && console.log('[API]', ...args);

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  log(options.method || 'GET', url);
  
  try {
    const response = await fetch(url, options);
    const text = await response.text();
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${text}`);
    }
    
    return JSON.parse(text);
  } catch (err) {
    // Enhanced error logging for network failures
    if (err.message.includes('fetch')) {
      console.error(`❌ Backend Connection Failed: Unable to connect to ${API_BASE_URL}`);
      console.error('   Error Details:', err.message);
      console.error('   Make sure the backend server is running at:', API_BASE_URL);
      console.error('   Run: cd backend && uvicorn api:app --reload');
    } else {
      console.error(`❌ API Error on ${endpoint}:`, err.message);
    }
    log('Error:', err.message);
    throw err;
  }
}

/**
 * Fetch all questions and Likert options from the ontology
 */
export async function fetchQuestions(short = false) {
  const url = short ? '/questions?short=true' : '/questions';
  return apiFetch(url);
}

/**
 * Fetch trait information
 */
export async function fetchTraits() {
  return apiFetch('/traits');
} 

/**
 * Submit assessment responses and get results
 * @param {Object} data - { responses: {questionId: score}, userData: {}, timestamps: {} }
 */
export async function submitAssessment(data) {
  return apiFetch('/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * Get assessment results by ID
 */
export async function getAssessmentById(assessmentId) {
  return apiFetch(`/results/${assessmentId}`);
}

/**
 * Get all assessment results (admin)
 */
export async function getAllAssessments(limit = 100, skip = 0) {
  return apiFetch(`/results?limit=${limit}&skip=${skip}`);
}

/**
 * Check if API is running
 * Falls back to checking /questions endpoint if /health is not available
 */
export async function checkApiHealth() {
  try {
    const data = await apiFetch('/health');
    return data.ontology === 'loaded';
  } catch {
    // Fallback: try /questions endpoint if /health doesn't exist
    try {
      const questionsData = await apiFetch('/questions');
      return questionsData.questions && questionsData.questions.length > 0;
    } catch {
      return false;
    }
  }
}
