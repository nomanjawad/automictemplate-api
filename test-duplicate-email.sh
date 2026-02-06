#!/bin/bash

echo "======================================"
echo "Testing Duplicate Email Detection"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/auth/register"
TEST_EMAIL="duplicatetest@gmail.com"
PASSWORD="SecurePassword123"

echo "Step 1: Register user for the first time..."
RESPONSE1=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$PASSWORD\",\"full_name\":\"First Registration\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_CODE1=$(echo "$RESPONSE1" | grep "HTTP_STATUS" | cut -d: -f2)
BODY1=$(echo "$RESPONSE1" | grep -v "HTTP_STATUS")

echo "HTTP Status: $HTTP_CODE1"
echo "Response: $BODY1" | head -c 200
echo ""
echo ""

sleep 2

echo "Step 2: Try to register with the SAME email (should get 409 Conflict)..."
RESPONSE2=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"DifferentPassword456\",\"full_name\":\"Second Registration\"}" \
  -w "\nHTTP_STATUS:%{http_code}")

HTTP_CODE2=$(echo "$RESPONSE2" | grep "HTTP_STATUS" | cut -d: -f2)
BODY2=$(echo "$RESPONSE2" | grep -v "HTTP_STATUS")

echo "HTTP Status: $HTTP_CODE2"
echo "Response: $BODY2"
echo ""

if [ "$HTTP_CODE2" = "409" ]; then
  echo "✅ SUCCESS: Duplicate email correctly rejected with 409 status!"
else
  echo "❌ FAILED: Expected 409, got $HTTP_CODE2"
fi

echo ""
echo "======================================"
