// test/nodes/7_position_sizing_risk_management.test.js
const { expect } = require('chai');
const positionSizingRiskManagement = require('../../src/nodes/7_position_sizing_risk_management');
const { positionSizingTestScenarios, positionSizingHelpers, createPositionSizingTestData, triggerConfigVariations } = require('../mock-data-test-case/7_position_sizing_risk_management');
const { createMockInput, createMockNodeAccess } = require('../mock-data-test-case/all_nodes_common');

describe('Position Sizing & Risk Management Node', () => {

    describe('Quantity Calculation', () => {
        it('should calculate quantity based on risk and capital limits', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            const expectedQty = positionSizingHelpers.calculateExpectedQty(
                testData[0].triggerConfig.MaxLoss,
                testData[0].entryExit.riskLot,
                testData[0].triggerConfig.modalTersedia,
                testData[0].entryExit.entry
            );

            expect(positionData.qty).to.equal(expectedQty);
            expect(positionData.qty).to.be.greaterThanOrEqual(1);
        });

        it('should be limited by capital when stock is expensive', () => {
            const testData = [positionSizingTestScenarios.expensive_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            const capital = testData[0].triggerConfig.modalTersedia;
            const entry = testData[0].entryExit.entry;
            const lotValue = 100;
            const qtyFunds = Math.floor(capital / (entry * lotValue));

            // Should be limited by available funds
            expect(positionData.qty).to.be.lessThanOrEqual(qtyFunds);
        });

        it('should ensure minimum quantity of 1', () => {
            const testData = [createPositionSizingTestData('standard_setup', {
                MaxLoss: 10,        // Very low max loss
                modalTersedia: 100000  // Low capital
            })];

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            expect(result[0].json.qty).to.be.greaterThanOrEqual(1);
        });

        it('should handle different capital scenarios', () => {
            const capitalScenarios = [
                { capital: 1000000, expectedSmaller: true },  // 1M IDR
                { capital: 5000000, expectedNormal: true },   // 5M IDR
                { capital: 10000000, expectedLarger: true }   // 10M IDR
            ];

            capitalScenarios.forEach(scenario => {
                const testData = [createPositionSizingTestData('standard_setup', {
                    modalTersedia: scenario.capital
                })];

                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
                const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                expect(result[0].json.qty).to.be.a('number');
                expect(result[0].json.qty).to.be.greaterThanOrEqual(1);
            });
        });
    });

    describe('Nominal Calculations', () => {
        it('should calculate nominal profit and loss correctly', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            const expectedNominals = positionSizingHelpers.calculateExpectedNominals(
                positionData.qty,
                testData[0].entryExit.riskLot,
                testData[0].entryExit.rewardLot
            );

            // Parse formatted Indonesian currency
            const actualNominalProfit = positionSizingHelpers.parseIDRValue(positionData.nominalProfit);
            const actualNominalLoss = positionSizingHelpers.parseIDRValue(positionData.nominalLoss);

            expect(actualNominalProfit).to.equal(expectedNominals.nominalProfit);
            expect(actualNominalLoss).to.equal(expectedNominals.nominalLoss);
        });

        it('should calculate total cost correctly', () => {
            const testData = [positionSizingTestScenarios.expensive_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            const expectedTotalCost = positionData.qty * 100 * testData[0].entryExit.entry;
            const actualTotalCost = positionSizingHelpers.parseIDRValue(positionData.totalCost);

            expect(actualTotalCost).to.equal(expectedTotalCost);
        });
    });

    describe('Expectancy Calculation', () => {
        it('should calculate expectancy using win rate and nominal amounts', () => {
            const testData = [positionSizingTestScenarios.uptrend_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            const nominalProfit = positionSizingHelpers.parseIDRValue(positionData.nominalProfit);
            const nominalLoss = positionSizingHelpers.parseIDRValue(positionData.nominalLoss);
            const expectedExpectancy = positionSizingHelpers.calculateExpectedExpectancy(
                testData[0].backtest.winRateDec,
                nominalProfit,
                nominalLoss
            );

            const actualExpectancy = positionSizingHelpers.parseIDRValue(positionData.expectancy);
            expect(actualExpectancy).to.be.closeTo(expectedExpectancy, 1000); // Allow 1K IDR variance
        });

        it('should handle negative expectancy scenarios', () => {
            const testData = [createPositionSizingTestData('standard_setup')];
            // Modify to create negative expectancy
            testData[0].backtest.winRateDec = 0.3; // 30% win rate
            testData[0].backtest.backtestWinRate = 30.0;

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            // Expectancy can be negative but should still be formatted correctly
            expect(positionSizingHelpers.isValidIDRFormat(positionData.expectancy) ||
                positionData.expectancy.includes('-')).to.be.true;
        });

        it('should round expectancy to nearest integer', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            const expectancyValue = positionSizingHelpers.parseIDRValue(positionData.expectancy);
            expect(expectancyValue % 1).to.equal(0); // Should be whole number
        });
    });

    describe('Market Phase Detection', () => {
        it('should correctly identify uptrend market phase', () => {
            const testData = [positionSizingTestScenarios.uptrend_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            expect(positionData.marketPhase).to.equal('Uptrend');

            // Verify uptrend conditions
            const { lastClose } = testData[0];
            const { sma20, sma50 } = testData[0].indicators;
            expect(lastClose).to.be.greaterThan(sma20);
            expect(sma20).to.be.greaterThan(sma50);
        });

        it('should correctly identify downtrend market phase', () => {
            const testData = [positionSizingTestScenarios.downtrend_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            expect(positionData.marketPhase).to.equal('Downtrend');

            // Verify downtrend conditions
            const { lastClose } = testData[0];
            const { sma20, sma50 } = testData[0].indicators;
            expect(lastClose).to.be.lessThan(sma20);
            expect(sma20).to.be.lessThan(sma50);
        });

        it('should correctly identify sideways market phase', () => {
            const testData = [positionSizingTestScenarios.sideways_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            expect(positionData.marketPhase).to.equal('Sideways');
        });

        // TODO: Fix It!
        it('should test market phase boundary conditions', () => {
            const testScenarios = [
                { lastClose: 2500, sma20: 2500, sma50: 2400, expected: 'Sideways' }, // Equal lastClose and SMA20
                { lastClose: 2500, sma20: 2400, sma50: 2400, expected: 'Uptrend' }, // Equal SMAs
                { lastClose: 2300, sma20: 2400, sma50: 2400, expected: 'Downtrend' } // Equal SMAs, low close
            ];

            testScenarios.forEach(scenario => {
                const customData = createPositionSizingTestData('standard_setup');
                customData.lastClose = scenario.lastClose;
                customData.indicators.sma20 = scenario.sma20;
                customData.indicators.sma50 = scenario.sma50;

                const testData = [customData];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
                const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                expect(result[0].json.marketPhase).to.equal(scenario.expected);
            });
        });
    });

    describe('Test Scenarios', () => {
        Object.entries(positionSizingTestScenarios).forEach(([key, scenario]) => {
            it(`should handle ${scenario.name}: ${scenario.description}`, () => {
                const testData = [scenario.data];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
                const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

                if (scenario.expectedPass) {
                    expect(result).to.have.lengthOf(1);
                    expect(positionSizingHelpers.validatePositionSizingData(result[0].json)).to.be.true;

                    // Check specific expectations
                    if (scenario.expectedCalculations) {
                        const calc = scenario.expectedCalculations;
                        const positionData = result[0].json;

                        if (calc.hasValidQty) {
                            expect(positionData.qty).to.be.a('number');
                            expect(positionData.qty).to.be.greaterThanOrEqual(1);
                        }

                        if (calc.hasPositiveExpectancy) {
                            const expectancyValue = positionSizingHelpers.parseIDRValue(positionData.expectancy);
                            expect(expectancyValue).to.be.greaterThan(0);
                        }

                        if (calc.marketPhase) {
                            expect(positionData.marketPhase).to.equal(calc.marketPhase);
                        }

                        if (calc.capitalLimited || calc.riskLimited) {
                            expect(positionData.qty).to.be.a('number');
                        }
                    }
                } else {
                    expect(result).to.have.lengthOf(0);
                }
            });
        });
    });

    describe('Trigger Configuration Variations', () => {
        Object.entries(triggerConfigVariations).forEach(([configName, config]) => {
            it(`should handle ${configName} configuration correctly`, () => {
                const testData = [createPositionSizingTestData('standard_setup', config)];
                const mockInput = createMockInput(testData);
                const mockNodeAccess = createMockNodeAccess(config);
                const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

                expect(result).to.have.lengthOf(1);
                const positionData = result[0].json;

                // Verify configuration impact
                const expectedQty = positionSizingHelpers.calculateExpectedQty(
                    config.MaxLoss,
                    testData[0].entryExit.riskLot,
                    config.modalTersedia,
                    testData[0].entryExit.entry
                );

                expect(positionData.qty).to.equal(expectedQty);
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle empty input array', () => {
            const mockInput = createMockInput([]);
            const mockNodeAccess = createMockNodeAccess({});
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.be.an('array');
            expect(result).to.have.lengthOf(0);
        });

        it('should handle missing trigger configuration gracefully', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess({}); // Empty config

            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            // Should use default values
            expect(result[0].json.qty).to.be.greaterThanOrEqual(1);
        });

        it('should preserve original data structure', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const originalData = JSON.parse(JSON.stringify(testData[0]));

            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            // Original fields should be preserved
            expect(positionData.ticker).to.equal(originalData.ticker);
            expect(positionData.lastDate).to.equal(originalData.lastDate);
            expect(positionData.lastClose).to.equal(originalData.lastClose);
            expect(positionData.entry).to.equal(originalData.entryExit.entry);
            expect(positionData.stop).to.equal(originalData.entryExit.stop);
            expect(positionData.target).to.equal(originalData.entryExit.target);
        });
    });

    describe('Data Formatting and Localization', () => {
        it('should handle decimal rounding correctly', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            // Check that numeric fields are properly rounded
            expect(positionData.supportStrength).to.match(/^\d+\.\d{2}$/); // 2 decimal places
            expect(positionData.resistanceDistance).to.be.a('number');
            expect(positionData.atr14).to.be.a('number');
        });
    });

    describe('Performance and Data Integrity', () => {
        it('should handle large datasets efficiently', () => {
            const largeTestData = [];
            for (let i = 0; i < 100; i++) {
                largeTestData.push(createPositionSizingTestData('standard_setup'));
            }

            const mockInput = createMockInput(largeTestData);
            const mockNodeAccess = createMockNodeAccess(largeTestData[0].triggerConfig);

            const startTime = Date.now();
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);
            const endTime = Date.now();

            expect(endTime - startTime).to.be.lessThan(5000); // Should complete within 5 seconds
            expect(result).to.have.lengthOf(100);

            // Verify all results are valid
            result.forEach(item => {
                expect(positionSizingHelpers.validatePositionSizingData(item.json)).to.be.true;
            });
        });

        it('should produce consistent results with same input', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput1 = createMockInput(testData);
            const mockInput2 = createMockInput(testData);
            const mockNodeAccess1 = createMockNodeAccess(testData[0].triggerConfig);
            const mockNodeAccess2 = createMockNodeAccess(testData[0].triggerConfig);

            const result1 = positionSizingRiskManagement(mockInput1, mockNodeAccess1);
            const result2 = positionSizingRiskManagement(mockInput2, mockNodeAccess2);

            expect(result1).to.deep.equal(result2);
        });

        it('should validate all calculations are mathematically correct', () => {
            const testData = [positionSizingTestScenarios.uptrend_stock.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            // Verify mathematical relationships
            const nominalProfit = positionSizingHelpers.parseIDRValue(positionData.nominalProfit);
            const nominalLoss = positionSizingHelpers.parseIDRValue(positionData.nominalLoss);
            const expectancy = positionSizingHelpers.parseIDRValue(positionData.expectancy);
            const totalCost = positionSizingHelpers.parseIDRValue(positionData.totalCost);

            // Check profit/loss calculations
            const expectedNominalProfit = positionData.qty * 100 * testData[0].entryExit.rewardLot;
            const expectedNominalLoss = positionData.qty * 100 * testData[0].entryExit.riskLot;
            const expectedTotalCost = positionData.qty * 100 * testData[0].entryExit.entry;

            expect(nominalProfit).to.equal(expectedNominalProfit);
            expect(nominalLoss).to.equal(expectedNominalLoss);
            expect(totalCost).to.equal(expectedTotalCost);

            // Check expectancy calculation
            const expectedExpectancy = Math.round(
                testData[0].backtest.winRateDec * nominalProfit -
                (1 - testData[0].backtest.winRateDec) * nominalLoss
            );
            expect(expectancy).to.be.closeTo(expectedExpectancy, 1);
        });
    });

    describe('Risk Management Constraints', () => {
        it('should maintain reasonable position sizes', () => {
            const testData = [positionSizingTestScenarios.standard_setup.data];
            const mockInput = createMockInput(testData);
            const mockNodeAccess = createMockNodeAccess(testData[0].triggerConfig);
            const result = positionSizingRiskManagement(mockInput, mockNodeAccess);

            expect(result).to.have.lengthOf(1);
            const positionData = result[0].json;

            // Position should be reasonable (not too small or too large)
            expect(positionData.qty).to.be.greaterThanOrEqual(1);
            expect(positionData.qty).to.be.lessThan(1000); // Reasonable upper bound

            // Total cost should be reasonable percentage of capital
            const totalCost = positionSizingHelpers.parseIDRValue(positionData.totalCost);
            const capital = testData[0].triggerConfig.modalTersedia;
            const capitalUtilization = totalCost / capital;
            expect(capitalUtilization).to.be.lessThanOrEqual(1.0); // Never exceed 100%
        });
    });
});