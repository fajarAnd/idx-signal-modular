// src/nodes/parse_and_slice.js
/**
 * Parse and Slice Node
 * Groups stock data by code and sorts by date, extracts last date per stock
 */

//extract the function from N8N node
function parseAndSlice($input) {
    const rows = $input.all();
    if (!rows.length) return [];

    const grouped = {};
    for (const r of rows) {
        const { code } = r.json;
        (grouped[code] ??= []).push(r.json);
    }

    const result = Object.entries(grouped).map(([code, items]) => {
        const candles = items
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(({ date, open, high, low, close, volume }) => ({
                date, open, high, low, close, volume: +volume,
            }));

        const lastDateRaw = candles[candles.length - 1]?.date;
        let lastDate;
        if (lastDateRaw && !isNaN(new Date(lastDateRaw))) {
            lastDate = new Date(lastDateRaw).toISOString().substring(0, 10);
        } else {
            console.warn(`Invalid or missing lastDateRaw: "${lastDateRaw}". Using current date as fallback.`);
            lastDate = new Date().toISOString().substring(0, 10);
        }

        return { ticker: code, lastDate, candles };
    });

    return result;
}

module.exports = parseAndSlice;