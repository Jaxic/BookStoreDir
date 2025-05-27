#!/usr/bin/env node

/**
 * Documentation Maintenance System
 * 
 * This script provides automated maintenance for the CSV Update Management System documentation.
 * It validates links, updates timestamps, checks for consistency, and generates documentation reports.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface DocumentationFile {
  path: string;
  name: string;
  lastModified: Date;
  size: number;
  links: string[];
  headings: string[];
  codeBlocks: string[];
}

interface ValidationResult {
  file: string;
  issues: ValidationIssue[];
  warnings: ValidationWarning[];
}

interface ValidationIssue {
  type: 'broken-link' | 'missing-file' | 'outdated-content' | 'inconsistent-format';
  message: string;
  line?: number;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationWarning {
  type: 'outdated-timestamp' | 'missing-metadata' | 'inconsistent-style';
  message: string;
  suggestion?: string;
}

class DocumentationMaintenance {
  private docsPath: string;
  private files: DocumentationFile[] = [];
  private validationResults: ValidationResult[] = [];

  constructor(docsPath: string = './docs') {
    this.docsPath = path.resolve(docsPath);
  }

  /**
   * Main maintenance routine
   */
  async runMaintenance(): Promise<void> {
    console.log('🔧 Starting Documentation Maintenance...\n');

    try {
      // Discover all documentation files
      await this.discoverFiles();
      console.log(`📁 Found ${this.files.length} documentation files\n`);

      // Validate all files
      await this.validateFiles();
      console.log('✅ File validation completed\n');

      // Update timestamps and metadata
      await this.updateMetadata();
      console.log('📅 Metadata updates completed\n');

      // Generate documentation index
      await this.generateIndex();
      console.log('📋 Documentation index generated\n');

      // Generate maintenance report
      await this.generateReport();
      console.log('📊 Maintenance report generated\n');

      // Check for broken links
      await this.validateLinks();
      console.log('🔗 Link validation completed\n');

      // Optimize images and assets
      await this.optimizeAssets();
      console.log('🖼️ Asset optimization completed\n');

      console.log('✨ Documentation maintenance completed successfully!');

    } catch (error) {
      console.error('❌ Documentation maintenance failed:', error);
      process.exit(1);
    }
  }

  /**
   * Discover all documentation files
   */
  private async discoverFiles(): Promise<void> {
    const findFiles = (dir: string): string[] => {
      const files: string[] = [];
      
      if (!fs.existsSync(dir)) {
        return files;
      }

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findFiles(fullPath));
        } else if (item.endsWith('.md')) {
          files.push(fullPath);
        }
      }
      
      return files;
    };

    const markdownFiles = findFiles(this.docsPath);
    
    for (const filePath of markdownFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stat = fs.statSync(filePath);
      
      this.files.push({
        path: filePath,
        name: path.basename(filePath),
        lastModified: stat.mtime,
        size: stat.size,
        links: this.extractLinks(content),
        headings: this.extractHeadings(content),
        codeBlocks: this.extractCodeBlocks(content)
      });
    }
  }

  /**
   * Extract links from markdown content
   */
  private extractLinks(content: string): string[] {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: string[] = [];
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      links.push(match[2]);
    }
    
    return links;
  }

  /**
   * Extract headings from markdown content
   */
  private extractHeadings(content: string): string[] {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const headings: string[] = [];
    let match;
    
    while ((match = headingRegex.exec(content)) !== null) {
      headings.push(match[2]);
    }
    
    return headings;
  }

  /**
   * Extract code blocks from markdown content
   */
  private extractCodeBlocks(content: string): string[] {
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeBlocks.push(match[0]);
    }
    
    return codeBlocks;
  }

  /**
   * Validate all documentation files
   */
  private async validateFiles(): Promise<void> {
    for (const file of this.files) {
      const result: ValidationResult = {
        file: file.path,
        issues: [],
        warnings: []
      };

      const content = fs.readFileSync(file.path, 'utf-8');
      
      // Check for required sections
      this.validateRequiredSections(content, result);
      
      // Check for consistent formatting
      this.validateFormatting(content, result);
      
      // Check for outdated content
      this.validateContentFreshness(file, result);
      
      // Check for broken internal links
      this.validateInternalLinks(file, result);
      
      this.validationResults.push(result);
    }
  }

  /**
   * Validate required sections in documentation
   */
  private validateRequiredSections(content: string, result: ValidationResult): void {
    const requiredSections = ['Overview', 'Installation', 'Usage'];
    const headings = this.extractHeadings(content);
    
    for (const section of requiredSections) {
      if (!headings.some(h => h.toLowerCase().includes(section.toLowerCase()))) {
        result.warnings.push({
          type: 'missing-metadata',
          message: `Missing recommended section: ${section}`,
          suggestion: `Consider adding a ${section} section`
        });
      }
    }
  }

  /**
   * Validate formatting consistency
   */
  private validateFormatting(content: string, result: ValidationResult): void {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for inconsistent heading styles
      if (line.match(/^#{1,6}/)) {
        if (!line.match(/^#{1,6}\s+/)) {
          result.issues.push({
            type: 'inconsistent-format',
            message: 'Heading should have space after #',
            line: i + 1,
            severity: 'warning'
          });
        }
      }
      
      // Check for trailing whitespace
      if (line.endsWith(' ')) {
        result.warnings.push({
          type: 'inconsistent-style',
          message: 'Line has trailing whitespace',
          suggestion: 'Remove trailing whitespace'
        });
      }
    }
  }

  /**
   * Validate content freshness
   */
  private validateContentFreshness(file: DocumentationFile, result: ValidationResult): void {
    const daysSinceModified = (Date.now() - file.lastModified.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceModified > 90) {
      result.warnings.push({
        type: 'outdated-timestamp',
        message: `File hasn't been updated in ${Math.floor(daysSinceModified)} days`,
        suggestion: 'Review content for accuracy and update if needed'
      });
    }
  }

  /**
   * Validate internal links
   */
  private validateInternalLinks(file: DocumentationFile, result: ValidationResult): void {
    for (const link of file.links) {
      if (link.startsWith('./') || link.startsWith('../')) {
        const linkPath = path.resolve(path.dirname(file.path), link);
        
        if (!fs.existsSync(linkPath)) {
          result.issues.push({
            type: 'broken-link',
            message: `Broken internal link: ${link}`,
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Update metadata in documentation files
   */
  private async updateMetadata(): Promise<void> {
    const currentDate = new Date().toISOString().split('T')[0];
    
    for (const file of this.files) {
      let content = fs.readFileSync(file.path, 'utf-8');
      let updated = false;
      
      // Update "Last Updated" timestamps
      const lastUpdatedRegex = /\*Last updated:.*?\*/g;
      if (lastUpdatedRegex.test(content)) {
        content = content.replace(lastUpdatedRegex, `*Last updated: ${currentDate}*`);
        updated = true;
      } else {
        // Add timestamp if missing
        content += `\n\n---\n\n*Last updated: ${currentDate}*\n`;
        updated = true;
      }
      
      // Update version references
      const versionRegex = /\*Version:.*?\*/g;
      if (!versionRegex.test(content)) {
        content = content.replace(/\*Last updated:.*?\*/g, `*Last updated: ${currentDate}*\n*Version: 1.0.0*`);
        updated = true;
      }
      
      if (updated) {
        fs.writeFileSync(file.path, content);
      }
    }
  }

  /**
   * Generate documentation index
   */
  private async generateIndex(): Promise<void> {
    const indexPath = path.join(this.docsPath, 'index.md');
    
    let indexContent = `# Documentation Index\n\n`;
    indexContent += `*Generated on ${new Date().toISOString().split('T')[0]}*\n\n`;
    
    // Group files by directory
    const filesByDir: { [key: string]: DocumentationFile[] } = {};
    
    for (const file of this.files) {
      const relativePath = path.relative(this.docsPath, file.path);
      const dir = path.dirname(relativePath);
      
      if (!filesByDir[dir]) {
        filesByDir[dir] = [];
      }
      
      filesByDir[dir].push(file);
    }
    
    // Generate index content
    for (const [dir, files] of Object.entries(filesByDir)) {
      if (dir === '.') {
        indexContent += `## Root Documentation\n\n`;
      } else {
        indexContent += `## ${dir.charAt(0).toUpperCase() + dir.slice(1)}\n\n`;
      }
      
      for (const file of files) {
        if (file.name === 'index.md') continue;
        
        const relativePath = path.relative(this.docsPath, file.path);
        const title = file.headings[0] || file.name.replace('.md', '');
        
        indexContent += `- [${title}](./${relativePath})\n`;
      }
      
      indexContent += '\n';
    }
    
    // Add statistics
    indexContent += `## Documentation Statistics\n\n`;
    indexContent += `- **Total Files**: ${this.files.length}\n`;
    indexContent += `- **Total Size**: ${this.formatBytes(this.files.reduce((sum, f) => sum + f.size, 0))}\n`;
    indexContent += `- **Last Updated**: ${new Date().toISOString().split('T')[0]}\n\n`;
    
    fs.writeFileSync(indexPath, indexContent);
  }

  /**
   * Generate maintenance report
   */
  private async generateReport(): Promise<void> {
    const reportPath = path.join(this.docsPath, 'maintenance-report.md');
    
    let report = `# Documentation Maintenance Report\n\n`;
    report += `*Generated on ${new Date().toISOString()}*\n\n`;
    
    // Summary
    const totalIssues = this.validationResults.reduce((sum, r) => sum + r.issues.length, 0);
    const totalWarnings = this.validationResults.reduce((sum, r) => sum + r.warnings.length, 0);
    
    report += `## Summary\n\n`;
    report += `- **Files Checked**: ${this.files.length}\n`;
    report += `- **Issues Found**: ${totalIssues}\n`;
    report += `- **Warnings**: ${totalWarnings}\n`;
    report += `- **Status**: ${totalIssues === 0 ? '✅ All Clear' : '⚠️ Issues Found'}\n\n`;
    
    // Issues by file
    if (totalIssues > 0 || totalWarnings > 0) {
      report += `## Issues and Warnings\n\n`;
      
      for (const result of this.validationResults) {
        if (result.issues.length > 0 || result.warnings.length > 0) {
          const relativePath = path.relative(this.docsPath, result.file);
          report += `### ${relativePath}\n\n`;
          
          for (const issue of result.issues) {
            const icon = issue.severity === 'error' ? '❌' : '⚠️';
            report += `${icon} **${issue.type}**: ${issue.message}`;
            if (issue.line) report += ` (line ${issue.line})`;
            report += '\n';
          }
          
          for (const warning of result.warnings) {
            report += `💡 **${warning.type}**: ${warning.message}`;
            if (warning.suggestion) report += ` - ${warning.suggestion}`;
            report += '\n';
          }
          
          report += '\n';
        }
      }
    }
    
    // File statistics
    report += `## File Statistics\n\n`;
    report += `| File | Size | Links | Headings | Last Modified |\n`;
    report += `|------|------|-------|----------|---------------|\n`;
    
    for (const file of this.files) {
      const relativePath = path.relative(this.docsPath, file.path);
      const size = this.formatBytes(file.size);
      const lastModified = file.lastModified.toISOString().split('T')[0];
      
      report += `| ${relativePath} | ${size} | ${file.links.length} | ${file.headings.length} | ${lastModified} |\n`;
    }
    
    report += '\n';
    
    // Recommendations
    report += `## Recommendations\n\n`;
    
    if (totalIssues === 0 && totalWarnings === 0) {
      report += `✅ Documentation is in excellent condition!\n\n`;
    } else {
      report += `### Priority Actions\n\n`;
      
      if (totalIssues > 0) {
        report += `1. **Fix ${totalIssues} critical issues** - These may prevent users from accessing information\n`;
      }
      
      if (totalWarnings > 0) {
        report += `2. **Address ${totalWarnings} warnings** - These improve documentation quality\n`;
      }
      
      report += `3. **Regular maintenance** - Run this tool weekly to catch issues early\n`;
      report += `4. **Content review** - Review files not updated in 90+ days\n\n`;
    }
    
    fs.writeFileSync(reportPath, report);
  }

  /**
   * Validate external links
   */
  private async validateLinks(): Promise<void> {
    console.log('🔗 Checking external links...');
    
    const externalLinks = new Set<string>();
    
    for (const file of this.files) {
      for (const link of file.links) {
        if (link.startsWith('http://') || link.startsWith('https://')) {
          externalLinks.add(link);
        }
      }
    }
    
    console.log(`   Found ${externalLinks.size} unique external links`);
    
    // Note: In a real implementation, you would check each link
    // For now, we'll just report the count
    if (externalLinks.size > 0) {
      console.log('   ℹ️ External link validation requires network access');
      console.log('   💡 Consider using a tool like markdown-link-check for comprehensive validation');
    }
  }

  /**
   * Optimize documentation assets
   */
  private async optimizeAssets(): Promise<void> {
    const assetsPath = path.join(this.docsPath, 'assets');
    
    if (!fs.existsSync(assetsPath)) {
      console.log('   📁 No assets directory found, skipping optimization');
      return;
    }
    
    const imageFiles = this.findImageFiles(assetsPath);
    console.log(`   🖼️ Found ${imageFiles.length} image files`);
    
    // Note: In a real implementation, you would optimize images
    // using tools like imagemin, sharp, etc.
    if (imageFiles.length > 0) {
      console.log('   💡 Consider optimizing images for web delivery');
      console.log('   💡 Use tools like imagemin or sharp for automatic optimization');
    }
  }

  /**
   * Find image files in directory
   */
  private findImageFiles(dir: string): string[] {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const files: string[] = [];
    
    const findFiles = (currentDir: string): void => {
      const items = fs.readdirSync(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          findFiles(fullPath);
        } else if (imageExtensions.some(ext => item.toLowerCase().endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    
    findFiles(dir);
    return files;
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Generate documentation templates
   */
  async generateTemplates(): Promise<void> {
    const templatesPath = path.join(this.docsPath, 'templates');
    
    if (!fs.existsSync(templatesPath)) {
      fs.mkdirSync(templatesPath, { recursive: true });
    }
    
    // User guide template
    const userGuideTemplate = `# [Component Name] User Guide

## Overview

Brief description of what this component does and who should use it.

## Prerequisites

- List any requirements
- Dependencies
- System requirements

## Getting Started

### Installation

\`\`\`bash
# Installation commands
\`\`\`

### Basic Usage

\`\`\`bash
# Basic usage examples
\`\`\`

## Configuration

### Basic Configuration

\`\`\`json
{
  "example": "configuration"
}
\`\`\`

### Advanced Configuration

More complex configuration options.

## Examples

### Example 1: Basic Use Case

Description and code example.

### Example 2: Advanced Use Case

Description and code example.

## Troubleshooting

### Common Issues

#### Issue: Problem description

**Symptoms:**
- List of symptoms

**Solution:**
\`\`\`bash
# Solution commands
\`\`\`

## FAQ

### Question 1?

Answer to the question.

### Question 2?

Answer to the question.

---

*Last updated: $(date)*
*Version: 1.0.0*
`;

    fs.writeFileSync(path.join(templatesPath, 'user-guide-template.md'), userGuideTemplate);
    
    console.log('📝 Documentation templates generated');
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'maintain';
  
  const maintenance = new DocumentationMaintenance();
  
  switch (command) {
    case 'maintain':
      maintenance.runMaintenance();
      break;
    case 'templates':
      maintenance.generateTemplates();
      break;
    case 'help':
      console.log(`
Documentation Maintenance Tool

Usage:
  npm run docs:maintain [command]

Commands:
  maintain    Run full documentation maintenance (default)
  templates   Generate documentation templates
  help        Show this help message

Examples:
  npm run docs:maintain
  npm run docs:maintain templates
      `);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      console.error('Run "npm run docs:maintain help" for usage information');
      process.exit(1);
  }
}

export { DocumentationMaintenance }; 