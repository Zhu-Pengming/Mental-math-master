// ============================================================================
// PROGRESS ROUTES - 学习进度路由
// ============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LessonProgress = require('../models/LessonProgress');
const PerformanceHistory = require('../models/PerformanceHistory');

// @route   GET /api/progress
// @desc    Get all lesson progress for user
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const progress = await LessonProgress.find({ userId: req.user._id });
        
        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/progress/:lessonId
// @desc    Get progress for specific lesson
// @access  Private
router.get('/:lessonId', protect, async (req, res) => {
    try {
        let progress = await LessonProgress.findOne({
            userId: req.user._id,
            lessonId: req.params.lessonId
        });

        if (!progress) {
            progress = new LessonProgress({
                userId: req.user._id,
                lessonId: req.params.lessonId
            });
            await progress.save();
        }

        res.json({
            success: true,
            data: progress
        });
    } catch (error) {
        console.error('Get lesson progress error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/progress/:lessonId/attempt
// @desc    Log a practice attempt
// @access  Private
router.post('/:lessonId/attempt', protect, async (req, res) => {
    try {
        const { question, answer, userAnswer, correct, timeSpent, difficulty, hintUsed, reward, sessionId } = req.body;

        // Update lesson progress
        let progress = await LessonProgress.findOne({
            userId: req.user._id,
            lessonId: req.params.lessonId
        });

        if (!progress) {
            progress = new LessonProgress({
                userId: req.user._id,
                lessonId: req.params.lessonId
            });
        }

        // Update statistics
        progress.attempts += 1;
        if (correct) progress.correct += 1;
        progress.avgTime = ((progress.avgTime * (progress.attempts - 1)) + timeSpent) / progress.attempts;
        progress.currentDifficulty = difficulty;
        progress.lastPracticed = Date.now();
        if (hintUsed) progress.hintUsageCount += 1;

        // Update mastery score
        const delta = correct ? 0.05 * (difficulty / 3) : -0.03;
        progress.masteryScore = Math.max(0, Math.min(1, progress.masteryScore + delta));

        // Update bandit arm statistics
        const armKey = `${difficulty}`;
        if (!progress.banditArms) progress.banditArms = new Map();
        
        const arm = progress.banditArms.get(armKey) || {
            pulls: 0,
            rewards: 0,
            avgReward: 0,
            successRate: 0,
            avgTime: 0,
            lastPulled: Date.now()
        };

        arm.pulls += 1;
        if (correct) arm.rewards += 1;
        arm.avgReward = arm.rewards / arm.pulls;
        arm.successRate = arm.rewards / arm.pulls;
        arm.avgTime = ((arm.avgTime * (arm.pulls - 1)) + timeSpent) / arm.pulls;
        arm.lastPulled = Date.now();

        progress.banditArms.set(armKey, arm);

        await progress.save();

        // Log performance history
        const historyEntry = new PerformanceHistory({
            userId: req.user._id,
            lessonId: req.params.lessonId,
            question,
            answer,
            userAnswer,
            correct,
            timeSpent,
            difficulty,
            hintUsed: hintUsed || false,
            reward: reward || 0,
            sessionId: sessionId || null
        });

        await historyEntry.save();

        // Update user statistics
        req.user.totalQuestions += 1;
        if (correct) req.user.totalCorrect += 1;
        await req.user.save();

        res.json({
            success: true,
            data: {
                progress,
                historyId: historyEntry._id
            }
        });
    } catch (error) {
        console.error('Log attempt error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/progress/:lessonId/spaced-repetition
// @desc    Update spaced repetition data
// @access  Private
router.put('/:lessonId/spaced-repetition', protect, async (req, res) => {
    try {
        const { correct } = req.body;

        let progress = await LessonProgress.findOne({
            userId: req.user._id,
            lessonId: req.params.lessonId
        });

        if (!progress) {
            return res.status(404).json({
                success: false,
                message: 'Lesson progress not found'
            });
        }

        // Update spaced repetition using SM-2 algorithm
        if (correct) {
            progress.spacedRepetition.repetitions += 1;

            if (progress.spacedRepetition.repetitions === 1) {
                progress.spacedRepetition.interval = 1;
            } else if (progress.spacedRepetition.repetitions === 2) {
                progress.spacedRepetition.interval = 6;
            } else {
                progress.spacedRepetition.interval = Math.round(
                    progress.spacedRepetition.interval * progress.spacedRepetition.easeFactor
                );
            }

            progress.spacedRepetition.easeFactor = Math.max(
                1.3,
                progress.spacedRepetition.easeFactor + 0.1
            );
        } else {
            progress.spacedRepetition.repetitions = 0;
            progress.spacedRepetition.interval = 1;
            progress.spacedRepetition.easeFactor = Math.max(
                1.3,
                progress.spacedRepetition.easeFactor - 0.2
            );
        }

        progress.spacedRepetition.nextReview = new Date(
            Date.now() + progress.spacedRepetition.interval * 24 * 60 * 60 * 1000
        );

        await progress.save();

        res.json({
            success: true,
            data: progress.spacedRepetition
        });
    } catch (error) {
        console.error('Update spaced repetition error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/progress/reviews/due
// @desc    Get lessons due for review
// @access  Private
router.get('/reviews/due', protect, async (req, res) => {
    try {
        const now = new Date();
        const dueReviews = await LessonProgress.find({
            userId: req.user._id,
            'spacedRepetition.nextReview': { $lte: now }
        }).sort({ 'spacedRepetition.nextReview': 1 });

        res.json({
            success: true,
            data: dueReviews
        });
    } catch (error) {
        console.error('Get due reviews error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
