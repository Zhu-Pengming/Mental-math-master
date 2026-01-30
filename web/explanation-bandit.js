// ============================================================================
// EXPLANATION BANDIT - Thompson Sampling for explanation style selection
// ============================================================================

/**
 * ExplanationBandit - Learns which explanation style works best
 * Reward: User does NOT repeat the same error on next question
 */
class ExplanationBandit {
    constructor() {
        this.arms = this.loadArms();
        this.styles = ['short', 'stepwise', 'analogy'];
        this.explorationRate = 0.15;
        this.pendingRewards = []; // Track explanations waiting for reward
    }

    loadArms() {
        if (window.storageManager) {
            return window.storageManager.loadExplanationArms();
        }
        return {};
    }

    saveArms() {
        if (window.storageManager) {
            window.storageManager.saveExplanationArms(this.arms);
        }
    }

    /**
     * Select explanation style using Thompson Sampling
     * Key: skillId_errorTag
     */
    selectStyle(skillId, errorTag) {
        const key = `${skillId}_${errorTag}`;
        
        // Exploration: random style
        if (Math.random() < this.explorationRate) {
            const style = this.styles[Math.floor(Math.random() * this.styles.length)];
            this.recordSelection(key, style);
            return style;
        }

        // Exploitation: Thompson Sampling
        let bestStyle = this.styles[0];
        let bestSample = -1;

        for (const style of this.styles) {
            const armKey = `${key}_${style}`;
            const arm = this.getOrCreateArm(armKey);
            
            // Sample from Beta(alpha, beta)
            const sample = this.sampleBeta(arm.alpha, arm.beta);
            
            if (sample > bestSample) {
                bestSample = sample;
                bestStyle = style;
            }
        }

        this.recordSelection(key, bestStyle);
        return bestStyle;
    }

    /**
     * Record that a style was selected (for pending reward)
     */
    recordSelection(key, style) {
        this.pendingRewards.push({
            key,
            style,
            timestamp: Date.now()
        });

        // Keep only last 20 pending rewards
        if (this.pendingRewards.length > 20) {
            this.pendingRewards.shift();
        }
    }

    /**
     * Update arm based on whether error was repeated
     * Called after next question is answered
     */
    updateFromOutcome(skillId, errorTag, errorRepeated) {
        // Find pending reward for this skill+error combination
        const key = `${skillId}_${errorTag}`;
        const pendingIndex = this.pendingRewards.findIndex(p => p.key === key);
        
        if (pendingIndex === -1) {
            return; // No pending reward to update
        }

        const pending = this.pendingRewards[pendingIndex];
        this.pendingRewards.splice(pendingIndex, 1);

        const armKey = `${key}_${pending.style}`;
        const arm = this.getOrCreateArm(armKey);

        // Reward: user did NOT repeat the error
        const success = !errorRepeated;

        if (success) {
            arm.alpha += 1;
            arm.successes += 1;
        } else {
            arm.beta += 1;
        }
        
        arm.uses += 1;
        this.arms[armKey] = arm;
        this.saveArms();
    }

    /**
     * Get or create arm with Beta(1, 1) prior
     */
    getOrCreateArm(armKey) {
        if (!this.arms[armKey]) {
            this.arms[armKey] = {
                alpha: 1,
                beta: 1,
                uses: 0,
                successes: 0
            };
        }
        return this.arms[armKey];
    }

    /**
     * Sample from Beta distribution using Gamma approximation
     */
    sampleBeta(alpha, beta) {
        const gammaAlpha = this.sampleGamma(alpha);
        const gammaBeta = this.sampleGamma(beta);
        return gammaAlpha / (gammaAlpha + gammaBeta);
    }

    /**
     * Sample from Gamma distribution (for Beta sampling)
     */
    sampleGamma(shape) {
        if (shape < 1) {
            return this.sampleGamma(shape + 1) * Math.pow(Math.random(), 1 / shape);
        }

        const d = shape - 1/3;
        const c = 1 / Math.sqrt(9 * d);
        
        while (true) {
            let x, v;
            do {
                x = this.sampleNormal();
                v = 1 + c * x;
            } while (v <= 0);
            
            v = v * v * v;
            const u = Math.random();
            
            if (u < 1 - 0.0331 * x * x * x * x) {
                return d * v;
            }
            
            if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
                return d * v;
            }
        }
    }

    /**
     * Sample from standard normal distribution (Box-Muller)
     */
    sampleNormal() {
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }

    /**
     * Get statistics for a skill+error combination
     */
    getStatistics(skillId, errorTag) {
        const key = `${skillId}_${errorTag}`;
        const stats = [];

        for (const style of this.styles) {
            const armKey = `${key}_${style}`;
            const arm = this.getOrCreateArm(armKey);
            
            const successRate = arm.uses > 0 ? arm.successes / arm.uses : 0;
            const mean = arm.alpha / (arm.alpha + arm.beta);
            
            stats.push({
                style,
                uses: arm.uses,
                successes: arm.successes,
                successRate,
                mean,
                alpha: arm.alpha,
                beta: arm.beta
            });
        }

        return stats;
    }

    /**
     * Get best performing style for a skill+error (for analytics)
     */
    getBestStyle(skillId, errorTag) {
        const stats = this.getStatistics(skillId, errorTag);
        
        if (stats.every(s => s.uses === 0)) {
            return null;
        }

        stats.sort((a, b) => b.successRate - a.successRate);
        return stats[0];
    }

    /**
     * Reset arms (for testing)
     */
    reset() {
        this.arms = {};
        this.pendingRewards = [];
        this.saveArms();
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.ExplanationBandit = ExplanationBandit;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExplanationBandit;
}
