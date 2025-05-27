import Ajv, { type JSONSchemaType } from 'ajv';
import addFormats from 'ajv-formats';
import { parse } from 'csv-parse/sync';
import { readFile } from 'node:fs/promises';
import { EventEmitter } from 'node:events';

// Enhanced validation result interface
export interface ValidationResult {
  isValid: boolean;
  headers?: string[];
  rowCount?: number;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  metadata?: ValidationMetadata;
  performance?: ValidationPerformance;
}

export interface ValidationError {
  type: 'structure' | 'schema' | 'data' | 'format';
  severity: 'critical' | 'error' | 'warning';
  message: string;
  row?: number;
  column?: string | number;
  value?: any;
  expected?: any;
  code?: string;
}

export interface ValidationWarning {
  type: 'data_quality' | 'performance' | 'format';
  message: string;
  row?: number;
  column?: string | number;
  value?: any;
  suggestion?: string;
}

export interface ValidationMetadata {
  fileSize: number;
  encoding: string;
  delimiter: string;
  quoteChar: string;
  escapeChar?: string;
  hasHeaders: boolean;
  columnCount: number;
  emptyRows: number;
  duplicateRows: number;
  dataTypes: Record<string, string>;
  parseTime?: number;
}

export interface ValidationPerformance {
  parseTime: number;
  validationTime: number;
  totalTime: number;
  memoryUsage: number;
}

// Schema definitions for bookstore data
export interface BookstoreRecord {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  hours?: string;
  specialties?: string;
  description?: string;
  // ... additional fields based on the 48-column structure
}

// Validation pipeline options
export interface ValidationPipelineOptions {
  schema?: any; // Using any to avoid complex type issues
  strictMode?: boolean;
  maxErrors?: number;
  enableWarnings?: boolean;
  performanceTracking?: boolean;
  customValidators?: CustomValidator[];
  encoding?: BufferEncoding;
  delimiter?: string;
  skipEmptyLines?: boolean;
  trimValues?: boolean;
}

export interface CustomValidator {
  name: string;
  description: string;
  validate: (value: any, row: any, rowIndex: number, column: string) => ValidationError | null;
}

export class CSVValidationPipeline extends EventEmitter {
  private ajv: Ajv;
  private options: Required<ValidationPipelineOptions>;
  private customValidators: Map<string, CustomValidator> = new Map();

  constructor(options: ValidationPipelineOptions = {}) {
    super();
    
    this.options = {
      schema: undefined,
      strictMode: false,
      maxErrors: 100,
      enableWarnings: true,
      performanceTracking: true,
      customValidators: [],
      encoding: 'utf8',
      delimiter: ',',
      skipEmptyLines: true,
      trimValues: true,
      ...options
    };

    // Initialize Ajv with formats
    this.ajv = new Ajv({ 
      allErrors: true, 
      verbose: true,
      strict: this.options.strictMode
    });
    addFormats(this.ajv);

    // Register custom validators
    this.options.customValidators.forEach(validator => {
      this.registerCustomValidator(validator);
    });

    this.setupDefaultValidators();
  }

  /**
   * Validate a CSV file with comprehensive checks
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    try {
      this.emit('validationStarted', { filePath, timestamp: new Date() });

      // Read file
      const content = await readFile(filePath, this.options.encoding);
      const fileSize = Buffer.byteLength(content, this.options.encoding);

      // Parse CSV
      const parseStartTime = performance.now();
      const records = await this.parseCSV(content);
      const parseTime = performance.now() - parseStartTime;

      // Validate structure and data
      const validationStartTime = performance.now();
      const result = await this.validateRecords(records, {
        fileSize,
        encoding: this.options.encoding,
        parseTime
      });
      const validationTime = performance.now() - validationStartTime;

      // Add performance metrics
      if (this.options.performanceTracking) {
        const totalTime = performance.now() - startTime;
        const memoryUsage = process.memoryUsage().heapUsed - startMemory;

        result.performance = {
          parseTime,
          validationTime,
          totalTime,
          memoryUsage
        };
      }

      this.emit('validationCompleted', { 
        filePath, 
        result, 
        timestamp: new Date() 
      });

      return result;

    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          type: 'structure',
          severity: 'critical',
          message: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          code: 'FILE_READ_ERROR'
        }]
      };

      this.emit('validationError', { 
        filePath, 
        error: errorResult.errors![0], 
        timestamp: new Date() 
      });

      return errorResult;
    }
  }

  /**
   * Parse CSV content with enhanced error handling
   */
  private async parseCSV(content: string): Promise<any[]> {
    try {
      const records = parse(content, {
        columns: true,
        skip_empty_lines: this.options.skipEmptyLines,
        trim: this.options.trimValues,
        delimiter: this.options.delimiter,
        relax_quotes: true,
        relax_column_count: false,
        cast: false // Keep everything as strings initially
      });

      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown parsing error'}`);
    }
  }

  /**
   * Validate parsed records
   */
  private async validateRecords(
    records: any[], 
    fileMetadata: Partial<ValidationMetadata>
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    if (records.length === 0) {
      errors.push({
        type: 'structure',
        severity: 'critical',
        message: 'No data records found',
        code: 'NO_DATA'
      });
      
      return { isValid: false, errors, rowCount: 0 };
    }

    // Get headers from first record
    const headers = Object.keys(records[0]);
    
    // Validate structure
    this.validateStructure(records, headers, errors, warnings);
    
    // Validate against schema if provided
    if (this.options.schema) {
      this.validateSchema(records, errors);
    }
    
    // Run custom validators
    this.runCustomValidators(records, headers, errors, warnings);
    
    // Generate metadata
    const metadata = this.generateMetadata(records, headers, fileMetadata);
    
    // Check if we've hit max errors
    if (errors.length >= this.options.maxErrors) {
      warnings.push({
        type: 'performance',
        message: `Validation stopped after ${this.options.maxErrors} errors. There may be additional issues.`,
        suggestion: 'Fix current errors and re-validate'
      });
    }

    return {
      isValid: errors.filter(e => e.severity !== 'warning').length === 0,
      headers,
      rowCount: records.length,
      errors: errors.length > 0 ? errors : undefined,
      warnings: this.options.enableWarnings && warnings.length > 0 ? warnings : undefined,
      metadata
    };
  }

  /**
   * Validate CSV structure
   */
  private validateStructure(
    records: any[], 
    headers: string[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check for empty headers
    headers.forEach((header, index) => {
      if (!header || header.trim() === '') {
        errors.push({
          type: 'structure',
          severity: 'error',
          message: `Empty header at column ${index + 1}`,
          column: index,
          code: 'EMPTY_HEADER'
        });
      }
    });

    // Check for duplicate headers
    const headerCounts = new Map<string, number>();
    headers.forEach(header => {
      headerCounts.set(header, (headerCounts.get(header) || 0) + 1);
    });

    headerCounts.forEach((count, header) => {
      if (count > 1) {
        errors.push({
          type: 'structure',
          severity: 'error',
          message: `Duplicate header: "${header}" appears ${count} times`,
          column: header,
          code: 'DUPLICATE_HEADER'
        });
      }
    });

    // Check for data quality issues
    if (this.options.enableWarnings) {
      records.forEach((record, index) => {
        const rowNumber = index + 2; // +2 because index is 0-based and we have headers
        
        // Check for potential encoding issues
        Object.entries(record).forEach(([key, value]) => {
          if (typeof value === 'string' && /[^\x00-\x7F]/.test(value) && !/^[\u00C0-\u017F\u0100-\u017F]/.test(value)) {
            warnings.push({
              type: 'data_quality',
              message: `Potential encoding issue in field "${key}"`,
              row: rowNumber,
              column: key,
              value,
              suggestion: 'Check file encoding'
            });
          }
        });
      });
    }
  }

  /**
   * Validate against JSON schema
   */
  private validateSchema(records: any[], errors: ValidationError[]): void {
    if (!this.options.schema) return;

    const validate = this.ajv.compile(this.options.schema);
    
    records.forEach((record, index) => {
      const rowNumber = index + 2;
      
      if (!validate(record)) {
        validate.errors?.forEach((error: any) => {
          errors.push({
            type: 'schema',
            severity: 'error',
            message: `Schema validation failed: ${error.message}`,
            row: rowNumber,
            column: error.instancePath?.replace('/', '') || error.schemaPath,
            value: error.data,
            expected: error.schema,
            code: 'SCHEMA_VALIDATION_FAILED'
          });
        });
      }
    });
  }

  /**
   * Run custom validators
   */
  private runCustomValidators(
    records: any[], 
    headers: string[], 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    records.forEach((record, rowIndex) => {
      const rowNumber = rowIndex + 2;
      
      headers.forEach(column => {
        this.customValidators.forEach(validator => {
          try {
            const error = validator.validate(record[column], record, rowIndex, column);
            if (error) {
              error.row = rowNumber;
              error.column = column;
              errors.push(error);
            }
          } catch (validatorError) {
            warnings.push({
              type: 'performance',
              message: `Custom validator "${validator.name}" failed: ${validatorError instanceof Error ? validatorError.message : 'Unknown error'}`,
              row: rowNumber,
              column
            });
          }
        });
      });
    });
  }

  /**
   * Generate validation metadata
   */
  private generateMetadata(
    records: any[], 
    headers: string[], 
    fileMetadata: Partial<ValidationMetadata>
  ): ValidationMetadata {
    const dataTypes: Record<string, string> = {};
    
    // Analyze data types
    headers.forEach(header => {
      const values = records.map(r => r[header]).filter(v => v !== null && v !== undefined && v !== '');
      if (values.length > 0) {
        dataTypes[header] = this.inferDataType(values);
      } else {
        dataTypes[header] = 'empty';
      }
    });

    // Count empty and duplicate rows
    const emptyRows = records.filter(record => 
      Object.values(record).every(value => !value || value.toString().trim() === '')
    ).length;

    const duplicateRows = records.length - new Set(records.map(r => JSON.stringify(r))).size;

    return {
      fileSize: fileMetadata.fileSize || 0,
      encoding: fileMetadata.encoding || this.options.encoding,
      delimiter: this.options.delimiter,
      quoteChar: '"',
      hasHeaders: true,
      columnCount: headers.length,
      emptyRows,
      duplicateRows,
      dataTypes,
      ...fileMetadata
    };
  }

  /**
   * Infer data type from values
   */
  private inferDataType(values: any[]): string {
    const sample = values.slice(0, Math.min(100, values.length));
    
    const types: Record<string, number> = {
      number: 0,
      boolean: 0,
      date: 0,
      email: 0,
      url: 0,
      string: 0
    };

    sample.forEach(value => {
      const str = value.toString().trim();
      
      if (/^\d+(\.\d+)?$/.test(str)) {
        types.number++;
      } else if (/^(true|false|yes|no|y|n)$/i.test(str)) {
        types.boolean++;
      } else if (/^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
        types.date++;
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) {
        types.email++;
      } else if (/^https?:\/\//.test(str)) {
        types.url++;
      } else {
        types.string++;
      }
    });

    // Return the most common type
    return Object.entries(types).reduce((a, b) => types[a[0]] > types[b[0]] ? a : b)[0];
  }

  /**
   * Register a custom validator
   */
  registerCustomValidator(validator: CustomValidator): void {
    this.customValidators.set(validator.name, validator);
    this.emit('validatorRegistered', { name: validator.name, timestamp: new Date() });
  }

  /**
   * Unregister a custom validator
   */
  unregisterCustomValidator(name: string): boolean {
    const removed = this.customValidators.delete(name);
    if (removed) {
      this.emit('validatorUnregistered', { name, timestamp: new Date() });
    }
    return removed;
  }

  /**
   * Setup default validators for bookstore data
   */
  private setupDefaultValidators(): void {
    // Email validator
    this.registerCustomValidator({
      name: 'email-format',
      description: 'Validate email format',
      validate: (value, row, rowIndex, column) => {
        if (column === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return {
            type: 'format',
            severity: 'error',
            message: `Invalid email format: "${value}"`,
            value,
            code: 'INVALID_EMAIL_FORMAT'
          };
        }
        return null;
      }
    });

    // Phone number validator
    this.registerCustomValidator({
      name: 'phone-format',
      description: 'Validate phone number format',
      validate: (value, row, rowIndex, column) => {
        if (column === 'phone' && value && !/^[\d\s\-\(\)\+\.]+$/.test(value)) {
          return {
            type: 'format',
            severity: 'warning',
            message: `Unusual phone number format: "${value}"`,
            value,
            code: 'UNUSUAL_PHONE_FORMAT'
          };
        }
        return null;
      }
    });

    // URL validator
    this.registerCustomValidator({
      name: 'url-format',
      description: 'Validate URL format',
      validate: (value, row, rowIndex, column) => {
        if (column === 'website' && value && !/^https?:\/\//.test(value)) {
          return {
            type: 'format',
            severity: 'warning',
            message: `URL should start with http:// or https://: "${value}"`,
            value,
            code: 'INVALID_URL_FORMAT'
          };
        }
        return null;
      }
    });

    // Coordinate validator
    this.registerCustomValidator({
      name: 'coordinate-range',
      description: 'Validate latitude/longitude ranges',
      validate: (value, row, rowIndex, column) => {
        if ((column === 'latitude' || column === 'longitude') && value) {
          const num = parseFloat(value);
          if (isNaN(num)) {
            return {
              type: 'data',
              severity: 'error',
              message: `Invalid coordinate value: "${value}"`,
              value,
              code: 'INVALID_COORDINATE'
            };
          }
          
          if (column === 'latitude' && (num < -90 || num > 90)) {
            return {
              type: 'data',
              severity: 'error',
              message: `Latitude out of range (-90 to 90): ${num}`,
              value,
              code: 'LATITUDE_OUT_OF_RANGE'
            };
          }
          
          if (column === 'longitude' && (num < -180 || num > 180)) {
            return {
              type: 'data',
              severity: 'error',
              message: `Longitude out of range (-180 to 180): ${num}`,
              value,
              code: 'LONGITUDE_OUT_OF_RANGE'
            };
          }
        }
        return null;
      }
    });
  }

  /**
   * Get validation statistics
   */
  getValidatorStats(): { name: string; description: string }[] {
    return Array.from(this.customValidators.values()).map(v => ({
      name: v.name,
      description: v.description
    }));
  }
}

/**
 * Creates a validation schema specifically for bookstore CSV data
 */
export function createBookstoreValidationPipeline(options: ValidationPipelineOptions = {}): CSVValidationPipeline {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string', minLength: 1 },
      site: { type: 'string', format: 'uri' },
      category: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      phone: { type: 'string' },
      full_address: { type: 'string', minLength: 1 },
      street: { type: 'string' },
      city: { type: 'string', minLength: 1 },
      postal_code: { type: 'string' },
      state: { type: 'string' },
      // Accept string representations of numbers for CSV data
      latitude: { 
        type: 'string', 
        pattern: '^-?\\d+(\\.\\d+)?$' // Matches decimal numbers as strings
      },
      longitude: { 
        type: 'string', 
        pattern: '^-?\\d+(\\.\\d+)?$' // Matches decimal numbers as strings
      },
      rating: { 
        type: 'string', 
        pattern: '^[0-5](\\.\\d+)?$' // Matches 0-5 rating as string
      },
      reviews: { 
        type: 'string', 
        pattern: '^\\d+$' // Matches positive integers as strings
      },
      photo: { type: 'string', format: 'uri' },
      street_view: { type: 'string', format: 'uri' },
      working_hours: { type: 'string' },
      business_status: { type: 'string' },
      location_link: { type: 'string', format: 'uri' },
      place_id: { type: 'string' },
      // Individual day hours
      mon_hours: { type: 'string' },
      tues_hours: { type: 'string' },
      wed_hours: { type: 'string' },
      thur_hours: { type: 'string' },
      fri_hours: { type: 'string' },
      sat_hours: { type: 'string' },
      sun_hours: { type: 'string' },
      // Review fields - ratings as strings (allow empty)
      review_1_author: { type: 'string' },
      review_1_rating: { 
        type: 'string', 
        pattern: '^([1-5](\\.\\d+)?)?$' // 1-5 rating as string or empty
      },
      review_1_time: { type: 'string' },
      review_1_text: { type: 'string' },
      review_2_author: { type: 'string' },
      review_2_rating: { 
        type: 'string', 
        pattern: '^([1-5](\\.\\d+)?)?$' // Allow empty
      },
      review_2_time: { type: 'string' },
      review_2_text: { type: 'string' },
      review_3_author: { type: 'string' },
      review_3_rating: { 
        type: 'string', 
        pattern: '^([1-5](\\.\\d+)?)?$' // Allow empty
      },
      review_3_time: { type: 'string' },
      review_3_text: { type: 'string' },
      review_4_author: { type: 'string' },
      review_4_rating: { 
        type: 'string', 
        pattern: '^([1-5](\\.\\d+)?)?$' // Allow empty
      },
      review_4_time: { type: 'string' },
      review_4_text: { type: 'string' },
      review_5_author: { type: 'string' },
      review_5_rating: { 
        type: 'string', 
        pattern: '^([1-5](\\.\\d+)?)?$' // Allow empty
      },
      review_5_time: { type: 'string' },
      review_5_text: { type: 'string' }
    },
    required: ['name', 'category', 'city', 'full_address'],
    additionalProperties: false
  };

  return new CSVValidationPipeline({
    schema: schema,
    strictMode: false,
    maxErrors: 50,
    enableWarnings: true,
    performanceTracking: true,
    ...options
  });
}

/**
 * Utility function for quick validation
 */
export async function validateCSVFile(
  filePath: string, 
  options?: ValidationPipelineOptions
): Promise<ValidationResult> {
  const pipeline = new CSVValidationPipeline(options);
  return pipeline.validateFile(filePath);
} 