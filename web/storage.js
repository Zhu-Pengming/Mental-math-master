// ============================================================================
// STORAGE MODULE - Unified data persistence with version migration
// ============================================================================

class StorageManager {
    constructor() {
        this.version = '2.0';
        this.storageKeys = {
            profile: 'mathMasterProfile_v2',
            questionLogs: 'questionLogs',
            difficultyArms: 'difficultyArms',
            reviewQueue: 'reviewQueue',
            skillMastery: 'skillMastery',
            errorPatterns: 'errorPatterns',
            explanationArms: 'explanationArms',
            errorHistory: 'errorHistory',
            storageVersion: 'storageVersion'
        };
        
        this.migrateIfNeeded();
    }

    // ========================================================================
    // VERSION MIGRATION
    // ========================================================================
    
    migrateIfNeeded() {
        const currentVersion = localStorage.getItem(this.storageKeys.storageVersion);
        
        if (!currentVersion) {
            // First time or legacy data
            this.migrateLegacyData();
            localStorage.setItem(this.storageKeys.storageVersion, this.version);
        } else if (currentVersion !== this.version) {
            // Future migrations can be added here
            console.log(`Migrating from ${currentVersion} to ${this.version}`);
            localStorage.setItem(this.storageKeys.storageVersion, this.version);
        }
    }

    migrateLegacyData() {
        // Migrate from old v1 profile to v2 if exists
        const oldProfile = localStorage.getItem('mathMasterProfile');
        if (oldProfile && !localStorage.getItem(this.storageKeys.profile)) {
            try {
                const parsed = JSON.parse(oldProfile);
                // Keep only essential fields
                const newProfile = {
                    userId: parsed.userId || this.generateUserId(),
                    createdAt: parsed.createdAt || Date.now(),
                    totalSessions: parsed.totalSessions || 0,
                    totalQuestions: parsed.totalQuestions || 0,
                    preferences: parsed.preferences || {
                        targetAccuracy: 0.75,
                        maxDifficulty: 5,
                        hintPreference: 'adaptive'
                    }
                };
                localStorage.setItem(this.storageKeys.profile, JSON.stringify(newProfile));
                
                // Migrate skill mastery if exists
                if (parsed.skillMastery) {
                    localStorage.setItem(this.storageKeys.skillMastery, JSON.stringify(parsed.skillMastery));
                }
            } catch (e) {
                console.error('Migration failed:', e);
            }
        }
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ========================================================================
    // GENERIC STORAGE OPERATIONS
    // ========================================================================
    
    get(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (e) {
            console.error(`Error reading ${key}:`, e);
            return defaultValue;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error writing ${key}:`, e);
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error removing ${key}:`, e);
            return false;
        }
    }

    // ========================================================================
    // PROFILE OPERATIONS
    // ========================================================================
    
    loadProfile() {
        return this.get(this.storageKeys.profile, {
            userId: this.generateUserId(),
            createdAt: Date.now(),
            totalSessions: 0,
            totalQuestions: 0,
            preferences: {
                targetAccuracy: 0.75,
                maxDifficulty: 5,
                hintPreference: 'adaptive'
            }
        });
    }

    saveProfile(profile) {
        return this.set(this.storageKeys.profile, profile);
    }

    // ========================================================================
    // QUESTION LOGS (with auto-pruning)
    // ========================================================================
    
    loadQuestionLogs(maxRecords = 500) {
        const logs = this.get(this.storageKeys.questionLogs, []);
        return logs.slice(-maxRecords);
    }

    saveQuestionLogs(logs, maxRecords = 500) {
        const pruned = logs.slice(-maxRecords);
        return this.set(this.storageKeys.questionLogs, pruned);
    }

    appendQuestionLog(log, maxRecords = 500) {
        const logs = this.loadQuestionLogs(maxRecords);
        logs.push(log);
        return this.saveQuestionLogs(logs, maxRecords);
    }

    // ========================================================================
    // LAYER-SPECIFIC STORAGE
    // ========================================================================
    
    // Layer A: Difficulty Arms
    loadDifficultyArms() {
        return this.get(this.storageKeys.difficultyArms, {});
    }

    saveDifficultyArms(arms) {
        return this.set(this.storageKeys.difficultyArms, arms);
    }

    // Layer B: Review Queue & Mastery
    loadReviewQueue() {
        return this.get(this.storageKeys.reviewQueue, []);
    }

    saveReviewQueue(queue) {
        return this.set(this.storageKeys.reviewQueue, queue);
    }

    loadSkillMastery() {
        return this.get(this.storageKeys.skillMastery, {});
    }

    saveSkillMastery(mastery) {
        return this.set(this.storageKeys.skillMastery, mastery);
    }

    // Layer C: Error Patterns & Explanation Arms
    loadErrorPatterns() {
        return this.get(this.storageKeys.errorPatterns, {});
    }

    saveErrorPatterns(patterns) {
        return this.set(this.storageKeys.errorPatterns, patterns);
    }

    loadExplanationArms() {
        return this.get(this.storageKeys.explanationArms, {});
    }

    saveExplanationArms(arms) {
        return this.set(this.storageKeys.explanationArms, arms);
    }

    loadErrorHistory(maxRecords = 200) {
        const history = this.get(this.storageKeys.errorHistory, []);
        return history.slice(-maxRecords);
    }

    saveErrorHistory(history, maxRecords = 200) {
        const pruned = history.slice(-maxRecords);
        return this.set(this.storageKeys.errorHistory, pruned);
    }

    // ========================================================================
    // BULK OPERATIONS
    // ========================================================================
    
    exportAllData() {
        const data = {};
        for (const [name, key] of Object.entries(this.storageKeys)) {
            data[name] = this.get(key);
        }
        return data;
    }

    importAllData(data) {
        for (const [name, value] of Object.entries(data)) {
            const key = this.storageKeys[name];
            if (key && value !== null && value !== undefined) {
                this.set(key, value);
            }
        }
    }

    clearAllData() {
        for (const key of Object.values(this.storageKeys)) {
            this.remove(key);
        }
    }

    // ========================================================================
    // STORAGE STATISTICS
    // ========================================================================
    
    getStorageStats() {
        let totalSize = 0;
        const stats = {};
        
        for (const [name, key] of Object.entries(this.storageKeys)) {
            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            stats[name] = {
                size,
                sizeKB: (size / 1024).toFixed(2)
            };
            totalSize += size;
        }
        
        return {
            items: stats,
            totalSize,
            totalSizeKB: (totalSize / 1024).toFixed(2),
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
    }
}

// Initialize global storage manager
window.storageManager = new StorageManager();
