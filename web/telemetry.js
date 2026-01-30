// ============================================================================
// TELEMETRY MODULE - Unified logging structure for frontend and backend
// ============================================================================

class TelemetryLogger {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.guestId = null;
        this.batchQueue = [];
        this.batchSize = 10;
        this.autoFlush = true;
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ========================================================================
    // UNIFIED LOG STRUCTURE
    // ========================================================================
    
    createAttemptLog(params) {
        const {
            skillId,
            questionId = null,
            difficulty,
            correct,
            timeSpent,
            hintUsed = false,
            attemptNumber = 1,
            engineDecisions = {},
            userAnswer = null,
            correctAnswer = null,
            errorTag = null
        } = params;

        return {
            // Session identifiers
            sessionId: this.sessionId,
            userId: this.userId,
            guestId: this.guestId,
            
            // Question identifiers
            skillId,
            questionId: questionId || this.hashQuestion(skillId, difficulty),
            difficulty,
            
            // Outcome
            correct: correct ? 1 : 0,
            timeSpent: Math.round(timeSpent * 100) / 100,
            hintUsed: hintUsed ? 1 : 0,
            attemptNumber,
            
            // Answers (optional, for debugging)
            userAnswer,
            correctAnswer,
            errorTag,
            
            // Engine decisions (for analysis)
            engineDecisions: {
                layerA: engineDecisions.layerA || null,
                layerB: engineDecisions.layerB || null,
                layerC: engineDecisions.layerC || null
            },
            
            // Metadata
            timestamp: Date.now(),
            clientTimestamp: new Date().toISOString()
        };
    }

    hashQuestion(skillId, difficulty) {
        return `${skillId}_d${difficulty}_${Date.now()}`;
    }

    // ========================================================================
    // LOGGING METHODS
    // ========================================================================
    
    logAttempt(params) {
        const log = this.createAttemptLog(params);
        
        // Store locally
        if (window.storageManager) {
            window.storageManager.appendQuestionLog(log);
        }
        
        // Add to batch queue for backend sync
        this.batchQueue.push(log);
        
        if (this.autoFlush && this.batchQueue.length >= this.batchSize) {
            this.flushBatch();
        }
        
        return log;
    }

    logSessionStart() {
        const log = {
            type: 'session_start',
            sessionId: this.sessionId,
            userId: this.userId,
            guestId: this.guestId,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            language: navigator.language
        };
        
        console.log('[Telemetry] Session started:', this.sessionId);
        return log;
    }

    logSessionEnd(summary) {
        const log = {
            type: 'session_end',
            sessionId: this.sessionId,
            userId: this.userId,
            guestId: this.guestId,
            summary,
            timestamp: Date.now()
        };
        
        // Flush any remaining logs
        this.flushBatch();
        
        console.log('[Telemetry] Session ended:', this.sessionId);
        return log;
    }

    // ========================================================================
    // BATCH OPERATIONS
    // ========================================================================
    
    async flushBatch() {
        if (this.batchQueue.length === 0) return;
        
        const batch = [...this.batchQueue];
        this.batchQueue = [];
        
        // Send to backend if API client is available
        if (window.apiClient && window.apiClient.isAuthenticated()) {
            try {
                await window.apiClient.batchLogAttempts(batch);
                console.log(`[Telemetry] Flushed ${batch.length} logs to backend`);
            } catch (error) {
                console.error('[Telemetry] Failed to flush batch:', error);
                // Re-queue failed logs
                this.batchQueue.unshift(...batch);
            }
        } else {
            console.log(`[Telemetry] ${batch.length} logs queued (offline mode)`);
        }
    }

    // ========================================================================
    // ANALYTICS QUERIES (Local)
    // ========================================================================
    
    getRecentAttempts(skillId = null, limit = 50) {
        if (!window.storageManager) return [];
        
        const logs = window.storageManager.loadQuestionLogs();
        
        let filtered = logs;
        if (skillId) {
            filtered = logs.filter(log => log.skillId === skillId);
        }
        
        return filtered.slice(-limit);
    }

    getSessionStats() {
        const sessionLogs = this.getRecentAttempts().filter(
            log => log.sessionId === this.sessionId
        );
        
        if (sessionLogs.length === 0) {
            return {
                questionsAttempted: 0,
                accuracy: 0,
                avgTime: 0,
                hintsUsed: 0
            };
        }
        
        const correct = sessionLogs.filter(log => log.correct === 1).length;
        const totalTime = sessionLogs.reduce((sum, log) => sum + log.timeSpent, 0);
        const hintsUsed = sessionLogs.filter(log => log.hintUsed === 1).length;
        
        return {
            questionsAttempted: sessionLogs.length,
            accuracy: (correct / sessionLogs.length * 100).toFixed(1),
            avgTime: (totalTime / sessionLogs.length).toFixed(1),
            hintsUsed
        };
    }

    getSkillBreakdown() {
        const logs = this.getRecentAttempts();
        const breakdown = {};
        
        for (const log of logs) {
            if (!breakdown[log.skillId]) {
                breakdown[log.skillId] = {
                    attempts: 0,
                    correct: 0,
                    totalTime: 0
                };
            }
            
            breakdown[log.skillId].attempts++;
            if (log.correct === 1) breakdown[log.skillId].correct++;
            breakdown[log.skillId].totalTime += log.timeSpent;
        }
        
        // Calculate derived metrics
        for (const skillId in breakdown) {
            const data = breakdown[skillId];
            data.accuracy = (data.correct / data.attempts * 100).toFixed(1);
            data.avgTime = (data.totalTime / data.attempts).toFixed(1);
        }
        
        return breakdown;
    }

    // ========================================================================
    // DEBUG & EXPORT
    // ========================================================================
    
    exportLogs(format = 'json') {
        const logs = this.getRecentAttempts(null, 500);
        
        if (format === 'csv') {
            return this.convertToCSV(logs);
        }
        
        return JSON.stringify(logs, null, 2);
    }

    convertToCSV(logs) {
        if (logs.length === 0) return '';
        
        const headers = [
            'timestamp', 'sessionId', 'skillId', 'difficulty', 
            'correct', 'timeSpent', 'hintUsed', 'attemptNumber'
        ];
        
        const rows = logs.map(log => 
            headers.map(h => log[h] || '').join(',')
        );
        
        return [headers.join(','), ...rows].join('\n');
    }

    printDebugInfo() {
        console.group('[Telemetry Debug]');
        console.log('Session ID:', this.sessionId);
        console.log('User ID:', this.userId);
        console.log('Guest ID:', this.guestId);
        console.log('Batch Queue Size:', this.batchQueue.length);
        console.log('Session Stats:', this.getSessionStats());
        console.log('Skill Breakdown:', this.getSkillBreakdown());
        console.groupEnd();
    }

    // ========================================================================
    // USER IDENTIFICATION
    // ========================================================================
    
    setUserId(userId) {
        this.userId = userId;
    }

    setGuestId(guestId) {
        this.guestId = guestId;
    }
}

// Initialize global telemetry logger
window.telemetryLogger = new TelemetryLogger();
