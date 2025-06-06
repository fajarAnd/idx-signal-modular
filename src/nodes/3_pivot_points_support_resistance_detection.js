// src/nodes/3_pivot_points_support_resistance_detection.js
/**
 * Pivot Points & Support/Resistance Detection Node
 * Detects pivot points and identifies key support/resistance levels
 */

//extract the function from N8N node
function pivotPointsSupportResistanceDetection($input) {
    let pivotResults = [];

    const cluster = (arr, threshold = 0.015) => {
        arr.sort((a, b) => a.price - b.price);
        return arr.reduce((out, current) => {
            if (!out.length) {
                out.push(current);
            } else {
                const lastCluster = out[out.length - 1];
                if (Math.abs(current.price / lastCluster.price - 1) <= threshold) {
                    if (current.strength > lastCluster.strength) {
                        out[out.length - 1] = current;
                    }
                } else {
                    out.push(current);
                }
            }
            return out;
        }, []);
    };

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose, indicators } = item.json;

        const lookback = 5;
        const pivots = [];

        if (!candles || candles.length < lookback * 2 + 1) continue;

        for (let i = lookback; i < candles.length - lookback; i++) {
            const slice = candles.slice(i - lookback, i + lookback + 1);

            const validSlice = slice.filter(c => c && typeof c.high === 'number' && typeof c.low === 'number' && typeof c.volume === 'number');
            if (validSlice.length !== slice.length) continue;

            const hiMax = Math.max(...slice.map(c => c.high));
            const loMin = Math.min(...slice.map(c => c.low));

            const avgVolume = slice.reduce((sum, c) => sum + c.volume, 0) / slice.length;
            const volumeWeight = avgVolume > 0 ? candles[i].volume / avgVolume : 1;

            if (candles[i].high === hiMax) {
                pivots.push({
                    type: 'R',
                    price: candles[i].high,
                    strength: volumeWeight,
                    index: i
                });
            }
            if (candles[i].low === loMin) {
                pivots.push({
                    type: 'S',
                    price: candles[i].low,
                    strength: volumeWeight,
                    index: i
                });
            }
        }

        const supArr = cluster(pivots.filter(p => p.type === 'S'));
        const resArr = cluster(pivots.filter(p => p.type === 'R'));

        const support = supArr.filter(s => s.price < lastClose).at(-1);
        const resistance = resArr.find(r => r.price > lastClose);

        if (!support || !resistance) continue;

        const supportAge = candles.length - support.index;
        const supportTests = supArr.filter(s =>
            Math.abs(s.price - support.price) / support.price <= 0.02
        ).length;

        pivotResults.push({
            json: {
                ticker,
                lastDate,
                candles,
                lastClose,
                indicators,
                support: {
                    ...support,
                    age: supportAge,
                    tests: supportTests
                },
                resistance,
                pivots: {
                    all: pivots,
                    supports: supArr,
                    resistances: resArr
                }
            }
        });
    }

    return pivotResults;
}

module.exports = pivotPointsSupportResistanceDetection;