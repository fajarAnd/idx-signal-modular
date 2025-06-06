// test/nodes/3_pivot_points_support_resistance_detection.test.js
const { expect } = require('chai');
const pivotPointsSupportResistanceDetection = require('../../src/nodes/3_pivot_points_support_resistance_detection');
const { createMockInput, mockIndicators } = require('../mock-data-test-case/all_nodes_common');

describe('Pivot Points & Support/Resistance Detection Node', () => {

    // Helper function to create test data with specific price patterns
    const createPivotTestData = (pattern) => {
        let customCandles;

        switch (pattern) {
            case 'clear_levels':
                // Create clear support and resistance levels
                customCandles = [];
                for (let i = 0; i < 100; i++) {
                    const basePrice = 2500;
                    let high, low, close;

                    // Create clear pivot points at certain indices
                    if (i === 20 || i === 40 || i === 60) { // Support levels
                        high = 2250;
                        low = 2200; // Clear support at 2200
                        close = 2220;
                    } else if (i === 30 || i === 50 || i === 70) { // Resistance levels
                        high = 2800; // Clear resistance at 2800
                        low = 2750;
                        close = 2780;
                    } else {
                        high = basePrice + Math.random() * 100;
                        low = basePrice - Math.random() * 100;
                        close = basePrice + (Math.random() - 0.5) * 50;
                    }

                    customCandles.push({
                        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                        open: Math.round((high + low) / 2),
                        high: Math.round(high),
                        low: Math.round(low),
                        close: Math.round(close),
                        volume: 3000000 + Math.random() * 2000000
                    });
                }
                break;

            case 'insufficient_data':
                customCandles = Array(10).fill().map((_, i) => ({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: 2550,
                    low: 2450,
                    close: 2500,
                    volume: 3000000
                }));
                break;

            case 'no_clear_levels':
                // Random data without clear pivot points
                customCandles = Array(100).fill().map((_, i) => ({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500 + (Math.random() - 0.5) * 20,
                    high: 2500 + Math.random() * 30,
                    low: 2500 - Math.random() * 30,
                    close: 2500 + (Math.random() - 0.5) * 20,
                    volume: 3000000 + Math.random() * 1000000
                }));
                break;

            case 'high_volume_pivots':
                customCandles = [];
                for (let i = 0; i < 80; i++) {
                    let volume = 3000000;

                    // High volume at pivot points
                    if (i === 25 || i === 45 || i === 65) {
                        volume = 8000000; // High volume
                    }

                    customCandles.push({
                        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                        open: 2500,
                        high: i === 25 ? 2800 : (i === 45 ? 2850 : 2550), // Resistance at high volume
                        low: i === 65 ? 2200 : 2450, // Support at high volume
                        close: 2500,
                        volume: volume
                    });
                }
                break;

            default:
                customCandles = Array(60).fill().map((_, i) => ({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: 2550,
                    low: 2450,
                    close: 2500,
                    volume: 3000000
                }));
        }

        return {
            ticker: `TEST_${pattern.toUpperCase()}`,
            lastDate: '2024-06-06',
            candles: customCandles,
            lastClose: 2500,
            indicators: mockIndicators
        };
    };

    describe('Pivot Point Detection', () => {
        it('should detect pivot points correctly', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.pivots).to.have.property('all').that.is.an('array');
            expect(result[0].json.pivots).to.have.property('supports').that.is.an('array');
            expect(result[0].json.pivots).to.have.property('resistances').that.is.an('array');

            // Check that pivots were detected
            expect(result[0].json.pivots.all.length).to.be.greaterThan(0);

            // Check pivot structure
            result[0].json.pivots.all.forEach(pivot => {
                expect(pivot).to.have.property('type').that.is.oneOf(['S', 'R']);
                expect(pivot).to.have.property('price').that.is.a('number');
                expect(pivot).to.have.property('strength').that.is.a('number');
                expect(pivot).to.have.property('index').that.is.a('number');
                expect(pivot.price).to.be.greaterThan(0);
                expect(pivot.strength).to.be.greaterThan(0);
            });
        });

        it('should separate support and resistance pivots correctly', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(1);

            const supports = result[0].json.pivots.supports;
            const resistances = result[0].json.pivots.resistances;

            supports.forEach(support => {
                expect(support.type).to.equal('S');
            });

            resistances.forEach(resistance => {
                expect(resistance.type).to.equal('R');
            });
        });

        it('should calculate volume-weighted strength correctly', () => {
            const testData = [createPivotTestData('high_volume_pivots')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(1);

            result[0].json.pivots.all.forEach(pivot => {
                expect(pivot.strength).to.be.a('number');
                expect(pivot.strength).to.be.greaterThan(0);
            });

            // High volume pivots should have higher strength
            const highVolumePivots = result[0].json.pivots.all.filter(p => p.strength > 2);
            expect(highVolumePivots.length).to.be.greaterThan(0);
        });
    });

    describe('Support and Resistance Identification', () => {
        it('should identify valid support and resistance levels', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json).to.have.property('support');
            expect(result[0].json).to.have.property('resistance');

            const support = result[0].json.support;
            const resistance = result[0].json.resistance;
            const lastClose = result[0].json.lastClose;

            expect(support.price).to.be.lessThan(lastClose);
            expect(resistance.price).to.be.greaterThan(lastClose);
            expect(support).to.have.property('age').that.is.a('number');
            expect(support).to.have.property('tests').that.is.a('number');
        });

        it('should calculate support age correctly', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                const support = result[0].json.support;
                const candlesLength = result[0].json.candles.length;

                expect(support.age).to.be.a('number');
                expect(support.age).to.be.greaterThan(0);
                expect(support.age).to.equal(candlesLength - support.index);
            }
        });

        it('should count support tests correctly', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                const support = result[0].json.support;

                expect(support.tests).to.be.a('number');
                expect(support.tests).to.be.greaterThanOrEqual(1);
            }
        });

        it('should use clustering threshold correctly', () => {
            // Create data with multiple similar support levels
            const candles = [];
            for (let i = 0; i < 100; i++) {
                let low = 2500;

                // Create multiple supports around 2200 (within 1.5% threshold)
                if (i === 20) low = 2200;
                else if (i === 25) low = 2205; // Within threshold
                else if (i === 30) low = 2195; // Within threshold
                else if (i === 35) low = 2210; // Within threshold
                else if (i === 60) low = 2100; // Outside threshold

                candles.push({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: 2550,
                    low: low,
                    close: 2500,
                    volume: 3000000
                });
            }

            const testData = [{
                ticker: 'CLUSTER_TEST',
                lastDate: '2024-06-06',
                candles: candles,
                lastClose: 2500,
                indicators: mockIndicators
            }];

            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                const supports = result[0].json.pivots.supports;

                // Should cluster similar levels together
                expect(supports.length).to.be.lessThan(5); // Should be less than original pivot count
            }
        });
    });

    describe('Edge Cases and Filtering', () => {
        it('should skip data with insufficient candles', () => {
            const testData = [createPivotTestData('insufficient_data')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should skip data without valid support/resistance pair', () => {
            // Create data where all pivots are above current price (no support)
            const candles = [];
            for (let i = 0; i < 50; i++) {
                candles.push({
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 3000,
                    high: 3100,
                    low: 3000,
                    close: 3050,
                    volume: 3000000
                });
            }

            const testData = [{
                ticker: 'NO_SUPPORT_TEST',
                lastDate: '2024-06-06',
                candles: candles,
                lastClose: 2500, // Below all candle prices
                indicators: mockIndicators
            }];

            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should handle candles with invalid data', () => {
            const candles = Array(60).fill().map((_, i) => ({
                date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                open: 2500,
                high: 2550,
                low: 2450,
                close: 2500,
                volume: 3000000
            }));

            // Insert invalid candles
            candles[25] = { date: '2024-01-26', open: null, high: 'invalid', low: NaN, close: 2500, volume: undefined };

            const testData = [{
                ticker: 'INVALID_DATA_TEST',
                lastDate: '2024-06-06',
                candles: candles,
                lastClose: 2500,
                indicators: mockIndicators
            }];

            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            // Should handle gracefully
            expect(result).to.be.an('array');
        });

        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should preserve original data structure', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                expect(result[0].json.ticker).to.equal(testData[0].ticker);
                expect(result[0].json.lastDate).to.equal(testData[0].lastDate);
                expect(result[0].json.lastClose).to.equal(testData[0].lastClose);
                expect(result[0].json.candles).to.deep.equal(testData[0].candles);
                expect(result[0].json.indicators).to.deep.equal(testData[0].indicators);
            }
        });
    });

    describe('Lookback Period Validation', () => {
        it('should use correct lookback period (5)', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                const pivots = result[0].json.pivots.all;
                const candles = result[0].json.candles;

                // No pivots should be detected in first or last 5 candles
                pivots.forEach(pivot => {
                    expect(pivot.index).to.be.greaterThanOrEqual(5);
                    expect(pivot.index).to.be.lessThan(candles.length - 5);
                });
            }
        });

        it('should require minimum candles for lookback', () => {
            // Create data with exactly minimum required candles (lookback * 2 + 1 = 11)
            const minCandles = Array(11).fill().map((_, i) => ({
                date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                open: 2500,
                high: i === 5 ? 2800 : 2550, // Pivot at middle
                low: 2450,
                close: 2500,
                volume: 3000000
            }));

            const testData = [{
                ticker: 'MIN_CANDLES_TEST',
                lastDate: '2024-06-06',
                candles: minCandles,
                lastClose: 2500,
                indicators: mockIndicators
            }];

            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.pivots.all.length).to.be.greaterThan(0);
        });
    });

    describe('Volume Weight Calculation', () => {
        it('should calculate volume weight relative to average', () => {
            const testData = [createPivotTestData('high_volume_pivots')];
            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                const pivots = result[0].json.pivots.all;

                // Check that strength values are reasonable
                pivots.forEach(pivot => {
                    expect(pivot.strength).to.be.a('number');
                    expect(pivot.strength).to.be.greaterThan(0);
                    expect(pivot.strength).to.be.lessThan(10); // Reasonable upper bound
                });
            }
        });

        it('should handle zero volume gracefully', () => {
            const candles = Array(60).fill().map((_, i) => ({
                date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                open: 2500,
                high: i === 30 ? 2800 : 2550,
                low: 2450,
                close: 2500,
                volume: 0 // Zero volume
            }));

            const testData = [{
                ticker: 'ZERO_VOLUME_TEST',
                lastDate: '2024-06-06',
                candles: candles,
                lastClose: 2500,
                indicators: mockIndicators
            }];

            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            // Should handle without crashing
            expect(result).to.be.an('array');
        });
    });

    describe('Data Quality and Performance', () => {
        it('should handle large datasets efficiently', () => {
            const largeCandles = Array(500).fill().map((_, i) => ({
                date: `2024-01-${String((i % 365) + 1).padStart(3, '0')}`,
                open: 2500 + (Math.random() - 0.5) * 100,
                high: 2500 + Math.random() * 150,
                low: 2500 - Math.random() * 150,
                close: 2500 + (Math.random() - 0.5) * 100,
                volume: 3000000 + Math.random() * 2000000
            }));

            const testData = [{
                ticker: 'LARGE_DATASET',
                lastDate: '2024-06-06',
                candles: largeCandles,
                lastClose: 2500,
                indicators: mockIndicators
            }];

            const mockInput = createMockInput(testData);
            const startTime = Date.now();
            const result = pivotPointsSupportResistanceDetection(mockInput);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(5000); // Should complete within 5 seconds
        });

        it('should maintain data integrity throughout processing', () => {
            const testData = [createPivotTestData('clear_levels')];
            const originalCandles = JSON.parse(JSON.stringify(testData[0].candles));

            const mockInput = createMockInput(testData);
            const result = pivotPointsSupportResistanceDetection(mockInput);

            if (result.length > 0) {
                // Original candles should not be modified
                expect(result[0].json.candles).to.deep.equal(originalCandles);

                // Pivot indices should be valid
                result[0].json.pivots.all.forEach(pivot => {
                    expect(pivot.index).to.be.greaterThanOrEqual(0);
                    expect(pivot.index).to.be.lessThan(originalCandles.length);
                });
            }
        });

        it('should produce consistent results with same input', () => {
            const testData = [createPivotTestData('clear_levels')];
            const mockInput1 = createMockInput(testData);
            const mockInput2 = createMockInput(testData);

            const result1 = pivotPointsSupportResistanceDetection(mockInput1);
            const result2 = pivotPointsSupportResistanceDetection(mockInput2);

            expect(result1).to.deep.equal(result2);
        });
    });
});