# IDX Signal V2 - Modular

[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org)
[![Mocha](https://img.shields.io/badge/Mocha-10.2+-blue.svg)](https://mochajs.org)
[![Test Coverage](https://img.shields.io/badge/Coverage-95%25+-brightgreen.svg)](#testing)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📊 About the Project

IDX Signal V2 is a modular stock trading signal system that uses multi-indicator technical analysis to generate high-quality trading signals for the Indonesia Stock Exchange (IDX).

### 🎯 Core Components

- **Support/Resistance Detection** using Pivot Points
- **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands, ATR, StochRSI
- **Confluence Scoring** based on multiple confirmations
- **Entry/Exit Calculator** with risk/reward optimization
- **Backtest Engine** for historical validation
- **Position Sizing** & Risk Management
- **Action Recommendation Engine**

## 🏗️ Modular Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Raw Stock Data  │───▶│ Parse & Slice    │───▶│ Data Validation │
│ (Database)      │    │                  │    │ & Preprocessing │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Technical       │───▶│ Pivot Points &   │───▶│ Confluence      │
│ Indicators      │    │ S/R Detection    │    │ Score Calculator│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Entry/Exit      │───▶│ Backtest Engine  │───▶│ Position Sizing │
│ Calculator      │    │                  │    │ & Risk Mgmt     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Action          │───▶│ Trading Signals  │───▶│ Google Sheets   │
│ Recommendation  │    │ (JSON Output)    │    │ (N8N Integration)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🧪 Testing Framework

### Test Structure

```
test/
├── nodes/                           # Unit tests for each node
│   ├── parse_and_slice.test.js           # Data parsing tests
│   ├── 1_data_validation_and_preprocessing.test.js
│   ├── 2_technical_indicators_calculator.test.js
│   ├── 3_pivot_points_support_resistance_detection.test.js
│   ├── 4_confluence_score_calculator.test.js
│   ├── 5_entry_exit_calculator.test.js      # ✨ NEW
│   ├── 6_backtest_engine.test.js            # ✨ NEW
│   ├── 7_position_sizing_risk_management.test.js
│   └── 8_action_recommendation_engine.test.js
└── mock-data-test-case/             # Mock data generators
    ├── all_nodes_common.js              # Common utilities
    ├── parse_and_slice.js
    ├── 1_data_validation_and_preprocessing.test.js
    ├── 2_technical_indicators_calculator.test.js
    ├── 3_pivot_points_support_resistance_detection.test.js
    ├── 4_confluence_score_calculator.test.js
    ├── 5_entry_exit_calculator.test.js           # ✨ NEW
    ├── 6_backtest_engine.test.js                 # ✨ NEW
    ├── 7_position_sizing_risk_management.test.js
    └── 8_action_recommendation_engine.test.js
```

### Test Commands

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:data              # Data processing tests
npm run test:indicators        # Technical indicators tests
npm run test:signals          # Signal generation tests
npm run test:strategy         # Strategy & risk management tests

# Run new entry/exit tests ✨
npm run test:entry-exit       # Entry/Exit calculator tests only
npm run test:backtest         # Backtest engine tests only
npm run test:core             # Both entry/exit & backtest tests

# Test pipeline components
npm run test:pipeline         # Full pipeline test sequence
npm run test:all-indicators   # All indicator-related tests

# Development & monitoring
npm run test:watch            # Watch mode for development
npm run test:coverage         # Generate coverage report
```

### Coverage Goals

- **Overall Coverage**: 95%+
- **Critical Path**: 100% (Entry/Exit, Backtest, Risk Management)
- **Edge Cases**: Comprehensive error handling
- **Performance**: Sub-second execution for standard datasets

## 📈 Entry/Exit Calculator Testing

### Test Categories

#### 1. **Entry Price Calculation**
```javascript
// High strength support (> 1.2) gets 0.5% adjustment
entry = support.price * 1.005

// Low strength support (≤ 1.2) uses direct price
entry = support.price
```

#### 2. **Stop Loss Calculation**
```javascript
const conservativeStop = entry - (atr14 * 1.5);
const supportStop = support.price - (support.price * 0.03);
const stop = Math.max(conservativeStop, supportStop);
```

#### 3. **Target Price Calculation**
```javascript
const atrTarget = entry + (atr14 * 2);
const resistanceTarget = resistance.price;
const target = Math.min(atrTarget, resistanceTarget);
```

#### 4. **Risk/Reward Validation**
```javascript
const riskReward = (target - entry) / (entry - stop);
// Minimum requirement: riskReward >= 1.8
```

#### 5. **Entry Strategy Classification**
| Gap Percentage | Strategy |
|----------------|----------|
| ≤ 1% | Immediate Entry (At Support) |
| ≤ 3% | Breakout Entry (Acceptable Gap) |
| ≤ 5% | Aggressive Entry (High Risk) |
| > 5% | Wait for Retest |

### Test Scenarios

```javascript
// Example test scenarios for Entry/Exit Calculator
const testScenarios = {
  valid_setup: 'Standard valid setup with good risk/reward',
  high_strength_support: 'Support strength > 1.2 gets entry adjustment',
  poor_risk_reward: 'R:R < 1.8 should be filtered out',
  large_entry_gap: 'Price far from entry tests strategy classification',
  optimal_setup: 'Perfect setup with excellent metrics'
};
```

## ⏮️ Backtest Engine Testing

### Backtest Logic

#### 1. **Trade Simulation**
```javascript
// Entry condition: candle.low <= entry * 1.005 (0.5% tolerance)
// Stop condition: candle.low <= stop
// Target condition: candle.high >= target
```

#### 2. **Historical Period**
```javascript
const recentPeriod = Math.min(candles.length - 20, 100);
const startIndex = Math.max(14, candles.length - recentPeriod);
// Skip first 14 candles, analyze recent 100 periods max
```

#### 3. **Filtering Criteria**
```javascript
// Minimum requirements
const minimumWinRate = 0.52;    // 52%
const minimumTrades = 5;        // At least 5 historical trades

// Bonus confluence scoring
if (winRate > 0.7 && totalTrades >= 8) bonusScore += 1;
if (riskReward > 2.5) bonusScore += 1;
```

### Test Scenarios

```javascript
const backtestScenarios = {
  high_win_rate: 'Win rate > 70% with bonus qualification',
  low_win_rate: 'Win rate < 52% should be filtered',
  insufficient_trades: 'Less than 5 trades should be rejected',
  excellent_performance: 'Very high metrics with double bonus',
  mixed_results: 'Realistic 60% win rate scenario'
};
```



## 🔗 N8N Integration

### Workflow Configuration

```json
{
  "name": "IDX Signal V2 Scheduler",
  "schedule": "0 7 * * 1",  // Every Monday 7 AM
  "parameters": {
    "intervalMonth": 4,
    "modalTersedia": 5000000,
    "scoreGreaterThan": 2,
    "MaxLoss": 100000
  }
}
```

### Output Format

```json
{
  "ticker": "BBCA",
  "lastDate": "2024-06-06",
  "entry": 8420,
  "stop": 8320,
  "target": 8650,
  "riskReward": 2.3,
  "backtestWinRate": 65.2,
  "confluenceScore": 4,
  "actionRecommendation": "BUY - Good setup",
  "entryStrategy": "Breakout Entry (Acceptable Gap)",
  "expectancy": "1,250,000"
}
```


## 🔄 Future Enhancements

### Planned Features

- [ ] **Machine Learning Integration**: ML-based confluence scoring
- [ ] **Real-time Data**: Live market data integration
- [ ] **Advanced Patterns**: Chart pattern recognition
- [ ] **Sector Analysis**: Industry-specific indicators
- [ ] **Risk Optimization**: Portfolio-level risk management
- [ ] **Mobile Alerts**: Push notifications for signals
- [ ] **API Integration**: RESTful API for external systems



---

**Happy Trading! 📈**