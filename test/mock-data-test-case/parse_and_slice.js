// test/mock-data-test-case/parse_and_slice.js
/**
 * Mock data and test cases for Parse and Slice node
 */

// Mock stock codes data
const mockStockCodes = [
    { code: 'BBCA' },
    { code: 'BMRI' },
    { code: 'BBNI' },
    { code: 'BBRI' },
    { code: 'TLKM' }
];

// Generate mock candles data
const generateMockCandles = (count = 100, startDate = '2024-01-01') => {
    const candles = [];
    let currentDate = new Date(startDate);
    let basePrice = 1000 + Math.random() * 4000; // Random base price between 1000-5000

    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * 0.1; // Random change ±5%
        const open = basePrice;
        const close = open * (1 + change);
        const high = Math.max(open, close) * (1 + Math.random() * 0.05);
        const low = Math.min(open, close) * (1 - Math.random() * 0.05);
        const volume = Math.floor(1000000 + Math.random() * 9000000);

        candles.push({
            date: currentDate.toISOString().substring(0, 10),
            open: Math.round(open),
            high: Math.round(high),
            low: Math.round(low),
            close: Math.round(close),
            volume
        });

        basePrice = close;
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return candles;
};

// Mock raw stock history data (from database)
const mockRawStockHistory = mockStockCodes.flatMap(stock =>
    generateMockCandles(100).map(candle => ({
        ...candle,
        code: stock.code
    }))
);

// Test scenarios for parse and slice
const testScenarios = {
    normal: {
        name: 'Normal Case',
        description: 'Valid data with multiple stocks',
        data: mockRawStockHistory,
        expectedPass: true,
        expectedStockCount: 5
    },

    empty: {
        name: 'Empty Input',
        description: 'Empty array input',
        data: [],
        expectedPass: true,
        expectedStockCount: 0
    },

    singleStock: {
        name: 'Single Stock',
        description: 'Data for only one stock',
        data: mockRawStockHistory.filter(item => item.code === 'BBCA'),
        expectedPass: true,
        expectedStockCount: 1
    },

    mixedData: {
        name: 'Mixed Valid/Invalid',
        description: 'Mix of valid data with some corrupted entries',
        data: [
            ...mockRawStockHistory.slice(0, 50),
            { code: 'INVALID', date: 'bad-date', open: 'invalid', high: null, low: undefined, close: NaN, volume: 'abc' },
            ...mockRawStockHistory.slice(50, 100)
        ],
        expectedPass: true,
        expectedStockCount: 2 // Only valid stocks should remain
    },

    duplicateEntries: {
        name: 'Duplicate Entries',
        description: 'Same stock code with duplicate date entries',
        data: [
            { code: 'TEST', date: '2024-01-01', open: 100, high: 110, low: 95, close: 105, volume: 1000000 },
            { code: 'TEST', date: '2024-01-01', open: 105, high: 115, low: 100, close: 108, volume: 1500000 }, // Duplicate
            { code: 'TEST', date: '2024-01-02', open: 108, high: 118, low: 103, close: 112, volume: 1200000 }
        ],
        expectedPass: true,
        expectedStockCount: 1
    }
};

// Mock $input.all() function simulator
const createMockInput = (data) => ({
    all: () => data.map(item => ({ json: item }))
});

module.exports = {
    mockStockCodes,
    generateMockCandles,
    mockRawStockHistory,
    testScenarios,
    createMockInput
};