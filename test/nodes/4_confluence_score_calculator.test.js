// test/nodes/4_confluence_score_calculator.test.js
const { expect } = require('chai');
const confluenceScoreCalculator = require('../../src/nodes/4_confluence_score_calculator');
const {
    createConfluenceTestData,
    confluenceTestScenarios,
    confluenceHelpers
} = require('../mock-data-test-case/4_confluence_score_calculator');
const { createMockInput, mockSupportResistance } = require('../mock-data-test-case/all_nodes_common');

describe('Confluence Score Calculator Node', () => {

    describe('Trend Analysis Scoring', () => {
        it('should give maximum score for multi-timeframe bullish alignment', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.include('Multi-timeframe bullish alignment');
            expect(confluence.score).to.be.greaterThanOrEqual(2);
        });

        it('should give partial score for basic uptrend', () => {
            const testData = [createConfluenceTestData('mixed_signals')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('uptrend'))).to.be.true;
        });

        it('should not score trend points for bearish setup', () => {
            const testData = [createConfluenceTestData('bearish_setup')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('bullish alignment') || hit.includes('uptrend'))).to.be.false;
        });

        it('should validate trend conditions correctly', () => {
            // Test exact boundary conditions
            const exactBoundaryData = createConfluenceTestData('mixed_signals');
            exactBoundaryData.lastClose = exactBoundaryData.indicators.sma20; // Exactly at SMA20

            const testData = [exactBoundaryData];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            // At exact boundary, should not get full bullish alignment
            expect(confluence.hits).to.not.include('Multi-timeframe bullish alignment');
        });
    });

    describe('RSI and StochRSI Scoring', () => {
        it('should give maximum score for double oversold condition', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('Double oversold'))).to.be.true;

            // Check that RSI and StochRSI values are included in the message
            const doubleOversoldHit = confluence.hits.find(hit => hit.includes('Double oversold'));
            expect(doubleOversoldHit).to.include('RSI: 35.0');
            expect(doubleOversoldHit).to.include('StochRSI: 25.0%');
        });

        it('should give partial score for RSI oversold only', () => {
            const testData = [createConfluenceTestData('rsi_boundary_45')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('RSI oversold'))).to.be.true;
            expect(confluence.hits.some(hit => hit.includes('Double oversold'))).to.be.false;
        });

        it('should not score RSI for overbought conditions', () => {
            const testData = [createConfluenceTestData('bearish_setup')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('oversold'))).to.be.false;
        });

        it('should test RSI boundary conditions', () => {
            // Test RSI at exactly 40 and 45
            const testScenarios = [
                { rsi: 40, stochRsi: 0.25, shouldHaveDouble: true },
                { rsi: 45, stochRsi: 0.35, shouldHaveSingle: true },
                { rsi: 45.1, stochRsi: 0.35, shouldHaveSingle: false },
                { rsi: 39.9, stochRsi: 0.31, shouldHaveDouble: false }
            ];

            testScenarios.forEach(scenario => {
                const customData = createConfluenceTestData('rsi_boundary_40_30');
                customData.indicators.rsi = scenario.rsi;
                customData.indicators.stochRsi = scenario.stochRsi;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = confluenceScoreCalculator(mockInput);

                expect(result).to.have.lengthOf(1);
                const confluence = result[0].json.confluence;

                if (scenario.shouldHaveDouble) {
                    expect(confluence.hits.some(hit => hit.includes('Double oversold'))).to.be.true;
                } else if (scenario.shouldHaveSingle) {
                    expect(confluence.hits.some(hit => hit.includes('RSI oversold') && !hit.includes('Double'))).to.be.true;
                } else {
                    expect(confluence.hits.some(hit => hit.includes('oversold'))).to.be.false;
                }
            });
        });
    });

    describe('MACD Scoring', () => {
        it('should detect MACD bullish crossover', () => {
            const testData = [createConfluenceTestData('mixed_signals')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.include('MACD bullish crossover');
        });

        it('should not score MACD for bearish crossover', () => {
            const testData = [createConfluenceTestData('bearish_setup')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.not.include('MACD bullish crossover');
        });

        it('should test MACD boundary conditions', () => {
            const testScenarios = [
                { macdLine: 1, signalLine: 0, histogram: 0.1, shouldScore: true },
                { macdLine: 0, signalLine: 1, histogram: -1, shouldScore: false },
                { macdLine: 1, signalLine: 0, histogram: -0.1, shouldScore: false }
            ];

            testScenarios.forEach(scenario => {
                const customData = createConfluenceTestData('mixed_signals');
                customData.indicators.macd = {
                    macdLine: scenario.macdLine,
                    signalLine: scenario.signalLine,
                    histogram: scenario.histogram
                };

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = confluenceScoreCalculator(mockInput);

                const confluence = result[0].json.confluence;

                if (scenario.shouldScore) {
                    expect(confluence.hits).to.include('MACD bullish crossover');
                } else {
                    expect(confluence.hits).to.not.include('MACD bullish crossover');
                }
            });
        });
    });

    describe('Bollinger Bands Scoring', () => {
        it('should detect near lower Bollinger band', () => {
            const testData = [createConfluenceTestData('near_bollinger_lower')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.include('Near Bollinger lower band');
        });

        it('should not score for price far from lower band', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            // lastClose (2600) is far from lower band (2200)
            expect(confluence.hits).to.not.include('Near Bollinger lower band');
        });

        it('should test Bollinger band threshold (1.02x)', () => {
            const testScenarios = [
                { lastClose: 2200, lowerBand: 2200, shouldScore: true }, // Exactly at band
                { lastClose: 2244, lowerBand: 2200, shouldScore: true }, // Within 1.02x
                { lastClose: 2245, lowerBand: 2200, shouldScore: false } // Above 1.02x
            ];

            testScenarios.forEach(scenario => {
                const customData = createConfluenceTestData('mixed_signals');
                customData.lastClose = scenario.lastClose;
                customData.indicators.bollingerBands.lower = scenario.lowerBand;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = confluenceScoreCalculator(mockInput);

                const confluence = result[0].json.confluence;

                if (scenario.shouldScore) {
                    expect(confluence.hits).to.include('Near Bollinger lower band');
                } else {
                    expect(confluence.hits).to.not.include('Near Bollinger lower band');
                }
            });
        });
    });

    describe('Volume Analysis Scoring', () => {
        it('should detect sustained volume breakout', () => {
            const testData = [createConfluenceTestData('sustained_volume_breakout')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.include('Sustained volume breakout');
        });

        it('should detect volume spike', () => {
            const testData = [createConfluenceTestData('volume_spike')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.include('Volume spike detected');
            expect(confluence.hits).to.not.include('Sustained volume breakout');
        });

        it('should not score volume for low volume', () => {
            const testData = [createConfluenceTestData('bearish_setup')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('volume'))).to.be.false;
        });

        it('should test volume thresholds correctly', () => {
            const testScenarios = [
                { current: 8000000, sma20: 4000000, sma5: 6000000, expected: 'Sustained volume breakout' }, // 2x and 1.5x
                { current: 6000000, sma20: 4000000, sma5: 5000000, expected: 'Volume spike detected' }, // 1.5x but sma5 not 1.5x
                { current: 5900000, sma20: 4000000, sma5: 5000000, expected: null } // Below 1.5x threshold
            ];

            testScenarios.forEach(scenario => {
                const customData = createConfluenceTestData('mixed_signals');
                customData.indicators.currentVolume = scenario.current;
                customData.indicators.volSMA20 = scenario.sma20;
                customData.indicators.volSMA5 = scenario.sma5;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = confluenceScoreCalculator(mockInput);

                const confluence = result[0].json.confluence;

                if (scenario.expected) {
                    expect(confluence.hits).to.include(scenario.expected);
                } else {
                    expect(confluence.hits.some(hit => hit.includes('volume'))).to.be.false;
                }
            });
        });
    });

    describe('Support Quality Scoring', () => {
        it('should detect strong support', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('Strong support'))).to.be.true;

            // Check that support details are included in the message
            const strongSupportHit = confluence.hits.find(hit => hit.includes('Strong support'));
            expect(strongSupportHit).to.include('3 tests');
            expect(strongSupportHit).to.include('15 periods old');
        });

        it('should detect reliable support', () => {
            const customData = createConfluenceTestData('mixed_signals');
            customData.support.tests = 2; // Meets reliable threshold
            customData.support.age = 8; // But not strong threshold

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('Reliable support'))).to.be.true;
            expect(confluence.hits.some(hit => hit.includes('Strong support'))).to.be.false;
        });

        it('should not score weak support', () => {
            const testData = [createConfluenceTestData('bearish_setup')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits.some(hit => hit.includes('support'))).to.be.false;
        });

        it('should test support boundary conditions', () => {
            const testScenarios = [
                { tests: 3, age: 10, expected: 'Strong support' },
                { tests: 2, age: 15, expected: 'Reliable support' },
                { tests: 3, age: 9, expected: 'Reliable support' }, // High tests but low age
                { tests: 1, age: 15, expected: null } // Low tests
            ];

            testScenarios.forEach(scenario => {
                const customData = createConfluenceTestData('mixed_signals');
                customData.support.tests = scenario.tests;
                customData.support.age = scenario.age;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = confluenceScoreCalculator(mockInput);

                const confluence = result[0].json.confluence;

                if (scenario.expected) {
                    expect(confluence.hits.some(hit => hit.includes(scenario.expected))).to.be.true;
                } else {
                    expect(confluence.hits.some(hit => hit.includes('support'))).to.be.false;
                }
            });
        });
    });

    describe('Candlestick Pattern Detection', () => {
        it('should detect hammer/doji pattern', () => {
            const testData = [createConfluenceTestData('hammer_pattern')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.hits).to.include('Hammer/Doji pattern detected');
        });

        it('should not detect pattern in normal candles', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            // Normal generated candles shouldn't have hammer pattern
            expect(confluence.hits).to.not.include('Hammer/Doji pattern detected');
        });

        it('should handle insufficient recent candles', () => {
            const customData = createConfluenceTestData('bullish_alignment');
            customData.candles = customData.candles.slice(0, 3); // Only 3 candles

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            // Should not crash and should process normally
            expect(result[0].json.confluence).to.have.property('score');
            expect(result[0].json.confluence).to.have.property('hits');
        });

        it('should test hammer pattern criteria correctly', () => {
            // Create specific hammer patterns to test detection logic
            const hammerTestCases = [
                {
                    name: 'Perfect Hammer',
                    candle: { open: 2480, high: 2485, low: 2440, close: 2475 },
                    shouldDetect: true
                },
                {
                    name: 'Inverted Hammer',
                    candle: { open: 2480, high: 2520, low: 2475, close: 2485 },
                    shouldDetect: false // Upper shadow too long
                },
                {
                    name: 'Normal Candle',
                    candle: { open: 2480, high: 2485, low: 2475, close: 2482 },
                    shouldDetect: false // Not enough lower shadow
                }
            ];

            hammerTestCases.forEach(testCase => {
                const customData = createConfluenceTestData('mixed_signals');
                customData.candles[customData.candles.length - 1] = {
                    date: '2024-06-06',
                    ...testCase.candle,
                    volume: 5000000
                };

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = confluenceScoreCalculator(mockInput);

                const confluence = result[0].json.confluence;

                if (testCase.shouldDetect) {
                    expect(confluence.hits).to.include('Hammer/Doji pattern detected');
                } else {
                    expect(confluence.hits).to.not.include('Hammer/Doji pattern detected');
                }
            });
        });
    });

    describe('Score Calculation and Integration', () => {
        it('should calculate total score correctly', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.score).to.be.a('number');
            expect(confluence.score).to.be.greaterThan(0);

            // Verify score matches hits
            // Multi-timeframe (2) + Double oversold (2) + Sustained volume (2) + Strong support (2) = 8
            expect(confluence.score).to.be.greaterThanOrEqual(7);
        });

        it('should have zero score for bearish setup', () => {
            const testData = [createConfluenceTestData('bearish_setup')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            expect(confluence.score).to.equal(0);
            expect(confluence.hits).to.have.lengthOf(0);
        });

        it('should preserve all original data', () => {
            const testData = [createConfluenceTestData('mixed_signals')];
            const originalData = JSON.parse(JSON.stringify(testData[0]));

            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.ticker).to.equal(originalData.ticker);
            expect(result[0].json.lastDate).to.equal(originalData.lastDate);
            expect(result[0].json.lastClose).to.equal(originalData.lastClose);
            expect(result[0].json.candles).to.deep.equal(originalData.candles);
            expect(result[0].json.indicators).to.deep.equal(originalData.indicators);
            expect(result[0].json.support).to.deep.equal(originalData.support);
            expect(result[0].json.resistance).to.deep.equal(originalData.resistance);
        });

        it('should have consistent hit formatting', () => {
            const testData = [createConfluenceTestData('bullish_alignment')];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            const confluence = result[0].json.confluence;

            // All hits should be strings
            confluence.hits.forEach(hit => {
                expect(hit).to.be.a('string');
                expect(hit.length).to.be.greaterThan(0);
            });

            // Specific formatting checks
            const rsiHit = confluence.hits.find(hit => hit.includes('RSI:'));
            if (rsiHit) {
                expect(rsiHit).to.match(/RSI: \d+\.\d/); // Should have one decimal place
            }

            const stochHit = confluence.hits.find(hit => hit.includes('StochRSI:'));
            if (stochHit) {
                expect(stochHit).to.match(/StochRSI: \d+\.\d%/); // Should have percentage
            }
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should handle missing indicators gracefully', () => {
            const customData = createConfluenceTestData('missing_indicators');
            delete customData.indicators.rsi;
            delete customData.indicators.macd;

            const testData = [customData];
            const mockInput = createMockInput(testData);

            // Should not throw error
            expect(() => confluenceScoreCalculator(mockInput)).to.not.throw();

            const result = confluenceScoreCalculator(mockInput);
            expect(result).to.have.lengthOf(1);
        });

        it('should handle invalid candle data', () => {
            const customData = createConfluenceTestData('bullish_alignment');
            customData.candles[customData.candles.length - 1] = null;

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = confluenceScoreCalculator(mockInput);

            expect(result).to.have.lengthOf(1);
            // Should handle gracefully and continue processing
            expect(result[0].json.confluence).to.have.property('score');
        });

        it('should handle undefined/null indicators', () => {
            const customData = createConfluenceTestData('null_indicators');

            const testData = [customData];
            const mockInput = createMockInput(testData);

            // Should not throw error
            expect(() => confluenceScoreCalculator(mockInput)).to.not.throw();

            const result = confluenceScoreCalculator(mockInput);
            expect(result).to.have.lengthOf(1);
            // Should process without crashing
            expect(result[0].json.confluence).to.have.property('score');
            expect(result[0].json.confluence).to.have.property('hits');
        });

        it('should maintain performance with complex calculations', () => {
            // Create multiple test cases for performance
            const testDataArray = [];
            for (let i = 0; i < 50; i++) {
                testDataArray.push(createConfluenceTestData('bullish_alignment'));
            }

            const mockInput = createMockInput(testDataArray);
            const startTime = Date.now();
            const result = confluenceScoreCalculator(mockInput);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(1000); // Should complete within 1 second
            expect(result).to.have.lengthOf(50);
        });
    });
});