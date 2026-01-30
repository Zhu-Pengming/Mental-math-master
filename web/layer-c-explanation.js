// ============================================================================
// LAYER C: AI EXPLANATION ENGINE
// Error Diagnosis + Adaptive Feedback with Bandit Optimization
// ============================================================================

class ExplanationEngine {
    constructor() {
        this.errorPatterns = this.loadErrorPatterns();
        this.explanationArms = this.loadExplanationArms();
        this.errorHistory = this.loadErrorHistory();
    }

    loadErrorPatterns() {
        return window.storageManager ? 
            window.storageManager.loadErrorPatterns() : {};
    }

    loadExplanationArms() {
        return window.storageManager ? 
            window.storageManager.loadExplanationArms() : {};
    }

    loadErrorHistory() {
        return window.storageManager ? 
            window.storageManager.loadErrorHistory(200) : [];
    }

    saveErrorPatterns() {
        if (window.storageManager) {
            window.storageManager.saveErrorPatterns(this.errorPatterns);
        }
    }

    saveExplanationArms() {
        if (window.storageManager) {
            window.storageManager.saveExplanationArms(this.explanationArms);
        }
    }

    saveErrorHistory() {
        if (window.storageManager) {
            window.storageManager.saveErrorHistory(this.errorHistory, 200);
        }
    }

    // ========================================================================
    // ERROR DIAGNOSIS
    // ========================================================================
    
    diagnoseError(skillId, question, correctAnswer, userAnswer, difficulty, timeSpent) {
        const errorTag = this.classifyError(skillId, question, correctAnswer, userAnswer);
        
        // Log error for pattern tracking
        this.errorHistory.push({
            timestamp: Date.now(),
            skillId,
            errorTag,
            difficulty,
            timeSpent
        });
        this.saveErrorHistory();
        
        // Update error pattern frequency
        const key = `${skillId}_${errorTag}`;
        if (!this.errorPatterns[key]) {
            this.errorPatterns[key] = { count: 0, lastSeen: 0 };
        }
        this.errorPatterns[key].count++;
        this.errorPatterns[key].lastSeen = Date.now();
        this.saveErrorPatterns();
        
        return errorTag;
    }

    classifyError(skillId, question, correctAnswer, userAnswer) {
        const diff = Math.abs(correctAnswer - userAnswer);
        if (diff === 0) return 'none';
        
        const ratio = diff / Math.max(correctAnswer, 1);
        
        // Skill-specific error classification with enhanced pattern detection
        if (skillId === 'b1') {
            // Making 10s - detect pairing mistakes
            if (diff === 10 || diff === 20 || diff === 30) return 'pairing_missed';
            if (diff % 10 === 0 && diff <= 100) return 'complement_error';
            if (diff < 10) return 'arithmetic_mistake';
            return 'grouping_error';
        }
        
        if (skillId === 'b2') {
            // Subtraction grouping - detect complement mistakes
            if (diff === 10 || diff === 20) return 'complement_missed';
            if (diff % 10 === 0) return 'grouping_order_error';
            if (diff < 10) return 'arithmetic_mistake';
            return 'subtraction_error';
        }
        
        if (skillId === 'b3') {
            // Rounding - detect compensation mistakes
            const possibleDiffs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
            if (possibleDiffs.includes(diff)) return 'compensation_forgot';
            if (diff > 10 && diff < 20) return 'compensation_wrong_sign';
            return 'rounding_error';
        }
        
        if (skillId === 'm1') {
            // Factor splitting - detect magic pair mistakes
            if (ratio > 0.5) return 'factoring_missed';
            if (diff % 10 === 0 || diff % 100 === 0 || diff % 1000 === 0) return 'magic_pair_missed';
            if (diff < 100) return 'multiplication_error';
            return 'factor_combination_error';
        }
        
        if (skillId === 'm2') {
            // Distributive law - detect factoring mistakes
            if (ratio > 0.3) return 'distributive_not_applied';
            if (diff % 10 === 0 || diff % 100 === 0) return 'sum_calculation_error';
            return 'multiplication_error';
        }
        
        if (skillId === 'a1') {
            // Same tens complementary - detect formula mistakes
            if (diff < 100) return 'units_multiplication_error';
            if (diff >= 100 && diff < 1000) return 'tens_formula_error';
            if (diff % 100 === 0) return 'forgot_units_part';
            return 'pattern_not_recognized';
        }
        
        if (skillId === 'a2') {
            // Sequence sum - detect formula mistakes
            if (ratio > 0.3) return 'formula_not_used';
            if (diff % 2 === 1) return 'division_by_2_error';
            if (ratio < 0.2) return 'count_error';
            return 'sequence_formula_error';
        }
        
        return 'calculation_error';
    }

    // ========================================================================
    // EXPLANATION GENERATION (Three Styles)
    // ========================================================================
    
    generateExplanation(skillId, errorTag, question, correctAnswer, userAnswer, hint, styleId) {
        const styles = {
            'short': this.generateShortExplanation,
            'stepwise': this.generateStepwiseExplanation,
            'analogy': this.generateAnalogyExplanation
        };
        
        const generator = styles[styleId] || styles['short'];
        return generator.call(this, skillId, errorTag, question, correctAnswer, userAnswer, hint);
    }

    generateShortExplanation(skillId, errorTag, question, correctAnswer, userAnswer, hint) {
        const errorMessages = {
            'pairing_missed': `Look for pairs that sum to 10, 20, or 100. ${hint}`,
            'complement_error': `Find complements (numbers that add to 10). ${hint}`,
            'complement_missed': `Group the subtractions that make 10 or 20. ${hint}`,
            'grouping_order_error': `Try grouping in a different order. ${hint}`,
            'compensation_forgot': `After rounding, remember to compensate! ${hint}`,
            'compensation_wrong_sign': `Check if you added when you should subtract (or vice versa). ${hint}`,
            'arithmetic_mistake': `Small calculation error. The answer is ${correctAnswer}.`,
            'rounding_error': `Remember to adjust after rounding. ${hint}`,
            'grouping_error': `Try grouping the numbers differently. ${hint}`,
            'factoring_missed': `Break down into smaller factors first. ${hint}`,
            'magic_pair_missed': `Look for magic pairs: 2×5=10, 4×25=100, 8×125=1000. ${hint}`,
            'factor_combination_error': `Check how you combined the factors. ${hint}`,
            'distributive_not_applied': `Factor out the common multiplier first! ${hint}`,
            'sum_calculation_error': `Check your addition inside the parentheses. ${hint}`,
            'multiplication_error': `Multiplication mistake. ${hint}`,
            'units_multiplication_error': `Multiply the units digits: they go at the end. ${hint}`,
            'tens_formula_error': `Front part: Tens × (Tens+1). ${hint}`,
            'forgot_units_part': `Don't forget to add the units multiplication! ${hint}`,
            'pattern_not_recognized': `This follows a special pattern. ${hint}`,
            'formula_not_used': `Use the formula: (First + Last) × Count ÷ 2. ${hint}`,
            'division_by_2_error': `Remember to divide by 2 at the end! ${hint}`,
            'count_error': `Check how many numbers are in the sequence. ${hint}`,
            'sequence_formula_error': `Formula: (First + Last) × Count / 2. ${hint}`,
            'calculation_error': `Double-check your calculation. ${hint}`
        };
        
        return {
            explanation: errorMessages[errorTag] || `The correct answer is ${correctAnswer}. ${hint}`,
            nextAction: this.suggestNextAction(skillId, errorTag)
        };
    }

    generateStepwiseExplanation(skillId, errorTag, question, correctAnswer, userAnswer, hint) {
        const steps = this.getStepByStepSolution(skillId, question, correctAnswer, hint);
        
        return {
            explanation: `Let's break it down:\n${steps.join('\n')}`,
            nextAction: this.suggestNextAction(skillId, errorTag)
        };
    }

    generateAnalogyExplanation(skillId, errorTag, question, correctAnswer, userAnswer, hint) {
        const analogies = {
            'pairing_missed': `Think of it like finding dance partners at a party - each number wants a partner to make a round number (10, 20, 100). ${hint}`,
            'complement_missed': `Like puzzle pieces that fit together to make 10 - find the matching pieces first! ${hint}`,
            'compensation_forgot': `Like borrowing money: if you round up, you borrowed extra, so pay it back by subtracting! ${hint}`,
            'magic_pair_missed': `These are like best friends: 4 and 25 always team up to make 100, just like 8 and 125 make 1000. They're magic! ${hint}`,
            'distributive_not_applied': `Imagine you're sharing cookies - if everyone gets the same amount, count groups instead of one by one. ${hint}`,
            'tens_formula_error': `Think of it like a two-part code: the tens create the big number, units create the small ending. ${hint}`,
            'sequence_formula_error': `Picture a ladder: average rung height × number of rungs = total climb. Or: (top + bottom) ÷ 2 × rungs. ${hint}`,
            'factoring_missed': `Like breaking a big task into smaller steps - split the number into easier pieces first! ${hint}`,
            'grouping_error': `Like organizing your desk - group similar items together to make counting easier. ${hint}`
        };
        
        const explanation = analogies[errorTag] || this.generateShortExplanation(skillId, errorTag, question, correctAnswer, userAnswer, hint).explanation;
        
        return {
            explanation,
            nextAction: this.suggestNextAction(skillId, errorTag)
        };
    }

    getStepByStepSolution(skillId, question, correctAnswer, hint) {
        // Skill-specific step-by-step solutions
        const steps = [];
        
        if (skillId === 'b1') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Add the paired numbers first to get round numbers`);
            steps.push(`3. Add the round numbers together`);
            steps.push(`4. Final answer: ${correctAnswer}`);
        } else if (skillId === 'b2') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Group subtractions that sum to 10 or 20`);
            steps.push(`3. Subtract the grouped amount first`);
            steps.push(`4. Then subtract remaining numbers`);
            steps.push(`5. Final answer: ${correctAnswer}`);
        } else if (skillId === 'b3') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Round to nearest hundred (or ten)`);
            steps.push(`3. Do the calculation with round number`);
            steps.push(`4. Adjust by adding/subtracting the difference`);
            steps.push(`5. Final answer: ${correctAnswer}`);
        } else if (skillId === 'm1') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Look for factors that pair with 5, 25, or 125`);
            steps.push(`3. Multiply the magic pair first (gives 10, 100, or 1000)`);
            steps.push(`4. Multiply by the remaining factor`);
            steps.push(`5. Final answer: ${correctAnswer}`);
        } else if (skillId === 'm2') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Notice the common factor in both terms`);
            steps.push(`3. Factor it out: a×b + a×c = a×(b+c)`);
            steps.push(`4. Add the numbers in parentheses`);
            steps.push(`5. Multiply by the common factor`);
            steps.push(`6. Final answer: ${correctAnswer}`);
        } else if (skillId === 'a1') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Check: same tens digit? Units add to 10?`);
            steps.push(`3. Front part: Tens × (Tens+1)`);
            steps.push(`4. Back part: Units × Units`);
            steps.push(`5. Combine: put back part after front part`);
            steps.push(`6. Final answer: ${correctAnswer}`);
        } else if (skillId === 'a2') {
            steps.push(`1. ${hint}`);
            steps.push(`2. Identify: First number, Last number, Count`);
            steps.push(`3. Add first and last`);
            steps.push(`4. Multiply by count`);
            steps.push(`5. Divide by 2`);
            steps.push(`6. Final answer: ${correctAnswer}`);
        } else {
            steps.push(`1. ${hint}`);
            steps.push(`2. Work through the calculation step by step`);
            steps.push(`3. Final answer: ${correctAnswer}`);
        }
        
        return steps;
    }

    suggestNextAction(skillId, errorTag) {
        // Check if this error is recurring
        const key = `${skillId}_${errorTag}`;
        const pattern = this.errorPatterns[key];
        
        if (pattern && pattern.count >= 3) {
            return 'review_concept'; // Suggest reviewing the concept guide
        }
        
        if (errorTag === 'arithmetic_mistake') {
            return 'try_again'; // Simple mistake, try another
        }
        
        return 'continue'; // Continue practicing
    }

    // ========================================================================
    // BANDIT FOR EXPLANATION STYLE SELECTION
    // ========================================================================
    
    selectExplanationStyle(skillId, errorTag, userContext) {
        const styles = ['short', 'stepwise', 'analogy'];
        const key = `${skillId}_${errorTag}`;
        
        // Initialize arms for this error type
        for (const style of styles) {
            const armKey = `${key}_${style}`;
            if (!this.explanationArms[armKey]) {
                this.explanationArms[armKey] = {
                    alpha: 1,
                    beta: 1,
                    uses: 0
                };
            }
        }
        
        // Thompson Sampling
        let bestStyle = 'short';
        let bestSample = -Infinity;
        
        for (const style of styles) {
            const armKey = `${key}_${style}`;
            const arm = this.explanationArms[armKey];
            
            const sample = this.sampleBeta(arm.alpha, arm.beta);
            
            if (sample > bestSample) {
                bestSample = sample;
                bestStyle = style;
            }
        }
        
        return bestStyle;
    }

    sampleBeta(alpha, beta) {
        const mean = alpha / (alpha + beta);
        const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
        const noise = (Math.random() - 0.5) * Math.sqrt(variance) * 3;
        return Math.max(0, Math.min(1, mean + noise));
    }

    // ========================================================================
    // FEEDBACK LOOP (Update based on effectiveness)
    // ========================================================================
    
    updateExplanationEffectiveness(skillId, errorTag, styleUsed, wasEffective) {
        const key = `${skillId}_${errorTag}_${styleUsed}`;
        const arm = this.explanationArms[key];
        
        if (arm) {
            arm.uses++;
            if (wasEffective) {
                arm.alpha++; // Success: user didn't repeat same error
            } else {
                arm.beta++; // Failure: user repeated same error
            }
            this.saveExplanationArms();
        }
    }

    // Check if next question shows improvement (no same error)
    checkImprovement(skillId, previousErrorTag) {
        // Look at last 3 errors for this skill
        const recentErrors = this.errorHistory
            .filter(e => e.skillId === skillId)
            .slice(-3);
        
        if (recentErrors.length < 2) return true; // Not enough data
        
        // Check if the same error repeated
        const lastError = recentErrors[recentErrors.length - 1];
        return lastError.errorTag !== previousErrorTag;
    }

    // ========================================================================
    // FULL FEEDBACK GENERATION
    // ========================================================================
    
    generateFeedback(skillId, question, correctAnswer, userAnswer, difficulty, timeSpent, hintUsed, hint) {
        // Diagnose error
        const errorTag = this.diagnoseError(skillId, question, correctAnswer, userAnswer, difficulty, timeSpent);
        
        if (errorTag === 'none') {
            return {
                isCorrect: true,
                explanation: 'Correct! Well done.',
                nextAction: 'continue'
            };
        }
        
        // Select explanation style
        const userContext = {
            difficulty,
            timeSpent,
            hintUsed
        };
        const styleId = this.selectExplanationStyle(skillId, errorTag, userContext);
        
        // Generate explanation
        const feedback = this.generateExplanation(skillId, errorTag, question, correctAnswer, userAnswer, hint, styleId);
        
        return {
            isCorrect: false,
            errorTag,
            styleUsed: styleId,
            explanation: feedback.explanation,
            nextAction: feedback.nextAction
        };
    }

    // ========================================================================
    // ANALYTICS
    // ========================================================================
    
    getErrorAnalytics(skillId) {
        const skillErrors = Object.entries(this.errorPatterns)
            .filter(([key, _]) => key.startsWith(skillId))
            .map(([key, data]) => ({
                errorTag: key.split('_')[1],
                count: data.count,
                lastSeen: data.lastSeen
            }))
            .sort((a, b) => b.count - a.count);
        
        return skillErrors;
    }

    getMostCommonErrors(n = 5) {
        return Object.entries(this.errorPatterns)
            .map(([key, data]) => ({
                key,
                count: data.count,
                lastSeen: data.lastSeen
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, n);
    }

    reset() {
        this.errorPatterns = {};
        this.explanationArms = {};
        this.errorHistory = [];
        if (window.storageManager) {
            window.storageManager.saveErrorPatterns({});
            window.storageManager.saveExplanationArms({});
            window.storageManager.saveErrorHistory([]);
        }
    }
}

// Export for use in main engine
window.ExplanationEngine = ExplanationEngine;
