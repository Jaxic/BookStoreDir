import { CSVMonitor, createCSVMonitor, validateCSVStructure } from './csvMonitor';
import { CSVChangeLog, createChangeLog, formatChangeLogEntry } from './csvChangeLog';
import { 
  CSVValidationPipeline, 
  createBookstoreValidationPipeline, 
  type ValidationResult,
  type ValidationPipelineOptions 
} from './csvValidationPipeline';
import { 
  CSVBackupManager, 
  createBackupManager, 
  type BackupManagerOptions,
  type BackupResult 
} from './csvBackupManager';
import type { CSVChangeEvent } from './csvMonitor';
import type { ChangeLogEntry } from './csvChangeLog';
import { EventEmitter } from 'node:events';
import path from 'node:path';
import { createCSVDiffEngine, type CSVDiffOptions, type CSVDiffResult } from './csvDiffEngine.js';
import { createDiffReportGenerator, type ReportGenerationOptions, generateQuickConsoleReport } from './csvDiffReportGenerator.js';
import fs from 'node:fs/promises';

export interface UpdateManagerOptions {
  logDirectory?: string;
  monitorOptions?: {
    checkInterval?: number;
    useChecksum?: boolean;
    encoding?: BufferEncoding;
    debounceDelay?: number;
  };
  autoValidate?: boolean;
  enableNotifications?: boolean;
  validationOptions?: ValidationPipelineOptions;
  useEnhancedValidation?: boolean;
  backupOptions?: BackupManagerOptions & {
    enabled?: boolean;
    autoBackup?: boolean; // Automatically backup before changes
    backupOnValidationFailure?: boolean; // Backup when validation fails
  };
  watchDirectory?: string;
  changeLogPath?: string;
  enableValidation?: boolean;
  diffOptions?: {
    enabled?: boolean;
    mode?: CSVDiffOptions['mode'];
    keyColumns?: string[];
    autoGenerateReports?: boolean;
    reportFormats?: Array<'html' | 'console' | 'json' | 'markdown'>;
    reportOutputDir?: string;
    compareWithBackups?: boolean;
    maxRowsInReport?: number;
  };
}

export interface DataRebuildHook {
  name: string;
  description: string;
  handler: (event: CSVChangeEvent, entry: ChangeLogEntry) => Promise<void>;
  enabled: boolean;
}

export interface UpdateManagerStatus {
  isMonitoring: boolean;
  watchedFiles: string[];
  totalChanges: number;
  lastChange?: Date;
  registeredHooks: string[];
  errors: string[];
  validationPipeline?: {
    enabled: boolean;
    validators: string[];
  };
  backupManager?: {
    enabled: boolean;
    totalBackups: number;
    totalSize: number;
    autoBackup: boolean;
  };
}

export class CSVUpdateManager extends EventEmitter {
  private options: Required<UpdateManagerOptions>;
  private monitor: CSVMonitor;
  private changeLog: CSVChangeLog;
  private validationPipeline: CSVValidationPipeline | null = null;
  private backupManager: CSVBackupManager | null = null;
  private diffEngine: ReturnType<typeof createCSVDiffEngine> | null = null;
  private isRunning = false;
  private rebuildHooks: Map<string, DataRebuildHook> = new Map();
  private errors: string[] = [];

  constructor(options: UpdateManagerOptions = {}) {
    super();
    
    this.options = {
      logDirectory: 'logs',
      monitorOptions: {
        checkInterval: 1000,
        useChecksum: true,
        encoding: 'utf8',
        debounceDelay: 500
      },
      autoValidate: false,
      enableNotifications: false,
      validationOptions: {},
      useEnhancedValidation: false,
      backupOptions: {
        enabled: false,
        backupDirectory: 'backups',
        retentionPolicy: { maxBackups: 10 },
        autoBackup: false,
        compression: { enabled: true, level: 6 },
        backupOnValidationFailure: false
      },
      watchDirectory: process.cwd(),
      changeLogPath: 'logs/csv-changes.log',
      enableValidation: false,
      diffOptions: {
        enabled: false,
        mode: 'hybrid',
        keyColumns: [],
        autoGenerateReports: false,
        reportFormats: ['console'],
        reportOutputDir: 'reports',
        compareWithBackups: false,
        maxRowsInReport: 100
      },
      ...options
    };

    // Initialize required components (these are never null)
    this.monitor = new CSVMonitor(this.options.monitorOptions);
    this.changeLog = createChangeLog(this.options.logDirectory);

    // Initialize enhanced validation pipeline if enabled
    if (this.options.useEnhancedValidation) {
      this.validationPipeline = createBookstoreValidationPipeline(this.options.validationOptions);
      this.setupValidationEventHandlers();
    }

    // Initialize backup manager if enabled
    if (this.options.backupOptions?.enabled) {
      this.backupManager = createBackupManager(this.options.backupOptions);
      this.setupBackupEventHandlers();
    }

    // Initialize diff engine if enabled
    if (this.options.diffOptions?.enabled) {
      this.diffEngine = createCSVDiffEngine({
        mode: this.options.diffOptions.mode,
        keyColumns: this.options.diffOptions.keyColumns,
        maxRowsToProcess: this.options.diffOptions.maxRowsInReport
      });
      this.setupDiffEventHandlers();
    }

    this.setupEventHandlers();
  }

  /**
   * Initialize the update manager
   */
  async initialize(): Promise<void> {
    try {
      await this.changeLog.initialize();
      
      // Initialize backup manager if enabled
      if (this.backupManager) {
        await this.backupManager.initialize();
      }
      
      this.emit('initialized');
    } catch (error) {
      const errorMsg = `Failed to initialize CSV Update Manager: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Start monitoring a CSV file
   */
  async watchFile(filePath: string): Promise<void> {
    try {
      await this.monitor.watchFile(filePath);
      
      if (this.options.enableNotifications) {
        this.emit('fileWatchStarted', { filename: filePath, timestamp: new Date() });
      }
    } catch (error) {
      const errorMsg = `Failed to watch file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Stop monitoring a specific file
   */
  unwatchFile(filePath: string): void {
    this.monitor.unwatchFile(filePath);
    
    if (this.options.enableNotifications) {
      this.emit('fileWatchStopped', { filename: filePath, timestamp: new Date() });
    }
  }

  /**
   * Stop monitoring all files
   */
  unwatchAll(): void {
    this.monitor.unwatchAll();
    
    if (this.options.enableNotifications) {
      this.emit('allWatchesStopped', { timestamp: new Date() });
    }
  }

  /**
   * Register a data rebuild hook
   */
  registerRebuildHook(hook: DataRebuildHook): void {
    this.rebuildHooks.set(hook.name, hook);
    this.emit('hookRegistered', { hookName: hook.name, timestamp: new Date() });
  }

  /**
   * Unregister a data rebuild hook
   */
  unregisterRebuildHook(hookName: string): boolean {
    const removed = this.rebuildHooks.delete(hookName);
    if (removed) {
      this.emit('hookUnregistered', { hookName, timestamp: new Date() });
    }
    return removed;
  }

  /**
   * Enable or disable a specific hook
   */
  toggleHook(hookName: string, enabled: boolean): boolean {
    const hook = this.rebuildHooks.get(hookName);
    if (hook) {
      hook.enabled = enabled;
      this.emit('hookToggled', { hookName, enabled, timestamp: new Date() });
      return true;
    }
    return false;
  }

  /**
   * Get current status
   */
  async getStatus(): Promise<UpdateManagerStatus> {
    const monitorStatus = this.monitor.getStatus();
    const summary = await this.changeLog.getSummary();

    const status: UpdateManagerStatus = {
      isMonitoring: monitorStatus.totalWatchers > 0,
      watchedFiles: monitorStatus.watchedFiles,
      totalChanges: summary.totalChanges,
      lastChange: summary.lastChange,
      registeredHooks: Array.from(this.rebuildHooks.keys()),
      errors: [...this.errors]
    };

    // Add validation pipeline status if enabled
    if (this.validationPipeline) {
      status.validationPipeline = {
        enabled: true,
        validators: this.validationPipeline.getValidatorStats().map(v => v.name)
      };
    }

    // Add backup manager status if enabled
    if (this.backupManager) {
      const backupStats = this.backupManager.getBackupStats();
      status.backupManager = {
        enabled: true,
        totalBackups: backupStats.totalBackups,
        totalSize: backupStats.totalSize,
        autoBackup: this.options.backupOptions?.autoBackup || false
      };
    }

    return status;
  }

  /**
   * Get recent changes
   */
  async getRecentChanges(limit: number = 10): Promise<ChangeLogEntry[]> {
    return this.changeLog.getRecentChanges(limit);
  }

  /**
   * Get changes for a specific file
   */
  async getFileChanges(filename: string, limit?: number): Promise<ChangeLogEntry[]> {
    return this.changeLog.getFileChanges(filename, limit);
  }

  /**
   * Get change log summary
   */
  async getChangeLogSummary() {
    return this.changeLog.getSummary();
  }

  /**
   * Export change log
   */
  async exportChangeLog(format: 'json' | 'csv' = 'json'): Promise<string> {
    return this.changeLog.export(format);
  }

  /**
   * Clear change log
   */
  async clearChangeLog(): Promise<void> {
    await this.changeLog.clear();
    this.emit('changeLogCleared', { timestamp: new Date() });
  }

  /**
   * Validate a CSV file using enhanced validation pipeline
   */
  async validateFile(filePath: string): Promise<ValidationResult | {
    isValid: boolean;
    headers?: string[];
    rowCount?: number;
    errors?: string[];
  }> {
    if (this.validationPipeline) {
      // Use enhanced validation pipeline
      return this.validationPipeline.validateFile(filePath);
    } else {
      // Fall back to basic validation
      return validateCSVStructure(filePath);
    }
  }

  /**
   * Get validation pipeline statistics
   */
  getValidationStats(): { name: string; description: string }[] | null {
    return this.validationPipeline?.getValidatorStats() || null;
  }

  /**
   * Register a custom validator with the validation pipeline
   */
  registerCustomValidator(validator: {
    name: string;
    description: string;
    validate: (value: any, row: any, rowIndex: number, column: string) => any;
  }): boolean {
    if (this.validationPipeline) {
      this.validationPipeline.registerCustomValidator(validator);
      return true;
    }
    return false;
  }

  /**
   * Get list of registered hooks
   */
  getRegisteredHooks(): DataRebuildHook[] {
    return Array.from(this.rebuildHooks.values());
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.emit('errorsCleared', { timestamp: new Date() });
  }

  /**
   * Generate diff report for file changes
   */
  async generateDiffReport(
    oldFilePath: string, 
    newFilePath: string, 
    options?: {
      format?: 'html' | 'console' | 'json' | 'markdown';
      outputPath?: string;
      includeStatistics?: boolean;
    }
  ): Promise<string> {
    if (!this.diffEngine) {
      throw new Error('Diff engine is not enabled. Set diffOptions.enabled to true in UpdateManagerOptions.');
    }

    try {
      // Generate diff result
      const diffResult = await this.diffEngine.compareFiles(oldFilePath, newFilePath);
      
      // Create report generator
      const reportGenerator = createDiffReportGenerator({
        format: options?.format || 'console',
        outputPath: options?.outputPath,
        includeStatistics: options?.includeStatistics ?? true,
        includeRowDetails: true,
        includeSchemaChanges: true,
        maxRowsToShow: this.options.diffOptions?.maxRowsInReport || 100
      });

      // Generate and return report
      const report = await reportGenerator.generateReport(diffResult);
      
      this.emit('diffReportGenerated', {
        oldFile: oldFilePath,
        newFile: newFilePath,
        format: options?.format || 'console',
        outputPath: options?.outputPath,
        timestamp: new Date()
      });

      return report;
    } catch (error) {
      const errorMsg = `Failed to generate diff report: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Compare current file with backup
   */
  async compareWithBackup(filePath: string, backupId: string): Promise<CSVDiffResult> {
    if (!this.diffEngine) {
      throw new Error('Diff engine is not enabled. Set diffOptions.enabled to true in UpdateManagerOptions.');
    }

    if (!this.backupManager) {
      throw new Error('Backup manager is not enabled. Cannot compare with backup.');
    }

    try {
      // Get backup data
      const backups = await this.backupManager.listBackups();
      const backup = backups.find(b => b.id === backupId);
      
      if (!backup) {
        throw new Error(`Backup with ID ${backupId} not found`);
      }

      // Create temporary file for backup content
      const tempBackupPath = path.join(path.dirname(filePath), `.temp-backup-${backupId}.csv`);
      
      try {
        // Restore backup to temporary file
        const restoreResult = await this.backupManager.restoreFromBackup(backupId, tempBackupPath);
        
        if (!restoreResult.success) {
          throw new Error(`Failed to restore backup: ${restoreResult.error}`);
        }

        // Perform comparison
        const diffResult = await this.diffEngine.compareFiles(tempBackupPath, filePath);
        
        // Update source files to reflect backup comparison
        diffResult.sourceFiles.old = `backup-${backupId}`;
        diffResult.sourceFiles.new = filePath;
        
        this.emit('backupComparisonCompleted', {
          filePath,
          backupId,
          diffResult,
          timestamp: new Date()
        });

        return diffResult;
      } finally {
        // Clean up temporary file
        try {
          await fs.unlink(tempBackupPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch (error) {
      const errorMsg = `Failed to compare with backup: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.addError(errorMsg);
      throw new Error(errorMsg);
    }
  }

  /**
   * Setup event handlers for validation pipeline
   */
  private setupValidationEventHandlers(): void {
    if (!this.validationPipeline) return;

    this.validationPipeline.on('validationStarted', (data) => {
      this.emit('validationStarted', data);
    });

    this.validationPipeline.on('validationCompleted', (data) => {
      this.emit('validationCompleted', data);
    });

    this.validationPipeline.on('validationFailed', (data) => {
      this.emit('validationFailed', data);
      this.addError(`Validation failed: ${data.error}`);
    });

    this.validationPipeline.on('validationWarning', (data) => {
      this.emit('validationWarning', data);
    });

    this.validationPipeline.on('error', (error) => {
      this.addError(`Validation pipeline error: ${error.message}`);
    });
  }

  private setupBackupEventHandlers(): void {
    if (!this.backupManager) return;

    this.backupManager.on('initialized', () => {
      this.emit('backupManagerInitialized', { timestamp: new Date() });
    });

    this.backupManager.on('backupStarted', (data) => {
      this.emit('backupStarted', data);
    });

    this.backupManager.on('backupCompleted', (data) => {
      this.emit('backupCompleted', data);
    });

    this.backupManager.on('backupFailed', (data) => {
      this.emit('backupFailed', data);
      this.addError(`Backup failed: ${data.error}`);
    });

    this.backupManager.on('restoreStarted', (data) => {
      this.emit('restoreStarted', data);
    });

    this.backupManager.on('restoreCompleted', (data) => {
      this.emit('restoreCompleted', data);
    });

    this.backupManager.on('restoreFailed', (data) => {
      this.emit('restoreFailed', data);
      this.addError(`Restore failed: ${data.error}`);
    });

    this.backupManager.on('backupDeleted', (data) => {
      this.emit('backupDeleted', data);
    });

    this.backupManager.on('error', (error) => {
      this.addError(`Backup manager error: ${error.message}`);
    });
  }

  /**
   * Setup event handlers for monitor events
   */
  private setupEventHandlers(): void {
    // Handle file changes from monitor
    this.monitor.on('change', async (event: CSVChangeEvent) => {
      try {
        await this.handleFileChange(event);
      } catch (error) {
        this.addError(`Error handling file change: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    // Handle monitor errors
    this.monitor.on('error', (error: any) => {
      this.addError(`Monitor error: ${error.message || 'Unknown monitor error'}`);
    });

    // Handle watch started events
    this.monitor.on('watchStarted', (event: any) => {
      if (this.options.enableNotifications) {
        this.emit('watchStarted', event);
      }
    });

    // Handle watch stopped events
    this.monitor.on('watchStopped', (event: any) => {
      if (this.options.enableNotifications) {
        this.emit('watchStopped', event);
      }
    });
  }

  /**
   * Handle file change events
   */
  private async handleFileChange(event: CSVChangeEvent): Promise<void> {
    let metadata: ChangeLogEntry['metadata'] | undefined;
    let backupResult: BackupResult | undefined;

    // Create automatic backup if enabled and file exists
    if (this.backupManager && this.options.backupOptions?.autoBackup && 
        (event.type === 'change' || event.type === 'add')) {
      try {
        const context = `Auto-backup before ${event.type} event`;
        const tags = ['auto-backup', event.type];
        backupResult = await this.backupManager.createBackup(event.filename, context, tags);
        
        if (backupResult.success) {
          this.emit('autoBackupCreated', { 
            filename: event.filename, 
            backupId: backupResult.backupId,
            timestamp: new Date() 
          });
        }
      } catch (error) {
        this.addError(`Auto-backup failed for ${event.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Validate file if auto-validation is enabled and file exists
    if (this.options.autoValidate && (event.type === 'change' || event.type === 'add')) {
      try {
        const validation = await this.validateFile(event.filename);
        
        // Create backup on validation failure if enabled
        if (this.backupManager && this.options.backupOptions?.backupOnValidationFailure && 
            !backupResult && // Don't create duplicate backup
            ((this.validationPipeline && 'isValid' in validation && !validation.isValid) ||
             (!this.validationPipeline && 'isValid' in validation && !validation.isValid))) {
          try {
            const context = `Backup due to validation failure`;
            const tags = ['validation-failure', event.type];
            const validationBackup = await this.backupManager.createBackup(event.filename, context, tags);
            
            if (validationBackup.success) {
              this.emit('validationFailureBackupCreated', { 
                filename: event.filename, 
                backupId: validationBackup.backupId,
                timestamp: new Date() 
              });
            }
          } catch (error) {
            this.addError(`Validation failure backup failed for ${event.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        if (this.validationPipeline && 'metadata' in validation) {
          // Enhanced validation result
          const enhancedResult = validation as ValidationResult;
          metadata = {
            rowCount: enhancedResult.rowCount,
            headers: enhancedResult.headers,
            validationErrors: enhancedResult.errors?.map(e => e.message),
            validationWarnings: enhancedResult.warnings?.map(w => w.message),
            validationMetadata: enhancedResult.metadata,
            performance: enhancedResult.performance,
            backupId: backupResult?.backupId // Include backup ID in metadata
          };
        } else {
          // Basic validation result
          const basicResult = validation as { isValid: boolean; headers?: string[]; rowCount?: number; errors?: string[] };
          metadata = {
            rowCount: basicResult.rowCount,
            headers: basicResult.headers,
            validationErrors: basicResult.errors,
            backupId: backupResult?.backupId // Include backup ID in metadata
          };
        }
      } catch (error) {
        this.addError(`Validation failed for ${event.filename}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else if (backupResult) {
      // If we only created a backup without validation, still include the backup ID
      metadata = {
        backupId: backupResult.backupId
      };
    }

    // Log the change
    const entryId = await this.changeLog.logChange(event, metadata);
    const entry = (await this.changeLog.query({ limit: 1 }))[0];

    // Emit change event
    if (this.options.enableNotifications) {
      this.emit('csvChange', { event, entry, entryId });
    }

    // Execute rebuild hooks
    await this.executeRebuildHooks(event, entry);

    // Generate diff report if enabled and we have a previous backup
    if (this.diffEngine && this.options.diffOptions?.autoGenerateReports && 
        this.options.diffOptions?.compareWithBackups && backupResult?.success) {
      try {
        await this.generateAutomaticDiffReport(event.filename, backupResult.backupId);
      } catch (error) {
        this.addError(`Failed to generate automatic diff report: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  /**
   * Execute all enabled rebuild hooks
   */
  private async executeRebuildHooks(event: CSVChangeEvent, entry: ChangeLogEntry): Promise<void> {
    const enabledHooks = Array.from(this.rebuildHooks.values()).filter(hook => hook.enabled);

    for (const hook of enabledHooks) {
      try {
        await hook.handler(event, entry);
        this.emit('hookExecuted', { 
          hookName: hook.name, 
          event, 
          success: true, 
          timestamp: new Date() 
        });
      } catch (error) {
        const errorMsg = `Hook '${hook.name}' failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
        this.addError(errorMsg);
        this.emit('hookExecuted', { 
          hookName: hook.name, 
          event, 
          success: false, 
          error: errorMsg, 
          timestamp: new Date() 
        });
      }
    }
  }

  /**
   * Add an error to the error log
   */
  private addError(message: string): void {
    const timestamp = new Date().toISOString();
    const errorMsg = `[${timestamp}] ${message}`;
    
    this.errors.push(errorMsg);
    
    // Keep only the last 50 errors
    if (this.errors.length > 50) {
      this.errors.splice(0, this.errors.length - 50);
    }

    this.emit('error', { message: errorMsg, timestamp: new Date() });
  }

  /**
   * Setup event handlers for diff engine
   */
  private setupDiffEventHandlers(): void {
    if (!this.diffEngine) return;

    this.diffEngine.on('diffStarted', (data) => {
      this.emit('diffStarted', data);
    });

    this.diffEngine.on('diffCompleted', (data) => {
      this.emit('diffCompleted', data);
    });

    this.diffEngine.on('diffFailed', (data) => {
      this.emit('diffFailed', data);
      this.addError(`Diff operation failed: ${data.error}`);
    });
  }

  /**
   * Generate automatic diff report when file changes
   */
  private async generateAutomaticDiffReport(filePath: string, currentBackupId: string): Promise<void> {
    if (!this.backupManager || !this.diffEngine) return;

    try {
      // Get list of backups for this file
      const backups = await this.backupManager.listBackups();
      const fileBackups = backups
        .filter(backup => backup.originalPath === filePath)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Find the previous backup (not the current one)
      const previousBackup = fileBackups.find(backup => backup.id !== currentBackupId);
      
      if (!previousBackup) {
        // No previous backup to compare with
        return;
      }

      // Generate diff report
      const diffResult = await this.compareWithBackup(filePath, previousBackup.id);
      
      // Generate reports in specified formats
      const formats = this.options.diffOptions?.reportFormats || ['console'];
      const outputDir = this.options.diffOptions?.reportOutputDir || 'reports';
      
      for (const format of formats) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = path.join(outputDir, `diff-${path.basename(filePath, '.csv')}-${timestamp}.${format}`);
        
        await this.generateDiffReport(previousBackup.originalPath, filePath, {
          format,
          outputPath,
          includeStatistics: true
        });
      }

      this.emit('automaticDiffReportGenerated', {
        filePath,
        previousBackupId: previousBackup.id,
        currentBackupId,
        formats,
        timestamp: new Date()
      });

    } catch (error) {
      this.addError(`Automatic diff report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Create a CSV Update Manager instance
 */
export function createUpdateManager(options?: UpdateManagerOptions): CSVUpdateManager {
  return new CSVUpdateManager(options);
}

/**
 * Create common rebuild hooks for bookstore data
 */
export function createBookstoreRebuildHooks(): DataRebuildHook[] {
  return [
    {
      name: 'regenerate-json',
      description: 'Regenerate JSON data from updated CSV',
      enabled: true,
      handler: async (event, entry) => {
        // This would trigger JSON regeneration
        console.log(`Regenerating JSON data due to ${event.type} in ${path.basename(event.filename)}`);
        // Implementation would go here to regenerate public/data/bookstores.json
      }
    },
    {
      name: 'rebuild-static-pages',
      description: 'Rebuild static pages when store data changes',
      enabled: true,
      handler: async (event, entry) => {
        // This would trigger static page rebuilds
        console.log(`Rebuilding static pages due to ${event.type} in ${path.basename(event.filename)}`);
        // Implementation would trigger Astro build or specific page regeneration
      }
    },
    {
      name: 'update-search-index',
      description: 'Update search index when store data changes',
      enabled: true,
      handler: async (event, entry) => {
        // This would update search indices
        console.log(`Updating search index due to ${event.type} in ${path.basename(event.filename)}`);
        // Implementation would update any search indices or filters
      }
    },
    {
      name: 'notify-administrators',
      description: 'Send notifications to administrators about data changes',
      enabled: false, // Disabled by default
      handler: async (event, entry) => {
        // This would send notifications
        console.log(`Notifying administrators about ${event.type} in ${path.basename(event.filename)}`);
        // Implementation would send emails, webhooks, etc.
      }
    }
  ];
}

/**
 * Utility function to format update manager status
 */
export function formatUpdateManagerStatus(status: UpdateManagerStatus): string {
  const lines = [
    `Monitoring Status: ${status.isMonitoring ? 'Active' : 'Inactive'}`,
    `Watched Files: ${status.watchedFiles.length}`,
    ...status.watchedFiles.map(file => `  - ${path.basename(file)}`),
    `Total Changes: ${status.totalChanges}`,
    status.lastChange ? `Last Change: ${status.lastChange.toLocaleString()}` : 'No changes recorded',
    `Registered Hooks: ${status.registeredHooks.length}`,
    ...status.registeredHooks.map(hook => `  - ${hook}`),
  ];

  if (status.errors.length > 0) {
    lines.push('');
    lines.push('Recent Errors:');
    lines.push(...status.errors.slice(-5).map(error => `  ${error}`));
  }

  return lines.join('\n');
} 