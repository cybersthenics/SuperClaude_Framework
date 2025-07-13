#!/bin/bash
# SuperClaude MCP Integration Test Runner

set -e

echo "🚀 SuperClaude MCP Integration Tests"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test status tracking
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test and track results
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "\n${YELLOW}Running: ${test_name}${NC}"
    echo "----------------------------------------"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ ${test_name} passed${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ ${test_name} failed${NC}"
        ((TESTS_FAILED++))
    fi
}

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

# Check if bridge server is running
if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Bridge server not running. Starting it...${NC}"
    cd MCP_Servers/bridge-hooks
    npm run server &
    BRIDGE_PID=$!
    cd ../..
    sleep 3
fi

# Check environment variables
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cp .env.example .env 2>/dev/null || echo "# Add your API keys here" > .env
fi

# Create logs directory
mkdir -p logs

# Run tests
echo -e "\n🧪 Starting test suite..."

# Test 1: Python Hooks
run_test "Python Hooks" "cd Tests/Hooks && python3 test_hooks.py"

# Test 2: Bridge Server Tests
run_test "Bridge Server" "cd MCP_Servers/bridge-hooks && npm test -- --testPathPattern=integration"

# Test 3: External Server Connectivity
run_test "External Server Connectivity" "python3 Tests/test_external_servers.py"

# Test 4: Circuit Breaker
run_test "Circuit Breaker" "python3 Tests/test_circuit_breaker.py"

# Test 5: End-to-End Commands
run_test "End-to-End Commands" "python3 Tests/test_commands.py"

# Test 6: Performance Benchmarks
run_test "Performance Benchmarks" "python3 Tests/test_performance.py"

# Clean up
if [ ! -z "$BRIDGE_PID" ]; then
    echo -e "\n🧹 Cleaning up..."
    kill $BRIDGE_PID 2>/dev/null || true
fi

# Summary
echo -e "\n===================================="
echo "📊 Test Summary"
echo "===================================="
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED))
if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! (${TESTS_PASSED}/${TOTAL_TESTS})${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed (${TESTS_FAILED}/${TOTAL_TESTS})${NC}"
    exit 1
fi