// ============================================================================
// BASELINE SCHEDULER - Deterministic skill selection with clear interface
// ============================================================================

/**
 * BaselineScheduler - Rule-based skill selection
 * Interface: getNextSkill(state) -> {skillId, mode, reason, targetDifficulty}
 * This can be replaced with RL policy in the future
 */
class BaselineScheduler {
    constructor() {
        this.weights = {
            dueReview: 0.70,      // 70% priority for due reviews
            weakSkill: 0.60,      // 60% priority for weak skills
            diversity: 0.50,      // 50% priority for variety
            exploration: 0.15     // 15% random exploration
        };
    }

    /**
     * Main interface: Select next skill to practice
     * 
     * @param {Object} state - User state features
     * @param {Object} state.mastery - Map of skillId -> mastery score (0-1)
     * @param {Array} state.dueReviews - Array of skillIds due for review
     * @param {String} state.lastSkillId - Last practiced skill
     * @param {Number} state.recentSwitchCount - Number of recent skill switches
     * @param {Number} state.sessionLengthMin - Current session length in minutes
     * @param {Number} state.fatigueScore - Fatigue score (0-1)
     * @param {Number} state.recentAccuracy - Recent accuracy (0-1)
     * @param {Number} state.currentStreak - Current correct streak
     * @param {Array} state.availableSkills - List of all available skillIds
     * 
     * @returns {Object} {skillId, mode, reason, targetDifficulty}
     */
    getNextSkill(state) {
        // Validate input
        if (!state || !state.availableSkills || state.availableSkills.length === 0) {
            throw new Error('Invalid state: availableSkills is required');
        }

        // 1. Check for due reviews (highest priority)
        if (state.dueReviews && state.dueReviews.length > 0) {
            if (Math.random() < this.weights.dueReview) {
                const skillId = this.selectFromDueReviews(state.dueReviews, state.mastery);
                return {
                    skillId,
                    mode: 'review',
                    reason: 'due_review',
                    targetDifficulty: this.getTargetDifficulty(state, skillId)
                };
            }
        }

        // 2. Check for weak skills (second priority)
        const weakSkills = this.identifyWeakSkills(state.mastery, state.availableSkills);
        if (weakSkills.length > 0) {
            if (Math.random() < this.weights.weakSkill) {
                const skillId = this.selectWeakestSkill(weakSkills);
                return {
                    skillId,
                    mode: 'practice',
                    reason: 'weak_skill',
                    targetDifficulty: this.getTargetDifficulty(state, skillId)
                };
            }
        }

        // 3. Check for diversity (avoid repeating same skill)
        if (state.lastSkillId && state.recentSwitchCount < 2) {
            if (Math.random() < this.weights.diversity) {
                const skillId = this.selectDifferentSkill(
                    state.availableSkills, 
                    state.lastSkillId
                );
                return {
                    skillId,
                    mode: 'practice',
                    reason: 'diversity',
                    targetDifficulty: this.getTargetDifficulty(state, skillId)
                };
            }
        }

        // 4. Exploration (random skill)
        if (Math.random() < this.weights.exploration) {
            const skillId = this.selectRandomSkill(state.availableSkills);
            return {
                skillId,
                mode: 'explore',
                reason: 'exploration',
                targetDifficulty: this.getTargetDifficulty(state, skillId)
            };
        }

        // 5. Fallback: balanced selection
        const skillId = this.selectBalancedSkill(state);
        return {
            skillId,
            mode: 'practice',
            reason: 'balanced',
            targetDifficulty: this.getTargetDifficulty(state, skillId)
        };
    }

    /**
     * Select from due reviews (prioritize lower mastery)
     */
    selectFromDueReviews(dueReviews, mastery = {}) {
        if (dueReviews.length === 1) {
            return dueReviews[0];
        }

        // Sort by mastery (lowest first)
        const sorted = dueReviews.slice().sort((a, b) => {
            const masteryA = mastery[a] || 0.5;
            const masteryB = mastery[b] || 0.5;
            return masteryA - masteryB;
        });

        return sorted[0];
    }

    /**
     * Identify weak skills (mastery < 0.4)
     */
    identifyWeakSkills(mastery = {}, availableSkills) {
        return availableSkills.filter(skillId => {
            const m = mastery[skillId] || 0;
            return m < 0.4;
        });
    }

    /**
     * Select weakest skill
     */
    selectWeakestSkill(weakSkills) {
        if (weakSkills.length === 1) {
            return weakSkills[0];
        }

        // Return random from weakest 3
        const count = Math.min(3, weakSkills.length);
        const index = Math.floor(Math.random() * count);
        return weakSkills[index];
    }

    /**
     * Select different skill from last
     */
    selectDifferentSkill(availableSkills, lastSkillId) {
        const different = availableSkills.filter(s => s !== lastSkillId);
        if (different.length === 0) {
            return availableSkills[0];
        }
        return different[Math.floor(Math.random() * different.length)];
    }

    /**
     * Select random skill
     */
    selectRandomSkill(availableSkills) {
        return availableSkills[Math.floor(Math.random() * availableSkills.length)];
    }

    /**
     * Balanced selection using scoring
     */
    selectBalancedSkill(state) {
        const scores = {};

        for (const skillId of state.availableSkills) {
            scores[skillId] = this.scoreSkill(skillId, state);
        }

        // Select skill with highest score
        let bestSkill = state.availableSkills[0];
        let bestScore = scores[bestSkill];

        for (const skillId of state.availableSkills) {
            if (scores[skillId] > bestScore) {
                bestScore = scores[skillId];
                bestSkill = skillId;
            }
        }

        return bestSkill;
    }

    /**
     * Score a skill for selection (higher = more important to practice)
     */
    scoreSkill(skillId, state) {
        let score = 0;

        const mastery = (state.mastery && state.mastery[skillId]) || 0;
        const isDue = state.dueReviews && state.dueReviews.includes(skillId);
        const isDifferent = skillId !== state.lastSkillId;
        const fatigued = state.fatigueScore > 0.6;

        // Learning opportunity (inverse mastery)
        score += (1 - mastery) * 2;

        // Review priority
        if (isDue) {
            score += 3;
        }

        // Diversity bonus
        if (isDifferent) {
            score += 1;
        }

        // Fatigue penalty for hard skills
        if (fatigued && mastery < 0.3) {
            score -= 1;
        }

        return score;
    }

    /**
     * Determine target difficulty based on state
     */
    getTargetDifficulty(state, skillId) {
        const mastery = (state.mastery && state.mastery[skillId]) || 0;
        const fatigued = state.fatigueScore > 0.6;

        // Map mastery to difficulty (1-5)
        let difficulty = Math.floor(mastery * 4) + 1; // 1-5

        // Cap difficulty if fatigued
        if (fatigued) {
            difficulty = Math.min(difficulty, 3);
        }

        // Ensure in valid range
        return Math.max(1, Math.min(5, difficulty));
    }

    /**
     * Compute state features from raw data
     * Helper function to create state object from user data
     */
    static computeState(userData) {
        const {
            mastery = {},
            reviewQueue = [],
            lastSkillId = null,
            sessionHistory = [],
            sessionStartTime = Date.now(),
            availableSkills = []
        } = userData;

        // Compute derived features
        const now = Date.now();
        const sessionLengthMin = (now - sessionStartTime) / 60000;

        // Due reviews
        const dueReviews = reviewQueue
            .filter(r => r.nextReview <= now)
            .map(r => r.skillId);

        // Recent switch count (last 5 questions)
        const recentHistory = sessionHistory.slice(-5);
        let switchCount = 0;
        for (let i = 1; i < recentHistory.length; i++) {
            if (recentHistory[i].skillId !== recentHistory[i-1].skillId) {
                switchCount++;
            }
        }

        // Recent accuracy (last 10 questions)
        const recentQuestions = sessionHistory.slice(-10);
        const recentCorrect = recentQuestions.filter(q => q.correct).length;
        const recentAccuracy = recentQuestions.length > 0 
            ? recentCorrect / recentQuestions.length 
            : 0.5;

        // Current streak
        let currentStreak = 0;
        for (let i = sessionHistory.length - 1; i >= 0; i--) {
            if (sessionHistory[i].correct) {
                currentStreak++;
            } else {
                break;
            }
        }

        // Fatigue score (based on session length and recent accuracy)
        const lengthFatigue = Math.min(sessionLengthMin / 40, 1); // 40 min = full fatigue
        const accuracyFatigue = recentAccuracy < 0.6 ? 0.3 : 0;
        const fatigueScore = Math.min(lengthFatigue + accuracyFatigue, 1);

        return {
            mastery,
            dueReviews,
            lastSkillId,
            recentSwitchCount: switchCount,
            sessionLengthMin,
            fatigueScore,
            recentAccuracy,
            currentStreak,
            availableSkills
        };
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.BaselineScheduler = BaselineScheduler;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BaselineScheduler;
}
