// test/mock-data-test-case/6_backtest_engine.test.js
/**
 * Mock data and test cases for Backtest Engine node
 */

const { mockIndicators } = require('./all_nodes_common');

// Create specific test data for backtest scenarios
const createBacktestTestData = (scenario) => {
    let customCandles, customEntryExit, customConfluence, lastClose;

    switch (scenario) {
        case 'high_win_rate':
            customCandles = [];
            for (let i = 0; i < 150; i++) {
                let high, low, close;

                const cycle = Math.floor(i / 2); // Every 2 candles = 1 complete trade
                const isEntry = i % 2 === 0;     // Even index = entry candle
                const isWin = cycle % 4 !== 3;   // 3 out of 4 cycles are wins (75%)

                if (isEntry) {
                    // Entry candle - always triggers entry
                    high = 2500;
                    low = 2410;  // Below entry threshold (2420 * 1.005 = 2432.1)
                    close = 2500;
                } else {
                    // Result candle - determines win/loss outcome
                    if (isWin) {
                        // WIN: price hits target
                        high = 2700; // Above target (2650)
                        low = 2480;  // No new entry triggered
                        close = 2650; // Success close
                    } else {
                        // LOSS: price hits stop
                        high = 2400; // Below target (2650)
                        low = 2300;  // Below stop (2350) - triggers loss
                        close = 2320; // Loss close
                    }
                }

                customCandles.push({
                    date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: high,
                    low: low,
                    close: close,
                    volume: 3000000 + (i * 1000) // Deterministic volume
                });
            }

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 3.29,
                entryGapPercent: 2.1,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 4,
                hits: ['Strong bullish signals']
            };

            lastClose = 2450;
            break;

        case 'low_win_rate':
            // Create candles that would historically hit stop more often
            customCandles = [];
            for (let i = 0; i < 150; i++) {
                const basePrice = 2500;
                let high, low, close;

                // Every 6th candle creates a losing scenario
                if (i % 6 === 0) {
                    high = 2450;
                    low = 2300; // Hits stop at 2350
                    close = 2320;
                } else {
                    high = basePrice + Math.random() * 50;
                    low = basePrice - Math.random() * 50;
                    close = basePrice + (Math.random() - 0.5) * 30;
                }

                customCandles.push({
                    date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
                    open: Math.round(basePrice),
                    high: Math.round(high),
                    low: Math.round(low),
                    close: Math.round(close),
                    volume: 3000000 + Math.random() * 1000000
                });
            }

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 3.29,
                entryGapPercent: 2.1,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 2,
                hits: ['Weak signals']
            };

            lastClose = 2450;
            break;

        case 'insufficient_trades':
            // Create limited candles that don't generate enough trades
            customCandles = Array(80).fill().map((_, i) => ({
                date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                open: 2500,
                high: 2550,
                low: 2450, // Never hits entry at 2420
                close: 2500,
                volume: 3000000
            }));

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 3.29,
                entryGapPercent: 2.1,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 3,
                hits: ['Insufficient trading opportunities']
            };

            lastClose = 2450;
            break;

        case 'excellent_performance':
            // Create candles with very high win rate and good volume
            customCandles = [];
            for (let i = 0; i < 180; i++) {
                const basePrice = 2500;
                let high, low, close;

                // 80% win rate scenario
                if (i % 5 !== 0) { // 4 out of 5 wins
                    high = 2700; // Hits target
                    low = 2420;
                    close = 2650;
                } else {
                    high = 2450;
                    low = 2300; // Hits stop
                    close = 2320;
                }

                customCandles.push({
                    date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
                    open: Math.round(basePrice),
                    high: Math.round(high),
                    low: Math.round(low),
                    close: Math.round(close),
                    volume: 3000000 + Math.random() * 1000000
                });
            }

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 3.5, // High R:R
                entryGapPercent: 1.8,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 5,
                hits: ['Excellent setup with multiple confirmations']
            };

            lastClose = 2450;
            break;

        case 'mixed_results':
            // Create realistic mixed win/loss scenario
            customCandles = [];
            for (let i = 0; i < 120; i++) {
                const basePrice = 2500;
                let high, low, close;

                // 60% win rate - realistic scenario
                const isWin = Math.random() < 0.6;
                if (isWin) {
                    high = 2650 + Math.random() * 50; // Hits target
                    low = 2400 + Math.random() * 50;
                    close = 2600 + Math.random() * 40;
                } else {
                    high = 2450 + Math.random() * 50;
                    low = 2300 + Math.random() * 30; // Hits stop
                    close = 2350 + Math.random() * 40;
                }

                customCandles.push({
                    date: `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
                    open: Math.round(basePrice),
                    high: Math.round(high),
                    low: Math.round(low),
                    close: Math.round(close),
                    volume: 3000000 + Math.random() * 1000000
                });
            }

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 2.8,
                entryGapPercent: 2.5,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 3,
                hits: ['Mixed signal strength']
            };

            lastClose = 2450;
            break;

        case 'invalid_candles':
            // Create candles with some invalid data
            customCandles = Array(100).fill().map((_, i) => {
                if (i % 10 === 0) {
                    return {
                        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                        open: null,
                        high: 'invalid',
                        low: NaN,
                        close: undefined,
                        volume: 3000000
                    };
                }
                return {
                    date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                    open: 2500,
                    high: 2650,
                    low: 2400,
                    close: 2600,
                    volume: 3000000
                };
            });

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 3.29,
                entryGapPercent: 2.1,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 3,
                hits: ['Invalid data test']
            };

            lastClose = 2450;
            break;

        default:
            customCandles = Array(100).fill().map((_, i) => ({
                date: `2024-01-${String(i + 1).padStart(2, '0')}`,
                open: 2500,
                high: 2550,
                low: 2450,
                close: 2500,
                volume: 3000000
            }));

            customEntryExit = {
                entry: 2420,
                stop: 2350,
                target: 2650,
                riskReward: 3.29,
                entryGapPercent: 2.1,
                riskLot: 70,
                rewardLot: 230,
                entryStrategy: 'Breakout Entry (Acceptable Gap)'
            };

            customConfluence = {
                score: 3,
                hits: ['Default scenario']
            };

            lastClose = 2450;
    }

    return {
        ticker: `TEST_${scenario.toUpperCase()}`,
        lastDate: '2024-06-06',
        candles: customCandles,
        lastClose: lastClose,
        indicators: mockIndicators,
        support: {
            type: 'S',
            price: 2400,
            strength: 1.5,
            index: 80,
            age: 20,
            tests: 3
        },
        resistance: {
            type: 'R',
            price: 2700,
            strength: 1.3,
            index: 85
        },
        confluence: customConfluence,
        entryExit: customEntryExit
    };
};

// Backtest validation criteria
const backtestCriteria = {
    minimumWinRate: 0.52, // 52%
    minimumTrades: 5,
    bonusCriteria: {
        highWinRate: 0.7, // 70%
        minimumTradesForBonus: 8,
        highRiskReward: 2.5
    },
    recentPeriod: {
        maxPeriod: 100,
        startOffset: 14 // Skip first 14 candles
    }
};

// Test scenarios for backtest engine
const backtestTestScenarios = {
    high_win_rate: {
        name: 'High Win Rate',
        description: 'Setup with win rate > 70%',
        data: createBacktestTestData('high_win_rate'),
        expectedPass: true,
        expectedMetrics: {
            winRateMin: 70,
            totalTradesMin: 5,
            bonusConfluence: true
        }
    },

    low_win_rate: {
        name: 'Low Win Rate',
        description: 'Setup with win rate < 52%',
        data: createBacktestTestData('low_win_rate'),
        expectedPass: false
    },

    insufficient_trades: {
        name: 'Insufficient Trades',
        description: 'Less than 5 trades generated',
        data: createBacktestTestData('insufficient_trades'),
        expectedPass: false
    },

    excellent_performance: {
        name: 'Excellent Performance',
        description: 'Very high win rate with bonus qualification',
        data: createBacktestTestData('excellent_performance'),
        expectedPass: true,
        expectedMetrics: {
            winRateMin: 80,
            totalTradesMin: 10,
            bonusConfluence: 2 // Both bonuses
        }
    },

    mixed_results: {
        name: 'Mixed Results',
        description: 'Moderate win rate above threshold',
        data: createBacktestTestData('mixed_results'),
        expectedPass: true,
        expectedMetrics: {
            winRateMin: 55,
            winRateMax: 70,
            totalTradesMin: 5
        }
    },

    invalid_candles: {
        name: 'Invalid Candles',
        description: 'Handles invalid candle data gracefully',
        data: createBacktestTestData('invalid_candles'),
        expectedPass: true,
        expectedBehavior: 'should skip invalid candles'
    }
};

// Helper functions for backtest testing
const backtestHelpers = {
    calculateExpectedWinRate: (wins, total) => {
        return total > 0 ? (wins / total) * 100 : 0;
    },

    simulateBacktest: (candles, entryExit) => {
        let wins = 0, losses = 0, total = 0;
        const recentPeriod = Math.min(candles.length - 20, 100);

        for (let i = Math.max(14, candles.length - recentPeriod); i < candles.length - 1; i++) {
            if (!candles[i] || typeof candles[i].low !== 'number') continue;

            const testEntry = candles[i].low <= entryExit.entry * 1.005;
            if (testEntry) {
                total++;
                let hitTarget = false, hitStop = false;

                for (let j = i + 1; j < candles.length && !hitTarget && !hitStop; j++) {
                    if (!candles[j] || typeof candles[j].low !== 'number' || typeof candles[j].high !== 'number') {
                        break;
                    }

                    if (candles[j].low <= entryExit.stop) {
                        losses++;
                        hitStop = true;
                    } else if (candles[j].high >= entryExit.target) {
                        wins++;
                        hitTarget = true;
                    }
                }
            }
        }

        return { wins, losses, total, winRate: total > 0 ? wins / total : 0 };
    },

    calculateBonusConfluence: (winRate, totalTrades, riskReward) => {
        let bonus = 0;
        if (winRate > 0.7 && totalTrades >= 8) bonus++;
        if (riskReward > 2.5) bonus++;
        return bonus;
    },

    validateBacktestData: (backtest) => {
        const requiredFields = ['wins', 'losses', 'total', 'winRateDec', 'backtestWinRate'];
        return requiredFields.every(field => backtest.hasOwnProperty(field)) &&
            typeof backtest.wins === 'number' &&
            typeof backtest.losses === 'number' &&
            typeof backtest.total === 'number' &&
            backtest.wins >= 0 &&
            backtest.losses >= 0 &&
            backtest.total === backtest.wins + backtest.losses &&
            backtest.winRateDec >= 0 && backtest.winRateDec <= 1;
    },

    isValidCandle: (candle) => {
        return candle &&
            typeof candle.low === 'number' && !isNaN(candle.low) &&
            typeof candle.high === 'number' && !isNaN(candle.high);
    }
};

module.exports = {
    createBacktestTestData,
    backtestTestScenarios,
    backtestCriteria,
    backtestHelpers
};