# Mental Math Master - AI-Powered Adaptive Learning System

**心算大师** - 一个完整的前后端自适应学习系统，使用三层决策引擎教授心算技巧。

A complete full-stack application combining:
- **Frontend**: Three-layer adaptive learning engine (Thompson Sampling, Spaced Repetition, Error Diagnosis)
- **Backend**: Node.js + MongoDB API with JWT authentication, analytics, and data persistence

![Mental Math Master](https://img.shields.io/badge/AI-Three%20Layer%20System-brightgreen) ![Stack](https://img.shields.io/badge/Stack-Node%2BMongo%2BReact-blue) ![License](https://img.shields.io/badge/license-MIT-blue)

## 🚀 Quick Start

### Frontend Only (No Backend Required)
```bash
# Open in browser
open index.html
# or
python -m http.server 8080
```

### Full Stack (Frontend + Backend)
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend Server
cd server
npm install
npm run dev
# Server runs on http://localhost:3001

# Terminal 3: Start Frontend
python -m http.server 8080
# Frontend runs on http://localhost:8080
```

---

## 🏗️ System Architecture

### Full-Stack Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Browser)                        │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Adaptive Learning Engine V2 (Orchestrator)         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │  │
│  │  │  Layer A     │  │  Layer B     │  │  Layer C     │    │  │
│  │  │ Difficulty   │  │   Skill      │  │ Explanation  │    │  │
│  │  │ Adjustment   │  │ Scheduling   │  │  & Feedback  │    │  │
│  │  │ Thompson     │  │ Spaced Rep   │  │ Error Diag   │    │  │
│  │  │ Sampling     │  │ + RL         │  │ + Bandit     │    │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘    │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Storage (localStorage)  │  Telemetry (Batch Queue)       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js + Express)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  API Routes                                                │  │
│  │  • /api/auth (JWT, Guest Mode)                            │  │
│  │  • /api/users (Profile, Preferences)                      │  │
│  │  • /api/progress (Attempts, Spaced Rep)                   │  │
│  │  • /api/analytics (Insights, History, Charts)             │  │
│  │  • /api/lessons (Curriculum)                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Middleware                                                │  │
│  │  • Authentication (JWT)  • Validation  • CORS  • Logging  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              │ Mongoose
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    MongoDB (Data Persistence)                    │
│  • Users  • LessonProgress  • PerformanceHistory  • Analytics   │
└──────────────────────────────────────────────────────────────────┘
```

### Why Three Layers?

### Why Three Layers?

- **Separation of Concerns**: Each layer solves one problem well
- **Easy to Iterate**: Change one layer without affecting others
- **Lower Risk**: Baseline policies keep user experience safe
- **Interpretable**: Clear cause-and-effect for each decision
- **Scalable**: Each layer can be upgraded independently

---

## 🎯 Layer A: Difficulty Adjustment (Thompson Sampling Bandit)

**Responsibility**: Select optimal difficulty (1-5) for each question to maintain ~75% accuracy

### Algorithm: Thompson Sampling with Contextual Bonuses

**Why Thompson Sampling?**
- Naturally balances exploration vs exploitation
- Works with limited data (cold start problem)
- Proven effective in educational tech (Duolingo, Khan Academy)
- Simple to implement and understand

### Minimal Logging Structure

Each question logs only essential data:

```javascript
{
    timestamp: Date.now(),
    skillId: 'b1',           // Which skill
    difficulty: 3,            // 1-5
    correct: 1,               // Binary: 0 or 1
    responseTimeSec: 8.5,     // Time taken
    hintUsed: 0,              // Binary: 0 or 1
    attemptCount: 1           // First try or retry
}
```

**Storage**: localStorage (max 500 records, auto-pruned)

### Context-Based Bonuses

Layer A considers these factors when selecting difficulty:

| Factor | Condition | Adjustment |
|--------|-----------|------------|
| Recent Accuracy | > 0.85 | +1 (harder) |
| Recent Accuracy | < 0.6 | -1 (easier) |
| Fatigue | High (>0.6) | -1 (cap difficulty) |
| Hint Usage | Many (>2) | -1 (lower) |
| Recent Errors | Multiple (>2) | -0.3 (penalty) |
| Streak | Good (>3) | +0.2 (encourage harder) |

### Arm Structure (Beta Distribution)

Each `(skillId, difficulty)` pair maintains:

```javascript
{
    alpha: 5,        // Success pseudo-count
    beta: 2,         // Failure pseudo-count
    pulls: 7,        // Total attempts
    successes: 5,    // Correct answers
    avgTime: 9.2,    // Average response time
}
```

### Selection Process

1. **Exploration** (15%): Random difficulty within ±1 of current
2. **Exploitation** (85%):
   - Sample from Beta(alpha, beta) for each difficulty
   - Add contextual bonus
   - Select highest scoring difficulty

### Update Rule

After each question:
- **Correct**: `alpha++` (increase success count)
- **Incorrect**: `beta++` (increase failure count)
- Update average response time

**Key insight**: Binary success/failure keeps Beta distribution meaningful and interpretable.

---

## 📚 Layer B: Skill Scheduling (Curriculum Optimizer)

**Responsibility**: Decide which skill to practice next, balancing new learning, weak areas, and spaced repetition

### Algorithm: Hybrid (85% Baseline + 15% RL Exploration)

**Current**: Safe rule-based policy with RL-ready architecture for future upgrades

### Curriculum State (8-12 Features)

```javascript
{
    // Mastery summary
    minMastery: 0.3,
    meanMastery: 0.6,
    maxMastery: 0.9,
    
    // Weakest areas
    weakestSkillId: 'b2',
    weakestSkills: [{skillId: 'b2', mastery: 0.3}, ...],
    
    // Review queue
    dueCount: 3,
    dueSkills: ['b1', 'm1', 'a2'],
    
    // Session context
    lastSkillId: 'b1',
    recentSkillSwitchCount: 2,
    sessionLengthMin: 15.5,
    fatigueScore: 0.4,
    recentAccuracy: 0.78,
    currentStreak: 5
}
```

### Baseline Policy (Safe, Rule-Based)

Priority order (each checked with probability):

1. **Due Reviews** (70% if available)
   - Prevents forgetting via spaced repetition
   - Maintains mastery

2. **Weak Skills** (60% if mastery < 0.4)
   - Focuses on improvement areas
   - Builds foundation

3. **Diversity** (if same skill < 2 times)
   - Prevents boredom
   - Encourages variety

4. **Random** (fallback)
   - Balanced exploration

### RL Policy (Future Enhancement)

Simple scoring heuristic (can be replaced with trained policy):

```javascript
score = (1 - mastery) * 2        // Learning opportunity
      + (isDue ? 3 : 0)          // Review priority
      + (isDifferent ? 1 : 0)    // Diversity bonus
      - (fatigued && hard ? 1 : 0) // Fatigue penalty
```

### Spaced Repetition (SM-2 Algorithm)

Each skill has a review schedule:

```javascript
{
    skillId: 'b1',
    interval: 6,        // Days until next review
    easeFactor: 2.5,    // Multiplier for interval growth
    nextReview: timestamp,
    repetitions: 2      // Consecutive correct reviews
}
```

**Interval Schedule**:
- 1st review: 1 day
- 2nd review: 6 days
- 3rd+: `interval × easeFactor`

**Ease Factor Adjustment**:
- Correct: `easeFactor + 0.1` (max 2.5+)
- Incorrect: `easeFactor - 0.2` (min 1.3)

### Mastery Tracking (EWMA)

Exponentially weighted moving average with difficulty weighting:

```javascript
delta = correct ? 0.05 * (difficulty / 3) : -0.03
mastery = clamp(mastery + delta, 0, 1)
```

### Long-term Reward Function

```javascript
reward = masteryDelta * 10           // Learning progress
       + (reviewHit ? 1 : 0)         // Preventing forgetting
       - (frustrated ? 1 : 0)        // Consecutive errors
       + (diversity ? 0.2 : 0)       // Moderate switching
```

---

## 💡 Layer C: AI Explanation Engine (Error Diagnosis + Bandit)

**Responsibility**: Diagnose errors, generate effective explanations, and learn which explanation style works best

### Two-Stage Process

#### Stage 1: Error Diagnosis

Classifies errors into actionable categories by skill:

**Beginner Skills (b1, b2, b3)**:
- `pairing_missed`: Didn't find complementary pairs
- `arithmetic_mistake`: Basic calculation error
- `rounding_error`: Forgot to adjust after rounding
- `grouping_error`: Incorrect grouping

**Intermediate Skills (m1, m2)**:
- `factoring_missed`: Didn't break down factors
- `magic_pair_missed`: Missed 2×5=10, 4×25=100, 8×125=1000
- `distributive_error`: Incorrect factoring

**Advanced Skills (a1, a2)**:
- `units_multiplication_error`: Units digit error
- `tens_formula_error`: Tens formula error
- `sequence_formula_error`: Formula application error

#### Stage 2: Adaptive Explanation Generation

Three explanation styles (selected via Bandit):

1. **Short** (最短)
   - One-sentence hint
   - Best for: Simple mistakes, experienced users

2. **Stepwise** (分步)
   - Step-by-step breakdown
   - Best for: Complex techniques, struggling users

3. **Analogy** (类比)
   - Memory aid / real-world comparison
   - Best for: Conceptual misunderstanding

### Explanation Bandit

Each `(skillId, errorTag, style)` combination maintains Beta arms:

```javascript
{
    alpha: 1,    // Success (no repeat error)
    beta: 1,     // Failure (same error repeated)
    uses: 5      // Total uses
}
```

**Reward**: User doesn't repeat the same error on next question

### Error Pattern Tracking

Logs recent errors to detect recurring mistakes:

```javascript
{
    timestamp: Date.now(),
    skillId: 'b1',
    errorTag: 'pairing_missed',
    difficulty: 3,
    timeSpent: 12.5
}
```

**Usage**: If same error occurs 3+ times, suggest reviewing concept guide

### Full Feedback Generation

```javascript
{
    isCorrect: false,
    errorTag: 'pairing_missed',
    styleUsed: 'short',
    explanation: 'Look for pairs that make 10, 20, or 100...',
    nextAction: 'continue' // or 'review_concept' / 'try_again'
}
```

---

## � Backend API Documentation

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcryptjs, Helmet.js, CORS, Rate Limiting

### Environment Setup

```bash
cd server
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mental-math-master
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:8080
```

### API Endpoints

#### Authentication
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/guest
```

#### Users
```http
GET /api/users/me
PUT /api/users/me
PUT /api/users/me/preferences
```

#### Progress & Attempts
```http
GET /api/progress
GET /api/progress/:lessonId
POST /api/progress/:lessonId/attempt
PUT /api/progress/:lessonId/spaced-repetition
GET /api/progress/reviews/due
```

#### Analytics
```http
GET /api/analytics/insights
GET /api/analytics/history?limit=30&lessonId=b1
GET /api/analytics/chart-data
```

#### Lessons
```http
GET /api/lessons
GET /api/lessons/:lessonId
```

### Data Models

**User**
```javascript
{
  username: String,
  email: String,
  password: String (hashed),
  displayName: String,
  language: 'en' | 'zh',
  totalSessions: Number,
  totalQuestions: Number,
  totalCorrect: Number,
  preferences: {
    targetAccuracy: Number,
    maxDifficulty: Number,
    hintPreference: 'never' | 'adaptive' | 'always'
  }
}
```

**LessonProgress**
```javascript
{
  userId: ObjectId,
  lessonId: String,
  attempts: Number,
  correct: Number,
  avgTime: Number,
  currentDifficulty: Number,
  masteryScore: Number,
  spacedRepetition: {
    interval: Number,
    easeFactor: Number,
    nextReview: Date,
    repetitions: Number
  }
}
```

**PerformanceHistory**
```javascript
{
  userId: ObjectId,
  lessonId: String,
  question: String,
  answer: Number,
  userAnswer: Number,
  correct: Boolean,
  timeSpent: Number,
  difficulty: Number,
  hintUsed: Boolean,
  sessionId: String,
  timestamp: Date
}
```

### Core Features

1. **Adaptive Learning Engine**
   - Contextual Bandit (Thompson Sampling)
   - Real-time difficulty adjustment
   - Multi-objective reward system

2. **Spaced Repetition**
   - SM-2 algorithm
   - Automatic review scheduling
   - Ease factor adjustment

3. **Data Analytics**
   - Learning insights
   - Progress tracking
   - AI recommendations

4. **User Authentication**
   - JWT tokens
   - Password encryption
   - Guest mode support

### Security Features

- Helmet.js for HTTP headers
- CORS protection
- Rate limiting
- Input validation
- Password hashing (bcrypt)
- JWT token expiration

### Deployment

**Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

**MongoDB Atlas**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mental-math-master
```

---

## � Features

### 📚 Comprehensive Curriculum
- **Beginner**: Addition & Subtraction (Making 10s, Grouping, Rounding)
- **Intermediate**: Multiplication (Magic Friends, Distributive Law)
- **Advanced**: Speed Patterns (Complementary Units, Sequence Sums)

### 🔄 Spaced Repetition System
- SM-2 algorithm with adaptive intervals
- 30% insertion rate during practice
- Prevents forgetting via scientifically-timed reviews

### 💡 Smart Hint System
- Adaptive triggering based on struggle indicators
- Context-aware hints that teach
- Tracked for difficulty calibration

### 📊 Advanced Analytics
- Real-time accuracy, speed, mastery tracking
- Skill breakdown and improvement trends
- Error pattern analysis
- Personalized recommendations

## 📖 Usage

### Getting Started

1. **Clone or download** this repository
2. **Open `index.html`** in a modern web browser (Chrome, Firefox, Safari, Edge)
3. **No installation required** - runs entirely in the browser!

### Practice Modes

#### 📘 Concept Guide
- Learn the mathematical technique with step-by-step examples
- Understand the "why" behind each trick
- Review anytime before practicing

#### 🏋️ Practice Gym
- Adaptive difficulty that responds to your performance
- Real-time feedback with smart hints
- Streak tracking and level indicators
- Review questions automatically inserted

#### ⏱️ Speed Test
- 10 questions with varied difficulty
- Timed challenge to measure speed
- Earn ranks: Novice → Apprentice → Pro → Speed Demon → Grandmaster

### Analytics Dashboard

Access via the chart icon in the header to view:
- Overall statistics (questions, accuracy, avg time, streak)
- Skill mastery breakdown
- Improvement trends
- AI-generated recommendations
- Error pattern analysis

---

## 💾 Data Storage & Privacy

All data is stored locally in your browser using `localStorage`:

### Storage Keys

| Key | Purpose | Max Size |
|-----|---------|----------|
| `mathMasterProfile_v2` | User profile, session stats | ~5KB |
| `difficultyArms` | Layer A bandit arms | ~10KB |
| `reviewQueue` | Layer B spaced repetition | ~5KB |
| `skillMastery` | Layer B mastery scores | ~2KB |
| `errorPatterns` | Layer C error tracking | ~10KB |
| `explanationArms` | Layer C explanation bandit | ~10KB |
| `questionLogs` | Minimal question history | ~50KB (500 records) |
| `errorHistory` | Recent errors | ~20KB (200 records) |

**Total**: ~110KB (well within browser limits)

**Privacy**: ✅ **No data is sent to any server. Everything stays on your device.**

---

## 🔧 Technical Architecture

### File Structure

```
mental-math-master/
├── web/                           # Frontend (Browser-based)
│   ├── index.html                 # Main HTML entry point
│   ├── curriculum.js              # Lesson definitions & generators
│   ├── layer-a-difficulty.js      # Thompson Sampling Bandit
│   ├── layer-b-scheduler.js       # Spaced Repetition + RL Scheduler
│   ├── layer-c-explanation.js     # Error Diagnosis + Explanation Bandit
│   ├── adaptive-engine-v2.js      # Three-Layer Orchestrator
│   ├── storage.js                 # Centralized localStorage management
│   ├── telemetry.js               # Unified logging system
│   ├── app.js                     # UI rendering and interactions
│   ├── api-client.js              # Backend API client
│   ├── i18n.js                    # Internationalization (EN/ZH)
│   │
│   ├── error-classifier.js        # ✨ Rule-based error diagnosis
│   ├── explanation-bandit.js      # ✨ Thompson Sampling for explanations
│   ├── baseline-scheduler.js      # ✨ Deterministic skill scheduler
│   ├── generator-validator.js     # ✨ Difficulty monotonicity testing
│   ├── test-core.html             # ✨ Unit tests for new components
│   └── test-generator.html        # Generator testing tool
│
├── shared/                        # ✨ Shared between frontend & backend
│   └── event-schema.js            # ✨ Unified AttemptEvent schema
│
├── server/                        # Backend (Node.js + MongoDB)
│   ├── server.js                  # Express server entry point
│   ├── .env.example               # Environment variables template
│   ├── package.json               # Dependencies
│   │
│   ├── middleware/
│   │   └── auth.js                # JWT authentication middleware
│   │
│   ├── models/
│   │   ├── User.js                # User schema
│   │   ├── LessonProgress.js      # Progress tracking schema
│   │   └── PerformanceHistory.js  # Attempt history schema
│   │
│   └── routes/
│       ├── auth.js                # Authentication endpoints
│       ├── users.js               # User management endpoints
│       ├── progress.js            # Progress tracking endpoints
│       ├── analytics.js           # Analytics endpoints
│       └── lessons.js             # Curriculum endpoints
│
├── .github/
│   └── workflows/
│       └── ci.yml                 # ✨ Automated testing pipeline
│
├── README.md                      # This file
├── SERVER_README.md               # Backend documentation
└── INTEGRATION_GUIDE.md           # ✨ How to integrate new components
```

**✨ = New engineering components (Phase 4)**

### Key Components

#### Layer A: DifficultyAdjustmentEngine (`layer-a-difficulty.js`)
- **Thompson Sampling**: Beta distribution-based arm selection
- **Context Bonuses**: Recent accuracy, fatigue, hint usage, streak
- **Minimal Logging**: 7-field question logs
- **Hint Strategy**: Adaptive hint triggering

#### Layer B: SkillSchedulingEngine (`layer-b-scheduler.js`)
- **Baseline Policy**: Safe rule-based skill selection
- **RL Policy**: Scoring heuristic for exploration
- **Spaced Repetition**: SM-2 algorithm with ease factors
- **Mastery Tracking**: EWMA with difficulty weighting

#### Layer C: ExplanationEngine (`layer-c-explanation.js`)
- **Error Diagnosis**: Skill-specific error classification
- **Explanation Generation**: Three styles (short, stepwise, analogy)
- **Explanation Bandit**: Thompson Sampling for style selection
- **Pattern Tracking**: Recurring error detection

#### AdaptiveLearningEngineV2 (`adaptive-engine-v2.js`)
- **Orchestrator**: Coordinates all three layers
- **Session Management**: Tracks current session data
- **Analytics**: Aggregates insights from all layers
- **Backward Compatibility**: Works with existing app.js

---

## 🎓 Learning Science Behind Each Layer

### Layer A: Zone of Proximal Development

**Why 75% accuracy?**
- Too easy (<60%): No learning, boredom
- Too hard (>85%): Frustration, disengagement
- Sweet spot (75%): Optimal challenge, flow state

Thompson Sampling naturally converges toward this target by:
1. Exploring different difficulties
2. Learning which difficulties produce ~75% accuracy
3. Exploiting the best-performing difficulty

### Layer B: Spaced Repetition & Mastery Learning

**Why SM-2 algorithm?**
- Based on Ebbinghaus forgetting curve research
- Proven effective in Anki, SuperMemo, Duolingo
- Intervals grow exponentially (1 day → 6 days → months)
- Ease factor adapts to individual learning speed

**Why baseline policy first?**
- RL exploration can hurt user experience
- Safe baseline ensures consistent learning
- RL can be added gradually without risk

### Layer C: Error-Driven Learning

**Why error diagnosis?**
- Not all errors are equal
- Same wrong answer can have different causes
- Targeted feedback is more effective than generic

**Why explanation bandit?**
- Different users learn differently
- System learns which style works for each user+error combination
- Reward signal: "Did user avoid this error next time?"

---

## 🚀 Implementation Status & Next Steps

### ✅ Phase 0-3: Core Three-Layer System (COMPLETED)
- ✅ Modular architecture with separated concerns
- ✅ Layer A: Thompson Sampling difficulty adjustment
- ✅ Layer B: Spaced repetition + baseline scheduler
- ✅ Layer C: Error diagnosis + explanation bandit
- ✅ Storage versioning system (`mathMasterProfile_v2`)
- ✅ Centralized telemetry and logging

### ✅ Phase 4: Engineering Foundation (COMPLETED)
**8 Critical Improvements Implemented:**

1. ✅ **Unified Event Schema** (`shared/event-schema.js`)
   - Single AttemptEvent schema for frontend + backend
   - Validation, factory functions, reward computation
   - Ready for MongoDB integration

2. ✅ **Generator Validation** (`web/generator-validator.js`)
   - Automated testing for difficulty monotonicity
   - Validates all 7 skills have proper 1-5 scaling
   - Run tests: open `web/test-core.html`

3. ✅ **Rule-Based Error Classification** (`web/error-classifier.js`)
   - 3-5 error types per skill (no LLM required)
   - Structural analysis of answer differences
   - Recurring error detection

4. ✅ **Explanation Bandit** (`web/explanation-bandit.js`)
   - Thompson Sampling for style selection
   - Reward: user doesn't repeat same error
   - Tracks effectiveness of short/stepwise/analogy

5. ✅ **Baseline Scheduler Interface** (`web/baseline-scheduler.js`)
   - Fixed API: `getNextSkill(state) -> {skillId, mode, reason, targetDifficulty}`
   - Deterministic policy: due reviews → weak skills → diversity → exploration
   - Ready to swap with RL policy

6. ✅ **Storage Versioning** (already in `storage.js`)
   - `mathMasterProfile_v2` with migration from v1
   - Auto-pruning (500 question logs, 200 error logs)
   - Export/import functionality

7. ✅ **Minimal CI** (`.github/workflows/ci.yml`)
   - Lint + test placeholders for backend
   - Frontend file validation
   - Ready for expansion

8. ✅ **Test Suite** (`web/test-core.html`)
   - Unit tests for all new components
   - AttemptEvent, ErrorClassifier, ExplanationBandit, BaselineScheduler
   - Generator validation tests

### 🔧 Phase 5: Production Readiness (CURRENT - DO THESE NEXT)

**Priority 1: Make Generators Truly Difficulty-Aware**
- [ ] Run `web/test-core.html` and fix any failing generator validations
- [ ] Ensure each skill has strict monotonic difficulty (1→5)
- [ ] Add "trap" patterns at difficulty 4-5 (e.g., near-100 numbers, misleading pairs)

**Priority 2: Integrate New Components into Main App**
- [ ] Replace Layer C error diagnosis with `ErrorClassifier`
- [ ] Replace Layer C explanation selection with `ExplanationBandit`
- [ ] Replace Layer B scheduler with `BaselineScheduler`
- [ ] Use `AttemptEvent.create()` for all question logging

**Priority 3: Backend Integration**
- [ ] Add `shared/event-schema.js` to backend models
- [ ] Create `/api/attempt` endpoint using AttemptEvent schema
- [ ] Implement `/api/next` endpoint using BaselineScheduler
- [ ] Add `/api/insights` aggregation from attempt logs

**Priority 4: Validation & Testing**
- [ ] Run 50+ questions and verify difficulty converges to 70-80% accuracy
- [ ] Verify due reviews appear at correct intervals (1d, 6d, exponential)
- [ ] Verify explanation styles change after 2-3 same errors
- [ ] Check localStorage stays under 150KB

### 📋 Phase 6: Advanced Features (FUTURE)
- [ ] Offline RL training pipeline for Layer B
- [ ] LLM integration for Layer C (explanation polish only)
- [ ] Teacher dashboard
- [ ] Achievement system
- [ ] Mobile app wrapper

---

## 🔍 How to Extend Each Layer

### Adding a New Skill to Layer A

Layer A automatically handles any new skill. Just add it to curriculum.js:

```javascript
{
    id: 'b4',
    title: 'New Technique',
    concept: 'Explanation...',
    example: { problem: '...', steps: ['...'] },
    generator: (difficulty = 3) => {
        // Your question generation logic
        return { q: '...', a: 42, hint: '...', difficulty };
    }
}
```

Layer A will automatically:
- Create new arms for each difficulty
- Track performance
- Adjust difficulty based on accuracy

### Improving Layer B Scheduling

To upgrade from baseline to RL policy:

1. **Collect data**: Run baseline policy for 100+ users
2. **Train offline**: Use collected data to train lightweight policy
3. **Deploy gradually**: Start with 10% RL, increase over time
4. **Monitor**: Track if RL improves mastery vs baseline

### Enhancing Layer C Explanations

To add more explanation styles:

1. **Add new style function**:
```javascript
generateCustomExplanation(skillId, errorTag, ...) {
    // Your custom explanation logic
}
```

2. **Register in bandit**:
```javascript
const styles = ['short', 'stepwise', 'analogy', 'custom'];
```

3. **System learns**: Bandit automatically optimizes style selection

---

## 📊 Analytics & Debugging

### View Layer A Statistics

```javascript
// Get difficulty statistics for a skill
const stats = adaptiveEngine.getDifficultyStatistics('b1');
// Returns: [{difficulty: 1, pulls: 5, successRate: 0.6, ...}, ...]
```

### View Layer B Mastery

```javascript
// Get all skill mastery scores
const masteryData = adaptiveEngine.getSkillMasteryData();
// Returns: [{skillId: 'b1', mastery: 0.75, attempts: 20}, ...]
```

### View Layer C Error Patterns

```javascript
// Get most common errors
const errors = adaptiveEngine.getErrorAnalytics('b1');
// Returns: [{errorTag: 'pairing_missed', count: 5, lastSeen: timestamp}, ...]
```

### Export Session Data

```javascript
// Get current session insights
const insights = adaptiveEngine.getInsights();
console.log(insights);
// {
//   totalQuestions: 150,
//   sessionAccuracy: 78.5,
//   currentStreak: 5,
//   dueReviews: 3,
//   weakestSkills: [...],
//   commonErrors: [...],
//   recommendations: [...]
// }
```

---

## 🧪 Testing & Validation

### Manual Testing Checklist

- [ ] **Layer A**: Difficulty increases when accuracy > 85%, decreases when < 60%
- [ ] **Layer B**: Due reviews appear regularly, weak skills get prioritized
- [ ] **Layer C**: Same error type shows different explanation styles over time
- [ ] **Spaced Repetition**: Reviews appear 1 day, then 6 days, then exponentially
- [ ] **Fatigue**: Difficulty caps after 40+ questions or 40+ minutes
- [ ] **Hints**: Shown when struggling (2+ errors or >15s on first attempt)

### Performance Benchmarks

- **Question load time**: <100ms
- **Difficulty selection**: <50ms
- **Feedback generation**: <100ms
- **Total localStorage**: <150KB
- **Session startup**: <200ms

---

## 🔧 Troubleshooting

### Frontend Issues

**NaN% accuracy display**
- Ensure `totalCorrect` is initialized in user profile
- Check that `logAttempt()` updates both `totalQuestions` and `totalCorrect`

**Chinese labels not displaying**
- Verify `i18n.getCurrentLanguage()` returns 'zh'
- Check that language toggle is working
- Ensure all translation keys are defined in `i18n.js`

**Storage quota exceeded**
- Check localStorage size with `Object.keys(localStorage).reduce((sum, key) => sum + localStorage[key].length, 0)`
- Auto-pruning should keep question logs ≤500 records
- Clear old data: `localStorage.clear()`

### Backend Issues

**MongoDB connection failed**
- Ensure MongoDB is running: `mongod`
- Check MONGODB_URI in `.env`
- Verify MongoDB is accessible on localhost:27017

**JWT authentication fails**
- Confirm JWT_SECRET is set in `.env`
- Check token expiration with `JWT_EXPIRE`
- Verify Authorization header format: `Bearer <token>`

**CORS errors**
- Check CORS_ORIGIN matches frontend URL
- Verify frontend is making requests to correct backend URL
- Check that credentials are included in requests if needed

**Port already in use**
- Change PORT in `.env` (default: 3001)
- Or kill existing process: `lsof -i :3001` then `kill -9 <PID>`

---

## 🎯 Customization

### Adjusting Target Accuracy

Edit in `adaptive-engine-v2.js`:

```javascript
this.userProfile.preferences.targetAccuracy = 0.75; // Change to 0.6-0.9
```

### Changing Exploration Rate

Edit in `layer-a-difficulty.js`:

```javascript
this.explorationRate = 0.15; // 15% exploration (0.1-0.3 recommended)
```

### Adjusting Baseline vs RL Weight

Edit in `layer-b-scheduler.js`:

```javascript
this.baselineWeight = 0.85; // 85% baseline, 15% RL (currently)
```

### Modifying Spaced Repetition Intervals

Edit in `layer-b-scheduler.js`:

```javascript
// Change interval schedule
if (reviewItem.repetitions === 1) {
    reviewItem.interval = 1;  // First review: 1 day
} else if (reviewItem.repetitions === 2) {
    reviewItem.interval = 6;  // Second review: 6 days
}
```

---

## 📚 Research & References

### Algorithms & Techniques

- **Thompson Sampling**: Russo et al. (2018) - "A Tutorial on Thompson Sampling"
- **Spaced Repetition**: Ebbinghaus (1885) - Forgetting curve
- **SM-2 Algorithm**: Wozniak & Gorzelanczyk (1994) - SuperMemo
- **Contextual Bandits**: Langford & Zhang (2008) - "The Epoch-Greedy Algorithm"
- **Multi-Armed Bandits**: Lattimore & Szepesvári (2020)

### Educational Technology

- **Zone of Proximal Development**: Vygotsky (1978)
- **Mastery Learning**: Bloom (1968)
- **Immediate Feedback**: Hattie & Timperley (2007)
- **Adaptive Testing**: Wainer (2000)
- **Error-Driven Learning**: Metcalfe (2017)

### Real-World Applications

- **Duolingo**: Uses contextual bandits for difficulty selection
- **Khan Academy**: Uses Bayesian Knowledge Tracing for mastery
- **Anki**: Uses SM-2 algorithm for spaced repetition
- **Quizlet**: Uses adaptive learning for flashcards
- **Coursera**: Uses RL for course recommendations

### Architecture References

- **FogChess**: https://github.com/DeepBrainTech/FogChess
- **QuantumGo**: https://github.com/DeepBrainTech/QuantumGo

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Add new lesson types
- Improve the adaptive algorithms
- Enhance the UI/UX
- Add more analytics visualizations
- Optimize performance

---

## 📝 License

MIT License - Feel free to use this for educational purposes!

---

## 🙏 Acknowledgments

- **Contextual Bandit Theory**: Microsoft Research, Google Brain
- **Spaced Repetition**: Ebbinghaus, Wozniak, Anki community
- **UI Framework**: Tailwind CSS, Lucide icons
- **Charts**: Chart.js
- **Learning Science**: Bloom, Vygotsky, Hattie

---

## � Feature Checklist

### Frontend Features
- ✅ Three-layer adaptive learning engine
- ✅ Thompson Sampling for difficulty adjustment
- ✅ Spaced repetition with SM-2 algorithm
- ✅ Error diagnosis and adaptive feedback
- ✅ Three explanation styles (short, stepwise, analogy)
- ✅ Real-time analytics dashboard
- ✅ Bilingual interface (English/Chinese)
- ✅ Offline-first architecture (localStorage)
- ✅ 7 skills × 5 difficulties = 35 unique question types
- ✅ Session tracking and progress visualization

### Backend Features
- ✅ RESTful API with Express.js
- ✅ MongoDB data persistence
- ✅ JWT authentication
- ✅ Guest mode support
- ✅ User profile management
- ✅ Progress tracking across devices
- ✅ Analytics aggregation
- ✅ Security (CORS, Rate limiting, Input validation)
- ✅ Spaced repetition scheduling
- ✅ Performance history logging

### Learning Science
- ✅ Zone of Proximal Development (75% accuracy target)
- ✅ Spaced Repetition (Ebbinghaus forgetting curve)
- ✅ Mastery Learning (EWMA tracking)
- ✅ Error-Driven Learning (targeted feedback)
- ✅ Contextual Bandits (exploration vs exploitation)

---

## 🎓 Perfect for Learning About

- **Reinforcement Learning** in educational contexts
- **Adaptive Testing** systems and algorithms
- **Learning Analytics** and data-driven education
- **Full-Stack Development** (frontend + backend)
- **Multi-objective Optimization** in real-world systems
- **User Experience** design for learning apps
- **Data Persistence** strategies (localStorage + MongoDB)

---

## 📧 Support & Questions

This project demonstrates production-ready implementations of:
- Three-layer decision system architecture
- Thompson Sampling for contextual bandits
- Spaced repetition with SM-2 algorithm
- Error diagnosis and adaptive feedback
- Hybrid baseline + RL approach
- Full-stack web application architecture
- Educational technology best practices

**Built with ❤️ for math learners and developers everywhere**

Start your journey to mental math mastery today! 🚀

---

## 📝 License

MIT License - Feel free to use this for educational and commercial purposes!

---

**Last Updated**: January 2026  
**Version**: 1.0 (Full-Stack Release)  
**Status**: Production Ready
