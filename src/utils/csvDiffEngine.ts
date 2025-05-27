import { createReadStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { parse } from 'csv-parse';
import { diffLines, diffChars, createTwoFilesPatch, structuredPatch } from 'diff';
import { diff as jsonDiff, create as createJsonDiffPatch } from 'jsondiffpatch';
import { EventEmitter } from 'node:events';
import path from 'node:path';

// Diff comparison modes
export type DiffMode = 'text' | 'structured' | 'hybrid' | 'schema';

// Change types
export type ChangeType = 'added' | 'removed' | 'modified' | 'moved' | 'unchanged';

// Individual cell change
export interface CellChange {
  column: string;
  oldValue: any;
  newValue: any;
  changeType: ChangeType;
  confidence?: number; // 0-1 confidence score for the change detection
}

// Row-level change
export interface RowChange {
  rowIndex: number;
  rowId?: string; // Identifier if available
  changeType: ChangeType;
  cellChanges: CellChange[];
  oldRow?: Record<string, any>;
  newRow?: Record<string, any>;
  similarity?: number; // 0-1 similarity score for row matching
}

// Schema change (header/column changes)
export interface SchemaChange {
  changeType: ChangeType;
  columnName: string;
  oldIndex?: number;
  newIndex?: number;
  dataType?: string;
}

// Diff statistics
export interface DiffStatistics {
  totalRows: {
    old: number;
    new: number;
  };
  totalColumns: {
    old: number;
    new: number;
  };
  changes: {
    added: number;
    removed: number;
    modified: number;
    moved: number;
    unchanged: number;
  };
  affectedColumns: string[];
  changePercentage: number;
  mostChangedColumns: Array<{
    column: string;
    changeCount: number;
    changePercentage: number;
  }>;
}

// Diff result
export interface CSVDiffResult {
  mode: DiffMode;
  timestamp: Date;
  sourceFiles: {
    old: string;
    new: string;
  };
  statistics: DiffStatistics;
  schemaChanges: SchemaChange[];
  rowChanges: RowChange[];
  textDiff?: string; // Raw text diff for text mode
  structuredDiff?: any; // JSON diff for structured mode
  metadata: {
    processingTime: number;
    memoryUsage: number;
    options: CSVDiffOptions;
  };
}

// Diff filtering options
export interface DiffFilterOptions {
  includeColumns?: string[]; // Only include these columns
  excludeColumns?: string[]; // Exclude these columns
  changeTypes?: ChangeType[]; // Only include these change types
  minSimilarity?: number; // Minimum similarity threshold for row matching
  ignoreCase?: boolean; // Case-insensitive comparison
  ignoreWhitespace?: boolean; // Ignore whitespace differences
  numericThreshold?: number; // Threshold for numeric value changes
}

// CSV diff options
export interface CSVDiffOptions {
  mode?: DiffMode;
  keyColumns?: string[]; // Columns to use for row identification
  filters?: DiffFilterOptions;
  csvParseOptions?: {
    delimiter?: string;
    quote?: string;
    escape?: string;
    encoding?: BufferEncoding;
  };
  enableRowMatching?: boolean; // Enable intelligent row matching
  enableMoveDetection?: boolean; // Detect row moves
  maxRowsToProcess?: number; // Limit for large files
}

export class CSVDiffEngine extends EventEmitter {
  private options: Required<CSVDiffOptions>;
  private jsonDiffPatch: any;

  constructor(options: CSVDiffOptions = {}) {
    super();
    
    this.options = {
      mode: 'hybrid',
      keyColumns: [],
      filters: {},
      csvParseOptions: {
        delimiter: ',',
        quote: '"',
        escape: '"',
        encoding: 'utf8'
      },
      enableRowMatching: true,
      enableMoveDetection: true,
      maxRowsToProcess: 100000,
      ...options
    };

    // Merge nested objects properly
    if (options.filters) {
      this.options.filters = { ...this.options.filters, ...options.filters };
    }
    if (options.csvParseOptions) {
      this.options.csvParseOptions = { ...this.options.csvParseOptions, ...options.csvParseOptions };
    }

    // Configure jsondiffpatch instance
    this.jsonDiffPatch = createJsonDiffPatch({
      objectHash: (obj: any, index?: number) => {
        // Try to use key columns for object identification
        if (this.options.keyColumns.length > 0) {
          const keyValues = this.options.keyColumns
            .map(col => obj[col])
            .filter(val => val !== undefined && val !== null)
            .join('|');
          if (keyValues) return keyValues;
        }
        
        // Fall back to common ID fields or index
        return obj.id || obj.name || obj._id || `$$index:${index || 0}`;
      },
      arrays: {
        detectMove: this.options.enableMoveDetection,
        includeValueOnMove: false
      }
    });
  }

  /**
   * Compare two CSV files and generate a comprehensive diff
   */
  async compareFiles(oldFilePath: string, newFilePath: string): Promise<CSVDiffResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;

    this.emit('diffStarted', { oldFile: oldFilePath, newFile: newFilePath, mode: this.options.mode });

    try {
      let result: CSVDiffResult;

      switch (this.options.mode) {
        case 'text':
          result = await this.performTextDiff(oldFilePath, newFilePath);
          break;
        case 'structured':
          result = await this.performStructuredDiff(oldFilePath, newFilePath);
          break;
        case 'schema':
          result = await this.performSchemaDiff(oldFilePath, newFilePath);
          break;
        case 'hybrid':
        default:
          result = await this.performHybridDiff(oldFilePath, newFilePath);
          break;
      }

      // Add metadata
      result.metadata = {
        processingTime: Date.now() - startTime,
        memoryUsage: process.memoryUsage().heapUsed - startMemory,
        options: this.options
      };

      this.emit('diffCompleted', { result, processingTime: result.metadata.processingTime });
      return result;

    } catch (error) {
      const errorMsg = `CSV diff failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.emit('diffFailed', { error: errorMsg, oldFile: oldFilePath, newFile: newFilePath });
      throw new Error(errorMsg);
    }
  }

  /**
   * Compare CSV content with backup data
   */
  async compareWithBackup(currentFilePath: string, backupData: string): Promise<CSVDiffResult> {
    // Create temporary file for backup data
    const tempBackupPath = path.join(path.dirname(currentFilePath), '.temp-backup.csv');
    
    try {
      await fs.writeFile(tempBackupPath, backupData, 'utf8');
      const result = await this.compareFiles(tempBackupPath, currentFilePath);
      
      // Update source files to reflect backup comparison
      result.sourceFiles.old = 'backup-data';
      result.sourceFiles.new = currentFilePath;
      
      return result;
    } finally {
      // Clean up temporary file
      try {
        await fs.unlink(tempBackupPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Perform text-based diff comparison
   */
  private async performTextDiff(oldFilePath: string, newFilePath: string): Promise<CSVDiffResult> {
    const [oldContent, newContent] = await Promise.all([
      fs.readFile(oldFilePath, this.options.csvParseOptions.encoding!),
      fs.readFile(newFilePath, this.options.csvParseOptions.encoding!)
    ]);

    // Generate line-by-line diff
    const lineDiff = diffLines(oldContent, newContent);
    
    // Generate unified patch
    const patch = createTwoFilesPatch(
      path.basename(oldFilePath),
      path.basename(newFilePath),
      oldContent,
      newContent
    );

    // Calculate basic statistics
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    let addedLines = 0;
    let removedLines = 0;
    let modifiedLines = 0;

    lineDiff.forEach(part => {
      if (part.added) addedLines += part.count || 0;
      else if (part.removed) removedLines += part.count || 0;
    });

    modifiedLines = Math.min(addedLines, removedLines);
    addedLines -= modifiedLines;
    removedLines -= modifiedLines;

    const statistics: DiffStatistics = {
      totalRows: { old: oldLines.length, new: newLines.length },
      totalColumns: { old: 0, new: 0 }, // Not applicable for text mode
      changes: {
        added: addedLines,
        removed: removedLines,
        modified: modifiedLines,
        moved: 0,
        unchanged: Math.max(0, Math.min(oldLines.length, newLines.length) - modifiedLines)
      },
      affectedColumns: [],
      changePercentage: ((addedLines + removedLines + modifiedLines) / Math.max(oldLines.length, newLines.length)) * 100,
      mostChangedColumns: []
    };

    return {
      mode: 'text',
      timestamp: new Date(),
      sourceFiles: { old: oldFilePath, new: newFilePath },
      statistics,
      schemaChanges: [],
      rowChanges: [],
      textDiff: patch,
      metadata: {} as any // Will be filled by caller
    };
  }

  /**
   * Perform structured data diff comparison
   */
  private async performStructuredDiff(oldFilePath: string, newFilePath: string): Promise<CSVDiffResult> {
    const [oldData, newData] = await Promise.all([
      this.parseCSVFile(oldFilePath),
      this.parseCSVFile(newFilePath)
    ]);

    // Perform JSON diff on the structured data
    const structuredDiff = this.jsonDiffPatch.diff(oldData.rows, newData.rows);

    // Analyze schema changes
    const schemaChanges = this.analyzeSchemaChanges(oldData.headers, newData.headers);

    // Analyze row changes
    const rowChanges = this.analyzeRowChanges(oldData.rows, newData.rows, structuredDiff);

    // Calculate statistics
    const statistics = this.calculateStatistics(oldData, newData, rowChanges, schemaChanges);

    return {
      mode: 'structured',
      timestamp: new Date(),
      sourceFiles: { old: oldFilePath, new: newFilePath },
      statistics,
      schemaChanges,
      rowChanges,
      structuredDiff,
      metadata: {} as any // Will be filled by caller
    };
  }

  /**
   * Perform schema-focused diff comparison
   */
  private async performSchemaDiff(oldFilePath: string, newFilePath: string): Promise<CSVDiffResult> {
    const [oldData, newData] = await Promise.all([
      this.parseCSVFile(oldFilePath),
      this.parseCSVFile(newFilePath)
    ]);

    // Focus only on schema changes
    const schemaChanges = this.analyzeSchemaChanges(oldData.headers, newData.headers);

    const statistics: DiffStatistics = {
      totalRows: { old: oldData.rows.length, new: newData.rows.length },
      totalColumns: { old: oldData.headers.length, new: newData.headers.length },
      changes: {
        added: 0,
        removed: 0,
        modified: 0,
        moved: 0,
        unchanged: Math.min(oldData.rows.length, newData.rows.length)
      },
      affectedColumns: schemaChanges.map(change => change.columnName),
      changePercentage: (schemaChanges.length / Math.max(oldData.headers.length, newData.headers.length)) * 100,
      mostChangedColumns: []
    };

    return {
      mode: 'schema',
      timestamp: new Date(),
      sourceFiles: { old: oldFilePath, new: newFilePath },
      statistics,
      schemaChanges,
      rowChanges: [],
      metadata: {} as any // Will be filled by caller
    };
  }

  /**
   * Perform hybrid diff combining multiple approaches
   */
  private async performHybridDiff(oldFilePath: string, newFilePath: string): Promise<CSVDiffResult> {
    // Get both structured and text diffs
    const [structuredResult, textResult] = await Promise.all([
      this.performStructuredDiff(oldFilePath, newFilePath),
      this.performTextDiff(oldFilePath, newFilePath)
    ]);

    // Combine the results
    return {
      mode: 'hybrid',
      timestamp: new Date(),
      sourceFiles: { old: oldFilePath, new: newFilePath },
      statistics: structuredResult.statistics,
      schemaChanges: structuredResult.schemaChanges,
      rowChanges: structuredResult.rowChanges,
      textDiff: textResult.textDiff,
      structuredDiff: structuredResult.structuredDiff,
      metadata: {} as any // Will be filled by caller
    };
  }

  /**
   * Parse CSV file into structured data
   */
  private async parseCSVFile(filePath: string): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, any>[] = [];
      let headers: string[] = [];
      let isFirstRow = true;

      const stream = createReadStream(filePath)
        .pipe(parse({
          delimiter: this.options.csvParseOptions.delimiter,
          quote: this.options.csvParseOptions.quote,
          escape: this.options.csvParseOptions.escape,
          skip_empty_lines: true,
          trim: true
        }));

      stream.on('data', (row: string[]) => {
        if (isFirstRow) {
          headers = row;
          isFirstRow = false;
        } else {
          const rowObj: Record<string, any> = {};
          headers.forEach((header, index) => {
            rowObj[header] = row[index] || '';
          });
          rows.push(rowObj);

          // Limit processing for large files
          if (rows.length >= this.options.maxRowsToProcess) {
            stream.destroy();
          }
        }
      });

      stream.on('end', () => {
        resolve({ headers, rows });
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Analyze schema changes between headers
   */
  private analyzeSchemaChanges(oldHeaders: string[], newHeaders: string[]): SchemaChange[] {
    const changes: SchemaChange[] = [];
    const oldSet = new Set(oldHeaders);
    const newSet = new Set(newHeaders);

    // Find added columns
    newHeaders.forEach((header, index) => {
      if (!oldSet.has(header)) {
        changes.push({
          changeType: 'added',
          columnName: header,
          newIndex: index
        });
      }
    });

    // Find removed columns
    oldHeaders.forEach((header, index) => {
      if (!newSet.has(header)) {
        changes.push({
          changeType: 'removed',
          columnName: header,
          oldIndex: index
        });
      }
    });

    // Find moved columns
    const commonHeaders = oldHeaders.filter(header => newSet.has(header));
    commonHeaders.forEach(header => {
      const oldIndex = oldHeaders.indexOf(header);
      const newIndex = newHeaders.indexOf(header);
      
      if (oldIndex !== newIndex) {
        changes.push({
          changeType: 'moved',
          columnName: header,
          oldIndex,
          newIndex
        });
      }
    });

    return changes;
  }

  /**
   * Analyze row changes from structured diff
   */
  private analyzeRowChanges(
    oldRows: Record<string, any>[], 
    newRows: Record<string, any>[], 
    structuredDiff: any
  ): RowChange[] {
    const changes: RowChange[] = [];

    if (!structuredDiff || !structuredDiff._t) {
      // No array changes detected
      return changes;
    }

    // Process jsondiffpatch array changes
    Object.keys(structuredDiff).forEach(key => {
      if (key === '_t') return; // Skip array marker

      const change = structuredDiff[key];
      const index = parseInt(key.replace('_', ''), 10);

      if (Array.isArray(change)) {
        if (change.length === 1) {
          // Added row
          changes.push({
            rowIndex: index,
            changeType: 'added',
            cellChanges: [],
            newRow: change[0]
          });
        } else if (change.length === 3 && change[1] === 0 && change[2] === 0) {
          // Removed row
          changes.push({
            rowIndex: index,
            changeType: 'removed',
            cellChanges: [],
            oldRow: change[0]
          });
        } else if (change.length === 3 && change[2] === 3) {
          // Moved row
          changes.push({
            rowIndex: index,
            changeType: 'moved',
            cellChanges: [],
            oldRow: oldRows[index],
            newRow: newRows[change[1]]
          });
        }
      } else if (typeof change === 'object') {
        // Modified row
        const cellChanges: CellChange[] = [];
        const oldRow = oldRows[index];
        const newRow = { ...oldRow };

        Object.keys(change).forEach(column => {
          const cellChange = change[column];
          if (Array.isArray(cellChange) && cellChange.length === 2) {
            cellChanges.push({
              column,
              oldValue: cellChange[0],
              newValue: cellChange[1],
              changeType: 'modified'
            });
            newRow[column] = cellChange[1];
          }
        });

        changes.push({
          rowIndex: index,
          changeType: 'modified',
          cellChanges,
          oldRow,
          newRow
        });
      }
    });

    return changes;
  }

  /**
   * Calculate comprehensive statistics
   */
  private calculateStatistics(
    oldData: { headers: string[]; rows: Record<string, any>[] },
    newData: { headers: string[]; rows: Record<string, any>[] },
    rowChanges: RowChange[],
    schemaChanges: SchemaChange[]
  ): DiffStatistics {
    const changesByType = rowChanges.reduce((acc, change) => {
      acc[change.changeType]++;
      return acc;
    }, { added: 0, removed: 0, modified: 0, moved: 0, unchanged: 0 });

    changesByType.unchanged = Math.max(0, 
      Math.min(oldData.rows.length, newData.rows.length) - 
      changesByType.added - changesByType.removed - changesByType.modified
    );

    // Calculate column-level statistics
    const columnChangeCounts: Record<string, number> = {};
    rowChanges.forEach(rowChange => {
      rowChange.cellChanges.forEach(cellChange => {
        columnChangeCounts[cellChange.column] = (columnChangeCounts[cellChange.column] || 0) + 1;
      });
    });

    const mostChangedColumns = Object.entries(columnChangeCounts)
      .map(([column, count]) => ({
        column,
        changeCount: count,
        changePercentage: (count / Math.max(oldData.rows.length, newData.rows.length)) * 100
      }))
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, 10);

    const totalChanges = changesByType.added + changesByType.removed + changesByType.modified + changesByType.moved;
    const totalRows = Math.max(oldData.rows.length, newData.rows.length);

    return {
      totalRows: { old: oldData.rows.length, new: newData.rows.length },
      totalColumns: { old: oldData.headers.length, new: newData.headers.length },
      changes: changesByType,
      affectedColumns: [...new Set([
        ...Object.keys(columnChangeCounts),
        ...schemaChanges.map(change => change.columnName)
      ])],
      changePercentage: totalRows > 0 ? (totalChanges / totalRows) * 100 : 0,
      mostChangedColumns
    };
  }

  /**
   * Apply filters to diff result
   */
  applyFilters(result: CSVDiffResult): CSVDiffResult {
    const filters = this.options.filters;
    
    if (!filters || Object.keys(filters).length === 0) {
      return result;
    }

    // Filter row changes
    let filteredRowChanges = result.rowChanges;

    if (filters.changeTypes && filters.changeTypes.length > 0) {
      filteredRowChanges = filteredRowChanges.filter(change => 
        filters.changeTypes!.includes(change.changeType)
      );
    }

    if (filters.includeColumns && filters.includeColumns.length > 0) {
      filteredRowChanges = filteredRowChanges.map(rowChange => ({
        ...rowChange,
        cellChanges: rowChange.cellChanges.filter(cellChange =>
          filters.includeColumns!.includes(cellChange.column)
        )
      })).filter(rowChange => rowChange.cellChanges.length > 0 || rowChange.changeType !== 'modified');
    }

    if (filters.excludeColumns && filters.excludeColumns.length > 0) {
      filteredRowChanges = filteredRowChanges.map(rowChange => ({
        ...rowChange,
        cellChanges: rowChange.cellChanges.filter(cellChange =>
          !filters.excludeColumns!.includes(cellChange.column)
        )
      }));
    }

    // Filter schema changes
    let filteredSchemaChanges = result.schemaChanges;

    if (filters.includeColumns && filters.includeColumns.length > 0) {
      filteredSchemaChanges = filteredSchemaChanges.filter(change =>
        filters.includeColumns!.includes(change.columnName)
      );
    }

    if (filters.excludeColumns && filters.excludeColumns.length > 0) {
      filteredSchemaChanges = filteredSchemaChanges.filter(change =>
        !filters.excludeColumns!.includes(change.columnName)
      );
    }

    return {
      ...result,
      rowChanges: filteredRowChanges,
      schemaChanges: filteredSchemaChanges
    };
  }

  /**
   * Get diff engine statistics
   */
  getEngineStats(): {
    mode: DiffMode;
    options: CSVDiffOptions;
    capabilities: string[];
  } {
    return {
      mode: this.options.mode,
      options: this.options,
      capabilities: [
        'text-diff',
        'structured-diff',
        'schema-diff',
        'hybrid-diff',
        'row-matching',
        'move-detection',
        'filtering',
        'statistics'
      ]
    };
  }
}

/**
 * Factory function to create a CSV diff engine
 */
export function createCSVDiffEngine(options?: CSVDiffOptions): CSVDiffEngine {
  return new CSVDiffEngine(options);
}

/**
 * Utility function to format diff statistics
 */
export function formatDiffStatistics(stats: DiffStatistics): string {
  const lines = [
    `Total Rows: ${stats.totalRows.old} → ${stats.totalRows.new}`,
    `Total Columns: ${stats.totalColumns.old} → ${stats.totalColumns.new}`,
    `Changes: ${stats.changePercentage.toFixed(1)}%`,
    `  Added: ${stats.changes.added}`,
    `  Removed: ${stats.changes.removed}`,
    `  Modified: ${stats.changes.modified}`,
    `  Moved: ${stats.changes.moved}`,
    `  Unchanged: ${stats.changes.unchanged}`,
    `Affected Columns: ${stats.affectedColumns.length}`
  ];

  if (stats.mostChangedColumns.length > 0) {
    lines.push('');
    lines.push('Most Changed Columns:');
    stats.mostChangedColumns.slice(0, 5).forEach(col => {
      lines.push(`  ${col.column}: ${col.changeCount} changes (${col.changePercentage.toFixed(1)}%)`);
    });
  }

  return lines.join('\n');
}

/**
 * Utility function to format row change summary
 */
export function formatRowChangeSummary(change: RowChange): string {
  const changeTypeEmoji = {
    added: '➕',
    removed: '➖',
    modified: '✏️',
    moved: '↔️',
    unchanged: '✅'
  };

  let summary = `${changeTypeEmoji[change.changeType]} Row ${change.rowIndex} (${change.changeType})`;
  
  if (change.rowId) {
    summary += ` [ID: ${change.rowId}]`;
  }

  if (change.cellChanges.length > 0) {
    summary += `\n  Cell changes: ${change.cellChanges.length}`;
    change.cellChanges.slice(0, 3).forEach(cellChange => {
      summary += `\n    ${cellChange.column}: "${cellChange.oldValue}" → "${cellChange.newValue}"`;
    });
    
    if (change.cellChanges.length > 3) {
      summary += `\n    ... and ${change.cellChanges.length - 3} more`;
    }
  }

  return summary;
} 