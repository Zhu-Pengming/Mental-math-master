// ============================================================================
// UNIFIED EVENT SCHEMA - Shared between Frontend and Backend
// ============================================================================

/**
 * AttemptEvent - The single source of truth for all question attempts
 * This schema is used by:
 * - Layer A (difficulty bandit)
 * - Layer B (scheduler)
 * - Layer C (explanation bandit)
 * - Backend API
 * - Analytics
 */
const AttemptEventSchema = {
    // Core identifiers
    userId: String,           // User ID (guest or registered)
    sessionId: String,        // Current session ID
    
    // Question context
    skillId: String,          // Which skill (b1, b2, m1, etc.)
    difficulty: Number,       // 1-5 scale
    
    // User response
    correct: Boolean,         // Binary: true/false
    responseTimeSec: Number,  // Time taken in seconds
    
    // Assistance & attempts
    hintUsed: Boolean,        // Whether hint was shown
    attemptCount: Number,     // 1 for first try, 2+ for retries
    
    // Error diagnosis (only if incorrect)
    errorTag: String,         // null if correct, otherwise error type
    explanationStyle: String, // null if correct, otherwise 'short'/'stepwise'/'analogy'
    
    // Metadata
    timestamp: Number         // Date.now()
};

/**
 * Validation function - ensures event conforms to schema
 */
function validateAttemptEvent(event) {
    const required = ['userId', 'sessionId', 'skillId', 'difficulty', 'correct', 
                     'responseTimeSec', 'hintUsed', 'attemptCount', 'timestamp'];
    
    for (const field of required) {
        if (event[field] === undefined || event[field] === null) {
            throw new Error(`AttemptEvent missing required field: ${field}`);
        }
    }
    
    // Type validation
    if (typeof event.difficulty !== 'number' || event.difficulty < 1 || event.difficulty > 5) {
        throw new Error('difficulty must be a number between 1 and 5');
    }
    
    if (typeof event.correct !== 'boolean') {
        throw new Error('correct must be a boolean');
    }
    
    if (typeof event.responseTimeSec !== 'number' || event.responseTimeSec < 0) {
        throw new Error('responseTimeSec must be a non-negative number');
    }
    
    if (typeof event.hintUsed !== 'boolean') {
        throw new Error('hintUsed must be a boolean');
    }
    
    if (typeof event.attemptCount !== 'number' || event.attemptCount < 1) {
        throw new Error('attemptCount must be a positive number');
    }
    
    // Conditional validation
    if (!event.correct) {
        if (!event.errorTag) {
            throw new Error('errorTag is required when correct=false');
        }
        if (!event.explanationStyle) {
            throw new Error('explanationStyle is required when correct=false');
        }
    }
    
    return true;
}

/**
 * Factory function - creates a valid AttemptEvent
 */
function createAttemptEvent({
    userId,
    sessionId,
    skillId,
    difficulty,
    correct,
    responseTimeSec,
    hintUsed = false,
    attemptCount = 1,
    errorTag = null,
    explanationStyle = null
}) {
    const event = {
        userId,
        sessionId,
        skillId,
        difficulty,
        correct,
        responseTimeSec,
        hintUsed,
        attemptCount,
        errorTag: correct ? null : errorTag,
        explanationStyle: correct ? null : explanationStyle,
        timestamp: Date.now()
    };
    
    validateAttemptEvent(event);
    return event;
}

/**
 * Compute reward signal for bandit algorithms
 */
function computeReward(event, context = {}) {
    let reward = 0;
    
    // Base reward: correctness
    reward += event.correct ? 1 : 0;
    
    // Time bonus: faster is better (but not too fast)
    const expectedTime = 5 + event.difficulty * 3; // 8-20 seconds
    if (event.correct && event.responseTimeSec < expectedTime * 1.5) {
        reward += 0.2;
    }
    
    // Difficulty bonus: harder questions worth more
    if (event.correct) {
        reward += (event.difficulty - 1) * 0.1; // 0 to 0.4
    }
    
    // Hint penalty: using hints reduces reward
    if (event.hintUsed) {
        reward -= 0.3;
    }
    
    // Retry penalty: multiple attempts reduce reward
    if (event.attemptCount > 1) {
        reward -= (event.attemptCount - 1) * 0.2;
    }
    
    return Math.max(0, reward); // Never negative
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AttemptEventSchema,
        validateAttemptEvent,
        createAttemptEvent,
        computeReward
    };
} else {
    window.AttemptEvent = {
        schema: AttemptEventSchema,
        validate: validateAttemptEvent,
        create: createAttemptEvent,
        computeReward
    };
}
