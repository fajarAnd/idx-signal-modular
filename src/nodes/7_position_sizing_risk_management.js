// src/nodes/7_position_sizing_risk_management.test.js
/**
 * Position Sizing & Risk Management Node
 * Calculates optimal position size based on risk management rules
 */

//extract the function from N8N node
function positionSizingRiskManagement($input, $) {
    let positionResults = [];

    const lotValue = 100;
    const MAX_LOSS = $('Schedule Trigger').first().json.MaxLoss || 100000;
    const CAPITAL = $('Schedule Trigger').first().json.modalTersedia || 5000000;

    for (const item of $input.all()) {
        const { ticker, lastDate, candles, lastClose, indicators, support, resistance, confluence, entryExit, backtest } = item.json;

        const qtyRisk = Math.floor(MAX_LOSS / entryExit.riskLot);
        const qtyFunds = Math.floor(CAPITAL / (entryExit.entry * lotValue));
        const qty = Math.max(1, Math.min(qtyRisk, qtyFunds));

        const nominalLoss = qty * lotValue * entryExit.riskLot;
        const nominalProfit = qty * lotValue * entryExit.rewardLot;
        const expectancyRp = Math.round(backtest.winRateDec * nominalProfit - (1 - backtest.winRateDec) * nominalLoss);
        const totalCost = qty * lotValue * entryExit.entry;

        const marketPhase = lastClose > indicators.sma20 && indicators.sma20 > indicators.sma50 ? 'Uptrend' :
            lastClose < indicators.sma20 && indicators.sma20 < indicators.sma50 ? 'Downtrend' : 'Sideways';

        positionResults.push({
            json: {
                ticker,
                lastDate,
                lastClose,
                entryGapPercent: entryExit.entryGapPercent,
                entry: entryExit.entry,
                stop: entryExit.stop,
                target: entryExit.target,
                riskReward: entryExit.riskReward,
                backtestWinRate: backtest.backtestWinRate,
                totalTrades: backtest.total,
                confluenceScore: confluence.score,
                qty,
                totalCost: totalCost.toLocaleString('id-ID'),
                nominalProfit: nominalProfit.toLocaleString('id-ID'),
                nominalLoss: nominalLoss.toLocaleString('id-ID'),
                expectancy: expectancyRp.toLocaleString('id-ID'),
                confluenceHits: confluence.hits.join(' | '),
                entryStrategy: entryExit.entryStrategy,
                supportStrength: support.strength.toFixed(2),
                resistanceDistance: +((resistance.price - lastClose) / lastClose * 100).toFixed(2),
                atr14: +indicators.atr14.toFixed(0),
                marketPhase
            }
        });
    }

    return positionResults;
}

module.exports = positionSizingRiskManagement;