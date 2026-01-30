// ============================================================================
// ERROR CLASSIFIER - Rule-based error diagnosis (no LLM required)
// ============================================================================

/**
 * ErrorClassifier - Diagnoses errors using structural analysis
 * Each skill has 3-5 specific error types that can be detected algorithmically
 */
class ErrorClassifier {
    constructor() {
        // Error type definitions for each skill
        this.errorTypes = {
            'b1': [
                { tag: 'pairing_missed', description: 'Failed to identify complementary pairs' },
                { tag: 'complement_error', description: 'Wrong complement calculation' },
                { tag: 'arithmetic_mistake', description: 'Basic addition error' },
                { tag: 'grouping_error', description: 'Incorrect grouping strategy' }
            ],
            'b2': [
                { tag: 'complement_missed', description: 'Missed subtraction complement' },
                { tag: 'grouping_order_error', description: 'Wrong grouping order' },
                { tag: 'arithmetic_mistake', description: 'Basic subtraction error' },
                { tag: 'subtraction_error', description: 'General subtraction mistake' }
            ],
            'b3': [
                { tag: 'compensation_forgot', description: 'Forgot to compensate after rounding' },
                { tag: 'compensation_wrong_sign', description: 'Compensated in wrong direction' },
                { tag: 'rounding_error', description: 'Incorrect rounding' }
            ],
            'm1': [
                { tag: 'factoring_missed', description: 'Did not factor the number' },
                { tag: 'magic_pair_missed', description: 'Missed magic pair (2×5, 4×25, 8×125)' },
                { tag: 'multiplication_error', description: 'Basic multiplication error' },
                { tag: 'factor_combination_error', description: 'Wrong factor combination' }
            ],
            'm2': [
                { tag: 'distributive_not_applied', description: 'Did not use distributive property' },
                { tag: 'sum_calculation_error', description: 'Error in calculating sum' },
                { tag: 'multiplication_error', description: 'Basic multiplication error' }
            ],
            'a1': [
                { tag: 'units_multiplication_error', description: 'Units digit multiplication wrong' },
                { tag: 'tens_formula_error', description: 'Tens formula not applied correctly' },
                { tag: 'forgot_units_part', description: 'Forgot to add units part' },
                { tag: 'pattern_not_recognized', description: 'Did not recognize the pattern' }
            ],
            'a2': [
                { tag: 'formula_not_used', description: 'Did not use sequence formula' },
                { tag: 'division_by_2_error', description: 'Error in dividing by 2' },
                { tag: 'count_error', description: 'Counted terms incorrectly' },
                { tag: 'sequence_formula_error', description: 'Formula application error' }
            ]
        };
    }

    /**
     * Classify error based on skill and answer difference
     * Returns errorTag string
     */
    classify(skillId, question, correctAnswer, userAnswer, difficulty) {
        if (correctAnswer === userAnswer) {
            return 'none';
        }

        const diff = Math.abs(correctAnswer - userAnswer);
        const ratio = diff / Math.max(correctAnswer, 1);

        // Skill-specific classification
        switch (skillId) {
            case 'b1':
                return this.classifyB1(diff, ratio, question);
            case 'b2':
                return this.classifyB2(diff, ratio, question);
            case 'b3':
                return this.classifyB3(diff, ratio, question);
            case 'm1':
                return this.classifyM1(diff, ratio, question);
            case 'm2':
                return this.classifyM2(diff, ratio, question);
            case 'a1':
                return this.classifyA1(diff, ratio, question);
            case 'a2':
                return this.classifyA2(diff, ratio, question);
            default:
                return 'calculation_error';
        }
    }

    classifyB1(diff, ratio, question) {
        // Making 10s - detect pairing mistakes
        if (diff === 10 || diff === 20 || diff === 30 || diff === 40 || diff === 50) {
            return 'pairing_missed';
        }
        if (diff % 10 === 0 && diff <= 100) {
            return 'complement_error';
        }
        if (diff < 10) {
            return 'arithmetic_mistake';
        }
        return 'grouping_error';
    }

    classifyB2(diff, ratio, question) {
        // Subtraction grouping - detect complement mistakes
        if (diff === 10 || diff === 20 || diff === 30) {
            return 'complement_missed';
        }
        if (diff % 10 === 0) {
            return 'grouping_order_error';
        }
        if (diff < 10) {
            return 'arithmetic_mistake';
        }
        return 'subtraction_error';
    }

    classifyB3(diff, ratio, question) {
        // Rounding - detect compensation mistakes
        const smallDiffs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        if (smallDiffs.includes(diff)) {
            return 'compensation_forgot';
        }
        if (diff > 10 && diff < 20) {
            return 'compensation_wrong_sign';
        }
        return 'rounding_error';
    }

    classifyM1(diff, ratio, question) {
        // Factor splitting - detect magic pair mistakes
        if (ratio > 0.5) {
            return 'factoring_missed';
        }
        if (diff % 10 === 0 || diff % 100 === 0 || diff % 1000 === 0) {
            return 'magic_pair_missed';
        }
        if (diff < 100) {
            return 'multiplication_error';
        }
        return 'factor_combination_error';
    }

    classifyM2(diff, ratio, question) {
        // Distributive law - detect factoring mistakes
        if (ratio > 0.3) {
            return 'distributive_not_applied';
        }
        if (diff % 10 === 0 || diff % 100 === 0) {
            return 'sum_calculation_error';
        }
        return 'multiplication_error';
    }

    classifyA1(diff, ratio, question) {
        // Same tens complementary - detect formula mistakes
        if (diff < 100) {
            return 'units_multiplication_error';
        }
        if (diff >= 100 && diff < 1000) {
            return 'tens_formula_error';
        }
        if (diff % 100 === 0) {
            return 'forgot_units_part';
        }
        return 'pattern_not_recognized';
    }

    classifyA2(diff, ratio, question) {
        // Sequence sum - detect formula mistakes
        if (ratio > 0.3) {
            return 'formula_not_used';
        }
        if (diff % 2 === 1) {
            return 'division_by_2_error';
        }
        if (ratio < 0.2) {
            return 'count_error';
        }
        return 'sequence_formula_error';
    }

    /**
     * Get all error types for a skill
     */
    getErrorTypes(skillId) {
        return this.errorTypes[skillId] || [];
    }

    /**
     * Get error description
     */
    getErrorDescription(skillId, errorTag) {
        const types = this.errorTypes[skillId] || [];
        const errorType = types.find(t => t.tag === errorTag);
        return errorType ? errorType.description : 'Unknown error';
    }

    /**
     * Check if error is recurring (appears 3+ times recently)
     */
    isRecurringError(errorHistory, skillId, errorTag, windowSize = 10) {
        const recentErrors = errorHistory
            .slice(-windowSize)
            .filter(e => e.skillId === skillId && e.errorTag === errorTag);
        
        return recentErrors.length >= 3;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.ErrorClassifier = ErrorClassifier;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorClassifier;
}
