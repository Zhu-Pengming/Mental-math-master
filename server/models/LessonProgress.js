// ============================================================================
// LESSON PROGRESS MODEL - 课程进度数据模型
// ============================================================================

const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lessonId: {
        type: String,
        required: true,
        index: true
    },
    
    // Statistics
    attempts: {
        type: Number,
        default: 0
    },
    correct: {
        type: Number,
        default: 0
    },
    avgTime: {
        type: Number,
        default: 0
    },
    currentDifficulty: {
        type: Number,
        default: 3,
        min: 1,
        max: 5
    },
    
    // Mastery Score (0-1)
    masteryScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1
    },
    
    // Spaced Repetition Data
    spacedRepetition: {
        interval: {
            type: Number,
            default: 1
        },
        easeFactor: {
            type: Number,
            default: 2.5
        },
        nextReview: {
            type: Date,
            default: function() {
                return new Date(Date.now() + 24 * 60 * 60 * 1000);
            }
        },
        repetitions: {
            type: Number,
            default: 0
        }
    },
    
    // Bandit Arm Statistics (per difficulty level)
    banditArms: {
        type: Map,
        of: {
            pulls: { type: Number, default: 0 },
            rewards: { type: Number, default: 0 },
            avgReward: { type: Number, default: 0 },
            successRate: { type: Number, default: 0 },
            avgTime: { type: Number, default: 0 },
            lastPulled: { type: Date, default: Date.now }
        },
        default: {}
    },
    
    // Hint Usage
    hintUsageCount: {
        type: Number,
        default: 0
    },
    
    lastPracticed: {
        type: Date,
        default: Date.now
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
LessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

// Calculate accuracy
LessonProgressSchema.virtual('accuracy').get(function() {
    return this.attempts > 0 ? this.correct / this.attempts : 0;
});

module.exports = mongoose.model('LessonProgress', LessonProgressSchema);
