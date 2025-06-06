#!/usr/bin/env node

/**
 * Script to create complete project structure for IDX Signal Modular
 * Run: node scripts/create-structure.js
 */

const fs = require('fs');
const path = require('path');

// Define complete directory structure
const directories = [
    'src',
    'src/nodes',
    'test',
    'test/nodes',
    'test/mock-data-test-case',
    'test/coverage',
    'scripts',
    'docs',
    'config'
];

// Define all files that should exist
const files = {
    // Source files
    'src/index.js': 'Main pipeline runner',
    'src/nodes/parse_and_slice.js': 'Parse and slice node',
    'src/nodes/1_data_validation_and_preprocessing.js': 'Data validation node',
    'src/nodes/2_technical_indicators_calculator.js': 'Technical indicators node',
    'src/nodes/3_pivot_points_support_resistance_detection.js': 'Pivot points node',
    'src/nodes/4_confluence_score_calculator.js': 'Confluence score node',
    'src/nodes/5_entry_exit_calculator.js': 'Entry exit calculator node',
    'src/nodes/6_backtest_engine.js': 'Backtest engine node',
    'src/nodes/7_position_sizing_risk_management.js': 'Position sizing node',
    'src/nodes/8_action_recommendation_engine.js': 'Action recommendation node',

    // Test files
    'test/nodes/parse_and_slice.test.js': 'Parse and slice tests',
    'test/nodes/1_data_validation_and_preprocessing.test.js': 'Data validation tests',
    'test/nodes/2_technical_indicators_calculator.test.js': 'Technical indicators tests',
    'test/nodes/3_pivot_points_support_resistance_detection.test.js': 'Pivot points tests',
    'test/nodes/4_confluence_score_calculator.test.js': 'Confluence score tests',
    'test/nodes/5_entry_exit_calculator.test.js': 'Entry exit tests',
    'test/nodes/6_backtest_engine.test.js': 'Backtest engine tests',
    'test/nodes/7_position_sizing_risk_management.test.js': 'Position sizing tests',
    'test/nodes/8_action_recommendation_engine.test.js': 'Action recommendation tests',

    // Mock data files
    'test/mock-data-test-case/all_nodes_common.js': 'Common mock data utilities',
    'test/mock-data-test-case/parse_and_slice.js': 'Parse and slice mock data',
    'test/mock-data-test-case/1_data_validation_and_preprocessing.js': 'Data validation mock data',
    'test/mock-data-test-case/2_technical_indicators_calculator.js': 'Technical indicators mock data',
    'test/mock-data-test-case/3_pivot_points_support_resistance_detection.js': 'Pivot points mock data',
    'test/mock-data-test-case/4_confluence_score_calculator.js': 'Confluence score mock data',
    'test/mock-data-test-case/5_entry_exit_calculator.js': 'Entry exit mock data',
    'test/mock-data-test-case/6_backtest_engine.js': 'Backtest engine mock data',
    'test/mock-data-test-case/7_position_sizing_risk_management.js': 'Position sizing mock data',
    'test/mock-data-test-case/8_action_recommendation_engine.js': 'Action recommendation mock data',

    // Configuration files
    'package.json': 'Package configuration',
    'README.md': 'Project documentation',
    '.gitignore': 'Git ignore rules',
    '.eslintrc.js': 'ESLint configuration',
    'mocha.opts': 'Mocha test configuration'
};

function createDirectories() {
    console.log('📁 Creating directory structure...');

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`✅ Created: ${dir}`);
        } else {
            console.log(`⚠️  Already exists: ${dir}`);
        }
    });
}

function checkFiles() {
    console.log('\n📄 Checking file structure...');

    let missingFiles = [];
    let existingFiles = [];

    Object.entries(files).forEach(([file, description]) => {
        if (fs.existsSync(file)) {
            existingFiles.push({ file, description });
            console.log(`✅ Found: ${file}`);
        } else {
            missingFiles.push({ file, description });
            console.log(`❌ Missing: ${file} (${description})`);
        }
    });

    return { missingFiles, existingFiles };
}

function createPlaceholderFiles(missingFiles) {
    console.log('\n📝 Creating placeholder files...');

    missingFiles.forEach(({ file, description }) => {
        const dir = path.dirname(file);
        const ext = path.extname(file);

        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        let content = '';

        if (ext === '.js') {
            if (file.includes('/nodes/') && file.includes('src/')) {
                // Source node file
                const nodeName = path.basename(file, '.js');
                content = `// ${file}
/**
 * ${description}
 * TODO: Implement the actual function extracted from N8N node
 */

//extract the function from N8N node
function ${nodeName.replace(/[^a-zA-Z0-9]/g, '')}($input${file.includes('position_sizing') || file.includes('action_recommendation') ? ', $' : ''}) {
  // TODO: Implement the actual logic from N8N node
  console.warn('${nodeName} function not yet implemented');
  return [];
}

module.exports = ${nodeName.replace(/[^a-zA-Z0-9]/g, '')};
`;
            } else if (file.includes('/test/nodes/')) {
                // Test file
                const nodeName = path.basename(file, '.test.js');
                const srcPath = `../../src/nodes/${nodeName}`;
                content = `// ${file}
const { expect } = require('chai');
const ${nodeName.replace(/[^a-zA-Z0-9]/g, '')} = require('${srcPath}');
const { createMockInput } = require('../mock-data-test-case/all_nodes_common');

describe('${description}', () => {
  
  describe('Normal Cases', () => {
    it('should process valid input correctly', () => {
      // TODO: Implement actual tests
      expect(true).to.be.true;
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      // TODO: Implement edge case tests
      expect(true).to.be.true;
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid input gracefully', () => {
      // TODO: Implement error handling tests
      expect(true).to.be.true;
    });
  });
});
`;
            } else if (file.includes('/mock-data-test-case/')) {
                // Mock data file
                const nodeName = path.basename(file, '.js');
                content = `// ${file}
/**
 * ${description}
 */

// TODO: Implement mock data generators and test scenarios for ${nodeName}

const createTestData = (scenario) => {
  // TODO: Implement test data creation
  return {};
};

const testScenarios = {
  normal: {
    name: 'Normal Case',
    description: 'Valid data scenario',
    data: createTestData('normal'),
    expectedPass: true
  }
  // TODO: Add more test scenarios
};

module.exports = {
  createTestData,
  testScenarios
};
`;
            } else {
                content = `// ${file}
/**
 * ${description}
 * TODO: Implement functionality
 */

module.exports = {};
`;
            }
        } else if (ext === '.md') {
            content = `# ${description}

TODO: Add documentation

## Overview

This file contains ${description.toLowerCase()}.

## Usage

TODO: Add usage instructions

## Examples

TODO: Add examples
`;
        } else if (file === '.eslintrc.js') {
            content = `module.exports = {
  env: {
    node: true,
    es2021: true,
    mocha: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    'prefer-const': 'error'
  }
};
`;
        } else if (file === 'mocha.opts') {
            content = `--recursive
--reporter spec
--timeout 5000
--exit
--colors
test/**/*.test.js
`;
        }

        try {
            fs.writeFileSync(file, content);
            console.log(`✅ Created: ${file}`);
        } catch (error) {
            console.log(`❌ Failed to create: ${file} - ${error.message}`);
        }
    });
}

function generateSummary(existingFiles, missingFiles) {
    console.log('\n📊 Project Structure Summary:');
    console.log(`✅ Existing files: ${existingFiles.length}`);
    console.log(`📝 Created files: ${missingFiles.length}`);
    console.log(`📁 Total directories: ${directories.length}`);
    console.log(`📄 Total files: ${Object.keys(files).length}`);

    console.log('\n🚀 Next Steps:');
    console.log('1. Run "npm install" to install dependencies');
    console.log('2. Implement the actual functions extracted from N8N nodes');
    console.log('3. Add comprehensive test cases for each node');
    console.log('4. Run "npm test" to validate implementation');
    console.log('5. Update documentation as needed');

    console.log('\n📋 File Categories:');
    console.log(`   Source nodes: ${Object.keys(files).filter(f => f.includes('src/nodes/')).length}`);
    console.log(`   Test files: ${Object.keys(files).filter(f => f.includes('test/nodes/')).length}`);
    console.log(`   Mock data: ${Object.keys(files).filter(f => f.includes('mock-data-test-case/')).length}`);
    console.log(`   Config files: ${Object.keys(files).filter(f => !f.includes('src/') && !f.includes('test/')).length}`);
}

function main() {
    console.log('🎯 IDX Signal Modular - Project Structure Creator\n');

    // Create directories
    createDirectories();

    // Check existing files
    const { missingFiles, existingFiles } = checkFiles();

    // Create missing files
    if (missingFiles.length > 0) {
        createPlaceholderFiles(missingFiles);
    } else {
        console.log('\n🎉 All files already exist!');
    }

    // Generate summary
    generateSummary(existingFiles, missingFiles);

    console.log('\n✨ Project structure setup completed!');
}

if (require.main === module) {
    main();
}

module.exports = {
    createDirectories,
    checkFiles,
    createPlaceholderFiles,
    directories,
    files
};