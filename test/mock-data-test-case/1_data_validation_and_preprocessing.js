// test/mock-data-test-case/1_data_validation_and_preprocessing.test.js
/**
 * Mock data and test cases for Data Validation and Preprocessing node
 */

const { generateMockCandles } = require('./parse_and_slice');

// Create test data with specific validation scenarios
const createValidationTestData = (scenario) => {
    switch (scenario) {
        case 'valid':
            return {
                ticker: 'VALID_STOCK',
                lastDate: '2024-06-06',
                candles: generateMockCandles(100)
            };

        case 'insufficient_candles':
            return {
                ticker: 'INSUFFICIENT',
                lastDate: '2024-06-06',
                candles: generateMockCandles(30) // Less than 50 required
            };

        case 'null_candles':
            return {
                ticker: 'NULL_CANDLES',
                lastDate: '2024-06-06',
                candles: null
            };

        case 'invalid_data_types':
            return {
                ticker: 'INVALID_TYPES',
                lastDate: '2024-06-06',
                candles: [
                    { date: '2024-01-01', open: null, high: 110, low: 95, close: 105, volume: 1000000 },
                    { date: '2024-01-02', open: 105, high: NaN, low: 100, close: 108, volume: 1500000 },
                    { date: '2024-01-03', open: 'invalid', high: 118, low: 103, close: 112, volume: 1200000 },
                    ...generateMockCandles(50)
                ]
            };

        case 'high_invalid_ratio':
            // More than 10% invalid data
            const baseCandles = generateMockCandles(50);
            const invalidCandles = Array(10).fill().map((_, i) => ({
                date: `2024-02-${String(i + 1).padStart(2, '0')}`,
                open: null,
                high: NaN,
                low: 'invalid',
                close: undefined,
                volume: 'abc'
            }));

            return {
                ticker: 'HIGH_INVALID',
                lastDate: '2024-06-06',
                candles: [...baseCandles, ...invalidCandles]
            };

        case 'invalid_last_candle':
            const validCandles = generateMockCandles(60);
            validCandles[validCandles.length - 1].close = null; // Make last close invalid

            return {
                ticker: 'INVALID_LAST',
                lastDate: '2024-06-06',
                candles: validCandles
            };

        case 'mixed_valid_invalid':
            const mixedCandles = generateMockCandles(70);
            // Insert some invalid candles but keep ratio < 10%
            mixedCandles[10] = { date: '2024-01-11', open: null, high: 110, low: 95, close: 105, volume: 1000000 };
            mixedCandles[20] = { date: '2024-01-21', open: 105, high: NaN, low: 100, close: 108, volume: 1500000 };

            return {
                ticker: 'MIXED_DATA',
                lastDate: '2024-06-06',
                candles: mixedCandles
            };

        default:
            return createValidationTestData('valid');
    }
};

// Test scenarios for data validation
const validationTestScenarios = {
    valid: {
        name: 'Valid Data',
        description: 'All data meets validation criteria',
        data: createValidationTestData('valid'),
        expectedPass: true
    },

    insufficient_candles: {
        name: 'Insufficient Candles',
        description: 'Less than 50 candles available',
        data: createValidationTestData('insufficient_candles'),
        expectedPass: false
    },

    null_candles: {
        name: 'Null Candles',
        description: 'Candles array is null',
        data: createValidationTestData('null_candles'),
        expectedPass: false
    },

    invalid_data_types: {
        name: 'Invalid Data Types',
        description: 'Contains null, NaN, and string values in numeric fields',
        data: createValidationTestData('invalid_data_types'),
        expectedPass: true // Should pass after filtering invalid candles
    },

    high_invalid_ratio: {
        name: 'High Invalid Ratio',
        description: 'More than 10% of candles are invalid',
        data: createValidationTestData('high_invalid_ratio'),
        expectedPass: false
    },

    invalid_last_candle: {
        name: 'Invalid Last Candle',
        description: 'Last candle has invalid close price',
        data: createValidationTestData('invalid_last_candle'),
        expectedPass: false
    },

    mixed_valid_invalid: {
        name: 'Mixed Valid/Invalid',
        description: 'Some invalid candles but ratio < 10%',
        data: createValidationTestData('mixed_valid_invalid'),
        expectedPass: true
    }
};

// Quality thresholds
const validationThresholds = {
    minimumCandles: 50,
    validDataRatio: 0.9, // 90% of candles must be valid
    requiredFields: ['open', 'high', 'low', 'close', 'volume'],
    dataTypes: {
        open: 'number',
        high: 'number',
        low: 'number',
        close: 'number',
        volume: 'number'
    }
};

// Helper functions for validation testing
const validationHelpers = {
    isValidCandle: (candle) => {
        return candle &&
            typeof candle.close === 'number' && !isNaN(candle.close) &&
            typeof candle.open === 'number' && !isNaN(candle.open) &&
            typeof candle.high === 'number' && !isNaN(candle.high) &&
            typeof candle.low === 'number' && !isNaN(candle.low) &&
            typeof candle.volume === 'number' && !isNaN(candle.volume);
    },

    calculateValidRatio: (candles) => {
        if (!Array.isArray(candles) || candles.length === 0) return 0;
        const validCount = candles.filter(validationHelpers.isValidCandle).length;
        return validCount / candles.length;
    },

    hasValidLastCandle: (candles) => {
        if (!Array.isArray(candles) || candles.length === 0) return false;
        const lastCandle = candles[candles.length - 1];
        return lastCandle && typeof lastCandle.close === 'number' && !isNaN(lastCandle.close);
    }
};

module.exports = {
    createValidationTestData,
    validationTestScenarios,
    validationThresholds,
    validationHelpers
};