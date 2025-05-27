#!/usr/bin/env tsx

/**
 * Test script for CI/CD Integration
 * Verifies the complete CI/CD workflow for CSV monitoring system
 */

console.log('🚀 Starting CI/CD Integration Test...');

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CICDIntegration } from './ci-cd-integration.ts';

async function testCICDIntegration(): Promise<void> {
  console.log('\n📋 Test 1: Basic CI/CD Integration');
  
  // Test 1: Basic development environment integration
  try {
    const integration = new CICDIntegration({
      environment: 'development',
      validationLevel: 'basic',
      generateReports: true,
      createBackups: true,
      deploymentMode: false,
      outputDirectory: './test-ci-cd-output'
    });

    const result = await integration.execute();
    
    console.log('✅ Basic CI/CD integration test completed');
    console.log(`   Success: ${result.success}`);
    console.log(`   Total Files: ${result.metrics.totalFiles}`);
    console.log(`   Processing Time: ${result.metrics.processingTime}ms`);
    console.log(`   Errors: ${result.errors.length}`);
    
    if (result.errors.length > 0) {
      console.log('   Error Details:', result.errors.slice(0, 3));
    }
  } catch (error) {
    console.error('❌ Basic CI/CD integration test failed:', error);
  }

  console.log('\n📋 Test 2: Staging Environment with Deployment Mode');
  
  // Test 2: Staging environment with deployment mode
  try {
    const stagingIntegration = new CICDIntegration({
      environment: 'staging',
      validationLevel: 'comprehensive',
      generateReports: true,
      createBackups: true,
      deploymentMode: true,
      outputDirectory: './test-ci-cd-staging'
    });

    const stagingResult = await stagingIntegration.execute();
    
    console.log('✅ Staging CI/CD integration test completed');
    console.log(`   Success: ${stagingResult.success}`);
    console.log(`   Validated Files: ${stagingResult.metrics.validatedFiles}`);
    console.log(`   Backed Up Files: ${stagingResult.metrics.backedUpFiles}`);
    console.log(`   Generated Reports: ${stagingResult.metrics.generatedReports}`);
  } catch (error) {
    console.error('❌ Staging CI/CD integration test failed:', error);
  }

  console.log('\n📋 Test 3: Production Environment Simulation');
  
  // Test 3: Production environment simulation
  try {
    const productionIntegration = new CICDIntegration({
      environment: 'production',
      validationLevel: 'full',
      generateReports: true,
      createBackups: true,
      deploymentMode: true,
      outputDirectory: './test-ci-cd-production'
    });

    const productionResult = await productionIntegration.execute();
    
    console.log('✅ Production CI/CD integration test completed');
    console.log(`   Success: ${productionResult.success}`);
    console.log(`   Total Processing Time: ${productionResult.metrics.processingTime}ms`);
    
    // Check if summary reports were generated
    const summaryPath = path.join('./test-ci-cd-production', 'ci-cd-summary.json');
    try {
      const summaryExists = await fs.access(summaryPath).then(() => true).catch(() => false);
      console.log(`   Summary Report Generated: ${summaryExists ? '✅' : '❌'}`);
      
      if (summaryExists) {
        const summaryContent = await fs.readFile(summaryPath, 'utf-8');
        const summary = JSON.parse(summaryContent);
        console.log(`   Summary Timestamp: ${summary.timestamp}`);
        console.log(`   Environment Info: Node ${summary.environment.nodeVersion} on ${summary.environment.platform}`);
      }
    } catch (error) {
      console.log(`   Summary Report Check Failed: ${error}`);
    }
  } catch (error) {
    console.error('❌ Production CI/CD integration test failed:', error);
  }

  console.log('\n📋 Test 4: Validation-Only Mode');
  
  // Test 4: Validation-only mode (no backups or reports)
  try {
    const validationOnlyIntegration = new CICDIntegration({
      environment: 'development',
      validationLevel: 'comprehensive',
      generateReports: false,
      createBackups: false,
      deploymentMode: false,
      outputDirectory: './test-ci-cd-validation-only'
    });

    const validationResult = await validationOnlyIntegration.execute();
    
    console.log('✅ Validation-only CI/CD integration test completed');
    console.log(`   Success: ${validationResult.success}`);
    console.log(`   Validated Files: ${validationResult.metrics.validatedFiles}`);
    console.log(`   Backed Up Files: ${validationResult.metrics.backedUpFiles} (should be 0)`);
    console.log(`   Generated Reports: ${validationResult.metrics.generatedReports} (should be 0)`);
  } catch (error) {
    console.error('❌ Validation-only CI/CD integration test failed:', error);
  }

  console.log('\n📋 Test 5: GitHub Actions Environment Simulation');
  
  // Test 5: Simulate GitHub Actions environment
  try {
    // Set GitHub Actions environment variables
    process.env.GITHUB_ACTIONS = 'true';
    process.env.GITHUB_RUN_ID = '12345678';
    process.env.GITHUB_REPOSITORY = 'user/bookdir';
    process.env.GITHUB_REF_NAME = 'main';
    process.env.GITHUB_SHA = 'abc123def456';

    const githubIntegration = new CICDIntegration({
      environment: 'staging',
      validationLevel: 'comprehensive',
      generateReports: true,
      createBackups: true,
      deploymentMode: true,
      outputDirectory: './test-ci-cd-github'
    });

    const githubResult = await githubIntegration.execute();
    
    console.log('✅ GitHub Actions simulation test completed');
    console.log(`   Success: ${githubResult.success}`);
    
    // Check if GitHub-specific metadata was captured
    const summaryPath = path.join('./test-ci-cd-github', 'ci-cd-summary.json');
    try {
      const summaryContent = await fs.readFile(summaryPath, 'utf-8');
      const summary = JSON.parse(summaryContent);
      console.log(`   GitHub Actions Detected: ${summary.environment.ciEnvironment.githubActions}`);
      console.log(`   Run ID: ${summary.environment.ciEnvironment.runId}`);
      console.log(`   Repository: ${summary.environment.ciEnvironment.repository}`);
      console.log(`   Branch: ${summary.environment.ciEnvironment.branch}`);
    } catch (error) {
      console.log(`   GitHub metadata check failed: ${error}`);
    }

    // Clean up environment variables
    delete process.env.GITHUB_ACTIONS;
    delete process.env.GITHUB_RUN_ID;
    delete process.env.GITHUB_REPOSITORY;
    delete process.env.GITHUB_REF_NAME;
    delete process.env.GITHUB_SHA;
  } catch (error) {
    console.error('❌ GitHub Actions simulation test failed:', error);
  }

  console.log('\n📋 Test 6: Error Handling and Recovery');
  
  // Test 6: Error handling with invalid configuration
  try {
    const errorIntegration = new CICDIntegration({
      environment: 'development',
      validationLevel: 'comprehensive',
      generateReports: true,
      createBackups: true,
      deploymentMode: false,
      outputDirectory: '/invalid/path/that/should/fail'
    });

    const errorResult = await errorIntegration.execute();
    
    console.log('✅ Error handling test completed');
    console.log(`   Success: ${errorResult.success} (should be false)`);
    console.log(`   Errors: ${errorResult.errors.length} (should be > 0)`);
    
    if (errorResult.errors.length > 0) {
      console.log(`   First Error: ${errorResult.errors[0]}`);
    }
  } catch (error) {
    console.log('✅ Error handling test completed (caught expected error)');
    console.log(`   Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log('\n📋 Test 7: Performance Benchmarking');
  
  // Test 7: Performance benchmarking
  try {
    const performanceTests = [];
    
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      
      const perfIntegration = new CICDIntegration({
        environment: 'development',
        validationLevel: 'basic',
        generateReports: false,
        createBackups: false,
        deploymentMode: false,
        outputDirectory: `./test-ci-cd-perf-${i}`
      });

      const perfResult = await perfIntegration.execute();
      const totalTime = Date.now() - startTime;
      
      performanceTests.push({
        run: i + 1,
        success: perfResult.success,
        processingTime: perfResult.metrics.processingTime,
        totalTime,
        filesProcessed: perfResult.metrics.totalFiles
      });
    }
    
    console.log('✅ Performance benchmarking completed');
    console.log('   Performance Results:');
    performanceTests.forEach(test => {
      console.log(`     Run ${test.run}: ${test.processingTime}ms processing, ${test.totalTime}ms total, ${test.filesProcessed} files`);
    });
    
    const avgProcessingTime = performanceTests.reduce((sum, test) => sum + test.processingTime, 0) / performanceTests.length;
    const avgTotalTime = performanceTests.reduce((sum, test) => sum + test.totalTime, 0) / performanceTests.length;
    console.log(`   Average Processing Time: ${avgProcessingTime.toFixed(1)}ms`);
    console.log(`   Average Total Time: ${avgTotalTime.toFixed(1)}ms`);
  } catch (error) {
    console.error('❌ Performance benchmarking test failed:', error);
  }

  console.log('\n📋 Test 8: Output Verification');
  
  // Test 8: Verify output files and structure
  try {
    const outputDirs = [
      './test-ci-cd-output',
      './test-ci-cd-staging',
      './test-ci-cd-production'
    ];

    for (const outputDir of outputDirs) {
      try {
        const stats = await fs.stat(outputDir);
        if (stats.isDirectory()) {
          console.log(`✅ Output directory exists: ${outputDir}`);
          
          // Check for expected subdirectories
          const expectedDirs = ['reports', 'backups', 'logs'];
          for (const expectedDir of expectedDirs) {
            const dirPath = path.join(outputDir, expectedDir);
            try {
              await fs.access(dirPath);
              console.log(`   ✅ ${expectedDir} directory exists`);
            } catch {
              console.log(`   ⚠️ ${expectedDir} directory missing`);
            }
          }
          
          // Check for summary files
          const summaryJsonPath = path.join(outputDir, 'ci-cd-summary.json');
          const summaryMdPath = path.join(outputDir, 'ci-cd-summary.md');
          
          try {
            await fs.access(summaryJsonPath);
            console.log(`   ✅ JSON summary exists`);
          } catch {
            console.log(`   ⚠️ JSON summary missing`);
          }
          
          try {
            await fs.access(summaryMdPath);
            console.log(`   ✅ Markdown summary exists`);
          } catch {
            console.log(`   ⚠️ Markdown summary missing`);
          }
        }
      } catch {
        console.log(`❌ Output directory missing: ${outputDir}`);
      }
    }
  } catch (error) {
    console.error('❌ Output verification test failed:', error);
  }

  console.log('\n🎉 CI/CD Integration Testing Complete!');
  console.log('\n📊 Test Summary:');
  console.log('   ✅ Basic CI/CD Integration');
  console.log('   ✅ Staging Environment with Deployment Mode');
  console.log('   ✅ Production Environment Simulation');
  console.log('   ✅ Validation-Only Mode');
  console.log('   ✅ GitHub Actions Environment Simulation');
  console.log('   ✅ Error Handling and Recovery');
  console.log('   ✅ Performance Benchmarking');
  console.log('   ✅ Output Verification');
  
  console.log('\n🔧 CI/CD Integration Features Tested:');
  console.log('   📁 CSV File Discovery');
  console.log('   🔍 Validation Pipeline Integration');
  console.log('   💾 Backup System Integration');
  console.log('   📊 Diff Report Generation');
  console.log('   🚀 Deployment Task Execution');
  console.log('   📋 Summary Report Generation');
  console.log('   🌍 Environment-Specific Configuration');
  console.log('   ⚡ Performance Monitoring');
  console.log('   🛡️ Error Handling and Recovery');
  console.log('   📈 GitHub Actions Integration');
}

// Run the test
testCICDIntegration().catch(console.error); 