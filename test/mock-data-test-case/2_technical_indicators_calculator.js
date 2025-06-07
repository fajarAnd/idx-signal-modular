// test/mock-data-test-case/2_technical_indicators_calculator.test.js
/**
 * Mock data and test cases for Technical Indicators Calculator node
 */

const { generateMockCandles } = require('./parse_and_slice');

// Create specific test data for technical indicators
const createIndicatorTestData = (scenario) => {
    switch (scenario) {
        case 'sufficient_data':
            return {
                ticker: 'INDICATOR_TEST',
                lastDate: '2024-06-06',
                candles: generateMockCandles(100),
                lastClose: 2500,
                isValid: true
            };

        case 'insufficient_data':
            return {
                ticker: 'INSUFFICIENT_IND',
                lastDate: '2024-06-06',
                candles: generateMockCandles(10), // Too few for most indicators
                lastClose: 2500,
                isValid: true
            };

        case 'trending_up':
            // Create uptrending data for testing RSI/MACD
            const uptrendCandles = [];
            for (let i = 0; i < 50; i++) {
                uptrendCandles.push({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2000 + i * 10,
                    high: 2020 + i * 10,
                    low: 1990 + i * 10,
                    close: 2010 + i * 10,
                    volume: 1000000 + Math.random() * 500000
                });
            }
            return {
                ticker: 'UPTREND_TEST',
                lastDate: '2024-06-06',
                candles: uptrendCandles,
                lastClose: uptrendCandles[uptrendCandles.length - 1].close,
                isValid: true
            };

        case 'trending_down':
            // Create consistent downtrending data for RSI testing
            const downtrendCandles = [];
            let currentPrice = 3000;

            // Create 15 periods of mixed movement first (neutral)
            for (let i = 0; i < 15; i++) {
                const change = (Math.random() - 0.5) * 20; // ±10 point random movement
                const open = currentPrice;
                const close = open + change;
                const high = Math.max(open, close) + Math.random() * 5;
                const low = Math.min(open, close) - Math.random() * 5;

                downtrendCandles.push({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: Math.round(open),
                    high: Math.round(high),
                    low: Math.round(low),
                    close: Math.round(close),
                    volume: 1000000 + Math.random() * 500000
                });

                currentPrice = close;
            }

            // Create consistent downtrend for the last 35 periods to ensure RSI < 50
            for (let i = 15; i < 50; i++) {
                const decline = 15 + (Math.random() * 15); // 15-30 point decline per period
                const open = currentPrice;
                const close = open - decline;
                const high = open + (Math.random() * 5); // Small upward wick
                const low = close - (Math.random() * 5); // Small downward wick

                downtrendCandles.push({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: Math.round(open),
                    high: Math.round(Math.max(open, close, high)),
                    low: Math.round(Math.min(open, close, low)),
                    close: Math.round(close),
                    volume: 1000000 + Math.random() * 500000
                });

                currentPrice = close;
            }

            return {
                ticker: 'DOWNTREND_TEST',
                lastDate: '2024-06-06',
                candles: downtrendCandles,
                lastClose: downtrendCandles[downtrendCandles.length - 1].close,
                isValid: true
            };

        case 'sideways':
            // Create sideways/consolidation data
            const sidewaysCandles = [];
            for (let i = 0; i < 50; i++) {
                const basePrice = 2500;
                const volatility = 50;
                sidewaysCandles.push({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: basePrice + (Math.random() - 0.5) * volatility,
                    high: basePrice + Math.random() * volatility,
                    low: basePrice - Math.random() * volatility,
                    close: basePrice + (Math.random() - 0.5) * volatility,
                    volume: 1000000 + Math.random() * 500000
                });
            }
            return {
                ticker: 'SIDEWAYS_TEST',
                lastDate: '2024-06-06',
                candles: sidewaysCandles,
                lastClose: sidewaysCandles[sidewaysCandles.length - 1].close,
                isValid: true
            };

        case 'high_volume':
            const highVolCandles = generateMockCandles(60);
            // Create more predictable volume pattern
            const baseVolume = 1000000;

            // Set baseline volume for most candles
            for (let i = 0; i < highVolCandles.length - 10; i++) {
                highVolCandles[i].volume = baseVolume + (Math.random() * 200000);
            }

            // Set high volume for last 10 candles to ensure spike detection
            for (let i = highVolCandles.length - 10; i < highVolCandles.length; i++) {
                highVolCandles[i].volume = baseVolume * 4; // 4x normal volume to ensure spike
            }

            // Also increase volume for last 5 candles to ensure volSMA5 > volSMA20
            for (let i = highVolCandles.length - 5; i < highVolCandles.length; i++) {
                highVolCandles[i].volume = baseVolume * 5; // 5x normal volume
            }

            return {
                ticker: 'HIGH_VOLUME_TEST',
                lastDate: '2024-06-06',
                candles: highVolCandles,
                lastClose: highVolCandles[highVolCandles.length - 1].close,
                isValid: true
            };

        case 'null_candles':
            return {
                ticker: 'NULL_CANDLES_IND',
                lastDate: '2024-06-06',
                candles: null,
                lastClose: 2500,
                isValid: true
            };

        default:
            return createIndicatorTestData('sufficient_data');
    }
};

// Expected indicator ranges and validation
const indicatorValidation = {
    rsi: { min: 0, max: 100 },
    stochRsi: { min: 0, max: 1 },
    sma20: { shouldBePositive: true },
    sma50: { shouldBePositive: true },
    ema21: { shouldBePositive: true },
    macd: {
        macdLine: { canBeNegative: true },
        signalLine: { canBeNegative: true },
        histogram: { canBeNegative: true }
    },
    bollingerBands: {
        upper: { shouldBePositive: true },
        middle: { shouldBePositive: true },
        lower: { shouldBePositive: true },
        relationship: 'upper > middle > lower'
    },
    atr14: { shouldBePositive: true },
    atr21: { shouldBePositive: true },
    volSMA20: { shouldBePositive: true },
    volSMA5: { shouldBePositive: true },
    currentVolume: { shouldBePositive: true }
};

// Test scenarios for technical indicators
const indicatorTestScenarios = {
    sufficient_data: {
        name: 'Sufficient Data',
        description: 'Enough data for all indicators',
        data: createIndicatorTestData('sufficient_data'),
        expectedPass: true,
        expectedIndicators: Object.keys(indicatorValidation)
    },

    insufficient_data: {
        name: 'Insufficient Data',
        description: 'Not enough data for complex indicators',
        data: createIndicatorTestData('insufficient_data'),
        expectedPass: true,
        expectedDefaults: ['rsi', 'macd', 'stochRsi'] // These should return default values
    },

    trending_up: {
        name: 'Uptrending Market',
        description: 'Strong uptrend for RSI/momentum testing',
        data: createIndicatorTestData('trending_up'),
        expectedPass: true,
        expectedBehavior: {
            rsi: 'should be > 50',
            sma20: 'should be > sma50 for recent data',
            macd: 'histogram should trend positive'
        }
    },

    trending_down: {
        name: 'Downtrending Market',
        description: 'Strong downtrend for RSI/momentum testing',
        data: createIndicatorTestData('trending_down'),
        expectedPass: true,
        expectedBehavior: {
            rsi: 'should be < 50',
            macd: 'histogram should trend negative'
        }
    },

    high_volume: {
        name: 'High Volume Period',
        description: 'Testing volume-based indicators',
        data: createIndicatorTestData('high_volume'),
        expectedPass: true,
        expectedBehavior: {
            currentVolume: 'should be > volSMA20',
            volSMA5: 'should be > volSMA20'
        }
    },

    null_candles: {
        name: 'Null Candles',
        description: 'Null candles input handling',
        data: createIndicatorTestData('null_candles'),
        expectedPass: true,
        expectedDefaults: Object.keys(indicatorValidation)
    }
};

// Helper functions for indicator testing
const indicatorHelpers = {
    validateIndicatorRange: (value, range) => {
        if (range.min !== undefined && value < range.min) return false;
        if (range.max !== undefined && value > range.max) return false;
        if (range.shouldBePositive && value <= 0) return false;
        return true;
    },

    validateMACD: (macd) => {
        return macd &&
            typeof macd.macdLine === 'number' && !isNaN(macd.macdLine) &&
            typeof macd.signalLine === 'number' && !isNaN(macd.signalLine) &&
            typeof macd.histogram === 'number' && !isNaN(macd.histogram) &&
            Math.abs(macd.histogram - (macd.macdLine - macd.signalLine)) < 0.001;
    },

    validateBollingerBands: (bb) => {
        return bb &&
            typeof bb.upper === 'number' && !isNaN(bb.upper) &&
            typeof bb.middle === 'number' && !isNaN(bb.middle) &&
            typeof bb.lower === 'number' && !isNaN(bb.lower) &&
            bb.upper > bb.middle && bb.middle > bb.lower;
    },

    isDefaultRSI: (rsi) => rsi === 50,
    isDefaultMACD: (macd) => macd.macdLine === 0 && macd.signalLine === 0 && macd.histogram === 0,
    isDefaultStochRSI: (stochRsi) => stochRsi === 0
};

module.exports = {
    createIndicatorTestData,
    indicatorTestScenarios,
    indicatorValidation,
    indicatorHelpers
};