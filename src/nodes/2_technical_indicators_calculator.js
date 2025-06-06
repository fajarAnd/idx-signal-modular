// src/nodes/2_technical_indicators_calculator.test.js
/**
 * Technical Indicators Calculator Node
 * Calculates various technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, StochRSI
 */

//extract the function from N8N node
function technicalIndicatorsCalculator($input) {
    let indicatorResults = [];

    const SMA = (arr, n, field='close') => {
        if (!arr || arr.length === 0 || n > arr.length) return 0;
        const slice = arr.slice(-n);
        let sum = 0, count = 0;
        for (let i = 0; i < slice.length; i++) {
            if (slice[i] && typeof slice[i][field] === 'number') {
                sum += slice[i][field];
                count++;
            }
        }
        return count > 0 ? sum / count : 0;
    };

    const EMA = (arr, n, field='close') => {
        if (!arr || arr.length === 0) return 0;
        const alpha = 2 / (n + 1);
        let ema = arr[0][field];
        for (let i = 1; i < arr.length; i++) {
            ema = alpha * arr[i][field] + (1 - alpha) * ema;
        }
        return ema;
    };

    const RSI = (arr, n=14) => {
        if (!arr || arr.length < n + 1) return 50;
        let gains=0, losses=0;
        for (let i=arr.length-n;i<arr.length-1;i++){
            if (arr[i] && arr[i+1] && typeof arr[i].close === 'number' && typeof arr[i+1].close === 'number') {
                const diff = arr[i+1].close-arr[i].close;
                if (diff>=0) gains+=diff; else losses+=-diff;
            }
        }
        const rs = gains / (losses||1e-9);
        return 100 - 100/(1+rs);
    };

    const MACD = (arr) => {
        if (!arr || arr.length < 26) return { macdLine: 0, signalLine: 0, histogram: 0 };
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
        const macdForEMA = macdHistory.map(v => ({close: v}));
        const signalLine = EMA(macdForEMA, 9);
        return { macdLine, signalLine, histogram: macdLine - signalLine };
    };

    const StochRSI = (arr, period = 14) => {
        if (!arr || arr.length < period * 2) return 0;
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
        const sma = SMA(arr, period);
        let variance = 0;
        for (let i = arr.length - period; i < arr.length; i++) {
            variance += Math.pow(arr[i].close - sma, 2);
        }
        const stdDev = Math.sqrt(variance / period);
        return {
            upper: sma + (stdDev * multiplier),
            middle: sma,
            lower: sma - (stdDev * multiplier)
        };
    };

    const ATR = (arr, period = 14) => {
        const tr = [];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] && arr[i-1] &&
                typeof arr[i].high === 'number' && typeof arr[i].low === 'number' &&
                typeof arr[i-1].close === 'number') {
                const h = arr[i].high;
                const l = arr[i].low;
                const p = arr[i-1].close;
                tr.push(Math.max(h-l, Math.abs(h-p), Math.abs(l-p)));
            }
        }
        if (tr.length < period) return 0;
        return tr.slice(-period).reduce((a,b) => a+b, 0) / period;
    };

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose } = item.json;

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
            currentVolume: candles[candles.length - 1]?.volume || 0
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