# Quick Start: HalalExtra E2E Testing

## 🚀 One-Command Test Execution

```bash
./run-comprehensive-tests.sh
```

## 📋 What Gets Tested

### ✅ Complete Workflow Coverage
1. **Store Owner Application** - Full form submission with file uploads
2. **Inspector Login** - Authentication and dashboard access
3. **Inspection Process** - Complete checklist and approval workflow
4. **QR Code Generation** - Certificate creation and QR code extraction
5. **QR Verification** - Public certificate verification system
6. **Error Handling** - Edge cases and security validation

### 📁 Test Files Created
- `tests/comprehensive-workflow.spec.ts` - Main test suite (28KB)
- `test-fixtures/` - Dummy files for upload testing
- `run-comprehensive-tests.sh` - Docker execution script
- `TEST-DOCUMENTATION.md` - Complete documentation

## 🎯 Key Features

### Realistic Test Data
```typescript
businessName: 'Al-Barakah Halal Restaurant'
ownerEmail: 'ahmed@albarakah.com.au'
address: '123 Halal Street, Sydney NSW 2000'
```

### Inspector Credentials
- Username: `adeelh`
- Password: `1P9Zqz7DIoKIqJx`

### File Upload Testing
- Business license (PDF)
- Floor plan (PNG)
- Supplier certificates (PDF)
- Inspection photos (JPG)

### QR Code Extraction
- Captures generated QR codes
- Saves to `test-results/extracted-qr-code.png`
- Extracts certificate numbers for verification

## 🔧 Technical Specifications

### Environment
- **Target**: https://halalextra-production.up.railway.app
- **Playwright**: v1.55.0 in Docker container
- **Timeout**: 30 seconds per test step
- **Execution**: Sequential (workers=1) for state management

### Error Handling
- Graceful fallbacks for missing elements
- Multiple selector strategies for robustness
- Comprehensive logging for debugging
- Screenshot/video capture on failures

## 📊 Expected Results

### Success Indicators
✅ Application submitted successfully
✅ Inspector can login and access dashboard
✅ Inspection completed and approved
✅ Certificate generated with QR code
✅ QR verification system functional
✅ Error handling works correctly

### Output Files
- `playwright-report/index.html` - Detailed HTML report
- `test-results/` - Screenshots and videos on failure
- `test-results/extracted-qr-code.png` - Captured QR code

## 🚨 Troubleshooting

### If Tests Fail
1. Check application is running: https://halalextra-production.up.railway.app
2. Verify inspector credentials are correct
3. Review screenshots in `test-results/`
4. Check HTML report: `npx playwright show-report`

### Manual Test Execution
```bash
# Full test suite
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --project=chromium --workers=1 --timeout=30000

# Single test
docker run --rm -v "$(pwd)":/workspace -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --grep "Store Owner" --project=chromium --workers=1 --timeout=30000
```

## 🏁 Ready to Run

Everything is set up and ready to execute. The comprehensive test suite will validate the entire HalalExtra workflow from store owner application to QR code verification.

**Just run**: `./run-comprehensive-tests.sh`