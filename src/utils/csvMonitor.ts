import { watch, stat, readFile } from 'node:fs';
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import path from 'node:path';

export interface CSVChangeEvent {
  type: 'change' | 'rename' | 'add' | 'delete';
  filename: string;
  timestamp: Date;
  previousHash?: string;
  currentHash?: string;
  stats?: {
    size: number;
    mtime: Date;
    ctime: Date;
  };
}

export interface CSVMonitorOptions {
  checkInterval?: number; // milliseconds
  useChecksum?: boolean;
  encoding?: BufferEncoding;
  debounceDelay?: number; // milliseconds to debounce rapid changes
}

export class CSVMonitor extends EventEmitter {
  private watchers: Map<string, any> = new Map();
  private fileHashes: Map<string, string> = new Map();
  private fileStats: Map<string, any> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private options: Required<CSVMonitorOptions>;

  constructor(options: CSVMonitorOptions = {}) {
    super();
    this.options = {
      checkInterval: 1000,
      useChecksum: true,
      encoding: 'utf8',
      debounceDelay: 500,
      ...options
    };
  }

  /**
   * Start monitoring a CSV file for changes
   */
  async watchFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve(filePath);
    
    try {
      // Initialize file state
      await this.initializeFileState(absolutePath);
      
      // Set up file watcher
      const watcher = watch(absolutePath, { encoding: 'buffer' }, (eventType, filename) => {
        this.handleFileEvent(absolutePath, eventType, filename);
      });

      // Handle watcher errors
      watcher.on('error', (error) => {
        this.emit('error', {
          message: `Watcher error for ${absolutePath}`,
          error,
          filename: absolutePath
        });
      });

      this.watchers.set(absolutePath, watcher);
      
      this.emit('watchStarted', {
        filename: absolutePath,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('error', {
        message: `Failed to watch file ${absolutePath}`,
        error,
        filename: absolutePath
      });
    }
  }

  /**
   * Stop monitoring a specific file
   */
  unwatchFile(filePath: string): void {
    const absolutePath = path.resolve(filePath);
    const watcher = this.watchers.get(absolutePath);
    
    if (watcher) {
      watcher.close();
      this.watchers.delete(absolutePath);
      this.fileHashes.delete(absolutePath);
      this.fileStats.delete(absolutePath);
      
      // Clear any pending debounce timer
      const timer = this.debounceTimers.get(absolutePath);
      if (timer) {
        clearTimeout(timer);
        this.debounceTimers.delete(absolutePath);
      }

      this.emit('watchStopped', {
        filename: absolutePath,
        timestamp: new Date()
      });
    }
  }

  /**
   * Stop monitoring all files
   */
  unwatchAll(): void {
    for (const filePath of this.watchers.keys()) {
      this.unwatchFile(filePath);
    }
  }

  /**
   * Get current monitoring status
   */
  getStatus(): {
    watchedFiles: string[];
    totalWatchers: number;
    lastActivity: Date | null;
  } {
    return {
      watchedFiles: Array.from(this.watchers.keys()),
      totalWatchers: this.watchers.size,
      lastActivity: this.getLastActivity()
    };
  }

  /**
   * Initialize file state (hash and stats)
   */
  private async initializeFileState(filePath: string): Promise<void> {
    try {
      const stats = await this.getFileStats(filePath);
      this.fileStats.set(filePath, stats);

      if (this.options.useChecksum) {
        const hash = await this.calculateFileHash(filePath);
        this.fileHashes.set(filePath, hash);
      }
    } catch (error) {
      // File might not exist yet, that's okay
      this.fileStats.delete(filePath);
      this.fileHashes.delete(filePath);
    }
  }

  /**
   * Handle file system events
   */
  private handleFileEvent(filePath: string, eventType: string, filename: Buffer | string | null): void {
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      await this.processFileChange(filePath, eventType);
      this.debounceTimers.delete(filePath);
    }, this.options.debounceDelay);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Process actual file changes after debounce
   */
  private async processFileChange(filePath: string, eventType: string): Promise<void> {
    try {
      const previousStats = this.fileStats.get(filePath);
      const previousHash = this.fileHashes.get(filePath);

      let currentStats: any;
      let currentHash: string | undefined;
      let changeType: CSVChangeEvent['type'] = 'change';

      try {
        currentStats = await this.getFileStats(filePath);
        
        if (this.options.useChecksum) {
          currentHash = await this.calculateFileHash(filePath);
        }

        // Determine change type
        if (!previousStats) {
          changeType = 'add';
        } else if (eventType === 'rename') {
          changeType = 'rename';
        } else if (this.hasFileChanged(previousStats, currentStats, previousHash, currentHash)) {
          changeType = 'change';
        } else {
          // No actual change detected, skip event
          return;
        }

        // Update stored state
        this.fileStats.set(filePath, currentStats);
        if (currentHash) {
          this.fileHashes.set(filePath, currentHash);
        }

      } catch (error) {
        // File might have been deleted
        if (previousStats) {
          changeType = 'delete';
          this.fileStats.delete(filePath);
          this.fileHashes.delete(filePath);
        } else {
          // File doesn't exist and didn't exist before, ignore
          return;
        }
      }

      // Emit change event
      const changeEvent: CSVChangeEvent = {
        type: changeType,
        filename: filePath,
        timestamp: new Date(),
        previousHash,
        currentHash,
        stats: currentStats ? {
          size: currentStats.size,
          mtime: currentStats.mtime,
          ctime: currentStats.ctime
        } : undefined
      };

      this.emit('change', changeEvent);

    } catch (error) {
      this.emit('error', {
        message: `Error processing file change for ${filePath}`,
        error,
        filename: filePath
      });
    }
  }

  /**
   * Check if file has actually changed
   */
  private hasFileChanged(
    previousStats: any,
    currentStats: any,
    previousHash?: string,
    currentHash?: string
  ): boolean {
    // If using checksums, compare hashes
    if (this.options.useChecksum && previousHash && currentHash) {
      return previousHash !== currentHash;
    }

    // Otherwise, compare size and modification time
    return (
      previousStats.size !== currentStats.size ||
      previousStats.mtime.getTime() !== currentStats.mtime.getTime()
    );
  }

  /**
   * Calculate file hash for change detection
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      readFile(filePath, this.options.encoding, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        const hash = createHash('sha256');
        hash.update(data);
        resolve(hash.digest('hex'));
      });
    });
  }

  /**
   * Get file statistics
   */
  private async getFileStats(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      stat(filePath, (err, stats) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(stats);
      });
    });
  }

  /**
   * Get last activity timestamp
   */
  private getLastActivity(): Date | null {
    let lastActivity: Date | null = null;
    
    for (const stats of this.fileStats.values()) {
      if (!lastActivity || stats.mtime > lastActivity) {
        lastActivity = stats.mtime;
      }
    }
    
    return lastActivity;
  }
}

/**
 * Convenience function to create and start monitoring a CSV file
 */
export async function createCSVMonitor(
  filePath: string | string[],
  options?: CSVMonitorOptions
): Promise<CSVMonitor> {
  const monitor = new CSVMonitor(options);
  
  const files = Array.isArray(filePath) ? filePath : [filePath];
  
  for (const file of files) {
    await monitor.watchFile(file);
  }
  
  return monitor;
}

/**
 * Utility function to validate CSV file structure
 */
export async function validateCSVStructure(filePath: string): Promise<{
  isValid: boolean;
  headers?: string[];
  rowCount?: number;
  errors?: string[];
}> {
  try {
    const content = await new Promise<string>((resolve, reject) => {
      readFile(filePath, 'utf8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return { isValid: false, errors: ['File is empty'] };
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rowCount = lines.length - 1; // Exclude header

    // Basic validation
    const errors: string[] = [];
    if (headers.length === 0) {
      errors.push('No headers found');
    }

    // Check for consistent column count
    for (let i = 1; i < Math.min(lines.length, 10); i++) {
      const columns = lines[i].split(',');
      if (columns.length !== headers.length) {
        errors.push(`Row ${i} has ${columns.length} columns, expected ${headers.length}`);
      }
    }

    return {
      isValid: errors.length === 0,
      headers,
      rowCount,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
} 