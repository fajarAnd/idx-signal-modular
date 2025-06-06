// test/nodes/1_data_validation_and_preprocessing.test.js
const { expect } = require('chai');
const dataValidationAndPreprocessing = require('../../src/nodes/1_data_validation_and_preprocessing');
const { validationTestScenarios, validationHelpers, createValidationTestData } = require('../mock-data-test-case/1_data_validation_and_preprocessing');
const { createMockInput } = require('../mock-data-test-case/parse_and_slice');

describe('Data Validation & Preprocessing Node', () => {

    describe('Valid Data Processing', () => {
        it('should process valid data with sufficient candles', () => {
            const testData = [validationTestScenarios.valid.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json).to.have.property('ticker', 'VALID_STOCK');
            expect(result[0].json).to.have.property('isValid', true);
            expect(result[0].json).to.have.property('lastClose');
            expect(result[0].json.lastClose).to.be.a('number');
            expect(result[0].json.candles.length).to.be.greaterThanOrEqual(50);
        });

        it('should calculate lastClose correctly', () => {
            const testData = [createValidationTestData('valid')];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);
            const originalLastClose = testData[0].candles[testData[0].candles.length - 1].close;
            expect(result[0].json.lastClose).to.equal(originalLastClose);
        });

        it('should preserve all valid candles', () => {
            const testData = [validationTestScenarios.mixed_valid_invalid.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);

            result[0].json.candles.forEach(candle => {
                expect(validationHelpers.isValidCandle(candle)).to.be.true;
            });
        });
    });

    describe('Invalid Data Filtering', () => {
        it('should reject data with insufficient candles (< 50)', () => {
            const testData = [validationTestScenarios.insufficient_candles.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should reject data with null candles array', () => {
            const testData = [validationTestScenarios.null_candles.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should reject data with non-array candles', () => {
            const testData = [{
                ticker: 'NOT_ARRAY',
                lastDate: '2024-06-06',
                candles: 'not an array'
            }];

            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should reject data with too many invalid candles (> 10%)', () => {
            const testData = [validationTestScenarios.high_invalid_ratio.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should reject data with invalid last candle', () => {
            const testData = [validationTestScenarios.invalid_last_candle.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(0);
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(validationTestScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const result = dataValidationAndPreprocessing(mockInput);

                if (scenario.expectedPass) {
                    expect(result).to.have.lengthOf(1);
                    expect(result[0].json).to.have.property('isValid', true);
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should filter out invalid candles but keep valid ones', () => {
            const testData = [validationTestScenarios.invalid_data_types.data];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);
            // Should have filtered out invalid candles
            expect(result[0].json.candles.length).to.be.lessThan(testData[0].candles.length);
            // All remaining candles should be valid
            result[0].json.candles.forEach(candle => {
                expect(validationHelpers.isValidCandle(candle)).to.be.true;
            });
        });

        it('should handle candles with zero values', () => {
            const candlesWithZeros = [
                { date: '2024-01-01', open: 0, high: 110, low: 95, close: 105, volume: 1000000 },
                { date: '2024-01-02', open: 105, high: 115, low: 100, close: 0, volume: 1500000 },
                { date: '2024-01-03', open: 108, high: 118, low: 103, close: 112, volume: 0 }
            ];

            const validCandles = Array(50).fill().map((_, i) => ({
                date: `2024-02-${String(i + 1).padStart(2, '0')}`,
                open: 100 + i,
                high: 110 + i,
                low: 95 + i,
                close: 105 + i,
                volume: 1000000 + i * 1000
            }));

            const testData = [{
                ticker: 'ZERO_TEST',
                lastDate: '2024-06-06',
                candles: [...candlesWithZeros, ...validCandles]
            }];

            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);
            // Zero values should be considered valid numbers
            expect(result[0].json.candles.length).to.be.greaterThan(50);
        });

        it('should handle exactly 50 candles (minimum requirement)', () => {
            const exactCandles = Array(50).fill().map((_, i) => ({
                date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                open: 100 + i,
                high: 110 + i,
                low: 95 + i,
                close: 105 + i,
                volume: 1000000 + i * 1000
            }));

            const testData = [{
                ticker: 'EXACT_MIN',
                lastDate: '2024-06-06',
                candles: exactCandles
            }];

            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.candles).to.have.lengthOf(50);
        });
    });

    describe('Data Quality Validation', () => {
        it('should maintain data integrity after validation', () => {
            const testData = [createValidationTestData('valid')];
            const originalCandles = [...testData[0].candles];

            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);

            const processedCandles = result[0].json.candles;
            expect(processedCandles).to.have.lengthOf(originalCandles.length);

            // Check that all processed candles match original valid candles
            processedCandles.forEach((candle, index) => {
                expect(candle.date).to.equal(originalCandles[index].date);
                expect(candle.open).to.equal(originalCandles[index].open);
                expect(candle.high).to.equal(originalCandles[index].high);
                expect(candle.low).to.equal(originalCandles[index].low);
                expect(candle.close).to.equal(originalCandles[index].close);
                expect(candle.volume).to.equal(originalCandles[index].volume);
            });
        });

        it('should handle mixed valid and invalid data', () => {
            const validData = createValidationTestData('valid');
            const invalidData = createValidationTestData('insufficient_candles');

            const testData = [validData, invalidData];
            const mockInput = createMockInput(testData);
            const result = dataValidationAndPreprocessing(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.ticker).to.equal('VALID_STOCK');
        });
    });

    describe('Validation Helper Functions', () => {
        it('should correctly identify valid candles', () => {
            const validCandle = { open: 100, high: 110, low: 95, close: 105, volume: 1000000 };
            const invalidCandle = { open: null, high: 110, low: 95, close: 105, volume: 1000000 };

            expect(validationHelpers.isValidCandle(validCandle)).to.be.true;
            expect(validationHelpers.isValidCandle(invalidCandle)).to.be.false;
        });

        it('should correctly calculate valid ratio', () => {
            const candles = [
                { open: 100, high: 110, low: 95, close: 105, volume: 1000000 }, // Valid
                { open: null, high: 110, low: 95, close: 105, volume: 1000000 }, // Invalid
                { open: 102, high: 112, low: 97, close: 107, volume: 1100000 }, // Valid
                { open: 103, high: NaN, low: 98, close: 108, volume: 1200000 }  // Invalid
            ];

            const ratio = validationHelpers.calculateValidRatio(candles);
            expect(ratio).to.equal(0.5); // 2 out of 4 valid
        });

        it('should correctly check last candle validity', () => {
            const validCandles = [
                { close: 100 },
                { close: 105 }
            ];

            const invalidCandles = [
                { close: 100 },
                { close: null }
            ];

            expect(validationHelpers.hasValidLastCandle(validCandles)).to.be.true;
            expect(validationHelpers.hasValidLastCandle(invalidCandles)).to.be.false;
        });
    });
});