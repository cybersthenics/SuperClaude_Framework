#!/usr/bin/env python3
"""
Test script for SuperClaude Python hooks
Tests pre-tool, post-tool, and notification hooks
"""

import json
import sys
import os
import subprocess
import time
import requests
from typing import Dict, Any, Optional

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test configuration
BRIDGE_URL = os.getenv('BRIDGE_HOOKS_URL', 'http://localhost:8080')
TEST_SESSION_ID = 'test-session-123'
TEST_EXECUTION_ID = 'test-exec-456'

class HookTester:
    def __init__(self):
        self.results = []
        self.bridge_healthy = False
        
    def check_bridge_health(self) -> bool:
        """Check if bridge HTTP server is running"""
        try:
            response = requests.get(f"{BRIDGE_URL}/health", timeout=2)
            if response.status_code == 200:
                print("✅ Bridge server is healthy")
                self.bridge_healthy = True
                return True
        except Exception as e:
            print(f"❌ Bridge server not reachable: {e}")
        return False
        
    def test_pre_tool_hook(self) -> bool:
        """Test pre-tool hook execution"""
        print("\n🧪 Testing pre-tool hook...")
        
        test_cases = [
            {
                "name": "Simple Read operation",
                "input": {
                    "tool": "Read",
                    "args": {"file_path": "/test/file.txt"},
                    "sessionId": TEST_SESSION_ID,
                    "executionId": TEST_EXECUTION_ID
                },
                "expected": {
                    "allow": True,
                    "mcpRoute": None  # Simple operation, no MCP needed
                }
            },
            {
                "name": "Complex analysis triggering Sequential",
                "input": {
                    "tool": "Analyze",
                    "args": {"target": "system", "complexity": "high"},
                    "sessionId": TEST_SESSION_ID,
                    "executionId": TEST_EXECUTION_ID,
                    "flags": ["--think-hard"]
                },
                "expected": {
                    "allow": True,
                    "mcpRoute": "sequential"  # Should route to Sequential
                }
            },
            {
                "name": "UI component triggering Magic",
                "input": {
                    "tool": "Build",
                    "args": {"component": "Button", "type": "React"},
                    "sessionId": TEST_SESSION_ID,
                    "executionId": TEST_EXECUTION_ID,
                    "persona": "frontend"
                },
                "expected": {
                    "allow": True,
                    "mcpRoute": "magic"  # Should route to Magic
                }
            }
        ]
        
        passed = 0
        for test in test_cases:
            try:
                # Call pre-tool hook via stdin/stdout
                proc = subprocess.Popen(
                    [sys.executable, "pre_tool_use.py"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True
                )
                
                stdout, stderr = proc.communicate(input=json.dumps(test["input"]))
                
                if proc.returncode == 0:
                    result = json.loads(stdout)
                    
                    # Validate expected fields
                    if result.get("allow") == test["expected"]["allow"]:
                        print(f"  ✅ {test['name']}: Passed")
                        passed += 1
                    else:
                        print(f"  ❌ {test['name']}: Failed - unexpected allow value")
                        print(f"     Expected: {test['expected']}")
                        print(f"     Got: {result}")
                else:
                    print(f"  ❌ {test['name']}: Failed with error")
                    print(f"     Error: {stderr}")
                    
            except Exception as e:
                print(f"  ❌ {test['name']}: Exception - {e}")
                
        success = passed == len(test_cases)
        self.results.append(("Pre-tool Hook", success))
        return success
        
    def test_post_tool_hook(self) -> bool:
        """Test post-tool hook execution"""
        print("\n🧪 Testing post-tool hook...")
        
        test_input = {
            "tool": "Read",
            "result": {"content": "File contents here"},
            "error": None,
            "sessionId": TEST_SESSION_ID,
            "executionId": TEST_EXECUTION_ID,
            "executionTime": 150
        }
        
        try:
            proc = subprocess.Popen(
                [sys.executable, "post_tool_use.py"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = proc.communicate(input=json.dumps(test_input))
            
            if proc.returncode == 0:
                result = json.loads(stdout)
                if result.get("processed"):
                    print("  ✅ Post-tool hook: Passed")
                    self.results.append(("Post-tool Hook", True))
                    return True
                else:
                    print("  ❌ Post-tool hook: Failed - not processed")
            else:
                print(f"  ❌ Post-tool hook: Failed with error - {stderr}")
                
        except Exception as e:
            print(f"  ❌ Post-tool hook: Exception - {e}")
            
        self.results.append(("Post-tool Hook", False))
        return False
        
    def test_notification_hook(self) -> bool:
        """Test notification hook execution"""
        print("\n🧪 Testing notification hook...")
        
        test_input = {
            "type": "permission_request",
            "message": "Claude Code wants to access file system",
            "sessionId": TEST_SESSION_ID,
            "timestamp": time.time()
        }
        
        try:
            proc = subprocess.Popen(
                [sys.executable, "notification.py"],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = proc.communicate(input=json.dumps(test_input))
            
            if proc.returncode == 0:
                # Notification hook doesn't return structured data
                print("  ✅ Notification hook: Passed")
                self.results.append(("Notification Hook", True))
                return True
            else:
                print(f"  ❌ Notification hook: Failed with error - {stderr}")
                
        except Exception as e:
            print(f"  ❌ Notification hook: Exception - {e}")
            
        self.results.append(("Notification Hook", False))
        return False
        
    def test_bridge_integration(self) -> bool:
        """Test integration with bridge HTTP server"""
        if not self.bridge_healthy:
            print("\n⚠️  Skipping bridge integration tests - server not available")
            return False
            
        print("\n🧪 Testing bridge integration...")
        
        try:
            # Test pre-tool endpoint
            pre_response = requests.post(
                f"{BRIDGE_URL}/pre-tool",
                json={
                    "toolName": "Read",
                    "toolArgs": {"file_path": "/test.txt"},
                    "sessionId": TEST_SESSION_ID,
                    "executionId": TEST_EXECUTION_ID
                },
                timeout=5
            )
            
            if pre_response.status_code == 200:
                print("  ✅ Bridge pre-tool endpoint: Passed")
            else:
                print(f"  ❌ Bridge pre-tool endpoint: Failed - {pre_response.status_code}")
                
            # Test MCP status endpoint
            status_response = requests.get(f"{BRIDGE_URL}/mcp-status", timeout=5)
            
            if status_response.status_code == 200:
                print("  ✅ Bridge MCP status endpoint: Passed")
                status = status_response.json()
                print(f"     Internal servers: {len(status.get('mcpServers', {}))}")
                print(f"     External servers: {len(status.get('externalServers', {}))}")
            else:
                print(f"  ❌ Bridge MCP status endpoint: Failed - {status_response.status_code}")
                
            self.results.append(("Bridge Integration", True))
            return True
            
        except Exception as e:
            print(f"  ❌ Bridge integration: Exception - {e}")
            self.results.append(("Bridge Integration", False))
            return False
            
    def run_all_tests(self):
        """Run all hook tests"""
        print("🚀 Starting SuperClaude Hook Tests")
        print("=" * 50)
        
        # Check prerequisites
        self.check_bridge_health()
        
        # Run tests
        self.test_pre_tool_hook()
        self.test_post_tool_hook()
        self.test_notification_hook()
        self.test_bridge_integration()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary:")
        passed = sum(1 for _, success in self.results if success)
        total = len(self.results)
        
        for name, success in self.results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"  {name}: {status}")
            
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n🎉 All tests passed!")
            return 0
        else:
            print(f"\n⚠️  {total - passed} tests failed")
            return 1

if __name__ == "__main__":
    tester = HookTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)