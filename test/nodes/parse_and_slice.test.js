// test/nodes/parse_and_slice.test.js
const { expect } = require('chai');
// const parseAndSlice = require('../../src/nodes/parse_and_slice');
const parseAndSlice = require('../../src/nodes/parse_and_slice')
const { mockRawStockHistory, testScenarios, createMockInput, generateMockCandles } = require('../mock-data-test-case/parse_and_slice')

describe('Parse and Slice Node', () => {

    describe('Normal Cases', () => {
        it('should group and sort stock data correctly', () => {
            const mockInput = createMockInput(mockRawStockHistory.slice(0, 200)); // First 200 records
            const result = parseAndSlice(mockInput);

            expect(result).to.be.an('array');
            expect(result.length).to.be.greaterThan(0);

            // Check if grouping worked
            const tickers = result.map(r => r.ticker);
            const uniqueTickers = [...new Set(tickers)];
            expect(tickers.length).to.equal(uniqueTickers.length);

            // Check if data is sorted by date
            result.forEach(stock => {
                expect(stock).to.have.property('ticker');
                expect(stock).to.have.property('lastDate');
                expect(stock).to.have.property('candles');
                expect(stock.candles).to.be.an('array');

                for (let i = 1; i < stock.candles.length; i++) {
                    const prevDate = new Date(stock.candles[i-1].date);
                    const currDate = new Date(stock.candles[i].date);
                    expect(currDate.getTime()).to.be.greaterThan(prevDate.getTime());
                }
            });
        });

        it('should convert volume to number', () => {
            const testData = [
                { code: 'TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: '1000000' },
                { code: 'TEST', date: '2024-01-02', open: 105, high: 115, low: 100, close: 108, volume: '1500000' }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].candles[0].volume).to.be.a('number');
            expect(result[0].candles[0].volume).to.equal(1000000);
            expect(result[0].candles[1].volume).to.equal(1500000);
        });

        it('should calculate lastDate correctly', () => {
            const testData = [
                { code: 'TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
                { code: 'TEST', date: '2024-01-03', open: 105, high: 115, low: 100, close: 108, volume: 1500000 },
                { code: 'TEST', date: '2024-01-02', open: 102, high: 112, low: 98, close: 107, volume: 1200000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].lastDate).to.equal('2024-01-03'); // Should be the latest date
        });

        it('should group multiple stocks correctly', () => {
            const testData = [
                { code: 'BBCA', date: '2024-01-01', open: 8000, high: 8100, low: 7900, close: 8050, volume: 5000000 },
                { code: 'BMRI', date: '2024-01-01', open: 5000, high: 5100, low: 4900, close: 5050, volume: 3000000 },
                { code: 'BBCA', date: '2024-01-02', open: 8050, high: 8150, low: 7950, close: 8100, volume: 4500000 },
                { code: 'BMRI', date: '2024-01-02', open: 5050, high: 5150, low: 4950, close: 5100, volume: 2800000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(2);

            const bbcaData = result.find(r => r.ticker === 'BBCA');
            const bmriData = result.find(r => r.ticker === 'BMRI');

            expect(bbcaData).to.exist;
            expect(bmriData).to.exist;
            expect(bbcaData.candles).to.have.lengthOf(2);
            expect(bmriData.candles).to.have.lengthOf(2);
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(testScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const mockInput = createMockInput(scenario.data);
                const result = parseAndSlice(mockInput);

                if (scenario.expectedPass) {
                    expect(result).to.be.an('array');
                    if (scenario.expectedStockCount !== undefined) {
                        expect(result).to.have.lengthOf(scenario.expectedStockCount);
                    }

                    // Validate structure for each result
                    result.forEach(stock => {
                        expect(stock).to.have.property('ticker');
                        expect(stock).to.have.property('lastDate');
                        expect(stock).to.have.property('candles');
                        expect(stock.ticker).to.be.a('string');
                        expect(stock.lastDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
                        expect(stock.candles).to.be.an('array');
                    });
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Edge Cases', () => {
        it('should return empty array when no input data', () => {
            const mockInput = createMockInput([]);
            const result = parseAndSlice(mockInput);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should handle single stock with single candle', () => {
            const testData = [
                { code: 'SINGLE', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].ticker).to.equal('SINGLE');
            expect(result[0].candles).to.have.lengthOf(1);
            expect(result[0].lastDate).to.equal('2024-01-01');
        });

        it('should handle multiple stocks with mixed data', () => {
            const testData = [
                { code: 'STOCK1', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
                { code: 'STOCK2', date: '2024-01-01', open: 200, high: 210, low: 195, close: 205, volume: 2000000 },
                { code: 'STOCK1', date: '2024-01-02', open: 105, high: 115, low: 100, close: 108, volume: 1500000 },
                { code: 'STOCK2', date: '2024-01-02', open: 205, high: 215, low: 200, close: 208, volume: 2500000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(2);

            const stock1 = result.find(s => s.ticker === 'STOCK1');
            const stock2 = result.find(s => s.ticker === 'STOCK2');

            expect(stock1).to.exist;
            expect(stock2).to.exist;
            expect(stock1.candles).to.have.lengthOf(2);
            expect(stock2.candles).to.have.lengthOf(2);
        });

        it('should handle non-numeric volume values', () => {
            const testData = [
                { code: 'TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 'abc' },
                { code: 'TEST', date: '2024-01-02', open: 105, high: 115, low: 100, close: 108, volume: null },
                { code: 'TEST', date: '2024-01-03', open: 108, high: 118, low: 103, close: 110, volume: undefined }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].candles[0].volume).to.be.NaN;
            expect(result[0].candles[1].volume).to.equal(0);
            expect(result[0].candles[2].volume).to.be.NaN;
        });

        it('should handle duplicate dates correctly', () => {
            const testData = [
                { code: 'DUP', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
                { code: 'DUP', date: '2024-01-01', open: 105, high: 115, low: 100, close: 108, volume: 1500000 }, // Duplicate date
                { code: 'DUP', date: '2024-01-02', open: 108, high: 118, low: 103, close: 112, volume: 1200000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].candles).to.have.lengthOf(3); // All entries should be preserved
            expect(result[0].lastDate).to.equal('2024-01-02');
        });

        it('should handle stocks with no code field', () => {
            const testData = [
                { date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 }, // Missing code
                { code: 'VALID', date: '2024-01-01', open: 200, high: 210, low: 195, close: 205, volume: 2000000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(2); // undefined code creates a group
            expect(result.some(r => r.ticker === 'VALID')).to.be.true;
            expect(result.some(r => r.ticker === undefined)).to.be.false;
        });
    });

    describe('Data Integrity', () => {
        it('should preserve all candle properties', () => {
            const testData = [
                { code: 'TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            const candle = result[0].candles[0];
            expect(candle).to.have.property('date', '2024-01-01');
            expect(candle).to.have.property('open', 100);
            expect(candle).to.have.property('high', 110);
            expect(candle).to.have.property('low', 95);
            expect(candle).to.have.property('close', 105);
            expect(candle).to.have.property('volume', 1000000);
        });

        it('should not modify original data structure', () => {
            const testData = [
                { code: 'TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: '1000000', extraField: 'keep' }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            // Extra fields should not be present in candles
            const candle = result[0].candles[0];
            expect(candle).to.not.have.property('extraField');
            expect(candle).to.not.have.property('code');
        });

        it('should maintain data type consistency', () => {
            const testData = [
                { code: 'TYPE_TEST', date: '2024-01-01', open: 100.5, high: 110.25, low: 95.75, close: 105.125, volume: '1000000' }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            const candle = result[0].candles[0];
            expect(candle.open).to.equal(100.5);
            expect(candle.high).to.equal(110.25);
            expect(candle.low).to.equal(95.75);
            expect(candle.close).to.equal(105.125);
            expect(candle.volume).to.be.a('number');
            expect(candle.volume).to.equal(1000000);
        });

        it('should handle missing fields gracefully', () => {
            const testData = [
                { code: 'MISSING', date: '2024-01-01', open: 100, high: 110, close: 105, volume: 1000000 }, // Missing low
                { code: 'MISSING', date: '2024-01-02', open: 105, high: 115, low: 100, volume: 1500000 }  // Missing close
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].candles).to.have.lengthOf(2);

            // First candle should have undefined low
            expect(result[0].candles[0]).to.have.property('low', undefined);
            // Second candle should have undefined close
            expect(result[0].candles[1]).to.have.property('close', undefined);
        });
    });

    describe('Date Handling', () => {
        it('should sort dates chronologically', () => {
            const testData = [
                { code: 'DATE_TEST', date: '2024-01-03', open: 108, high: 118, low: 103, close: 112, volume: 1200000 },
                { code: 'DATE_TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
                { code: 'DATE_TEST', date: '2024-01-02', open: 105, high: 115, low: 100, close: 108, volume: 1500000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            const dates = result[0].candles.map(c => c.date);
            expect(dates).to.deep.equal(['2024-01-01', '2024-01-02', '2024-01-03']);
        });

        it('should calculate lastDate as ISO string', () => {
            const testData = [
                { code: 'ISO_TEST', date: '2024-06-15', open: 100, high: 110, low: 95, close: 105, volume: 1000000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result[0].lastDate).to.equal('2024-06-15');
            expect(result[0].lastDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('should handle invalid date formats', () => {
            const testData = [
                { code: 'INVALID_DATE', date: 'invalid-date', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
                { code: 'INVALID_DATE', date: '2024-01-01', open: 105, high: 115, low: 100, close: 108, volume: 1500000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].candles).to.have.lengthOf(2);
            // Should still process, but sorting might be affected
        });
    });

    describe('Performance Tests', () => {
        it('should handle large datasets efficiently', () => {
            const largeDataset = [];
            for (let i = 0; i < 1000; i++) {
                largeDataset.push({
                    code: `STOCK${i % 10}`,
                    date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
                    open: 100 + i,
                    high: 110 + i,
                    low: 95 + i,
                    close: 105 + i,
                    volume: 1000000 + i * 1000
                });
            }

            const mockInput = createMockInput(largeDataset);
            const startTime = Date.now();
            const result = parseAndSlice(mockInput);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(1000); // Should complete within 1 second
            expect(result).to.have.lengthOf(10); // 10 unique stocks

            // Verify each stock has correct number of candles
            result.forEach(stock => {
                expect(stock.candles.length).to.equal(100); // 1000 records / 10 stocks
            });
        });

        it('should handle memory efficiently with large volumes', () => {
            const memoryTestData = generateMockCandles(500).map(candle => ({
                code: 'MEMORY_TEST',
                ...candle
            }));

            const mockInput = createMockInput(memoryTestData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].candles).to.have.lengthOf(500);
            expect(result[0].ticker).to.equal('MEMORY_TEST');
        });
    });

    describe('Error Handling', () => {
        it('should handle undefined code values', () => {
            const testData = [
                { code: undefined, date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
                { code: null, date: '2024-01-01', open: 200, high: 210, low: 195, close: 205, volume: 2000000 }
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(2); // Should create separate groups for undefined and null
        });
    });

    describe('Volume Conversion Edge Cases', () => {
        it('should handle various volume data types', () => {
            const testData = [
                { code: 'VOL_TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },      // number
                { code: 'VOL_TEST', date: '2024-01-02', open: 105, high: 115, low: 100, close: 108, volume: '1500000' },   // string number
                { code: 'VOL_TEST', date: '2024-01-03', open: 108, high: 118, low: 103, close: 112, volume: 1.2e6 },       // scientific notation
                { code: 'VOL_TEST', date: '2024-01-04', open: 112, high: 122, low: 107, close: 115, volume: null },        // null
                { code: 'VOL_TEST', date: '2024-01-05', open: 115, high: 125, low: 110, close: 118, volume: undefined },   // undefined
                { code: 'VOL_TEST', date: '2024-01-06', open: 118, high: 128, low: 113, close: 121, volume: 'invalid' }    // invalid string
            ];

            const mockInput = createMockInput(testData);
            const result = parseAndSlice(mockInput);

            expect(result).to.have.lengthOf(1);
            const volumes = result[0].candles.map(c => c.volume);

            expect(volumes[0]).to.equal(1000000);     // number unchanged
            expect(volumes[1]).to.equal(1500000);     // string converted to number
            expect(volumes[2]).to.equal(1200000);     // scientific notation converted
            expect(volumes[3]).to.equal(0);           // null becomes 0
            expect(volumes[4]).to.be.NaN;             // undefined becomes NaN
            expect(volumes[5]).to.be.NaN;             // invalid string becomes NaN
        });
    });
});