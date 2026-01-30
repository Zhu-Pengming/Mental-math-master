# Integration Guide - New Engineering Components

This guide explains how to integrate the 8 new engineering improvements into the existing Mental Math Master application.

## Overview of New Components

| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| AttemptEvent Schema | `shared/event-schema.js` | Unified event model for frontend + backend | ✅ Ready |
| ErrorClassifier | `web/error-classifier.js` | Rule-based error diagnosis (no LLM) | ✅ Ready |
| ExplanationBandit | `web/explanation-bandit.js` | Thompson Sampling for explanation styles | ✅ Ready |
| BaselineScheduler | `web/baseline-scheduler.js` | Deterministic skill selection with RL-ready interface | ✅ Ready |
| GeneratorValidator | `web/generator-validator.js` | Automated difficulty monotonicity testing | ✅ Ready |
| Test Suite | `web/test-core.html` | Unit tests for all components | ✅ Ready |
| CI Pipeline | `.github/workflows/ci.yml` | Automated testing on push | ✅ Ready |

## Step 1: Load New Components in index.html

Add these script tags to `web/index.html` **before** loading `adaptive-engine-v2.js`:

```html
<!-- New engineering components -->
<script src="shared/event-schema.js"></script>
<script src="error-classifier.js"></script>
<script src="explanation-bandit.js"></script>
<script src="baseline-scheduler.js"></script>
<script src="generator-validator.js"></script>
```

## Step 2: Replace Layer C Error Diagnosis

### Current Code (in `layer-c-explanation.js`)
```javascript
classifyError(skillId, question, correctAnswer, userAnswer) {
    const diff = Math.abs(correctAnswer - userAnswer);
    // ... lots of if-else logic
}
```

### New Code
```javascript
constructor() {
    this.errorClassifier = new ErrorClassifier(); // Add this
    // ... rest of constructor
}

classifyError(skillId, question, correctAnswer, userAnswer, difficulty) {
    return this.errorClassifier.classify(
        skillId, 
        question, 
        correctAnswer, 
        userAnswer, 
        difficulty
    );
}
```

## Step 3: Replace Layer C Explanation Selection

### Current Code
```javascript
selectExplanationStyle(skillId, errorTag) {
    // Random or simple logic
    const styles = ['short', 'stepwise', 'analogy'];
    return styles[Math.floor(Math.random() * styles.length)];
}
```

### New Code
```javascript
constructor() {
    this.explanationBandit = new ExplanationBandit(); // Add this
    // ... rest of constructor
}

selectExplanationStyle(skillId, errorTag) {
    return this.explanationBandit.selectStyle(skillId, errorTag);
}

// Add this method to update bandit after next question
updateExplanationEffectiveness(skillId, errorTag, errorRepeated) {
    this.explanationBandit.updateFromOutcome(skillId, errorTag, errorRepeated);
}
```

## Step 4: Replace Layer B Scheduler

### Current Code (in `layer-b-scheduler.js`)
```javascript
selectNextSkill() {
    // Complex inline logic
    if (dueReviews.length > 0 && Math.random() < 0.7) {
        // ...
    }
}
```

### New Code
```javascript
constructor() {
    this.baselineScheduler = new BaselineScheduler(); // Add this
    // ... rest of constructor
}

selectNextSkill() {
    // Prepare state
    const state = BaselineScheduler.computeState({
        mastery: this.skillMastery,
        reviewQueue: this.reviewQueue,
        lastSkillId: this.lastSkillId,
        sessionHistory: this.sessionHistory,
        sessionStartTime: this.sessionStartTime,
        availableSkills: this.getAvailableSkillIds()
    });
    
    // Get next skill from scheduler
    const result = this.baselineScheduler.getNextSkill(state);
    
    // Store for analytics
    this.lastSchedulingReason = result.reason;
    this.lastSchedulingMode = result.mode;
    
    return result.skillId;
}
```

## Step 5: Use AttemptEvent for Logging

### Current Code (in `adaptive-engine-v2.js`)
```javascript
logAttempt(skillId, difficulty, correct, responseTime, hintUsed) {
    const log = {
        timestamp: Date.now(),
        skillId,
        difficulty,
        correct: correct ? 1 : 0,
        responseTimeSec: responseTime,
        hintUsed: hintUsed ? 1 : 0,
        attemptCount: 1
    };
    // ... save log
}
```

### New Code
```javascript
logAttempt(skillId, difficulty, correct, responseTime, hintUsed, errorTag, explanationStyle) {
    const event = window.AttemptEvent.create({
        userId: this.userProfile.userId,
        sessionId: this.sessionId,
        skillId,
        difficulty,
        correct,
        responseTimeSec: responseTime,
        hintUsed,
        attemptCount: this.currentAttemptCount,
        errorTag: correct ? null : errorTag,
        explanationStyle: correct ? null : explanationStyle
    });
    
    // Save to storage
    window.storageManager.appendQuestionLog(event);
    
    // Compute reward for analytics
    const reward = window.AttemptEvent.computeReward(event);
    
    return { event, reward };
}
```

## Step 6: Test the Integration

### Run Unit Tests
1. Open `web/test-core.html` in browser
2. Verify all tests pass (should see green checkmarks)
3. Fix any failing tests

### Run Generator Validation
```javascript
// In browser console
const validator = new GeneratorValidator();
const report = validator.validateAllGenerators(CURRICULUM);
validator.printReport(report);
```

Expected output:
- All 7 skills should pass
- Difficulty should increase monotonically (1→5)
- If any fail, fix the generator in `curriculum.js`

### Manual Integration Test
1. Play 20 questions
2. Check browser console for errors
3. Verify:
   - Difficulty adjusts based on performance
   - Due reviews appear at correct times
   - Error messages are specific to error type
   - Explanation styles vary for same error

## Step 7: Backend Integration (Future)

### Add to Backend Models
```javascript
// server/models/AttemptEvent.js
const AttemptEventSchema = require('../../shared/event-schema');

const mongoose = require('mongoose');

const attemptSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true },
    skillId: { type: String, required: true, index: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },
    correct: { type: Boolean, required: true },
    responseTimeSec: { type: Number, required: true },
    hintUsed: { type: Boolean, default: false },
    attemptCount: { type: Number, default: 1 },
    errorTag: { type: String, default: null },
    explanationStyle: { type: String, default: null },
    timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('AttemptEvent', attemptSchema);
```

### Create API Endpoint
```javascript
// server/routes/progress.js
router.post('/attempt', auth, async (req, res) => {
    try {
        // Validate using shared schema
        const { AttemptEvent } = require('../../shared/event-schema');
        AttemptEvent.validate(req.body);
        
        // Save to database
        const attempt = new AttemptEventModel(req.body);
        await attempt.save();
        
        res.json({ success: true, attemptId: attempt._id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

## Common Issues & Solutions

### Issue 1: "AttemptEvent is not defined"
**Solution**: Ensure `shared/event-schema.js` is loaded before other components in `index.html`

### Issue 2: Generator validation fails
**Solution**: Check that difficulty scaling is monotonic in `curriculum.js`. Each difficulty level should produce harder questions than the previous.

### Issue 3: Explanation bandit not learning
**Solution**: Ensure `updateFromOutcome()` is called after the next question is answered, not immediately after showing explanation.

### Issue 4: Scheduler always picks same skill
**Solution**: Check that `state.mastery` and `state.dueReviews` are being populated correctly.

## Performance Checklist

After integration, verify:
- [ ] localStorage size < 150KB (check with `storageManager.getStorageStats()`)
- [ ] Question generation < 100ms
- [ ] Difficulty selection < 50ms
- [ ] No memory leaks (use Chrome DevTools Memory profiler)
- [ ] All tests in `test-core.html` pass

## Next Steps

1. **Validate generators**: Run validator and fix any monotonicity issues
2. **Integrate components**: Follow steps 2-5 above
3. **Test thoroughly**: Run unit tests + manual testing
4. **Deploy backend**: Add AttemptEvent model and API endpoints
5. **Monitor metrics**: Track accuracy convergence, review timing, explanation effectiveness

## Questions?

If you encounter issues:
1. Check browser console for errors
2. Run `test-core.html` to isolate component issues
3. Use `storageManager.exportAllData()` to inspect state
4. Verify all script tags are in correct order in `index.html`
