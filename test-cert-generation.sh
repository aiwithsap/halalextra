#!/bin/bash

# Test Certificate Generation Fix
# This script creates a new application and approves it to test certificate creation

set -e

echo "=== HalalExtra Certificate Generation Test ==="
echo ""

# Step 1: Login as admin and get session cookie
echo "[1/5] Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -c /tmp/test-cookies.txt -X POST \
  https://halalextra-production.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"adeelh","password":"1P9Zqz7DIoKIqJx"}')

echo "Login response: $LOGIN_RESPONSE"

# Step 2: Create a store for the test application
echo "[2/5] Creating test store..."
STORE_RESPONSE=$(curl -s -b /tmp/test-cookies.txt -X POST \
  https://halalextra-production.up.railway.app/api/stores \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Certificate Test Restaurant",
    "businessType": "restaurant",
    "abn": "12345678999",
    "address": "123 Test Street",
    "city": "Sydney",
    "state": "NSW",
    "postalCode": "2000",
    "ownerName": "Test Owner",
    "ownerEmail": "certtest@test.com",
    "ownerPhone": "+61 400 000 000"
  }')

echo "Store response: $STORE_RESPONSE"
STORE_ID=$(echo $STORE_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*')
echo "Store ID: $STORE_ID"

# Step 3: Create application for the store
echo "[3/5] Creating application for store ID $STORE_ID..."
APP_RESPONSE=$(curl -s -b /tmp/test-cookies.txt -X POST \
  https://halalextra-production.up.railway.app/api/applications \
  -H "Content-Type: application/json" \
  -d "{
    \"storeId\": $STORE_ID,
    \"status\": \"pending\",
    \"submittedDate\": \"$(date -u +%Y-%m-%dT%H:%M:%S.000Z)\"
  }")

echo "Application response: $APP_RESPONSE"
APP_ID=$(echo $APP_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
echo "Application ID: $APP_ID"

# Step 4: Approve the application (this should trigger certificate creation)
echo "[4/5] Approving application ID $APP_ID (this will test certificate generation)..."
APPROVE_RESPONSE=$(curl -s -b /tmp/test-cookies.txt -X PATCH \
  "https://halalextra-production.up.railway.app/api/admin/applications/$APP_ID/status" \
  -H "Content-Type: application/json" \
  -d '{"status":"approved","notes":"Test certificate generation with new logging"}')

echo "Approval response:"
echo "$APPROVE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$APPROVE_RESPONSE"

# Check if certificate field is present
if echo "$APPROVE_RESPONSE" | grep -q '"certificate"'; then
  echo "✅ SUCCESS: Certificate field found in response!"
  CERT_NUMBER=$(echo "$APPROVE_RESPONSE" | grep -o '"certificateNumber":"[^"]*"' | cut -d'"' -f4)
  echo "Certificate Number: $CERT_NUMBER"
else
  echo "❌ WARNING: No certificate field in response"
fi

# Check for error or warning
if echo "$APPROVE_RESPONSE" | grep -q '"warning"'; then
  echo "⚠️ WARNING in response:"
  echo "$APPROVE_RESPONSE" | grep -o '"warning":"[^"]*"'
  echo "$APPROVE_RESPONSE" | grep -o '"certificateError":"[^"]*"'
fi

# Step 5: Verify certificate was created
echo "[5/5] Verifying certificate..."
if [ ! -z "$CERT_NUMBER" ]; then
  VERIFY_RESPONSE=$(curl -s "https://halalextra-production.up.railway.app/api/verify/$CERT_NUMBER")
  echo "Verification response:"
  echo "$VERIFY_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFY_RESPONSE"

  if echo "$VERIFY_RESPONSE" | grep -q '"status":"active"'; then
    echo "✅ SUCCESS: Certificate is active and verifiable!"
  else
    echo "❌ FAILED: Certificate verification failed"
  fi
else
  echo "⚠️ SKIPPED: No certificate number to verify"
fi

echo ""
echo "=== Test Complete ==="