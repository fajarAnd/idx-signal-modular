// src/nodes/1_data_validation_and_preprocessing.test.js
/**
 * Data Validation & Preprocessing Node
 * Validates data quality and filters out invalid stocks
 */

//extract the function from N8N node
function dataValidationAndPreprocessing($input) {
    let processedData = [];

    for (const item of $input.all()) {
        const { ticker, candles, lastDate } = item.json;

        if (!candles || !Array.isArray(candles) || candles.length < 50) {
            continue;
        }

        const validCandles = candles.filter(c =>
            c &&
            typeof c.close === 'number' && !isNaN(c.close) &&
            typeof c.open === 'number' && !isNaN(c.open) &&
            typeof c.high === 'number' && !isNaN(c.high) &&
            typeof c.low === 'number' && !isNaN(c.low) &&
            typeof c.volume === 'number' && !isNaN(c.volume)
        );

        if (validCandles.length < candles.length * 0.9) {
            continue;
        }

        if (!candles || candles.length === 0 || !candles[candles.length - 1] ||
            typeof candles[candles.length - 1].close !== 'number') {
            continue;
        }

        const lastClose = candles[candles.length - 1].close;

        processedData.push({
            json: {
                ticker,
                lastDate,
                candles: validCandles,
                lastClose,
                isValid: true
            }
        });
    }

    return processedData;
}

module.exports = dataValidationAndPreprocessing;