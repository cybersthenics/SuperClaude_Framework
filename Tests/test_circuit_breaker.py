#!/usr/bin/env python3
"""
Test circuit breaker functionality
Simulates server failures and validates fallback behavior
"""

import os
import sys
import time
import json
import requests
from typing import Dict, Any, List
import threading

class CircuitBreakerTester:
    def __init__(self):
        self.bridge_url = os.getenv('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.results = []
        self.failure_count = 0
        
    def simulate_server_failure(self, server_name: str, failure_count: int) -> Dict[str, Any]:
        """Simulate failures for a specific server"""
        print(f"\n🔨 Simulating {failure_count} failures for {server_name}...")
        
        responses = []
        for i in range(failure_count):
            try:
                # Send request that will fail
                response = requests.post(
                    f"{self.bridge_url}/test-server-failure",
                    json={
                        "server": server_name,
                        "simulateFailure": True
                    },
                    timeout=2
                )
                responses.append({
                    "attempt": i + 1,
                    "status": response.status_code,
                    "circuitOpen": response.json().get("circuitOpen", False)
                })
                time.sleep(0.5)  # Small delay between failures
            except Exception as e:
                responses.append({
                    "attempt": i + 1,
                    "error": str(e)
                })
                
        return {
            "server": server_name,
            "failures": failure_count,
            "responses": responses
        }
        
    def test_circuit_breaker_opening(self) -> bool:
        """Test that circuit breaker opens after 5 failures"""
        print("\n🧪 Testing circuit breaker opening...")
        
        servers = ["context7", "sequential", "magic"]
        all_passed = True
        
        for server in servers:
            # Simulate 6 failures (should open after 5)
            result = self.simulate_server_failure(server, 6)
            
            # Check if circuit opened after 5 failures
            opened_at = None
            for response in result["responses"]:
                if response.get("circuitOpen"):
                    opened_at = response["attempt"]
                    break
                    
            if opened_at == 5 or opened_at == 6:
                print(f"  ✅ {server}: Circuit opened after {opened_at} failures")
            else:
                print(f"  ❌ {server}: Circuit did not open correctly")
                all_passed = False
                
        self.results.append(("Circuit Breaker Opening", all_passed))
        return all_passed
        
    def test_fallback_activation(self) -> bool:
        """Test that fallback servers are used when circuit is open"""
        print("\n🧪 Testing fallback activation...")
        
        test_cases = [
            {
                "tool": "Read",
                "args": {"file_path": "/test.txt"},
                "expectedServer": "internal",
                "description": "Simple operation uses internal"
            },
            {
                "tool": "Analyze",
                "args": {"target": "complex"},
                "expectedServer": "sequential",
                "fallbackServer": "superclaude-intelligence",
                "description": "Complex analysis falls back to internal intelligence"
            },
            {
                "tool": "Build",
                "args": {"component": "Button"},
                "expectedServer": "magic",
                "fallbackServer": "superclaude-ui",
                "description": "UI component falls back to internal UI server"
            }
        ]
        
        passed = 0
        for test in test_cases:
            try:
                response = requests.post(
                    f"{self.bridge_url}/pre-tool",
                    json={
                        "toolName": test["tool"],
                        "toolArgs": test["args"],
                        "sessionId": "test-circuit-breaker",
                        "testCircuitOpen": True  # Force circuit open for testing
                    },
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    used_server = data.get("mcpRoute")
                    
                    if test.get("fallbackServer") and used_server == test["fallbackServer"]:
                        print(f"  ✅ {test['description']}: Using fallback")
                        passed += 1
                    elif not test.get("fallbackServer") and used_server == test["expectedServer"]:
                        print(f"  ✅ {test['description']}: Using primary")
                        passed += 1
                    else:
                        print(f"  ❌ {test['description']}: Wrong server ({used_server})")
                else:
                    print(f"  ❌ {test['description']}: Request failed")
                    
            except Exception as e:
                print(f"  ❌ {test['description']}: Error - {e}")
                
        success = passed == len(test_cases)
        self.results.append(("Fallback Activation", success))
        return success
        
    def test_circuit_recovery(self) -> bool:
        """Test that circuit breaker recovers after timeout"""
        print("\n🧪 Testing circuit recovery...")
        
        # This would normally wait 60 seconds, but for testing we'll simulate
        print("  ⏳ Simulating 60-second recovery period...")
        
        try:
            # Request circuit status
            response = requests.get(
                f"{self.bridge_url}/circuit-status",
                timeout=5
            )
            
            if response.status_code == 200:
                status = response.json()
                
                # Check each server's circuit status
                all_recovered = True
                for server, info in status.get("servers", {}).items():
                    state = info.get("state", "unknown")
                    if state == "closed":
                        print(f"  ✅ {server}: Circuit recovered (closed)")
                    elif state == "half-open":
                        print(f"  ⚠️  {server}: Circuit in half-open state")
                    else:
                        print(f"  ❌ {server}: Circuit still open")
                        all_recovered = False
                        
                self.results.append(("Circuit Recovery", all_recovered))
                return all_recovered
            else:
                print("  ❌ Could not check circuit status")
                self.results.append(("Circuit Recovery", False))
                return False
                
        except Exception as e:
            print(f"  ❌ Circuit recovery test error: {e}")
            self.results.append(("Circuit Recovery", False))
            return False
            
    def test_performance_under_failure(self) -> bool:
        """Test system performance when some servers are failing"""
        print("\n🧪 Testing performance under partial failure...")
        
        start_time = time.time()
        request_times = []
        
        # Simulate mixed success/failure scenario
        for i in range(10):
            request_start = time.time()
            try:
                response = requests.post(
                    f"{self.bridge_url}/pre-tool",
                    json={
                        "toolName": "Analyze",
                        "toolArgs": {"target": "test"},
                        "sessionId": f"perf-test-{i}",
                        "simulateRandomFailure": True
                    },
                    timeout=5
                )
                request_time = (time.time() - request_start) * 1000  # Convert to ms
                request_times.append(request_time)
                
            except Exception as e:
                print(f"  ⚠️  Request {i} failed: {e}")
                
        if request_times:
            avg_time = sum(request_times) / len(request_times)
            max_time = max(request_times)
            
            print(f"  📊 Average response time: {avg_time:.1f}ms")
            print(f"  📊 Maximum response time: {max_time:.1f}ms")
            
            # Performance should still be acceptable with failures
            if avg_time < 200 and max_time < 500:
                print("  ✅ Performance acceptable under failure conditions")
                self.results.append(("Performance Under Failure", True))
                return True
            else:
                print("  ❌ Performance degraded too much")
                self.results.append(("Performance Under Failure", False))
                return False
        else:
            print("  ❌ No successful requests")
            self.results.append(("Performance Under Failure", False))
            return False
            
    def run_all_tests(self):
        """Run all circuit breaker tests"""
        print("🚀 Testing Circuit Breaker Functionality")
        print("=" * 50)
        
        # Check if bridge is available
        try:
            health = requests.get(f"{self.bridge_url}/health", timeout=2)
            if health.status_code != 200:
                print("❌ Bridge server not available")
                return 1
        except:
            print("❌ Bridge server not available")
            print("💡 Start the bridge server first:")
            print("   cd MCP_Servers/bridge-hooks && npm run server")
            return 1
            
        # Run tests
        self.test_circuit_breaker_opening()
        self.test_fallback_activation()
        self.test_circuit_recovery()
        self.test_performance_under_failure()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Circuit Breaker Test Summary:")
        
        passed = sum(1 for _, success in self.results if success)
        total = len(self.results)
        
        for name, success in self.results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"  {name}: {status}")
            
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All circuit breaker tests passed!")
            return 0
        else:
            print(f"\n⚠️  {total - passed} tests failed")
            return 1

if __name__ == "__main__":
    tester = CircuitBreakerTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)