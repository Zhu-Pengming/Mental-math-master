// ============================================================================
// INTERNATIONALIZATION - 中英文双语支持系统
// ============================================================================

const translations = {
    en: {
        // Header
        appName: 'Mental Math Master',
        tagline: 'Math Speed Skills',
        
        // Home Page
        heroTitle: 'Speed Math',
        heroTitleHighlight: 'Training Gym',
        heroSubtitle: 'AI-powered adaptive learning. Master essential techniques used by math Olympians.',
        questionsLabel: 'Questions',
        accuracyLabel: 'Accuracy',
        streakLabel: 'Streak',
        
        // AI Recommendations
        aiRecommendations: 'AI Recommendations',
        
        // Levels
        beginnerTitle: 'Beginner: Addition & Subtraction',
        beginnerDesc: 'Master the art of "Making Whole Numbers" to speed up basic arithmetic.',
        intermediateTitle: 'Intermediate: Multiplication Hacks',
        intermediateDesc: 'Use the "Magic Friends" (2 & 5, 4 & 25, 8 & 125) to break down complex multiplication.',
        advancedTitle: 'Advanced: Speed Patterns',
        advancedDesc: 'Specific patterns that allow for instant answers if you recognize them.',
        
        // Features
        featuresTitle: 'AI-Powered Features',
        smartDifficultyTitle: 'Smart Difficulty',
        smartDifficultyDesc: 'AI adjusts questions in real-time using contextual bandit algorithms.',
        spacedRepetitionTitle: 'Spaced Repetition',
        spacedRepetitionDesc: 'Reviews skills at optimal intervals for long-term retention.',
        progressAnalyticsTitle: 'Progress Analytics',
        progressAnalyticsDesc: 'Track your learning curve with detailed insights.',
        
        // Lesson Page
        chooseTechnique: 'Choose a Technique',
        aiAdaptDifficulty: 'AI will adapt the difficulty to your level.',
        mastered: 'Mastered',
        learning: 'Learning',
        started: 'Started',
        attempts: 'attempts',
        
        // Lesson Modes
        conceptTab: 'Concept',
        practiceTab: 'Practice',
        speedTestTab: 'Speed Test',
        
        // Learn Mode
        theTechnique: 'The Technique',
        walkthroughExample: 'Walkthrough Example',
        startAdaptivePractice: 'Start Adaptive Practice',
        
        // Practice Mode
        streak: 'Streak',
        level: 'Level',
        skip: 'Skip',
        review: 'Review',
        onFire: '🔥 On fire!',
        greatStreak: 'Great streak!',
        excellent: 'Excellent!',
        thatsCorrect: "That's correct!",
        nextProblem: 'Next Problem',
        tryAgain: 'Try again!',
        attempt: 'Attempt',
        checkAnswer: 'Check Answer',
        needHint: 'Need a hint?',
        hint: 'Hint',
        takeBreak: 'Consider taking a break!',
        
        // Test Mode
        speedChallenge: 'Speed Challenge',
        speedChallengeDesc: 'Solve 10 problems as fast as you can!',
        startTest: 'Start Test',
        question: 'Question',
        complete: 'Complete',
        submit: 'Submit',
        testComplete: 'Test Complete',
        score: 'Score',
        time: 'Time',
        reviewAnswers: 'Review Answers',
        tryAgainBtn: 'Try Again',
        backToPractice: 'Back to Practice',
        
        // Test Ratings
        mathNovice: 'Math Novice',
        mathNoviceMsg: 'Keep practicing!',
        mathApprentice: 'Math Apprentice',
        mathApprenticeMsg: 'Good accuracy!',
        grandmaster: 'Grandmaster',
        grandmasterMsg: 'Perfect & blazing fast!',
        speedDemon: 'Speed Demon',
        speedDemonMsg: 'Perfect score!',
        mathPro: 'Math Pro',
        mathProMsg: 'Excellent!',
        solidPerformer: 'Solid Performer',
        solidPerformerMsg: 'Great work!',
        
        // Analytics
        yourProgress: 'Your Progress',
        totalQuestions: 'Total Questions',
        avgTime: 'Avg Time',
        skillMastery: 'Skill Mastery',
        strongestSkills: 'Strongest Skills',
        needsPractice: 'Needs Practice',
        recentPerformance: 'Recent Performance',
        resetProgress: 'Reset All Progress',
        
        // Debug Panels
        layerATitle: 'Layer A: Difficulty Adaptation',
        layerADesc: 'Thompson Sampling success rate by difficulty level. Target: 70-80% accuracy.',
        makingLabel: 'Making',
        noDataYet: 'No data yet. Start practicing to see difficulty adaptation!',
        layerBTitle: 'Layer B: Skill Mastery',
        layerBDesc: 'EWMA-based mastery tracking. Goal: 70%+ for all skills.',
        layerCTitle: 'Layer C: Error Analytics',
        layerCDesc: 'Most common mistakes and misconceptions.',
        spacedRepetitionQueueTitle: 'Spaced Repetition Queue',
        dueReviews: 'DUE REVIEWS',
        urgent: 'URGENT',
        nextReviews: 'Next Reviews',
        noReviewsDue: 'No reviews due. Keep practicing!',
        
        // Lessons
        making10s: 'Making 10s (Addition)',
        subtractionGrouping: 'Subtraction Grouping',
        roundingNearNumbers: 'Rounding Near-Numbers',
        splitCombineFactors: 'Split & Combine Factors',
        distributiveLaw: 'Distributive Law (The Hook)',
        sameTensComplementary: 'Same Tens, Complementary Units',
        sumOfSequences: 'Sum of Sequences',
        
        // Concepts
        making10sConcept: 'When adding multiple numbers, look for pairs that sum to 10, 20, 100, etc. Group them first.',
        subtractionGroupingConcept: 'If you are subtracting multiple numbers, check if the subtracted numbers add up to a nice round number.',
        roundingNearNumbersConcept: 'Treat numbers like 98, 199, or 297 as their nearest round number, then fix the difference later.',
        splitCombineFactorsConcept: 'Break numbers into factors to find "Magic Friends". 25 loves 4 (makes 100). 125 loves 8 (makes 1000).',
        distributiveLawConcept: 'If two multiplication parts share a number, pull it out! a×b + a×c = a×(b+c).',
        sameTensComplementaryConcept: 'If tens digit is same (e.g., 30s) and units add to 10 (2+8). Rule: (Tens × (Tens+1)) | (Units × Units).',
        sumOfSequencesConcept: 'Sum = (First + Last) × Count / 2. Useful for long lists of evenly spaced numbers.',
        
        // Mastery
        masteryLabel: 'Mastery'
    },
    
    zh: {
        // 页头
        appName: '心算大师',
        tagline: '数学速算技能',
        
        // 首页
        heroTitle: '速算',
        heroTitleHighlight: '训练营',
        heroSubtitle: 'AI驱动的自适应学习。掌握奥数选手使用的核心技巧。',
        questionsLabel: '题目数',
        accuracyLabel: '正确率',
        streakLabel: '连胜',
        
        // AI推荐
        aiRecommendations: 'AI 推荐',
        
        // 难度等级
        beginnerTitle: '初级：加减法',
        beginnerDesc: '掌握"凑整数"的艺术，加速基础运算。',
        intermediateTitle: '中级：乘法技巧',
        intermediateDesc: '使用"魔法好友"（2与5、4与25、8与125）分解复杂乘法。',
        advancedTitle: '高级：速算模式',
        advancedDesc: '识别特定模式，瞬间得出答案。',
        
        // 功能特性
        featuresTitle: 'AI智能功能',
        smartDifficultyTitle: '智能难度',
        smartDifficultyDesc: 'AI使用上下文赌博机算法实时调整题目难度。',
        spacedRepetitionTitle: '间隔重复',
        spacedRepetitionDesc: '在最佳时间间隔复习技能，实现长期记忆。',
        progressAnalyticsTitle: '进度分析',
        progressAnalyticsDesc: '通过详细洞察追踪你的学习曲线。',
        
        // 课程页面
        chooseTechnique: '选择一个技巧',
        aiAdaptDifficulty: 'AI将根据你的水平调整难度。',
        mastered: '已掌握',
        learning: '学习中',
        started: '已开始',
        attempts: '次练习',
        
        // 课程模式
        conceptTab: '概念',
        practiceTab: '练习',
        speedTestTab: '速度测试',
        
        // 学习模式
        theTechnique: '技巧说明',
        walkthroughExample: '示例演示',
        startAdaptivePractice: '开始自适应练习',
        
        // 练习模式
        streak: '连胜',
        level: '等级',
        skip: '跳过',
        review: '复习',
        onFire: '🔥 火力全开！',
        greatStreak: '连胜中！',
        excellent: '太棒了！',
        thatsCorrect: '答对了！',
        nextProblem: '下一题',
        tryAgain: '再试一次！',
        attempt: '第',
        checkAnswer: '检查答案',
        needHint: '需要提示吗？',
        hint: '提示',
        takeBreak: '你已经练习很久了，考虑休息一下！',
        
        // 测试模式
        speedChallenge: '速度挑战',
        speedChallengeDesc: '尽可能快地完成10道题！',
        startTest: '开始测试',
        question: '第',
        complete: '完成',
        submit: '提交',
        testComplete: '测试完成',
        score: '得分',
        time: '用时',
        reviewAnswers: '查看答案',
        tryAgainBtn: '再试一次',
        backToPractice: '返回练习',
        
        // 测试评级
        mathNovice: '数学新手',
        mathNoviceMsg: '继续练习！',
        mathApprentice: '数学学徒',
        mathApprenticeMsg: '准确率不错！',
        grandmaster: '特级大师',
        grandmasterMsg: '完美且超快！',
        speedDemon: '速度恶魔',
        speedDemonMsg: '满分！',
        mathPro: '数学专家',
        mathProMsg: '非常出色！',
        solidPerformer: '稳定发挥',
        solidPerformerMsg: '做得很好！',
        
        // 分析页面
        yourProgress: '你的进度',
        totalQuestions: '总题数',
        avgTime: '平均用时',
        skillMastery: '技能掌握度',
        strongestSkills: '最强技能',
        needsPractice: '需要练习',
        recentPerformance: '近期表现',
        resetProgress: '重置所有进度',
        
        // 调试面板
        layerATitle: '第A层：难度自适应',
        layerADesc: '按难度级别的Thompson采样成功率。目标：70-80%准确率。',
        makingLabel: '凑',
        noDataYet: '暂无数据。开始练习以查看难度自适应！',
        layerBTitle: '第B层：技能掌握度',
        layerBDesc: '基于EWMA的掌握度追踪。目标：所有技能达到70%以上。',
        layerCTitle: '第C层：错误分析',
        layerCDesc: '最常见的错误和误解。',
        spacedRepetitionQueueTitle: '间隔重复队列',
        dueReviews: '待复习',
        urgent: '紧急',
        nextReviews: '下次复习',
        noReviewsDue: '暂无待复习项目。继续练习！',
        
        // 课程名称
        making10s: '凑10法（加法）',
        subtractionGrouping: '减法分组',
        roundingNearNumbers: '近似数凑整',
        splitCombineFactors: '拆分与组合因数',
        distributiveLaw: '分配律（提取公因数）',
        sameTensComplementary: '同十位互补',
        sumOfSequences: '等差数列求和',
        
        // 概念说明
        making10sConcept: '在多个数相加时，寻找和为10、20、100等的数对，先将它们组合。',
        subtractionGroupingConcept: '如果要减去多个数，检查这些数是否能凑成整数。',
        roundingNearNumbersConcept: '将98、199、297等数字视为最接近的整数，然后修正差值。',
        splitCombineFactorsConcept: '将数字分解为因数，找到"魔法好友"。25喜欢4（得100），125喜欢8（得1000）。',
        distributiveLawConcept: '如果两个乘法项有公共因数，提取出来！a×b + a×c = a×(b+c)。',
        sameTensComplementaryConcept: '如果十位数相同（如30多），个位数相加为10（2+8）。规则：(十位×(十位+1)) | (个位×个位)。',
        sumOfSequencesConcept: '和 = (首项 + 末项) × 项数 / 2。适用于等间距数列。',
        
        // 掌握度
        masteryLabel: '掌握度',
        
        // Analytics 页面
        accuracy: '正确率',
        currentStreak: '连胜',
        timeLabel: '用时'
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('mathMasterLang') || 'en';
    }
    
    setLanguage(lang) {
        if (translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('mathMasterLang', lang);
            return true;
        }
        return false;
    }
    
    t(key) {
        return translations[this.currentLang][key] || translations['en'][key] || key;
    }
    
    getCurrentLanguage() {
        return this.currentLang;
    }
    
    toggleLanguage() {
        this.setLanguage(this.currentLang === 'en' ? 'zh' : 'en');
        return this.currentLang;
    }
}

// Initialize global i18n instance
window.i18n = new I18n();
