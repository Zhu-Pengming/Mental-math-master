// ============================================================================
// LAYER B: SKILL SCHEDULING ENGINE
// Curriculum Scheduler with Spaced Repetition + RL-ready Architecture
// ============================================================================

class SkillSchedulingEngine {
    constructor() {
        this.reviewQueue = this.loadReviewQueue();
        this.skillMastery = this.loadSkillMastery();
        this.baselineWeight = 0.85; // 85% baseline, 15% RL exploration
        this.lastSkillId = null;
        this.skillSwitchCount = 0;
    }

    loadReviewQueue() {
        return window.storageManager ? 
            window.storageManager.loadReviewQueue() : [];
    }

    loadSkillMastery() {
        return window.storageManager ? 
            window.storageManager.loadSkillMastery() : {};
    }

    saveReviewQueue() {
        if (window.storageManager) {
            window.storageManager.saveReviewQueue(this.reviewQueue);
        }
    }

    saveSkillMastery() {
        if (window.storageManager) {
            window.storageManager.saveSkillMastery(this.skillMastery);
        }
    }

    // ========================================================================
    // STATE REPRESENTATION (Curriculum Level)
    // ========================================================================
    
    getCurriculumState(sessionData) {
        const masteryValues = Object.values(this.skillMastery);
        const dueReviews = this.getDueReviews();
        
        return {
            // Mastery summary
            minMastery: masteryValues.length > 0 ? Math.min(...masteryValues) : 0,
            meanMastery: masteryValues.length > 0 
                ? masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length 
                : 0,
            maxMastery: masteryValues.length > 0 ? Math.max(...masteryValues) : 0,
            
            // Weakest skills
            weakestSkillId: this.getWeakestSkill(),
            weakestSkills: this.getWeakestSkills(3),
            
            // Review queue
            dueCount: dueReviews.length,
            dueSkills: dueReviews.map(r => r.skillId),
            
            // Session context
            lastSkillId: this.lastSkillId,
            recentSkillSwitchCount: this.skillSwitchCount,
            sessionLengthMin: sessionData.sessionLengthMin || 0,
            fatigueScore: sessionData.fatigueScore || 0,
            
            // Recent performance
            recentAccuracy: sessionData.recentAccuracy || 0.5,
            currentStreak: sessionData.currentStreak || 0
        };
    }

    // ========================================================================
    // BASELINE POLICY (Safe, Rule-Based)
    // ========================================================================
    
    selectNextSkillBaseline(availableSkills, state) {
        // Priority 1: Urgent reviews (high priority due reviews)
        if (state.dueCount > 0) {
            const dueSkillsWithPriority = state.dueSkills
                .filter(s => availableSkills.includes(s))
                .map(s => ({ skillId: s, priority: this.getReviewPriority(s) }))
                .sort((a, b) => b.priority - a.priority);
            
            if (dueSkillsWithPriority.length > 0) {
                const topPriority = dueSkillsWithPriority[0];
                // Higher priority = higher chance to select
                const selectProb = topPriority.priority >= 5 ? 0.9 : 
                                  topPriority.priority >= 3 ? 0.7 : 0.5;
                if (Math.random() < selectProb) {
                    return { 
                        skillId: topPriority.skillId, 
                        reason: 'due_review',
                        mode: 'review',
                        confidence: selectProb
                    };
                }
            }
        }
        
        // Priority 2: Weakest skills (mastery < 0.4)
        const weakSkills = state.weakestSkills.filter(s => 
            availableSkills.includes(s.skillId) && s.mastery < 0.4
        );
        if (weakSkills.length > 0 && Math.random() < 0.6) {
            return { 
                skillId: weakSkills[0].skillId, 
                reason: 'weak_skill',
                mode: 'practice',
                confidence: 0.6
            };
        }
        
        // Priority 3: Diversity (avoid same skill repeatedly)
        if (state.lastSkillId && state.recentSkillSwitchCount < 2) {
            const otherSkills = availableSkills.filter(s => s !== state.lastSkillId);
            if (otherSkills.length > 0) {
                const randomSkill = otherSkills[Math.floor(Math.random() * otherSkills.length)];
                return { 
                    skillId: randomSkill, 
                    reason: 'diversity',
                    mode: 'learn',
                    confidence: 0.5
                };
            }
        }
        
        // Priority 4: Random from available
        const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
        return { 
            skillId: randomSkill, 
            reason: 'random',
            mode: 'learn',
            confidence: 0.3
        };
    }

    // ========================================================================
    // RL POLICY (Exploration - Future Enhancement)
    // ========================================================================
    
    selectNextSkillRL(availableSkills, state) {
        // For now, this is a placeholder for future RL implementation
        // It uses a simple scoring heuristic that can be replaced with a trained policy
        
        const scores = availableSkills.map(skillId => {
            let score = 0;
            
            // Reward low mastery (learning opportunity)
            const mastery = this.skillMastery[skillId] || 0;
            score += (1 - mastery) * 2;
            
            // Reward due reviews
            if (state.dueSkills.includes(skillId)) {
                score += 3;
            }
            
            // Reward diversity
            if (skillId !== state.lastSkillId) {
                score += 1;
            }
            
            // Penalize if fatigued and skill is hard
            if (state.fatigueScore > 0.6 && mastery < 0.3) {
                score -= 1;
            }
            
            return { skillId, score };
        });
        
        scores.sort((a, b) => b.score - a.score);
        return { skillId: scores[0].skillId, reason: 'rl_policy' };
    }

    // ========================================================================
    // HYBRID SELECTION (Baseline + RL Mix)
    // ========================================================================
    
    selectNextSkill(availableSkills, sessionData) {
        const state = this.getCurriculumState(sessionData);
        
        // Use baseline policy most of the time (safe)
        if (Math.random() < this.baselineWeight) {
            return this.selectNextSkillBaseline(availableSkills, state);
        } else {
            // Use RL policy for exploration
            return this.selectNextSkillRL(availableSkills, state);
        }
    }

    // ========================================================================
    // SPACED REPETITION (SM-2 Algorithm)
    // ========================================================================
    
    updateSpacedRepetition(skillId, correct) {
        let reviewItem = this.reviewQueue.find(r => r.skillId === skillId);
        
        if (!reviewItem) {
            reviewItem = {
                skillId,
                interval: 1, // days
                easeFactor: 2.5,
                nextReview: Date.now() + (24 * 60 * 60 * 1000),
                repetitions: 0
            };
            this.reviewQueue.push(reviewItem);
        }
        
        if (correct) {
            reviewItem.repetitions++;
            
            if (reviewItem.repetitions === 1) {
                reviewItem.interval = 1;
            } else if (reviewItem.repetitions === 2) {
                reviewItem.interval = 6;
            } else {
                reviewItem.interval = Math.round(reviewItem.interval * reviewItem.easeFactor);
            }
            
            reviewItem.easeFactor = Math.max(1.3, reviewItem.easeFactor + 0.1);
        } else {
            reviewItem.repetitions = 0;
            reviewItem.interval = 1;
            reviewItem.easeFactor = Math.max(1.3, reviewItem.easeFactor - 0.2);
        }
        
        reviewItem.nextReview = Date.now() + (reviewItem.interval * 24 * 60 * 60 * 1000);
        this.saveReviewQueue();
    }

    getDueReviews() {
        const now = Date.now();
        return this.reviewQueue
            .filter(r => r.nextReview <= now)
            .sort((a, b) => a.nextReview - b.nextReview);
    }

    getReviewPriority(skillId) {
        const reviewItem = this.reviewQueue.find(r => r.skillId === skillId);
        if (!reviewItem) return 0;
        
        const now = Date.now();
        const overdueDays = (now - reviewItem.nextReview) / (24 * 60 * 60 * 1000);
        const mastery = this.skillMastery[skillId] || 0;
        
        // Priority = urgency + importance
        let priority = 0;
        
        // Urgency: how overdue
        if (overdueDays > 5) priority += 3;
        else if (overdueDays > 2) priority += 2;
        else if (overdueDays > 0) priority += 1;
        
        // Importance: low mastery = more important
        if (mastery < 0.4) priority += 3;
        else if (mastery < 0.6) priority += 2;
        else if (mastery < 0.8) priority += 1;
        
        // Low ease factor = struggling skill
        if (reviewItem.easeFactor < 1.8) priority += 2;
        else if (reviewItem.easeFactor < 2.0) priority += 1;
        
        return priority;
    }

    shouldInsertReview(sessionQuestionsCount = 0) {
        const dueReviews = this.getDueReviews();
        if (dueReviews.length === 0) return false;
        
        // Intelligent insertion probability based on multiple factors
        let probability = 0;
        
        // Factor 1: Due count (more due = higher probability)
        if (dueReviews.length >= 5) probability += 0.5;
        else if (dueReviews.length >= 3) probability += 0.3;
        else probability += 0.2;
        
        // Factor 2: Session length (insert after 5+ new questions)
        if (sessionQuestionsCount >= 10) probability += 0.3;
        else if (sessionQuestionsCount >= 5) probability += 0.2;
        
        // Factor 3: Urgency (how overdue is the most urgent review)
        const now = Date.now();
        const mostUrgent = dueReviews[0];
        const overdueDays = (now - mostUrgent.nextReview) / (24 * 60 * 60 * 1000);
        if (overdueDays > 3) probability += 0.3;
        else if (overdueDays > 1) probability += 0.2;
        
        // Cap at 90% to maintain some randomness
        probability = Math.min(0.9, probability);
        
        return Math.random() < probability;
    }

    // ========================================================================
    // MASTERY TRACKING
    // ========================================================================
    
    updateMastery(skillId, correct, difficulty) {
        const currentMastery = this.skillMastery[skillId] || 0;
        
        // EWMA update with difficulty weighting
        const delta = correct 
            ? 0.05 * (difficulty / 3) 
            : -0.03;
        
        this.skillMastery[skillId] = Math.max(0, Math.min(1, currentMastery + delta));
        this.saveSkillMastery();
    }

    getMastery(skillId) {
        return this.skillMastery[skillId] || 0;
    }

    getWeakestSkill() {
        let weakest = null;
        let minMastery = 1;
        
        for (const [skillId, mastery] of Object.entries(this.skillMastery)) {
            if (mastery < minMastery) {
                minMastery = mastery;
                weakest = skillId;
            }
        }
        
        return weakest;
    }

    getWeakestSkills(n = 3) {
        return Object.entries(this.skillMastery)
            .map(([skillId, mastery]) => ({ skillId, mastery }))
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, n);
    }

    // ========================================================================
    // REWARD CALCULATION (Long-term Learning)
    // ========================================================================
    
    calculateReward(skillId, correct, wasReview, sessionData) {
        let reward = 0;
        
        // Mastery improvement
        const oldMastery = this.skillMastery[skillId] || 0;
        const masteryDelta = correct ? 0.05 : -0.03;
        reward += masteryDelta * 10; // Scale up
        
        // Review hit bonus (preventing forgetting)
        if (wasReview && correct) {
            reward += 1;
        }
        
        // Frustration penalty (consecutive errors leading to quit)
        if (!correct && sessionData.recentErrors > 3) {
            reward -= 1;
        }
        
        // Diversity bonus (moderate switching)
        if (skillId !== this.lastSkillId && this.skillSwitchCount < 5) {
            reward += 0.2;
        }
        
        return reward;
    }

    // ========================================================================
    // SESSION TRACKING
    // ========================================================================
    
    updateSessionTracking(skillId) {
        if (skillId !== this.lastSkillId) {
            this.skillSwitchCount++;
        } else {
            this.skillSwitchCount = 0;
        }
        this.lastSkillId = skillId;
    }

    getSessionStats() {
        const dueReviews = this.getDueReviews();
        const masteryValues = Object.values(this.skillMastery);
        
        return {
            dueReviewsCount: dueReviews.length,
            urgentReviews: dueReviews.filter(r => {
                const overdueDays = (Date.now() - r.nextReview) / (24 * 60 * 60 * 1000);
                return overdueDays > 2;
            }).length,
            avgMastery: masteryValues.length > 0 ? 
                masteryValues.reduce((a, b) => a + b, 0) / masteryValues.length : 0,
            skillsAbove70: masteryValues.filter(m => m >= 0.7).length,
            skillsBelow40: masteryValues.filter(m => m < 0.4).length,
            totalSkillsTracked: masteryValues.length
        };
    }

    reset() {
        this.reviewQueue = [];
        this.skillMastery = {};
        this.lastSkillId = null;
        this.skillSwitchCount = 0;
        if (window.storageManager) {
            window.storageManager.saveReviewQueue([]);
            window.storageManager.saveSkillMastery({});
        }
    }
}

// Export for use in main engine
window.SkillSchedulingEngine = SkillSchedulingEngine;
