# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered with the CSV Update Management System. Issues are organized by category with step-by-step resolution procedures.

## 🔍 Diagnostic Tools

### Quick Health Check
```bash
# Run comprehensive system health check
csv-manager health-check --verbose

# Check specific components
csv-manager status --component validation
csv-manager status --component backup
csv-manager status --component monitoring
```

### Log Analysis
```bash
# View recent logs
csv-manager logs --recent --level error

# Follow live logs
csv-manager logs --follow

# Export logs for analysis
csv-manager logs --export --format json --output troubleshooting-logs.json
```

### System Diagnostics
```bash
# Run full system diagnostics
csv-manager diagnose --full --output diagnostics-report.html

# Check configuration
csv-manager config validate

# Test connectivity
csv-manager test-connectivity --all-services
```

## 🚨 Common Issues and Solutions

### Installation and Setup Issues

#### Issue: `npm install` fails with permission errors

**Symptoms:**
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules/csv-update-management'
```

**Solution:**
```bash
# Option 1: Use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
npm install -g csv-update-management

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g csv-update-management

# Option 3: Use sudo (not recommended for production)
sudo npm install -g csv-update-management
```

#### Issue: TypeScript compilation errors

**Symptoms:**
```
error TS2307: Cannot find module 'csv-update-management' or its corresponding type declarations
```

**Solution:**
```bash
# Ensure TypeScript is installed
npm install -g typescript@latest

# Check TypeScript version
tsc --version

# Clear TypeScript cache
rm -rf node_modules/.cache
npm run build

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Issue: Module not found errors

**Symptoms:**
```
Error: Cannot find module '../utils/csvValidationPipeline'
```

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild the project
npm run build

# Check file paths
find . -name "csvValidationPipeline*" -type f
```

### Configuration Issues

#### Issue: Invalid configuration file

**Symptoms:**
```
Error: Configuration validation failed: Invalid JSON in config file
```

**Solution:**
```bash
# Validate configuration syntax
csv-manager config validate --file .csv-manager.json

# Reset to default configuration
csv-manager config reset --backup-current

# Restore from backup
csv-manager config restore --from-backup

# Manual configuration check
cat .csv-manager.json | jq '.'
```

#### Issue: Environment variables not loaded

**Symptoms:**
```
Warning: Required environment variable CSV_DATA_PATH not set
```

**Solution:**
```bash
# Check environment variables
csv-manager config show --env

# Load from .env file
source .env
csv-manager config reload

# Set variables manually
export CSV_DATA_PATH="/path/to/csv/files"
export BACKUP_PATH="/path/to/backups"

# Verify configuration
csv-manager config validate --env
```

### CSV Processing Issues

#### Issue: CSV validation failures

**Symptoms:**
```
Validation Error: Invalid CSV format in data/books.csv at line 42
```

**Solution:**
```bash
# Check specific file
csv-manager validate --file data/books.csv --verbose

# Identify problematic lines
csv-manager validate --file data/books.csv --show-errors --max-errors 10

# Check file encoding
file data/books.csv
iconv -f UTF-8 -t UTF-8 data/books.csv > /dev/null

# Fix common issues
# Remove BOM if present
sed -i '1s/^\xEF\xBB\xBF//' data/books.csv

# Fix line endings
dos2unix data/books.csv

# Validate schema
csv-manager schema validate --file schemas/books.json
```

#### Issue: Large file processing timeouts

**Symptoms:**
```
Error: Processing timeout for file data/large-dataset.csv (>100MB)
```

**Solution:**
```bash
# Increase timeout settings
csv-manager config set processing.timeout 600000  # 10 minutes

# Enable streaming mode
csv-manager config set processing.streaming true

# Increase memory limit
csv-manager config set memory.limit 8GB

# Process in chunks
csv-manager process --file data/large-dataset.csv --chunk-size 10000

# Monitor memory usage
csv-manager monitor --memory --duration 5m
```

#### Issue: Character encoding problems

**Symptoms:**
```
Error: Invalid character encoding detected in CSV file
```

**Solution:**
```bash
# Detect file encoding
file -i data/books.csv
chardet data/books.csv

# Convert encoding
iconv -f ISO-8859-1 -t UTF-8 data/books.csv > data/books-utf8.csv

# Set encoding in configuration
csv-manager config set processing.encoding UTF-8

# Validate after conversion
csv-manager validate --file data/books-utf8.csv
```

### Backup System Issues

#### Issue: Backup creation failures

**Symptoms:**
```
Error: Failed to create backup - insufficient disk space
```

**Solution:**
```bash
# Check disk space
df -h
csv-manager storage check --path /backups

# Clean old backups
csv-manager backup cleanup --older-than 30d

# Compress existing backups
csv-manager backup compress --all

# Change backup location
csv-manager config set backup.path /new/backup/location

# Test backup functionality
csv-manager backup test --dry-run
```

#### Issue: Backup verification failures

**Symptoms:**
```
Warning: Backup integrity check failed for backup-20241127-143022.tar.gz
```

**Solution:**
```bash
# Check backup integrity
csv-manager backup verify --backup-id backup-20241127-143022

# List backup contents
csv-manager backup list-contents --backup-id backup-20241127-143022

# Attempt repair
csv-manager backup repair --backup-id backup-20241127-143022

# Create new backup if repair fails
csv-manager backup create --force --replace-corrupted

# Update checksums
csv-manager backup update-checksums --all
```

#### Issue: Backup restoration problems

**Symptoms:**
```
Error: Cannot restore backup - target files are locked
```

**Solution:**
```bash
# Check file locks
lsof +D /path/to/csv/files

# Stop processes using files
csv-manager stop --all

# Force unlock files (use with caution)
csv-manager unlock --force --path /path/to/csv/files

# Restore with different strategy
csv-manager restore --backup-id BACKUP_ID --strategy copy-first

# Verify restoration
csv-manager validate --restored-files
```

### Validation Pipeline Issues

#### Issue: Schema validation errors

**Symptoms:**
```
Schema Error: Required field 'isbn' missing from CSV header
```

**Solution:**
```bash
# Check schema file
csv-manager schema validate --file schemas/books.json

# Compare with CSV headers
csv-manager headers --file data/books.csv
csv-manager schema compare --file data/books.csv --schema books

# Update schema
csv-manager schema update --file schemas/books.json --add-field isbn

# Generate schema from CSV
csv-manager schema generate --from-csv data/books.csv --output schemas/books-auto.json

# Apply updated schema
csv-manager validation apply-schema --file data/books.csv --schema books-auto
```

#### Issue: Validation service not responding

**Symptoms:**
```
Error: Validation service timeout - no response after 30 seconds
```

**Solution:**
```bash
# Check service status
csv-manager validation status

# Restart validation service
csv-manager validation restart

# Check service logs
csv-manager validation logs --recent

# Clear validation cache
csv-manager validation clear-cache

# Reset validation configuration
csv-manager validation reset-config

# Test with simple file
csv-manager validate --file test/simple.csv --timeout 60
```

### CI/CD Integration Issues

#### Issue: GitHub Actions workflow failures

**Symptoms:**
```
Error: CSV validation step failed in GitHub Actions
```

**Solution:**
```bash
# Check workflow configuration
cat .github/workflows/csv-monitoring.yml

# Test locally
npm run ci:integration

# Check environment variables in GitHub
# Go to Settings > Secrets and variables > Actions

# Debug workflow
csv-manager ci-cd debug --provider github --workflow csv-monitoring

# Test with minimal configuration
csv-manager ci-cd test --minimal

# Check GitHub Actions logs
gh run list --workflow=csv-monitoring
gh run view --log
```

#### Issue: Deployment pipeline failures

**Symptoms:**
```
Error: Deployment failed - CSV validation errors in production
```

**Solution:**
```bash
# Run pre-deployment checks
csv-manager deploy check --environment production

# Validate all files before deployment
npm run validate:csv:comprehensive

# Check deployment configuration
csv-manager deploy config validate

# Deploy to staging first
csv-manager deploy --environment staging --dry-run

# Rollback if necessary
csv-manager deploy rollback --to-previous

# Check deployment logs
csv-manager deploy logs --environment production --recent
```

### Performance Issues

#### Issue: Slow CSV processing

**Symptoms:**
```
Warning: CSV processing taking longer than expected (>5 minutes for 1MB file)
```

**Solution:**
```bash
# Profile performance
csv-manager profile --file data/books.csv

# Check system resources
csv-manager monitor --resources --duration 2m

# Enable performance optimizations
csv-manager config set performance.optimized true
csv-manager config set processing.parallel true
csv-manager config set processing.workers 4

# Clear processing cache
csv-manager cache clear --type processing

# Restart with performance mode
csv-manager restart --performance-mode

# Monitor improvement
csv-manager benchmark --file data/books.csv --iterations 3
```

#### Issue: High memory usage

**Symptoms:**
```
Warning: Memory usage above 90% during CSV processing
```

**Solution:**
```bash
# Check memory usage
csv-manager monitor --memory --top-processes

# Enable streaming mode
csv-manager config set processing.streaming true
csv-manager config set memory.streaming-threshold 50MB

# Reduce batch size
csv-manager config set processing.batch-size 1000

# Enable garbage collection
csv-manager config set memory.gc-aggressive true

# Process files individually
csv-manager process --file data/books.csv --memory-limit 2GB

# Monitor memory improvement
csv-manager monitor --memory --duration 5m
```

### Network and Connectivity Issues

#### Issue: Cloud storage connection failures

**Symptoms:**
```
Error: Cannot connect to AWS S3 - connection timeout
```

**Solution:**
```bash
# Test connectivity
csv-manager test-connectivity --provider aws-s3

# Check credentials
csv-manager config validate --provider aws-s3

# Test with different region
csv-manager config set storage.aws.region us-west-2

# Check firewall/proxy settings
curl -I https://s3.amazonaws.com

# Use alternative endpoint
csv-manager config set storage.aws.endpoint https://s3.us-west-2.amazonaws.com

# Test with minimal permissions
csv-manager test-permissions --provider aws-s3 --minimal
```

#### Issue: API rate limiting

**Symptoms:**
```
Error: API rate limit exceeded - too many requests
```

**Solution:**
```bash
# Check rate limits
csv-manager api status --provider github

# Enable rate limiting
csv-manager config set api.rate-limit true
csv-manager config set api.requests-per-minute 30

# Add delays between requests
csv-manager config set api.delay-between-requests 2000

# Use batch operations
csv-manager api batch --operations validate,backup,report

# Check API quotas
csv-manager api quota --all-providers
```

## 🛠️ Advanced Troubleshooting

### Debug Mode

Enable debug mode for detailed logging:

```bash
# Enable debug logging
csv-manager config set logging.level debug

# Run with debug output
DEBUG=csv-manager:* csv-manager validate --all

# Save debug logs
csv-manager --debug validate --all 2>&1 | tee debug.log
```

### Performance Profiling

```bash
# Profile memory usage
csv-manager profile --memory --file data/large.csv

# Profile CPU usage
csv-manager profile --cpu --duration 60s

# Generate performance report
csv-manager profile --report --output performance-report.html
```

### System Information

```bash
# Collect system information
csv-manager system-info --output system-info.json

# Check dependencies
csv-manager dependencies --check-versions

# Verify installation
csv-manager verify-installation --comprehensive
```

## 📞 Getting Help

### Before Contacting Support

1. **Collect Information:**
   ```bash
   csv-manager diagnose --full --output support-package.zip
   ```

2. **Check Known Issues:**
   - Review [Known Issues](../known-issues.md)
   - Search [GitHub Issues](https://github.com/your-org/csv-update-management/issues)

3. **Try Safe Mode:**
   ```bash
   csv-manager --safe-mode validate --file problematic-file.csv
   ```

### Support Package

Create a support package with all relevant information:

```bash
# Generate comprehensive support package
csv-manager support-package create \
  --include-logs \
  --include-config \
  --include-samples \
  --output support-$(date +%Y%m%d).zip
```

### Contact Information

- **GitHub Issues**: [Create New Issue](https://github.com/your-org/csv-update-management/issues/new)
- **Email Support**: support@yourcompany.com
- **Documentation**: [docs.yourcompany.com](https://docs.yourcompany.com)
- **Community Forum**: [forum.yourcompany.com](https://forum.yourcompany.com)

---

**Last Updated**: $(date)  
**Version**: 1.0.0 