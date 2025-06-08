// test/mock-data-test-case/all_nodes_common.js
/**
 * Common mock data and utilities used across all node tests
 */

// Mock $input.all() function simulator
const createMockInput = (data) => ({
    all: () => data.map(item => ({ json: item }))
});

// Mock $() function to simulate N8N node access
const createMockNodeAccess = (triggerData) => (nodeName) => ({
    first: () => ({ json: triggerData })
});

// Common mock indicators data
const mockIndicators = {
    sma20: 2500,
    sma50: 2400,
    ema21: 2520,
    rsi: 35.5,
    stochRsi: 0.25,
    macd: {
        macdLine: 12.5,
        signalLine: 8.3,
        histogram: 4.2
    },
    bollingerBands: {
        upper: 2800,
        middle: 2500,
        lower: 2200
    },
    atr14: 85,
    atr21: 92,
    volSMA20: 5000000,
    volSMA5: 6000000,
    currentVolume: 8500000
};

// Mock support/resistance data
const mockSupportResistance = {
    support: {
        type: 'S',
        price: 2400,
        strength: 1.5,
        index: 85,
        age: 15,
        tests: 3
    },
    resistance: {
        type: 'R',
        price: 2800,
        strength: 1.3,
        index: 92
    }
};

// Mock confluence data
const mockConfluence = {
    score: 4,
    hits: [
        'Multi-timeframe bullish alignment',
        'RSI oversold (35.5)',
        'Volume spike detected',
        'Strong support (3 tests, 15 periods old)'
    ]
};

// Mock entry/exit data
const mockEntryExit = {
    entry: 2420,
    stop: 2320,
    target: 2650,
    riskReward: 2.3,
    entryGapPercent: 1.5,
    riskLot: 100,
    rewardLot: 230,
    entryStrategy: 'Breakout Entry (Acceptable Gap)'
};

// Mock backtest data
const mockBacktest = {
    wins: 15,
    losses: 8,
    total: 23,
    winRateDec: 0.652,
    backtestWinRate: 65.2
};

// Complete stock data with all stages
const createCompleteStockData = (ticker = 'TEST_STOCK', overrides = {}) => ({
    ticker,
    lastDate: '2024-06-06',
    lastClose: 2500,
    candles: overrides.candles || [],
    indicators: { ...mockIndicators, ...overrides.indicators },
    support: { ...mockSupportResistance.support, ...overrides.support },
    resistance: { ...mockSupportResistance.resistance, ...overrides.resistance },
    confluence: { ...mockConfluence, ...overrides.confluence },
    entryExit: { ...mockEntryExit, ...overrides.entryExit },
    backtest: { ...mockBacktest, ...overrides.backtest },
    isValid: true,
    ...overrides
});

// Test data variations for different scenarios
const testDataVariations = {
    normal: {
        name: 'Normal Trading Setup',
        data: createCompleteStockData('NORMAL_STOCK'),
        expectedPass: true
    },

    excellent: {
        name: 'Excellent Trading Setup',
        data: createCompleteStockData('EXCELLENT_STOCK', {
            confluence: { score: 7, hits: ['Multiple bullish signals'] },
            entryExit: { ...mockEntryExit, riskReward: 3.5 },
            backtest: { ...mockBacktest, winRateDec: 0.85, backtestWinRate: 85.0 }
        }),
        expectedPass: true
    },

    poor: {
        name: 'Poor Trading Setup',
        data: createCompleteStockData('POOR_STOCK', {
            confluence: { score: 1, hits: [] },
            entryExit: { ...mockEntryExit, riskReward: 1.2 },
            backtest: { ...mockBacktest, winRateDec: 0.35, backtestWinRate: 35.0 }
        }),
        expectedPass: false
    },

    highVolatility: {
        name: 'High Volatility Stock',
        data: createCompleteStockData('VOLATILE_STOCK', {
            indicators: { ...mockIndicators, atr14: 200, atr21: 220 },
            entryExit: { ...mockEntryExit, riskLot: 250, rewardLot: 500 }
        }),
        expectedPass: true
    },

    lowVolume: {
        name: 'Low Volume Stock',
        data: createCompleteStockData('LOW_VOL_STOCK', {
            indicators: {
                ...mockIndicators,
                currentVolume: 1000000,
                volSMA20: 2000000,
                volSMA5: 1500000
            }
        }),
        expectedPass: true
    }
};

// Trigger data variations for different risk profiles
const triggerDataVariations = {
    conservative: {
        intervalMonth: 4,
        modalTersedia: 2000000,    // 2M IDR
        scoreGreaterThan: 3,       // Higher threshold
        MaxLoss: 50000            // 50K IDR max loss
    },

    aggressive: {
        intervalMonth: 6,
        modalTersedia: 10000000,   // 10M IDR
        scoreGreaterThan: 1,       // Lower threshold
        MaxLoss: 200000           // 200K IDR max loss
    },

    balanced: {
        intervalMonth: 4,
        modalTersedia: 5000000,    // 5M IDR
        scoreGreaterThan: 2,       // Medium threshold
        MaxLoss: 100000           // 100K IDR max loss
    }
};

// Performance test data generator
const generatePerformanceTestData = (count = 100) => {
    const data = [];
    for (let i = 0; i < count; i++) {
        data.push(createCompleteStockData(`PERF_STOCK_${i}`, {
            lastClose: 2000 + Math.random() * 2000,
            confluence: {
                score: Math.floor(Math.random() * 8) + 1,
                hits: [`Signal ${i}`]
            }
        }));
    }
    return data;
};

// Validation helpers
const validationHelpers = {
    isValidNumber: (value) => typeof value === 'number' && !isNaN(value) && isFinite(value),

    isValidPrice: (price) => validationHelpers.isValidNumber(price) && price > 0,

    isValidRatio: (ratio) => validationHelpers.isValidNumber(ratio) && ratio >= 0,

    isValidPercentage: (pct) => validationHelpers.isValidNumber(pct) && pct >= 0 && pct <= 100,

    isValidVolume: (volume) => validationHelpers.isValidNumber(volume) && volume >= 0,

    hasRequiredFields: (obj, fields) => {
        return fields.every(field => obj.hasOwnProperty(field));
    },

    isValidCandle: (candle) => {
        const requiredFields = ['date', 'open', 'high', 'low', 'close', 'volume'];
        return validationHelpers.hasRequiredFields(candle, requiredFields) &&
            validationHelpers.isValidPrice(candle.open) &&
            validationHelpers.isValidPrice(candle.high) &&
            validationHelpers.isValidPrice(candle.low) &&
            validationHelpers.isValidPrice(candle.close) &&
            validationHelpers.isValidVolume(candle.volume) &&
            candle.high >= Math.max(candle.open, candle.close) &&
            candle.low <= Math.min(candle.open, candle.close);
    },

    validatePriceRelationships: (entry, stop, target) => {
        return validationHelpers.isValidPrice(entry) &&
            validationHelpers.isValidPrice(stop) &&
            validationHelpers.isValidPrice(target) &&
            stop < entry && entry < target;
    }
};

// Error scenarios for testing error handling
const errorScenarios = {
    nullData: {
        name: 'Null Input Data',
        data: null,
        expectedError: true
    },

    emptyArray: {
        name: 'Empty Array',
        data: [],
        expectedError: false,
        expectedLength: 0
    },

    invalidStructure: {
        name: 'Invalid Data Structure',
        data: [{ invalidField: 'test' }],
        expectedError: false,
        expectedLength: 0
    },

    missingFields: {
        name: 'Missing Required Fields',
        data: createCompleteStockData('MISSING_FIELDS', {
            indicators: undefined,
            support: undefined
        }),
        expectedError: false,
        expectedLength: 0
    }
};

const mockCurrentOpenPosition = {
    "codes": [
        "ULTJ",
        "HAIS",
        "BIPI",
        "MAPI"
    ]
}

module.exports = {
    createMockInput,
    createMockNodeAccess,
    mockIndicators,
    mockSupportResistance,
    mockConfluence,
    mockEntryExit,
    mockBacktest,
    createCompleteStockData,
    testDataVariations,
    triggerDataVariations,
    generatePerformanceTestData,
    validationHelpers,
    errorScenarios,
    mockCurrentOpenPosition
};