// test/nodes/8_action_recommendation_engine.test.js
const { expect } = require('chai');
const actionRecommendationEngine = require('../../src/nodes/8_action_recommendation_engine');
const { actionRecommendationTestScenarios, actionRecommendationHelpers, createActionRecommendationTestData, triggerConfigTestVariations } = require('../mock-data-test-case/8_action_recommendation_engine');
const { createMockInput, createMockNodeAccess } = require('../mock-data-test-case/all_nodes_common');

describe('Action Recommendation Engine Node', () => {

    describe('Recommendation Logic', () => {
        it('should generate STRONG BUY for excellent metrics', () => {
            const testData = [actionRecommendationTestScenarios.strong_buy.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            expect(recommendation.actionRecommendation).to.equal('STRONG BUY - High confidence');
            expect(recommendation.backtestWinRate).to.be.greaterThanOrEqual(70);
            expect(recommendation.confluenceScore).to.be.greaterThanOrEqual(5);
            expect(recommendation.riskReward).to.be.greaterThanOrEqual(2.0);
        });

        it('should generate BUY for good metrics', () => {
            const testData = [actionRecommendationTestScenarios.good_buy.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            expect(recommendation.actionRecommendation).to.equal('BUY - Good setup');
            expect(recommendation.backtestWinRate).to.be.greaterThanOrEqual(65);
            expect(recommendation.confluenceScore).to.be.greaterThanOrEqual(4);
        });

        it('should generate CAUTIOUS BUY for moderate metrics', () => {
            const testData = [actionRecommendationTestScenarios.cautious_buy.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            expect(recommendation.actionRecommendation).to.equal('CAUTIOUS BUY - Partial position');
            expect(recommendation.backtestWinRate).to.be.greaterThanOrEqual(58);
            expect(recommendation.confluenceScore).to.be.greaterThanOrEqual(3);
        });

        it('should generate WATCHLIST for minimum metrics', () => {
            const testData = [actionRecommendationTestScenarios.watchlist.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            expect(recommendation.actionRecommendation).to.equal('WATCHLIST - Wait for better entry');
            expect(recommendation.backtestWinRate).to.be.greaterThanOrEqual(52);
            expect(recommendation.confluenceScore).to.be.greaterThanOrEqual(2);
        });
    });

    describe('Threshold Filtering', () => {
        it('should filter out stocks below confluence score threshold', () => {
            const testData = [actionRecommendationTestScenarios.below_threshold.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(0);
        });

        it('should pass stocks at exact threshold boundary', () => {
            const customData = createActionRecommendationTestData('good_buy');
            customData.confluenceScore = 2; // Exactly at threshold

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
        });

        it('should use default threshold when not specified', () => {
            const testData = [actionRecommendationTestScenarios.cautious_buy.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({}); // No threshold specified
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            // Should use default threshold of 2
            expect(result).to.have.lengthOf(1);
        });
    });

    describe('Boundary Condition Testing', () => {
        it('should test exact boundary conditions for each recommendation tier', () => {
            const boundaryTests = [
                { winRate: 70.0, score: 5, riskReward: 2.0, expected: 'STRONG BUY - High confidence' },
                { winRate: 69.9, score: 5, riskReward: 2.0, expected: 'BUY - Good setup' },
                { winRate: 65.0, score: 4, riskReward: 1.5, expected: 'BUY - Good setup' },
                { winRate: 64.9, score: 4, riskReward: 1.5, expected: 'CAUTIOUS BUY - Partial position' },
                { winRate: 58.0, score: 3, riskReward: 1.5, expected: 'CAUTIOUS BUY - Partial position' },
                { winRate: 57.9, score: 3, riskReward: 1.5, expected: 'WATCHLIST - Wait for better entry' },
                { winRate: 52.0, score: 2, riskReward: 1.5, expected: 'WATCHLIST - Wait for better entry' },
                { winRate: 51.9, score: 2, riskReward: 1.5, expected: 'AVOID - Poor setup' }
            ];

            boundaryTests.forEach(test => {
                const customData = createActionRecommendationTestData('edge_case_metrics');
                customData.backtestWinRate = test.winRate;
                customData.confluenceScore = test.score;
                customData.riskReward = test.riskReward;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
                const result = actionRecommendationEngine(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                expect(result[0].json.actionRecommendation).to.equal(test.expected);
            });
        });

        it('should handle edge cases with missing risk/reward for STRONG BUY', () => {
            const testScenarios = [
                { winRate: 70, score: 5, riskReward: 1.9, expected: 'BUY - Good setup' }, // R:R too low
                { winRate: 70, score: 4, riskReward: 2.0, expected: 'BUY - Good setup' }, // Score too low
                { winRate: 69, score: 5, riskReward: 2.0, expected: 'BUY - Good setup' }  // Win rate too low
            ];

            testScenarios.forEach(test => {
                const customData = createActionRecommendationTestData('excellent_metrics');
                customData.backtestWinRate = test.winRate;
                customData.confluenceScore = test.score;
                customData.riskReward = test.riskReward;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
                const result = actionRecommendationEngine(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                expect(result[0].json.actionRecommendation).to.equal(test.expected);
            });
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(actionRecommendationTestScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
                const result = actionRecommendationEngine(mockInput, mockNodeAccess);

                if (scenario.expectedPass) {
                    expect(result).to.have.lengthOf(1);
                    expect(actionRecommendationHelpers.validateActionRecommendationData(result[0].json)).to.be.true;

                    if (scenario.expectedRecommendation) {
                        expect(result[0].json.actionRecommendation).to.equal(scenario.expectedRecommendation);
                    }

                    // Check specific expectations
                    if (scenario.expectedMetrics) {
                        const metrics = scenario.expectedMetrics;
                        const recommendation = result[0].json;

                        Object.entries(metrics).forEach(([key, value]) => {
                            if (typeof value === 'number') {
                                expect(recommendation[key]).to.be.greaterThanOrEqual(value);
                            }
                        });
                    }
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Trigger Configuration Impact', () => {
        Object.entries(triggerConfigTestVariations).forEach(([configName, config]) => {
            it(`should handle ${configName} trigger configuration`, () => {
                // Use data that should pass most thresholds
                const testData = [createActionRecommendationTestData('good_buy', config)];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(config);
                const result = actionRecommendationEngine(mockInput, mockNodeAccess);

                // Result depends on confluence score vs threshold
                const shouldPass = testData[0].confluenceScore >= config.scoreGreaterThan;

                if (shouldPass) {
                    expect(result.length).to.be.greaterThan(0);
                    expect(result[0].json.actionRecommendation).to.be.a('string');
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Data Preservation and Integrity', () => {
        it('should preserve all original data fields', () => {
            const testData = [actionRecommendationTestScenarios.excellent_metrics.data];
            const originalData = JSON.parse(JSON.stringify(testData[0]));

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            // Check that all original fields are preserved
            const originalFields = Object.keys(originalData).filter(key => key !== 'triggerConfig');
            originalFields.forEach(field => {
                expect(recommendation).to.have.property(field);
                if (field !== 'actionRecommendation') {
                    expect(recommendation[field]).to.deep.equal(originalData[field]);
                }
            });

            // New field should be added
            expect(recommendation).to.have.property('actionRecommendation');
        });

        it('should not modify input data', () => {
            const testData = [actionRecommendationTestScenarios.strong_buy.data];
            const originalData = JSON.parse(JSON.stringify(testData[0]));

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            // Original data should remain unchanged
            expect(testData[0]).to.deep.equal(originalData);
        });

        it('should handle all recommendation formats correctly', () => {
            const allRecommendations = [
                actionRecommendationTestScenarios.strong_buy,
                actionRecommendationTestScenarios.good_buy,
                actionRecommendationTestScenarios.cautious_buy,
                actionRecommendationTestScenarios.watchlist,
            ];

            allRecommendations.forEach(scenario => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
                const result = actionRecommendationEngine(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                const recommendation = result[0].json.actionRecommendation;
                expect(actionRecommendationHelpers.isValidRecommendationFormat(recommendation)).to.be.true;
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const mockNodeAccess = createMockNodeAccess({});
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should handle missing metrics gracefully', () => {
            const testData = [createActionRecommendationTestData('good_buy')];
            delete testData[0].backtestWinRate;
            delete testData[0].riskReward;

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);

            // Should not crash, may fall back to default recommendation
            expect(() => actionRecommendationEngine(mockInput, mockNodeAccess)).to.not.throw();
        });

        it('should provide consistent recommendations for identical inputs', () => {
            const testData = [actionRecommendationTestScenarios.good_buy.data];
            const mockInput1 = createMockInput(testData);
            const mockInput2 = createMockInput(testData);
            const mockNodeAccess1 = createMockNodeAccess(testData[0].triggerConfig);
            const mockNodeAccess2 = createMockNodeAccess(testData[0].triggerConfig);

            const result1 = actionRecommendationEngine(mockInput1, mockNodeAccess1);
            const result2 = actionRecommendationEngine(mockInput2, mockNodeAccess2);

            expect(result1).to.deep.equal(result2);
        });
    });

    describe('Performance and Scalability', () => {
        it('should handle large datasets efficiently', () => {
            const largeTestData = [];
            for (let i = 0; i < 200; i++) {
                const dataType = ['strong_buy', 'good_buy', 'cautious_buy', 'watchlist', 'avoid_setup'][i % 5];
                largeTestData.push(createActionRecommendationTestData(dataType));
            }

            const mockInput = createMockInput(largeTestData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });

            const startTime = Date.now();
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(3000); // Should complete within 3 seconds
            expect(result.length).to.be.greaterThan(0);

            // Verify all results have valid recommendations
            result.forEach(item => {
                expect(actionRecommendationHelpers.validateActionRecommendationData(item.json)).to.be.true;
            });
        });

        it('should maintain recommendation distribution within expected ranges', () => {
            const testData = [];
            const scenarios = ['strong_buy', 'good_buy', 'cautious_buy', 'watchlist', 'avoid_setup'];

            // Create balanced dataset
            for (let i = 0; i < 100; i++) {
                const scenario = scenarios[i % scenarios.length];
                testData.push(createActionRecommendationTestData(scenario));
            }

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            // Count recommendations by type
            const recommendationCounts = {};
            result.forEach(item => {
                const category = actionRecommendationHelpers.getRecommendationCategory(item.json.actionRecommendation);
                recommendationCounts[category] = (recommendationCounts[category] || 0) + 1;
            });

            // Should have reasonable distribution
            expect(Object.keys(recommendationCounts).length).to.be.greaterThan(1);
        });

        it('should handle concurrent processing correctly', async () => {
            const testData = [actionRecommendationTestScenarios.good_buy.data];

            // Simulate concurrent calls
            const promises = Array(10).fill().map(() => {
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
                return Promise.resolve(actionRecommendationEngine(mockInput, mockNodeAccess));
            });

            const results = await Promise.all(promises);

            // All results should be identical
            results.forEach(result => {
                expect(result).to.deep.equal(results[0]);
            });
        });
    });

    describe('Recommendation Quality and Logic', () => {
        it('should prioritize recommendations correctly', () => {
            const testData = [
                createActionRecommendationTestData('strong_buy'),
                createActionRecommendationTestData('good_buy'),
                createActionRecommendationTestData('cautious_buy'),
                createActionRecommendationTestData('watchlist'),
            ];

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 0 });
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            // Sort by recommendation priority
            const sortedResults = result.sort((a, b) => {
                const priorityA = actionRecommendationHelpers.calculateRecommendationPriority(a.json.actionRecommendation);
                const priorityB = actionRecommendationHelpers.calculateRecommendationPriority(b.json.actionRecommendation);
                return priorityB - priorityA;
            });

            // First should be STRONG BUY, last should be AVOID
            expect(sortedResults[0].json.actionRecommendation).to.include('STRONG BUY');
        });

        it('should ensure recommendation logic follows hierarchy', () => {
            // Test that better metrics always lead to better recommendations
            const hierarchyTests = [
                { winRate: 75, score: 6, riskReward: 2.5, expectedMin: 'STRONG BUY' },
                { winRate: 68, score: 4, riskReward: 1.8, expectedMin: 'BUY' },
                { winRate: 60, score: 3, riskReward: 1.5, expectedMin: 'CAUTIOUS BUY' },
                { winRate: 54, score: 2, riskReward: 1.2, expectedMin: 'WATCHLIST' }
            ];

            hierarchyTests.forEach(test => {
                const customData = createActionRecommendationTestData('edge_case_metrics');
                customData.backtestWinRate = test.winRate;
                customData.confluenceScore = test.score;
                customData.riskReward = test.riskReward;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
                const result = actionRecommendationEngine(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                expect(result[0].json.actionRecommendation).to.include(test.expectedMin);
            });
        });

        it('should handle manual review fallback correctly', () => {
            // Create edge case that might not fit standard criteria
            const customData = createActionRecommendationTestData('edge_case_metrics');
            customData.backtestWinRate = 55; // Between thresholds
            customData.confluenceScore = 2.5; // Not integer
            customData.riskReward = 1.75; // Edge case

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            // Should still generate a valid recommendation, not "manual review"
            const validRecommendations = ['STRONG BUY', 'BUY', 'CAUTIOUS BUY', 'WATCHLIST', 'AVOID'];
            const hasValidRecommendation = validRecommendations.some(rec =>
                result[0].json.actionRecommendation.includes(rec)
            );
            expect(hasValidRecommendation).to.be.true;
        });
    });

    describe('Integration with Position Sizing Data', () => {
        it('should correctly use position sizing data in recommendations', () => {
            const testData = [actionRecommendationTestScenarios.excellent_metrics.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            // Should preserve all position sizing fields
            expect(recommendation).to.have.property('qty');
            expect(recommendation).to.have.property('totalCost');
            expect(recommendation).to.have.property('nominalProfit');
            expect(recommendation).to.have.property('nominalLoss');
            expect(recommendation).to.have.property('expectancy');
            expect(recommendation).to.have.property('marketPhase');
            expect(recommendation).to.have.property('entryStrategy');
        });

        it('should maintain data types and formats from position sizing', () => {
            const testData = [actionRecommendationTestScenarios.strong_buy.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const recommendation = result[0].json;

            // Numeric fields should remain numeric
            expect(recommendation.qty).to.be.a('number');
            expect(recommendation.riskReward).to.be.a('number');
            expect(recommendation.backtestWinRate).to.be.a('number');
            expect(recommendation.confluenceScore).to.be.a('number');

            // Formatted currency fields should remain strings
            expect(recommendation.totalCost).to.be.a('string');
            expect(recommendation.nominalProfit).to.be.a('string');
            expect(recommendation.nominalLoss).to.be.a('string');
            expect(recommendation.expectancy).to.be.a('string');
        });
    });

    describe('Configuration Edge Cases', () => {
        it('should handle missing scoreGreaterThan in config', () => {
            const testData = [actionRecommendationTestScenarios.good_buy.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({}); // Empty config
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            // Should use default threshold or handle gracefully
            expect(result).to.be.an('array');
        });

        it('should handle very high threshold values', () => {
            const testData = [actionRecommendationTestScenarios.excellent_metrics.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 10 }); // Very high threshold
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);

            // Should filter out all results
            expect(result).to.have.lengthOf(0);
        });
    });

    describe('Stress Testing', () => {
        it('should handle malformed input data gracefully', () => {
            const malformedData = [
                { ticker: 'MALFORMED1' }, // Missing most fields
                {
                    ticker: 'MALFORMED2',
                    backtestWinRate: 'invalid',
                    confluenceScore: null,
                    riskReward: undefined
                }
            ];

            const mockInput = createMockInput(malformedData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });

            expect(() => actionRecommendationEngine(mockInput, mockNodeAccess)).to.not.throw();
        });

        it('should maintain performance with mixed data quality', () => {
            const mixedData = [];
            for (let i = 0; i < 50; i++) {
                if (i % 5 === 0) {
                    // Add some malformed data
                    mixedData.push({ ticker: `MALFORMED_${i}`, confluenceScore: 'invalid' });
                } else {
                    mixedData.push(createActionRecommendationTestData('good_buy'));
                }
            }

            const mockInput = createMockInput(mixedData);
            const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });

            const startTime = Date.now();
            const result = actionRecommendationEngine(mockInput, mockNodeAccess);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(2000);
            expect(result).to.be.an('array');
        });

        it('should produce deterministic results', () => {
            const testData = [
                createActionRecommendationTestData('strong_buy'),
                createActionRecommendationTestData('cautious_buy'),
                createActionRecommendationTestData('watchlist')
            ];

            // Run multiple times
            const results = [];
            for (let i = 0; i < 5; i++) {
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess({ scoreGreaterThan: 2 });
                results.push(actionRecommendationEngine(mockInput, mockNodeAccess));
            }

            // All results should be identical
            results.forEach(result => {
                expect(result).to.deep.equal(results[0]);
            });
        });
    });
});