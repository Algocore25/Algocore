/**
 * Utility functions for handling language selection and intersection logic
 */

/**
 * Normalizes language names to consistent format
 * @param {string|Array} languages - Single language or array of languages
 * @returns {Array} - Normalized array of language names
 */
export const normalizeLanguages = (languages) => {
  if (!languages) return [];
  
  const langs = Array.isArray(languages) ? languages : [languages];
  
  return langs.map(lang => {
    const l = String(lang).toLowerCase();
    // Handle various C/C++ variations
    if (l === 'c/c++' || l === 'c++' || l === 'c') return 'cpp';
    // Handle other variations
    if (l === 'python' || l === 'py') return 'python';
    if (l === 'javascript' || l === 'js') return 'javascript';
    if (l === 'typescript' || l === 'ts') return 'typescript';
    if (l === 'java') return 'java';
    return l;
  });
};

/**
 * Intersects course allowed languages with question allowed languages
 * @param {Array} courseLanguages - Languages allowed by course
 * @param {Array} questionLanguages - Languages allowed by question (optional)
 * @returns {Array} - Intersection of allowed languages
 */
export const getAllowedLanguages = (courseLanguages, questionLanguages = null) => {
  const normalizedCourse = normalizeLanguages(courseLanguages);
  
  // If no question-specific languages, return course languages
  if (!questionLanguages || questionLanguages.length === 0) {
    return normalizedCourse;
  }
  
  const normalizedQuestion = normalizeLanguages(questionLanguages);
  
  // Return intersection
  const intersection = normalizedCourse.filter(lang => 
    normalizedQuestion.includes(lang)
  );
  
  return intersection.length > 0 ? intersection : [];
};

/**
 * Checks if a language is supported for the given course and question
 * @param {string} language - Language to check
 * @param {Array} courseLanguages - Languages allowed by course
 * @param {Array} questionLanguages - Languages allowed by question (optional)
 * @returns {boolean} - Whether the language is supported
 */
export const isLanguageSupported = (language, courseLanguages, questionLanguages = null) => {
  const allowedLanguages = getAllowedLanguages(courseLanguages, questionLanguages);
  return allowedLanguages.includes(language);
};

/**
 * Gets the default language from allowed languages
 * @param {Array} courseLanguages - Languages allowed by course
 * @param {Array} questionLanguages - Languages allowed by question (optional)
 * @param {string} preferredLanguage - Preferred language (optional)
 * @returns {string|null} - Default language or null if no languages available
 */
export const getDefaultLanguage = (courseLanguages, questionLanguages = null, preferredLanguage = null) => {
  const allowedLanguages = getAllowedLanguages(courseLanguages, questionLanguages);
  
  if (allowedLanguages.length === 0) {
    return null;
  }
  
  // Return preferred language if it's in allowed languages
  if (preferredLanguage && allowedLanguages.includes(preferredLanguage)) {
    return preferredLanguage;
  }
  
  // Return first allowed language (prefer cpp if available)
  if (allowedLanguages.includes('cpp')) {
    return 'cpp';
  }
  
  return allowedLanguages[0];
};
