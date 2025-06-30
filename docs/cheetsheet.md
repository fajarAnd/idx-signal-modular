# IDX Signal V2 - Cheat Sheet 📊

## 🎯 **Sistem Overview**
Sistem rekomendasi saham berbasis **analisis teknikal otomatis** untuk IDX dengan 8 tahap pemrosesan data.

---

## 📈 **Technical Indicators**

### RSI (Relative Strength Index)
- **Formula**: `100 - 100/(1+rs)` dimana `rs = avgGain/avgLoss`
- **Period**: 14 candles
- **Sinyal**:
    - `< 40` = Double Oversold (skor +2)
    - `< 45` = RSI Oversold (skor +1)

### MACD
- **Formula**: `EMA12 - EMA26`
- **Sinyal**: `macdLine > signalLine && histogram > 0` = Bullish crossover (+1)

### Volume Analysis
- **Sustained Breakout**: `volume > volSMA20 * 2 AND volSMA5 > volSMA20 * 1.5` (+2)
- **Volume Spike**: `volume > volSMA20 * 1.5` (+1)

---

## 🎯 **Entry Calculation**

### Entry Price
```javascript
entry = support.strength > 1.2 
    ? support.price * 1.005  // +0.5% adjustment untuk strong support
    : support.price          // Langsung di support price
```

### Entry Gap Strategy
| Gap % | Strategy |
|-------|----------|
| ≤ 1% | **Immediate Entry** (At Support) |
| ≤ 3% | **Breakout Entry** (Acceptable Gap) |
| ≤ 5% | **Aggressive Entry** (High Risk) |
| > 5% | **Wait for Retest** |

---

## 🛑 **Stop Loss Calculation**

### Dual Stop Method
```javascript
conservativeStop = entry - (atr14 * 1.5)
supportStop = support.price - (support.price * 0.03)  // 3% below support
stop = Math.max(conservativeStop, supportStop)        // Pilih yang lebih tinggi
```

**Logika**: Gunakan stop yang lebih **konservatif** untuk perlindungan maksimal.

---

## 🎯 **Target Calculation**

### Dual Target Method
```javascript
target1 = entry + (atr14 * 2)    // ATR-based target (2x volatility)
target2 = resistance.price       // Resistance level
target = Math.min(target1, target2)  // Pilih yang lebih rendah (realistis)
```

---

## ⚖️ **Risk/Reward Filter**

### Minimum R:R Requirement
```javascript
riskLot = entry - stop
rewardLot = target - entry
riskReward = rewardLot / riskLot

// Filter: riskReward >= 1.8 (minimum 1:1.8)
```

---

## 🔄 **Backtesting Engine**

### Win Rate Calculation
```javascript
// Test period: Recent 100 candles (skip first 14)
for (candle in recentPeriod) {
    if (candle.low <= entry * 1.005) {  // Entry triggered (0.5% tolerance)
        total++
        // Check next candles for target/stop hit
        if (nextCandle.high >= target) wins++
        if (nextCandle.low <= stop) losses++
    }
}

winRate = (wins / total) * 100
```

### Filter Criteria
- **Minimum Trades**: 5 trades
- **Minimum Win Rate**: 52%

### Bonus System
- **High Performance**: Win rate > 70% + trades ≥ 8 → +1 confluence
- **High R:R**: Risk/Reward > 2.5 → +1 confluence

---

## 🏦 **Position Sizing**

### Quantity Calculation
```javascript
qtyRisk = Math.floor(MaxLoss / riskLot)           // Risk-based limit
qtyFunds = Math.floor(Capital / (entry * 100))    // Capital-based limit
qty = Math.max(1, Math.min(qtyRisk, qtyFunds))    // Take smaller, min 1
```

### Nominal Calculations
```javascript
nominalLoss = qty * 100 * riskLot
nominalProfit = qty * 100 * rewardLot
expectancy = winRate * nominalProfit - (1 - winRate) * nominalLoss
```

---

## 🎯 **Confluence Scoring**

| Signal | Condition | Score |
|--------|-----------|-------|
| **Multi-timeframe Bullish** | `lastClose > sma20 > sma50 && lastClose > ema21` | +2 |
| **Basic Uptrend** | `lastClose > sma50` | +1 |
| **Double Oversold** | `rsi < 40 && stochRsi < 0.3` | +2 |
| **RSI Oversold** | `rsi < 45` | +1 |
| **MACD Bullish** | `macdLine > signalLine && histogram > 0` | +1 |
| **Near Bollinger Lower** | `lastClose ≤ lowerBand * 1.02` | +1 |
| **Sustained Volume** | `volume > sma20 * 2 && sma5 > sma20 * 1.5` | +2 |
| **Volume Spike** | `volume > sma20 * 1.5` | +1 |
| **Strong Support** | `tests ≥ 3 && age ≥ 10` | +2 |
| **Reliable Support** | `tests ≥ 2` | +1 |
| **Hammer/Doji Pattern** | Candlestick analysis | +1 |

---

## 📊 **Action Recommendations**

| Criteria | Recommendation |
|----------|----------------|
| Win Rate ≥ 70% + Score ≥ 5 + R:R ≥ 2.0 | **STRONG BUY** - High confidence |
| Win Rate ≥ 65% + Score ≥ 4 | **BUY** - Good setup |
| Win Rate ≥ 58% + Score ≥ 3 | **CAUTIOUS BUY** - Partial position |
| Win Rate ≥ 52% + Score ≥ 2 | **WATCHLIST** - Wait for better entry |
| Below criteria | **AVOID** - Poor setup |

---

## 🔧 **Configuration Parameters**

### Default Settings
- **Modal Tersedia**: 5,000,000 IDR
- **Max Loss**: 100,000 IDR per trade
- **Score Threshold**: ≥ 2
- **Interval**: 4 months data
- **Lot Value**: 100 shares

### Market Phase Detection
```javascript
if (lastClose > sma20 && sma20 >= sma50) → "Uptrend"
if (lastClose < sma20 && sma20 <= sma50) → "Downtrend"
else → "Sideways"
```

---

## ⚠️ **Key Filters**

1. **Data Quality**: Min 50 candles, 90% valid data
2. **Support/Resistance**: Must have valid S/R pair
3. **Risk/Reward**: Minimum 1.8:1 ratio
4. **Backtest**: Min 5 trades, 52% win rate
5. **Confluence**: Score above threshold

---

## 📝 **Quick Formula Reference**

```javascript
// Entry Gap Percentage
entryGap = ((lastClose - entry) / entry) * 100

// Support Age
supportAge = totalCandles - supportIndex

// Resistance Distance
resistanceDistance = ((resistance - lastClose) / lastClose) * 100

// Expectancy
expectancy = (winRate * avgWin) - ((1 - winRate) * avgLoss)
```