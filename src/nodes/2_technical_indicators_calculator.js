// src/nodes/2_technical_indicators_calculator.js
/**
 * Technical Indicators Calculator Node
 * Calculates various technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, StochRSI
 * Enhanced version with improved error handling and edge case management
 */

function technicalIndicatorsCalculator($input) {
    let indicatorResults = [];

    const SMA = (arr, n, field = 'close') => {
        if (!arr || !Array.isArray(arr) || arr.length === 0 || n > arr.length) return 0;
        const slice = arr.slice(-n);
        let sum = 0, count = 0;
        for (let i = 0; i < slice.length; i++) {
            if (slice[i] && typeof slice[i][field] === 'number' && !isNaN(slice[i][field])) {
                sum += slice[i][field];
                count++;
            }
        }
        return count > 0 ? sum / count : 0;
    };

    const EMA = (arr, n, field = 'close') => {
        if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
        if (!arr[0] || typeof arr[0][field] !== 'number') return 0;

        const alpha = 2 / (n + 1);
        let ema = arr[0][field];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] && typeof arr[i][field] === 'number' && !isNaN(arr[i][field])) {
                ema = alpha * arr[i][field] + (1 - alpha) * ema;
            }
        }
        return ema;
    };

    const RSI = (arr, n = 14) => {
        if (!arr || !Array.isArray(arr) || arr.length < n + 1) return 50;

        let gains = 0, losses = 0, validPairs = 0;

        // Calculate over the last n periods
        for (let i = Math.max(0, arr.length - n - 1); i < arr.length - 1; i++) {
            if (arr[i] && arr[i + 1] &&
                typeof arr[i].close === 'number' && !isNaN(arr[i].close) &&
                typeof arr[i + 1].close === 'number' && !isNaN(arr[i + 1].close)) {

                const diff = arr[i + 1].close - arr[i].close;
                if (diff >= 0) {
                    gains += diff;
                } else {
                    losses += Math.abs(diff);
                }
                validPairs++;
            }
        }

        // Need at least some valid pairs to calculate RSI
        if (validPairs === 0) return 50;

        // Average gains and losses
        const avgGains = gains / validPairs;
        const avgLosses = losses / validPairs;

        // Prevent division by zero
        if (avgLosses === 0) return avgGains > 0 ? 100 : 50;

        const rs = avgGains / avgLosses;
        const rsi = 100 - (100 / (1 + rs));

        // Ensure RSI is within valid range
        return Math.max(0, Math.min(100, rsi));
    };

    const MACD = (arr) => {
        if (!arr || !Array.isArray(arr) || arr.length < 26) return { macdLine: 0, signalLine: 0, histogram: 0 };
        const ema12 = EMA(arr, 12);
        const ema26 = EMA(arr, 26);
        const macdLine = ema12 - ema26;
        const macdHistory = [];
        for (let i = 26; i < arr.length; i++) {
            const slice = arr.slice(0, i + 1);
            const e12 = EMA(slice, 12);
            const e26 = EMA(slice, 26);
            const macdValue = e12 - e26;
            if (!isNaN(macdValue)) {
                macdHistory.push(macdValue);
            }
        }
        if (macdHistory.length === 0) return { macdLine: 0, signalLine: 0, histogram: 0 };
        const macdForEMA = macdHistory.map(v => ({ close: v }));
        const signalLine = EMA(macdForEMA, 9);
        return { macdLine, signalLine, histogram: macdLine - signalLine };
    };

    const StochRSI = (arr, period = 14) => {
        if (!arr || !Array.isArray(arr) || arr.length < period * 2) return 0;
        const rsiValues = [];
        for (let i = period; i < arr.length; i++) {
            const slice = arr.slice(0, i + 1);
            const rsiValue = RSI(slice, period);
            if (!isNaN(rsiValue)) {
                rsiValues.push(rsiValue);
            }
        }
        if (rsiValues.length < period) return 0;
        const recentRSI = rsiValues.slice(-period);
        const minRSI = Math.min(...recentRSI);
        const maxRSI = Math.max(...recentRSI);
        const currentRSI = rsiValues[rsiValues.length - 1];
        return maxRSI !== minRSI ? (currentRSI - minRSI) / (maxRSI - minRSI) : 0;
    };

    const BollingerBands = (arr, period = 20, multiplier = 2) => {
        // Enhanced error handling for null/undefined arrays
        if (!arr || !Array.isArray(arr) || arr.length < period) {
            return {
                upper: 0,
                middle: 0,
                lower: 0
            };
        }

        const sma = SMA(arr, period);
        if (sma === 0) {
            return {
                upper: 0,
                middle: 0,
                lower: 0
            };
        }

        let variance = 0;
        let validCount = 0;

        // Calculate variance with proper bounds checking
        const startIndex = Math.max(0, arr.length - period);
        for (let i = startIndex; i < arr.length; i++) {
            if (arr[i] && typeof arr[i].close === 'number' && !isNaN(arr[i].close)) {
                variance += Math.pow(arr[i].close - sma, 2);
                validCount++;
            }
        }

        if (validCount === 0) {
            return {
                upper: sma,
                middle: sma,
                lower: sma
            };
        }

        const stdDev = Math.sqrt(variance / validCount);
        return {
            upper: sma + (stdDev * multiplier),
            middle: sma,
            lower: sma - (stdDev * multiplier)
        };
    };

    const ATR = (arr, period = 14) => {
        if (!arr || !Array.isArray(arr) || arr.length < 2) return 0;

        const tr = [];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] && arr[i - 1] &&
                typeof arr[i].high === 'number' && !isNaN(arr[i].high) &&
                typeof arr[i].low === 'number' && !isNaN(arr[i].low) &&
                typeof arr[i - 1].close === 'number' && !isNaN(arr[i - 1].close)) {
                const h = arr[i].high;
                const l = arr[i].low;
                const p = arr[i - 1].close;
                tr.push(Math.max(h - l, Math.abs(h - p), Math.abs(l - p)));
            }
        }
        if (tr.length < period) return 0;
        return tr.slice(-period).reduce((a, b) => a + b, 0) / period;
    };

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose } = item.json;

        // Enhanced validation for candles
        if (!candles || !Array.isArray(candles)) {
            indicatorResults.push({
                json: {
                    ticker,
                    lastDate,
                    candles: candles || [],
                    lastClose,
                    indicators: {
                        sma20: 0,
                        sma50: 0,
                        ema21: 0,
                        rsi: 50,
                        stochRsi: 0,
                        macd: { macdLine: 0, signalLine: 0, histogram: 0 },
                        bollingerBands: { upper: 0, middle: 0, lower: 0 },
                        atr14: 0,
                        atr21: 0,
                        volSMA20: 0,
                        volSMA5: 0,
                        currentVolume: 0
                    }
                }
            });
            continue;
        }

        const indicators = {
            sma20: SMA(candles, 20),
            sma50: SMA(candles, 50),
            ema21: EMA(candles, 21),
            rsi: RSI(candles, 14),
            stochRsi: StochRSI(candles, 14),
            macd: MACD(candles),
            bollingerBands: BollingerBands(candles, 20),
            atr14: ATR(candles, 14),
            atr21: ATR(candles, 21),
            volSMA20: SMA(candles, 20, 'volume'),
            volSMA5: SMA(candles, 5, 'volume'),
            currentVolume: (candles.length > 0 && candles[candles.length - 1] &&
                typeof candles[candles.length - 1].volume === 'number') ?
                candles[candles.length - 1].volume : 0
        };

        indicatorResults.push({
            json: {
                ticker,
                lastDate,
                candles,
                lastClose,
                indicators
            }
        });
    }

    return indicatorResults;
}

module.exports = technicalIndicatorsCalculator;