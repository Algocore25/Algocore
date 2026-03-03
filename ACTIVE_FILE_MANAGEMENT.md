# Active File Management System

## Overview

This document describes the comprehensive active file management system implemented in the CodePage component. The system provides detailed tracking, notifications, and state management for file switches in multi-file coding questions.

## Features

### 🔄 File Change Detection & Tracking
- **Real-time monitoring**: Detects when users switch between files in multi-file questions
- **Change history**: Maintains a history of the last 10 file changes with timestamps
- **Detailed logging**: Provides comprehensive console logs for debugging and monitoring

### 📢 User Notifications
- **Toast notifications**: Shows brief toast messages when files are switched
- **Visual indicators**: Displays animated indicators showing the current file change
- **Console logging**: Detailed colored console logs for development

### 💾 State Persistence
- **LocalStorage integration**: Automatically saves and restores the active file
- **Cross-session memory**: Remembers the last active file across browser sessions
- **Question-specific storage**: Separate storage for each question and language combination

### 🧹 Cleanup Management
- **Pending operation clearing**: Automatically clears pending autosave operations when switching files
- **Memory management**: Cleans up change history and notifications after delays
- **State synchronization**: Ensures all related states are updated consistently

## Implementation

### Custom Hook: `useActiveFileManagement`

Located in `src/hooks/useActiveFileManagement.js`, this custom hook provides:

#### State Management
```javascript
const {
  activeFile,           // Current active file
  previousActiveFile,   // Previous active file
  activeFileChangeInfo,  // Current change information
  fileChangeHistory,    // History of changes (last 10)
  setActiveFile,        // Function to set active file with tracking
  setActiveFileDirect,  // Function to set active file without tracking
  clearFileChangeHistory,
  getFileChangeStats,
  hasActiveFile,
  hasFileChanged,
  changeCount
} = useActiveFileManagement(options);
```

#### Configuration Options
```javascript
const options = {
  clearPendingOperations: () => { /* Clear autosave, etc. */ },
  questionId: 'current-question-id',
  selectedLanguage: 'python',
  isMultiFile: true
};
```

### Integration in CodePage

#### Hook Initialization
```javascript
// Active file management with notifications
const activeFileManagement = useActiveFileManagement({
  clearPendingOperations: () => {
    // Clear any pending autosave when switching files
    if (saveTimeoutRef.current) {
      console.log('🧹 Clearing autosave timeout due to file change');
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  },
  questionId,
  selectedLanguage,
  isMultiFile
});
```

#### LocalStorage Integration
```javascript
// Save active file to localStorage when it changes
useEffect(() => {
  if (activeFile && questionId && selectedLanguage) {
    const storageKey = `activeFile_${questionId}_${selectedLanguage}`;
    localStorage.setItem(storageKey, activeFile);
    console.log(`💾 Saved active file to localStorage: ${storageKey} = ${activeFile}`);
  }
}, [activeFile, questionId, selectedLanguage]);

// Initialize active file from localStorage on mount
useEffect(() => {
  if (typeof window !== 'undefined' && !activeFile) {
    const saved = localStorage.getItem(`activeFile_${questionId}_${selectedLanguage}`);
    if (saved) {
      console.log(`📂 Restoring active file from localStorage: ${saved}`);
      setActiveFileDirect(saved);
    }
  }
}, [questionId, selectedLanguage, activeFile, setActiveFileDirect]);
```

#### File Tab Integration
```javascript
// In file tab rendering
onClick={() => {
  console.log('Tab clicked:', fileName);
  // Inform about active file change before setting it
  if (activeFile && activeFile !== fileName) {
    console.log(`📢 Preparing to switch active file from "${activeFile}" to "${fileName}"`);
  }
  setActiveFileWithTracking(fileName);
}}
```

#### Visual Indicator
```javascript
// Active file change indicator in the UI
{activeFileChangeInfo && (
  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium animate-pulse">
    <Icons.ArrowRight size={12} />
    <span>Switched: {activeFileChangeInfo.fromFile} → {activeFileChangeInfo.toFile}</span>
  </div>
)}
```

## Console Logging System

The system uses colored console logs for different types of events:

### 🔵 File Change Notifications
```javascript
console.log(
  `%c🔄 ACTIVE FILE CHANGED\nFrom: ${previousActiveFile}\nTo: ${activeFile}\nTime: ${changeInfo.timestamp}\nChange #: ${changeInfo.changeNumber}`,
  'background: #e8f4fd; color: #1976d2; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #1976d2;'
);
```

### 📂 LocalStorage Operations
```javascript
console.log(`💾 Saved active file to localStorage: ${storageKey} = ${activeFile}`);
console.log(`📂 Restoring active file from localStorage: ${saved}`);
```

### 📢 Preparation Logs
```javascript
console.log(`📢 Preparing to switch active file from "${activeFile}" to "${fileName}"`);
```

### 🧹 Cleanup Logs
```javascript
console.log('🧹 Clearing autosave timeout due to file change');
```

## Change Information Structure

Each file change is tracked with detailed information:

```javascript
const changeInfo = {
  fromFile: 'previous-file.py',
  toFile: 'new-file.py',
  timestamp: '2024-01-15T10:30:45.123Z',
  isMultiFile: true,
  selectedLanguage: 'python',
  questionId: 'question-123',
  changeNumber: 5
};
```

## File Change History

The system maintains a rolling history of the last 10 file changes:

```javascript
const fileChangeHistory = [
  {
    fromFile: 'file1.py',
    toFile: 'file2.py',
    timestamp: '2024-01-15T10:30:45.123Z',
    // ... other properties
  },
  // ... up to 10 changes
];
```

## Statistics & Utilities

### File Change Statistics
```javascript
const stats = getFileChangeStats();
// Returns:
// {
//   totalChanges: 5,
//   uniqueFiles: ['file1.py', 'file2.py', 'file3.py'],
//   mostRecentChange: { /* change info */ },
//   currentFile: 'file2.py',
//   previousFile: 'file1.py'
// }
```

### Computed Values
```javascript
{
  hasActiveFile: !!activeFile,           // Boolean: Is there an active file?
  hasFileChanged: activeFile !== previousActiveFile,  // Boolean: Did file just change?
  changeCount: fileChangeHistory.length  // Number: Total changes tracked
}
```

## Toast Notifications

The system shows user-friendly toast notifications:

```javascript
toast.info(`Switched to ${newActiveFile}`, {
  position: "top-right",
  autoClose: 2000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  toastId: `file-change-${newActiveFile}` // Prevent duplicate toasts
});
```

## Best Practices

### When to Use `setActiveFile` vs `setActiveFileDirect`
- **Use `setActiveFile`**: When user clicks file tabs or any user-initiated file change
- **Use `setActiveFileDirect`**: When initializing from localStorage or programmatic setting without user action

### Performance Considerations
- Change history is limited to 10 entries to prevent memory bloat
- Visual indicators auto-clear after 3 seconds
- Toast notifications have unique IDs to prevent duplicates

### Error Handling
- All file operations are wrapped in null checks
- LocalStorage operations check for window availability
- Graceful fallbacks for missing data

## Testing

### Manual Testing Steps
1. Open a multi-file coding question
2. Click between different file tabs
3. Observe console logs for detailed change tracking
4. Check toast notifications appear
5. Verify visual indicator shows briefly
6. Refresh page and confirm active file is restored
7. Check localStorage contains the correct active file

### Console Output Example
```
📢 Preparing to switch active file from "main.py" to "utils.py"
🔄 ACTIVE FILE CHANGED
From: main.py
To: utils.py
Time: 2024-01-15T10:30:45.123Z
Change #: 3
🧹 Clearing autosave timeout due to file change
💾 Saved active file to localStorage: activeFile_question123_python = utils.py
📚 File change history updated (3 changes): [...]
```

## Future Enhancements

### Potential Improvements
1. **File change analytics**: Track which files are most frequently accessed
2. **Keyboard shortcuts**: Add keyboard navigation for file switching
3. **File change undo**: Implement undo functionality for file changes
4. **Collaboration features**: Share file change status in real-time collaboration
5. **Performance metrics**: Track time spent in each file

### Extension Points
- Custom notification providers (slack, email, etc.)
- Different storage backends (IndexedDB, Firebase, etc.)
- Advanced filtering and search in change history
- Integration with code analysis tools

## Files Modified

1. **`src/hooks/useActiveFileManagement.js`** - New custom hook
2. **`src/pages/CodePage.jsx`** - Integration and UI updates
3. **`src/pages/constants.js`** - Added ArrowRight icon

## Dependencies

- React hooks (useState, useEffect, useCallback)
- React Toastify for notifications
- LocalStorage API for persistence
- No external dependencies required

---

This system provides a robust foundation for managing active file changes in multi-file coding environments, with comprehensive tracking, user feedback, and state management capabilities.
