#!/usr/bin/env tsx

/**
 * CI/CD Integration Script for CSV Monitoring System
 * Orchestrates validation, backup, diff reporting, and deployment tasks
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createUpdateManager } from '../src/utils/csvUpdateManager.ts';
import { CSVValidationPipeline } from '../src/utils/csvValidationPipeline.ts';
import { createBackupManager } from '../src/utils/csvBackupManager.ts';
import { createCSVDiffEngine, formatDiffStatistics } from '../src/utils/csvDiffEngine.ts';
import { createDiffReportGenerator } from '../src/utils/csvDiffReportGenerator.ts';

interface CICDOptions {
  environment: 'development' | 'staging' | 'production';
  validationLevel: 'basic' | 'comprehensive' | 'full';
  generateReports: boolean;
  createBackups: boolean;
  deploymentMode: boolean;
  outputDirectory: string;
}

interface CICDResult {
  success: boolean;
  validationResults: any[];
  backupResults: any[];
  diffReports: string[];
  errors: string[];
  metrics: {
    totalFiles: number;
    validatedFiles: number;
    backedUpFiles: number;
    generatedReports: number;
    processingTime: number;
  };
}

class CICDIntegration {
  private options: CICDOptions;
  private startTime: number;
  private results: CICDResult;

  constructor(options: Partial<CICDOptions> = {}) {
    this.options = {
      environment: 'development',
      validationLevel: 'comprehensive',
      generateReports: true,
      createBackups: true,
      deploymentMode: false,
      outputDirectory: './ci-cd-output',
      ...options
    };

    this.startTime = Date.now();
    this.results = {
      success: true,
      validationResults: [],
      backupResults: [],
      diffReports: [],
      errors: [],
      metrics: {
        totalFiles: 0,
        validatedFiles: 0,
        backedUpFiles: 0,
        generatedReports: 0,
        processingTime: 0
      }
    };
  }

  /**
   * Main CI/CD integration workflow
   */
  async execute(): Promise<CICDResult> {
    console.log('🚀 Starting CI/CD CSV Monitoring Integration...');
    console.log(`Environment: ${this.options.environment}`);
    console.log(`Validation Level: ${this.options.validationLevel}`);

    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Step 1: Discover CSV files
      const csvFiles = await this.discoverCSVFiles();
      this.results.metrics.totalFiles = csvFiles.length;
      console.log(`📁 Discovered ${csvFiles.length} CSV files`);

      // Step 2: Run validation pipeline
      if (csvFiles.length > 0) {
        await this.runValidationPipeline(csvFiles);
      }

      // Step 3: Create backups
      if (this.options.createBackups && csvFiles.length > 0) {
        await this.createBackups(csvFiles);
      }

      // Step 4: Generate diff reports
      if (this.options.generateReports && csvFiles.length > 0) {
        await this.generateDiffReports(csvFiles);
      }

      // Step 5: Deployment-specific tasks
      if (this.options.deploymentMode) {
        await this.runDeploymentTasks();
      }

      // Step 6: Generate summary report
      await this.generateSummaryReport();

      this.results.metrics.processingTime = Date.now() - this.startTime;
      console.log(`✅ CI/CD integration completed in ${this.results.metrics.processingTime}ms`);

    } catch (error) {
      this.results.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.results.errors.push(errorMessage);
      console.error('❌ CI/CD integration failed:', errorMessage);
    }

    return this.results;
  }

  /**
   * Ensure output directory exists
   */
  private async ensureOutputDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.options.outputDirectory, { recursive: true });
      await fs.mkdir(path.join(this.options.outputDirectory, 'reports'), { recursive: true });
      await fs.mkdir(path.join(this.options.outputDirectory, 'backups'), { recursive: true });
      await fs.mkdir(path.join(this.options.outputDirectory, 'logs'), { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create output directory: ${error}`);
    }
  }

  /**
   * Discover CSV files in the project
   */
  private async discoverCSVFiles(): Promise<string[]> {
    const csvFiles: string[] = [];
    const searchPaths = [
      'data',
      'public/data',
      'src/data',
      'assets/data'
    ];

    for (const searchPath of searchPaths) {
      try {
        const files = await this.findCSVFilesRecursive(searchPath);
        csvFiles.push(...files);
      } catch (error) {
        // Directory might not exist, continue
        console.log(`📂 Directory ${searchPath} not found, skipping...`);
      }
    }

    return [...new Set(csvFiles)]; // Remove duplicates
  }

  /**
   * Recursively find CSV files in a directory
   */
  private async findCSVFilesRecursive(dir: string): Promise<string[]> {
    const csvFiles: string[] = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subFiles = await this.findCSVFilesRecursive(fullPath);
          csvFiles.push(...subFiles);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.csv')) {
          csvFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Directory access error, skip
    }

    return csvFiles;
  }

  /**
   * Run validation pipeline on CSV files
   */
  private async runValidationPipeline(csvFiles: string[]): Promise<void> {
    console.log('🔍 Running CSV validation pipeline...');

    const validationPipeline = new CSVValidationPipeline({
      strictMode: false,
      maxErrors: 100,
      enableWarnings: true
    });

    for (const csvFile of csvFiles) {
      try {
        console.log(`  📊 Validating ${csvFile}...`);
        const result = await validationPipeline.validateFile(csvFile);
        this.results.validationResults.push({
          file: csvFile,
          result,
          timestamp: new Date().toISOString()
        });

        if (result.isValid) {
          this.results.metrics.validatedFiles++;
        } else {
          const errors = result.errors || [];
          this.results.errors.push(`Validation failed for ${csvFile}: ${errors.map(e => e.message).join(', ')}`);
        }
      } catch (error) {
        const errorMessage = `Validation error for ${csvFile}: ${error}`;
        this.results.errors.push(errorMessage);
        console.error(`  ❌ ${errorMessage}`);
      }
    }

    console.log(`✅ Validated ${this.results.metrics.validatedFiles}/${csvFiles.length} files successfully`);
  }

  /**
   * Create backups of CSV files
   */
  private async createBackups(csvFiles: string[]): Promise<void> {
    console.log('💾 Creating CSV backups...');

    const backupManager = createBackupManager({
      backupDirectory: path.join(this.options.outputDirectory, 'backups')
    });

    // Initialize the backup manager
    await backupManager.initialize();

    for (const csvFile of csvFiles) {
      try {
        console.log(`  💾 Backing up ${csvFile}...`);
        const result = await backupManager.createBackup(
          csvFile, 
          `ci-cd-${this.options.environment}`,
          [`ci-cd-${this.options.environment}`, 'automated']
        );

        this.results.backupResults.push({
          file: csvFile,
          backupId: result.backupId,
          timestamp: new Date().toISOString()
        });

        this.results.metrics.backedUpFiles++;
      } catch (error) {
        const errorMessage = `Backup error for ${csvFile}: ${error}`;
        this.results.errors.push(errorMessage);
        console.error(`  ❌ ${errorMessage}`);
      }
    }

    console.log(`✅ Created backups for ${this.results.metrics.backedUpFiles}/${csvFiles.length} files`);
  }

  /**
   * Generate diff reports for CSV files
   */
  private async generateDiffReports(csvFiles: string[]): Promise<void> {
    console.log('📊 Generating CSV diff reports...');

    const diffEngine = createCSVDiffEngine({
      mode: 'hybrid',
      keyColumns: ['id', 'isbn', 'author_id']
    });

    for (const csvFile of csvFiles) {
      try {
        // Check if we have a previous version to compare against
        const backupResult = this.results.backupResults.find(b => b.file === csvFile);
        if (!backupResult) {
          console.log(`  ⏭️ Skipping diff for ${csvFile} (no previous version)`);
          continue;
        }

        console.log(`  📊 Generating diff report for ${csvFile}...`);

        // For CI/CD, we'll compare with the previous backup or a reference file
        // This is a simplified example - in practice, you'd have more sophisticated logic
        const diffResult = await diffEngine.compareFiles(csvFile, csvFile);

        // Generate multiple report formats
        const reportBaseName = path.basename(csvFile, '.csv');
        const reportDir = path.join(this.options.outputDirectory, 'reports', 'diff');
        await fs.mkdir(reportDir, { recursive: true });

        // HTML report
        const htmlReportGenerator = createDiffReportGenerator({
          format: 'html',
          includeStatistics: true,
          theme: 'light'
        });
        const htmlReport = await htmlReportGenerator.generateReport(diffResult);
        const htmlPath = path.join(reportDir, `${reportBaseName}-diff.html`);
        await fs.writeFile(htmlPath, htmlReport);

        // JSON report for programmatic access
        const jsonReportGenerator = createDiffReportGenerator({
          format: 'json',
          includeStatistics: true
        });
        const jsonReport = await jsonReportGenerator.generateReport(diffResult);
        const jsonPath = path.join(reportDir, `${reportBaseName}-diff.json`);
        await fs.writeFile(jsonPath, jsonReport);

        // Markdown summary for GitHub comments
        const markdownReportGenerator = createDiffReportGenerator({
          format: 'markdown',
          includeStatistics: true
        });
        const markdownReport = await markdownReportGenerator.generateReport(diffResult);
        const markdownPath = path.join(reportDir, `${reportBaseName}-diff.md`);
        await fs.writeFile(markdownPath, markdownReport);

        this.results.diffReports.push(htmlPath, jsonPath, markdownPath);
        this.results.metrics.generatedReports += 3;

        console.log(`  ✅ Generated diff reports for ${csvFile}`);
      } catch (error) {
        const errorMessage = `Diff report error for ${csvFile}: ${error}`;
        this.results.errors.push(errorMessage);
        console.error(`  ❌ ${errorMessage}`);
      }
    }

    console.log(`✅ Generated ${this.results.metrics.generatedReports} diff reports`);
  }

  /**
   * Run deployment-specific tasks
   */
  private async runDeploymentTasks(): Promise<void> {
    console.log('🚀 Running deployment-specific tasks...');

    try {
      // Update CSV monitoring configuration for the target environment
      await this.updateMonitoringConfiguration();

      // Generate static assets from CSV data
      await this.generateStaticAssets();

      // Validate deployment readiness
      await this.validateDeploymentReadiness();

      console.log('✅ Deployment tasks completed successfully');
    } catch (error) {
      const errorMessage = `Deployment task error: ${error}`;
      this.results.errors.push(errorMessage);
      console.error(`❌ ${errorMessage}`);
    }
  }

  /**
   * Update monitoring configuration for deployment
   */
  private async updateMonitoringConfiguration(): Promise<void> {
    const configPath = path.join(this.options.outputDirectory, 'monitoring-config.json');
    const config = {
      environment: this.options.environment,
      monitoring: {
        enabled: true,
        checkInterval: this.options.environment === 'production' ? 300000 : 60000, // 5min prod, 1min dev
        validationLevel: this.options.validationLevel,
        backupEnabled: this.options.createBackups,
        reportingEnabled: this.options.generateReports
      },
      deployment: {
        timestamp: new Date().toISOString(),
        version: process.env.GITHUB_SHA || 'unknown',
        branch: process.env.GITHUB_REF_NAME || 'unknown'
      }
    };

    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    console.log(`  📝 Updated monitoring configuration for ${this.options.environment}`);
  }

  /**
   * Generate static assets from CSV data
   */
  private async generateStaticAssets(): Promise<void> {
    // This would typically convert CSV data to JSON or other formats for the web app
    const assetsDir = path.join(this.options.outputDirectory, 'static-assets');
    await fs.mkdir(assetsDir, { recursive: true });

    // Example: Convert CSV files to JSON for web consumption
    const csvFiles = await this.discoverCSVFiles();
    for (const csvFile of csvFiles) {
      try {
        const csvContent = await fs.readFile(csvFile, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length > 0) {
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            return obj;
          });

          const jsonPath = path.join(assetsDir, `${path.basename(csvFile, '.csv')}.json`);
          await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
        }
      } catch (error) {
        console.error(`  ⚠️ Failed to convert ${csvFile} to JSON: ${error}`);
      }
    }

    console.log(`  🏗️ Generated static assets from CSV data`);
  }

  /**
   * Validate deployment readiness
   */
  private async validateDeploymentReadiness(): Promise<void> {
    const issues: string[] = [];

    // Check if all validations passed
    const failedValidations = this.results.validationResults.filter(v => !v.result.isValid);
    if (failedValidations.length > 0) {
      issues.push(`${failedValidations.length} CSV files failed validation`);
    }

    // Check if backups were created successfully
    if (this.options.createBackups && this.results.metrics.backedUpFiles === 0) {
      issues.push('No backups were created');
    }

    // Environment-specific checks
    if (this.options.environment === 'production') {
      if (this.results.errors.length > 0) {
        issues.push('Errors detected - production deployment not recommended');
      }
    }

    if (issues.length > 0) {
      throw new Error(`Deployment readiness check failed: ${issues.join(', ')}`);
    }

    console.log('  ✅ Deployment readiness validated');
  }

  /**
   * Generate comprehensive summary report
   */
  private async generateSummaryReport(): Promise<void> {
    const summaryPath = path.join(this.options.outputDirectory, 'ci-cd-summary.json');
    const summary = {
      ...this.results,
      options: this.options,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        ciEnvironment: {
          githubActions: !!process.env.GITHUB_ACTIONS,
          runId: process.env.GITHUB_RUN_ID,
          repository: process.env.GITHUB_REPOSITORY,
          branch: process.env.GITHUB_REF_NAME,
          sha: process.env.GITHUB_SHA
        }
      }
    };

    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));

    // Also create a human-readable markdown summary
    const markdownSummary = this.generateMarkdownSummary(summary);
    const markdownPath = path.join(this.options.outputDirectory, 'ci-cd-summary.md');
    await fs.writeFile(markdownPath, markdownSummary);

    console.log(`📋 Summary report generated: ${summaryPath}`);
  }

  /**
   * Generate markdown summary for GitHub comments/reports
   */
  private generateMarkdownSummary(summary: any): string {
    const status = summary.success ? '✅ Success' : '❌ Failed';
    const duration = `${summary.metrics.processingTime}ms`;

    return `# CI/CD CSV Monitoring Summary

## ${status}

**Environment:** ${summary.options.environment}  
**Duration:** ${duration}  
**Timestamp:** ${summary.timestamp}

## Metrics

| Metric | Value |
|--------|-------|
| Total CSV Files | ${summary.metrics.totalFiles} |
| Validated Files | ${summary.metrics.validatedFiles} |
| Backed Up Files | ${summary.metrics.backedUpFiles} |
| Generated Reports | ${summary.metrics.generatedReports} |
| Errors | ${summary.errors.length} |

## Validation Results

${summary.validationResults.length > 0 ? 
  summary.validationResults.map((v: any) => 
    `- **${v.file}**: ${v.result.isValid ? '✅ Valid' : '❌ Invalid'}`
  ).join('\n') : 
  'No validation results'
}

## Backup Results

${summary.backupResults.length > 0 ? 
  summary.backupResults.map((b: any) => 
    `- **${b.file}**: Backup ID \`${b.backupId}\``
  ).join('\n') : 
  'No backups created'
}

## Generated Reports

${summary.diffReports.length > 0 ? 
  summary.diffReports.map((r: string) => `- ${r}`).join('\n') : 
  'No diff reports generated'
}

${summary.errors.length > 0 ? `
## Errors

${summary.errors.map((e: string) => `- ${e}`).join('\n')}
` : ''}

---
*Generated by CI/CD CSV Monitoring Integration*
`;
  }
}

/**
 * CLI interface for the CI/CD integration
 */
async function main() {
  const args = process.argv.slice(2);
  const options: Partial<CICDOptions> = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];

    switch (key) {
      case 'environment':
        options.environment = value as 'development' | 'staging' | 'production';
        break;
      case 'validation-level':
        options.validationLevel = value as 'basic' | 'comprehensive' | 'full';
        break;
      case 'generate-reports':
        options.generateReports = value === 'true';
        break;
      case 'create-backups':
        options.createBackups = value === 'true';
        break;
      case 'deployment-mode':
        options.deploymentMode = value === 'true';
        break;
      case 'output-directory':
        options.outputDirectory = value;
        break;
    }
  }

  const integration = new CICDIntegration(options);
  const result = await integration.execute();

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Export for programmatic use
export { CICDIntegration, type CICDOptions, type CICDResult };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
} 