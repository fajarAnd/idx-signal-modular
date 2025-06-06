// test/mock-data-test-case/8_action_recommendation_engine.test.js
/**
 * Mock data and test cases for Action Recommendation Engine node
 */

const { createPositionSizingTestData } = require('./7_position_sizing_risk_management');

// Create specific test data for action recommendation scenarios
const createActionRecommendationTestData = (scenario, triggerConfig = {}) => {
    const defaultTriggerConfig = {
        scoreGreaterThan: 2,
        MaxLoss: 100000,
        modalTersedia: 5000000,
        intervalMonth: 4
    };

    const config = { ...defaultTriggerConfig, ...triggerConfig };

    let customData;

    switch (scenario) {
        case 'strong_buy':
            customData = {
                ticker: 'STRONG_BUY_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 0.8,
                entry: 2480,
                stop: 2380,
                target: 2680,
                riskReward: 2.0,
                backtestWinRate: 75.5, // >= 70%
                totalTrades: 25,
                confluenceScore: 6,     // >= 5
                qty: 10,
                totalCost: '2,480,000',
                nominalProfit: '2,000,000',
                nominalLoss: '1,000,000',
                expectancy: '1,265,000',
                confluenceHits: 'Multi-timeframe bullish alignment | RSI oversold (32.5) | Volume spike detected | Strong support (4 tests, 18 periods old)',
                entryStrategy: 'Immediate Entry (At Support)',
                supportStrength: '1.75',
                resistanceDistance: 7.2,
                atr14: 85,
                marketPhase: 'Uptrend'
            };
            break;

        case 'good_buy':
            customData = {
                ticker: 'GOOD_BUY_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 1.5,
                entry: 2450,
                stop: 2350,
                target: 2650,
                riskReward: 2.0,
                backtestWinRate: 67.3, // >= 65%
                totalTrades: 22,
                confluenceScore: 4,     // >= 4
                qty: 8,
                totalCost: '1,960,000',
                nominalProfit: '1,600,000',
                nominalLoss: '800,000',
                expectancy: '814,160',
                confluenceHits: 'Basic uptrend | RSI oversold (38.5) | Volume spike detected | Reliable support (2 tests)',
                entryStrategy: 'Breakout Entry (Acceptable Gap)',
                supportStrength: '1.45',
                resistanceDistance: 6.0,
                atr14: 75,
                marketPhase: 'Uptrend'
            };
            break;

        case 'cautious_buy':
            customData = {
                ticker: 'CAUTIOUS_BUY_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 2.8,
                entry: 2430,
                stop: 2330,
                target: 2630,
                riskReward: 2.0,
                backtestWinRate: 60.5, // >= 58%
                totalTrades: 18,
                confluenceScore: 3,     // >= 3
                qty: 6,
                totalCost: '1,458,000',
                nominalProfit: '1,200,000',
                nominalLoss: '600,000',
                expectancy: '489,000',
                confluenceHits: 'Basic uptrend | Volume spike detected | Reliable support (2 tests)',
                entryStrategy: 'Breakout Entry (Acceptable Gap)',
                supportStrength: '1.25',
                resistanceDistance: 5.2,
                atr14: 68,
                marketPhase: 'Sideways'
            };
            break;

        case 'watchlist':
            customData = {
                ticker: 'WATCHLIST_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 4.2,
                entry: 2420,
                stop: 2320,
                target: 2620,
                riskReward: 2.0,
                backtestWinRate: 54.8, // >= 52%
                totalTrades: 15,
                confluenceScore: 2,     // >= 2
                qty: 5,
                totalCost: '1,210,000',
                nominalProfit: '1,000,000',
                nominalLoss: '500,000',
                expectancy: '322,400',
                confluenceHits: 'Volume spike detected | Reliable support (2 tests)',
                entryStrategy: 'Aggressive Entry (High Risk)',
                supportStrength: '1.15',
                resistanceDistance: 4.8,
                atr14: 55,
                marketPhase: 'Sideways'
            };
            break;

        case 'avoid_setup':
            customData = {
                ticker: 'AVOID_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 5.5,
                entry: 2400,
                stop: 2300,
                target: 2600,
                riskReward: 2.0,
                backtestWinRate: 48.5, // < 52%
                totalTrades: 12,
                confluenceScore: 1,     // < 2
                qty: 3,
                totalCost: '720,000',
                nominalProfit: '600,000',
                nominalLoss: '300,000',
                expectancy: '145,500',
                confluenceHits: 'Weak signal',
                entryStrategy: 'Wait for Retest',
                supportStrength: '0.95',
                resistanceDistance: 4.0,
                atr14: 45,
                marketPhase: 'Downtrend'
            };
            break;

        case 'below_threshold':
            customData = {
                ticker: 'BELOW_THRESHOLD_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 3.0,
                entry: 2450,
                stop: 2350,
                target: 2650,
                riskReward: 2.0,
                backtestWinRate: 65.0,
                totalTrades: 20,
                confluenceScore: 1,     // Below threshold
                qty: 7,
                totalCost: '1,715,000',
                nominalProfit: '1,400,000',
                nominalLoss: '700,000',
                expectancy: '665,000',
                confluenceHits: 'Minimal confluence',
                entryStrategy: 'Breakout Entry (Acceptable Gap)',
                supportStrength: '1.20',
                resistanceDistance: 6.0,
                atr14: 70,
                marketPhase: 'Uptrend'
            };
            break;

        case 'excellent_metrics':
            customData = {
                ticker: 'EXCELLENT_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 0.5,
                entry: 2490,
                stop: 2390,
                target: 2790,
                riskReward: 3.0,        // High R:R
                backtestWinRate: 82.5,  // Very high win rate
                totalTrades: 30,
                confluenceScore: 7,     // Very high confluence
                qty: 12,
                totalCost: '2,988,000',
                nominalProfit: '3,600,000',
                nominalLoss: '1,200,000',
                expectancy: '2,760,000',
                confluenceHits: 'Multi-timeframe bullish alignment | Double oversold (RSI: 28.5, StochRSI: 15.2%) | MACD bullish crossover | Sustained volume breakout | Strong support (5 tests, 22 periods old) | Hammer pattern detected',
                entryStrategy: 'Immediate Entry (At Support)',
                supportStrength: '2.15',
                resistanceDistance: 11.6,
                atr14: 95,
                marketPhase: 'Uptrend'
            };
            break;

        case 'edge_case_metrics':
            customData = {
                ticker: 'EDGE_CASE_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 3.0,
                entry: 2450,
                stop: 2350,
                target: 2650,
                riskReward: 2.0,
                backtestWinRate: 58.0,  // Exactly at boundary
                totalTrades: 15,
                confluenceScore: 3,     // Exactly at boundary
                qty: 6,
                totalCost: '1,470,000',
                nominalProfit: '1,200,000',
                nominalLoss: '600,000',
                expectancy: '444,000',
                confluenceHits: 'Boundary case signals',
                entryStrategy: 'Breakout Entry (Acceptable Gap)',
                supportStrength: '1.30',
                resistanceDistance: 6.0,
                atr14: 72,
                marketPhase: 'Sideways'
            };
            break;

        default:
            customData = {
                ticker: 'DEFAULT_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 2.0,
                entry: 2450,
                stop: 2350,
                target: 2650,
                riskReward: 2.0,
                backtestWinRate: 65.0,
                totalTrades: 20,
                confluenceScore: 4,
                qty: 8,
                totalCost: '1,960,000',
                nominalProfit: '1,600,000',
                nominalLoss: '800,000',
                expectancy: '720,000',
                confluenceHits: 'Default signals',
                entryStrategy: 'Breakout Entry (Acceptable Gap)',
                supportStrength: '1.40',
                resistanceDistance: 6.0,
                atr14: 75,
                marketPhase: 'Uptrend'
            };
    }

    return {
        ...customData,
        triggerConfig: config
    };
};

// Action recommendation rules and thresholds
const actionRecommendationRules = {
    thresholds: {
        strongBuy: {
            backtestWinRate: 70,
            confluenceScore: 5,
            riskReward: 2.0
        },
        goodBuy: {
            backtestWinRate: 65,
            confluenceScore: 4
        },
        cautiousBuy: {
            backtestWinRate: 58,
            confluenceScore: 3
        },
        watchlist: {
            backtestWinRate: 52,
            confluenceScore: 2
        },
        avoid: {
            backtestWinRate: 0,
            confluenceScore: 0
        }
    },
    recommendations: {
        'STRONG BUY - High confidence': 'backtestWinRate >= 70 && confluenceScore >= 5 && riskReward >= 2.0',
        'BUY - Good setup': 'backtestWinRate >= 65 && confluenceScore >= 4',
        'CAUTIOUS BUY - Partial position': 'backtestWinRate >= 58 && confluenceScore >= 3',
        'WATCHLIST - Wait for better entry': 'backtestWinRate >= 52 && confluenceScore >= 2',
        'AVOID - Poor setup': 'default case'
    },
    scoreThresholdFilter: 'confluenceScore >= REQ_SCORE (from trigger config)'
};

// Test scenarios for action recommendation
const actionRecommendationTestScenarios = {
    strong_buy: {
        name: 'Strong Buy Recommendation',
        description: 'High win rate (≥70%), high confluence (≥5), good R:R (≥2.0)',
        data: createActionRecommendationTestData('strong_buy'),
        expectedPass: true,
        expectedRecommendation: 'STRONG BUY - High confidence',
        expectedMetrics: {
            backtestWinRate: 70,
            confluenceScore: 5,
            riskReward: 2.0
        }
    },

    good_buy: {
        name: 'Good Buy Recommendation',
        description: 'Good win rate (≥65%), good confluence (≥4)',
        data: createActionRecommendationTestData('good_buy'),
        expectedPass: true,
        expectedRecommendation: 'BUY - Good setup',
        expectedMetrics: {
            backtestWinRate: 65,
            confluenceScore: 4
        }
    },

    cautious_buy: {
        name: 'Cautious Buy Recommendation',
        description: 'Moderate win rate (≥58%), moderate confluence (≥3)',
        data: createActionRecommendationTestData('cautious_buy'),
        expectedPass: true,
        expectedRecommendation: 'CAUTIOUS BUY - Partial position',
        expectedMetrics: {
            backtestWinRate: 58,
            confluenceScore: 3
        }
    },

    watchlist: {
        name: 'Watchlist Recommendation',
        description: 'Minimum win rate (≥52%), minimum confluence (≥2)',
        data: createActionRecommendationTestData('watchlist'),
        expectedPass: true,
        expectedRecommendation: 'WATCHLIST - Wait for better entry',
        expectedMetrics: {
            backtestWinRate: 52,
            confluenceScore: 2
        }
    },

    avoid_setup: {
        name: 'Avoid Recommendation',
        description: 'Poor metrics that don\'t meet any buy criteria',
        data: createActionRecommendationTestData('avoid_setup'),
        expectedPass: true,
        expectedRecommendation: 'AVOID - Poor setup',
        expectedMetrics: {
            poorMetrics: true
        }
    },

    below_threshold: {
        name: 'Below Score Threshold',
        description: 'Confluence score below required threshold',
        data: createActionRecommendationTestData('below_threshold', { scoreGreaterThan: 2 }),
        expectedPass: false,
        expectedReason: 'Below confluence score threshold'
    },

    excellent_metrics: {
        name: 'Excellent Metrics',
        description: 'All metrics exceed strong buy requirements',
        data: createActionRecommendationTestData('excellent_metrics'),
        expectedPass: true,
        expectedRecommendation: 'STRONG BUY - High confidence',
        expectedMetrics: {
            exceptional: true
        }
    },

    edge_case_metrics: {
        name: 'Edge Case Metrics',
        description: 'Metrics exactly at boundary conditions',
        data: createActionRecommendationTestData('edge_case_metrics'),
        expectedPass: true,
        expectedRecommendation: 'CAUTIOUS BUY - Partial position',
        expectedMetrics: {
            boundaryCase: true
        }
    }
};

// Helper functions for action recommendation testing
const actionRecommendationHelpers = {
    determineExpectedRecommendation: (backtestWinRate, confluenceScore, riskReward) => {
        if (backtestWinRate >= 70 && confluenceScore >= 5 && riskReward >= 2.0) {
            return 'STRONG BUY - High confidence';
        } else if (backtestWinRate >= 65 && confluenceScore >= 4) {
            return 'BUY - Good setup';
        } else if (backtestWinRate >= 58 && confluenceScore >= 3) {
            return 'CAUTIOUS BUY - Partial position';
        } else if (backtestWinRate >= 52 && confluenceScore >= 2) {
            return 'WATCHLIST - Wait for better entry';
        } else {
            return 'AVOID - Poor setup';
        }
    },

    shouldPassThreshold: (confluenceScore, requiredScore) => {
        return confluenceScore >= requiredScore;
    },

    validateActionRecommendationData: (result) => {
        const requiredFields = [
            'ticker', 'lastDate', 'lastClose', 'entry', 'stop', 'target',
            'riskReward', 'backtestWinRate', 'confluenceScore', 'actionRecommendation'
        ];

        return requiredFields.every(field => result.hasOwnProperty(field)) &&
            typeof result.actionRecommendation === 'string' &&
            result.actionRecommendation.length > 0 &&
            ['STRONG BUY', 'BUY', 'CAUTIOUS BUY', 'WATCHLIST', 'AVOID'].some(action =>
                result.actionRecommendation.includes(action)
            );
    },

    getRecommendationCategory: (recommendation) => {
        if (recommendation.includes('STRONG BUY')) return 'STRONG_BUY';
        if (recommendation.includes('BUY') && !recommendation.includes('CAUTIOUS')) return 'BUY';
        if (recommendation.includes('CAUTIOUS BUY')) return 'CAUTIOUS_BUY';
        if (recommendation.includes('WATCHLIST')) return 'WATCHLIST';
        if (recommendation.includes('AVOID')) return 'AVOID';
        return 'UNKNOWN';
    },

    isValidRecommendationFormat: (recommendation) => {
        const validFormats = [
            'STRONG BUY - High confidence',
            'BUY - Good setup',
            'CAUTIOUS BUY - Partial position',
            'WATCHLIST - Wait for better entry',
            'AVOID - Poor setup'
        ];
        return validFormats.includes(recommendation);
    },

    calculateRecommendationPriority: (recommendation) => {
        const priorities = {
            'STRONG BUY - High confidence': 5,
            'BUY - Good setup': 4,
            'CAUTIOUS BUY - Partial position': 3,
            'WATCHLIST - Wait for better entry': 2,
            'AVOID - Poor setup': 1
        };
        return priorities[recommendation] || 0;
    }
};

// Trigger configuration test variations
const triggerConfigTestVariations = {
    veryConservative: {
        scoreGreaterThan: 4,
        MaxLoss: 50000,
        modalTersedia: 2000000,
        intervalMonth: 3
    },

    conservative: {
        scoreGreaterThan: 3,
        MaxLoss: 75000,
        modalTersedia: 3000000,
        intervalMonth: 4
    },

    balanced: {
        scoreGreaterThan: 2,
        MaxLoss: 100000,
        modalTersedia: 5000000,
        intervalMonth: 4
    },

    aggressive: {
        scoreGreaterThan: 1,
        MaxLoss: 150000,
        modalTersedia: 8000000,
        intervalMonth: 6
    },

    veryAggressive: {
        scoreGreaterThan: 0,
        MaxLoss: 200000,
        modalTersedia: 10000000,
        intervalMonth: 6
    }
};

// Expected recommendation distribution for portfolio analysis
const recommendationDistribution = {
    strongBuy: {
        expectedPercentage: '5-15%',
        description: 'Rare, high-conviction opportunities'
    },
    buy: {
        expectedPercentage: '15-25%',
        description: 'Good trading opportunities'
    },
    cautiousBuy: {
        expectedPercentage: '20-30%',
        description: 'Moderate opportunities'
    },
    watchlist: {
        expectedPercentage: '25-35%',
        description: 'Potential future opportunities'
    },
    avoid: {
        expectedPercentage: '20-40%',
        description: 'Poor setups to avoid'
    }
};

// Performance benchmarks for recommendation engine
const recommendationBenchmarks = {
    processing: {
        singleStock: '< 10ms',
        batch100: '< 500ms',
        batch1000: '< 5s'
    },
    accuracy: {
        thresholdClassification: '100%',
        recommendationConsistency: '100%',
        dataPreservation: '100%'
    },
    filtering: {
        belowThresholdFiltering: '100%',
        validRecommendationGeneration: '100%',
        edgeCaseHandling: '100%'
    }
};

module.exports = {
    createActionRecommendationTestData,
    actionRecommendationTestScenarios,
    actionRecommendationRules,
    actionRecommendationHelpers,
    triggerConfigTestVariations,
    recommendationDistribution,
    recommendationBenchmarks
};