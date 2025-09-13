// services/AutoSaveService.js - Enhanced Auto-save with persistent backend storage

import api from '../utils/api';
import React from 'react';


class AutoSaveService {
  constructor() {
    this.autoSaveInterval = null;
    this.isDirty = false;
    this.isAutoSaving = false;
    this.lastSaveTime = null;
    this.currentDraftKey = null;
    this.callbacks = {
      onAutoSave: null,
      onError: null,
      onStatusChange: null,
      onDraftRecovered: null
    };
    
    // Auto-save configuration
    this.config = {
      interval: 30000, // 30 seconds
      retryAttempts: 3,
      retryDelay: 5000, // 5 seconds
      maxLocalDrafts: 5, // Keep fewer in localStorage as backup
      storagePrefix: 'cci_backup_draft_'
    };
  }

  /**
   * Initialize auto-save for a form
   * @param {string} formId - Unique identifier for the form
   * @param {Function} getFormData - Function that returns current form data
   * @param {Object} options - Additional options
   * @param {Object} callbacks - Callback functions for events
   */
  initialize(formId, getFormData, options = {}, callbacks = {}) {
    this.formId = formId;
    this.getFormData = getFormData;
    this.options = { 
      draftType: 'case', 
      caseId: null, 
      title: '',
      ...options 
    };
    this.callbacks = { ...this.callbacks, ...callbacks };
    
    // Clear any existing interval
    this.stop();
    
    // Check for existing drafts on initialization
    this.checkForExistingDrafts();
    
    // Start auto-save
    this.start();
    
    // Set up beforeunload handler for emergency backup
    this.setupBeforeUnloadHandler();
    
    console.log(`AutoSave initialized for form: ${formId}`);
  }

  /**
   * Check for existing drafts and offer recovery
   */
  async checkForExistingDrafts() {
    try {
      const drafts = await this.getAvailableDrafts();
      
      if (drafts.length > 0) {
        const mostRecent = drafts[0];
        
        // Notify about available draft
        if (this.callbacks.onDraftRecovered) {
          this.callbacks.onDraftRecovered({
            available: true,
            drafts: drafts,
            mostRecent: mostRecent
          });
        }
      }
    } catch (error) {
      console.error('Error checking for existing drafts:', error);
    }
  }

  /**
   * Start auto-save timer
   */
  start() {
    if (this.autoSaveInterval) return;
    
    this.autoSaveInterval = setInterval(() => {
      if (this.isDirty && !this.isAutoSaving) {
        this.performAutoSave();
      }
    }, this.config.interval);
    
    this.notifyStatusChange('started');
  }

  /**
   * Stop auto-save timer
   */
  stop() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    
    this.notifyStatusChange('stopped');
  }

  /**
   * Mark form as dirty (needs saving)
   */
  markDirty() {
    this.isDirty = true;
    this.notifyStatusChange('dirty');
  }

  /**
   * Mark form as clean (saved)
   */
  markClean() {
    this.isDirty = false;
    this.currentDraftKey = null;
    this.notifyStatusChange('clean');
  }

  /**
   * Perform auto-save operation
   */
  async performAutoSave() {
    if (!this.formId || !this.getFormData || this.isAutoSaving) {
      return;
    }

    this.isAutoSaving = true;
    this.notifyStatusChange('saving');

    try {
      const formData = this.getFormData();
      
      // Save to localStorage as backup first
      this.saveBackupToStorage(formData);
      
      // Save to server (persistent storage)
      const result = await this.saveDraftToServer(formData);
      
      if (result.success) {
        this.currentDraftKey = result.draft_key;
        this.lastSaveTime = new Date(result.timestamp);
        this.isDirty = false;
        
        this.notifyStatusChange('saved');
        
        if (this.callbacks.onAutoSave) {
          this.callbacks.onAutoSave({
            success: true,
            timestamp: this.lastSaveTime,
            draftKey: this.currentDraftKey,
            data: formData
          });
        }
      } else {
        throw new Error(result.error || 'Auto-save failed');
      }
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      
      this.notifyStatusChange('error');
      
      if (this.callbacks.onError) {
        this.callbacks.onError({
          type: 'autosave',
          error: error.message,
          formData: this.getFormData()
        });
      }
      
      // Schedule retry
      this.scheduleRetry();
      
    } finally {
      this.isAutoSaving = false;
    }
  }

  /**
   * Save backup to localStorage (fallback)
   */
  saveBackupToStorage(formData) {
    try {
      const backupKey = `${this.config.storagePrefix}${this.formId}`;
      const backupData = {
        formId: this.formId,
        data: formData,
        timestamp: new Date().toISOString(),
        caseId: this.options.caseId,
        version: 1
      };
      
      localStorage.setItem(backupKey, JSON.stringify(backupData));
      
      // Clean up old backups
      this.cleanupOldBackups();
      
    } catch (error) {
      console.error('Failed to save backup to localStorage:', error);
    }
  }

  /**
   * Save draft to server (persistent storage)
   */
  async saveDraftToServer(formData) {
    const draftData = {
      case_id: this.options.caseId,
      form_data: formData,
      draft_type: this.options.draftType || 'case',
      title: this.options.title || this.generateDraftTitle()
    };
    
    const response = await api.post('/drafts/auto_save/', draftData);
    return response.data;
  }

  /**
   * Generate a default title for the draft
   */
  generateDraftTitle() {
    if (this.options.caseId) {
      return `Draft for Case ${this.options.caseId}`;
    }
    
    const now = new Date();
    return `New Case Draft - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }

  /**
   * Load draft from server
   */
  async loadDraftFromServer(draftKey = null, caseId = null) {
    try {
      let url = '/drafts/get_draft/';
      const params = new URLSearchParams();
      
      if (draftKey) {
        params.append('draft_key', draftKey);
      } else if (caseId) {
        params.append('case_id', caseId);
        params.append('draft_type', this.options.draftType || 'case');
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await api.get(url);
      return response.data.draft;
    } catch (error) {
      console.error('Failed to load draft from server:', error);
      return null;
    }
  }

  /**
   * Load backup from localStorage
   */
  loadBackupFromStorage() {
    try {
      const backupKey = `${this.config.storagePrefix}${this.formId}`;
      const stored = localStorage.getItem(backupKey);
      
      if (stored) {
        const backupData = JSON.parse(stored);
        return {
          source: 'local_backup',
          timestamp: backupData.timestamp,
          data: backupData.data,
          caseId: backupData.caseId
        };
      }
      
    } catch (error) {
      console.error('Failed to load backup from localStorage:', error);
    }
    
    return null;
  }

  /**
   * Get all available drafts (server + local backup)
   */
  async getAvailableDrafts() {
    const drafts = [];
    
    try {
      // Get server drafts
      const response = await api.get(`/drafts/list_user_drafts/?draft_type=${this.options.draftType || 'case'}&limit=10`);
      
      if (response.data.success && response.data.drafts) {
        drafts.push(...response.data.drafts.map(draft => ({
          source: 'server',
          id: draft.id,
          draft_key: draft.draft_key,
          title: draft.title,
          timestamp: draft.updated_at,
          data: draft.form_data,
          case_id: draft.case_id,
          is_auto_saved: draft.is_auto_saved,
          age_in_minutes: draft.age_in_minutes,
          is_recent: draft.is_recent
        })));
      }
    } catch (error) {
      console.error('Error loading server drafts:', error);
    }
    
    // Get local backup
    const localBackup = this.loadBackupFromStorage();
    if (localBackup) {
      drafts.push(localBackup);
    }
    
    // Sort by timestamp (newest first)
    return drafts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Load a specific draft
   */
  async loadDraft(draft) {
    try {
      if (draft.source === 'server') {
        return draft.data;
      } else if (draft.source === 'local_backup') {
        return draft.data;
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      throw error;
    }
    
    return null;
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draft) {
    try {
      if (draft.source === 'server') {
        await api.delete(`/drafts/${draft.id}/delete_draft/`);
      } else if (draft.source === 'local_backup') {
        const backupKey = `${this.config.storagePrefix}${this.formId}`;
        localStorage.removeItem(backupKey);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      throw error;
    }
  }

  /**
   * Save a manual draft (user-initiated)
   */
  async saveManualDraft(title, formData = null) {
    try {
      const data = formData || this.getFormData();
      
      const draftData = {
        title: title,
        form_data: data,
        draft_type: this.options.draftType || 'case',
        case_id: this.options.caseId
      };
      
      const response = await api.post('/drafts/save_manual_draft/', draftData);
      
      if (response.data.success) {
        return response.data.draft;
      } else {
        throw new Error(response.data.error || 'Failed to save manual draft');
      }
    } catch (error) {
      console.error('Error saving manual draft:', error);
      throw error;
    }
  }

  /**
   * Clean up old auto-saved drafts
   */
  async cleanupOldDrafts(daysOld = 7) {
    try {
      const response = await api.delete(`/drafts/cleanup_drafts/?days_old=${daysOld}`);
      return response.data;
    } catch (error) {
      console.error('Error cleaning up old drafts:', error);
      throw error;
    }
  }

  /**
   * Clean up old local backups
   */
  cleanupOldBackups() {
    try {
      const keys = Object.keys(localStorage);
      const backupKeys = keys
        .filter(key => key.startsWith(this.config.storagePrefix))
        .map(key => ({
          key,
          timestamp: this.getBackupTimestamp(key)
        }))
        .sort((a, b) => b.timestamp - a.timestamp);
      
      // Remove excess backups
      if (backupKeys.length > this.config.maxLocalDrafts) {
        const keysToRemove = backupKeys.slice(this.config.maxLocalDrafts);
        keysToRemove.forEach(({ key }) => {
          localStorage.removeItem(key);
        });
      }
      
    } catch (error) {
      console.error('Failed to cleanup old backups:', error);
    }
  }

  /**
   * Get backup timestamp from localStorage key
   */
  getBackupTimestamp(key) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        return new Date(data.timestamp).getTime();
      }
    } catch (error) {
      console.error('Error parsing backup timestamp:', error);
    }
    return 0;
  }

  /**
   * Force save current form data
   */
  async forceSave() {
    if (!this.getFormData) return false;
    
    try {
      await this.performAutoSave();
      return true;
    } catch (error) {
      console.error('Force save failed:', error);
      return false;
    }
  }

  /**
   * Setup beforeunload handler for emergency backup
   */
  setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', (event) => {
      if (this.isDirty) {
        // Emergency save to localStorage
        try {
          const formData = this.getFormData();
          this.saveBackupToStorage(formData);
        } catch (error) {
          console.error('Emergency backup failed:', error);
        }
        
        // Show warning
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    });
  }

  /**
   * Schedule retry for failed auto-save
   */
  scheduleRetry() {
    setTimeout(() => {
      if (this.isDirty && !this.isAutoSaving) {
        this.performAutoSave();
      }
    }, this.config.retryDelay);
  }

  /**
   * Notify status change
   */
  notifyStatusChange(status) {
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange({
        status,
        isDirty: this.isDirty,
        isAutoSaving: this.isAutoSaving,
        lastSaveTime: this.lastSaveTime,
        currentDraftKey: this.currentDraftKey
      });
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isDirty: this.isDirty,
      isAutoSaving: this.isAutoSaving,
      lastSaveTime: this.lastSaveTime,
      currentDraftKey: this.currentDraftKey,
      isActive: !!this.autoSaveInterval
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart with new interval if changed
    if (newConfig.interval && this.autoSaveInterval) {
      this.stop();
      this.start();
    }
  }

  /**
   * Update options (case_id, title, etc.)
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Clear current draft from server
   */
  async clearCurrentDraft() {
    if (this.currentDraftKey) {
      try {
        await api.delete(`/drafts/clear_auto_save/?draft_key=${this.currentDraftKey}`);
        this.currentDraftKey = null;
        return true;
      } catch (error) {
        console.error('Error clearing current draft:', error);
        return false;
      }
    }
    return true;
  }

  /**
   * Cleanup - call when component unmounts
   */
  cleanup() {
    this.stop();
    
    // Remove beforeunload handler
    window.removeEventListener('beforeunload', this.setupBeforeUnloadHandler);
    
    // Clear callbacks
    this.callbacks = {
      onAutoSave: null,
      onError: null,
      onStatusChange: null,
      onDraftRecovered: null
    };
  }
}

// Create singleton instance
const autoSaveService = new AutoSaveService();

export default autoSaveService;

// Named exports for specific functions
export {
  AutoSaveService
};

// React Hook for using AutoSave in components
export const useAutoSave = (formId, getFormData, options = {}) => {
  const [status, setStatus] = React.useState({
    isDirty: false,
    isAutoSaving: false,
    lastSaveTime: null,
    currentDraftKey: null,
    isActive: false
  });

  const [availableDrafts, setAvailableDrafts] = React.useState([]);
  const [showDraftRecovery, setShowDraftRecovery] = React.useState(false);

  React.useEffect(() => {
    if (formId && getFormData) {
      const callbacks = {
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
        },
        onAutoSave: options.onAutoSave,
        onError: options.onError,
        onDraftRecovered: (draftInfo) => {
          if (draftInfo.available) {
            setAvailableDrafts(draftInfo.drafts);
            setShowDraftRecovery(true);
            
            if (options.onDraftRecovered) {
              options.onDraftRecovered(draftInfo);
            }
          }
        }
      };

      autoSaveService.initialize(formId, getFormData, options, callbacks);

      return () => {
        autoSaveService.cleanup();
      };
    }
  }, [formId, getFormData,options]);

  return {
    ...status,
    availableDrafts,
    showDraftRecovery,
    setShowDraftRecovery,
    markDirty: () => autoSaveService.markDirty(),
    markClean: () => autoSaveService.markClean(),
    forceSave: () => autoSaveService.forceSave(),
    getAvailableDrafts: () => autoSaveService.getAvailableDrafts(),
    loadDraft: (draft) => autoSaveService.loadDraft(draft),
    deleteDraft: (draft) => autoSaveService.deleteDraft(draft),
    saveManualDraft: (title, formData) => autoSaveService.saveManualDraft(title, formData),
    clearCurrentDraft: () => autoSaveService.clearCurrentDraft(),
    updateOptions: (newOptions) => autoSaveService.updateOptions(newOptions),
    cleanupOldDrafts: (daysOld) => autoSaveService.cleanupOldDrafts(daysOld)
  };
};