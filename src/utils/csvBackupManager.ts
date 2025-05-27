import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import path from 'node:path';
import { EventEmitter } from 'node:events';

// Backup metadata interface
export interface BackupMetadata {
  id: string;
  originalPath: string;
  backupPath: string;
  timestamp: Date;
  fileSize: number;
  checksum: string;
  checksumAlgorithm: 'md5' | 'sha256';
  compressed: boolean;
  version: number;
  context?: string; // Why the backup was created
  tags?: string[]; // Additional categorization
}

// Backup configuration options
export interface BackupManagerOptions {
  backupDirectory?: string;
  retentionPolicy?: {
    maxBackups?: number; // Maximum number of backups to keep
    maxAge?: number; // Maximum age in milliseconds
    minBackups?: number; // Minimum backups to always keep
  };
  compression?: {
    enabled?: boolean;
    level?: number; // 1-9, where 9 is maximum compression
  };
  checksumAlgorithm?: 'md5' | 'sha256';
  enableMetadataStorage?: boolean;
  metadataFile?: string;
}

// Backup operation result
export interface BackupResult {
  success: boolean;
  backupId: string;
  backupPath: string;
  metadata: BackupMetadata;
  error?: string;
}

// Restoration result
export interface RestoreResult {
  success: boolean;
  restoredPath: string;
  backupId: string;
  error?: string;
}

// Backup listing options
export interface BackupListOptions {
  originalPath?: string;
  fromDate?: Date;
  toDate?: Date;
  tags?: string[];
  limit?: number;
  sortBy?: 'timestamp' | 'size' | 'version';
  sortOrder?: 'asc' | 'desc';
}

export class CSVBackupManager extends EventEmitter {
  private options: Required<BackupManagerOptions>;
  private metadataCache: Map<string, BackupMetadata> = new Map();
  private initialized = false;

  constructor(options: BackupManagerOptions = {}) {
    super();
    
    this.options = {
      backupDirectory: 'backups',
      retentionPolicy: {
        maxBackups: 50,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        minBackups: 5
      },
      compression: {
        enabled: true,
        level: 6
      },
      checksumAlgorithm: 'sha256',
      enableMetadataStorage: true,
      metadataFile: 'backup-metadata.json',
      ...options
    };

    // Merge nested objects properly
    if (options.retentionPolicy) {
      this.options.retentionPolicy = { ...this.options.retentionPolicy, ...options.retentionPolicy };
    }
    if (options.compression) {
      this.options.compression = { ...this.options.compression, ...options.compression };
    }
  }

  /**
   * Initialize the backup manager
   */
  async initialize(): Promise<void> {
    try {
      // Create backup directory if it doesn't exist
      await fs.mkdir(this.options.backupDirectory, { recursive: true });

      // Load existing metadata
      if (this.options.enableMetadataStorage) {
        await this.loadMetadata();
      }

      this.initialized = true;
      this.emit('initialized');
    } catch (error) {
      const errorMsg = `Failed to initialize backup manager: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.emit('error', new Error(errorMsg));
      throw new Error(errorMsg);
    }
  }

  /**
   * Create a backup of a CSV file
   */
  async createBackup(
    filePath: string, 
    context?: string, 
    tags?: string[]
  ): Promise<BackupResult> {
    if (!this.initialized) {
      throw new Error('Backup manager not initialized. Call initialize() first.');
    }

    try {
      this.emit('backupStarted', { filePath, context, timestamp: new Date() });

      // Generate backup ID and paths
      const backupId = this.generateBackupId(filePath);
      const version = await this.getNextVersion(filePath);
      const backupFileName = this.generateBackupFileName(filePath, backupId, version);
      const backupPath = path.join(this.options.backupDirectory, backupFileName);

      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Calculate checksum and create backup
      const checksum = await this.calculateChecksum(filePath);
      
      // Copy file with optional compression
      if (this.options.compression.enabled) {
        await this.createCompressedBackup(filePath, backupPath);
      } else {
        await fs.copyFile(filePath, backupPath);
      }

      // Create metadata
      const metadata: BackupMetadata = {
        id: backupId,
        originalPath: path.resolve(filePath),
        backupPath: path.resolve(backupPath),
        timestamp: new Date(),
        fileSize: stats.size,
        checksum,
        checksumAlgorithm: this.options.checksumAlgorithm,
        compressed: this.options.compression.enabled || false,
        version,
        context,
        tags
      };

      // Store metadata
      this.metadataCache.set(backupId, metadata);
      if (this.options.enableMetadataStorage) {
        await this.saveMetadata();
      }

      // Apply retention policy
      await this.applyRetentionPolicy(filePath);

      const result: BackupResult = {
        success: true,
        backupId,
        backupPath,
        metadata
      };

      this.emit('backupCompleted', { result, timestamp: new Date() });
      return result;

    } catch (error) {
      const errorMsg = `Failed to create backup for ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      const result: BackupResult = {
        success: false,
        backupId: '',
        backupPath: '',
        metadata: {} as BackupMetadata,
        error: errorMsg
      };

      this.emit('backupFailed', { filePath, error: errorMsg, timestamp: new Date() });
      return result;
    }
  }

  /**
   * Restore a file from backup
   */
  async restoreFromBackup(
    backupId: string, 
    targetPath?: string
  ): Promise<RestoreResult> {
    try {
      const metadata = this.metadataCache.get(backupId);
      if (!metadata) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }

      const restorePath = targetPath || metadata.originalPath;
      
      this.emit('restoreStarted', { backupId, restorePath, timestamp: new Date() });

      // Verify backup file exists
      await fs.access(metadata.backupPath);

      // Create backup of current file if it exists
      let currentFileBackupId: string | undefined;
      try {
        await fs.access(restorePath);
        const currentBackup = await this.createBackup(restorePath, `Pre-restore backup before restoring ${backupId}`);
        currentFileBackupId = currentBackup.backupId;
      } catch {
        // File doesn't exist, no need to backup
      }

      try {
        // Restore file with decompression if needed
        if (metadata.compressed) {
          await this.restoreCompressedBackup(metadata.backupPath, restorePath);
        } else {
          await fs.copyFile(metadata.backupPath, restorePath);
        }

        // Verify restoration integrity
        const restoredChecksum = await this.calculateChecksum(restorePath);
        if (restoredChecksum !== metadata.checksum) {
          throw new Error('Checksum mismatch after restoration');
        }

        const result: RestoreResult = {
          success: true,
          restoredPath: restorePath,
          backupId
        };

        this.emit('restoreCompleted', { result, timestamp: new Date() });
        return result;

      } catch (restoreError) {
        // If restoration failed and we created a backup, try to restore it
        if (currentFileBackupId) {
          try {
            const rollbackMetadata = this.metadataCache.get(currentFileBackupId);
            if (rollbackMetadata) {
              if (rollbackMetadata.compressed) {
                await this.restoreCompressedBackup(rollbackMetadata.backupPath, restorePath);
              } else {
                await fs.copyFile(rollbackMetadata.backupPath, restorePath);
              }
            }
          } catch {
            // Rollback failed, but we still want to report the original error
          }
        }
        throw restoreError;
      }

    } catch (error) {
      const errorMsg = `Failed to restore backup ${backupId}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      const result: RestoreResult = {
        success: false,
        restoredPath: '',
        backupId,
        error: errorMsg
      };

      this.emit('restoreFailed', { backupId, error: errorMsg, timestamp: new Date() });
      return result;
    }
  }

  /**
   * List available backups
   */
  async listBackups(options: BackupListOptions = {}): Promise<BackupMetadata[]> {
    let backups = Array.from(this.metadataCache.values());

    // Apply filters
    if (options.originalPath) {
      const resolvedPath = path.resolve(options.originalPath);
      backups = backups.filter(backup => backup.originalPath === resolvedPath);
    }

    if (options.fromDate) {
      backups = backups.filter(backup => backup.timestamp >= options.fromDate!);
    }

    if (options.toDate) {
      backups = backups.filter(backup => backup.timestamp <= options.toDate!);
    }

    if (options.tags && options.tags.length > 0) {
      backups = backups.filter(backup => 
        backup.tags && backup.tags.some(tag => options.tags!.includes(tag))
      );
    }

    // Apply sorting
    const sortBy = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';
    
    backups.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'version':
          comparison = a.version - b.version;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply limit
    if (options.limit && options.limit > 0) {
      backups = backups.slice(0, options.limit);
    }

    return backups;
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const metadata = this.metadataCache.get(backupId);
      if (!metadata) {
        return false;
      }

      // Delete backup file
      await fs.unlink(metadata.backupPath);

      // Remove from metadata
      this.metadataCache.delete(backupId);
      
      if (this.options.enableMetadataStorage) {
        await this.saveMetadata();
      }

      this.emit('backupDeleted', { backupId, timestamp: new Date() });
      return true;

    } catch (error) {
      this.emit('error', new Error(`Failed to delete backup ${backupId}: ${error instanceof Error ? error.message : 'Unknown error'}`));
      return false;
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
    byOriginalPath: Record<string, number>;
  } {
    const backups = Array.from(this.metadataCache.values());
    
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.fileSize, 0),
      oldestBackup: backups.length > 0 ? new Date(Math.min(...backups.map(b => b.timestamp.getTime()))) : undefined,
      newestBackup: backups.length > 0 ? new Date(Math.max(...backups.map(b => b.timestamp.getTime()))) : undefined,
      byOriginalPath: {} as Record<string, number>
    };

    // Count backups by original path
    backups.forEach(backup => {
      stats.byOriginalPath[backup.originalPath] = (stats.byOriginalPath[backup.originalPath] || 0) + 1;
    });

    return stats;
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    try {
      const metadata = this.metadataCache.get(backupId);
      if (!metadata) {
        return false;
      }

      // Check if backup file exists
      await fs.access(metadata.backupPath);

      // Calculate checksum of backup file
      let actualChecksum: string;
      if (metadata.compressed) {
        // For compressed files, we need to decompress and then calculate checksum
        const tempPath = `${metadata.backupPath}.temp`;
        await this.restoreCompressedBackup(metadata.backupPath, tempPath);
        actualChecksum = await this.calculateChecksum(tempPath);
        await fs.unlink(tempPath);
      } else {
        actualChecksum = await this.calculateChecksum(metadata.backupPath);
      }

      return actualChecksum === metadata.checksum;

    } catch {
      return false;
    }
  }

  /**
   * Clean up old backups based on retention policy
   */
  async cleanupOldBackups(): Promise<number> {
    let deletedCount = 0;
    const groupedBackups = this.groupBackupsByOriginalPath();

    for (const [originalPath, backups] of groupedBackups) {
      const deleted = await this.applyRetentionPolicy(originalPath);
      deletedCount += deleted;
    }

    return deletedCount;
  }

  // Private helper methods

  private generateBackupId(filePath: string): string {
    const timestamp = Date.now();
    const fileName = path.basename(filePath, path.extname(filePath));
    const hash = createHash('md5').update(`${filePath}${timestamp}`).digest('hex').substring(0, 8);
    return `${fileName}_${timestamp}_${hash}`;
  }

  private generateBackupFileName(originalPath: string, backupId: string, version: number): string {
    const ext = path.extname(originalPath);
    const compressionExt = this.options.compression.enabled ? '.gz' : '';
    return `${backupId}_v${version}${ext}${compressionExt}`;
  }

  private async getNextVersion(filePath: string): Promise<number> {
    const resolvedPath = path.resolve(filePath);
    const existingBackups = Array.from(this.metadataCache.values())
      .filter(backup => backup.originalPath === resolvedPath);
    
    if (existingBackups.length === 0) {
      return 1;
    }

    return Math.max(...existingBackups.map(backup => backup.version)) + 1;
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = createHash(this.options.checksumAlgorithm);
    const stream = createReadStream(filePath);
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    return hash.digest('hex');
  }

  private async createCompressedBackup(sourcePath: string, targetPath: string): Promise<void> {
    const readStream = createReadStream(sourcePath);
    const gzipStream = createGzip({ level: this.options.compression.level });
    const writeStream = createWriteStream(targetPath);

    await pipeline(readStream, gzipStream, writeStream);
  }

  private async restoreCompressedBackup(backupPath: string, targetPath: string): Promise<void> {
    const readStream = createReadStream(backupPath);
    const gunzipStream = createGunzip();
    const writeStream = createWriteStream(targetPath);

    await pipeline(readStream, gunzipStream, writeStream);
  }

  private async loadMetadata(): Promise<void> {
    try {
      const metadataPath = path.join(this.options.backupDirectory, this.options.metadataFile);
      const data = await fs.readFile(metadataPath, 'utf8');
      const metadata: BackupMetadata[] = JSON.parse(data);
      
      this.metadataCache.clear();
      metadata.forEach(item => {
        // Convert timestamp string back to Date object
        item.timestamp = new Date(item.timestamp);
        this.metadataCache.set(item.id, item);
      });
    } catch (error) {
      // Metadata file doesn't exist or is corrupted, start fresh
      this.metadataCache.clear();
    }
  }

  private async saveMetadata(): Promise<void> {
    try {
      const metadataPath = path.join(this.options.backupDirectory, this.options.metadataFile);
      const metadata = Array.from(this.metadataCache.values());
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
    } catch (error) {
      this.emit('error', new Error(`Failed to save metadata: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  private groupBackupsByOriginalPath(): Map<string, BackupMetadata[]> {
    const grouped = new Map<string, BackupMetadata[]>();
    
    for (const backup of this.metadataCache.values()) {
      const existing = grouped.get(backup.originalPath) || [];
      existing.push(backup);
      grouped.set(backup.originalPath, existing);
    }

    return grouped;
  }

  private async applyRetentionPolicy(originalPath: string): Promise<number> {
    const resolvedPath = path.resolve(originalPath);
    const backups = Array.from(this.metadataCache.values())
      .filter(backup => backup.originalPath === resolvedPath)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first

    let deletedCount = 0;
    const { maxBackups, maxAge, minBackups } = this.options.retentionPolicy;
    const now = Date.now();

    // Apply count-based retention
    if (maxBackups && backups.length > maxBackups) {
      const toDelete = backups.slice(maxBackups);
      for (const backup of toDelete) {
        if (backups.length - deletedCount > (minBackups || 0)) {
          await this.deleteBackup(backup.id);
          deletedCount++;
        }
      }
    }

    // Apply age-based retention
    if (maxAge) {
      for (const backup of backups) {
        if (now - backup.timestamp.getTime() > maxAge && backups.length - deletedCount > (minBackups || 0)) {
          await this.deleteBackup(backup.id);
          deletedCount++;
        }
      }
    }

    return deletedCount;
  }
}

/**
 * Factory function to create a backup manager
 */
export function createBackupManager(options?: BackupManagerOptions): CSVBackupManager {
  return new CSVBackupManager(options);
}

/**
 * Utility function to format backup metadata for display
 */
export function formatBackupMetadata(metadata: BackupMetadata): string {
  const size = (metadata.fileSize / 1024).toFixed(1);
  const date = metadata.timestamp.toLocaleString();
  const compression = metadata.compressed ? ' (compressed)' : '';
  const context = metadata.context ? ` - ${metadata.context}` : '';
  
  return `${metadata.id} | v${metadata.version} | ${size}KB${compression} | ${date}${context}`;
}

/**
 * Utility function to format backup statistics
 */
export function formatBackupStats(stats: ReturnType<CSVBackupManager['getBackupStats']>): string {
  const totalSizeMB = (stats.totalSize / 1024 / 1024).toFixed(2);
  const oldestDate = stats.oldestBackup?.toLocaleDateString() || 'N/A';
  const newestDate = stats.newestBackup?.toLocaleDateString() || 'N/A';
  
  let result = `Total Backups: ${stats.totalBackups}\n`;
  result += `Total Size: ${totalSizeMB} MB\n`;
  result += `Date Range: ${oldestDate} - ${newestDate}\n`;
  result += `Files with Backups: ${Object.keys(stats.byOriginalPath).length}\n`;
  
  if (Object.keys(stats.byOriginalPath).length > 0) {
    result += '\nBackups by File:\n';
    Object.entries(stats.byOriginalPath).forEach(([filePath, count]) => {
      const fileName = path.basename(filePath);
      result += `  ${fileName}: ${count} backups\n`;
    });
  }
  
  return result;
} 