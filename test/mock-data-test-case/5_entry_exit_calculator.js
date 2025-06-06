// test/mock-data-test-case/5_entry_exit_calculator.test.js
/**
 * Mock data and test cases for Entry Exit Calculator node
 */

const { mockIndicators } = require('./all_nodes_common');

// Create specific test data for entry/exit calculations
const createEntryExitTestData = (scenario) => {
    const baseCandles = Array(100).fill().map((_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 2500,
        high: 2550,
        low: 2450,
        close: 2500,
        volume: 3000000
    }));

    let customIndicators, customSupport, customResistance, lastClose, customConfluence;

    switch (scenario) {
        case 'valid_setup':
            lastClose = 2450;
            customIndicators = {
                ...mockIndicators,
                atr14: 80,
                atr21: 85
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.3, // > 1.2 threshold
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2700,
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['Valid signal']
            };
            break;

        case 'high_strength_support':
            lastClose = 2450;
            customIndicators = {
                ...mockIndicators,
                atr14: 80
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.5, // High strength > 1.2
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2700,
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['High strength support']
            };
            break;

        case 'low_strength_support':
            lastClose = 2450;
            customIndicators = {
                ...mockIndicators,
                atr14: 80
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.0, // Low strength <= 1.2
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2700,
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['Low strength support']
            };
            break;

        case 'poor_risk_reward':
            lastClose = 2450;
            customIndicators = {
                ...mockIndicators,
                atr14: 80
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.3,
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2500, // Close resistance = poor R:R
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['Poor risk reward']
            };
            break;

        case 'negative_risk_lot':
            lastClose = 2450;
            customIndicators = {
                ...mockIndicators,
                atr14: 20 // Small ATR leading to negative risk
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.3,
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2700,
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['Negative risk scenario']
            };
            break;

        case 'large_entry_gap':
            lastClose = 2600; // Far from support
            customIndicators = {
                ...mockIndicators,
                atr14: 80
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.3,
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2800,
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['Large entry gap']
            };
            break;

        case 'optimal_setup':
            lastClose = 2410; // Close to entry
            customIndicators = {
                ...mockIndicators,
                atr14: 60,
                atr21: 65
            };
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.8, // Very high strength
                index: 80,
                age: 25,
                tests: 4
            };
            customResistance = {
                type: 'R',
                price: 2800, // Good distance for target
                strength: 1.5,
                index: 85
            };
            customConfluence = {
                score: 5,
                hits: ['Optimal trading setup']
            };
            break;

        default:
            lastClose = 2450;
            customIndicators = mockIndicators;
            customSupport = {
                type: 'S',
                price: 2400,
                strength: 1.3,
                index: 80,
                age: 20,
                tests: 3
            };
            customResistance = {
                type: 'R',
                price: 2700,
                strength: 1.2,
                index: 85
            };
            customConfluence = {
                score: 3,
                hits: ['Default scenario']
            };
    }

    return {
        ticker: `TEST_${scenario.toUpperCase()}`,
        lastDate: '2024-06-06',
        candles: baseCandles,
        lastClose: lastClose,
        indicators: customIndicators,
        support: customSupport,
        resistance: customResistance,
        confluence: customConfluence
    };
};

// Expected entry/exit calculation rules
const entryExitRules = {
    entryPrice: {
        highStrength: 'support.price * 1.005 when strength > 1.2',
        lowStrength: 'support.price when strength <= 1.2'
    },
    stopLoss: {
        conservative: 'entry - (atr14 * 1.5)',
        supportBased: 'support.price - (support.price * 0.03)',
        final: 'Math.max(conservative, supportBased)'
    },
    target: {
        atrBased: 'entry + (atr14 * 2)',
        resistanceBased: 'resistance.price',
        final: 'Math.min(atrBased, resistanceBased)'
    },
    riskReward: {
        minimum: 1.8,
        calculation: '(target - entry) / (entry - stop)'
    },
    entryGap: {
        immediate: '<= 1%',
        acceptable: '<= 3%',
        aggressive: '<= 5%',
        retest: '> 5%'
    }
};

// Test scenarios for entry/exit calculations
const entryExitTestScenarios = {
    valid_setup: {
        name: 'Valid Trading Setup',
        description: 'Standard valid setup with good risk/reward',
        data: createEntryExitTestData('valid_setup'),
        expectedPass: true,
        expectedCalculations: {
            hasEntry: true,
            hasStop: true,
            hasTarget: true,
            hasRiskReward: true,
            riskRewardMin: 1.8
        }
    },

    high_strength_support: {
        name: 'High Strength Support',
        description: 'Support with strength > 1.2 gets entry adjustment',
        data: createEntryExitTestData('high_strength_support'),
        expectedPass: true,
        expectedCalculations: {
            entryAdjustment: true, // entry = support.price * 1.005
            hasGoodRiskReward: true
        }
    },

    low_strength_support: {
        name: 'Low Strength Support',
        description: 'Support with strength <= 1.2 no entry adjustment',
        data: createEntryExitTestData('low_strength_support'),
        expectedPass: true,
        expectedCalculations: {
            entryAdjustment: false, // entry = support.price
            hasGoodRiskReward: true
        }
    },

    poor_risk_reward: {
        name: 'Poor Risk/Reward Ratio',
        description: 'Setup with R:R < 1.8 should be filtered out',
        data: createEntryExitTestData('poor_risk_reward'),
        expectedPass: false
    },

    negative_risk_lot: {
        name: 'Negative Risk Lot',
        description: 'Invalid setup where risk lot <= 0',
        data: createEntryExitTestData('negative_risk_lot'),
        expectedPass: false
    },

    large_entry_gap: {
        name: 'Large Entry Gap',
        description: 'Test entry strategy based on gap percentage',
        data: createEntryExitTestData('large_entry_gap'),
        expectedPass: true,
        expectedCalculations: {
            entryStrategy: 'Wait for Retest'
        }
    },

    optimal_setup: {
        name: 'Optimal Trading Setup',
        description: 'Perfect setup with excellent risk/reward',
        data: createEntryExitTestData('optimal_setup'),
        expectedPass: true,
        expectedCalculations: {
            entryStrategy: 'Immediate Entry (At Support)',
            excellentRiskReward: true
        }
    }
};

// Helper functions for entry/exit testing
const entryExitHelpers = {
    calculateExpectedEntry: (support) => {
        return support.strength > 1.2 ? support.price * 1.005 : support.price;
    },

    calculateExpectedStop: (entry, atr14, support) => {
        const conservativeStop = entry - atr14 * 1.5;
        const supportStop = support.price - (support.price * 0.03);
        return Math.max(conservativeStop, supportStop);
    },

    calculateExpectedTarget: (entry, atr14, resistance) => {
        const target1 = entry + (atr14 * 2);
        const target2 = resistance.price;
        return Math.min(target1, target2);
    },

    calculateRiskReward: (entry, stop, target) => {
        const riskLot = entry - stop;
        const rewardLot = target - entry;
        return riskLot > 0 ? rewardLot / riskLot : 0;
    },

    getExpectedEntryStrategy: (entryGapPercent) => {
        if (entryGapPercent <= 1) return 'Immediate Entry (At Support)';
        if (entryGapPercent <= 3) return 'Breakout Entry (Acceptable Gap)';
        if (entryGapPercent <= 5) return 'Aggressive Entry (High Risk)';
        return 'Wait for Retest';
    },

    validateEntryExitData: (entryExit) => {
        const requiredFields = ['entry', 'stop', 'target', 'riskReward', 'entryGapPercent', 'entryStrategy'];
        return requiredFields.every(field => entryExit.hasOwnProperty(field)) &&
            typeof entryExit.entry === 'number' &&
            typeof entryExit.stop === 'number' &&
            typeof entryExit.target === 'number' &&
            typeof entryExit.riskReward === 'number' &&
            entryExit.entry > entryExit.stop &&
            entryExit.target > entryExit.entry;
    }
};

module.exports = {
    createEntryExitTestData,
    entryExitTestScenarios,
    entryExitRules,
    entryExitHelpers
};