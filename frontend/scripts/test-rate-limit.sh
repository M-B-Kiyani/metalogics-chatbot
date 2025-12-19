#!/bin/bash

# Rate Limiting Test Script for Linux/Mac
# Tests the rate limiting configuration

URL="${1:-http://localhost:3000/api/health}"
REQUESTS="${2:-55}"

echo "=========================================="
echo "Rate Limiting Test"
echo "=========================================="
echo "Target: $URL"
echo "Requests: $REQUESTS"
echo ""

SUCCESS_COUNT=0
RATE_LIMITED_COUNT=0
ERROR_COUNT=0
LIMIT=""
REMAINING=""

for i in $(seq 1 $REQUESTS); do
    RESPONSE=$(curl -s -w "\n%{http_code}" "$URL" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    HEADERS=$(curl -s -I "$URL" 2>&1)
    
    # Extract rate limit headers
    LIMIT=$(echo "$HEADERS" | grep -i "X-RateLimit-Limit:" | awk '{print $2}' | tr -d '\r')
    REMAINING=$(echo "$HEADERS" | grep -i "X-RateLimit-Remaining:" | awk '{print $2}' | tr -d '\r')
    
    if [ "$HTTP_CODE" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo -n "." 
    elif [ "$HTTP_CODE" = "429" ]; then
        RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
        echo -n "X"
    else
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo -n "!"
    fi
    
    # Small delay
    sleep 0.05
done

echo ""
echo ""
echo "=========================================="
echo "Test Results"
echo "=========================================="
echo "Total Requests:    $REQUESTS"
echo "Successful:        $SUCCESS_COUNT"
echo "Rate Limited:      $RATE_LIMITED_COUNT"
echo "Errors:            $ERROR_COUNT"
echo ""
echo "Rate Limit Config:"
echo "  Limit:           $LIMIT requests/minute"
echo "  Last Remaining:  $REMAINING"
echo ""

if [ $RATE_LIMITED_COUNT -gt 0 ]; then
    echo "✅ Rate limiting is WORKING correctly!"
    echo "   Requests were blocked after reaching the limit."
elif [ $SUCCESS_COUNT -eq $REQUESTS ]; then
    echo "⚠️  Rate limiting may NOT be working!"
    echo "   All requests succeeded. Expected some to be rate limited."
else
    echo "❌ Test inconclusive due to errors."
fi

echo ""
echo "Legend:"
echo "  . = Success (200 OK)"
echo "  X = Rate Limited (429)"
echo "  ! = Error"
echo ""
