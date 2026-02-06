#!/bin/bash

echo "======================================"
echo "Testing New User API Endpoints"
echo "======================================"
echo ""

API_URL="http://localhost:3000/api/user"
TEST_EMAIL="apitest@gmail.com"
TEST_PASSWORD="TestPass123"

# Test 0: Register (try to register, ignore if already exists)
echo "0. Testing REGISTER: POST /api/user/register"
curl -s -X POST "$API_URL/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"full_name\":\"API Test User\"}" | head -c 200
echo ""
echo ""

# Test 1: Login
echo "1. Testing LOGIN: POST /api/user/login"
RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

echo "$RESPONSE" | head -c 200
echo ""
echo ""

# Extract token
TOKEN=$(echo "$RESPONSE" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Login successful - Token: ${TOKEN:0:50}..."
echo ""

# Test 2: Get Profile
echo "2. Testing GET PROFILE: GET /api/user/profile"
curl -s -X GET "$API_URL/profile" \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""
echo ""

# Test 3: Check Session
echo "3. Testing CHECK SESSION: GET /api/user/session"
curl -s -X GET "$API_URL/session" \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""
echo ""

# Test 4: Get All Users
echo "4. Testing GET ALL USERS: GET /api/user"
curl -s -X GET "$API_URL" \
  -H "Authorization: Bearer $TOKEN" | head -c 400
echo ""
echo ""

# Test 5: Get User by Email
echo "5. Testing GET USER BY EMAIL: GET /api/user/email/:email"
curl -s -X GET "$API_URL/email/$TEST_EMAIL" \
  -H "Authorization: Bearer $TOKEN" | head -c 300
echo ""
echo ""

# Test 6: Update Profile
echo "6. Testing UPDATE PROFILE: PUT /api/user/profile"
curl -s -X PUT "$API_URL/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Updated Name","bio":"Updated bio from API test"}' | head -c 300
echo ""
echo ""

echo "======================================"
echo "✅ All tests completed!"
echo "======================================"
