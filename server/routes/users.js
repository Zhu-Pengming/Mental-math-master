// ============================================================================
// USER ROUTES - 用户管理路由
// ============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put('/me', protect, async (req, res) => {
    try {
        const { displayName, language, preferences } = req.body;

        const updateFields = {};
        if (displayName) updateFields.displayName = displayName;
        if (language) updateFields.language = language;
        if (preferences) updateFields.preferences = { ...req.user.preferences, ...preferences };

        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateFields,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT /api/users/me/preferences
// @desc    Update user preferences
// @access  Private
router.put('/me/preferences', protect, async (req, res) => {
    try {
        const { targetAccuracy, maxDifficulty, hintPreference } = req.body;

        const preferences = { ...req.user.preferences };
        if (targetAccuracy !== undefined) preferences.targetAccuracy = targetAccuracy;
        if (maxDifficulty !== undefined) preferences.maxDifficulty = maxDifficulty;
        if (hintPreference !== undefined) preferences.hintPreference = hintPreference;

        req.user.preferences = preferences;
        await req.user.save();

        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
