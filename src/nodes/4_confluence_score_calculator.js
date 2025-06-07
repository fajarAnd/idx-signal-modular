// src/nodes/4_confluence_score_calculator.js
/**
 * Confluence Score Calculator Node
 * Calculates confluence score based on multiple technical factors
 */

function confluenceScoreCalculator($input) {
    let confluenceResults = [];

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose, indicators, support, resistance } = item.json;

        let confluenceScore = 0;
        const hits = [];

        // Handle missing indicators object
        if (!indicators) {
            confluenceResults.push({
                json: {
                    ticker,
                    lastDate,
                    candles,
                    lastClose,
                    indicators: {},
                    support,
                    resistance,
                    confluence: {
                        score: 0,
                        hits: []
                    }
                }
            });
            continue;
        }

        // Trend Analysis with comprehensive null checking
        const sma20 = indicators.sma20;
        const sma50 = indicators.sma50;
        const ema21 = indicators.ema21;

        if (typeof sma20 === 'number' && typeof sma50 === 'number' && typeof ema21 === 'number' &&
            typeof lastClose === 'number') {
            if (lastClose > sma20 && sma20 > sma50 && lastClose > ema21) {
                confluenceScore += 2;
                hits.push('Multi-timeframe bullish alignment');
            } else if (lastClose > sma50) {
                confluenceScore += 1;
                hits.push('Basic uptrend');
            }
        }

        // RSI and StochRSI Analysis - Fixed boundary conditions
        const rsi = indicators.rsi;
        const stochRsi = indicators.stochRsi;

        if (typeof rsi === 'number' && !isNaN(rsi)) {
            if (typeof stochRsi === 'number' && !isNaN(stochRsi) && rsi < 40 && stochRsi < 0.3) {
                confluenceScore += 2;
                hits.push('Double oversold (RSI: ' + rsi.toFixed(1) + ', StochRSI: ' + (stochRsi * 100).toFixed(1) + '%)');
            } else if (rsi < 45) {
                confluenceScore += 1;
                hits.push('RSI oversold (' + rsi.toFixed(1) + ')');
            }
        }

        // MACD Analysis with comprehensive null checking
        const macd = indicators.macd;
        if (macd && typeof macd === 'object' &&
            typeof macd.macdLine === 'number' && !isNaN(macd.macdLine) &&
            typeof macd.signalLine === 'number' && !isNaN(macd.signalLine) &&
            typeof macd.histogram === 'number' && !isNaN(macd.histogram)) {
            if (macd.macdLine > macd.signalLine && macd.histogram > 0) {
                confluenceScore += 1;
                hits.push('MACD bullish crossover');
            }
        }

        // Bollinger Bands Analysis with null checking
        const bollingerBands = indicators.bollingerBands;
        if (bollingerBands && typeof bollingerBands === 'object' &&
            typeof bollingerBands.lower === 'number' && !isNaN(bollingerBands.lower) &&
            typeof lastClose === 'number') {
            if (lastClose <= bollingerBands.lower * 1.02) {
                confluenceScore += 1;
                hits.push('Near Bollinger lower band');
            }
        }

        // Volume Analysis - Fixed threshold validation
        const currentVolume = indicators.currentVolume;
        const volSMA20 = indicators.volSMA20;
        const volSMA5 = indicators.volSMA5;

        if (typeof currentVolume === 'number' && !isNaN(currentVolume) &&
            typeof volSMA20 === 'number' && !isNaN(volSMA20) && volSMA20 > 0 &&
            typeof volSMA5 === 'number' && !isNaN(volSMA5)) {

            // Check for sustained volume breakout first (higher priority)
            if (currentVolume > volSMA20 * 2 && volSMA5 > volSMA20 * 1.5) {
                confluenceScore += 2;
                hits.push('Sustained volume breakout');
            } else if (currentVolume > volSMA20 * 1.5) {
                confluenceScore += 1;
                hits.push('Volume spike detected');
            }
        }

        // Support Quality Analysis with null checking
        if (support && typeof support === 'object' &&
            typeof support.tests === 'number' && !isNaN(support.tests) &&
            typeof support.age === 'number' && !isNaN(support.age)) {
            if (support.tests >= 3 && support.age >= 10) {
                confluenceScore += 2;
                hits.push('Strong support (' + support.tests + ' tests, ' + support.age + ' periods old)');
            } else if (support.tests >= 2) {
                confluenceScore += 1;
                hits.push('Reliable support (' + support.tests + ' tests)');
            }
        }

        // Candlestick Pattern Detection
        if (candles && Array.isArray(candles) && candles.length >= 5) {
            const recent5 = candles.slice(-5).filter(c =>
                c && typeof c === 'object' &&
                typeof c.close === 'number' && !isNaN(c.close) &&
                typeof c.open === 'number' && !isNaN(c.open) &&
                typeof c.high === 'number' && !isNaN(c.high) &&
                typeof c.low === 'number' && !isNaN(c.low)
            );

            if (recent5.length > 0) {
                const hasHammer = recent5.some(c => {
                    const body = Math.abs(c.close - c.open);
                    const lowerShadow = Math.min(c.open, c.close) - c.low;
                    const upperShadow = c.high - Math.max(c.open, c.close);

                    // Enhanced hammer detection: ensure body > 0 and proper ratios
                    const isHammer = body > 0 && lowerShadow > body * 2 && upperShadow <= body * 1.0;

                    // Enhanced doji detection: body very small relative to range
                    const totalRange = c.high - c.low;
                    const isDoji = totalRange > 0 && body / totalRange < 0.05;

                    return isHammer || isDoji;
                });

                if (hasHammer) {
                    confluenceScore += 1;
                    hits.push('Hammer/Doji pattern detected');
                }
            }
        }

        confluenceResults.push({
            json: {
                ticker,
                lastDate,
                candles,
                lastClose,
                indicators,
                support,
                resistance,
                confluence: {
                    score: confluenceScore,
                    hits: hits
                }
            }
        });
    }

    return confluenceResults;
}

module.exports = confluenceScoreCalculator;