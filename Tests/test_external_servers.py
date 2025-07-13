#!/usr/bin/env python3
"""
Test external MCP server connectivity
Tests Context7, Sequential, Magic, and Playwright connections
"""

import os
import sys
import time
import json
import requests
import websocket
from typing import Dict, Any, Optional, Tuple

class ExternalServerTester:
    def __init__(self):
        self.results = []
        self.load_env()
        
    def load_env(self):
        """Load environment variables"""
        # Load from .env file if exists
        env_file = os.path.join(os.path.dirname(__file__), '..', '.env')
        if os.path.exists(env_file):
            with open(env_file, 'r') as f:
                for line in f:
                    if '=' in line and not line.strip().startswith('#'):
                        key, value = line.strip().split('=', 1)
                        os.environ[key] = value
                        
    def test_context7(self) -> Tuple[bool, str]:
        """Test Context7 API connectivity"""
        print("\n🧪 Testing Context7 connection...")
        
        api_key = os.getenv('CONTEXT7_API_KEY')
        if not api_key or api_key == 'your-context7-key-here':
            print("  ⚠️  Context7 API key not configured")
            return False, "API key not configured"
            
        try:
            # Test health endpoint
            response = requests.get(
                'https://api.context7.com/v1/health',
                headers={'Authorization': f'Bearer {api_key}'},
                timeout=5
            )
            
            if response.status_code == 200:
                print("  ✅ Context7 health check: Connected")
                
                # Test library search
                search_response = requests.post(
                    'https://api.context7.com/v1/resolve-library-id',
                    headers={'Authorization': f'Bearer {api_key}'},
                    json={'libraryName': 'react'},
                    timeout=5
                )
                
                if search_response.status_code == 200:
                    print("  ✅ Context7 library search: Working")
                    return True, "Fully functional"
                else:
                    print(f"  ⚠️  Context7 library search failed: {search_response.status_code}")
                    return True, "Health check passed, search failed"
            else:
                print(f"  ❌ Context7 connection failed: {response.status_code}")
                return False, f"HTTP {response.status_code}"
                
        except requests.exceptions.Timeout:
            print("  ❌ Context7 connection timeout")
            return False, "Connection timeout"
        except Exception as e:
            print(f"  ❌ Context7 connection error: {e}")
            return False, str(e)
            
    def test_sequential(self) -> Tuple[bool, str]:
        """Test Sequential WebSocket connectivity"""
        print("\n🧪 Testing Sequential connection...")
        
        token = os.getenv('SEQUENTIAL_TOKEN')
        if not token or token == 'your-sequential-token-here':
            print("  ⚠️  Sequential token not configured")
            return False, "Token not configured"
            
        # Try WebSocket first
        try:
            ws = websocket.create_connection(
                "ws://sequential.local:8080",
                timeout=5,
                header=[f"Authorization: Bearer {token}"]
            )
            ws.send(json.dumps({"type": "ping"}))
            response = ws.recv()
            ws.close()
            
            print("  ✅ Sequential WebSocket: Connected")
            return True, "WebSocket connected"
            
        except Exception as ws_error:
            print(f"  ⚠️  Sequential WebSocket failed: {ws_error}")
            
            # Try HTTP fallback
            try:
                response = requests.get(
                    'http://sequential.local:8080/health',
                    headers={'Authorization': f'Bearer {token}'},
                    timeout=5
                )
                
                if response.status_code == 200:
                    print("  ✅ Sequential HTTP fallback: Connected")
                    return True, "HTTP fallback working"
                else:
                    print(f"  ❌ Sequential HTTP failed: {response.status_code}")
                    return False, f"Both WS and HTTP failed"
                    
            except Exception as http_error:
                print(f"  ❌ Sequential connection failed: {http_error}")
                return False, "Connection failed"
                
    def test_magic(self) -> Tuple[bool, str]:
        """Test Magic (21st.dev) API connectivity"""
        print("\n🧪 Testing Magic connection...")
        
        api_key = os.getenv('MAGIC_API_KEY')
        if not api_key or api_key == 'your-magic-key-here':
            print("  ⚠️  Magic API key not configured")
            return False, "API key not configured"
            
        try:
            # Test component search
            response = requests.get(
                'https://21st.dev/api/search',
                headers={'X-API-Key': api_key},
                params={'q': 'button', 'limit': 1},
                timeout=5
            )
            
            if response.status_code == 200:
                print("  ✅ Magic API: Connected")
                data = response.json()
                if data.get('components'):
                    print(f"  ✅ Magic search: Found {len(data['components'])} components")
                return True, "Fully functional"
            elif response.status_code == 401:
                print("  ❌ Magic API: Authentication failed")
                return False, "Invalid API key"
            elif response.status_code == 429:
                print("  ⚠️  Magic API: Rate limited")
                return True, "Rate limited but working"
            else:
                print(f"  ❌ Magic API failed: {response.status_code}")
                return False, f"HTTP {response.status_code}"
                
        except Exception as e:
            print(f"  ❌ Magic connection error: {e}")
            return False, str(e)
            
    def test_playwright(self) -> Tuple[bool, str]:
        """Test Playwright availability"""
        print("\n🧪 Testing Playwright...")
        
        # Check if playwright is installed
        try:
            import subprocess
            result = subprocess.run(
                ['npx', 'playwright', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                version = result.stdout.strip()
                print(f"  ✅ Playwright installed: {version}")
                
                # Check browser installations
                browsers_result = subprocess.run(
                    ['npx', 'playwright', 'list'],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if browsers_result.returncode == 0:
                    print("  ✅ Playwright browsers available")
                    return True, f"Version {version}"
                else:
                    print("  ⚠️  Playwright browsers not installed")
                    return True, "Playwright installed, browsers missing"
            else:
                print("  ❌ Playwright not found")
                return False, "Not installed"
                
        except subprocess.TimeoutExpired:
            print("  ❌ Playwright check timeout")
            return False, "Check timeout"
        except Exception as e:
            print(f"  ❌ Playwright check error: {e}")
            return False, str(e)
            
    def run_all_tests(self):
        """Run all external server tests"""
        print("🚀 Testing External MCP Server Connectivity")
        print("=" * 50)
        
        # Test each server
        servers = [
            ("Context7", self.test_context7),
            ("Sequential", self.test_sequential),
            ("Magic", self.test_magic),
            ("Playwright", self.test_playwright)
        ]
        
        for server_name, test_func in servers:
            success, message = test_func()
            self.results.append((server_name, success, message))
            
        # Summary
        print("\n" + "=" * 50)
        print("📊 External Server Status:")
        
        all_success = True
        for server, success, message in self.results:
            status = "✅" if success else "❌"
            print(f"  {status} {server}: {message}")
            if not success:
                all_success = False
                
        print("\n🔧 Configuration:")
        print(f"  Bridge URL: {os.getenv('BRIDGE_HOOKS_URL', 'http://localhost:8080')}")
        print(f"  Environment: {os.getenv('CLAUDE_ENV', 'development')}")
        
        if all_success:
            print("\n🎉 All external servers configured!")
            return 0
        else:
            print("\n⚠️  Some servers need configuration")
            print("\n💡 Tips:")
            print("  1. Check your .env file for API keys")
            print("  2. Ensure external services are accessible")
            print("  3. For local testing, internal fallbacks will be used")
            return 1

if __name__ == "__main__":
    tester = ExternalServerTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)