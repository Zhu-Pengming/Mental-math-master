// ============================================================================
// LAYER A: DIFFICULTY ADJUSTMENT ENGINE
// Thompson Sampling Bandit with Contextual Bonuses
// ============================================================================

class DifficultyAdjustmentEngine {
    constructor() {
        this.arms = this.loadArms();
        this.explorationRate = 0.15; // 15% exploration
    }

    loadArms() {
        return window.storageManager ? 
            window.storageManager.loadDifficultyArms() : {};
    }

    saveArms() {
        if (window.storageManager) {
            window.storageManager.saveDifficultyArms(this.arms);
        }
    }

    // ========================================================================
    // MINIMAL LOGGING STRUCTURE (per question)
    // ========================================================================
    
    createQuestionLog(skillId, difficulty, correct, responseTimeSec, hintUsed, attemptCount) {
        return {
            timestamp: Date.now(),
            skillId,
            difficulty,
            correct: correct ? 1 : 0,
            responseTimeSec,
            hintUsed: hintUsed ? 1 : 0,
            attemptCount
        };
    }

    // ========================================================================
    // THOMPSON SAMPLING WITH CONTEXT
    // ========================================================================
    
    initializeArm(skillId, difficulty) {
        const key = `${skillId}_d${difficulty}`;
        if (!this.arms[key]) {
            this.arms[key] = {
                alpha: 1, // success pseudo-count (Beta distribution)
                beta: 1,  // failure pseudo-count
                pulls: 0,
                successes: 0,
                avgTime: 0,
                lastPulled: 0
            };
        }
        return this.arms[key];
    }

    selectDifficulty(skillId, context) {
        const difficulties = [1, 2, 3, 4, 5];
        
        // Calculate difficulty bonus from context
        const difficultyBonus = this.calculateContextBonus(context);
        
        // Exploration: random selection with constraints
        if (Math.random() < this.explorationRate) {
            return this.constrainedRandomDifficulty(difficulties, context, difficultyBonus);
        }
        
        // Exploitation: Thompson Sampling
        let bestDifficulty = 3;
        let bestScore = -Infinity;
        
        for (const diff of difficulties) {
            const arm = this.initializeArm(skillId, diff);
            
            // Sample from Beta distribution
            const sample = this.sampleBeta(arm.alpha, arm.beta);
            
            // Apply context bonus
            const bonus = this.getContextBonusForDifficulty(diff, context, difficultyBonus);
            const finalScore = sample + bonus;
            
            if (finalScore > bestScore) {
                bestScore = finalScore;
                bestDifficulty = diff;
            }
        }
        
        return bestDifficulty;
    }

    calculateContextBonus(context) {
        let bonus = 0;
        
        // Recent 5 questions accuracy adjustment
        if (context.recentAccuracy > 0.85) {
            bonus += 1; // Increase difficulty
        } else if (context.recentAccuracy < 0.6) {
            bonus -= 1; // Decrease difficulty
        }
        
        // Fatigue adjustment
        if (context.fatigueHigh) {
            bonus -= 1; // Cap difficulty when fatigued
        }
        
        // Hint usage adjustment
        if (context.hintUsedRecently > 2) {
            bonus -= 1; // Lower difficulty if using many hints
        }
        
        return bonus;
    }

    getContextBonusForDifficulty(difficulty, context, difficultyBonus) {
        let bonus = 0;
        
        // Apply the calculated bonus to appropriate difficulties
        if (difficultyBonus > 0 && difficulty > context.currentDifficulty) {
            bonus += 0.3; // Encourage harder
        } else if (difficultyBonus < 0 && difficulty < context.currentDifficulty) {
            bonus += 0.3; // Encourage easier
        }
        
        // Fatigue penalty for high difficulty
        if (context.fatigueHigh && difficulty >= 4) {
            bonus -= 0.2;
        }
        
        // Recent errors penalty
        if (context.recentErrors > 2 && difficulty > context.currentDifficulty) {
            bonus -= 0.3;
        }
        
        // Streak bonus
        if (context.streak > 3 && difficulty === context.currentDifficulty + 1) {
            bonus += 0.2;
        }
        
        return bonus;
    }

    constrainedRandomDifficulty(difficulties, context, difficultyBonus) {
        // Don't jump more than 1 level from current
        const currentDiff = context.currentDifficulty || 3;
        const targetDiff = Math.max(1, Math.min(5, currentDiff + difficultyBonus));
        
        const constrained = difficulties.filter(d => 
            Math.abs(d - targetDiff) <= 1
        );
        
        return constrained[Math.floor(Math.random() * constrained.length)] || targetDiff;
    }

    // Simple Beta distribution sampler
    sampleBeta(alpha, beta) {
        const mean = alpha / (alpha + beta);
        const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
        const noise = (Math.random() - 0.5) * Math.sqrt(variance) * 3;
        return Math.max(0, Math.min(1, mean + noise));
    }

    // ========================================================================
    // UPDATE ARM (Binary Success/Failure)
    // ========================================================================
    
    updateArm(skillId, difficulty, correct, responseTimeSec) {
        const key = `${skillId}_d${difficulty}`;
        const arm = this.initializeArm(skillId, difficulty);
        
        arm.pulls++;
        
        if (correct) {
            arm.successes++;
            arm.alpha++; // Increase success count
        } else {
            arm.beta++; // Increase failure count
        }
        
        // Update average time
        arm.avgTime = ((arm.avgTime * (arm.pulls - 1)) + responseTimeSec) / arm.pulls;
        arm.lastPulled = Date.now();
        
        this.saveArms();
    }

    // ========================================================================
    // HINT STRATEGY
    // ========================================================================
    
    shouldShowHint(context, attemptNumber, timeSpent) {
        // Show hint if struggling
        if (context.recentErrors >= 2 && attemptNumber === 1) return true;
        if (timeSpent > 15 && attemptNumber === 1) return true;
        if (attemptNumber >= 2) return true; // Always show on retry
        
        // Show hint if low recent accuracy
        if (context.recentAccuracy < 0.5) return Math.random() < 0.5;
        
        return false;
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================
    
    getArmStatistics(skillId) {
        const stats = [];
        for (let diff = 1; diff <= 5; diff++) {
            const key = `${skillId}_d${diff}`;
            const arm = this.arms[key];
            if (arm && arm.pulls > 0) {
                stats.push({
                    difficulty: diff,
                    pulls: arm.pulls,
                    successRate: arm.successes / arm.pulls,
                    avgTime: arm.avgTime,
                    confidence: arm.alpha + arm.beta // Higher = more data
                });
            }
        }
        return stats;
    }

    reset() {
        this.arms = {};
        if (window.storageManager) {
            window.storageManager.saveDifficultyArms({});
        }
    }
}

// Export for use in main engine
window.DifficultyAdjustmentEngine = DifficultyAdjustmentEngine;
