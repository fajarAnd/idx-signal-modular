// src/nodes/4_confluence_score_calculator.js
/**
 * Confluence Score Calculator Node
 * Calculates confluence score based on multiple technical factors
 */

//extract the function from N8N node
function confluenceScoreCalculator($input) {
    let confluenceResults = [];

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose, indicators, support, resistance } = item.json;

        let confluenceScore = 0;
        const hits = [];

        if (lastClose > indicators.sma20 && indicators.sma20 > indicators.sma50 && lastClose > indicators.ema21) {
            confluenceScore += 2;
            hits.push('Multi-timeframe bullish alignment');
        } else if (lastClose > indicators.sma50) {
            confluenceScore += 1;
            hits.push('Basic uptrend');
        }

        if (indicators.rsi < 40 && indicators.stochRsi < 0.3) {
            confluenceScore += 2;
            hits.push('Double oversold (RSI: ' + indicators.rsi.toFixed(1) + ', StochRSI: ' + (indicators.stochRsi*100).toFixed(1) + '%)');
        } else if (indicators.rsi < 45) {
            confluenceScore += 1;
            hits.push('RSI oversold (' + indicators.rsi.toFixed(1) + ')');
        }

        if (indicators.macd.macdLine > indicators.macd.signalLine && indicators.macd.histogram > 0) {
            confluenceScore += 1;
            hits.push('MACD bullish crossover');
        }

        if (lastClose <= indicators.bollingerBands.lower * 1.02) {
            confluenceScore += 1;
            hits.push('Near Bollinger lower band');
        }

        if (indicators.currentVolume > indicators.volSMA20 * 2 && indicators.volSMA5 > indicators.volSMA20 * 1.5) {
            confluenceScore += 2;
            hits.push('Sustained volume breakout');
        } else if (indicators.currentVolume > indicators.volSMA20 * 1.5) {
            confluenceScore += 1;
            hits.push('Volume spike detected');
        }

        if (support.tests >= 3 && support.age >= 10) {
            confluenceScore += 2;
            hits.push('Strong support (' + support.tests + ' tests, ' + support.age + ' periods old)');
        } else if (support.tests >= 2) {
            confluenceScore += 1;
            hits.push('Reliable support (' + support.tests + ' tests)');
        }

        const recent5 = candles.slice(-5).filter(c =>
            c && typeof c.close === 'number' && typeof c.open === 'number' &&
            typeof c.high === 'number' && typeof c.low === 'number'
        );

        const hasHammer = recent5.some(c => {
            const body = Math.abs(c.close - c.open);
            const lowerShadow = Math.min(c.open, c.close) - c.low;
            const upperShadow = c.high - Math.max(c.open, c.close);
            return lowerShadow > body * 2 && upperShadow < body * 0.5;
        });

        if (hasHammer) {
            confluenceScore += 1;
            hits.push('Hammer/Doji pattern detected');
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