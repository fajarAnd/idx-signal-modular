// test/nodes/2_technical_indicators_calculator.test.js
const { expect } = require('chai');
const technicalIndicatorsCalculator = require('../../src/nodes/2_technical_indicators_calculator');
const { indicatorTestScenarios, indicatorValidation, indicatorHelpers, createIndicatorTestData } = require('../mock-data-test-case/2_technical_indicators_calculator');
const { createMockInput } = require('../mock-data-test-case/parse_and_slice');

describe('Technical Indicators Calculator Node', () => {

    describe('SMA (Simple Moving Average)', () => {
        it('should calculate SMA correctly for sufficient data', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.indicators.sma20).to.be.a('number');
            expect(result[0].json.indicators.sma50).to.be.a('number');
            expect(result[0].json.indicators.sma20).to.be.greaterThan(0);
            expect(result[0].json.indicators.sma50).to.be.greaterThan(0);
        });

        it('should return 0 for insufficient data', () => {
            const testData = [indicatorTestScenarios.insufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.sma50).to.equal(0);
        });

        it('should calculate volume SMA correctly', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.volSMA20).to.be.a('number');
            expect(result[0].json.indicators.volSMA5).to.be.a('number');
            expect(result[0].json.indicators.volSMA20).to.be.greaterThan(0);
            expect(result[0].json.indicators.volSMA5).to.be.greaterThan(0);
        });
    });

    describe('EMA (Exponential Moving Average)', () => {
        it('should calculate EMA correctly', () => {
            const testData = [indicatorTestScenarios.trending_up.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const indicators = result[0].json.indicators;
            expect(indicators.ema21).to.be.a('number');
            expect(indicators.ema21).to.be.greaterThan(0);

            // In uptrend, EMA should be between first and last price
            const candles = testData[0].candles;
            const firstPrice = candles[0].close;
            const lastPrice = candles[candles.length - 1].close;
            expect(indicators.ema21).to.be.greaterThan(firstPrice);
            expect(indicators.ema21).to.be.lessThan(lastPrice);
        });

        it('should return first value for single data point', () => {
            const singleCandleData = createIndicatorTestData('sufficient_data');
            singleCandleData.candles = [{ close: 100, open: 100, high: 105, low: 95, volume: 1000000 }];

            const testData = [singleCandleData];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.ema21).to.equal(100);
        });
    });

    describe('RSI (Relative Strength Index)', () => {
        it('should calculate RSI correctly for trending data', () => {
            const testData = [indicatorTestScenarios.trending_up.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const rsi = result[0].json.indicators.rsi;
            expect(rsi).to.be.a('number');
            expect(rsi).to.be.greaterThan(50); // Should be high for uptrend
            expect(rsi).to.be.lessThan(100);
            expect(indicatorHelpers.validateIndicatorRange(rsi, indicatorValidation.rsi)).to.be.true;
        });

        it('should return 50 for insufficient data', () => {
            const testData = [indicatorTestScenarios.insufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.rsi).to.equal(50);
            expect(indicatorHelpers.isDefaultRSI(result[0].json.indicators.rsi)).to.be.true;
        });

        it('should debug RSI calculation manually', () => {
            // Create minimal downtrend test
            const simpleCandles = [];
            for (let i = 0; i < 20; i++) {
                simpleCandles.push({
                    close: 100 - i // Simple 1-point decline: 100, 99, 98, 97...
                });
            }

            const testData = [{
                ticker: 'SIMPLE_TEST',
                candles: simpleCandles,
                lastClose: simpleCandles[simpleCandles.length - 1].close
            }];

            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const rsi = result[0].json.indicators.rsi;
            console.log('Simple downtrend RSI:', rsi);

            // This MUST be < 50 and > 0
            expect(rsi).to.be.lessThan(50);
            expect(rsi).to.be.greaterThan(0);
        });

        it('should handle downtrend correctly', () => {
            const testData = [indicatorTestScenarios.trending_down.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const rsi = result[0].json.indicators.rsi;
            expect(rsi).to.be.lessThan(50); // Should be low for downtrend
            expect(rsi).to.be.greaterThan(0);
        });
    });

    describe('MACD', () => {
        it('should calculate MACD correctly for sufficient data', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const macd = result[0].json.indicators.macd;
            expect(indicatorHelpers.validateMACD(macd)).to.be.true;
            expect(macd.histogram).to.equal(macd.macdLine - macd.signalLine);
        });

        it('should return zeros for insufficient data', () => {
            const testData = [indicatorTestScenarios.insufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const macd = result[0].json.indicators.macd;
            expect(indicatorHelpers.isDefaultMACD(macd)).to.be.true;
        });
    });

    describe('Stochastic RSI', () => {
        it('should calculate StochRSI correctly', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const stochRsi = result[0].json.indicators.stochRsi;
            expect(stochRsi).to.be.a('number');
            expect(indicatorHelpers.validateIndicatorRange(stochRsi, indicatorValidation.stochRsi)).to.be.true;
        });

        it('should return 0 for insufficient data', () => {
            const testData = [indicatorTestScenarios.insufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(indicatorHelpers.isDefaultStochRSI(result[0].json.indicators.stochRsi)).to.be.true;
        });
    });

    describe('Bollinger Bands', () => {
        it('should calculate Bollinger Bands correctly', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const bb = result[0].json.indicators.bollingerBands;
            expect(indicatorHelpers.validateBollingerBands(bb)).to.be.true;
        });

        it('should have middle band equal to SMA20', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const bb = result[0].json.indicators.bollingerBands;
            const sma20 = result[0].json.indicators.sma20;
            expect(bb.middle).to.be.closeTo(sma20, 0.01);
        });
    });

    describe('ATR (Average True Range)', () => {
        it('should calculate ATR correctly', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.atr14).to.be.a('number');
            expect(result[0].json.indicators.atr21).to.be.a('number');
            expect(result[0].json.indicators.atr14).to.be.greaterThan(0);
            expect(result[0].json.indicators.atr21).to.be.greaterThan(0);
        });

        it('should return 0 for insufficient data', () => {
            const testData = [indicatorTestScenarios.insufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.atr14).to.equal(0);
        });
    });

    describe('Volume Analysis', () => {
        it('should extract current volume correctly', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const lastVolume = testData[0].candles[testData[0].candles.length - 1].volume;

            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.currentVolume).to.equal(lastVolume);
        });

        it('should detect volume spikes', () => {
            const testData = [indicatorTestScenarios.high_volume.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const indicators = result[0].json.indicators;
            expect(indicators.currentVolume).to.be.greaterThan(indicators.volSMA20);
            expect(indicators.volSMA5).to.be.greaterThan(indicators.volSMA20);
        });

        it('should return 0 for empty candles', () => {
            const testData = [indicatorTestScenarios.null_candles.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result[0].json.indicators.currentVolume).to.equal(0);
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(indicatorTestScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const result = technicalIndicatorsCalculator(mockInput);

                if (scenario.expectedPass) {
                    expect(result).to.have.lengthOf(1);
                    expect(result[0].json).to.have.property('indicators');

                    // Check if expected indicators exist
                    if (scenario.expectedIndicators) {
                        scenario.expectedIndicators.forEach(indicator => {
                            expect(result[0].json.indicators).to.have.property(indicator);
                        });
                    }

                    // Check if default values are returned for insufficient data
                    if (scenario.expectedDefaults) {
                        const indicators = result[0].json.indicators;
                        scenario.expectedDefaults.forEach(indicator => {
                            if (indicator === 'rsi') {
                                expect(indicatorHelpers.isDefaultRSI(indicators.rsi)).to.be.true;
                            } else if (indicator === 'macd') {
                                expect(indicatorHelpers.isDefaultMACD(indicators.macd)).to.be.true;
                            } else if (indicator === 'stochRsi') {
                                expect(indicatorHelpers.isDefaultStochRSI(indicators.stochRsi)).to.be.true;
                            }
                        });
                    }
                }
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should preserve original data structure', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const originalData = JSON.parse(JSON.stringify(testData[0]));

            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.ticker).to.equal(originalData.ticker);
            expect(result[0].json.lastDate).to.equal(originalData.lastDate);
            expect(result[0].json.lastClose).to.equal(originalData.lastClose);
            expect(result[0].json.candles).to.deep.equal(originalData.candles);
            expect(result[0].json).to.have.property('indicators');
        });

        it('should handle null/undefined candles', () => {
            const testData = [indicatorTestScenarios.null_candles.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            // All indicators should return default values
            const indicators = result[0].json.indicators;
            expect(indicators.sma20).to.equal(0);
            expect(indicatorHelpers.isDefaultRSI(indicators.rsi)).to.be.true;
            expect(indicators.currentVolume).to.equal(0);
        });

        it('should validate all indicator ranges', () => {
            const testData = [indicatorTestScenarios.sufficient_data.data];
            const mockInput = createMockInput(testData);
            const result = technicalIndicatorsCalculator(mockInput);

            const indicators = result[0].json.indicators;

            // Validate RSI range
            expect(indicatorHelpers.validateIndicatorRange(indicators.rsi, indicatorValidation.rsi)).to.be.true;

            // Validate StochRSI range
            expect(indicatorHelpers.validateIndicatorRange(indicators.stochRsi, indicatorValidation.stochRsi)).to.be.true;

            // Validate MACD structure
            expect(indicatorHelpers.validateMACD(indicators.macd)).to.be.true;

            // Validate Bollinger Bands structure
            expect(indicatorHelpers.validateBollingerBands(indicators.bollingerBands)).to.be.true;

            // Validate positive values
            expect(indicators.atr14).to.be.greaterThan(0);
            expect(indicators.atr21).to.be.greaterThan(0);
            expect(indicators.sma20).to.be.greaterThan(0);
            expect(indicators.sma50).to.be.greaterThan(0);
            expect(indicators.ema21).to.be.greaterThan(0);
        });
    });
});