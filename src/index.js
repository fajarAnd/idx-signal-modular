// src/index.js
/**
 * IDX Signal V2 - Main Pipeline Runner
 * Orchestrates the complete trading signal generation workflow
 */

const parseAndSlice = require('./nodes/parse_and_slice');
const dataValidation = require('./nodes/1_data_validation_and_preprocessing');
const technicalIndicators = require('./nodes/2_technical_indicators_calculator');
const pivotPoints = require('./nodes/3_pivot_points_support_resistance_detection');
const confluenceScore = require('./nodes/4_confluence_score_calculator');
const entryExit = require('./nodes/5_entry_exit_calculator');
const backtestEngine = require('./nodes/6_backtest_engine');
const positionSizing = require('./nodes/7_position_sizing_risk_management');
const actionRecommendation = require('./nodes/8_action_recommendation_engine');

/**
 * Mock $() function to simulate N8N node access
 * @param {string} nodeName - Name of the node to access
 * @returns {Object} Mock node data
 */
function createMockNodeAccess(triggerData) {
    return function $(nodeName) {
        return {
            first: () => ({ json: triggerData })
        };
    };
}

/**
 * Mock $input object to simulate N8N input
 * @param {Array} data - Array of data items
 * @returns {Object} Mock input object
 */
function createMockInput(data) {
    return {
        all: () => data.map(item => ({ json: item }))
    };
}

/**
 * Main pipeline execution function
 * @param {Array} rawStockData - Raw stock history data from database
 * @param {Object} triggerConfig - Configuration from Schedule Trigger
 * @returns {Array} Final trading recommendations
 */
async function runSignalPipeline(rawStockData, triggerConfig = {}) {
    try {
        console.log('🚀 Starting IDX Signal V2 Pipeline...');
        console.log(`📊 Processing ${rawStockData.length} raw stock records`);

        // Mock node access function
        const $ = createMockNodeAccess(triggerConfig);

        // Step 1: Parse and Slice - Group and sort stock data
        console.log('📝 Step 1: Parse and Slice');
        const parsedInput = createMockInput(rawStockData);
        const parsedResults = parseAndSlice(parsedInput);
        console.log(`✅ Grouped into ${parsedResults.length} stocks`);

        if (parsedResults.length === 0) {
            console.log('❌ No stocks to process after parsing');
            return [];
        }

        // Step 2: Data Validation and Preprocessing
        console.log('🔍 Step 2: Data Validation and Preprocessing');
        const validationInput = createMockInput(parsedResults.map(r => r.json));
        const validatedResults = dataValidation(validationInput);
        console.log(`✅ ${validatedResults.length} stocks passed validation`);

        if (validatedResults.length === 0) {
            console.log('❌ No stocks passed validation');
            return [];
        }

        // Step 3: Technical Indicators Calculator
        console.log('📈 Step 3: Technical Indicators Calculator');
        const indicatorsInput = createMockInput(validatedResults.map(r => r.json));
        const indicatorResults = technicalIndicators(indicatorsInput);
        console.log(`✅ Calculated indicators for ${indicatorResults.length} stocks`);

        // Step 4: Pivot Points & Support/Resistance Detection
        console.log('📍 Step 4: Pivot Points & Support/Resistance Detection');
        const pivotInput = createMockInput(indicatorResults.map(r => r.json));
        const pivotResults = pivotPoints(pivotInput);
        console.log(`✅ Detected support/resistance for ${pivotResults.length} stocks`);

        if (pivotResults.length === 0) {
            console.log('❌ No stocks with valid support/resistance levels');
            return [];
        }

        // Step 5: Confluence Score Calculator
        console.log('🎯 Step 5: Confluence Score Calculator');
        const confluenceInput = createMockInput(pivotResults.map(r => r.json));
        const confluenceResults = confluenceScore(confluenceInput);
        console.log(`✅ Calculated confluence scores for ${confluenceResults.length} stocks`);

        // Step 6: Entry Exit Calculator
        console.log('💰 Step 6: Entry Exit Calculator');
        const entryExitInput = createMockInput(confluenceResults.map(r => r.json));
        const entryExitResults = entryExit(entryExitInput);
        console.log(`✅ Calculated entry/exit levels for ${entryExitResults.length} stocks`);

        if (entryExitResults.length === 0) {
            console.log('❌ No stocks with valid entry/exit levels');
            return [];
        }

        // Step 7: Backtest Engine
        console.log('⏮️  Step 7: Backtest Engine');
        const backtestInput = createMockInput(entryExitResults.map(r => r.json));
        const backtestResults = backtestEngine(backtestInput);
        console.log(`✅ Backtested ${backtestResults.length} stocks`);

        if (backtestResults.length === 0) {
            console.log('❌ No stocks passed backtest criteria');
            return [];
        }

        // Step 8: Position Sizing & Risk Management
        console.log('⚖️  Step 8: Position Sizing & Risk Management');
        const positionInput = createMockInput(backtestResults.map(r => r.json));
        const positionResults = positionSizing(positionInput, $);
        console.log(`✅ Calculated position sizing for ${positionResults.length} stocks`);

        // Step 9: Action Recommendation Engine
        console.log('🎯 Step 9: Action Recommendation Engine');
        const recommendationInput = createMockInput(positionResults.map(r => r.json));
        const finalResults = actionRecommendation(recommendationInput, $);
        console.log(`✅ Generated recommendations for ${finalResults.length} stocks`);

        // Summary
        console.log('\n📋 Pipeline Summary:');
        console.log(`📊 Input: ${rawStockData.length} raw records`);
        console.log(`🔍 Validated: ${validatedResults.length} stocks`);
        console.log(`📈 With Indicators: ${indicatorResults.length} stocks`);
        console.log(`📍 With S/R Levels: ${pivotResults.length} stocks`);
        console.log(`💰 With Entry/Exit: ${entryExitResults.length} stocks`);
        console.log(`⏮️  Backtested: ${backtestResults.length} stocks`);
        console.log(`🎯 Final Recommendations: ${finalResults.length} stocks`);

        console.log('\n🎉 Pipeline completed successfully!');
        return finalResults.map(r => r.json);

    } catch (error) {
        console.error('❌ Pipeline execution failed:', error);
        throw error;
    }
}

/**
 * Example usage and testing
 */
async function runExample() {
    // Sample raw stock data (simulating database query results)
    const sampleRawData = [
        { code: 'BBCA', date: '2024-01-01', open: 8000, high: 8200, low: 7900, close: 8100, volume: 5000000 },
        { code: 'BBCA', date: '2024-01-02', open: 8100, high: 8300, low: 8000, close: 8200, volume: 4500000 },
        // Add more sample data as needed...
    ];

    // Sample trigger configuration
    const triggerConfig = {
        intervalMonth: 4,
        modalTersedia: 5000000,
        scoreGreaterThan: 2,
        MaxLoss: 100000
    };

    try {
        const results = await runSignalPipeline(sampleRawData, triggerConfig);
        console.log('\n📊 Final Results:', results);
    } catch (error) {
        console.error('Pipeline failed:', error);
    }
}

// Export functions for use in other modules
module.exports = {
    runSignalPipeline,
    createMockInput,
    createMockNodeAccess
};

// Run example if this file is executed directly
if (require.main === module) {
    runExample();
}