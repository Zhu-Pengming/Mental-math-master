// ============================================================================
// PERFORMANCE HISTORY MODEL - 性能历史记录模型
// ============================================================================

const mongoose = require('mongoose');

const PerformanceHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    lessonId: {
        type: String,
        required: true,
        index: true
    },
    
    // Question Details
    question: {
        type: String,
        required: true
    },
    answer: {
        type: Number,
        required: true
    },
    userAnswer: {
        type: Number,
        default: null
    },
    
    // Performance Metrics
    correct: {
        type: Boolean,
        required: true
    },
    timeSpent: {
        type: Number,
        required: true
    },
    difficulty: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    
    // Context
    hintUsed: {
        type: Boolean,
        default: false
    },
    attemptNumber: {
        type: Number,
        default: 1
    },
    sessionId: {
        type: String,
        default: null
    },
    
    // Reward (for RL analysis)
    reward: {
        type: Number,
        default: 0
    },
    
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: false
});

// Compound indexes for efficient queries
PerformanceHistorySchema.index({ userId: 1, timestamp: -1 });
PerformanceHistorySchema.index({ userId: 1, lessonId: 1, timestamp: -1 });

// TTL index to automatically delete old records after 1 year
PerformanceHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

module.exports = mongoose.model('PerformanceHistory', PerformanceHistorySchema);
