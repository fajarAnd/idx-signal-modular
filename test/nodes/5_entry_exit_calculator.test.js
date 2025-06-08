// test/nodes/5_entry_exit_calculator.test.js
const { expect } = require('chai');
const entryExitCalculator = require('../../src/nodes/5_entry_exit_calculator');
const { entryExitTestScenarios, entryExitHelpers, createEntryExitTestData } = require('../mock-data-test-case/5_entry_exit_calculator');
const { createMockInput, createMockNodeAccess, mockCurrentOpenPosition} = require('../mock-data-test-case/all_nodes_common');

describe('Entry Exit Calculator Node', () => {

    describe('Entry Price Calculation', () => {
        it('should calculate entry with adjustment for high strength support', () => {
            const testData = [entryExitTestScenarios.high_strength_support.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            const expectedEntry = entryExitHelpers.calculateExpectedEntry(testData[0].support);
            expect(entryExit.entry).to.be.closeTo(expectedEntry, 1);

            // High strength should apply 0.5% adjustment
            expect(entryExit.entry).to.be.greaterThan(testData[0].support.price);
        });

        it('should calculate entry without adjustment for low strength support', () => {
            const testData = [entryExitTestScenarios.low_strength_support.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            // Low strength should use support price directly
            expect(entryExit.entry).to.equal(testData[0].support.price);
        });

        it('should test strength threshold boundary (1.2)', () => {
            const testScenarios = [
                { strength: 1.2, shouldAdjust: false },
                { strength: 1.21, shouldAdjust: true },
                { strength: 1.19, shouldAdjust: false }
            ];

            testScenarios.forEach(scenario => {
                const customData = createEntryExitTestData('valid_setup');
                customData.support.strength = scenario.strength;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
                const result = entryExitCalculator(mockInput, mockNodeAccess);

                if (result.length > 0) {
                    const entryExit = result[0].json.entryExit;
                    if (scenario.shouldAdjust) {
                        expect(entryExit.entry).to.be.greaterThan(customData.support.price);
                    } else {
                        expect(entryExit.entry).to.equal(customData.support.price);
                    }
                }
            });
        });
    });

    describe('Stop Loss Calculation', () => {
        it('should use the higher of conservative and support-based stop', () => {
            const testData = [entryExitTestScenarios.valid_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            const conservativeStop = entryExit.entry - testData[0].indicators.atr14 * 1.5;
            const supportStop = testData[0].support.price - (testData[0].support.price * 0.03);
            const expectedStop = Math.max(conservativeStop, supportStop);

            expect(entryExit.stop).to.be.closeTo(expectedStop, 1);
            expect(entryExit.stop).to.be.lessThan(entryExit.entry);
        });

        it('should handle different ATR values correctly', () => {
            const testScenarios = [
                { atr14: 50, expectedStopDistance: 75 }, // 50 * 1.5
                { atr14: 100, expectedStopDistance: 150 }, // 100 * 1.5
                { atr14: 200, expectedStopDistance: 300 }  // 200 * 1.5
            ];

            testScenarios.forEach(scenario => {
                const customData = createEntryExitTestData('valid_setup');
                customData.indicators.atr14 = scenario.atr14;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
                const result = entryExitCalculator(mockInput, mockNodeAccess);

                if (result.length > 0) {
                    const entryExit = result[0].json.entryExit;
                    const conservativeStop = entryExit.entry - scenario.expectedStopDistance;
                    const supportStop = customData.support.price * 0.97; // 3% below support

                    expect(entryExit.stop).to.be.closeTo(Math.max(conservativeStop, supportStop), 2);
                }
            });
        });
    });

    describe('Target Price Calculation', () => {
        it('should use the lower of ATR-based and resistance-based target', () => {
            const testData = [entryExitTestScenarios.valid_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            const atrTarget = entryExit.entry + (testData[0].indicators.atr14 * 2);
            const resistanceTarget = testData[0].resistance.price;
            const expectedTarget = Math.min(atrTarget, resistanceTarget);

            expect(entryExit.target).to.be.closeTo(expectedTarget, 1);
            expect(entryExit.target).to.be.greaterThan(entryExit.entry);
        });

        it('should choose resistance target when ATR target is higher', () => {
            const customData = createEntryExitTestData('valid_setup');
            customData.indicators.atr14 = 200; // Large ATR
            customData.resistance.price = 2600; // Lower resistance

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            if (result.length > 0) {
                const entryExit = result[0].json.entryExit;
                expect(entryExit.target).to.equal(customData.resistance.price);
            }
        });
    });

    describe('Risk/Reward Ratio Calculation', () => {
        it('should calculate risk/reward ratio correctly', () => {
            const testData = [entryExitTestScenarios.valid_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            const expectedRiskReward = entryExitHelpers.calculateRiskReward(
                entryExit.entry,
                entryExit.stop,
                entryExit.target
            );

            expect(entryExit.riskReward).to.be.closeTo(expectedRiskReward, 0.01);
            expect(entryExit.riskReward).to.be.greaterThanOrEqual(1.8);
        });

        it('should filter out setups with poor risk/reward ratio', () => {
            const testData = [entryExitTestScenarios.poor_risk_reward.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(0);
        });
    });

    describe('Entry Gap Analysis', () => {
        it('should calculate entry gap percentage correctly', () => {
            const testData = [entryExitTestScenarios.large_entry_gap.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            const expectedGap = ((testData[0].lastClose - entryExit.entry) / entryExit.entry) * 100;
            expect(entryExit.entryGapPercent).to.be.closeTo(expectedGap, 0.01);
        });
        // TODO: Fix it!
        it('should determine correct entry strategy based on gap', () => {
            const testScenarios = [
                { lastClose: 2405, expectedStrategy: 'Immediate Entry (At Support)' }, // -0.29% gap
                { lastClose: 2450, expectedStrategy: 'Breakout Entry (Acceptable Gap)' }, // 1.58% gap - FIXED
                { lastClose: 2500, expectedStrategy: 'Aggressive Entry (High Risk)' }, // 3.65% gap - FIXED
                { lastClose: 2600, expectedStrategy: 'Wait for Retest' } // 7.80% gap - FIXED
            ];

            testScenarios.forEach(scenario => {
                const customData = createEntryExitTestData('valid_setup');
                customData.lastClose = scenario.lastClose;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
                const result = entryExitCalculator(mockInput, mockNodeAccess);

                if (result.length > 0) {
                    const entryExit = result[0].json.entryExit;
                    expect(entryExit.entryStrategy).to.equal(scenario.expectedStrategy);
                }
            });
        });

        it('should handle negative gap (price below entry)', () => {
            const customData = createEntryExitTestData('valid_setup');
            customData.lastClose = 2350; // Below entry price

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            if (result.length > 0) {
                const entryExit = result[0].json.entryExit;
                expect(entryExit.entryGapPercent).to.be.lessThan(0);
                expect(entryExit.entryStrategy).to.equal('Immediate Entry (At Support)');
            }
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(entryExitTestScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
                const result = entryExitCalculator(mockInput, mockNodeAccess);

                if (scenario.expectedPass) {
                    expect(result).to.have.lengthOf(1);
                    expect(result[0].json).to.have.property('entryExit');

                    const entryExit = result[0].json.entryExit;
                    expect(entryExitHelpers.validateEntryExitData(entryExit)).to.be.true;

                    // Check specific expectations
                    if (scenario.expectedCalculations) {
                        const calc = scenario.expectedCalculations;

                        if (calc.riskRewardMin) {
                            expect(entryExit.riskReward).to.be.greaterThanOrEqual(calc.riskRewardMin);
                        }

                        if (calc.entryStrategy) {
                            expect(entryExit.entryStrategy).to.equal(calc.entryStrategy);
                        }

                        if (calc.excellentRiskReward) {
                            expect(entryExit.riskReward).to.be.greaterThan(3.0);
                        }
                    }
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Edge Cases and Filtering', () => {
        it('should filter out setups with zero risk lot', () => {
            const customData = createEntryExitTestData('valid_setup');
            customData.indicators.atr14 = 10; // Very small ATR
            customData.support.price = 2420; // Same as entry, leading to zero risk

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(0);
        });

        it('should filter out setups with zero reward lot', () => {
            const customData = createEntryExitTestData('valid_setup');
            customData.resistance.price = 2400; // Same as entry, leading to zero reward
            customData.indicators.atr14 = 10; // Small ATR

            const testData = [customData];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(0);
        });

        it('should filter out setups with negative risk lot', () => {
            const testData = [entryExitTestScenarios.negative_risk_lot.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(0);
        });

        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });
    });

    describe('Price Rounding and Precision', () => {
        it('should round prices to whole numbers', () => {
            const testData = [entryExitTestScenarios.valid_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            expect(entryExit.entry % 1).to.equal(0); // Should be whole number
            expect(entryExit.stop % 1).to.equal(0);  // Should be whole number
            expect(entryExit.target % 1).to.equal(0); // Should be whole number
        });

        it('should round entry gap percentage to 2 decimal places', () => {
            const testData = [entryExitTestScenarios.large_entry_gap.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const entryExit = result[0].json.entryExit;

            const decimalPlaces = entryExit.entryGapPercent.toString().split('.')[1]?.length || 0;
            expect(decimalPlaces).to.be.lessThanOrEqual(2);
        });
    });

    describe('Performance and Data Integrity', () => {
        it('should handle large datasets efficiently', () => {
            const largeTestData = [];
            for (let i = 0; i < 100; i++) {
                largeTestData.push(createEntryExitTestData('valid_setup'));
            }

            const mockInput = createMockInput(largeTestData);
            const startTime = Date.now();
            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result = entryExitCalculator(mockInput, mockNodeAccess);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(5000); // Should complete within 5 seconds
            expect(result.length).to.be.greaterThan(0);
        });

        it('should maintain data consistency across multiple calculations', () => {
            const testData = [entryExitTestScenarios.optimal_setup.data];
            const mockInput1 = createMockInput(testData);
            const mockInput2 = createMockInput(testData);

            const mockNodeAccess = createMockNodeAccess(mockCurrentOpenPosition);
            const result1 = entryExitCalculator(mockInput1, mockNodeAccess);
            const result2 = entryExitCalculator(mockInput2, mockNodeAccess);

            expect(result1).to.deep.equal(result2);
        });
    });
});