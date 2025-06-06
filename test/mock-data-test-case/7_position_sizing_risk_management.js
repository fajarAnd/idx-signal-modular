// test/mock-data-test-case/7_position_sizing_risk_management.test.js
/**
 * Mock data and test cases for Position Sizing & Risk Management node
 */

const { mockIndicators, mockSupportResistance, mockConfluence } = require('./all_nodes_common');

// Create specific test data for position sizing scenarios
const createPositionSizingTestData = (scenario, triggerConfig = {}) => {
    const defaultTriggerConfig = {
        MaxLoss: 100000,        // 100K IDR max loss
        modalTersedia: 5000000, // 5M IDR available capital
        intervalMonth: 4,
        scoreGreaterThan: 2
    };

    const config = { ...defaultTriggerConfig, ...triggerConfig };

    const baseCandles = Array(100).fill().map((_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 2500,
        high: 2550,
        low: 2450,
        close: 2500,
        volume: 3000000
    }));

    let customData;

    switch (scenario) {
        case 'standard_setup':
            customData = {
                ticker: 'STANDARD_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 1.5,
                entryExit: {
                    entry: 2400,
                    stop: 2300,
                    target: 2600,
                    riskReward: 2.0,
                    entryGapPercent: 1.5,
                    riskLot: 100,
                    rewardLot: 200,
                    entryStrategy: 'Breakout Entry (Acceptable Gap)'
                },
                backtest: {
                    wins: 15,
                    losses: 8,
                    total: 23,
                    winRateDec: 0.652,
                    backtestWinRate: 65.2
                },
                confluenceScore: 4,
                indicators: {
                    ...mockIndicators,
                    sma20: 2500,
                    sma50: 2400,
                    atr14: 85
                },
                support: mockSupportResistance.support,
                resistance: mockSupportResistance.resistance,
                confluence: mockConfluence
            };
            break;

        case 'low_capital':
            customData = {
                ticker: 'LOW_CAPITAL_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 2.0,
                entryExit: {
                    entry: 2400,
                    stop: 2300,
                    target: 2600,
                    riskReward: 2.0,
                    entryGapPercent: 2.0,
                    riskLot: 100,
                    rewardLot: 200,
                    entryStrategy: 'Breakout Entry (Acceptable Gap)'
                },
                backtest: {
                    wins: 12,
                    losses: 6,
                    total: 18,
                    winRateDec: 0.667,
                    backtestWinRate: 66.7
                },
                confluenceScore: 3,
                indicators: {
                    ...mockIndicators,
                    sma20: 2500,
                    sma50: 2400,
                    atr14: 85
                },
                support: mockSupportResistance.support,
                resistance: mockSupportResistance.resistance,
                confluence: mockConfluence
            };
            break;

        case 'high_risk_stock':
            customData = {
                ticker: 'HIGH_RISK_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 3.5,
                entryExit: {
                    entry: 2400,
                    stop: 2100, // Large risk lot
                    target: 2800,
                    riskReward: 1.33,
                    entryGapPercent: 3.5,
                    riskLot: 300, // High risk per lot
                    rewardLot: 400,
                    entryStrategy: 'Aggressive Entry (High Risk)'
                },
                backtest: {
                    wins: 8,
                    losses: 7,
                    total: 15,
                    winRateDec: 0.533,
                    backtestWinRate: 53.3
                },
                confluenceScore: 2,
                indicators: {
                    ...mockIndicators,
                    sma20: 2500,
                    sma50: 2400,
                    atr14: 250 // High volatility
                },
                support: mockSupportResistance.support,
                resistance: mockSupportResistance.resistance,
                confluence: mockConfluence
            };
            break;

        case 'expensive_stock':
            customData = {
                ticker: 'EXPENSIVE_STOCK',
                lastDate: '2024-06-06',
                lastClose: 15000, // High price stock
                entryGapPercent: 1.2,
                entryExit: {
                    entry: 14800,
                    stop: 14600,
                    target: 15200,
                    riskReward: 2.0,
                    entryGapPercent: 1.2,
                    riskLot: 200,
                    rewardLot: 400,
                    entryStrategy: 'Immediate Entry (At Support)'
                },
                backtest: {
                    wins: 18,
                    losses: 7,
                    total: 25,
                    winRateDec: 0.72,
                    backtestWinRate: 72.0
                },
                confluenceScore: 5,
                indicators: {
                    ...mockIndicators,
                    sma20: 15000,
                    sma50: 14500,
                    atr14: 180
                },
                support: { ...mockSupportResistance.support, price: 14600 },
                resistance: { ...mockSupportResistance.resistance, price: 15400 },
                confluence: { ...mockConfluence, score: 5 }
            };
            break;

        case 'uptrend_stock':
            customData = {
                ticker: 'UPTREND_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2600,
                entryGapPercent: 0.8,
                entryExit: {
                    entry: 2580,
                    stop: 2480,
                    target: 2780,
                    riskReward: 2.0,
                    entryGapPercent: 0.8,
                    riskLot: 100,
                    rewardLot: 200,
                    entryStrategy: 'Immediate Entry (At Support)'
                },
                backtest: {
                    wins: 20,
                    losses: 5,
                    total: 25,
                    winRateDec: 0.8,
                    backtestWinRate: 80.0
                },
                confluenceScore: 6,
                indicators: {
                    ...mockIndicators,
                    sma20: 2580, // Above SMA20
                    sma50: 2480, // Above SMA50
                    atr14: 90
                },
                support: { ...mockSupportResistance.support, price: 2480 },
                resistance: { ...mockSupportResistance.resistance, price: 2800 },
                confluence: { ...mockConfluence, score: 6 }
            };
            break;

        case 'downtrend_stock':
            customData = {
                ticker: 'DOWNTREND_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2300,
                entryGapPercent: 4.5,
                entryExit: {
                    entry: 2400,
                    stop: 2300,
                    target: 2600,
                    riskReward: 2.0,
                    entryGapPercent: 4.5,
                    riskLot: 100,
                    rewardLot: 200,
                    entryStrategy: 'Aggressive Entry (High Risk)'
                },
                backtest: {
                    wins: 10,
                    losses: 8,
                    total: 18,
                    winRateDec: 0.556,
                    backtestWinRate: 55.6
                },
                confluenceScore: 2,
                indicators: {
                    ...mockIndicators,
                    sma20: 2350, // Below SMA20
                    sma50: 2450, // Below SMA50
                    atr14: 95
                },
                support: mockSupportResistance.support,
                resistance: mockSupportResistance.resistance,
                confluence: { ...mockConfluence, score: 2 }
            };
            break;

        case 'sideways_stock':
            customData = {
                ticker: 'SIDEWAYS_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 2.0,
                entryExit: {
                    entry: 2450,
                    stop: 2380,
                    target: 2590,
                    riskReward: 2.0,
                    entryGapPercent: 2.0,
                    riskLot: 70,
                    rewardLot: 140,
                    entryStrategy: 'Breakout Entry (Acceptable Gap)'
                },
                backtest: {
                    wins: 13,
                    losses: 9,
                    total: 22,
                    winRateDec: 0.591,
                    backtestWinRate: 59.1
                },
                confluenceScore: 3,
                indicators: {
                    ...mockIndicators,
                    sma20: 2490, // Around SMA20
                    sma50: 2510, // Around SMA50
                    atr14: 65
                },
                support: { ...mockSupportResistance.support, price: 2400 },
                resistance: { ...mockSupportResistance.resistance, price: 2600 },
                confluence: { ...mockConfluence, score: 3 }
            };
            break;

        default:
            customData = {
                ticker: 'DEFAULT_STOCK',
                lastDate: '2024-06-06',
                lastClose: 2500,
                entryGapPercent: 1.5,
                entryExit: {
                    entry: 2400,
                    stop: 2300,
                    target: 2600,
                    riskReward: 2.0,
                    entryGapPercent: 1.5,
                    riskLot: 100,
                    rewardLot: 200,
                    entryStrategy: 'Breakout Entry (Acceptable Gap)'
                },
                backtest: {
                    wins: 15,
                    losses: 8,
                    total: 23,
                    winRateDec: 0.652,
                    backtestWinRate: 65.2
                },
                confluenceScore: 4,
                indicators: mockIndicators,
                support: mockSupportResistance.support,
                resistance: mockSupportResistance.resistance,
                confluence: mockConfluence
            };
    }

    return {
        ...customData,
        candles: baseCandles,
        triggerConfig: config
    };
};

// Position sizing calculation rules
const positionSizingRules = {
    lotValue: 100,
    qtyCalculation: {
        risk: 'Math.floor(MAX_LOSS / riskLot)',
        funds: 'Math.floor(CAPITAL / (entry * lotValue))',
        final: 'Math.max(1, Math.min(qtyRisk, qtyFunds))'
    },
    nominalCalculation: {
        loss: 'qty * lotValue * riskLot',
        profit: 'qty * lotValue * rewardLot',
        expectancy: 'winRate * nominalProfit - (1 - winRate) * nominalLoss'
    },
    marketPhase: {
        uptrend: 'lastClose > sma20 && sma20 > sma50',
        downtrend: 'lastClose < sma20 && sma20 < sma50',
        sideways: 'default case'
    }
};

// Test scenarios for position sizing
const positionSizingTestScenarios = {
    standard_setup: {
        name: 'Standard Trading Setup',
        description: 'Normal capital and risk parameters',
        data: createPositionSizingTestData('standard_setup'),
        expectedPass: true,
        expectedCalculations: {
            hasValidQty: true,
            hasPositiveExpectancy: true,
            hasTotalCost: true,
            hasMarketPhase: true
        }
    },

    low_capital: {
        name: 'Low Capital Scenario',
        description: 'Limited capital affecting position size',
        data: createPositionSizingTestData('low_capital', { modalTersedia: 1000000 }), // 1M IDR
        expectedPass: true,
        expectedCalculations: {
            capitalLimited: true,
            smallerPosition: true
        }
    },

    high_risk_stock: {
        name: 'High Risk Stock',
        description: 'Large risk lot limiting position size',
        data: createPositionSizingTestData('high_risk_stock'),
        expectedPass: true,
        expectedCalculations: {
            riskLimited: true,
            smallerPosition: true
        }
    },

    expensive_stock: {
        name: 'Expensive Stock',
        description: 'High price stock with capital constraints',
        data: createPositionSizingTestData('expensive_stock'),
        expectedPass: true,
        expectedCalculations: {
            expensiveStock: true,
            capitalImpact: true
        }
    },

    uptrend_stock: {
        name: 'Uptrend Market Phase',
        description: 'Stock in clear uptrend',
        data: createPositionSizingTestData('uptrend_stock'),
        expectedPass: true,
        expectedCalculations: {
            marketPhase: 'Uptrend',
            goodMetrics: true
        }
    },

    downtrend_stock: {
        name: 'Downtrend Market Phase',
        description: 'Stock in clear downtrend',
        data: createPositionSizingTestData('downtrend_stock'),
        expectedPass: true,
        expectedCalculations: {
            marketPhase: 'Downtrend',
            higherRisk: true
        }
    },

    sideways_stock: {
        name: 'Sideways Market Phase',
        description: 'Stock in sideways movement',
        data: createPositionSizingTestData('sideways_stock'),
        expectedPass: true,
        expectedCalculations: {
            marketPhase: 'Sideways',
            moderateMetrics: true
        }
    }
};

// Helper functions for position sizing testing
const positionSizingHelpers = {
    calculateExpectedQty: (maxLoss, riskLot, capital, entry, lotValue = 100) => {
        const qtyRisk = Math.floor(maxLoss / riskLot);
        const qtyFunds = Math.floor(capital / (entry * lotValue));
        return Math.max(1, Math.min(qtyRisk, qtyFunds));
    },

    calculateExpectedNominals: (qty, riskLot, rewardLot, lotValue = 100) => {
        const nominalLoss = qty * lotValue * riskLot;
        const nominalProfit = qty * lotValue * rewardLot;
        return { nominalLoss, nominalProfit };
    },

    calculateExpectedExpectancy: (winRate, nominalProfit, nominalLoss) => {
        return Math.round(winRate * nominalProfit - (1 - winRate) * nominalLoss);
    },

    determineMarketPhase: (lastClose, sma20, sma50) => {
        if (lastClose > sma20 && sma20 > sma50) return 'Uptrend';
        if (lastClose < sma20 && sma20 < sma50) return 'Downtrend';
        return 'Sideways';
    },

    validatePositionSizingData: (result) => {
        const requiredFields = [
            'ticker', 'lastClose', 'entry', 'stop', 'target', 'riskReward',
            'backtestWinRate', 'confluenceScore', 'qty', 'totalCost',
            'nominalProfit', 'nominalLoss', 'expectancy', 'marketPhase'
        ];

        return requiredFields.every(field => result.hasOwnProperty(field)) &&
            typeof result.qty === 'number' && result.qty >= 1 &&
            typeof result.riskReward === 'number' && result.riskReward > 0 &&
            typeof result.backtestWinRate === 'number' &&
            ['Uptrend', 'Downtrend', 'Sideways'].includes(result.marketPhase);
    },

    isValidIDRFormat: (value) => {
        // Check if value is properly formatted as Indonesian currency
        return typeof value === 'string' &&
            value.replace(/\./g, '').match(/^\d+$/);
    },

    parseIDRValue: (formattedValue) => {
        return parseInt(formattedValue.replace(/\./g, ''));
    }
};

// Trigger configuration variations
const triggerConfigVariations = {
    conservative: {
        MaxLoss: 50000,         // 50K IDR
        modalTersedia: 2000000, // 2M IDR
        scoreGreaterThan: 3,
        intervalMonth: 4
    },

    aggressive: {
        MaxLoss: 200000,        // 200K IDR
        modalTersedia: 10000000,// 10M IDR
        scoreGreaterThan: 1,
        intervalMonth: 6
    },

    balanced: {
        MaxLoss: 100000,        // 100K IDR
        modalTersedia: 5000000, // 5M IDR
        scoreGreaterThan: 2,
        intervalMonth: 4
    },

    lowCapital: {
        MaxLoss: 25000,         // 25K IDR
        modalTersedia: 500000,  // 500K IDR
        scoreGreaterThan: 4,
        intervalMonth: 3
    }
};

module.exports = {
    createPositionSizingTestData,
    positionSizingTestScenarios,
    positionSizingRules,
    positionSizingHelpers,
    triggerConfigVariations
};