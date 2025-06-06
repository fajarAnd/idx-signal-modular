// src/nodes/6_backtest_engine.test.js
/**
 * Backtest Engine Node
 * Runs historical backtesting to validate trading signals
 */

//extract the function from N8N node
function backtestEngine($input) {
    let backtestResults = [];

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose, indicators, support, resistance, confluence, entryExit } = item.json;

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

        if (total === 0) continue;

        const winRateDec = wins / total;

        if (winRateDec < 0.52) continue;
        if (total < 5) continue;

        const backtestWinRate = +(winRateDec * 100).toFixed(1);

        let bonusConfluence = 0;
        if (winRateDec > 0.7 && total >= 8) bonusConfluence++;
        if (entryExit.riskReward > 2.5) bonusConfluence++;

        backtestResults.push({
            json: {
                ticker,
                lastDate,
                candles,
                lastClose,
                indicators,
                support,
                resistance,
                confluence: {
                    ...confluence,
                    score: confluence.score + bonusConfluence
                },
                entryExit,
                backtest: {
                    wins,
                    losses,
                    total,
                    winRateDec,
                    backtestWinRate
                }
            }
        });
    }

    return backtestResults;
}

module.exports = backtestEngine;