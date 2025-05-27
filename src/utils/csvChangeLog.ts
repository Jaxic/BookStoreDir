import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { CSVChangeEvent } from './csvMonitor';
import type { ValidationMetadata, ValidationPerformance } from './csvValidationPipeline';

export interface ChangeLogEntry {
  id: string;
  timestamp: Date;
  filename: string;
  changeType: CSVChangeEvent['type'];
  previousHash?: string;
  currentHash?: string;
  fileSize?: number;
  metadata?: {
    rowCount?: number;
    headers?: string[];
    validationErrors?: string[];
    validationWarnings?: string[];
    validationMetadata?: ValidationMetadata;
    performance?: ValidationPerformance;
    backupId?: string;
  };
  description?: string;
}

export interface ChangeLogQuery {
  filename?: string;
  changeType?: CSVChangeEvent['type'];
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface ChangeLogSummary {
  totalChanges: number;
  changesByType: Record<string, number>;
  changesByFile: Record<string, number>;
  lastChange?: Date;
  firstChange?: Date;
}

export class CSVChangeLog {
  private logFilePath: string;
  private logDir: string;

  constructor(logDirectory: string = 'logs') {
    this.logDir = path.resolve(logDirectory);
    this.logFilePath = path.join(this.logDir, 'csv-changes.json');
  }

  /**
   * Initialize the change log (create directory and file if needed)
   */
  async initialize(): Promise<void> {
    try {
      // Create log directory if it doesn't exist
      if (!existsSync(this.logDir)) {
        await mkdir(this.logDir, { recursive: true });
      }

      // Create log file if it doesn't exist
      if (!existsSync(this.logFilePath)) {
        await this.writeLogFile([]);
      }
    } catch (error) {
      throw new Error(`Failed to initialize change log: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Log a CSV change event
   */
  async logChange(event: CSVChangeEvent, metadata?: ChangeLogEntry['metadata']): Promise<string> {
    await this.initialize();

    const entry: ChangeLogEntry = {
      id: this.generateId(),
      timestamp: event.timestamp,
      filename: event.filename,
      changeType: event.type,
      previousHash: event.previousHash,
      currentHash: event.currentHash,
      fileSize: event.stats?.size,
      metadata,
      description: this.generateDescription(event)
    };

    const entries = await this.readLogFile();
    entries.push(entry);

    // Keep only the last 1000 entries to prevent the log from growing too large
    if (entries.length > 1000) {
      entries.splice(0, entries.length - 1000);
    }

    await this.writeLogFile(entries);
    return entry.id;
  }

  /**
   * Query change log entries
   */
  async query(query: ChangeLogQuery = {}): Promise<ChangeLogEntry[]> {
    await this.initialize();
    
    let entries = await this.readLogFile();

    // Apply filters
    if (query.filename) {
      entries = entries.filter(entry => entry.filename.includes(query.filename!));
    }

    if (query.changeType) {
      entries = entries.filter(entry => entry.changeType === query.changeType);
    }

    if (query.startDate) {
      entries = entries.filter(entry => new Date(entry.timestamp) >= query.startDate!);
    }

    if (query.endDate) {
      entries = entries.filter(entry => new Date(entry.timestamp) <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || entries.length;
    
    return entries.slice(offset, offset + limit);
  }

  /**
   * Get change log summary statistics
   */
  async getSummary(): Promise<ChangeLogSummary> {
    await this.initialize();
    
    const entries = await this.readLogFile();

    if (entries.length === 0) {
      return {
        totalChanges: 0,
        changesByType: {},
        changesByFile: {}
      };
    }

    const changesByType: Record<string, number> = {};
    const changesByFile: Record<string, number> = {};
    let firstChange: Date | undefined;
    let lastChange: Date | undefined;

    for (const entry of entries) {
      const timestamp = new Date(entry.timestamp);
      
      // Track by type
      changesByType[entry.changeType] = (changesByType[entry.changeType] || 0) + 1;
      
      // Track by file
      const filename = path.basename(entry.filename);
      changesByFile[filename] = (changesByFile[filename] || 0) + 1;
      
      // Track date range
      if (!firstChange || timestamp < firstChange) {
        firstChange = timestamp;
      }
      if (!lastChange || timestamp > lastChange) {
        lastChange = timestamp;
      }
    }

    return {
      totalChanges: entries.length,
      changesByType,
      changesByFile,
      firstChange,
      lastChange
    };
  }

  /**
   * Get recent changes (last N entries)
   */
  async getRecentChanges(limit: number = 10): Promise<ChangeLogEntry[]> {
    return this.query({ limit });
  }

  /**
   * Get changes for a specific file
   */
  async getFileChanges(filename: string, limit?: number): Promise<ChangeLogEntry[]> {
    return this.query({ filename, limit });
  }

  /**
   * Clear the change log
   */
  async clear(): Promise<void> {
    await this.writeLogFile([]);
  }

  /**
   * Export change log to a different format
   */
  async export(format: 'json' | 'csv' = 'json'): Promise<string> {
    const entries = await this.readLogFile();

    if (format === 'csv') {
      const headers = [
        'ID',
        'Timestamp',
        'Filename',
        'Change Type',
        'File Size',
        'Previous Hash',
        'Current Hash',
        'Description'
      ];

      const csvRows = [
        headers.join(','),
        ...entries.map(entry => [
          entry.id,
          entry.timestamp.toISOString(),
          `"${entry.filename}"`,
          entry.changeType,
          entry.fileSize || '',
          entry.previousHash || '',
          entry.currentHash || '',
          `"${entry.description || ''}"`
        ].join(','))
      ];

      return csvRows.join('\n');
    }

    return JSON.stringify(entries, null, 2);
  }

  /**
   * Read the log file
   */
  private async readLogFile(): Promise<ChangeLogEntry[]> {
    try {
      const content = await readFile(this.logFilePath, 'utf8');
      const entries = JSON.parse(content);
      
      // Convert timestamp strings back to Date objects
      return entries.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      // If file doesn't exist or is corrupted, return empty array
      return [];
    }
  }

  /**
   * Write to the log file
   */
  private async writeLogFile(entries: ChangeLogEntry[]): Promise<void> {
    const content = JSON.stringify(entries, null, 2);
    await writeFile(this.logFilePath, content, 'utf8');
  }

  /**
   * Generate a unique ID for log entries
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a human-readable description for the change
   */
  private generateDescription(event: CSVChangeEvent): string {
    const filename = path.basename(event.filename);
    const timestamp = event.timestamp.toLocaleString();

    switch (event.type) {
      case 'add':
        return `File ${filename} was created at ${timestamp}`;
      case 'delete':
        return `File ${filename} was deleted at ${timestamp}`;
      case 'rename':
        return `File ${filename} was renamed at ${timestamp}`;
      case 'change':
        const sizeInfo = event.stats ? ` (${event.stats.size} bytes)` : '';
        return `File ${filename} was modified at ${timestamp}${sizeInfo}`;
      default:
        return `File ${filename} had an unknown change at ${timestamp}`;
    }
  }
}

/**
 * Utility function to create a change log instance
 */
export function createChangeLog(logDirectory?: string): CSVChangeLog {
  return new CSVChangeLog(logDirectory);
}

/**
 * Utility function to format change log entries for display
 */
export function formatChangeLogEntry(entry: ChangeLogEntry): string {
  const timestamp = entry.timestamp.toLocaleString();
  const filename = path.basename(entry.filename);
  const type = entry.changeType.toUpperCase();
  
  let details = '';
  if (entry.fileSize) {
    details += ` (${(entry.fileSize / 1024).toFixed(1)}KB)`;
  }
  if (entry.metadata?.rowCount) {
    details += ` [${entry.metadata.rowCount} rows]`;
  }

  return `[${timestamp}] ${type}: ${filename}${details}`;
}

/**
 * Utility function to format change log summary
 */
export function formatChangeLogSummary(summary: ChangeLogSummary): string {
  const lines = [
    `Total Changes: ${summary.totalChanges}`,
    '',
    'Changes by Type:',
    ...Object.entries(summary.changesByType).map(([type, count]) => 
      `  ${type}: ${count}`
    ),
    '',
    'Changes by File:',
    ...Object.entries(summary.changesByFile).map(([file, count]) => 
      `  ${file}: ${count}`
    )
  ];

  if (summary.firstChange && summary.lastChange) {
    lines.push('');
    lines.push(`First Change: ${summary.firstChange.toLocaleString()}`);
    lines.push(`Last Change: ${summary.lastChange.toLocaleString()}`);
  }

  return lines.join('\n');
} 