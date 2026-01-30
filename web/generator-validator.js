// ============================================================================
// GENERATOR VALIDATOR - Ensures difficulty scaling is monotonic
// ============================================================================

class GeneratorValidator {
    constructor() {
        this.validationResults = {};
    }

    /**
     * Validates that a generator produces strictly increasing difficulty
     * Tests each difficulty level 1-5 and checks:
     * 1. Number range increases
     * 2. Complexity increases (more numbers, more steps)
     * 3. Cognitive load increases
     */
    validateGenerator(skillId, generator, numSamples = 20) {
        const results = {
            skillId,
            passed: true,
            issues: [],
            samples: {}
        };

        for (let difficulty = 1; difficulty <= 5; difficulty++) {
            const samples = [];
            
            for (let i = 0; i < numSamples; i++) {
                try {
                    const question = generator(difficulty);
                    samples.push(question);
                } catch (e) {
                    results.passed = false;
                    results.issues.push(`Difficulty ${difficulty}: Generator threw error: ${e.message}`);
                }
            }
            
            results.samples[difficulty] = this.analyzeSamples(samples, difficulty);
        }

        // Check monotonicity across difficulties
        for (let d = 1; d < 5; d++) {
            const current = results.samples[d];
            const next = results.samples[d + 1];
            
            if (!current || !next) continue;
            
            // Number range should increase
            if (next.avgMaxNumber <= current.avgMaxNumber) {
                results.passed = false;
                results.issues.push(
                    `Difficulty ${d} -> ${d+1}: Number range not increasing ` +
                    `(${current.avgMaxNumber.toFixed(0)} -> ${next.avgMaxNumber.toFixed(0)})`
                );
            }
            
            // Complexity should increase (more operands or larger numbers)
            if (next.avgComplexity <= current.avgComplexity) {
                results.passed = false;
                results.issues.push(
                    `Difficulty ${d} -> ${d+1}: Complexity not increasing ` +
                    `(${current.avgComplexity.toFixed(2)} -> ${next.avgComplexity.toFixed(2)})`
                );
            }
        }

        this.validationResults[skillId] = results;
        return results;
    }

    analyzeSamples(samples, difficulty) {
        if (!samples || samples.length === 0) {
            return { avgMaxNumber: 0, avgComplexity: 0, avgOperands: 0 };
        }

        let totalMaxNumber = 0;
        let totalComplexity = 0;
        let totalOperands = 0;

        for (const sample of samples) {
            const numbers = this.extractNumbers(sample.q);
            const maxNumber = Math.max(...numbers, 0);
            const operandCount = numbers.length;
            
            // Complexity = max number + operand count * 10
            const complexity = maxNumber + operandCount * 10;
            
            totalMaxNumber += maxNumber;
            totalComplexity += complexity;
            totalOperands += operandCount;
        }

        return {
            avgMaxNumber: totalMaxNumber / samples.length,
            avgComplexity: totalComplexity / samples.length,
            avgOperands: totalOperands / samples.length,
            difficulty
        };
    }

    extractNumbers(questionString) {
        // Extract all numbers from question string
        const matches = questionString.match(/\d+/g);
        return matches ? matches.map(Number) : [];
    }

    /**
     * Validates all generators in curriculum
     */
    validateAllGenerators(curriculum) {
        const report = {
            totalSkills: 0,
            passed: 0,
            failed: 0,
            details: []
        };

        for (const category of curriculum) {
            for (const lesson of category.lessons) {
                report.totalSkills++;
                const result = this.validateGenerator(lesson.id, lesson.generator);
                
                if (result.passed) {
                    report.passed++;
                } else {
                    report.failed++;
                }
                
                report.details.push(result);
            }
        }

        return report;
    }

    /**
     * Print validation report to console
     */
    printReport(report) {
        console.log('\n=== GENERATOR VALIDATION REPORT ===');
        console.log(`Total Skills: ${report.totalSkills}`);
        console.log(`Passed: ${report.passed} ✓`);
        console.log(`Failed: ${report.failed} ✗`);
        console.log('');

        for (const detail of report.details) {
            const status = detail.passed ? '✓' : '✗';
            console.log(`${status} ${detail.skillId}`);
            
            if (!detail.passed) {
                for (const issue of detail.issues) {
                    console.log(`  - ${issue}`);
                }
            }
            
            // Show difficulty progression
            console.log('  Difficulty progression:');
            for (let d = 1; d <= 5; d++) {
                const sample = detail.samples[d];
                if (sample) {
                    console.log(
                        `    D${d}: max=${sample.avgMaxNumber.toFixed(0)}, ` +
                        `complexity=${sample.avgComplexity.toFixed(0)}, ` +
                        `operands=${sample.avgOperands.toFixed(1)}`
                    );
                }
            }
            console.log('');
        }
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.GeneratorValidator = GeneratorValidator;
}
