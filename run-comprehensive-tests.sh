#!/bin/bash

# HalalExtra Comprehensive E2E Test Runner
# This script runs the complete workflow test using Playwright in Docker

echo "🧪 Starting HalalExtra Comprehensive E2E Test Suite"
echo "📍 Target URL: https://halalextra-production.up.railway.app"
echo "⚡ Using Playwright v1.55.0 in Docker"
echo ""

# Create test-results directory if it doesn't exist
mkdir -p test-results

# Run the comprehensive workflow test
echo "🚀 Running comprehensive workflow test..."
docker run --rm \
  -v "$(pwd)":/workspace \
  -w /workspace \
  mcr.microsoft.com/playwright:v1.55.0-jammy \
  npx playwright test tests/comprehensive-workflow.spec.ts \
  --project=chromium \
  --workers=1 \
  --timeout=30000 \
  --reporter=html

# Check if test completed successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Comprehensive workflow test completed successfully!"
    echo ""
    echo "📊 Test Results:"
    echo "   • HTML Report: playwright-report/index.html"
    echo "   • Screenshots: test-results/"
    echo "   • QR Code: test-results/extracted-qr-code.png (if generated)"
    echo ""
    echo "📋 To view the HTML report:"
    echo "   npx playwright show-report"
else
    echo ""
    echo "❌ Test execution failed. Check the output above for details."
    echo ""
    echo "🔍 Common troubleshooting:"
    echo "   • Verify the application is running at https://halalextra-production.up.railway.app"
    echo "   • Check inspector credentials: adeelh / 1P9Zqz7DIoKIqJx"
    echo "   • Ensure test files exist in test-fixtures/"
    echo "   • Review screenshots in test-results/ for failure details"
fi

echo ""
echo "🏁 Test execution finished."