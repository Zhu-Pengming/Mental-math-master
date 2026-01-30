// ============================================================================
// ADAPTIVE LEARNING ENGINE V2 - Three-Layer Architecture
// Orchestrates: Difficulty Adjustment, Skill Scheduling, AI Explanation
// ============================================================================

class AdaptiveLearningEngineV2 {
    constructor() {
        // Initialize three layers
        this.layerA = new DifficultyAdjustmentEngine();
        this.layerB = new SkillSchedulingEngine();
        this.layerC = new ExplanationEngine();
        
        // User profile and session data
        this.userProfile = this.loadProfile();
        this.sessionId = 'session_' + Date.now();
        this.sessionData = {
            startTime: Date.now(),
            questionsAttempted: 0,
            correctAnswers: 0,
            totalTime: 0,
            recentQuestions: [], // Last 5 questions for context
            currentStreak: 0,
            recentErrors: 0
        };
        
        // Question logs (minimal structure)
        this.questionLogs = this.loadQuestionLogs();
        
        // Ensure profile is saved with correct initial values
        this.saveProfile();
    }

    // ========================================================================
    // PROFILE MANAGEMENT
    // ========================================================================
    
    loadProfile() {
        let profile;
        if (window.storageManager) {
            profile = window.storageManager.loadProfile();
        } else {
            profile = {
                userId: this.generateUserId(),
                createdAt: Date.now(),
                totalSessions: 0,
                totalQuestions: 0,
                totalCorrect: 0,
                preferences: {
                    targetAccuracy: 0.75,
                    maxDifficulty: 5,
                    hintPreference: 'adaptive'
                }
            };
        }
        
        // Ensure totalCorrect is always a number
        if (typeof profile.totalCorrect !== 'number') {
            profile.totalCorrect = 0;
        }
        if (typeof profile.totalQuestions !== 'number') {
            profile.totalQuestions = 0;
        }
        
        return profile;
    }

    saveProfile() {
        if (window.storageManager) {
            window.storageManager.saveProfile(this.userProfile);
        }
    }

    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    loadQuestionLogs() {
        if (window.storageManager) {
            return window.storageManager.loadQuestionLogs(500);
        }
        return [];
    }

    saveQuestionLogs() {
        if (window.storageManager) {
            window.storageManager.saveQuestionLogs(this.questionLogs, 500);
        }
    }

    // ========================================================================
    // LAYER A: DIFFICULTY SELECTION
    // ========================================================================
    
    selectDifficulty(skillId) {
        const context = this.buildDifficultyContext(skillId);
        return this.layerA.selectDifficulty(skillId, context);
    }

    buildDifficultyContext(skillId) {
        // Get recent performance for this skill
        const recentForSkill = this.questionLogs
            .filter(log => log.skillId === skillId)
            .slice(-5);
        
        const recentAccuracy = recentForSkill.length > 0
            ? recentForSkill.filter(log => log.correct === 1).length / recentForSkill.length
            : 0.5;
        
        const recentErrors = this.sessionData.recentQuestions
            .slice(-3)
            .filter(q => q.correct === 0).length;
        
        const hintUsedRecently = this.sessionData.recentQuestions
            .slice(-5)
            .filter(q => q.hintUsed === 1).length;
        
        const currentDifficulty = recentForSkill.length > 0
            ? recentForSkill[recentForSkill.length - 1].difficulty
            : 3;
        
        return {
            recentAccuracy,
            recentErrors,
            hintUsedRecently,
            currentDifficulty,
            streak: this.sessionData.currentStreak,
            fatigueHigh: this.calculateFatigue() > 0.6
        };
    }

    // ========================================================================
    // LAYER B: SKILL SELECTION
    // ========================================================================
    
    selectNextSkill(availableSkills) {
        const sessionData = {
            sessionLengthMin: (Date.now() - this.sessionData.startTime) / (1000 * 60),
            fatigueScore: this.calculateFatigue(),
            recentAccuracy: this.getRecentAccuracy(),
            currentStreak: this.sessionData.currentStreak
        };
        
        return this.layerB.selectNextSkill(availableSkills, sessionData);
    }

    shouldInsertReview() {
        return this.layerB.shouldInsertReview(this.sessionData.questionsAttempted);
    }

    getDueReviews() {
        return this.layerB.getDueReviews();
    }

    // ========================================================================
    // LAYER C: EXPLANATION & FEEDBACK
    // ========================================================================
    
    generateFeedback(skillId, question, correctAnswer, userAnswer, difficulty, timeSpent, hintUsed, hint) {
        return this.layerC.generateFeedback(
            skillId, 
            question, 
            correctAnswer, 
            userAnswer, 
            difficulty, 
            timeSpent, 
            hintUsed, 
            hint
        );
    }

    shouldShowHint(skillId, attemptNumber, timeSpent) {
        const context = this.buildDifficultyContext(skillId);
        return this.layerA.shouldShowHint(context, attemptNumber, timeSpent);
    }

    // ========================================================================
    // LOGGING & UPDATES
    // ========================================================================
    
    logAttempt(skillId, difficulty, correct, timeSpent, hintUsed = false, attemptCount = 1, errorTag = null, explanationStyle = null) {
        // Create AttemptEvent using unified schema
        const event = window.AttemptEvent.create({
            userId: this.userProfile.userId,
            sessionId: this.sessionId || 'session_' + Date.now(),
            skillId,
            difficulty,
            correct,
            responseTimeSec: timeSpent,
            hintUsed,
            attemptCount,
            errorTag: correct ? null : errorTag,
            explanationStyle: correct ? null : explanationStyle
        });
        
        this.questionLogs.push(event);
        this.saveQuestionLogs();
        
        // Log to telemetry system
        if (window.telemetryLogger) {
            window.telemetryLogger.logAttempt({
                skillId,
                difficulty,
                correct,
                timeSpent,
                hintUsed,
                attemptNumber: attemptCount,
                engineDecisions: {
                    layerA: { difficulty },
                    layerB: { mastery: this.layerB.getMastery(skillId) },
                    layerC: null
                }
            });
        }
        
        // Update session data
        this.sessionData.questionsAttempted++;
        if (correct) {
            this.sessionData.correctAnswers++;
            this.sessionData.currentStreak++;
            this.sessionData.recentErrors = 0;
        } else {
            this.sessionData.currentStreak = 0;
            this.sessionData.recentErrors++;
        }
        this.sessionData.totalTime += timeSpent;
        
        // Add to recent questions
        this.sessionData.recentQuestions.push({
            skillId,
            difficulty,
            correct: correct ? 1 : 0,
            timeSpent,
            hintUsed: hintUsed ? 1 : 0
        });
        if (this.sessionData.recentQuestions.length > 5) {
            this.sessionData.recentQuestions.shift();
        }
        
        // Update Layer A (Difficulty Bandit)
        this.layerA.updateArm(skillId, difficulty, correct, timeSpent);
        
        // Update Layer B (Skill Mastery & Spaced Repetition)
        this.layerB.updateMastery(skillId, correct, difficulty);
        this.layerB.updateSpacedRepetition(skillId, correct);
        this.layerB.updateSessionTracking(skillId);
        
        // Update profile
        this.userProfile.totalQuestions++;
        if (correct) {
            this.userProfile.totalCorrect++;
        }
        this.saveProfile();
        
        return {
            sessionAccuracy: this.sessionData.correctAnswers / this.sessionData.questionsAttempted,
            currentStreak: this.sessionData.currentStreak,
            mastery: this.layerB.getMastery(skillId)
        };
    }

    updateExplanationEffectiveness(skillId, errorTag, styleUsed, wasEffective) {
        this.layerC.updateExplanationEffectiveness(skillId, errorTag, styleUsed, wasEffective);
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================
    
    calculateFatigue() {
        const sessionDuration = (Date.now() - this.sessionData.startTime) / (1000 * 60);
        const questionsAttempted = this.sessionData.questionsAttempted;
        
        let fatigue = 0;
        if (sessionDuration > 20) fatigue += 0.3;
        if (sessionDuration > 40) fatigue += 0.3;
        if (questionsAttempted > 30) fatigue += 0.2;
        if (questionsAttempted > 50) fatigue += 0.2;
        
        return Math.min(1.0, fatigue);
    }

    getRecentAccuracy() {
        if (this.sessionData.recentQuestions.length === 0) return 0.5;
        
        const correct = this.sessionData.recentQuestions.filter(q => q.correct === 1).length;
        return correct / this.sessionData.recentQuestions.length;
    }

    // ========================================================================
    // ANALYTICS & INSIGHTS
    // ========================================================================
    
    getInsights() {
        // Ensure values are numbers
        const totalCorrect = Number(this.userProfile.totalCorrect) || 0;
        const totalQuestions = Number(this.userProfile.totalQuestions) || 0;
        
        const insights = {
            totalQuestions: totalQuestions,
            overallAccuracy: totalQuestions > 0 
                ? totalCorrect / totalQuestions 
                : 0,
            sessionQuestions: this.sessionData.questionsAttempted,
            sessionAccuracy: this.sessionData.questionsAttempted > 0
                ? (this.sessionData.correctAnswers / this.sessionData.questionsAttempted * 100).toFixed(1)
                : 0,
            currentStreak: this.sessionData.currentStreak,
            averageTime: this.sessionData.questionsAttempted > 0
                ? (this.sessionData.totalTime / this.sessionData.questionsAttempted).toFixed(1)
                : 0,
            fatigueScore: (this.calculateFatigue() * 100).toFixed(0),
            
            // Layer B insights
            dueReviews: this.layerB.getDueReviews().length,
            weakestSkills: this.layerB.getWeakestSkills(3),
            
            // Layer C insights
            commonErrors: this.layerC.getMostCommonErrors(5),
            
            recommendations: []
        };
        
        // Generate recommendations
        const sessionAcc = parseFloat(insights.sessionAccuracy);
        if (sessionAcc > 85) {
            insights.recommendations.push({
                type: 'challenge',
                message: 'You\'re doing great! The system will increase difficulty automatically.'
            });
        }
        
        
        if (insights.dueReviews > 0) {
            insights.recommendations.push({
                type: 'review',
                message: `You have ${insights.dueReviews} skill(s) due for review to maintain mastery.`
            });
        }
        
        if (this.sessionData.questionsAttempted > 40) {
            insights.recommendations.push({
                type: 'rest',
                message: 'Great session! Consider taking a break to avoid fatigue.'
            });
        }
        
        return insights;
    }

    getProgressData() {
        const last30 = this.questionLogs.slice(-30);
        
        return {
            accuracyOverTime: last30.map((log, i) => ({
                x: i + 1,
                y: log.correct
            })),
            timeOverTime: last30.map((log, i) => ({
                x: i + 1,
                y: log.responseTimeSec
            })),
            difficultyOverTime: last30.map((log, i) => ({
                x: i + 1,
                y: log.difficulty
            }))
        };
    }

    getSkillMasteryData() {
        const allSkills = ['b1', 'b2', 'b3', 'm1', 'm2', 'a1', 'a2'];
        return allSkills.map(skillId => ({
            skillId,
            mastery: this.layerB.getMastery(skillId),
            attempts: this.questionLogs.filter(log => log.skillId === skillId).length
        }));
    }

    getLayerBStats() {
        return this.layerB.getSessionStats();
    }

    getDifficultyStatistics(skillId) {
        return this.layerA.getArmStatistics(skillId);
    }

    getErrorAnalytics(skillId) {
        return this.layerC.getErrorAnalytics(skillId);
    }

    // ========================================================================
    // SESSION MANAGEMENT
    // ========================================================================
    
    startSession() {
        this.sessionData = {
            startTime: Date.now(),
            questionsAttempted: 0,
            correctAnswers: 0,
            totalTime: 0,
            recentQuestions: [],
            currentStreak: 0,
            recentErrors: 0
        };
        
        this.userProfile.totalSessions++;
        this.saveProfile();
        
        // Log session start
        if (window.telemetryLogger) {
            window.telemetryLogger.setUserId(this.userProfile.userId);
            window.telemetryLogger.logSessionStart();
        }
    }

    endSession() {
        const duration = (Date.now() - this.sessionData.startTime) / (1000 * 60);
        const summary = {
            duration: duration.toFixed(1),
            questionsAttempted: this.sessionData.questionsAttempted,
            accuracy: this.sessionData.questionsAttempted > 0 
                ? (this.sessionData.correctAnswers / this.sessionData.questionsAttempted * 100).toFixed(1)
                : 0,
            avgTime: this.sessionData.questionsAttempted > 0
                ? (this.sessionData.totalTime / this.sessionData.questionsAttempted).toFixed(1)
                : 0,
            bestStreak: this.sessionData.currentStreak
        };
        
        // Log session end
        if (window.telemetryLogger) {
            window.telemetryLogger.logSessionEnd(summary);
        }
        
        return summary;
    }

    resetProgress() {
        if (confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
            // Reset all layers
            this.layerA.reset();
            this.layerB.reset();
            this.layerC.reset();
            
            // Clear all storage
            if (window.storageManager) {
                window.storageManager.clearAllData();
            }
            
            this.userProfile = this.loadProfile();
            this.questionLogs = [];
            this.sessionData = {
                startTime: Date.now(),
                questionsAttempted: 0,
                correctAnswers: 0,
                totalTime: 0,
                recentQuestions: [],
                currentStreak: 0,
                recentErrors: 0
            };
            
            return true;
        }
        return false;
    }

    // ========================================================================
    // BACKWARD COMPATIBILITY (for existing app.js)
    // ========================================================================
    
    getCurrentState(lessonId) {
        const context = this.buildDifficultyContext(lessonId);
        return {
            lessonId,
            recentAccuracy: context.recentAccuracy,
            streak: context.streak,
            recentErrors: context.recentErrors,
            skillMastery: this.layerB.getMastery(lessonId),
            fatigueScore: this.calculateFatigue()
        };
    }
}

// Initialize global adaptive engine V2
window.adaptiveEngine = new AdaptiveLearningEngineV2();
