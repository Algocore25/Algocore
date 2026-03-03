# Multi-File Editor Implementation

## Overview

This implementation adds support for multi-file code templates with language intersection logic between course and question allowed languages.

## Features Implemented

### 1. Language Intersection Logic
- **File**: `src/utils/languageUtils.js`
- **Purpose**: Calculates intersection between course allowed languages and question-specific allowed languages
- **Functions**:
  - `normalizeLanguages()` - Normalizes language names to consistent format
  - `getAllowedLanguages()` - Returns intersection of course and question languages
  - `isLanguageSupported()` - Checks if a language is supported
  - `getDefaultLanguage()` - Gets default language from allowed options

### 2. Multi-File Editor Component
- **File**: `src/components/MultiFileEditor.jsx`
- **Purpose**: Handles non-editable and editable file tabs with Monaco Editor
- **Features**:
  - File tabs with read-only indicators
  - Separate editing for editable files only
  - File info bar showing file name, edit status, and line count
  - Proper layout handling and resize support

### 3. No Language Support UI
- **File**: `src/components/NoLanguageSupport.jsx`
- **Purpose**: Displays when no languages are available after intersection
- **Features**:
  - Clear error messaging
  - Helpful troubleshooting steps
  - Professional error code display

### 4. Updated CodePage Integration
- **File**: `src/pages/CodePage.jsx`
- **Changes**:
  - Integrated language intersection logic
  - Conditional rendering between MultiFileEditor and single-file editor
  - Updated language selection dropdown
  - Enhanced reset functionality
  - Improved code loading/saving for multi-file structure

## Data Structure

### Question Default Code Format
```javascript
{
  "defaultCode": {
    "java": {
      "files": {
        "nonEditable": {
          "fileName": "Main.java",
          "code": "import java.util.*;\n\npublic class Main {\n"
        },
        "editable": {
          "fileName": "Drivecode",
          "code": "    // Create Rectangle class here\n    // Add length and width\n    // Print area\n\n}"
        }
      }
    },
    "cpp": {
      "files": {
        "nonEditable": {
          "fileName": "main.cpp", 
          "code": "#include <iostream>\nusing namespace std;\n\n"
        },
        "editable": {
          "fileName": "Drivecode",
          "code": "// Create Rectangle class here\n\nint main() {\n\n}"
        }
      }
    },
    "python": {
      "files": {
        "nonEditable": {
          "fileName": "main.py",
          "code": "# Driver code\n\n"
        },
        "editable": {
          "fileName": "Drivecode", 
          "code": "# Create Rectangle class here\n"
        }
      }
    }
  }
}
```

### Course Allowed Languages
```javascript
// In Firebase: /AlgoCore/{course}/course/allowedLanguages
["java", "cpp", "python"]
```

### Question Allowed Languages (Optional)
```javascript
// In question data
{
  "allowedLanguages": ["java", "cpp"]
}
```

## User Experience

### 1. Language Selection Flow
1. System loads course allowed languages
2. If question has specific allowed languages, calculates intersection
3. Updates language dropdown with supported languages only
4. Sets default language (prefers current selection, then cpp, then first available)

### 2. Editor Display Logic
- **No defaultCode structure**: Shows regular single-file editor
- **Has defaultCode structure**: Shows MultiFileEditor with file tabs
- **No supported languages**: Shows NoLanguageSupport component

### 3. Multi-File Editor Features
- **File Tabs**: Click to switch between files
- **Read-only Files**: Non-editable files marked with "Read-only" badge
- **Editable Files**: Only editable files can be modified
- **Auto-save**: Only editable code is saved to Firebase
- **Reset Button**: Resets editable file to original default code

## Code Storage

### Firebase Structure
```
savedCode/
  {userId}/
    {course}/
      {questionId}/
        {language}/
          "editable code content here"
```

### Multi-File Handling
- Only editable file content is saved to Firebase
- Non-editable content comes from question data
- On load, combines saved editable code with question's non-editable code

## Error Handling

### Language Intersection Issues
- When intersection is empty, shows NoLanguageSupport component
- Provides clear troubleshooting steps
- Displays error code for debugging

### Missing Data
- Gracefully handles missing defaultCode structure
- Falls back to single-file editor
- Uses language templates when no question data available

## Testing Scenarios

### 1. Normal Multi-File Question
- Course allows: ["java", "cpp", "python"]
- Question has defaultCode structure
- Result: MultiFileEditor with file tabs

### 2. Question-Specific Languages
- Course allows: ["java", "cpp", "python", "javascript"]
- Question allows: ["java", "cpp"]
- Result: Language dropdown shows only ["java", "cpp"]

### 3. No Language Intersection
- Course allows: ["java", "cpp"]
- Question allows: ["python", "javascript"]
- Result: NoLanguageSupport component displayed

### 4. Single-File Question
- Course allows: ["java", "cpp", "python"]
- Question has no defaultCode structure
- Result: Regular single-file editor

## Implementation Notes

### Key Changes Made
1. **languageUtils.js** - New utility for language intersection
2. **MultiFileEditor.jsx** - New component for multi-file editing
3. **NoLanguageSupport.jsx** - New error state component
4. **CodePage.jsx** - Updated to integrate all new components

### Backward Compatibility
- Existing single-file questions continue to work
- No changes needed to existing Firebase data
- Language selection dropdown enhanced but backward compatible

### Performance Considerations
- Language intersection calculated once per question load
- MultiFileEditor only initializes when defaultCode exists
- Efficient state management for file tabs and code content

## Future Enhancements

### Possible Improvements
1. **File Management**: Add ability to create/delete files
2. **Language Detection**: Auto-detect language from file extensions
3. **Code Templates**: Expand template library for more languages
4. **Collaboration**: Real-time collaborative editing
5. **File Upload**: Support for uploading existing code files

### Scalability
- Current implementation handles unlimited files per question
- Language intersection works with any number of languages
- Firebase structure scales with user base

## Troubleshooting

### Common Issues
1. **No languages showing**: Check course and question allowed languages
2. **Multi-file not working**: Verify defaultCode structure in question data
3. **Code not saving**: Ensure editable file is properly identified
4. **Reset not working**: Check defaultCode.files.editable exists

### Debug Steps
1. Check browser console for language intersection logs
2. Verify Firebase data structure
3. Test with different language combinations
4. Check Network tab for API calls

## Conclusion

This implementation provides a robust multi-file editing experience with intelligent language intersection logic. It maintains backward compatibility while adding powerful new features for complex coding questions.
