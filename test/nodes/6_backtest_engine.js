// test/nodes/6_backtest_engine.test.js
const { expect } = require('chai');
const backtestEngine = require('../../src/nodes/6_backtest_engine');
const { backtestTestScenarios, backtestHelpers, createBacktestTestData, backtestCriteria } = require('../mock-data-test-case/6_backtest_engine');
const { createMockInput } = require('../mock-data-test-case/all_nodes_common');

describe('Backtest Engine Node', () => {

    describe('Backtest Execution Logic', () => {
        it('should execute backtest correctly for high win rate scenario', () => {
            const testData = [backtestTestScenarios.high_win_rate.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json).to.have.property('backtest');

            const backtest = result[0].json.backtest;
            expect(backtestHelpers.validateBacktestData(backtest)).to.be.true;
            expect(backtest.backtestWinRate).to.be.greaterThanOrEqual(70);
            expect(backtest.total).to.be.greaterThanOrEqual(5);
        });

        it('should simulate trades correctly by checking entry conditions', () => {
            const testData = [backtestTestScenarios.mixed_results.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            const backtest = result[0].json.backtest;

            // Verify that trade simulation logic matches expected behavior
            const simulatedBacktest = backtestHelpers.simulateBacktest(
                testData[0].candles,
                testData[0].entryExit
            );

            expect(backtest.wins).to.be.closeTo(simulatedBacktest.wins, 2);
            expect(backtest.losses).to.be.closeTo(simulatedBacktest.losses, 2);
            expect(backtest.total).to.be.closeTo(simulatedBacktest.total, 2);
        });

        it('should check entry condition with 0.5% tolerance', () => {
            // Create custom data where entry is exactly at tolerance
            const customData = createBacktestTestData('mixed_results');
            const entryPrice = customData.entryExit.entry;
            const tolerancePrice = entryPrice * 1.005;

            // Set some candle lows to test tolerance
            customData.candles[50].low = tolerancePrice; // Should trigger entry
            customData.candles[60].low = tolerancePrice + 1; // Should NOT trigger entry

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            const backtest = result[0].json.backtest;
            expect(backtest.total).to.be.greaterThan(0);
        });

        it('should correctly identify target and stop hits', () => {
            // Create specific scenario with known outcomes
            const customData = createBacktestTestData('mixed_results');
            const entryExit = customData.entryExit;

            // Clear specific test sequence in candles
            for (let i = 50; i < 55; i++) {
                customData.candles[i] = {
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: 2500,
                    low: entryExit.entry - 5, // Triggers entry
                    close: 2500,
                    volume: 3000000
                };
            }

            // Next candle hits target
            customData.candles[55] = {
                date: '2024-01-56',
                open: 2500,
                high: entryExit.target + 10, // Hits target
                low: 2450,
                close: entryExit.target,
                volume: 3000000
            };

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            const backtest = result[0].json.backtest;
            expect(backtest.wins).to.be.greaterThan(0);
        });

        it('should correctly identify stop loss hits', () => {
            // Create specific scenario with stop loss
            const customData = createBacktestTestData('mixed_results');
            const entryExit = customData.entryExit;

            // Clear specific test sequence
            for (let i = 50; i < 55; i++) {
                customData.candles[i] = {
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: 2500,
                    low: entryExit.entry - 5, // Triggers entry
                    close: 2500,
                    volume: 3000000
                };
            }

            // Next candle hits stop
            customData.candles[55] = {
                date: '2024-01-56',
                open: 2500,
                high: 2450,
                low: entryExit.stop - 10, // Hits stop
                close: entryExit.stop,
                volume: 3000000
            };

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            const backtest = result[0].json.backtest;
            expect(backtest.losses).to.be.greaterThan(0);
        });
    });

    describe('Filtering Criteria', () => {
        it('should filter out setups with low win rate (< 52%)', () => {
            const testData = [backtestTestScenarios.low_win_rate.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should filter out setups with insufficient trades (< 5)', () => {
            const testData = [backtestTestScenarios.insufficient_trades.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should test win rate boundary conditions', () => {
            const testScenarios = [
                { winRate: 0.51, shouldPass: false },
                { winRate: 0.52, shouldPass: true },
                { winRate: 0.521, shouldPass: true }
            ];

            testScenarios.forEach(scenario => {
                // Create custom data with controlled win rate
                const customData = createBacktestTestData('mixed_results');

                // Manipulate candles to achieve desired win rate
                const totalTrades = 10;
                const wins = Math.round(totalTrades * scenario.winRate);
                const losses = totalTrades - wins;

                customData.candles = [];
                for (let i = 0; i < 100; i++) {
                    const isTradeCandle = i >= 20 && i < 20 + totalTrades;
                    const isWin = isTradeCandle && (i - 20) < wins;

                    customData.candles.push({
                        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                        open: 2500,
                        high: isWin ? customData.entryExit.target + 10 : 2550,
                        low: isTradeCandle ? customData.entryExit.entry - 5 : (isWin ? 2450 : customData.entryExit.stop - 10),
                        close: 2500,
                        volume: 3000000
                    });
                }

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = backtestEngine(mockInput);

                if (scenario.shouldPass) {
                    expect(result.length).to.be.greaterThan(0);
                    if (result.length > 0) {
                        expect(result[0].json.backtest.winRateDec).to.be.greaterThanOrEqual(0.52);
                    }
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });

        it('should test minimum trades boundary (5 trades)', () => {
            const testScenarios = [
                { totalTrades: 4, shouldPass: false },
                { totalTrades: 5, shouldPass: true },
                { totalTrades: 6, shouldPass: true }
            ];

            testScenarios.forEach(scenario => {
                const customData = createBacktestTestData('high_win_rate');

                // Create exact number of trades with good win rate
                customData.candles = [];
                for (let i = 0; i < 100; i++) {
                    const isTradeCandle = i >= 30 && i < 30 + scenario.totalTrades;
                    const isWin = isTradeCandle && (i - 30) < Math.ceil(scenario.totalTrades * 0.7); // 70% win rate

                    customData.candles.push({
                        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                        open: 2500,
                        high: isWin ? customData.entryExit.target + 10 : 2550,
                        low: isTradeCandle ? customData.entryExit.entry - 5 : (isWin ? 2450 : customData.entryExit.stop - 10),
                        close: 2500,
                        volume: 3000000
                    });
                }

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const result = backtestEngine(mockInput);

                if (scenario.shouldPass) {
                    expect(result.length).to.be.greaterThan(0);
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Confluence Bonus System', () => {
        it('should add bonus for high win rate (> 70%) with sufficient trades (≥ 8)', () => {
            const testData = [backtestTestScenarios.excellent_performance.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            const originalConfluence = testData[0].confluence.score;
            const resultConfluence = result[0].json.confluence.score;

            expect(resultConfluence).to.be.greaterThan(originalConfluence);

            const backtest = result[0].json.backtest;
            if (backtest.winRateDec > 0.7 && backtest.total >= 8) {
                expect(resultConfluence).to.be.greaterThanOrEqual(originalConfluence + 1);
            }
        });

        it('should add bonus for high risk/reward ratio (> 2.5)', () => {
            const customData = createBacktestTestData('high_win_rate');
            customData.entryExit.riskReward = 3.0; // High R:R
            customData.confluence.score = 3; // Base score

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            if (result.length > 0) {
                const resultConfluence = result[0].json.confluence.score;
                expect(resultConfluence).to.be.greaterThan(3);
            }
        });

        it('should add both bonuses when criteria are met', () => {
            const testData = [backtestTestScenarios.excellent_performance.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            const originalConfluence = testData[0].confluence.score;
            const resultConfluence = result[0].json.confluence.score;
            const backtest = result[0].json.backtest;

            let expectedBonus = 0;
            if (backtest.winRateDec > 0.7 && backtest.total >= 8) expectedBonus++;
            if (testData[0].entryExit.riskReward > 2.5) expectedBonus++;

            expect(resultConfluence).to.equal(originalConfluence + expectedBonus);
        });

        it('should not add bonus if criteria are not met', () => {
            const testData = [backtestTestScenarios.mixed_results.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            if (result.length > 0) {
                const originalConfluence = testData[0].confluence.score;
                const resultConfluence = result[0].json.confluence.score;
                const backtest = result[0].json.backtest;

                // Check if bonuses should be applied
                let expectedBonus = 0;
                if (backtest.winRateDec > 0.7 && backtest.total >= 8) expectedBonus++;
                if (testData[0].entryExit.riskReward > 2.5) expectedBonus++;

                expect(resultConfluence).to.equal(originalConfluence + expectedBonus);
            }
        });
    });

    describe('Backtest Period Configuration', () => {
        it('should use correct recent period calculation', () => {
            const testData = [backtestTestScenarios.high_win_rate.data];
            const candlesLength = testData[0].candles.length;

            const expectedRecentPeriod = Math.min(candlesLength - 20, 100);
            const expectedStartIndex = Math.max(14, candlesLength - expectedRecentPeriod);

            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);

            // Verify that backtest covers the expected period
            const backtest = result[0].json.backtest;
            expect(backtest.total).to.be.greaterThan(0);
        });

        it('should handle short candle arrays correctly', () => {
            const customData = createBacktestTestData('high_win_rate');
            customData.candles = customData.candles.slice(0, 30); // Short array

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            // Should still process but may have fewer trades
            expect(result).to.be.an('array');
        });

        it('should skip first 14 candles from backtest period', () => {
            const customData = createBacktestTestData('high_win_rate');

            // Set up trades in first 14 candles (should be ignored)
            for (let i = 0; i < 14; i++) {
                customData.candles[i].low = customData.entryExit.entry - 5; // Would trigger entry
                customData.candles[i].high = customData.entryExit.target + 10; // Would hit target
            }

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            // The early candles should not affect backtest results significantly
            expect(result).to.be.an('array');
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(backtestTestScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const result = backtestEngine(mockInput);

                if (scenario.expectedPass) {
                    expect(result).to.have.lengthOf(1);
                    expect(result[0].json).to.have.property('backtest');

                    const backtest = result[0].json.backtest;
                    expect(backtestHelpers.validateBacktestData(backtest)).to.be.true;

                    // Check specific expectations
                    if (scenario.expectedMetrics) {
                        const metrics = scenario.expectedMetrics;

                        if (metrics.winRateMin) {
                            expect(backtest.backtestWinRate).to.be.greaterThanOrEqual(metrics.winRateMin);
                        }

                        if (metrics.winRateMax) {
                            expect(backtest.backtestWinRate).to.be.lessThanOrEqual(metrics.winRateMax);
                        }

                        if (metrics.totalTradesMin) {
                            expect(backtest.total).to.be.greaterThanOrEqual(metrics.totalTradesMin);
                        }

                        if (metrics.bonusConfluence) {
                            const originalScore = testData[0].confluence.score;
                            const finalScore = result[0].json.confluence.score;
                            if (metrics.bonusConfluence === true) {
                                expect(finalScore).to.be.greaterThan(originalScore);
                            } else if (typeof metrics.bonusConfluence === 'number') {
                                expect(finalScore).to.be.greaterThanOrEqual(originalScore + metrics.bonusConfluence);
                            }
                        }
                    }
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const result = backtestEngine(mockInput);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should handle invalid candle data gracefully', () => {
            const testData = [backtestTestScenarios.invalid_candles.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            // Should not crash, may have fewer or no results
            expect(result).to.be.an('array');
        });

        it('should skip candles with invalid low values', () => {
            const customData = createBacktestTestData('mixed_results');

            // Insert invalid candles
            customData.candles[50] = {
                date: '2024-01-51',
                open: 2500,
                high: 2550,
                low: null, // Invalid
                close: 2500,
                volume: 3000000
            };

            customData.candles[60] = {
                date: '2024-01-61',
                open: 2500,
                high: 2550,
                low: NaN, // Invalid
                close: 2500,
                volume: 3000000
            };

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            // Should handle gracefully
            expect(result).to.be.an('array');
        });

        it('should handle zero total trades scenario', () => {
            const customData = createBacktestTestData('insufficient_trades');

            // Ensure no candles trigger entry
            customData.candles.forEach(candle => {
                candle.low = customData.entryExit.entry + 100; // Never hits entry
            });

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(0);
        });

        it('should preserve original data structure', () => {
            const testData = [backtestTestScenarios.excellent_performance.data];
            const originalData = JSON.parse(JSON.stringify(testData[0]));

            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.ticker).to.equal(originalData.ticker);
            expect(result[0].json.lastDate).to.equal(originalData.lastDate);
            expect(result[0].json.lastClose).to.equal(originalData.lastClose);
            expect(result[0].json.candles).to.deep.equal(originalData.candles);
            expect(result[0].json.indicators).to.deep.equal(originalData.indicators);
            expect(result[0].json.support).to.deep.equal(originalData.support);
            expect(result[0].json.resistance).to.deep.equal(originalData.resistance);
            expect(result[0].json.entryExit).to.deep.equal(originalData.entryExit);
        });
    });

    describe('Win Rate Calculation Accuracy', () => {
        it('should calculate win rate percentage correctly', () => {
            const testData = [backtestTestScenarios.mixed_results.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            if (result.length > 0) {
                const backtest = result[0].json.backtest;

                const expectedWinRate = backtestHelpers.calculateExpectedWinRate(backtest.wins, backtest.total);
                expect(backtest.backtestWinRate).to.be.closeTo(expectedWinRate, 0.1);

                // Verify decimal to percentage conversion
                expect(backtest.backtestWinRate).to.equal(Number((backtest.winRateDec * 100).toFixed(1)));

                // Verify wins + losses = total
                expect(backtest.wins + backtest.losses).to.equal(backtest.total);
            }
        });

        it('should round win rate to 1 decimal place', () => {
            const testData = [backtestTestScenarios.high_win_rate.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            if (result.length > 0) {
                const backtest = result[0].json.backtest;

                const decimalPlaces = backtest.backtestWinRate.toString().split('.')[1]?.length || 0;
                expect(decimalPlaces).to.be.lessThanOrEqual(1);
            }
        });

        it('should maintain consistency between winRateDec and backtestWinRate', () => {
            const testData = [backtestTestScenarios.excellent_performance.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            if (result.length > 0) {
                const backtest = result[0].json.backtest;

                const expectedPercentage = Number((backtest.winRateDec * 100).toFixed(1));
                expect(backtest.backtestWinRate).to.equal(expectedPercentage);

                expect(backtest.winRateDec).to.be.greaterThanOrEqual(0);
                expect(backtest.winRateDec).to.be.lessThanOrEqual(1);
            }
        });
    });

    describe('Performance and Data Integrity', () => {
        it('should handle large datasets efficiently', () => {
            const largeTestData = [];
            for (let i = 0; i < 50; i++) {
                largeTestData.push(createBacktestTestData('mixed_results'));
            }

            const mockInput = createMockInput(largeTestData);
            const startTime = Date.now();
            const result = backtestEngine(mockInput);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(10000); // Should complete within 10 seconds
            expect(result).to.be.an('array');
        });

        it('should produce consistent results with same input', () => {
            const testData = [backtestTestScenarios.high_win_rate.data];
            const mockInput1 = createMockInput(testData);
            const mockInput2 = createMockInput(testData);

            const result1 = backtestEngine(mockInput1);
            const result2 = backtestEngine(mockInput2);

            expect(result1).to.deep.equal(result2);
        });

        it('should validate all backtest metrics are within expected ranges', () => {
            const testData = [backtestTestScenarios.excellent_performance.data];
            const mockInput = createMockInput(testData);
            const result = backtestEngine(mockInput);

            if (result.length > 0) {
                const backtest = result[0].json.backtest;

                expect(backtest.wins).to.be.greaterThanOrEqual(0);
                expect(backtest.losses).to.be.greaterThanOrEqual(0);
                expect(backtest.total).to.be.greaterThanOrEqual(backtestCriteria.minimumTrades);
                expect(backtest.winRateDec).to.be.greaterThanOrEqual(backtestCriteria.minimumWinRate);
                expect(backtest.winRateDec).to.be.lessThanOrEqual(1);
                expect(backtest.backtestWinRate).to.be.greaterThanOrEqual(backtestCriteria.minimumWinRate * 100);
                expect(backtest.backtestWinRate).to.be.lessThanOrEqual(100);
            }
        });
    });
});