// src/nodes/5_entry_exit_calculator.test.js
/**
 * Entry Exit Calculator Node
 * Calculates entry price, stop loss, target price and risk/reward ratios
 */

//extract the function from N8N node
function entryExitCalculator($input) {
    let entryExitResults = [];

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose, indicators, support, resistance, confluence } = item.json;

        const entry = support.strength > 1.2 ? support.price * 1.005 : support.price;

        const conservativeStop = entry - indicators.atr14 * 1.5;
        const supportStop = support.price - (support.price * 0.03);
        const stop = Math.max(conservativeStop, supportStop);

        const target1 = entry + (indicators.atr14 * 2);
        const target2 = resistance.price;
        const target = Math.min(target1, target2);

        const entryGapPercent = +(((lastClose - entry) / entry) * 100).toFixed(2);
        const riskLot = entry - stop;
        const rewardLot = target - entry;

        if (riskLot <= 0 || rewardLot <= 0) continue;

        const riskReward = rewardLot / riskLot;

        if (riskReward < 1.8) continue;

        let entryStrategy = 'Wait for Pullback';
        if (entryGapPercent <= 1) {
            entryStrategy = 'Immediate Entry (At Support)';
        } else if (entryGapPercent <= 3) {
            entryStrategy = 'Breakout Entry (Acceptable Gap)';
        } else if (entryGapPercent <= 5) {
            entryStrategy = 'Aggressive Entry (High Risk)';
        } else {
            entryStrategy = 'Wait for Retest';
        }

        entryExitResults.push({
            json: {
                ticker,
                lastDate,
                candles,
                lastClose,
                indicators,
                support,
                resistance,
                confluence,
                entryExit: {
                    entry: +entry.toFixed(0),
                    stop: +stop.toFixed(0),
                    target: +target.toFixed(0),
                    riskReward: +riskReward.toFixed(2),
                    entryGapPercent,
                    riskLot,
                    rewardLot,
                    entryStrategy
                }
            }
        });
    }

    return entryExitResults;
}

module.exports = entryExitCalculator;