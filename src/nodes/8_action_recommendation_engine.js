// src/nodes/8_action_recommendation_engine.test.js
/**
 * Action Recommendation Engine Node
 * Generates final trading recommendations based on all analysis
 */

//extract the function from N8N node
function actionRecommendationEngine($input, $) {
    let finalResults = [];

    const REQ_SCORE = $('Schedule Trigger').first().json.scoreGreaterThan || 2;

    for (const item of $input.all()) {
        const data = item.json;

        if (data.confluenceScore < REQ_SCORE) continue;

        let actionRecommendation = 'Manual review required';

        if (data.backtestWinRate >= 70 && data.confluenceScore >= 5 && data.riskReward >= 2.0) {
            actionRecommendation = 'STRONG BUY - High confidence';
        } else if (data.backtestWinRate >= 65 && data.confluenceScore >= 4) {
            actionRecommendation = 'BUY - Good setup';
        } else if (data.backtestWinRate >= 58 && data.confluenceScore >= 3) {
            actionRecommendation = 'CAUTIOUS BUY - Partial position';
        } else if (data.backtestWinRate >= 52 && data.confluenceScore >= 2) {
            actionRecommendation = 'WATCHLIST - Wait for better entry';
        } else {
            actionRecommendation = 'AVOID - Poor setup';
        }

        finalResults.push({
            json: {
                ...data,
                actionRecommendation
            }
        });
    }

    return finalResults;
}

module.exports = actionRecommendationEngine;