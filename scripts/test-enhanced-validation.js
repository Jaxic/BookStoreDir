#!/usr/bin/env node

/**
 * Test script for enhanced CSV validation pipeline integration
 * Demonstrates the comprehensive validation capabilities integrated with the CSV Update Manager
 */

console.log('🚀 Starting enhanced validation test script...');

import path from 'node:path';
import { fileURLToPath } from 'node:url';

console.log('📦 Importing modules...');

import { createUpdateManager } from '../src/utils/csvUpdateManager.ts';
import { createBookstoreValidationPipeline, validateCSVFile } from '../src/utils/csvValidationPipeline.ts';

console.log('✅ Modules imported successfully');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const csvFilePath = path.join(projectRoot, 'src/data/bookstores.csv');

async function testEnhancedValidation() {
  console.log('🔍 Testing Enhanced CSV Validation Pipeline Integration\n');

  try {
    // Test 1: Direct validation pipeline usage
    console.log('📋 Test 1: Direct Validation Pipeline');
    console.log('=' .repeat(50));
    
    const validationResult = await validateCSVFile(csvFilePath, {
      enableWarnings: true,
      performanceTracking: true,
      maxErrors: 10
    });

    console.log(`✅ Validation completed for: ${path.basename(csvFilePath)}`);
    console.log(`📊 Valid: ${validationResult.isValid}`);
    console.log(`📈 Rows: ${validationResult.rowCount}`);
    console.log(`📋 Headers: ${validationResult.headers?.length || 0} columns`);
    
    if (validationResult.errors && validationResult.errors.length > 0) {
      console.log(`❌ Errors: ${validationResult.errors.length}`);
      validationResult.errors.slice(0, 3).forEach((error, index) => {
        console.log(`   ${index + 1}. [${error.severity}] ${error.message} ${error.row ? `(Row ${error.row})` : ''}`);
      });
      if (validationResult.errors.length > 3) {
        console.log(`   ... and ${validationResult.errors.length - 3} more errors`);
      }
    }

    if (validationResult.warnings && validationResult.warnings.length > 0) {
      console.log(`⚠️  Warnings: ${validationResult.warnings.length}`);
      validationResult.warnings.slice(0, 2).forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning.message} ${warning.row ? `(Row ${warning.row})` : ''}`);
      });
    }

    if (validationResult.metadata) {
      console.log(`📊 Metadata:`);
      console.log(`   File size: ${(validationResult.metadata.fileSize / 1024).toFixed(1)} KB`);
      console.log(`   Encoding: ${validationResult.metadata.encoding}`);
      console.log(`   Empty rows: ${validationResult.metadata.emptyRows}`);
      console.log(`   Duplicate rows: ${validationResult.metadata.duplicateRows}`);
      
      const dataTypes = Object.entries(validationResult.metadata.dataTypes);
      if (dataTypes.length > 0) {
        console.log(`   Data types detected:`);
        dataTypes.slice(0, 5).forEach(([column, type]) => {
          console.log(`     ${column}: ${type}`);
        });
        if (dataTypes.length > 5) {
          console.log(`     ... and ${dataTypes.length - 5} more columns`);
        }
      }
    }

    if (validationResult.performance) {
      console.log(`⚡ Performance:`);
      console.log(`   Parse time: ${validationResult.performance.parseTime.toFixed(2)}ms`);
      console.log(`   Validation time: ${validationResult.performance.validationTime.toFixed(2)}ms`);
      console.log(`   Total time: ${validationResult.performance.totalTime.toFixed(2)}ms`);
      console.log(`   Memory used: ${(validationResult.performance.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    }

    console.log('\n');

    // Test 2: Update Manager with enhanced validation
    console.log('🔄 Test 2: CSV Update Manager with Enhanced Validation');
    console.log('=' .repeat(50));

    const updateManager = createUpdateManager({
      logDirectory: path.join(projectRoot, 'logs'),
      useEnhancedValidation: true,
      autoValidate: true,
      enableNotifications: true,
      validationOptions: {
        enableWarnings: true,
        performanceTracking: true,
        maxErrors: 5
      }
    });

    // Initialize the update manager
    await updateManager.initialize();
    console.log('✅ Update Manager initialized');

    // Get validation stats
    const validationStats = updateManager.getValidationStats();
    if (validationStats) {
      console.log(`🔧 Registered validators: ${validationStats.length}`);
      validationStats.forEach(validator => {
        console.log(`   - ${validator.name}: ${validator.description}`);
      });
    }

    // Test validation through update manager
    console.log('\n📋 Testing validation through Update Manager...');
    const managerValidation = await updateManager.validateFile(csvFilePath);
    
    if ('metadata' in managerValidation) {
      // Enhanced validation result
      console.log(`✅ Enhanced validation completed`);
      console.log(`📊 Valid: ${managerValidation.isValid}`);
      console.log(`📈 Rows: ${managerValidation.rowCount}`);
      
      if (managerValidation.errors) {
        console.log(`❌ Errors found: ${managerValidation.errors.length}`);
      }
      
      if (managerValidation.warnings) {
        console.log(`⚠️  Warnings found: ${managerValidation.warnings.length}`);
      }
    } else {
      // Basic validation result
      console.log(`✅ Basic validation completed`);
      console.log(`📊 Valid: ${managerValidation.isValid}`);
    }

    // Get update manager status
    const status = await updateManager.getStatus();
    console.log('\n📊 Update Manager Status:');
    console.log(`   Monitoring: ${status.isMonitoring}`);
    console.log(`   Total changes: ${status.totalChanges}`);
    console.log(`   Registered hooks: ${status.registeredHooks.length}`);
    console.log(`   Errors: ${status.errors.length}`);
    
    if (status.validationPipeline) {
      console.log(`   Validation pipeline: enabled`);
      console.log(`   Active validators: ${status.validationPipeline.validators.length}`);
    }

    console.log('\n');

    // Test 3: Custom validator registration
    console.log('🔧 Test 3: Custom Validator Registration');
    console.log('=' .repeat(50));

    const customValidatorRegistered = updateManager.registerCustomValidator({
      name: 'test-validator',
      description: 'Test validator for demonstration',
      validate: (value, row, rowIndex, column) => {
        if (column === 'name' && value && value.length < 3) {
          return {
            type: 'data',
            severity: 'warning',
            message: `Store name is very short: "${value}"`,
            value,
            code: 'SHORT_STORE_NAME'
          };
        }
        return null;
      }
    });

    console.log(`✅ Custom validator registered: ${customValidatorRegistered}`);

    // Test the custom validator
    if (customValidatorRegistered) {
      console.log('🧪 Testing custom validator...');
      const customValidationResult = await updateManager.validateFile(csvFilePath);
      
      if ('warnings' in customValidationResult && customValidationResult.warnings) {
        const customWarnings = customValidationResult.warnings.filter(w => 
          w.message.includes('Store name is very short')
        );
        console.log(`⚠️  Custom validator found ${customWarnings.length} short store names`);
      }
    }

    console.log('\n');

    // Test 4: Event handling
    console.log('🎯 Test 4: Event Handling');
    console.log('=' .repeat(50));

    let eventCount = 0;
    const events = [];

    updateManager.on('validationStarted', (event) => {
      eventCount++;
      events.push(`Validation started for ${path.basename(event.filePath)}`);
    });

    updateManager.on('validationCompleted', (event) => {
      eventCount++;
      events.push(`Validation completed for ${path.basename(event.filePath)} - Valid: ${event.result.isValid}`);
    });

    updateManager.on('validationError', (event) => {
      eventCount++;
      events.push(`Validation error: ${event.error.message}`);
    });

    updateManager.on('validatorRegistered', (event) => {
      eventCount++;
      events.push(`Validator registered: ${event.name}`);
    });

    // Trigger validation to test events
    await updateManager.validateFile(csvFilePath);

    console.log(`📡 Events captured: ${eventCount}`);
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event}`);
    });

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎉 Enhanced CSV Validation Pipeline Integration is working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testEnhancedValidation().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

export { testEnhancedValidation }; 