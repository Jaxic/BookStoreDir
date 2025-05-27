# Installation Guide

## Prerequisites

Before installing the CSV Update Management System, ensure you have the following prerequisites:

### System Requirements
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher (comes with Node.js)
- **TypeScript**: Version 5.x (installed automatically)
- **Operating System**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Memory**: Minimum 4GB RAM (8GB recommended for large CSV files)
- **Storage**: At least 10GB free space for backups and reports

### Development Tools (Optional)
- **Git**: For version control
- **VS Code**: Recommended IDE with TypeScript support
- **Docker**: For containerized deployments

## Installation Methods

### Method 1: NPM Installation (Recommended)

```bash
# Install globally
npm install -g csv-update-management

# Or install locally in your project
npm install csv-update-management
```

### Method 2: Clone from Repository

```bash
# Clone the repository
git clone https://github.com/your-org/csv-update-management.git
cd csv-update-management

# Install dependencies
npm install

# Build the project
npm run build
```

### Method 3: Docker Installation

```bash
# Pull the Docker image
docker pull csv-update-management:latest

# Run the container
docker run -d \
  --name csv-manager \
  -v /path/to/your/csv/files:/app/data \
  -v /path/to/backups:/app/backups \
  -p 3000:3000 \
  csv-update-management:latest
```

## Configuration

### 1. Environment Setup

Create a `.env` file in your project root:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the configuration
nano .env
```

Required environment variables:
```env
# Storage Configuration
CSV_DATA_PATH=/path/to/csv/files
BACKUP_PATH=/path/to/backups
REPORTS_PATH=/path/to/reports

# Validation Settings
VALIDATION_LEVEL=comprehensive
MAX_FILE_SIZE=100MB
ENABLE_STRICT_MODE=false

# Backup Settings
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION=true
MAX_BACKUP_VERSIONS=10

# Monitoring
ENABLE_MONITORING=true
MONITORING_INTERVAL=300000
LOG_LEVEL=info

# CI/CD Integration
GITHUB_TOKEN=your_github_token
SLACK_WEBHOOK=your_slack_webhook
EMAIL_NOTIFICATIONS=admin@yourcompany.com
```

### 2. Initialize the System

```bash
# Initialize the CSV management system
npx csv-manager init

# Or if installed globally
csv-manager init
```

This will:
- Create necessary directories
- Set up default configuration
- Initialize the database
- Create sample templates

### 3. Verify Installation

```bash
# Check system status
csv-manager status

# Run system diagnostics
csv-manager diagnose

# Test with sample data
csv-manager test
```

## Post-Installation Setup

### 1. Configure Storage Providers

If using cloud storage, configure your providers:

```bash
# AWS S3 Configuration
csv-manager config set storage.aws.accessKeyId YOUR_ACCESS_KEY
csv-manager config set storage.aws.secretAccessKey YOUR_SECRET_KEY
csv-manager config set storage.aws.region us-east-1

# Azure Blob Storage
csv-manager config set storage.azure.connectionString YOUR_CONNECTION_STRING

# OneDrive
csv-manager config set storage.onedrive.clientId YOUR_CLIENT_ID
csv-manager config set storage.onedrive.clientSecret YOUR_CLIENT_SECRET
```

### 2. Set Up Validation Rules

```bash
# Create custom validation schema
csv-manager schema create --name books --file schemas/books.json

# Apply validation rules
csv-manager validation setup --schema books --path data/books.csv
```

### 3. Configure Backup Policies

```bash
# Set up automated backups
csv-manager backup configure \
  --retention 30d \
  --compression true \
  --schedule "0 2 * * *"

# Test backup functionality
csv-manager backup test
```

### 4. Enable Monitoring

```bash
# Start the monitoring service
csv-manager monitor start

# Configure alerts
csv-manager alerts configure \
  --email admin@company.com \
  --slack-webhook YOUR_WEBHOOK \
  --threshold error
```

## Integration with Existing Projects

### Astro Integration

For Astro projects, add the CSV manager to your build process:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import csvManager from 'csv-update-management/astro';

export default defineConfig({
  integrations: [
    csvManager({
      dataPath: './src/data',
      validationLevel: 'comprehensive',
      enableBackups: true
    })
  ]
});
```

### GitHub Actions Integration

Add to your `.github/workflows/csv-monitoring.yml`:

```yaml
name: CSV Monitoring
on:
  push:
    paths: ['data/**/*.csv']

jobs:
  csv-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install csv-update-management
      - run: npx csv-manager validate --all
      - run: npx csv-manager backup --create
      - run: npx csv-manager diff --generate-reports
```

## Troubleshooting Installation

### Common Issues

**Issue**: `npm install` fails with permission errors
```bash
# Solution: Use npm with proper permissions
sudo npm install -g csv-update-management
# Or use nvm to manage Node.js versions
```

**Issue**: TypeScript compilation errors
```bash
# Solution: Ensure TypeScript is properly installed
npm install -g typescript
npx tsc --version
```

**Issue**: Cannot find module errors
```bash
# Solution: Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Permission denied when accessing CSV files
```bash
# Solution: Check file permissions
chmod 755 /path/to/csv/files
chown -R $USER:$USER /path/to/csv/files
```

### Getting Help

If you encounter issues during installation:

1. Check the [Troubleshooting Guide](./operations/troubleshooting.md)
2. Review the [FAQ](./faq.md)
3. Search existing [GitHub Issues](https://github.com/your-org/csv-update-management/issues)
4. Create a new issue with:
   - Your operating system and version
   - Node.js and npm versions
   - Complete error messages
   - Steps to reproduce the issue

## Next Steps

After successful installation:

1. Read the [Getting Started Guide](./getting-started.md)
2. Configure your first CSV monitoring workflow
3. Set up automated backups
4. Integrate with your CI/CD pipeline
5. Explore the [User Guides](./user-guides/) for your role

---

*For advanced installation scenarios, see the [Administrator Guide](./user-guides/administrator-guide.md)* 