import React from 'react';
import { Icons } from '../views/constants';

/**
 * Component displayed when no supported languages are available
 */
const NoLanguageSupport = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900 min-w-0">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Icons.Lock className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          No Supported Language Selected
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          This question doesn't support any of the languages allowed in your course. 
          Please contact your instructor to resolve this language configuration issue.
        </p>
        
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Possible solutions:
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Check if the course language settings are correct</li>
            <li>• Verify the question supports your preferred language</li>
            <li>• Contact your instructor to update language permissions</li>
            <li>• Try selecting a different question or course</li>
          </ul>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Error Code: LANG_NO_INTERSECTION
          </p>
        </div>
      </div>
    </div>
  );
};

export default NoLanguageSupport;
