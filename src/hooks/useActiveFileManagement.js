import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

/**
 * Custom hook for managing active file changes with notifications and state tracking
 * 
 * Features:
 * - Tracks active file changes
 * - Provides detailed change information
 * - Shows toast notifications
 * - Manages previous file state
 * - Clears pending operations on file change
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.clearPendingOperations - Function to clear pending operations (like autosave)
 * @param {string} options.questionId - Current question ID
 * @param {string} options.selectedLanguage - Current programming language
 * @param {boolean} options.isMultiFile - Whether in multi-file mode
 * @returns {Object} - Active file management utilities
 */
export const useActiveFileManagement = ({
  clearPendingOperations,
  questionId,
  selectedLanguage,
  isMultiFile
}) => {
  const [activeFile, setActiveFile] = useState(null);
  const [previousActiveFile, setPreviousActiveFile] = useState(null);
  const [activeFileChangeInfo, setActiveFileChangeInfo] = useState(null);
  const [fileChangeHistory, setFileChangeHistory] = useState([]);

  // Handle active file changes with comprehensive notification system
  const handleActiveFileChange = useCallback((newActiveFile) => {
    // Only trigger when activeFile actually changes and both are valid
    if (newActiveFile !== previousActiveFile && newActiveFile && previousActiveFile !== null) {
      // Clear any pending operations when switching files
      if (clearPendingOperations) {
        console.log('🧹 useActiveFileManagement: Clearing pending operations due to file change');
        clearPendingOperations();
      }

      // Create detailed change info object
      const changeInfo = {
        fromFile: previousActiveFile,
        toFile: newActiveFile,
        timestamp: new Date().toISOString(),
        isMultiFile: isMultiFile,
        selectedLanguage: selectedLanguage,
        questionId: questionId,
        changeNumber: fileChangeHistory.length + 1
      };

      // Log the change with detailed information
      console.log(
        `%c🔄 ACTIVE FILE CHANGED\nFrom: ${previousActiveFile}\nTo: ${newActiveFile}\nTime: ${changeInfo.timestamp}\nChange #: ${changeInfo.changeNumber}`,
        'background: #e8f4fd; color: #1976d2; padding: 8px; border-radius: 4px; font-weight: bold; font-family: monospace; border-left: 4px solid #1976d2;'
      );

      // Store change info for UI notifications
      setActiveFileChangeInfo(changeInfo);

      // Add to history (keep last 10 changes)
      setFileChangeHistory(prev => {
        const newHistory = [changeInfo, ...prev].slice(0, 10);
        console.log(`📚 File change history updated (${newHistory.length} changes):`, newHistory);
        return newHistory;
      });

    
      // Clear the change info after a delay (for visual indicator)
      const clearTimer = setTimeout(() => {
        setActiveFileChangeInfo(null);
      }, 3000);

      return () => clearTimeout(clearTimer);
    }

    // Update previous active file for next change detection
    setPreviousActiveFile(newActiveFile);
  }, [previousActiveFile, isMultiFile, selectedLanguage, questionId, clearPendingOperations]);

  // Wrapper function to set active file with change tracking
  const setActiveFileWithTracking = useCallback((newFile) => {
    console.log(`📢 Setting active file: "${newFile}" (from: "${activeFile}")`);
    setActiveFile(newFile);
    handleActiveFileChange(newFile);
  }, [activeFile, handleActiveFileChange]);

  // Get file change statistics
  const getFileChangeStats = useCallback(() => {
    const totalChanges = fileChangeHistory.length;
    const uniqueFiles = [...new Set(fileChangeHistory.map(change => change.toFile))];
    const mostRecentChange = fileChangeHistory[0];
    
    return {
      totalChanges,
      uniqueFiles,
      mostRecentChange,
      currentFile: activeFile,
      previousFile: previousActiveFile
    };
  }, [fileChangeHistory, activeFile, previousActiveFile]);

  // Clear file change history
  const clearFileChangeHistory = useCallback(() => {
    console.log('🧹 Clearing file change history');
    setFileChangeHistory([]);
    setActiveFileChangeInfo(null);
  }, []);

  // Reset active file state
  const resetActiveFileState = useCallback(() => {
    console.log('🔄 Resetting active file state');
    setActiveFile(null);
    setPreviousActiveFile(null);
    setActiveFileChangeInfo(null);
    clearFileChangeHistory();
  }, [clearFileChangeHistory]);

  return {
    // State
    activeFile,
    previousActiveFile,
    activeFileChangeInfo,
    fileChangeHistory,
    
    // Actions
    setActiveFile: setActiveFileWithTracking,
    setActiveFileDirect: setActiveFile, // For cases where you don't want tracking
    clearFileChangeHistory,
    resetActiveFileState,
    
    // Utilities
    getFileChangeStats,
    
    // Computed values
    hasActiveFile: !!activeFile,
    hasFileChanged: activeFile !== previousActiveFile,
    changeCount: fileChangeHistory.length
  };
};

export default useActiveFileManagement;
