// ============================================================================
// CURRICULUM DATA - Lesson definitions with adaptive generators
// ============================================================================

const CURRICULUM = [
    {
        id: 'beginner',
        title: 'Beginner: Addition & Subtraction',
        color: 'bg-emerald-500',
        textClass: 'text-emerald-600',
        borderClass: 'border-emerald-600',
        hoverClass: 'group-hover:text-emerald-700',
        description: 'Master the art of "Making Whole Numbers" to speed up basic arithmetic.',
        lessons: [
            {
                id: 'b1',
                title: 'Making 10s (Addition)',
                concept: 'When adding multiple numbers, look for pairs that sum to 10, 20, 100, etc. Group them first.',
                example: { problem: '14 + 5 + 6 + 25', steps: ['(14 + 6) + (5 + 25)', '20 + 30', '50'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1: Single pair (2 nums), small bases (0-20)
                    // 2: Two pairs (4 nums), small bases (0-50)
                    // 3: Two pairs, medium bases (0-100)
                    // 4: Three pairs (6 nums), larger bases (0-200)
                    // 5: Three pairs, crossing hundreds (0-500)
                    
                    const pairs = [[1,9], [2,8], [3,7], [4,6], [5,5]];
                    const numPairs = difficulty <= 2 ? (difficulty === 1 ? 1 : 2) : (difficulty <= 3 ? 2 : 3);
                    const baseRange = difficulty === 1 ? 2 : difficulty === 2 ? 5 : difficulty === 3 ? 10 : difficulty === 4 ? 20 : 50;
                    
                    const selectedPairs = [];
                    const nums = [];
                    
                    for (let i = 0; i < numPairs; i++) {
                        const pair = pairs[Math.floor(Math.random() * pairs.length)];
                        const base1 = Math.floor(Math.random() * baseRange) * 10;
                        const base2 = Math.floor(Math.random() * baseRange) * 10;
                        
                        nums.push(base1 + pair[0]);
                        nums.push(base2 + pair[1]);
                        selectedPairs.push([base1 + pair[0], base2 + pair[1]]);
                    }
                    
                    // Randomize order
                    for (let i = nums.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [nums[i], nums[j]] = [nums[j], nums[i]];
                    }
                    
                    const sum = nums.reduce((a, b) => a + b, 0);
                    const hintPairs = selectedPairs.map(p => `${p[0]} and ${p[1]}`).join(', ');
                    
                    return {
                        q: nums.join(' + '),
                        a: sum,
                        hint: `Look for pairs that make 10: ${hintPairs}`,
                        difficulty
                    };
                }
            },
            {
                id: 'b2',
                title: 'Subtraction Grouping',
                concept: 'If you are subtracting multiple numbers, check if the subtracted numbers add up to a nice round number.',
                example: { problem: '50 - 13 - 7 - 23', steps: ['50 - (13 + 7) - 23', '50 - 20 - 23', '30 - 23', '7'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1: Start 50-100, 2 subtractions, complement to 10
                    // 2: Start 100-150, 3 subtractions, complement to 10
                    // 3: Start 150-250, 3 subtractions, complement to 20
                    // 4: Start 200-400, 4 subtractions, multiple complements
                    // 5: Start 300-600, 4+ subtractions, crossing hundreds
                    
                    const startBase = difficulty === 1 ? 50 : difficulty === 2 ? 100 : difficulty === 3 ? 150 : difficulty === 4 ? 200 : 300;
                    const startRange = difficulty === 1 ? 50 : difficulty === 2 ? 50 : difficulty === 3 ? 100 : difficulty === 4 ? 200 : 300;
                    const start = Math.floor(Math.random() * startRange) + startBase;
                    
                    const numSubs = difficulty <= 2 ? (difficulty === 1 ? 2 : 3) : (difficulty <= 3 ? 3 : 4);
                    const complement = difficulty <= 2 ? 10 : (difficulty === 3 ? 20 : (Math.random() > 0.5 ? 10 : 20));
                    
                    const sub1 = Math.floor(Math.random() * (complement - 2)) + 1;
                    const sub2 = complement - sub1;
                    const subs = [sub1, sub2];
                    
                    for (let i = 2; i < numSubs; i++) {
                        subs.push(Math.floor(Math.random() * (5 + difficulty * 2)) + 5);
                    }
                    
                    // Randomize order
                    for (let i = subs.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [subs[i], subs[j]] = [subs[j], subs[i]];
                    }
                    
                    const q = `${start} - ${subs.join(' - ')}`;
                    const answer = start - subs.reduce((a, b) => a + b, 0);
                    
                    return {
                        q,
                        a: answer,
                        hint: `Try grouping -${sub1} and -${sub2} first (they make -${complement}).`,
                        difficulty
                    };
                }
            },
            {
                id: 'b3',
                title: 'Rounding Near-Numbers',
                concept: 'Treat numbers like 98, 199, or 297 as their nearest round number, then fix the difference later.',
                example: { problem: '397 + 128', steps: ['(400 - 3) + 128', '400 + 128 - 3', '528 - 3', '525'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1: Near 50/100, diff 1-2, other 10-30
                    // 2: Near 100/200, diff 1-3, other 20-50
                    // 3: Near 200/300/400, diff 1-5, other 50-100
                    // 4: Near 500/600, diff 2-8, other 100-200
                    // 5: Near 1000, diff 3-12, other 200-500
                    
                    const baseMultiplier = difficulty === 1 ? 1 : difficulty === 2 ? 2 : difficulty === 3 ? 3 : difficulty === 4 ? 5 : 10;
                    const base = (Math.floor(Math.random() * (1 + Math.floor(difficulty / 2))) + baseMultiplier) * 100;
                    const maxDiff = difficulty === 1 ? 2 : difficulty === 2 ? 3 : difficulty === 3 ? 5 : difficulty === 4 ? 8 : 12;
                    const diff = Math.floor(Math.random() * (maxDiff - 1)) + 1;
                    const near = base - diff;
                    
                    const otherMin = difficulty === 1 ? 10 : difficulty === 2 ? 20 : difficulty === 3 ? 50 : difficulty === 4 ? 100 : 200;
                    const otherRange = difficulty === 1 ? 20 : difficulty === 2 ? 30 : difficulty === 3 ? 50 : difficulty === 4 ? 100 : 300;
                    const other = Math.floor(Math.random() * otherRange) + otherMin;
                    
                    return {
                        q: `${near} + ${other}`,
                        a: near + other,
                        hint: `Treat ${near} as ${base} - ${diff}, then add ${other}`,
                        difficulty
                    };
                }
            }
        ]
    },
    {
        id: 'intermediate',
        title: 'Intermediate: Multiplication Hacks',
        color: 'bg-blue-500',
        textClass: 'text-blue-600',
        borderClass: 'border-blue-600',
        hoverClass: 'group-hover:text-blue-700',
        description: 'Use the "Magic Friends" (2 & 5, 4 & 25, 8 & 125) to break down complex multiplication.',
        lessons: [
            {
                id: 'm1',
                title: 'Split & Combine Factors',
                concept: 'Break numbers into factors to find "Magic Friends". 25 loves 4 (makes 100). 125 loves 8 (makes 1000).',
                example: { problem: '32 × 125', steps: ['(4 × 8) × 125', '4 × (8 × 125)', '4 × 1000', '4000'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1-2: Use 5×2 (easy factoring)
                    // 3: Use 25×4 (medium)
                    // 4-5: Use 125×8 (hard)
                    
                    const magicPairs = [{k: 5, v: 2}, {k: 25, v: 4}, {k: 125, v: 8}];
                    const pairIndex = difficulty <= 2 ? 0 : difficulty === 3 ? 1 : 2;
                    const chosen = magicPairs[pairIndex];
                    
                    const multiplierMin = difficulty === 1 ? 2 : difficulty === 2 ? 3 : difficulty === 3 ? 4 : difficulty === 4 ? 6 : 8;
                    const multiplierRange = difficulty === 1 ? 3 : difficulty === 2 ? 4 : difficulty === 3 ? 5 : difficulty === 4 ? 6 : 8;
                    const multiplier = Math.floor(Math.random() * multiplierRange) + multiplierMin;
                    const largeFactor = chosen.v * multiplier;
                    
                    return {
                        q: `${largeFactor} × ${chosen.k}`,
                        a: largeFactor * chosen.k,
                        hint: `Split ${largeFactor} into ${multiplier} × ${chosen.v}. Pair ${chosen.v} with ${chosen.k} to get ${chosen.v * chosen.k}.`,
                        difficulty
                    };
                }
            },
            {
                id: 'm2',
                title: 'Distributive Law (The Hook)',
                concept: 'If two multiplication parts share a number, pull it out! a×b + a×c = a×(b+c).',
                example: { problem: '3.6 × 23 + 3.6 × 77', steps: ['3.6 × (23 + 77)', '3.6 × 100', '360'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1: Integer common factor, parts sum to 10
                    // 2: Integer common factor, parts sum to 100
                    // 3: Decimal (1 place) common factor, parts sum to 100
                    // 4: Decimal (1 place) common factor, parts sum to 1000
                    // 5: Decimal (2 places) common factor, larger sums
                    
                    const targetSum = difficulty === 1 ? 10 : difficulty <= 3 ? 100 : 1000;
                    const decimalPlaces = difficulty <= 2 ? 0 : difficulty <= 4 ? 1 : 2;
                    const divisor = Math.pow(10, decimalPlaces);
                    
                    const commonMin = difficulty === 1 ? 2 : difficulty === 2 ? 5 : difficulty === 3 ? 10 : difficulty === 4 ? 20 : 30;
                    const commonRange = difficulty === 1 ? 8 : difficulty === 2 ? 15 : difficulty === 3 ? 70 : difficulty === 4 ? 80 : 100;
                    const common = (Math.floor(Math.random() * commonRange) + commonMin) / divisor;
                    
                    const part1Min = Math.floor(targetSum * 0.2);
                    const part1Max = Math.floor(targetSum * 0.8);
                    const part1 = Math.floor(Math.random() * (part1Max - part1Min)) + part1Min;
                    const part2 = targetSum - part1;
                    
                    return {
                        q: `${common} × ${part1} + ${common} × ${part2}`,
                        a: common * targetSum,
                        hint: `Factor out ${common}. What is ${part1} + ${part2}?`,
                        difficulty
                    };
                }
            }
        ]
    },
    {
        id: 'advanced',
        title: 'Advanced: Speed Patterns',
        color: 'bg-purple-500',
        textClass: 'text-purple-600',
        borderClass: 'border-purple-600',
        hoverClass: 'group-hover:text-purple-700',
        description: 'Specific patterns that allow for instant answers if you recognize them.',
        lessons: [
            {
                id: 'a1',
                title: 'Same Tens, Complementary Units',
                concept: 'If tens digit is same (e.g., 30s) and units add to 10 (2+8). Rule: (Tens × (Tens+1)) | (Units × Units).',
                example: { problem: '38 × 32', steps: ['Tens: 3 × (3+1) = 12', 'Units: 8 × 2 = 16', 'Result: 1216'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1: Tens 1-2 (11-29 range)
                    // 2: Tens 2-4 (21-49 range)
                    // 3: Tens 3-6 (31-69 range)
                    // 4: Tens 5-9 (51-99 range)
                    // 5: Tens 7-15 (71-159 range)
                    
                    const tenMin = difficulty === 1 ? 1 : difficulty === 2 ? 2 : difficulty === 3 ? 3 : difficulty === 4 ? 5 : 7;
                    const tenRange = difficulty === 1 ? 2 : difficulty === 2 ? 3 : difficulty === 3 ? 4 : difficulty === 4 ? 5 : 9;
                    const ten = Math.floor(Math.random() * tenRange) + tenMin;
                    
                    const u1 = Math.floor(Math.random() * 9) + 1;
                    const u2 = 10 - u1;
                    const n1 = ten * 10 + u1;
                    const n2 = ten * 10 + u2;
                    
                    return {
                        q: `${n1} × ${n2}`,
                        a: n1 * n2,
                        hint: `Tens part: ${ten} × ${ten+1} = ${ten * (ten+1)}. Units part: ${u1} × ${u2} = ${u1 * u2}. Combine them.`,
                        difficulty
                    };
                }
            },
            {
                id: 'a2',
                title: 'Sum of Sequences',
                concept: 'Sum = (First + Last) × Count / 2. Useful for long lists of evenly spaced numbers.',
                example: { problem: '1 + 2 + ... + 10', steps: ['First: 1, Last: 10', 'Count: 10', '(1+10) × 10 / 2', '11 × 5 = 55'] },
                generator: (difficulty = 3) => {
                    // Difficulty scaling:
                    // 1: 3-4 terms, step 1, start 1-3
                    // 2: 4-6 terms, step 1-2, start 1-5
                    // 3: 6-8 terms, step 1-3, start 1-10
                    // 4: 8-12 terms, step 2-5, start 5-20
                    // 5: 10-16 terms, step 3-10, start 10-50
                    
                    const countMin = difficulty === 1 ? 3 : difficulty === 2 ? 4 : difficulty === 3 ? 6 : difficulty === 4 ? 8 : 10;
                    const countRange = difficulty === 1 ? 2 : difficulty === 2 ? 3 : difficulty === 3 ? 3 : difficulty === 4 ? 5 : 7;
                    const count = Math.floor(Math.random() * countRange) + countMin;
                    
                    const startMax = difficulty === 1 ? 3 : difficulty === 2 ? 5 : difficulty === 3 ? 10 : difficulty === 4 ? 20 : 50;
                    const start = Math.floor(Math.random() * startMax) + 1;
                    
                    const stepMax = difficulty === 1 ? 1 : difficulty === 2 ? 2 : difficulty === 3 ? 3 : difficulty === 4 ? 5 : 10;
                    const step = Math.floor(Math.random() * stepMax) + 1;
                    
                    let arr = [];
                    for(let i = 0; i < count; i++) {
                        arr.push(start + (i * step));
                    }
                    const last = arr[arr.length - 1];
                    const sum = arr.reduce((x, y) => x + y, 0);
                    
                    return {
                        q: arr.length <= 8 ? arr.join(' + ') : `${arr[0]} + ${arr[1]} + ... + ${arr[arr.length-1]}`,
                        a: sum,
                        hint: `Formula: (First + Last) × Count / 2 = (${start} + ${last}) × ${count} / 2`,
                        difficulty
                    };
                }
            }
        ]
    }
];
