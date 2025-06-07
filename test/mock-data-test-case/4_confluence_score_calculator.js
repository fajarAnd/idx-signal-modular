// test/mock-data-test-case/4_confluence_score_calculator.js
/**
 * Mock data and test cases for Confluence Score Calculator node
 */

const { mockIndicators, mockSupportResistance } = require('./all_nodes_common');

// Create specific test data for confluence scenarios
const createConfluenceTestData = (scenario) => {
    const baseCandles = Array(100).fill().map((_, i) => ({
        date: `2024-01-${String(i + 1).padStart(2, '0')}`,
        open: 2500,
        high: 2550,
        low: 2450,
        close: 2500,
        volume: 3000000
    }));

    let customIndicators, customSupport, lastClose;

    switch (scenario) {
        case 'bullish_alignment':
            lastClose = 2600;
            customIndicators = {
                sma20: 2500,
                sma50: 2400,
                ema21: 2520,
                rsi: 35, // Oversold
                stochRsi: 0.25, // Oversold
                macd: { macdLine: 5, signalLine: 3, histogram: 2 }, // Bullish crossover
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 8000000, // 2x volSMA20
                volSMA20: 4000000,
                volSMA5: 6000000 // 1.5x volSMA20
            };
            customSupport = {
                tests: 3,
                age: 15,
                price: 2400,
                strength: 1.5
            };
            break;

        case 'bearish_setup':
            lastClose = 2300;
            customIndicators = {
                sma20: 2400,
                sma50: 2500,
                ema21: 2380,
                rsi: 65, // Overbought
                stochRsi: 0.75, // Overbought
                macd: { macdLine: -2, signalLine: 1, histogram: -3 }, // Bearish
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 2000000,
                volSMA20: 4000000,
                volSMA5: 3000000
            };
            customSupport = {
                tests: 1,
                age: 5,
                price: 2200,
                strength: 0.8
            };
            break;

        case 'mixed_signals':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Above SMA20
                sma50: 2480, // Above SMA50
                ema21: 2510,
                rsi: 42, // Slightly oversold
                stochRsi: 0.45, // Neutral
                macd: { macdLine: 1, signalLine: -1, histogram: 2 }, // Bullish crossover
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 6000000,
                volSMA20: 4000000,
                volSMA5: 5000000
            };
            customSupport = {
                tests: 2,
                age: 8,
                price: 2400,
                strength: 1.2
            };
            break;

        case 'hammer_pattern':
            lastClose = 2500;
            // Create candles with hammer pattern in recent 5
            const hammeredCandles = [...baseCandles];
            // Create a proper hammer: long lower shadow, small body, small upper shadow
            hammeredCandles[hammeredCandles.length - 2] = {
                date: '2024-06-05',
                open: 2480,
                high: 2485, // Small upper shadow (5 points)
                low: 2420,  // Long lower shadow (60 points from body)
                close: 2475, // Close near open (body = 5 points)
                volume: 5000000
            };

            return {
                ticker: 'HAMMER_TEST',
                lastDate: '2024-06-06',
                candles: hammeredCandles,
                lastClose: lastClose,
                indicators: {
                    sma20: 2520, // Ensure uptrend for basic uptrend signal
                    sma50: 2400,
                    ema21: 2520,
                    rsi: 45,
                    stochRsi: 0.5,
                    macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                    bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                    currentVolume: 4000000,
                    volSMA20: 4000000,
                    volSMA5: 4000000
                },
                support: mockSupportResistance.support,
                resistance: mockSupportResistance.resistance
            };

        case 'near_bollinger_lower':
            lastClose = 2244; // Close to lower band (2200 * 1.02 = 2244)
            customIndicators = {
                sma20: 2520, // Ensure uptrend
                sma50: 2400,
                ema21: 2520,
                rsi: 45,
                stochRsi: 0.5,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 4000000,
                volSMA20: 4000000,
                volSMA5: 4000000
            };
            customSupport = mockSupportResistance.support;
            break;

        case 'sustained_volume_breakout':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Ensure uptrend
                sma50: 2400,
                ema21: 2520,
                rsi: 45,
                stochRsi: 0.5,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 8000000, // 2x volSMA20
                volSMA20: 4000000,
                volSMA5: 6000000 // 1.5x volSMA20
            };
            customSupport = mockSupportResistance.support;
            break;

        case 'volume_spike':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Ensure uptrend
                sma50: 2400,
                ema21: 2520,
                rsi: 45,
                stochRsi: 0.5,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 6000000, // 1.5x volSMA20
                volSMA20: 4000000,
                volSMA5: 5000000 // 1.25x volSMA20 (not 1.5x, so no sustained breakout)
            };
            customSupport = mockSupportResistance.support;
            break;

        case 'rsi_boundary_40_30':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Ensure uptrend
                sma50: 2400,
                ema21: 2520,
                rsi: 40, // Exactly at boundary
                stochRsi: 0.25, // Below 0.3
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 4000000,
                volSMA20: 4000000,
                volSMA5: 4000000
            };
            customSupport = mockSupportResistance.support;
            break;

        case 'rsi_boundary_45':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Ensure uptrend
                sma50: 2400,
                ema21: 2520,
                rsi: 45, // Exactly at boundary
                stochRsi: 0.35,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 4000000,
                volSMA20: 4000000,
                volSMA5: 4000000
            };
            customSupport = mockSupportResistance.support;
            break;

        case 'missing_indicators':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520,
                sma50: 2400,
                ema21: 2520,
                // rsi is deleted in test
                stochRsi: 0.5,
                // macd is deleted in test
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 4000000,
                volSMA20: 4000000,
                volSMA5: 4000000
            };
            customSupport = mockSupportResistance.support;
            break;

        case 'null_indicators':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520,
                sma50: 2400,
                ema21: 2520,
                rsi: null, // null value
                stochRsi: undefined, // undefined value
                macd: null, // null macd
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 4000000,
                volSMA20: 4000000,
                volSMA5: 4000000
            };
            customSupport = mockSupportResistance.support;
            break;

        default:
            customIndicators = {
                sma20: 2500,
                sma50: 2400,
                ema21: 2520,
                rsi: 50,
                stochRsi: 0.5,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 4000000,
                volSMA20: 4000000,
                volSMA5: 4000000
            };
            customSupport = mockSupportResistance.support;
            lastClose = 2500;
    }

    return {
        ticker: `TEST_${scenario.toUpperCase()}`,
        lastDate: '2024-06-06',
        candles: baseCandles,
        lastClose: lastClose,
        indicators: customIndicators,
        support: customSupport,
        resistance: mockSupportResistance.resistance
    };
};

// Test scenarios for confluence score calculator
const confluenceTestScenarios = {
    bullish_alignment: {
        name: 'Bullish Alignment',
        description: 'Multi-timeframe bullish alignment with oversold conditions',
        data: createConfluenceTestData('bullish_alignment'),
        expectedPass: true,
        expectedSignals: ['Multi-timeframe bullish alignment', 'Double oversold', 'Sustained volume breakout', 'Strong support']
    },

    bearish_setup: {
        name: 'Bearish Setup',
        description: 'Bearish market conditions',
        data: createConfluenceTestData('bearish_setup'),
        expectedPass: true,
        expectedScore: 0
    },

    mixed_signals: {
        name: 'Mixed Signals',
        description: 'Some bullish, some neutral signals',
        data: createConfluenceTestData('mixed_signals'),
        expectedPass: true,
        expectedSignals: ['Basic uptrend', 'MACD bullish crossover', 'Volume spike detected']
    },

    hammer_pattern: {
        name: 'Hammer Pattern',
        description: 'Candlestick hammer pattern detection',
        data: createConfluenceTestData('hammer_pattern'),
        expectedPass: true,
        expectedSignals: ['Hammer/Doji pattern detected']
    },

    near_bollinger_lower: {
        name: 'Near Bollinger Lower',
        description: 'Price near lower Bollinger band',
        data: createConfluenceTestData('near_bollinger_lower'),
        expectedPass: true,
        expectedSignals: ['Near Bollinger lower band']
    },

    sustained_volume_breakout: {
        name: 'Sustained Volume Breakout',
        description: 'High volume with sustained breakout',
        data: createConfluenceTestData('sustained_volume_breakout'),
        expectedPass: true,
        expectedSignals: ['Sustained volume breakout']
    },

    volume_spike: {
        name: 'Volume Spike',
        description: 'Volume spike without sustained breakout',
        data: createConfluenceTestData('volume_spike'),
        expectedPass: true,
        expectedSignals: ['Volume spike detected']
    },

    rsi_boundary_conditions: {
        name: 'RSI Boundary Conditions',
        description: 'Test RSI at boundary values',
        scenarios: [
            { rsi: 40, stochRsi: 0.25, shouldHaveDouble: true },
            { rsi: 45, stochRsi: 0.35, shouldHaveSingle: true },
            { rsi: 45.1, stochRsi: 0.35, shouldHaveSingle: false },
            { rsi: 39.9, stochRsi: 0.31, shouldHaveDouble: false }
        ]
    }
};

// Confluence scoring rules and thresholds
const confluenceRules = {
    trendAnalysis: {
        multiTimeframeBullish: {
            score: 2,
            conditions: 'lastClose > sma20 && sma20 > sma50 && lastClose > ema21'
        },
        basicUptrend: {
            score: 1,
            conditions: 'lastClose > sma50'
        }
    },
    momentum: {
        doubleOversold: {
            score: 2,
            conditions: 'rsi < 40 && stochRsi < 0.3'
        },
        rsiOversold: {
            score: 1,
            conditions: 'rsi < 45'
        }
    },
    macd: {
        bullishCrossover: {
            score: 1,
            conditions: 'macdLine > signalLine && histogram > 0'
        }
    },
    bollingerBands: {
        nearLowerBand: {
            score: 1,
            conditions: 'lastClose <= lower * 1.02'
        }
    },
    volume: {
        sustainedBreakout: {
            score: 2,
            conditions: 'currentVolume > volSMA20 * 2 && volSMA5 > volSMA20 * 1.5'
        },
        volumeSpike: {
            score: 1,
            conditions: 'currentVolume > volSMA20 * 1.5'
        }
    },
    support: {
        strongSupport: {
            score: 2,
            conditions: 'tests >= 3 && age >= 10'
        },
        reliableSupport: {
            score: 1,
            conditions: 'tests >= 2'
        }
    },
    patterns: {
        hammerDoji: {
            score: 1,
            conditions: 'lowerShadow > body * 2 && upperShadow < body * 0.5'
        }
    }
};

// Helper functions for confluence testing
const confluenceHelpers = {
    validateConfluenceData: (confluence) => {
        return confluence &&
            typeof confluence.score === 'number' &&
            Array.isArray(confluence.hits) &&
            confluence.score >= 0;
    },

    getExpectedScore: (signals) => {
        let totalScore = 0;
        signals.forEach(signal => {
            if (signal.includes('Multi-timeframe bullish')) totalScore += 2;
            else if (signal.includes('Basic uptrend')) totalScore += 1;
            else if (signal.includes('Double oversold')) totalScore += 2;
            else if (signal.includes('RSI oversold')) totalScore += 1;
            else if (signal.includes('MACD bullish')) totalScore += 1;
            else if (signal.includes('Near Bollinger')) totalScore += 1;
            else if (signal.includes('Sustained volume')) totalScore += 2;
            else if (signal.includes('Volume spike')) totalScore += 1;
            else if (signal.includes('Strong support')) totalScore += 2;
            else if (signal.includes('Reliable support')) totalScore += 1;
            else if (signal.includes('Hammer/Doji')) totalScore += 1;
        });
        return totalScore;
    },

    hasExpectedSignals: (hits, expectedSignals) => {
        return expectedSignals.every(signal =>
            hits.some(hit => hit.includes(signal))
        );
    },

    isValidRSIFormat: (hit) => {
        return /RSI: \d+\.\d/.test(hit);
    },

    isValidStochRSIFormat: (hit) => {
        return /StochRSI: \d+\.\d%/.test(hit);
    },

    createHammerCandle: (open, high, low, close) => {
        const body = Math.abs(close - open);
        const lowerShadow = Math.min(open, close) - low;
        const upperShadow = high - Math.max(open, close);

        return {
            candle: { open, high, low, close },
            isHammer: body > 0 && lowerShadow > body * 2 && upperShadow < body * 0.5,
            measurements: { body, lowerShadow, upperShadow }
        };
    }
};

module.exports = {
    createConfluenceTestData,
    confluenceTestScenarios,
    confluenceRules,
    confluenceHelpers
};