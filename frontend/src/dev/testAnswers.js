/**
 * DEV TEST ANSWERS - Leadership-Focused Profile
 * =============================================
 * 
 * This file contains pre-filled answers for development testing.
 * The answers are designed to produce a LEADERSHIP-ORIENTED personality profile:
 * 
 * Target Profile:
 * - HIGH Extraversion (leadership presence, social confidence)
 * - HIGH Conscientiousness (organized, responsible, goal-oriented)
 * - MODERATE-HIGH Agreeableness (team-oriented but can be assertive)
 * - LOW Neuroticism (emotionally stable, calm under pressure)
 * - HIGH Openness (innovative thinking, strategic vision)
 * 
 * Usage:
 * 1. Import this in your component during development
 * 2. Use devResponses to auto-fill answers
 * 3. Use devUserData for test participant info
 * 
 * IMPORTANT: Remove or disable in production!
 */

// Pre-filled user data for testing
export const devUserData = {
  name: "Test Leader",
  age: 35,
  country: "Pakistan",
  university: "FAST NUCES"
};

/**
 * Leadership-focused responses
 * 
 * Likert Scale:
 * 1 = Very Inaccurate
 * 2 = Moderately Inaccurate  
 * 3 = Neither Accurate nor Inaccurate
 * 4 = Moderately Accurate
 * 5 = Very Accurate
 * 
 * IPIP-50 Questions mapped to leadership traits
 */
export const devResponses = {
  // === EXTRAVERSION (Questions 1, 6, 11, 16, 21, 26, 31, 36, 41, 46) ===
  // HIGH scores for leadership presence
  1: 5,   // Am the life of the party → Leaders energize groups
  6: 1,   // Don't talk a lot (R) → Leaders communicate effectively (reverse)
  11: 5,  // Feel comfortable around people → Leaders are socially confident
  16: 1,  // Keep in the background (R) → Leaders take initiative (reverse)
  21: 5,  // Start conversations → Leaders initiate engagement
  26: 1,  // Have little to say (R) → Leaders articulate vision (reverse)
  31: 5,  // Talk to a lot of different people at parties → Leaders network
  36: 1,  // Don't like to draw attention to myself (R) → Leaders are visible (reverse)
  41: 4,  // Don't mind being the center of attention → Leaders accept spotlight
  46: 2,  // Am quiet around strangers (R) → Leaders adapt quickly (reverse)

  // === AGREEABLENESS (Questions 2, 7, 12, 17, 22, 27, 32, 37, 42, 47) ===
  // MODERATE-HIGH for team leadership with assertiveness
  2: 4,   // Am interested in people → Leaders care about team
  7: 2,   // Insult people (R) → Leaders respect others (reverse)
  12: 4,  // Sympathize with others' feelings → Empathetic leadership
  17: 2,  // Am not interested in other people's problems (R) → Leaders listen (reverse)
  22: 4,  // Have a soft heart → Compassionate but decisive
  27: 2,  // Am not really interested in others (R) → Team-focused (reverse)
  32: 3,  // Take time out for others → Balance empathy with boundaries
  37: 4,  // Feel others' emotions → Emotional intelligence
  42: 2,  // Make people feel at ease (R) → Creates comfortable environment (reverse-scored)
  47: 4,  // Am concerned about others → Servant leadership mindset

  // === CONSCIENTIOUSNESS (Questions 3, 8, 13, 18, 23, 28, 33, 38, 43, 48) ===
  // HIGH for organized, responsible leadership
  3: 5,   // Am always prepared → Leaders plan ahead
  8: 2,   // Leave my belongings around (R) → Leaders are organized (reverse)
  13: 5,  // Pay attention to details → Leaders ensure quality
  18: 1,  // Make a mess of things (R) → Leaders execute well (reverse)
  23: 5,  // Get chores done right away → Leaders are productive
  28: 2,  // Often forget to put things back (R) → Leaders maintain systems (reverse)
  33: 5,  // Like order → Leaders create structure
  38: 2,  // Shirk my duties (R) → Leaders fulfill responsibilities (reverse)
  43: 5,  // Follow a schedule → Leaders manage time effectively
  48: 5,  // Am exacting in my work → Leaders maintain high standards

  // === NEUROTICISM (Questions 4, 9, 14, 19, 24, 29, 34, 39, 44, 49) ===
  // LOW for emotional stability under pressure
  4: 1,   // Get stressed out easily → Leaders remain calm
  9: 5,   // Am relaxed most of the time (R) → Leaders stay composed (reverse)
  14: 2,  // Worry about things → Leaders don't over-worry
  19: 5,  // Seldom feel blue (R) → Leaders maintain positive outlook (reverse)
  24: 2,  // Get upset easily → Leaders regulate emotions
  29: 4,  // Am not easily disturbed (R) → Leaders stay steady (reverse)
  34: 2,  // Have frequent mood swings → Leaders are consistent
  39: 5,  // Rarely get irritated (R) → Leaders have patience (reverse)
  44: 2,  // Often feel blue → Leaders maintain optimism
  49: 5,  // Don't get stressed easily (R) → Stress-resistant (reverse)

  // === OPENNESS (Questions 5, 10, 15, 20, 25, 30, 35, 40, 45, 50) ===
  // HIGH for innovative, visionary leadership
  5: 5,   // Have a rich vocabulary → Leaders communicate effectively
  10: 2,  // Have difficulty understanding abstract ideas (R) → Strategic thinking (reverse)
  15: 5,  // Have a vivid imagination → Leaders envision possibilities
  20: 2,  // Am not interested in abstract ideas (R) → Conceptual thinking (reverse)
  25: 5,  // Have excellent ideas → Leaders are innovative
  30: 1,  // Do not have a good imagination (R) → Creative vision (reverse)
  35: 5,  // Am quick to understand things → Leaders grasp situations fast
  40: 2,  // Use difficult words (R) → Clear communication (moderate)
  45: 5,  // Spend time reflecting on things → Leaders are thoughtful
  50: 5,  // Am full of ideas → Leaders drive innovation
};

/**
 * Quick-fill function to use in console during development
 * Copy and paste this in the browser console when on the assessment page
 */
export const getConsoleScript = () => {
  const script = `
// Paste this in browser console to auto-fill leadership profile
const responses = ${JSON.stringify(devResponses, null, 2)};
console.log("Leadership Profile Test Responses:", responses);
console.log("Total questions:", Object.keys(responses).length);
`;
  return script;
};

/**
 * Expected Results (approximate based on leadership profile):
 * 
 * Extraversion: ~85-95 percentile (HIGH - Leadership presence)
 * Agreeableness: ~60-75 percentile (MODERATE-HIGH - Team-oriented)
 * Conscientiousness: ~90-98 percentile (HIGH - Organized, reliable)
 * Neuroticism: ~5-15 percentile (LOW - Emotionally stable)
 * Openness: ~85-95 percentile (HIGH - Innovative, visionary)
 * 
 * Predicted Outcomes:
 * - Leadership Effectiveness: HIGH (85+)
 * - Job Performance: HIGH (80+)
 * - Academic Performance: HIGH (75+)
 */

export default {
  devUserData,
  devResponses,
  getConsoleScript
};
