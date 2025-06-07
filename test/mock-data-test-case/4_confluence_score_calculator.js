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
        high: 2520, // 20-point range, small shadows
        low: 2490,  // Lower shadow: 10 points
        close: 2515, // Body: 15 points, Upper shadow: 5 points
        volume: 3000000
        // This creates: body=15, lowerShadow=10, upperShadow=5, range=30
        // Hammer test: 15>0 && 10>30 && 5<=15 = TRUE && FALSE && TRUE = FALSE
        // Doji test: 15/30=50% < 5% = FALSE
        // Result: NO pattern detected ✓
    }));

    let customIndicators, customSupport, lastClose;

    switch (scenario) {
        case 'bullish_alignment':
            lastClose = 2600;
            customIndicators = {
                sma20: 2500,
                sma50: 2400,
                ema21: 2520,
                rsi: 35,
                stochRsi: 0.25,
                macd: { macdLine: 5, signalLine: 3, histogram: 2 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 8100000, // Fixed volume for sustained breakout
                volSMA20: 4000000,
                volSMA5: 6100000
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
                sma20: 2520, // Above SMA20 - will trigger basic uptrend
                sma50: 2480, // Above SMA50 - will trigger basic uptrend
                ema21: 2510,
                rsi: 42, // Slightly oversold - will trigger RSI oversold
                stochRsi: 0.45, // Neutral
                macd: { macdLine: 1, signalLine: -1, histogram: 2 }, // Bullish crossover
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                currentVolume: 6000000, // 1.5x volSMA20 - will trigger volume spike
                volSMA20: 4000000,
                volSMA5: 5000000 // 1.25x volSMA20 - not enough for sustained breakout
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
            // Create proper hammer pattern
            const hammeredCandles = [...baseCandles];
            hammeredCandles[hammeredCandles.length - 2] = {
                date: '2024-06-05',
                open: 2480,
                high: 2481, // Upper shadow: 1 point
                low: 2420,  // Lower shadow: 59 points
                close: 2481, // Body: 1 point
                volume: 5000000
                // This creates: body=1, lowerShadow=59, upperShadow=0, range=61
                // Hammer test: 1>0 && 59>2 && 0<=1 = TRUE && TRUE && TRUE = TRUE ✓
                // Doji test: 1/61=1.6% < 5% = TRUE ✓
                // Result: Pattern detected ✓
            };

            return {
                ticker: 'HAMMER_TEST',
                lastDate: '2024-06-06',
                candles: hammeredCandles,
                lastClose: lastClose,
                indicators: {
                    sma20: 2520,
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
                sma20: 2520, // Basic uptrend condition
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
                sma20: 2520, // Basic uptrend condition
                sma50: 2400,
                ema21: 2520,
                rsi: 45,
                stochRsi: 0.5,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                // CONDITIONS FOR SUSTAINED VOLUME BREAKOUT:
                // currentVolume > volSMA20 * 2 AND volSMA5 > volSMA20 * 1.5
                // Use values clearly ABOVE thresholds to avoid boundary issues
                currentVolume: 8100000, // 2.025x volSMA20 (clearly > 2x) - FIXED FROM 8500000
                volSMA20: 4000000,
                volSMA5: 6100000 // 1.525x volSMA20 (clearly > 1.5x) - FIXED FROM 6200000
            };
            customSupport = {
                tests: 2, // Change to NOT trigger "Strong support"
                age: 8,   // Only "Reliable support"
                price: 2400,
                strength: 1.2
            };
            break;

        case 'volume_spike':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Basic uptrend condition
                sma50: 2400,
                ema21: 2520,
                rsi: 45,
                stochRsi: 0.5,
                macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                bollingerBands: { upper: 2800, middle: 2500, lower: 2200 },
                // CONDITIONS FOR VOLUME SPIKE ONLY:
                // currentVolume > volSMA20 * 1.5 BUT volSMA5 <= volSMA20 * 1.5
                currentVolume: 6100000, // 1.525x volSMA20 (clearly > 1.5x) - FIXED FROM 6500000
                volSMA20: 4000000,
                volSMA5: 5900000 // 1.475x volSMA20 (clearly < 1.5x) - FIXED FROM 5800000
            };
            customSupport = {
                tests: 2, // Only "Reliable support"
                age: 8,
                price: 2400,
                strength: 1.2
            };
            break;

        case 'rsi_boundary_40_30':
            lastClose = 2500;
            customIndicators = {
                sma20: 2520, // Basic uptrend condition
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
                sma20: 2520, // Basic uptrend condition
                sma50: 2400,
                ema21: 2520,
                rsi: 45, // Exactly at boundary for single RSI oversold
                stochRsi: 0.35, // Above 0.3 - won't trigger double oversold
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
            lastClose = 2500;
            customIndicators = mockIndicators;
            customSupport = mockSupportResistance.support;
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
        expectedSignals: ['Basic uptrend', 'RSI oversold', 'MACD bullish crossover', 'Volume spike detected', 'Reliable support']
    },

    hammer_pattern: {
        name: 'Hammer Pattern',
        description: 'Candlestick hammer pattern detection',
        data: createConfluenceTestData('hammer_pattern'),
        expectedPass: true,
        expectedSignals: ['Basic uptrend', 'Hammer/Doji pattern detected']
    },

    near_bollinger_lower: {
        name: 'Near Bollinger Lower',
        description: 'Price near lower Bollinger band',
        data: createConfluenceTestData('near_bollinger_lower'),
        expectedPass: true,
        expectedSignals: ['Basic uptrend', 'Near Bollinger lower band']
    },

    sustained_volume_breakout: {
        name: 'Sustained Volume Breakout',
        description: 'High volume with sustained breakout',
        data: createConfluenceTestData('sustained_volume_breakout'),
        expectedPass: true,
        expectedSignals: ['Basic uptrend', 'Sustained volume breakout']
    },

    volume_spike: {
        name: 'Volume Spike',
        description: 'Volume spike without sustained breakout',
        data: createConfluenceTestData('volume_spike'),
        expectedPass: true,
        expectedSignals: ['Basic uptrend', 'Volume spike detected']
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
            conditions: 'lowerShadow > body * 2 && upperShadow < body * 0.5 || isDoji'
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