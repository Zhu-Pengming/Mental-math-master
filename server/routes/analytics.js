// ============================================================================
// ANALYTICS ROUTES - 分析统计路由
// ============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const LessonProgress = require('../models/LessonProgress');
const PerformanceHistory = require('../models/PerformanceHistory');

// @route   GET /api/analytics/insights
// @desc    Get learning insights and recommendations
// @access  Private
router.get('/insights', protect, async (req, res) => {
    try {
        const progress = await LessonProgress.find({ userId: req.user._id });
        const recentHistory = await PerformanceHistory.find({ userId: req.user._id })
            .sort({ timestamp: -1 })
            .limit(50);

        // Calculate overall metrics
        let totalAttempts = 0;
        let totalCorrect = 0;
        let totalTime = 0;
        const skillPerformance = [];

        progress.forEach(p => {
            totalAttempts += p.attempts;
            totalCorrect += p.correct;
            totalTime += p.avgTime * p.attempts;

            if (p.attempts >= 5) {
                skillPerformance.push({
                    lessonId: p.lessonId,
                    accuracy: p.correct / p.attempts,
                    mastery: p.masteryScore,
                    attempts: p.attempts
                });
            }
        });

        const overallAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;
        const averageTime = totalAttempts > 0 ? totalTime / totalAttempts : 0;

        // Sort skills by mastery
        skillPerformance.sort((a, b) => b.mastery - a.mastery);
        const strongestSkills = skillPerformance.slice(0, 3);
        const weakestSkills = skillPerformance.slice(-3).reverse();

        // Calculate improvement rate
        const recent20 = recentHistory.slice(0, 20);
        const previous20 = recentHistory.slice(20, 40);
        let improvementRate = 0;

        if (recent20.length >= 10 && previous20.length >= 10) {
            const recentAcc = recent20.filter(r => r.correct).length / recent20.length;
            const prevAcc = previous20.filter(r => r.correct).length / previous20.length;
            improvementRate = recentAcc - prevAcc;
        }

        // Calculate current streak
        let currentStreak = 0;
        for (const record of recentHistory) {
            if (record.correct) currentStreak++;
            else break;
        }

        // Generate recommendations
        const recommendations = [];
        if (overallAccuracy > 0.85) {
            recommendations.push({
                type: 'challenge',
                message: 'You\'re doing great! Try increasing difficulty to challenge yourself.'
            });
        }
        if (overallAccuracy < 0.6) {
            recommendations.push({
                type: 'review',
                message: 'Consider reviewing the concept guides and practicing at lower difficulty.'
            });
        }

        const dueReviews = await LessonProgress.find({
            userId: req.user._id,
            'spacedRepetition.nextReview': { $lte: new Date() }
        });

        if (dueReviews.length > 0) {
            recommendations.push({
                type: 'review',
                message: `You have ${dueReviews.length} skill(s) due for review to maintain mastery.`
            });
        }

        res.json({
            success: true,
            data: {
                totalQuestions: totalAttempts,
                overallAccuracy,
                averageTime,
                currentStreak,
                strongestSkills,
                weakestSkills,
                improvementRate,
                recommendations
            }
        });
    } catch (error) {
        console.error('Get insights error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/analytics/history
// @desc    Get performance history
// @access  Private
router.get('/history', protect, async (req, res) => {
    try {
        const { limit = 30, lessonId } = req.query;

        const query = { userId: req.user._id };
        if (lessonId) query.lessonId = lessonId;

        const history = await PerformanceHistory.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/analytics/chart-data
// @desc    Get data for charts
// @access  Private
router.get('/chart-data', protect, async (req, res) => {
    try {
        const history = await PerformanceHistory.find({ userId: req.user._id })
            .sort({ timestamp: 1 })
            .limit(30);

        const accuracyOverTime = history.map((h, i) => ({
            x: i + 1,
            y: h.correct ? 1 : 0
        }));

        const timeOverTime = history.map((h, i) => ({
            x: i + 1,
            y: h.timeSpent
        }));

        const difficultyOverTime = history.map((h, i) => ({
            x: i + 1,
            y: h.difficulty
        }));

        res.json({
            success: true,
            data: {
                accuracyOverTime,
                timeOverTime,
                difficultyOverTime
            }
        });
    } catch (error) {
        console.error('Get chart data error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
