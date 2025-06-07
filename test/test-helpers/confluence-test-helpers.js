// test/test-helpers/confluence-test-helpers.js
/**
 * Helper functions specifically for Confluence Score Calculator testing
 */

const confluenceTestHelpers = {
    /**
     * Validate confluence data structure
     */
    validateConfluenceData: (confluence) => {
        return confluence &&
            typeof confluence.score === 'number' &&
            Array.isArray(confluence.hits) &&
            confluence.score >= 0;
    },

    /**
     * Calculate expected score based on signal array
     */
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

    /**
     * Check if all expected signals are present
     */
    hasExpectedSignals: (hits, expectedSignals) => {
        return expectedSignals.every(signal =>
            hits.some(hit => hit.includes(signal))
        );
    },

    /**
     * Validate RSI format in hit message
     */
    isValidRSIFormat: (hit) => {
        return /RSI: \d+\.\d/.test(hit);
    },

    /**
     * Validate StochRSI format in hit message
     */
    isValidStochRSIFormat: (hit) => {
        return /StochRSI: \d+\.\d%/.test(hit);
    },

    /**
     * Create and validate hammer candle
     */
    createHammerCandle: (open, high, low, close) => {
        const body = Math.abs(close - open);
        const lowerShadow = Math.min(open, close) - low;
        const upperShadow = high - Math.max(open, close);

        return {
            candle: { open, high, low, close },
            isHammer: body > 0 && lowerShadow > body * 2 && upperShadow < body * 0.5,
            measurements: { body, lowerShadow, upperShadow }
        };
    },

    /**
     * Test volume thresholds
     */
    testVolumeThresholds: (currentVolume, volSMA20, volSMA5) => {
        const sustainedBreakout = currentVolume > volSMA20 * 2 && volSMA5 > volSMA20 * 1.5;
        const volumeSpike = currentVolume > volSMA20 * 1.5;

        if (sustainedBreakout) return 'Sustained volume breakout';
        if (volumeSpike) return 'Volume spike detected';
        return null;
    },

    /**
     * Test RSI boundary conditions
     */
    testRSIBoundaries: (rsi, stochRsi) => {
        if (typeof rsi === 'number' && typeof stochRsi === 'number') {
            if (rsi < 40 && stochRsi < 0.3) return 'double_oversold';
            if (rsi < 45) return 'rsi_oversold';
        }
        return null;
    },

    /**
     * Test support quality boundaries
     */
    testSupportQuality: (tests, age) => {
        if (typeof tests === 'number' && typeof age === 'number') {
            if (tests >= 3 && age >= 10) return 'strong_support';
            if (tests >= 2) return 'reliable_support';
        }
        return null;
    },

    /**
     * Test MACD conditions
     */
    testMACDConditions: (macd) => {
        if (macd && typeof macd === 'object' &&
            typeof macd.macdLine === 'number' &&
            typeof macd.signalLine === 'number' &&
            typeof macd.histogram === 'number') {
            return macd.macdLine > macd.signalLine && macd.histogram > 0;
        }
        return false;
    },

    /**
     * Test Bollinger Band conditions
     */
    testBollingerConditions: (lastClose, lowerBand) => {
        if (typeof lastClose === 'number' && typeof lowerBand === 'number') {
            return lastClose <= lowerBand * 1.02;
        }
        return false;
    },

    /**
     * Test trend analysis conditions
     */
    testTrendConditions: (lastClose, sma20, sma50, ema21) => {
        if (typeof lastClose === 'number' && typeof sma20 === 'number' &&
            typeof sma50 === 'number' && typeof ema21 === 'number') {
            if (lastClose > sma20 && sma20 > sma50 && lastClose > ema21) {
                return 'multi_timeframe_bullish';
            }
            if (lastClose > sma50) {
                return 'basic_uptrend';
            }
        }
        return null;
    },

    /**
     * Generate test data variations for boundary testing
     */
    generateBoundaryTestData: () => {
        return {
            rsi_boundaries: [
                { rsi: 39.9, stochRsi: 0.25, expected: null },
                { rsi: 40.0, stochRsi: 0.25, expected: 'double_oversold' },
                { rsi: 44.9, stochRsi: 0.35, expected: 'rsi_oversold' },
                { rsi: 45.0, stochRsi: 0.35, expected: 'rsi_oversold' },
                { rsi: 45.1, stochRsi: 0.35, expected: null }
            ],
            volume_boundaries: [
                { current: 5900000, sma20: 4000000, sma5: 5000000, expected: null },
                { current: 6000000, sma20: 4000000, sma5: 5000000, expected: 'Volume spike detected' },
                { current: 8000000, sma20: 4000000, sma5: 6000000, expected: 'Sustained volume breakout' }
            ],
            support_boundaries: [
                { tests: 1, age: 15, expected: null },
                { tests: 2, age: 8, expected: 'reliable_support' },
                { tests: 3, age: 9, expected: 'reliable_support' },
                { tests: 3, age: 10, expected: 'strong_support' }
            ]
        };
    },

    /**
     * Create test candles with specific patterns
     */
    createTestCandles: (pattern) => {
        const baseCandles = Array(100).fill().map((_, i) => ({
            date: `2024-01-${String(i + 1).padStart(2, '0')}`,
            open: 2500,
            high: 2550,
            low: 2450,
            close: 2500,
            volume: 3000000
        }));

        switch (pattern) {
            case 'hammer':
                baseCandles[baseCandles.length - 2] = {
                    date: '2024-06-05',
                    open: 2480,
                    high: 2485, // Small upper shadow (5 points)
                    low: 2420,  // Long lower shadow (60 points from body)
                    close: 2475, // Close near open (body = 5 points)
                    volume: 5000000
                };
                break;
            case 'doji':
                baseCandles[baseCandles.length - 1] = {
                    date: '2024-06-06',
                    open: 2500,
                    high: 2520,
                    low: 2480,
                    close: 2500, // Same as open = doji
                    volume: 4000000
                };
                break;
            case 'normal':
            default:
                // Keep base candles as is
                break;
        }

        return baseCandles;
    },

    /**
     * Validate all confluence calculation rules
     */
    validateAllRules: (testData, expectedHits) => {
        const results = {
            trend: confluenceTestHelpers.testTrendConditions(
                testData.lastClose,
                testData.indicators.sma20,
                testData.indicators.sma50,
                testData.indicators.ema21
            ),
            rsi: confluenceTestHelpers.testRSIBoundaries(
                testData.indicators.rsi,
                testData.indicators.stochRsi
            ),
            macd: confluenceTestHelpers.testMACDConditions(testData.indicators.macd),
            bollinger: confluenceTestHelpers.testBollingerConditions(
                testData.lastClose,
                testData.indicators.bollingerBands?.lower
            ),
            volume: confluenceTestHelpers.testVolumeThresholds(
                testData.indicators.currentVolume,
                testData.indicators.volSMA20,
                testData.indicators.volSMA5
            ),
            support: confluenceTestHelpers.testSupportQuality(
                testData.support?.tests,
                testData.support?.age
            )
        };

        return results;
    },

    /**
     * Performance testing utility
     */
    performanceTest: (testFunction, iterations = 100) => {
        const startTime = Date.now();

        for (let i = 0; i < iterations; i++) {
            testFunction();
        }

        const endTime = Date.now();
        const duration = endTime - startTime;
        const avgTime = duration / iterations;

        return {
            totalTime: duration,
            averageTime: avgTime,
            iterations,
            throughput: iterations / (duration / 1000) // operations per second
        };
    },

    /**
     * Create mock indicators with specific values
     */
    createMockIndicators: (overrides = {}) => {
        const defaultIndicators = {
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

        return { ...defaultIndicators, ...overrides };
    },

    /**
     * Create mock support/resistance data
     */
    createMockSupportResistance: (supportOverrides = {}, resistanceOverrides = {}) => {
        const defaultSupport = {
            type: 'S',
            price: 2400,
            strength: 1.5,
            index: 80,
            age: 15,
            tests: 3
        };

        const defaultResistance = {
            type: 'R',
            price: 2800,
            strength: 1.3,
            index: 85
        };

        return {
            support: { ...defaultSupport, ...supportOverrides },
            resistance: { ...defaultResistance, ...resistanceOverrides }
        };
    },

    /**
     * Assert confluence result matches expectations
     */
    assertConfluenceResult: (result, expectations) => {
        const { expectedScore, expectedHits, expectedMinScore, expectedMaxScore } = expectations;

        if (expectedScore !== undefined) {
            expect(result.confluence.score).to.equal(expectedScore);
        }

        if (expectedMinScore !== undefined) {
            expect(result.confluence.score).to.be.greaterThanOrEqual(expectedMinScore);
        }

        if (expectedMaxScore !== undefined) {
            expect(result.confluence.score).to.be.lessThanOrEqual(expectedMaxScore);
        }

        if (expectedHits) {
            expectedHits.forEach(hit => {
                expect(result.confluence.hits.some(h => h.includes(hit))).to.be.true;
            });
        }

        // Validate data integrity
        expect(confluenceTestHelpers.validateConfluenceData(result.confluence)).to.be.true;
    },

    /**
     * Debug confluence calculation
     */
    debugConfluenceCalculation: (testData, result) => {
        console.log('=== Confluence Debug ===');
        console.log('Test Data:', {
            ticker: testData.ticker,
            lastClose: testData.lastClose,
            indicators: testData.indicators,
            support: testData.support
        });
        console.log('Result:', result.confluence);
        console.log('Expected vs Actual Score:');

        const validation = confluenceTestHelpers.validateAllRules(testData, result.confluence.hits);
        console.log('Rule Validation:', validation);
        console.log('========================');
    }
};

module.exports = confluenceTestHelpers;