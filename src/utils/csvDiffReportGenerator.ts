import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { 
  CSVDiffResult, 
  RowChange, 
  SchemaChange, 
  DiffStatistics,
  ChangeType 
} from './csvDiffEngine';

// Report output formats
export type ReportFormat = 'html' | 'console' | 'json' | 'markdown';

// Report generation options
export interface ReportGenerationOptions {
  format: ReportFormat;
  outputPath?: string;
  includeStatistics?: boolean;
  includeRowDetails?: boolean;
  includeSchemaChanges?: boolean;
  maxRowsToShow?: number;
  theme?: 'light' | 'dark';
  title?: string;
  description?: string;
}

// Report metadata
export interface ReportMetadata {
  generatedAt: Date;
  generator: string;
  version: string;
  diffResult: {
    mode: string;
    timestamp: Date;
    processingTime: number;
  };
}

export class CSVDiffReportGenerator {
  private options: Required<ReportGenerationOptions>;

  constructor(options: ReportGenerationOptions) {
    this.options = {
      outputPath: '',
      includeStatistics: true,
      includeRowDetails: true,
      includeSchemaChanges: true,
      maxRowsToShow: 100,
      theme: 'light',
      title: 'CSV Diff Report',
      description: 'Comprehensive comparison between CSV file versions',
      ...options
    };
  }

  /**
   * Generate a comprehensive diff report
   */
  async generateReport(diffResult: CSVDiffResult): Promise<string> {
    const metadata: ReportMetadata = {
      generatedAt: new Date(),
      generator: 'CSV Diff Report Generator',
      version: '1.0.0',
      diffResult: {
        mode: diffResult.mode,
        timestamp: diffResult.timestamp,
        processingTime: diffResult.metadata.processingTime
      }
    };

    let reportContent: string;

    switch (this.options.format) {
      case 'html':
        reportContent = this.generateHTMLReport(diffResult, metadata);
        break;
      case 'console':
        reportContent = this.generateConsoleReport(diffResult, metadata);
        break;
      case 'json':
        reportContent = this.generateJSONReport(diffResult, metadata);
        break;
      case 'markdown':
        reportContent = this.generateMarkdownReport(diffResult, metadata);
        break;
      default:
        throw new Error(`Unsupported report format: ${this.options.format}`);
    }

    // Save to file if output path is specified
    if (this.options.outputPath) {
      await fs.writeFile(this.options.outputPath, reportContent, 'utf8');
    }

    return reportContent;
  }

  /**
   * Generate HTML report with visual styling
   */
  private generateHTMLReport(diffResult: CSVDiffResult, metadata: ReportMetadata): string {
    const isDark = this.options.theme === 'dark';
    
    const css = `
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: ${isDark ? '#1a1a1a' : '#ffffff'};
          color: ${isDark ? '#e0e0e0' : '#333333'};
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { border-bottom: 2px solid ${isDark ? '#333' : '#ddd'}; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 2.5em; margin: 0; color: ${isDark ? '#4a9eff' : '#2563eb'}; }
        .subtitle { font-size: 1.2em; color: ${isDark ? '#888' : '#666'}; margin: 10px 0; }
        .metadata { background: ${isDark ? '#2a2a2a' : '#f8f9fa'}; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .section { margin: 30px 0; }
        .section-title { font-size: 1.5em; margin-bottom: 15px; color: ${isDark ? '#4a9eff' : '#2563eb'}; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .stat-card { background: ${isDark ? '#2a2a2a' : '#f8f9fa'}; padding: 15px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: ${isDark ? '#4a9eff' : '#2563eb'}; }
        .stat-label { color: ${isDark ? '#888' : '#666'}; }
        .change-item { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .change-added { background: ${isDark ? '#1a3d1a' : '#d4edda'}; border-left: 4px solid #28a745; }
        .change-removed { background: ${isDark ? '#3d1a1a' : '#f8d7da'}; border-left: 4px solid #dc3545; }
        .change-modified { background: ${isDark ? '#3d3d1a' : '#fff3cd'}; border-left: 4px solid #ffc107; }
        .change-moved { background: ${isDark ? '#1a1a3d' : '#d1ecf1'}; border-left: 4px solid #17a2b8; }
        .change-type { font-weight: bold; text-transform: uppercase; font-size: 0.8em; }
        .row-details { margin-left: 20px; font-size: 0.9em; }
        .cell-change { margin: 5px 0; }
        .old-value { color: #dc3545; text-decoration: line-through; }
        .new-value { color: #28a745; font-weight: bold; }
        .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .table th, .table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid ${isDark ? '#333' : '#ddd'}; }
        .table th { background: ${isDark ? '#333' : '#f8f9fa'}; font-weight: bold; }
        .progress-bar { width: 100%; height: 20px; background: ${isDark ? '#333' : '#e9ecef'}; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #ffc107, #dc3545); transition: width 0.3s ease; }
        .file-info { background: ${isDark ? '#2a2a2a' : '#f8f9fa'}; padding: 10px; border-radius: 5px; margin: 10px 0; }
        .timestamp { color: ${isDark ? '#888' : '#666'}; font-size: 0.9em; }
      </style>
    `;

    const header = `
      <div class="header">
        <h1 class="title">${this.options.title}</h1>
        <p class="subtitle">${this.options.description}</p>
        <div class="file-info">
          <strong>Comparison:</strong> ${path.basename(diffResult.sourceFiles.old)} → ${path.basename(diffResult.sourceFiles.new)}<br>
          <strong>Mode:</strong> ${diffResult.mode}<br>
          <strong>Generated:</strong> <span class="timestamp">${metadata.generatedAt.toLocaleString()}</span>
        </div>
      </div>
    `;

    const statisticsSection = this.options.includeStatistics ? `
      <div class="section">
        <h2 class="section-title">📊 Statistics Overview</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">${diffResult.statistics.changePercentage.toFixed(1)}%</div>
            <div class="stat-label">Change Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${diffResult.statistics.changes.added}</div>
            <div class="stat-label">Added Rows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${diffResult.statistics.changes.removed}</div>
            <div class="stat-label">Removed Rows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${diffResult.statistics.changes.modified}</div>
            <div class="stat-label">Modified Rows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${diffResult.statistics.totalRows.old} → ${diffResult.statistics.totalRows.new}</div>
            <div class="stat-label">Total Rows</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${diffResult.statistics.affectedColumns.length}</div>
            <div class="stat-label">Affected Columns</div>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>Change Distribution</h3>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${diffResult.statistics.changePercentage}%"></div>
          </div>
          <p style="margin-top: 10px; font-size: 0.9em; color: ${isDark ? '#888' : '#666'};">
            ${diffResult.statistics.changePercentage.toFixed(1)}% of data has changed
          </p>
        </div>

        ${diffResult.statistics.mostChangedColumns.length > 0 ? `
          <div style="margin-top: 20px;">
            <h3>Most Changed Columns</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Changes</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${diffResult.statistics.mostChangedColumns.slice(0, 10).map(col => `
                  <tr>
                    <td>${col.column}</td>
                    <td>${col.changeCount}</td>
                    <td>${col.changePercentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    ` : '';

    const schemaSection = this.options.includeSchemaChanges && diffResult.schemaChanges.length > 0 ? `
      <div class="section">
        <h2 class="section-title">🏗️ Schema Changes</h2>
        ${diffResult.schemaChanges.map(change => `
          <div class="change-item change-${change.changeType}">
            <span class="change-type">${change.changeType}</span>
            <strong>${change.columnName}</strong>
            ${change.oldIndex !== undefined ? ` (was at position ${change.oldIndex})` : ''}
            ${change.newIndex !== undefined ? ` (now at position ${change.newIndex})` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const rowChangesSection = this.options.includeRowDetails && diffResult.rowChanges.length > 0 ? `
      <div class="section">
        <h2 class="section-title">📝 Row Changes</h2>
        <p style="color: ${isDark ? '#888' : '#666'}; margin-bottom: 20px;">
          Showing ${Math.min(diffResult.rowChanges.length, this.options.maxRowsToShow)} of ${diffResult.rowChanges.length} changes
        </p>
        ${diffResult.rowChanges.slice(0, this.options.maxRowsToShow).map(change => `
          <div class="change-item change-${change.changeType}">
            <div>
              <span class="change-type">${change.changeType}</span>
              <strong>Row ${change.rowIndex}</strong>
              ${change.rowId ? ` [ID: ${change.rowId}]` : ''}
            </div>
            ${change.cellChanges.length > 0 ? `
              <div class="row-details">
                <strong>Cell Changes (${change.cellChanges.length}):</strong>
                ${change.cellChanges.map(cellChange => `
                  <div class="cell-change">
                    <strong>${cellChange.column}:</strong>
                    <span class="old-value">${this.escapeHtml(String(cellChange.oldValue))}</span>
                    →
                    <span class="new-value">${this.escapeHtml(String(cellChange.newValue))}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `).join('')}
        
        ${diffResult.rowChanges.length > this.options.maxRowsToShow ? `
          <p style="text-align: center; color: ${isDark ? '#888' : '#666'}; margin-top: 20px;">
            ... and ${diffResult.rowChanges.length - this.options.maxRowsToShow} more changes
          </p>
        ` : ''}
      </div>
    ` : '';

    const metadataSection = `
      <div class="metadata">
        <h3>Report Metadata</h3>
        <p><strong>Generated:</strong> ${metadata.generatedAt.toLocaleString()}</p>
        <p><strong>Processing Time:</strong> ${diffResult.metadata.processingTime}ms</p>
        <p><strong>Memory Usage:</strong> ${(diffResult.metadata.memoryUsage / 1024 / 1024).toFixed(2)} MB</p>
        <p><strong>Generator:</strong> ${metadata.generator} v${metadata.version}</p>
      </div>
    `;

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${this.options.title}</title>
        ${css}
      </head>
      <body>
        <div class="container">
          ${header}
          ${statisticsSection}
          ${schemaSection}
          ${rowChangesSection}
          ${metadataSection}
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate console-friendly text report
   */
  private generateConsoleReport(diffResult: CSVDiffResult, metadata: ReportMetadata): string {
    const lines: string[] = [];
    
    // Header
    lines.push('='.repeat(80));
    lines.push(`📊 ${this.options.title}`);
    lines.push('='.repeat(80));
    lines.push(`📁 ${path.basename(diffResult.sourceFiles.old)} → ${path.basename(diffResult.sourceFiles.new)}`);
    lines.push(`🔍 Mode: ${diffResult.mode}`);
    lines.push(`⏰ Generated: ${metadata.generatedAt.toLocaleString()}`);
    lines.push('');

    // Statistics
    if (this.options.includeStatistics) {
      lines.push('📊 STATISTICS');
      lines.push('-'.repeat(40));
      lines.push(`Total Rows: ${diffResult.statistics.totalRows.old} → ${diffResult.statistics.totalRows.new}`);
      lines.push(`Total Columns: ${diffResult.statistics.totalColumns.old} → ${diffResult.statistics.totalColumns.new}`);
      lines.push(`Change Rate: ${diffResult.statistics.changePercentage.toFixed(1)}%`);
      lines.push('');
      lines.push('Changes by Type:');
      lines.push(`  ➕ Added: ${diffResult.statistics.changes.added}`);
      lines.push(`  ➖ Removed: ${diffResult.statistics.changes.removed}`);
      lines.push(`  ✏️  Modified: ${diffResult.statistics.changes.modified}`);
      lines.push(`  ↔️  Moved: ${diffResult.statistics.changes.moved}`);
      lines.push(`  ✅ Unchanged: ${diffResult.statistics.changes.unchanged}`);
      lines.push('');
      lines.push(`Affected Columns: ${diffResult.statistics.affectedColumns.length}`);
      
      if (diffResult.statistics.mostChangedColumns.length > 0) {
        lines.push('');
        lines.push('Most Changed Columns:');
        diffResult.statistics.mostChangedColumns.slice(0, 5).forEach(col => {
          lines.push(`  ${col.column}: ${col.changeCount} changes (${col.changePercentage.toFixed(1)}%)`);
        });
      }
      lines.push('');
    }

    // Schema changes
    if (this.options.includeSchemaChanges && diffResult.schemaChanges.length > 0) {
      lines.push('🏗️  SCHEMA CHANGES');
      lines.push('-'.repeat(40));
      diffResult.schemaChanges.forEach(change => {
        const emoji = this.getChangeEmoji(change.changeType);
        lines.push(`${emoji} ${change.changeType.toUpperCase()}: ${change.columnName}`);
        if (change.oldIndex !== undefined) lines.push(`    Previous position: ${change.oldIndex}`);
        if (change.newIndex !== undefined) lines.push(`    New position: ${change.newIndex}`);
      });
      lines.push('');
    }

    // Row changes
    if (this.options.includeRowDetails && diffResult.rowChanges.length > 0) {
      lines.push('📝 ROW CHANGES');
      lines.push('-'.repeat(40));
      lines.push(`Showing ${Math.min(diffResult.rowChanges.length, this.options.maxRowsToShow)} of ${diffResult.rowChanges.length} changes`);
      lines.push('');
      
      diffResult.rowChanges.slice(0, this.options.maxRowsToShow).forEach(change => {
        const emoji = this.getChangeEmoji(change.changeType);
        lines.push(`${emoji} Row ${change.rowIndex} (${change.changeType.toUpperCase()})`);
        
        if (change.rowId) {
          lines.push(`    ID: ${change.rowId}`);
        }
        
        if (change.cellChanges.length > 0) {
          lines.push(`    Cell changes: ${change.cellChanges.length}`);
          change.cellChanges.slice(0, 3).forEach(cellChange => {
            lines.push(`      ${cellChange.column}: "${cellChange.oldValue}" → "${cellChange.newValue}"`);
          });
          
          if (change.cellChanges.length > 3) {
            lines.push(`      ... and ${change.cellChanges.length - 3} more`);
          }
        }
        lines.push('');
      });
      
      if (diffResult.rowChanges.length > this.options.maxRowsToShow) {
        lines.push(`... and ${diffResult.rowChanges.length - this.options.maxRowsToShow} more changes`);
        lines.push('');
      }
    }

    // Metadata
    lines.push('ℹ️  METADATA');
    lines.push('-'.repeat(40));
    lines.push(`Processing Time: ${diffResult.metadata.processingTime}ms`);
    lines.push(`Memory Usage: ${(diffResult.metadata.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`Generator: ${metadata.generator} v${metadata.version}`);

    return lines.join('\n');
  }

  /**
   * Generate JSON report
   */
  private generateJSONReport(diffResult: CSVDiffResult, metadata: ReportMetadata): string {
    const report = {
      metadata,
      diffResult: {
        ...diffResult,
        // Limit row changes if specified
        rowChanges: this.options.includeRowDetails 
          ? diffResult.rowChanges.slice(0, this.options.maxRowsToShow)
          : [],
        schemaChanges: this.options.includeSchemaChanges 
          ? diffResult.schemaChanges 
          : []
      },
      options: this.options
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(diffResult: CSVDiffResult, metadata: ReportMetadata): string {
    const lines: string[] = [];
    
    // Header
    lines.push(`# ${this.options.title}`);
    lines.push('');
    lines.push(this.options.description);
    lines.push('');
    lines.push(`**Comparison:** \`${path.basename(diffResult.sourceFiles.old)}\` → \`${path.basename(diffResult.sourceFiles.new)}\``);
    lines.push(`**Mode:** ${diffResult.mode}`);
    lines.push(`**Generated:** ${metadata.generatedAt.toLocaleString()}`);
    lines.push('');

    // Statistics
    if (this.options.includeStatistics) {
      lines.push('## 📊 Statistics Overview');
      lines.push('');
      lines.push('| Metric | Value |');
      lines.push('|--------|-------|');
      lines.push(`| Change Rate | ${diffResult.statistics.changePercentage.toFixed(1)}% |`);
      lines.push(`| Total Rows | ${diffResult.statistics.totalRows.old} → ${diffResult.statistics.totalRows.new} |`);
      lines.push(`| Total Columns | ${diffResult.statistics.totalColumns.old} → ${diffResult.statistics.totalColumns.new} |`);
      lines.push(`| Added Rows | ${diffResult.statistics.changes.added} |`);
      lines.push(`| Removed Rows | ${diffResult.statistics.changes.removed} |`);
      lines.push(`| Modified Rows | ${diffResult.statistics.changes.modified} |`);
      lines.push(`| Moved Rows | ${diffResult.statistics.changes.moved} |`);
      lines.push(`| Unchanged Rows | ${diffResult.statistics.changes.unchanged} |`);
      lines.push(`| Affected Columns | ${diffResult.statistics.affectedColumns.length} |`);
      lines.push('');

      if (diffResult.statistics.mostChangedColumns.length > 0) {
        lines.push('### Most Changed Columns');
        lines.push('');
        lines.push('| Column | Changes | Percentage |');
        lines.push('|--------|---------|------------|');
        diffResult.statistics.mostChangedColumns.slice(0, 10).forEach(col => {
          lines.push(`| ${col.column} | ${col.changeCount} | ${col.changePercentage.toFixed(1)}% |`);
        });
        lines.push('');
      }
    }

    // Schema changes
    if (this.options.includeSchemaChanges && diffResult.schemaChanges.length > 0) {
      lines.push('## 🏗️ Schema Changes');
      lines.push('');
      diffResult.schemaChanges.forEach(change => {
        const emoji = this.getChangeEmoji(change.changeType);
        lines.push(`- ${emoji} **${change.changeType.toUpperCase()}**: \`${change.columnName}\``);
        if (change.oldIndex !== undefined) lines.push(`  - Previous position: ${change.oldIndex}`);
        if (change.newIndex !== undefined) lines.push(`  - New position: ${change.newIndex}`);
      });
      lines.push('');
    }

    // Row changes
    if (this.options.includeRowDetails && diffResult.rowChanges.length > 0) {
      lines.push('## 📝 Row Changes');
      lines.push('');
      lines.push(`Showing ${Math.min(diffResult.rowChanges.length, this.options.maxRowsToShow)} of ${diffResult.rowChanges.length} changes`);
      lines.push('');
      
      diffResult.rowChanges.slice(0, this.options.maxRowsToShow).forEach(change => {
        const emoji = this.getChangeEmoji(change.changeType);
        lines.push(`### ${emoji} Row ${change.rowIndex} (${change.changeType.toUpperCase()})`);
        
        if (change.rowId) {
          lines.push(`**ID:** ${change.rowId}`);
        }
        
        if (change.cellChanges.length > 0) {
          lines.push('');
          lines.push('**Cell Changes:**');
          change.cellChanges.forEach(cellChange => {
            lines.push(`- **${cellChange.column}:** \`${cellChange.oldValue}\` → \`${cellChange.newValue}\``);
          });
        }
        lines.push('');
      });
    }

    // Metadata
    lines.push('## ℹ️ Metadata');
    lines.push('');
    lines.push(`- **Processing Time:** ${diffResult.metadata.processingTime}ms`);
    lines.push(`- **Memory Usage:** ${(diffResult.metadata.memoryUsage / 1024 / 1024).toFixed(2)} MB`);
    lines.push(`- **Generator:** ${metadata.generator} v${metadata.version}`);

    return lines.join('\n');
  }

  /**
   * Get emoji for change type
   */
  private getChangeEmoji(changeType: ChangeType): string {
    const emojis = {
      added: '➕',
      removed: '➖',
      modified: '✏️',
      moved: '↔️',
      unchanged: '✅'
    };
    return emojis[changeType] || '❓';
  }

  /**
   * Escape HTML characters
   */
  private escapeHtml(text: string): string {
    const div = { innerHTML: '' } as any;
    div.textContent = text;
    return div.innerHTML || text.replace(/[&<>"']/g, (match: string) => {
      const escapeMap: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      };
      return escapeMap[match];
    });
  }
}

/**
 * Factory function to create a diff report generator
 */
export function createDiffReportGenerator(options: ReportGenerationOptions): CSVDiffReportGenerator {
  return new CSVDiffReportGenerator(options);
}

/**
 * Utility function to generate a quick console report
 */
export function generateQuickConsoleReport(diffResult: CSVDiffResult): string {
  const generator = new CSVDiffReportGenerator({
    format: 'console',
    includeStatistics: true,
    includeRowDetails: true,
    includeSchemaChanges: true,
    maxRowsToShow: 10
  });
  
  return generator['generateConsoleReport'](diffResult, {
    generatedAt: new Date(),
    generator: 'Quick Console Report',
    version: '1.0.0',
    diffResult: {
      mode: diffResult.mode,
      timestamp: diffResult.timestamp,
      processingTime: diffResult.metadata.processingTime
    }
  });
} 