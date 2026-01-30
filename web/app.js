// ============================================================================
// MENTAL MATH MASTER - Main Application with Adaptive Learning
// ============================================================================

// --- STATE MANAGEMENT ---
const state = {
    view: 'home',
    activeLevel: null,
    activeLesson: null,
    lessonMode: 'learn',
    
    practiceProblem: null,
    practiceFeedback: null,
    practiceStreak: 0,
    practiceStartTime: null,
    practiceAttempts: 0,
    showHint: false,

    testPhase: 'intro',
    testQuestions: [],
    testAnswers: [],
    testIndex: 0,
    testScore: 0,
    testStartTime: null,
    testEndTime: null,
    
    currentDifficulty: 3,
    adaptiveMode: true
};

// --- INITIALIZATION ---
function init() {
    // Ensure adaptiveEngine is initialized
    if (typeof adaptiveEngine === 'undefined') {
        console.error('Adaptive engine not loaded yet');
        setTimeout(init, 100);
        return;
    }
    adaptiveEngine.startSession();
    render();
}

// --- NAVIGATION ---
function setView(view, levelId = null, lessonId = null) {
    state.view = view;
    if (levelId) {
        state.activeLevel = CURRICULUM.find(l => l.id === levelId);
    }
    if (lessonId && state.activeLevel) {
        state.activeLesson = state.activeLevel.lessons.find(l => l.id === lessonId);
        state.lessonMode = 'learn';
        resetPractice();
        resetTest();
    }
    render();
}

function setLessonMode(mode) {
    state.lessonMode = mode;
    if (mode === 'practice') {
        nextPracticeProblem();
    } else if (mode === 'test') {
        resetTest();
    }
    render();
}

// --- PRACTICE MODE ---
function resetPractice() {
    state.practiceProblem = null;
    state.practiceFeedback = null;
    state.practiceStreak = 0;
    state.practiceStartTime = null;
    state.practiceAttempts = 0;
    state.showHint = false;
}

function nextPracticeProblem() {
    if (!state.activeLesson) return;
    
    if (state.adaptiveMode) {
        const currentState = adaptiveEngine.getCurrentState(state.activeLesson.id);
        state.currentDifficulty = adaptiveEngine.selectDifficulty(state.activeLesson.id, currentState);
    }
    
    let problemGenerated = false;
    
    if (adaptiveEngine.shouldInsertReview() && state.practiceStreak > 0) {
        const dueReviews = adaptiveEngine.getDueReviews();
        if (dueReviews.length > 0) {
            const reviewLesson = findLessonById(dueReviews[0].lessonId);
            if (reviewLesson) {
                state.practiceProblem = reviewLesson.generator(state.currentDifficulty);
                state.practiceProblem.isReview = true;
                state.practiceProblem.reviewLessonTitle = reviewLesson.title;
                problemGenerated = true;
            }
        }
    }
    
    if (!problemGenerated) {
        state.practiceProblem = state.activeLesson.generator(state.currentDifficulty);
        state.practiceProblem.isReview = false;
    }
    
    state.practiceFeedback = null;
    state.practiceStartTime = Date.now();
    state.practiceAttempts = 0;
    state.showHint = false;
    render();
}

function findLessonById(lessonId) {
    for (const level of CURRICULUM) {
        const lesson = level.lessons.find(l => l.id === lessonId);
        if (lesson) return lesson;
    }
    return null;
}

function checkPracticeAnswer() {
    const input = document.getElementById('practice-input');
    const val = parseFloat(input.value);
    
    if (isNaN(val)) return;
    
    const timeSpent = (Date.now() - state.practiceStartTime) / 1000;
    const correct = Math.abs(val - state.practiceProblem.a) < 0.01;
    
    state.practiceAttempts++;
    
    if (correct) {
        state.practiceFeedback = 'correct';
        state.practiceStreak++;
        adaptiveEngine.logAttempt(state.activeLesson.id, state.currentDifficulty, true, timeSpent, state.showHint);
    } else {
        state.practiceFeedback = 'incorrect';
        state.practiceStreak = 0;
        adaptiveEngine.logAttempt(state.activeLesson.id, state.currentDifficulty, false, timeSpent, state.showHint);
        
        if (adaptiveEngine.shouldShowHint(state.activeLesson.id, state.practiceAttempts, timeSpent)) {
            state.showHint = true;
        }
    }
    
    render();
    if (state.practiceFeedback === 'incorrect') {
        setTimeout(() => document.getElementById('practice-input')?.focus(), 50);
    }
}

function toggleHint() {
    state.showHint = !state.showHint;
    render();
}

// --- TEST MODE ---
function resetTest() {
    state.testPhase = 'intro';
    state.testQuestions = [];
    state.testAnswers = [];
    state.testIndex = 0;
    state.testScore = 0;
    state.testStartTime = null;
    state.testEndTime = null;
}

function startTest() {
    if (!state.activeLesson) return;
    
    state.testQuestions = [];
    for (let i = 0; i < 10; i++) {
        const difficulty = Math.min(5, Math.max(1, 3 + Math.floor((i - 5) / 2)));
        state.testQuestions.push(state.activeLesson.generator(difficulty));
    }
    
    state.testAnswers = [];
    state.testIndex = 0;
    state.testScore = 0;
    state.testStartTime = Date.now();
    state.testPhase = 'active';
    render();
}

function checkTestAnswer() {
    const input = document.getElementById('test-input');
    const val = input.value === '' ? null : parseFloat(input.value);
    
    state.testAnswers.push(val);
    const currentQ = state.testQuestions[state.testIndex];
    const correct = val !== null && Math.abs(val - currentQ.a) < 0.01;
    
    if (correct) state.testScore++;

    if (state.testIndex < 9) {
        state.testIndex++;
        render();
        setTimeout(() => document.getElementById('test-input')?.focus(), 50);
    } else {
        state.testEndTime = Date.now();
        state.testPhase = 'summary';
        render();
    }
}

function getTestRating(score, seconds) {
    if (score < 5) return { title: "Math Novice", color: "text-slate-600", msg: "Keep practicing!" };
    if (score < 8) return { title: "Math Apprentice", color: "text-blue-600", msg: "Good accuracy!" };
    if (score === 10) {
        if (seconds < 40) return { title: "Grandmaster", color: "text-purple-600", msg: "Perfect & blazing fast!" };
        if (seconds < 60) return { title: "Speed Demon", color: "text-red-600", msg: "Perfect score!" };
    }
    if (seconds < 80) return { title: "Math Pro", color: "text-emerald-600", msg: "Excellent!" };
    return { title: "Solid Performer", color: "text-emerald-600", msg: "Great work!" };
}

// --- MAIN RENDER ---
function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    if (state.view === 'home') {
        renderHeader();
        renderHome(app);
    } else if (state.view === 'level') {
        renderHeader(state.activeLevel, () => setView('home'));
        renderLevelMenu(app);
    } else if (state.view === 'lesson') {
        renderHeader(state.activeLesson, () => setView('level', state.activeLevel.id));
        renderLesson(app);
    } else if (state.view === 'analytics') {
        renderHeader({ title: 'Your Progress' }, () => setView('home'));
        renderAnalytics(app);
    }

    lucide.createIcons();
}

// --- RENDER COMPONENTS ---
function renderHeader(activeSection = null, backHandler = null) {
    const header = document.createElement('div');
    header.className = "bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10";
    
    window.handleBack = backHandler;
    
    const insights = adaptiveEngine ? adaptiveEngine.getInsights() : { currentStreak: 0 };
    const streak = insights.currentStreak;

    let sectionTitle = activeSection?.title;
    if (activeSection && state.activeLevel) {
        const levelTitleMap = {
            'beginner': 'beginnerTitle',
            'intermediate': 'intermediateTitle',
            'advanced': 'advancedTitle'
        };
        sectionTitle = i18n.t(levelTitleMap[state.activeLevel.id]) || activeSection.title;
    } else if (activeSection && state.activeLesson) {
        const lessonTitleMap = {
            'b1': 'making10s',
            'b2': 'subtractionGrouping',
            'b3': 'roundingNearNumbers',
            'm1': 'splitCombineFactors',
            'm2': 'distributiveLaw',
            'a1': 'sameTensComplementary',
            'a2': 'sumOfSequences'
        };
        sectionTitle = i18n.t(lessonTitleMap[state.activeLesson.id]) || activeSection.title;
    }

    header.innerHTML = `
        <div class="max-w-4xl mx-auto flex items-center justify-between">
            <div class="flex items-center">
                ${activeSection ? `
                    <button onclick="window.handleBack()" class="p-2 hover:bg-slate-800 rounded-full transition-colors mr-2">
                        <i data-lucide="arrow-left" class="w-5 h-5"></i>
                    </button>
                    <h1 class="text-xl font-bold tracking-tight">${sectionTitle}</h1>
                ` : `
                    <i data-lucide="brain" class="text-emerald-400 w-6 h-6 mr-2"></i>
                    <h1 class="text-xl font-bold tracking-tight">${i18n.t('appName')}</h1>
                `}
            </div>
            <div class="flex items-center gap-4">
                ${streak > 0 ? `
                    <div class="hidden sm:flex items-center gap-1 text-amber-400">
                        <i data-lucide="flame" class="w-4 h-4"></i>
                        <span class="font-bold">${streak}</span>
                    </div>
                ` : ''}
                <button onclick="toggleLanguage()" class="px-3 py-1 text-sm font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">
                    ${i18n.getCurrentLanguage() === 'en' ? '中文' : 'EN'}
                </button>
                <button onclick="setView('analytics')" class="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <i data-lucide="bar-chart-3" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;
    document.getElementById('app').appendChild(header);
}

function renderHome(container) {
    const main = document.createElement('main');
    main.className = "max-w-4xl mx-auto p-4 space-y-8 w-full";

    const insights = adaptiveEngine ? adaptiveEngine.getInsights() : {
        totalQuestions: 0,
        overallAccuracy: 0,
        currentStreak: 0,
        recommendations: []
    };
    
    const hero = document.createElement('div');
    hero.className = "text-center py-10 px-4";
    hero.innerHTML = `
        <h2 class="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
            ${i18n.t('heroTitle')} <span class="text-emerald-600">${i18n.t('heroTitleHighlight')}</span>
        </h2>
        <p class="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
            ${i18n.t('heroSubtitle')}
        </p>
        ${insights.totalQuestions > 0 ? `
            <div class="flex justify-center gap-6 mt-6">
                <div class="text-center">
                    <div class="text-2xl font-bold text-emerald-600">${insights.totalQuestions}</div>
                    <div class="text-xs text-slate-500 uppercase">${i18n.t('questionsLabel')}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">${(insights.overallAccuracy * 100).toFixed(0)}%</div>
                    <div class="text-xs text-slate-500 uppercase">${i18n.t('accuracyLabel')}</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">${insights.currentStreak}</div>
                    <div class="text-xs text-slate-500 uppercase">${i18n.t('streakLabel')}</div>
                </div>
            </div>
        ` : ''}
    `;
    main.appendChild(hero);

    if (insights.recommendations.length > 0) {
        const banner = document.createElement('div');
        banner.className = "bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-4 mb-6";
        banner.innerHTML = `
            <div class="flex items-start gap-3">
                <i data-lucide="lightbulb" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                <div class="flex-1">
                    <h3 class="font-bold text-slate-800 mb-2">${i18n.t('aiRecommendations')}</h3>
                    ${insights.recommendations.map(rec => `<p class="text-sm text-slate-700 mb-1">• ${rec.message}</p>`).join('')}
                </div>
            </div>
        `;
        main.appendChild(banner);
    }

    const grid = document.createElement('div');
    grid.className = "grid md:grid-cols-3 gap-6";
    
    CURRICULUM.forEach(level => {
        const btn = document.createElement('button');
        btn.className = "w-full text-left bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all group";
        btn.onclick = () => setView('level', level.id);
        
        const levelLessons = level.lessons.map(l => l.id);
        const masteryScores = levelLessons.map(id => 
            adaptiveEngine && adaptiveEngine.userProfile.skillMastery ? 
            (adaptiveEngine.userProfile.skillMastery[id] || 0) : 0
        );
        const avgMastery = masteryScores.length > 0 ? masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length : 0;
        
        const dots = level.lessons.map(lesson => {
            const mastery = adaptiveEngine && adaptiveEngine.userProfile.skillMastery ? 
                (adaptiveEngine.userProfile.skillMastery[lesson.id] || 0) : 0;
            const bgColor = mastery > 0.7 ? 'bg-emerald-500' : mastery > 0.3 ? 'bg-blue-400' : 'bg-slate-200';
            return `<div class="h-1.5 w-6 rounded-full ${bgColor}"></div>`;
        }).join('');

        const levelTitle = i18n.getCurrentLanguage() === 'zh' ? 
            (level.id === 'beginner' ? i18n.t('beginnerTitle') : level.id === 'intermediate' ? i18n.t('intermediateTitle') : i18n.t('advancedTitle')) :
            level.title;
        const levelDesc = i18n.getCurrentLanguage() === 'zh' ? 
            (level.id === 'beginner' ? i18n.t('beginnerDesc') : level.id === 'intermediate' ? i18n.t('intermediateDesc') : i18n.t('advancedDesc')) :
            level.description;
        
        btn.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="p-3 rounded-lg ${level.color} text-white mb-4 shadow-sm">
                    <i data-lucide="calculator" class="w-6 h-6"></i>
                </div>
                <i data-lucide="chevron-right" class="text-slate-300 group-hover:text-emerald-500"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-800 mb-2">${levelTitle}</h3>
            <p class="text-slate-600 text-sm leading-relaxed mb-4">${levelDesc}</p>
            ${avgMastery > 0 ? `<div class="text-xs text-slate-500 mb-2">${i18n.t('masteryLabel')}: ${(avgMastery * 100).toFixed(0)}%</div>` : ''}
            <div class="flex gap-2">${dots}</div>
        `;
        grid.appendChild(btn);
    });
    main.appendChild(grid);

    const features = document.createElement('div');
    features.className = "bg-slate-900 rounded-2xl p-8 text-white shadow-xl mt-12";
    features.innerHTML = `
        <h3 class="text-xl font-bold mb-6 border-b border-slate-700 pb-4 flex items-center gap-2">
            <i data-lucide="brain" class="text-emerald-400 w-6 h-6"></i>
            ${i18n.t('featuresTitle')}
        </h3>
        <div class="grid md:grid-cols-3 gap-8">
            <div>
                <div class="bg-slate-800 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                    <i data-lucide="brain" class="text-emerald-400 w-5 h-5"></i>
                </div>
                <h4 class="font-bold mb-2">${i18n.t('smartDifficultyTitle')}</h4>
                <p class="text-slate-400 text-sm">${i18n.t('smartDifficultyDesc')}</p>
            </div>
            <div>
                <div class="bg-slate-800 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                    <i data-lucide="repeat" class="text-amber-400 w-5 h-5"></i>
                </div>
                <h4 class="font-bold mb-2">${i18n.t('spacedRepetitionTitle')}</h4>
                <p class="text-slate-400 text-sm">${i18n.t('spacedRepetitionDesc')}</p>
            </div>
            <div>
                <div class="bg-slate-800 w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                    <i data-lucide="trending-up" class="text-blue-400 w-5 h-5"></i>
                </div>
                <h4 class="font-bold mb-2">${i18n.t('progressAnalyticsTitle')}</h4>
                <p class="text-slate-400 text-sm">${i18n.t('progressAnalyticsDesc')}</p>
            </div>
        </div>
    `;
    main.appendChild(features);

    container.appendChild(main);
}

function renderLevelMenu(container) {
    const main = document.createElement('main');
    main.className = "max-w-2xl mx-auto p-4 space-y-4 w-full";
    
    const intro = document.createElement('div');
    intro.className = "bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6";
    intro.innerHTML = `
        <h2 class="text-xl font-bold text-slate-800 mb-2">${i18n.t('chooseTechnique')}</h2>
        <p class="text-slate-600">${i18n.t('aiAdaptDifficulty')}</p>
    `;
    main.appendChild(intro);

    const list = document.createElement('div');
    list.className = "grid gap-3";
    state.activeLevel.lessons.forEach(lesson => {
        const stats = adaptiveEngine && adaptiveEngine.userProfile.lessonStats ? 
            adaptiveEngine.userProfile.lessonStats[lesson.id] : null;
        const mastery = adaptiveEngine && adaptiveEngine.userProfile.skillMastery ? 
            (adaptiveEngine.userProfile.skillMastery[lesson.id] || 0) : 0;
        
        const lessonTitleMap = {
            'b1': 'making10s',
            'b2': 'subtractionGrouping',
            'b3': 'roundingNearNumbers',
            'm1': 'splitCombineFactors',
            'm2': 'distributiveLaw',
            'a1': 'sameTensComplementary',
            'a2': 'sumOfSequences'
        };
        const translatedTitle = i18n.t(lessonTitleMap[lesson.id]) || lesson.title;
        
        const btn = document.createElement('button');
        btn.className = "flex items-center justify-between p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group text-left w-full";
        btn.onclick = () => setView('lesson', state.activeLevel.id, lesson.id);
        
        let statusBadge = '';
        if (mastery > 0.7) statusBadge = `<span class="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">${i18n.t('mastered')}</span>`;
        else if (mastery > 0.3) statusBadge = `<span class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold">${i18n.t('learning')}</span>`;
        else if (stats && stats.attempts > 0) statusBadge = `<span class="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full font-semibold">${i18n.t('started')}</span>`;
        
        btn.innerHTML = `
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-slate-800 group-hover:text-emerald-700">${translatedTitle}</h3>
                    ${statusBadge}
                </div>
                ${stats ? `<div class="text-xs text-slate-500 mt-2">${stats.attempts} ${i18n.t('attempts')} • ${((stats.correct / stats.attempts) * 100).toFixed(0)}% ${i18n.t('accuracyLabel')}</div>` : ''}
                ${mastery > 0 ? `<div class="w-full bg-slate-100 rounded-full h-1.5 mt-2"><div class="bg-emerald-500 h-1.5 rounded-full" style="width: ${mastery * 100}%"></div></div>` : ''}
                ${mastery > 0 ? `<div class="text-xs text-slate-500 mt-1">${i18n.t('masteryLabel')}: ${(mastery * 100).toFixed(0)}%</div>` : ''}
            </div>
            <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-emerald-50 ml-4">
                <i data-lucide="chevron-right" class="text-slate-300 group-hover:text-emerald-500 w-5 h-5"></i>
            </div>
        `;
        list.appendChild(btn);
    });
    main.appendChild(list);
    container.appendChild(main);
}

function renderLesson(container) {
    const main = document.createElement('main');
    main.className = "max-w-2xl mx-auto p-4 w-full animate-fade-in";

    const tabs = document.createElement('div');
    tabs.className = "flex gap-4 mb-6 border-b border-slate-200";
    
    ['learn', 'practice', 'test'].forEach((mode, i) => {
        const icons = ['book-open', 'dumbbell', 'timer'];
        const labels = [i18n.t('conceptTab'), i18n.t('practiceTab'), i18n.t('speedTestTab')];
        const isActive = state.lessonMode === mode;
        const btn = document.createElement('button');
        btn.className = `pb-3 px-2 font-medium text-sm flex items-center gap-2 ${isActive ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500 hover:text-slate-800'}`;
        btn.innerHTML = `<i data-lucide="${icons[i]}" class="w-4 h-4"></i> ${labels[i]}`;
        btn.onclick = () => setLessonMode(mode);
        tabs.appendChild(btn);
    });
    main.appendChild(tabs);

    const content = document.createElement('div');
    
    if (state.lessonMode === 'learn') renderLearnMode(content);
    else if (state.lessonMode === 'practice') renderPracticeMode(content);
    else if (state.lessonMode === 'test') renderTestMode(content);
    
    main.appendChild(content);
    container.appendChild(main);

    setTimeout(() => document.querySelector('input')?.focus(), 50);
}

function renderLearnMode(content) {
    const stepsHtml = state.activeLesson.example.steps.map((step, idx) => `
        <div class="flex items-center gap-3 animate-slide-up" style="animation-delay: ${idx * 150}ms">
            <div class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">${idx + 1}</div>
            <div class="text-lg text-slate-600 font-mono">${step}</div>
        </div>
    `).join('');

    const conceptKey = state.activeLesson.id.replace(/[0-9]/g, '') + state.activeLesson.id.match(/[0-9]+/)[0] + 'Concept';
    const conceptMap = {
        'b1': 'making10sConcept',
        'b2': 'subtractionGroupingConcept',
        'b3': 'roundingNearNumbersConcept',
        'm1': 'splitCombineFactorsConcept',
        'm2': 'distributiveLawConcept',
        'a1': 'sameTensComplementaryConcept',
        'a2': 'sumOfSequencesConcept'
    };
    const translatedConcept = i18n.t(conceptMap[state.activeLesson.id]) || state.activeLesson.concept;

    content.innerHTML = `
        <div class="space-y-6">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                <h3 class="text-blue-900 font-bold mb-2 flex items-center gap-2">
                    <i data-lucide="book-open" class="w-5 h-5"></i> ${i18n.t('theTechnique')}
                </h3>
                <p class="text-blue-800 leading-relaxed text-lg">${translatedConcept}</p>
            </div>
            <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="bg-slate-50 p-4 border-b border-slate-200 font-semibold text-slate-700">${i18n.t('walkthroughExample')}</div>
                <div class="p-6 space-y-4">
                    <div class="text-2xl font-mono text-center font-bold text-slate-800 bg-slate-100 p-4 rounded-lg">${state.activeLesson.example.problem}</div>
                    <div class="space-y-2">${stepsHtml}</div>
                </div>
            </div>
            <button onclick="setLessonMode('practice')" class="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2">
                ${i18n.t('startAdaptivePractice')} <i data-lucide="chevron-right" class="w-5 h-5"></i>
            </button>
        </div>
    `;
}

function renderPracticeMode(content) {
    if (!state.practiceProblem) nextPracticeProblem();

    const currentState = adaptiveEngine.getCurrentState(state.activeLesson.id);
    
    const topBar = `
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-4">
                <div class="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <i data-lucide="award" class="${state.practiceStreak > 0 ? 'text-amber-400' : 'text-slate-300'} w-5 h-5"></i>
                    ${i18n.t('streak')}: ${state.practiceStreak}
                </div>
                <div class="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <i data-lucide="target" class="w-4 h-4"></i>
                    ${i18n.t('level')} ${state.currentDifficulty}
                </div>
            </div>
            <button onclick="nextPracticeProblem()" class="text-sm text-emerald-600 font-medium flex items-center gap-1 hover:underline">
                ${i18n.t('skip')} <i data-lucide="refresh-cw" class="w-4 h-4"></i>
            </button>
        </div>
    `;

    let mainBox = '';
    if (state.practiceFeedback === 'correct') {
        const encouragement = state.practiceStreak >= 5 ? i18n.t('onFire') : state.practiceStreak >= 3 ? i18n.t('greatStreak') : i18n.t('excellent');
        mainBox = `
            <div class="animate-bounce-in">
                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="check-circle" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-green-700 mb-2">${encouragement}</h3>
                <p class="text-slate-600 mb-6">${i18n.t('thatsCorrect')}</p>
                <button onclick="nextPracticeProblem()" class="px-8 py-3 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800">${i18n.t('nextProblem')}</button>
            </div>
        `;
    } else {
        const isIncorrect = state.practiceFeedback === 'incorrect';
        mainBox = `
            <form onsubmit="event.preventDefault(); checkPracticeAnswer()" class="max-w-xs mx-auto">
                <input id="practice-input" type="number" step="any" autocomplete="off" placeholder="?" 
                    class="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 outline-none mb-4 ${isIncorrect ? 'border-red-300 bg-red-50 text-red-900' : 'border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 text-slate-800'}" />
                ${isIncorrect ? `<div class="text-red-500 font-medium mb-4 flex items-center justify-center gap-2"><i data-lucide="x-circle" class="w-4 h-4"></i> ${i18n.t('tryAgain')}</div>` : ''}
                <button type="submit" class="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 shadow-md">${i18n.t('checkAnswer')}</button>
                ${!state.showHint ? `<button type="button" onclick="toggleHint()" class="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mt-3"><i data-lucide="lightbulb" class="w-4 h-4"></i> ${i18n.t('needHint')}</button>` : ''}
                ${state.showHint ? `<div class="text-sm text-slate-600 mt-4 bg-amber-50 border border-amber-200 p-3 rounded-lg"><div class="flex items-start gap-2"><i data-lucide="lightbulb" class="w-4 h-4 text-amber-600 mt-0.5"></i><div><span class="font-bold text-amber-900">${i18n.t('hint')}:</span> ${state.practiceProblem.hint}</div></div></div>` : ''}
            </form>
        `;
    }

    content.innerHTML = `
        <div class="space-y-6">
            ${topBar}
            ${state.practiceProblem.isReview ? `<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 flex items-center gap-2"><i data-lucide="repeat" class="w-4 h-4"></i><span><strong>${i18n.t('review')}:</strong> ${state.practiceProblem.reviewLessonTitle}</span></div>` : ''}
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div class="text-4xl md:text-5xl font-mono font-bold text-slate-800 mb-8">${state.practiceProblem.q}</div>
                ${mainBox}
            </div>
            ${currentState.fatigueScore > 0.6 ? `<div class="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-center gap-2"><i data-lucide="coffee" class="w-4 h-4"></i><span>${i18n.t('takeBreak')}</span></div>` : ''}
        </div>
    `;
}

function renderTestMode(content) {
    if (state.testPhase === 'intro') {
        content.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-100">
                <div class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="timer" class="w-10 h-10"></i>
                </div>
                <h3 class="text-2xl font-bold text-slate-800 mb-2">${i18n.t('speedChallenge')}</h3>
                <p class="text-slate-600 mb-8 max-w-md mx-auto">${i18n.t('speedChallengeDesc')}</p>
                <button onclick="startTest()" class="w-full max-w-xs mx-auto py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 shadow-lg flex items-center justify-center gap-2">
                    ${i18n.t('startTest')} <i data-lucide="chevron-right" class="w-5 h-5"></i>
                </button>
            </div>
        `;
    } else if (state.testPhase === 'active') {
        const progress = ((state.testIndex + 1) / 10 * 100).toFixed(0);
        content.innerHTML = `
            <div>
                <div class="flex justify-between text-sm font-medium text-slate-500 mb-2">
                    <span>${i18n.t('question')} ${state.testIndex + 1} / 10</span>
                    <span>${progress}% ${i18n.t('complete')}</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2 mb-6">
                    <div class="bg-purple-600 h-2 rounded-full transition-all" style="width: ${progress}%"></div>
                </div>
                <div class="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                    <div class="text-4xl md:text-5xl font-mono font-bold text-slate-800 mb-8">${state.testQuestions[state.testIndex].q}</div>
                    <form onsubmit="event.preventDefault(); checkTestAnswer()" class="max-w-xs mx-auto">
                        <input id="test-input" type="number" step="any" autofocus autocomplete="off" placeholder="?" 
                            class="w-full text-center text-3xl font-bold py-4 rounded-xl border-2 outline-none mb-4 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-50 text-slate-800" />
                        <button type="submit" class="w-full py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 shadow-md">${i18n.t('submit')}</button>
                    </form>
                </div>
            </div>
        `;
    } else if (state.testPhase === 'summary') {
        const timeSeconds = (state.testEndTime - state.testStartTime) / 1000;
        const rating = getTestRating(state.testScore, timeSeconds);
        const reviewHtml = state.testQuestions.map((q, i) => {
            const userAns = state.testAnswers[i];
            const isCorrect = userAns !== null && Math.abs(userAns - q.a) < 0.01;
            return `
                <div class="flex items-center justify-between p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} mb-2 text-sm">
                    <div class="flex items-center gap-3">
                        <span class="font-mono font-bold text-slate-500 w-6">${i+1}.</span>
                        <span class="font-medium">${q.q}</span>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex flex-col items-end">
                            <span class="font-bold">${userAns !== null ? userAns : '-'}</span>
                            ${!isCorrect ? `<span class="text-xs text-slate-500">${i18n.t('score')}: ${q.a}</span>` : ''}
                        </div>
                        <i data-lucide="${isCorrect ? 'check' : 'x'}" class="w-4 h-4 text-${isCorrect ? 'green' : 'red'}-600"></i>
                    </div>
                </div>
            `;
        }).join('');

        content.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
                <div class="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="trophy" class="w-10 h-10"></i>
                </div>
                <h3 class="text-sm font-bold text-slate-400 uppercase mb-1">${i18n.t('testComplete')}</h3>
                <h2 class="text-3xl font-extrabold ${rating.color} mb-2">${rating.title}</h2>
                <p class="text-slate-600 mb-8">${rating.msg}</p>
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="bg-slate-50 p-4 rounded-lg">
                        <div class="text-slate-500 text-xs font-bold uppercase mb-1">${i18n.t('score')}</div>
                        <div class="text-2xl font-mono font-bold text-slate-800">${state.testScore}/10</div>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-lg">
                        <div class="text-slate-500 text-xs font-bold uppercase mb-1">${i18n.t('time')}</div>
                        <div class="text-2xl font-mono font-bold text-slate-800">${timeSeconds.toFixed(1)}s</div>
                    </div>
                </div>
                <div class="mt-8 text-left w-full max-w-md mx-auto">
                    <h4 class="font-bold text-slate-700 mb-4 text-sm uppercase">${i18n.t('reviewAnswers')}</h4>
                    <div class="space-y-2 max-h-96 overflow-y-auto">${reviewHtml}</div>
                </div>
                <div class="mt-8 flex gap-4 justify-center">
                    <button onclick="resetTest(); render()" class="text-slate-500 font-medium hover:text-purple-600 flex items-center gap-2">
                        <i data-lucide="refresh-cw" class="w-4 h-4"></i> ${i18n.t('tryAgainBtn')}
                    </button>
                    <button onclick="setLessonMode('practice')" class="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
                        <i data-lucide="dumbbell" class="w-4 h-4"></i> ${i18n.t('backToPractice')}
                    </button>
                </div>
            </div>
        `;
    }
}

function renderLayerADebugPanel() {
    const panel = document.createElement('div');
    panel.className = "bg-white rounded-xl p-6 shadow-sm border border-slate-200";
    
    const allSkills = ['b1', 'b2', 'b3', 'm1', 'm2', 'a1', 'a2'];
    const skillNames = {
        'b1': 'Making 10s',
        'b2': 'Subtraction Grouping',
        'b3': 'Rounding Near-Numbers',
        'm1': 'Split & Combine',
        'm2': 'Distributive Law',
        'a1': 'Same Tens',
        'a2': 'Sum of Sequences'
    };
    
    let skillsHtml = '';
    for (const skillId of allSkills) {
        const stats = adaptiveEngine.getDifficultyStatistics(skillId);
        if (stats.length === 0) continue;
        
        const diffBars = [1, 2, 3, 4, 5].map(diff => {
            const stat = stats.find(s => s.difficulty === diff);
            if (!stat) {
                return `<div class="flex-1 text-center p-2 bg-slate-50 rounded text-xs text-slate-400">-</div>`;
            }
            const successRate = (stat.successRate * 100).toFixed(0);
            const color = stat.successRate >= 0.75 ? 'bg-emerald-100 text-emerald-700' : 
                         stat.successRate >= 0.6 ? 'bg-blue-100 text-blue-700' : 
                         'bg-red-100 text-red-700';
            return `
                <div class="flex-1 text-center p-2 ${color} rounded">
                    <div class="text-xs font-bold">${successRate}%</div>
                    <div class="text-xs opacity-75">${stat.pulls}×</div>
                </div>
            `;
        }).join('');
        
        skillsHtml += `
            <div class="mb-4">
                <div class="text-sm font-semibold text-slate-700 mb-2">${skillNames[skillId]}</div>
                <div class="flex gap-1">${diffBars}</div>
                <div class="flex gap-1 mt-1 text-xs text-slate-500">
                    <div class="flex-1 text-center">D1</div>
                    <div class="flex-1 text-center">D2</div>
                    <div class="flex-1 text-center">D3</div>
                    <div class="flex-1 text-center">D4</div>
                    <div class="flex-1 text-center">D5</div>
                </div>
            </div>
        `;
    }
    
    panel.innerHTML = `
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="activity" class="w-5 h-5"></i> Layer A: Difficulty Adaptation
        </h3>
        <div class="text-xs text-slate-600 mb-4">
            Thompson Sampling success rate by difficulty level. Target: 70-80% accuracy.
        </div>
        ${skillsHtml || '<div class="text-sm text-slate-500">No data yet. Start practicing to see difficulty adaptation!</div>'}
    `;
    
    return panel;
}

function renderErrorAnalyticsPanel() {
    const panel = document.createElement('div');
    panel.className = "bg-white rounded-xl p-6 shadow-sm border border-slate-200";
    
    const commonErrors = adaptiveEngine.layerC.getMostCommonErrors(5);
    
    const errorNameMap = {
        'pairing_missed': 'Missed Pairing',
        'complement_error': 'Complement Error',
        'complement_missed': 'Missed Complement',
        'compensation_forgot': 'Forgot Compensation',
        'arithmetic_mistake': 'Arithmetic Error',
        'factoring_missed': 'Missed Factoring',
        'magic_pair_missed': 'Missed Magic Pair',
        'distributive_not_applied': 'Distributive Not Used',
        'tens_formula_error': 'Tens Formula Error',
        'formula_not_used': 'Formula Not Used',
        'calculation_error': 'Calculation Error'
    };
    
    let errorsHtml = '';
    if (commonErrors.length > 0) {
        errorsHtml = commonErrors.map(error => {
            const parts = error.key.split('_');
            const skillId = parts[0];
            const errorTag = parts.slice(1).join('_');
            const errorName = errorNameMap[errorTag] || errorTag.replace(/_/g, ' ');
            
            return `
                <div class="flex justify-between items-center p-2 bg-slate-50 rounded mb-2">
                    <div>
                        <span class="text-sm font-medium text-slate-700">${errorName}</span>
                        <span class="text-xs text-slate-500 ml-2">(${skillId.toUpperCase()})</span>
                    </div>
                    <span class="text-sm font-bold text-red-600">${error.count}×</span>
                </div>
            `;
        }).join('');
    } else {
        errorsHtml = '<div class="text-sm text-slate-500">No errors recorded yet. Keep practicing!</div>';
    }
    
    panel.innerHTML = `
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-5 h-5"></i> Layer C: Error Patterns
        </h3>
        <div class="text-xs text-slate-600 mb-4">
            Most common mistakes. The system learns which explanations work best for you.
        </div>
        <div class="mb-4">
            <div class="text-xs text-slate-600 mb-2 font-semibold">Top Errors:</div>
            ${errorsHtml}
        </div>
        <div class="mt-4 pt-4 border-t border-slate-200">
            <div class="text-xs text-slate-500 italic">
                💡 Tip: If you see the same error repeatedly, review the concept guide for that skill.
            </div>
        </div>
    `;
    
    return panel;
}

function renderReviewQueuePanel() {
    const panel = document.createElement('div');
    panel.className = "bg-white rounded-xl p-6 shadow-sm border border-slate-200";
    
    const stats = adaptiveEngine.getLayerBStats();
    const dueReviews = adaptiveEngine.getDueReviews();
    
    const skillNames = {
        'b1': 'Making 10s',
        'b2': 'Subtraction Grouping',
        'b3': 'Rounding Near-Numbers',
        'm1': 'Split & Combine',
        'm2': 'Distributive Law',
        'a1': 'Same Tens',
        'a2': 'Sum of Sequences'
    };
    
    let reviewListHtml = '';
    if (dueReviews.length > 0) {
        reviewListHtml = dueReviews.slice(0, 5).map(review => {
            const overdueDays = (Date.now() - review.nextReview) / (24 * 60 * 60 * 1000);
            const urgency = overdueDays > 3 ? 'text-red-600' : overdueDays > 1 ? 'text-amber-600' : 'text-blue-600';
            return `
                <div class="flex justify-between items-center p-2 bg-slate-50 rounded">
                    <span class="text-sm font-medium">${skillNames[review.skillId]}</span>
                    <span class="text-xs ${urgency}">${overdueDays > 0 ? Math.floor(overdueDays) + 'd overdue' : 'Due now'}</span>
                </div>
            `;
        }).join('');
    } else {
        reviewListHtml = '<div class="text-sm text-slate-500">No reviews due. Keep practicing!</div>';
    }
    
    panel.innerHTML = `
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="repeat" class="w-5 h-5"></i> Spaced Repetition Queue
        </h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
            <div class="bg-blue-50 p-3 rounded-lg">
                <div class="text-xs text-blue-600 font-semibold uppercase mb-1">Due Reviews</div>
                <div class="text-2xl font-bold text-blue-700">${stats.dueReviewsCount}</div>
            </div>
            <div class="bg-red-50 p-3 rounded-lg">
                <div class="text-xs text-red-600 font-semibold uppercase mb-1">Urgent</div>
                <div class="text-2xl font-bold text-red-700">${stats.urgentReviews}</div>
            </div>
        </div>
        <div class="text-xs text-slate-600 mb-2 font-semibold">Next Reviews:</div>
        <div class="space-y-2">${reviewListHtml}</div>
        <div class="mt-4 pt-4 border-t border-slate-200">
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                    <div class="font-bold text-slate-700">${(stats.avgMastery * 100).toFixed(0)}%</div>
                    <div class="text-slate-500">Avg Mastery</div>
                </div>
                <div>
                    <div class="font-bold text-emerald-600">${stats.skillsAbove70}</div>
                    <div class="text-slate-500">Mastered</div>
                </div>
                <div>
                    <div class="font-bold text-red-600">${stats.skillsBelow40}</div>
                    <div class="text-slate-500">Need Work</div>
                </div>
            </div>
        </div>
    `;
    
    return panel;
}

function renderSkillMasteryPanel() {
    const panel = document.createElement('div');
    panel.className = "bg-white rounded-xl p-6 shadow-sm border border-slate-200";
    
    const masteryData = adaptiveEngine.getSkillMasteryData();
    const skillNames = {
        'b1': 'Making 10s',
        'b2': 'Subtraction Grouping',
        'b3': 'Rounding Near-Numbers',
        'm1': 'Split & Combine',
        'm2': 'Distributive Law',
        'a1': 'Same Tens',
        'a2': 'Sum of Sequences'
    };
    
    const skillsWithData = masteryData.filter(s => s.attempts > 0);
    
    let masteryHtml = '';
    if (skillsWithData.length > 0) {
        masteryHtml = skillsWithData.map(skill => {
            const masteryPercent = (skill.mastery * 100).toFixed(0);
            const barColor = skill.mastery >= 0.7 ? 'bg-emerald-500' : 
                           skill.mastery >= 0.4 ? 'bg-blue-500' : 
                           'bg-slate-400';
            return `
                <div class="mb-3">
                    <div class="flex justify-between items-center mb-1">
                        <span class="text-sm font-medium text-slate-700">${skillNames[skill.skillId]}</span>
                        <span class="text-sm font-bold text-slate-800">${masteryPercent}%</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2">
                        <div class="${barColor} h-2 rounded-full transition-all" style="width: ${masteryPercent}%"></div>
                    </div>
                    <div class="text-xs text-slate-500 mt-1">${skill.attempts} attempts</div>
                </div>
            `;
        }).join('');
    } else {
        masteryHtml = '<div class="text-sm text-slate-500">No mastery data yet. Complete some practice sessions!</div>';
    }
    
    panel.innerHTML = `
        <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <i data-lucide="target" class="w-5 h-5"></i> Layer B: Skill Mastery
        </h3>
        <div class="text-xs text-slate-600 mb-4">
            EWMA-based mastery tracking. Goal: 70%+ for all skills.
        </div>
        ${masteryHtml}
    `;
    
    return panel;
}

function renderAnalytics(container) {
    const main = document.createElement('main');
    main.className = "max-w-4xl mx-auto p-4 space-y-6 w-full";

    const insights = adaptiveEngine ? adaptiveEngine.getInsights() : {
        totalQuestions: 0,
        overallAccuracy: 0,
        averageTime: 0,
        currentStreak: 0,
        recommendations: []
    };

    const summary = document.createElement('div');
    summary.className = "grid md:grid-cols-4 gap-4";
    
    const lang = i18n.getCurrentLanguage();
    const labels = lang === 'zh' ? 
        { total: '总题数', accuracy: '正确率', time: '平均用时', streak: '连胜' } :
        { total: 'Total Questions', accuracy: 'Accuracy', time: 'Avg Time', streak: 'Streak' };
    
    summary.innerHTML = `
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div class="text-slate-500 text-xs font-bold uppercase mb-2">${labels.total}</div>
            <div class="text-3xl font-bold text-slate-800">${insights.totalQuestions}</div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div class="text-slate-500 text-xs font-bold uppercase mb-2">${labels.accuracy}</div>
            <div class="text-3xl font-bold text-emerald-600">${insights.totalQuestions > 0 ? (insights.overallAccuracy * 100).toFixed(1) : '0'}%</div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div class="text-slate-500 text-xs font-bold uppercase mb-2">${labels.time}</div>
            <div class="text-3xl font-bold text-blue-600">${insights.totalQuestions > 0 ? insights.averageTime : '0'}s</div>
        </div>
        <div class="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <div class="text-slate-500 text-xs font-bold uppercase mb-2">${labels.streak}</div>
            <div class="text-3xl font-bold text-amber-600">${insights.currentStreak}</div>
        </div>
    `;
    main.appendChild(summary);

    if (insights.recommendations.length > 0) {
        const recs = document.createElement('div');
        recs.className = "bg-white rounded-xl p-6 shadow-sm border border-slate-200";
        recs.innerHTML = `
            <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i data-lucide="lightbulb" class="w-5 h-5"></i> ${i18n.t('aiRecommendations')}
            </h3>
            <div class="space-y-3">
                ${insights.recommendations.map(rec => `
                    <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <i data-lucide="${rec.type === 'challenge' ? 'zap' : rec.type === 'rest' ? 'coffee' : 'repeat'}" class="w-5 h-5 text-blue-600 mt-0.5"></i>
                        <p class="text-sm text-slate-700">${rec.message}</p>
                    </div>
                `).join('')}
            </div>
        `;
        main.appendChild(recs);
    }

    // Layer A Debug Panel
    if (adaptiveEngine && adaptiveEngine.layerA) {
        const debugPanel = renderLayerADebugPanel();
        main.appendChild(debugPanel);
    }

    // Skill Mastery Panel
    if (adaptiveEngine && adaptiveEngine.layerB) {
        const masteryPanel = renderSkillMasteryPanel();
        main.appendChild(masteryPanel);
        
        // Review Queue Stats
        const reviewPanel = renderReviewQueuePanel();
        main.appendChild(reviewPanel);
    }

    // Layer C Error Analytics
    if (adaptiveEngine && adaptiveEngine.layerC) {
        const errorPanel = renderErrorAnalyticsPanel();
        main.appendChild(errorPanel);
    }

    const actions = document.createElement('div');
    actions.className = "flex justify-center pt-6";
    actions.innerHTML = `
        <button onclick="if(window.adaptiveEngine && adaptiveEngine.resetProgress()) location.reload()" class="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-2">
            <i data-lucide="trash-2" class="w-4 h-4"></i> ${i18n.t('resetProgress')}
        </button>
    `;
    main.appendChild(actions);

    container.appendChild(main);
}

// Language toggle function
function toggleLanguage() {
    i18n.toggleLanguage();
    render();
}

// Global exports
window.setView = setView;
window.setLessonMode = setLessonMode;
window.nextPracticeProblem = nextPracticeProblem;
window.checkPracticeAnswer = checkPracticeAnswer;
window.toggleHint = toggleHint;
window.startTest = startTest;
window.checkTestAnswer = checkTestAnswer;
window.resetTest = resetTest;
window.toggleLanguage = toggleLanguage;

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
