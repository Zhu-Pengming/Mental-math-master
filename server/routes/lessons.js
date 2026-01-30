// ============================================================================
// LESSONS ROUTES - 课程管理路由
// ============================================================================

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Curriculum data (same as frontend)
const CURRICULUM_INFO = {
    beginner: {
        id: 'beginner',
        title: { en: 'Beginner: Addition & Subtraction', zh: '初级：加减法' },
        lessons: ['b1', 'b2', 'b3']
    },
    intermediate: {
        id: 'intermediate',
        title: { en: 'Intermediate: Multiplication Hacks', zh: '中级：乘法技巧' },
        lessons: ['m1', 'm2']
    },
    advanced: {
        id: 'advanced',
        title: { en: 'Advanced: Speed Patterns', zh: '高级：速算模式' },
        lessons: ['a1', 'a2']
    }
};

// @route   GET /api/lessons
// @desc    Get all lessons info
// @access  Public
router.get('/', (req, res) => {
    try {
        res.json({
            success: true,
            data: CURRICULUM_INFO
        });
    } catch (error) {
        console.error('Get lessons error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/lessons/:lessonId
// @desc    Get specific lesson info
// @access  Public
router.get('/:lessonId', (req, res) => {
    try {
        const { lessonId } = req.params;
        
        // Find lesson in curriculum
        let lessonInfo = null;
        for (const level of Object.values(CURRICULUM_INFO)) {
            if (level.lessons.includes(lessonId)) {
                lessonInfo = {
                    lessonId,
                    levelId: level.id,
                    levelTitle: level.title
                };
                break;
            }
        }

        if (!lessonInfo) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        res.json({
            success: true,
            data: lessonInfo
        });
    } catch (error) {
        console.error('Get lesson error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
