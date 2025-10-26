#!/bin/bash

# Login Performance Test Script
# This script tests the login performance improvements

echo "Testing login performance improvements..."
echo "=========================================="

# Test 1: Check if login page loads quickly
echo "1. Testing login page load time..."
start_time=$(date +%s%N)
curl -s -o /dev/null -w "HTTP Status: %{http_code}, Time: %{time_total}s\n" http://localhost:3000/login
end_time=$(date +%s%N)
load_time=$(( (end_time - start_time) / 1000000 ))
echo "Login page load time: ${load_time}ms"

# Test 2: Check middleware performance
echo "2. Testing middleware performance..."
start_time=$(date +%s%N)
curl -s -o /dev/null -w "HTTP Status: %{http_code}, Time: %{time_total}s\n" http://localhost:3000/dashboard
end_time=$(date +%s%N)
middleware_time=$(( (end_time - start_time) / 1000000 ))
echo "Middleware redirect time: ${middleware_time}ms"

echo "=========================================="
echo "Performance test completed!"
echo "Expected improvements:"
echo "- Login page should load < 200ms"
echo "- Middleware should redirect < 100ms"
echo "- Password verification should be < 50ms"
