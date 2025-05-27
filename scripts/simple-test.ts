#!/usr/bin/env tsx

/**
 * Simple test to verify TypeScript imports work
 */

console.log('🔍 Starting simple validation test...');

try {
  const { createBookstoreValidationPipeline } = await import('../src/utils/csvValidationPipeline.ts');
  console.log('✅ Successfully imported csvValidationPipeline');
  
  const { createUpdateManager } = await import('../src/utils/csvUpdateManager.ts');
  console.log('✅ Successfully imported csvUpdateManager');
  
  console.log('🎉 All imports successful!');
  
  // Test basic validation with bookstore-specific schema
  const csvPath = './src/data/bookstores.csv';
  console.log(`📋 Testing validation of: ${csvPath}`);
  
  const pipeline = createBookstoreValidationPipeline({
    enableWarnings: false,
    performanceTracking: true,
    maxErrors: 5
  });
  
  // Debug: Check what schema is being used
  console.log('🔧 Pipeline created, checking schema...');
  
  // Access the private options to see the schema (for debugging)
  const pipelineAny = pipeline as any;
  if (pipelineAny.options && pipelineAny.options.schema) {
    console.log('📋 Schema required fields:', pipelineAny.options.schema.required);
    console.log('📋 Schema properties keys:', Object.keys(pipelineAny.options.schema.properties || {}));
  } else {
    console.log('❌ No schema found in pipeline options');
  }
  
  console.log('🔧 Running validation...');
  
  const result = await pipeline.validateFile(csvPath);
  
  console.log(`✅ Validation completed`);
  console.log(`📊 Valid: ${result.isValid}`);
  console.log(`📈 Rows: ${result.rowCount || 'unknown'}`);
  console.log(`📋 Headers: ${result.headers?.length || 0} columns`);
  
  if (result.headers) {
    console.log(`📝 First 10 headers: ${result.headers.slice(0, 10).join(', ')}`);
  }
  
  if (result.errors && result.errors.length > 0) {
    console.log(`❌ Errors: ${result.errors.length}`);
    result.errors.slice(0, 3).forEach((error, index) => {
      console.log(`   ${index + 1}. [${error.severity}] ${error.message} (Row: ${error.row}, Column: ${error.column})`);
    });
  } else {
    console.log(`✅ No validation errors found!`);
  }
  
  if (result.performance) {
    console.log(`⚡ Performance: ${result.performance.totalTime.toFixed(2)}ms`);
  }
  
} catch (error) {
  console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
  if (error instanceof Error) {
    console.error(error.stack);
  }
  process.exit(1);
}

// Make this file a module
export {}; 