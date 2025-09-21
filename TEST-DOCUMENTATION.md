# HalalExtra Comprehensive E2E Test Suite

## Overview

This comprehensive end-to-end test suite validates the complete HalalExtra halal certification workflow from store owner application to QR code verification. The tests are designed to run against the live production environment at `https://halalextra-production.up.railway.app`.

## Test Architecture

### Technology Stack
- **Testing Framework**: Playwright v1.55.0
- **Environment**: Docker container (`mcr.microsoft.com/playwright:v1.55.0-jammy`)
- **Target Application**: https://halalextra-production.up.railway.app
- **Browser**: Chromium (configurable for Firefox/Safari)
- **Execution Mode**: Sequential (workers=1) for proper workflow state management

### Test Configuration
```yaml
timeout: 30000ms (30 seconds per test step)
workers: 1 (sequential execution)
reporter: HTML with screenshots and videos
retry: 0 (disabled for E2E consistency)
baseURL: https://halalextra-production.up.railway.app
```

## Test Suite Structure

### 1. Store Owner Application Flow (`test('1. Store Owner: Complete halal certification application...')`)

**Purpose**: Validates the complete store owner application process with file uploads

**Test Steps**:
1. **Business Information Form**
   - Business name, ABN, establishment year
   - Address details (street, city, state, postcode)
   - Business type selection
   - Form validation and navigation

2. **Operations Information**
   - Employee count and operating hours
   - Product catalog management
   - Supplier information with certification status
   - Multi-item addition workflow

3. **Document Upload**
   - Business license (PDF)
   - Floor plan (PNG)
   - Supplier certificates (PDF)
   - File validation and upload progress

4. **Contact Information & Legal**
   - Owner contact details
   - Email and phone validation
   - Terms and conditions acceptance

5. **Application Summary & Payment**
   - Data review and confirmation
   - Payment processing (demo mode)
   - Application submission

**Test Data**:
```typescript
const testData = {
  store: {
    businessName: 'Al-Barakah Halal Restaurant',
    abn: '12345678901',
    address: '123 Halal Street',
    city: 'Sydney',
    ownerEmail: 'ahmed@albarakah.com.au',
    // ... complete test dataset
  }
}
```

**Expected Outcomes**:
- Successful form progression through all steps
- File uploads processed correctly
- Application submitted with confirmation
- Data persistence across form steps

### 2. Inspector Authentication (`test('2. Inspector Login and View Dashboard')`)

**Purpose**: Validates inspector login and dashboard access

**Test Steps**:
1. Navigate to login page
2. Authenticate with inspector credentials
3. Verify dashboard access and functionality
4. Check pending applications queue

**Credentials**:
- Username: `adeelh`
- Password: `1P9Zqz7DIoKIqJx`

**Expected Outcomes**:
- Successful authentication
- Dashboard loads with pending inspections
- Application queue visible
- Proper session management

### 3. Inspection Process (`test('3. Inspector: Start and Complete Inspection Process')`)

**Purpose**: Validates the complete inspection workflow from start to certificate generation

**Test Steps**:
1. **Application Selection**
   - View pending applications
   - Select specific application for inspection
   - Access application details

2. **Inspection Checklist**
   - Kitchen/Food preparation standards
   - Documentation verification
   - Supplier certificate validation
   - Staff training verification

3. **Evidence Collection**
   - Upload inspection photos
   - Add detailed inspection notes
   - Rate overall compliance

4. **Approval & Certificate Generation**
   - Submit inspection results
   - Approve application
   - Generate halal certificate
   - Create QR code

**Inspection Criteria**:
```typescript
const checklistItems = [
  'cleanlinessStandards',
  'halalLabeledIngredients',
  'separateStorageArea',
  'properEquipmentCleaning',
  'supplierCertificates',
  'staffTrainingRecords',
  'halalPolicyDisplayed'
];
```

**Expected Outcomes**:
- Complete inspection workflow
- All checklist items validated
- Certificate generated with unique number
- QR code created and accessible

### 4. QR Code Extraction (`test('4. Extract and Save QR Code from Generated Certificate')`)

**Purpose**: Captures and saves the generated QR code for verification testing

**Test Steps**:
1. Locate generated certificate
2. Extract QR code image (canvas/img/svg)
3. Save QR code to test results
4. Extract certificate number for verification

**QR Code Handling**:
- **Image Elements**: Direct src attribute extraction
- **Canvas Elements**: toDataURL() conversion
- **SVG Elements**: Full SVG extraction
- **Data URLs**: Base64 decoding and file saving

**Output Files**:
- `test-results/extracted-qr-code.png`: Saved QR code image
- Certificate number extracted for verification step

### 5. QR Verification Flow (`test('5. QR Code Verification Flow')`)

**Purpose**: Validates the public QR code verification system

**Test Steps**:
1. Navigate to verification page (`/verify`)
2. Test certificate number input
3. Verify certificate validity
4. Check QR scanner interface
5. Validate certification status display

**Verification Methods**:
- Manual certificate number entry
- QR code scanning simulation
- Invalid certificate error handling
- Certificate status and expiry display

**Expected Outcomes**:
- Valid certificates show as approved
- Certificate details displayed correctly
- QR scanner interface functional
- Proper error handling for invalid codes

### 6. Edge Cases & Error Handling (`test('6. Edge Cases and Error Handling')`)

**Purpose**: Validates system robustness and security measures

**Test Scenarios**:

1. **Invalid Certificate Verification**
   - Submit fake certificate number
   - Verify error message display
   - Ensure graceful error handling

2. **Authentication Protection**
   - Access inspector pages without login
   - Verify redirect to login page
   - Test session security

3. **Form Validation**
   - Submit empty required fields
   - Test email format validation
   - Verify client-side validation

**Security Tests**:
- Unauthorized access prevention
- Session management validation
- Input sanitization verification

## Test Files and Fixtures

### Dummy Files for Upload Testing

**Location**: `test-fixtures/`

1. **business-license.pdf**
   - Minimal valid PDF structure
   - Contains "Test Business License" text
   - Size: ~300 bytes

2. **floor-plan.png**
   - 1x1 pixel transparent PNG
   - Base64 encoded minimal image
   - Size: ~100 bytes

3. **supplier-certificate.pdf**
   - Valid PDF with halal certificate content
   - Contains "Test Supplier Halal Certificate"
   - Size: ~300 bytes

4. **inspection-photo.jpg**
   - Minimal JPEG image structure
   - Base64 encoded 1x1 pixel image
   - Size: ~200 bytes

### Test Output Files

**Location**: `test-results/`

- **extracted-qr-code.png**: QR code captured from generated certificate
- **Screenshots**: Failure screenshots with timestamps
- **Videos**: Test execution recordings on failure
- **HTML Report**: Comprehensive test results with timeline

## Running the Tests

### Quick Start

```bash
# Make script executable
chmod +x run-comprehensive-tests.sh

# Run comprehensive test suite
./run-comprehensive-tests.sh
```

### Manual Docker Execution

```bash
# Run all tests
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --project=chromium --workers=1 --timeout=30000

# Run specific test
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --grep "Store Owner" --project=chromium --workers=1 --timeout=30000
```

### Alternative Browser Testing

```bash
# Firefox
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --project=firefox --workers=1 --timeout=30000

# Safari (WebKit)
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --project=webkit --workers=1 --timeout=30000
```

## Test Reporting

### HTML Report
```bash
# View comprehensive HTML report
npx playwright show-report
```

### Report Contents
- **Test Timeline**: Step-by-step execution timeline
- **Screenshots**: Captured on test failures
- **Videos**: Full test execution recordings
- **Console Logs**: Application console output
- **Network Activity**: HTTP requests and responses

## Troubleshooting

### Common Issues

1. **Application Not Responding**
   - Verify Railway deployment status
   - Check application health endpoint
   - Wait for application startup (cold start delay)

2. **Authentication Failures**
   - Verify inspector credentials: `adeelh` / `1P9Zqz7DIoKIqJx`
   - Check session handling and cookies
   - Ensure HTTPS connection

3. **File Upload Issues**
   - Verify test fixture files exist
   - Check file size limits (10MB max)
   - Ensure proper MIME types

4. **QR Code Extraction Failures**
   - Certificate may not be generated
   - QR code element selectors may have changed
   - Check for canvas/SVG rendering issues

5. **Timeout Errors**
   - Increase timeout for slow operations
   - Check network connectivity
   - Verify application performance

### Debug Commands

```bash
# Run with debug output
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --project=chromium --workers=1 --timeout=30000 --debug

# Run specific test with trace
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --grep "Inspector Login" --trace=on

# View trace files
npx playwright show-trace test-results/[test-name]/trace.zip
```

## Continuous Integration

### CI/CD Integration

The test suite can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    docker run --rm -v ${{ github.workspace }}:/workspace -w /workspace \
      mcr.microsoft.com/playwright:v1.55.0-jammy \
      npx playwright test tests/comprehensive-workflow.spec.ts \
      --project=chromium --workers=1 --timeout=30000 --reporter=github
```

### Deployment Validation

Use these tests as post-deployment validation:

1. **Smoke Tests**: Run after each deployment
2. **Regression Tests**: Run before production releases
3. **Performance Tests**: Monitor test execution times
4. **Integration Tests**: Validate all service integrations

## Test Maintenance

### Updating Test Data
- Modify `testData` object for different test scenarios
- Update credentials when changed
- Adjust selectors if UI elements change

### Adding New Test Cases
- Follow existing test structure
- Use helper functions for common operations
- Maintain sequential test execution for state management

### Performance Optimization
- Use `page.waitForLoadState()` instead of arbitrary timeouts
- Implement proper element waiting strategies
- Minimize test data size while maintaining realism

## Security Considerations

### Test Security
- Never commit real production credentials
- Use test-specific data and accounts
- Ensure test isolation from production data

### Data Protection
- Test data should not contain PII
- Use synthetic but realistic data
- Clean up test artifacts after execution

## Expected Test Results

### Success Criteria
1. **Application Submission**: Store owner can complete full application
2. **Inspector Access**: Inspector can login and access dashboard
3. **Inspection Completion**: Full inspection workflow completes successfully
4. **Certificate Generation**: QR code and certificate generated correctly
5. **Verification System**: QR verification system functions properly
6. **Error Handling**: System handles errors gracefully

### Performance Benchmarks
- **Application Form**: < 30 seconds total completion time
- **Inspector Login**: < 5 seconds authentication
- **Certificate Generation**: < 10 seconds processing time
- **QR Verification**: < 3 seconds response time

### Quality Metrics
- **Test Coverage**: 100% of critical user workflows
- **Success Rate**: > 95% test pass rate
- **Reliability**: Consistent results across multiple runs
- **Maintainability**: Easy to update and extend

---

**Last Updated**: September 2025
**Playwright Version**: v1.55.0
**Target Application**: https://halalextra-production.up.railway.app
**Test Environment**: Docker containerized execution