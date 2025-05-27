#!/usr/bin/env node

/**
 * Test script for CSV Update Management System
 * This demonstrates how the system works with our bookstore data
 */

import { createUpdateManager, createBookstoreRebuildHooks, formatUpdateManagerStatus } from '../src/utils/csvUpdateManager.js';
import { formatChangeLogSummary } from '../src/utils/csvChangeLog.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testCSVMonitoring() {
  console.log('🔍 Testing CSV Update Management System\n');

  // Create update manager
  const updateManager = createUpdateManager({
    logDirectory: path.join(__dirname, '..', 'logs'),
    autoValidate: true,
    enableNotifications: true
  });

  // Initialize
  await updateManager.initialize();
  console.log('✅ Update manager initialized');

  // Register bookstore-specific rebuild hooks
  const hooks = createBookstoreRebuildHooks();
  hooks.forEach(hook => {
    updateManager.registerRebuildHook(hook);
    console.log(`📌 Registered hook: ${hook.name}`);
  });

  // Set up event listeners
  updateManager.on('csvChange', ({ event, entry }) => {
    console.log(`\n📝 CSV Change Detected:`);
    console.log(`   Type: ${event.type.toUpperCase()}`);
    console.log(`   File: ${path.basename(event.filename)}`);
    console.log(`   Time: ${event.timestamp.toLocaleString()}`);
    if (event.stats) {
      console.log(`   Size: ${(event.stats.size / 1024).toFixed(1)}KB`);
    }
    if (entry.metadata?.rowCount) {
      console.log(`   Rows: ${entry.metadata.rowCount}`);
    }
  });

  updateManager.on('hookExecuted', ({ hookName, success, error }) => {
    if (success) {
      console.log(`   ✅ Hook '${hookName}' executed successfully`);
    } else {
      console.log(`   ❌ Hook '${hookName}' failed: ${error}`);
    }
  });

  updateManager.on('error', ({ message }) => {
    console.log(`   ⚠️  Error: ${message}`);
  });

  // Watch our bookstore CSV file
  const csvPath = path.join(__dirname, '..', 'src', 'data', 'bookstores.csv');
  
  try {
    await updateManager.watchFile(csvPath);
    console.log(`👀 Watching: ${path.basename(csvPath)}`);
  } catch (error) {
    console.log(`❌ Failed to watch CSV file: ${error.message}`);
    console.log(`   Looking for: ${csvPath}`);
    console.log(`   Make sure the file exists to test monitoring`);
  }

  // Display current status
  console.log('\n📊 Current Status:');
  const status = await updateManager.getStatus();
  console.log(formatUpdateManagerStatus(status));

  // Display change log summary
  console.log('\n📈 Change Log Summary:');
  const summary = await updateManager.getChangeLogSummary();
  console.log(formatChangeLogSummary(summary));

  // Display recent changes
  console.log('\n📋 Recent Changes:');
  const recentChanges = await updateManager.getRecentChanges(5);
  if (recentChanges.length === 0) {
    console.log('   No changes recorded yet');
  } else {
    recentChanges.forEach((change, index) => {
      console.log(`   ${index + 1}. [${change.timestamp.toLocaleString()}] ${change.changeType.toUpperCase()}: ${path.basename(change.filename)}`);
    });
  }

  console.log('\n🎯 Monitoring is now active!');
  console.log('Try modifying the CSV file to see change detection in action.');
  console.log('Press Ctrl+C to stop monitoring.\n');

  // Keep the process running
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping CSV monitoring...');
    updateManager.unwatchAll();
    
    // Show final status
    const finalStatus = await updateManager.getStatus();
    console.log('\n📊 Final Status:');
    console.log(formatUpdateManagerStatus(finalStatus));
    
    console.log('\n✅ CSV monitoring stopped. Goodbye!');
    process.exit(0);
  });

  // Demonstrate validation
  if (status.watchedFiles.length > 0) {
    console.log('🔍 Testing file validation...');
    const validation = await updateManager.validateFile(csvPath);
    console.log(`   Valid: ${validation.isValid ? '✅' : '❌'}`);
    if (validation.headers) {
      console.log(`   Headers: ${validation.headers.length} columns`);
      console.log(`   Sample: ${validation.headers.slice(0, 3).join(', ')}...`);
    }
    if (validation.rowCount) {
      console.log(`   Rows: ${validation.rowCount}`);
    }
    if (validation.errors) {
      console.log(`   Errors: ${validation.errors.join(', ')}`);
    }
  }

  // Keep process alive
  setInterval(() => {
    // Just keep the process running
  }, 1000);
}

// Run the test
testCSVMonitoring().catch(error => {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}); 