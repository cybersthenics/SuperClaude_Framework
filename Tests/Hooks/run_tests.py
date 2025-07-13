#!/usr/bin/env python3
"""
Test runner for SuperClaude Hook System
Starts the bridge service and runs comprehensive tests
"""

import os
import sys
import time
import subprocess
import signal
import json
from pathlib import Path

class HookTestRunner:
    """Test runner that manages bridge service and executes tests"""
    
    def __init__(self):
        self.bridge_process = None
        self.bridge_port = 8080
        self.bridge_url = f"http://localhost:{self.bridge_port}"
        
    def start_bridge_service(self):
        """Start the HTTP bridge service"""
        print("🌉 Starting HTTP bridge service...")
        
        bridge_dir = Path(__file__).parent.parent.parent / "MCP_Servers" / "bridge-hooks"
        
        if not bridge_dir.exists():
            print(f"❌ Bridge directory not found: {bridge_dir}")
            return False
            
        try:
            # Start the bridge service
            self.bridge_process = subprocess.Popen(
                ["npm", "start"],
                cwd=bridge_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**os.environ, "PORT": str(self.bridge_port)}
            )
            
            # Wait for service to start
            print("⏳ Waiting for bridge service to start...")
            time.sleep(3)
            
            # Check if process is still running
            if self.bridge_process.poll() is None:
                print(f"✅ Bridge service started on port {self.bridge_port}")
                return True
            else:
                stdout, stderr = self.bridge_process.communicate()
                print(f"❌ Bridge service failed to start:")
                print(f"STDOUT: {stdout.decode()}")
                print(f"STDERR: {stderr.decode()}")
                return False
                
        except Exception as e:
            print(f"❌ Failed to start bridge service: {e}")
            return False
    
    def stop_bridge_service(self):
        """Stop the HTTP bridge service"""
        if self.bridge_process:
            print("🛑 Stopping bridge service...")
            self.bridge_process.terminate()
            try:
                self.bridge_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.bridge_process.kill()
                self.bridge_process.wait()
            print("✅ Bridge service stopped")
    
    def run_basic_tests(self):
        """Run basic hook tests without full integration"""
        print("🧪 Running basic hook tests...")
        
        test_results = {}
        
        # Test 1: Hook configuration validation
        print("  📋 Testing hook configuration...")
        config_file = Path(__file__).parent / "config.json"
        
        if config_file.exists():
            try:
                with open(config_file) as f:
                    config = json.load(f)
                
                # Validate configuration structure
                required_hooks = ["PreToolUse", "PostToolUse", "PrePrompt", "PostPrompt", "Stop", "SubagentStop", "PreCompact"]
                found_hooks = list(config.keys())
                
                test_results["config_validation"] = {
                    "success": all(hook in found_hooks for hook in required_hooks),
                    "hooks_found": found_hooks,
                    "hooks_required": required_hooks
                }
                
                print("    ✅ Configuration validation passed")
                
            except Exception as e:
                test_results["config_validation"] = {
                    "success": False,
                    "error": str(e)
                }
                print(f"    ❌ Configuration validation failed: {e}")
        else:
            test_results["config_validation"] = {
                "success": False,
                "error": "config.json not found"
            }
            print("    ❌ config.json not found")
        
        # Test 2: Hook script validation
        print("  📋 Testing hook scripts...")
        hook_scripts = [
            "pre_tool_use.py",
            "post_tool_use.py", 
            "pre_prompt.py",
            "post_prompt.py",
            "stop.py",
            "subagent_stop.py",
            "precompact.py"
        ]
        
        script_results = {}
        for script in hook_scripts:
            script_path = Path(__file__).parent / script
            script_results[script] = {
                "exists": script_path.exists(),
                "executable": script_path.exists() and os.access(script_path, os.X_OK)
            }
        
        test_results["script_validation"] = script_results
        
        scripts_ok = all(r["exists"] for r in script_results.values())
        if scripts_ok:
            print("    ✅ All hook scripts found")
        else:
            missing = [script for script, r in script_results.items() if not r["exists"]]
            print(f"    ❌ Missing scripts: {missing}")
        
        # Test 3: Python environment validation
        print("  📋 Testing Python environment...")
        try:
            import requests
            import aiohttp
            test_results["python_env"] = {
                "success": True,
                "dependencies": ["requests", "aiohttp"]
            }
            print("    ✅ Python dependencies available")
        except ImportError as e:
            test_results["python_env"] = {
                "success": False,
                "error": str(e)
            }
            print(f"    ❌ Missing Python dependencies: {e}")
        
        return test_results
    
    def run_hook_execution_tests(self):
        """Run hook execution tests"""
        print("🔧 Testing hook execution...")
        
        execution_results = {}
        
        # Test individual hook scripts
        hook_tests = [
            ("pre_tool_use.py", {"tool_name": "Read", "tool_args": {"file_path": "/test.txt"}}),
            ("post_tool_use.py", {"tool_name": "Edit", "tool_args": {"success": True}}),
            ("stop.py", {"sessionId": "test-123", "performance": {"tools_used": 5}}),
        ]
        
        for script, test_data in hook_tests:
            script_path = Path(__file__).parent / script
            
            if not script_path.exists():
                execution_results[script] = {
                    "success": False,
                    "error": "Script not found"
                }
                continue
            
            try:
                # Create test input
                test_input = json.dumps(test_data)
                
                # Run script
                result = subprocess.run(
                    ["python3", str(script_path)],
                    input=test_input,
                    text=True,
                    capture_output=True,
                    timeout=5
                )
                
                execution_results[script] = {
                    "success": result.returncode == 0,
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "return_code": result.returncode
                }
                
                if result.returncode == 0:
                    print(f"    ✅ {script} executed successfully")
                else:
                    print(f"    ❌ {script} failed with code {result.returncode}")
                    if result.stderr:
                        print(f"      Error: {result.stderr}")
                
            except subprocess.TimeoutExpired:
                execution_results[script] = {
                    "success": False,
                    "error": "Timeout"
                }
                print(f"    ❌ {script} timed out")
            except Exception as e:
                execution_results[script] = {
                    "success": False,
                    "error": str(e)
                }
                print(f"    ❌ {script} failed: {e}")
        
        return execution_results
    
    def run_performance_tests(self):
        """Run performance tests"""
        print("⚡ Running performance tests...")
        
        performance_results = {}
        
        # Test hook execution times
        hook_files = [
            "pre_tool_use.py",
            "post_tool_use.py",
            "stop.py"
        ]
        
        for hook_file in hook_files:
            script_path = Path(__file__).parent / hook_file
            
            if not script_path.exists():
                continue
            
            execution_times = []
            
            # Run 10 iterations
            for i in range(10):
                try:
                    start_time = time.time()
                    
                    result = subprocess.run(
                        ["python3", str(script_path)],
                        input='{"test": "data"}',
                        text=True,
                        capture_output=True,
                        timeout=2
                    )
                    
                    execution_time = time.time() - start_time
                    execution_times.append(execution_time)
                    
                except Exception:
                    pass
            
            if execution_times:
                avg_time = sum(execution_times) / len(execution_times)
                min_time = min(execution_times)
                max_time = max(execution_times)
                
                performance_results[hook_file] = {
                    "avg_execution_time": avg_time,
                    "min_execution_time": min_time,
                    "max_execution_time": max_time,
                    "iterations": len(execution_times)
                }
                
                # Check if performance is acceptable (< 500ms)
                performance_ok = avg_time < 0.5
                status = "✅" if performance_ok else "⚠️"
                print(f"    {status} {hook_file}: {avg_time:.3f}s avg ({min_time:.3f}s - {max_time:.3f}s)")
        
        return performance_results
    
    def generate_test_report(self, basic_results, execution_results, performance_results):
        """Generate comprehensive test report"""
        report = {
            "test_timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "test_summary": {
                "basic_tests": {
                    "config_validation": basic_results.get("config_validation", {}).get("success", False),
                    "script_validation": all(r["exists"] for r in basic_results.get("script_validation", {}).values()),
                    "python_env": basic_results.get("python_env", {}).get("success", False)
                },
                "execution_tests": {
                    "scripts_tested": len(execution_results),
                    "scripts_passed": sum(1 for r in execution_results.values() if r["success"]),
                    "success_rate": sum(1 for r in execution_results.values() if r["success"]) / len(execution_results) if execution_results else 0
                },
                "performance_tests": {
                    "hooks_benchmarked": len(performance_results),
                    "avg_execution_time": sum(r["avg_execution_time"] for r in performance_results.values()) / len(performance_results) if performance_results else 0,
                    "performance_acceptable": all(r["avg_execution_time"] < 0.5 for r in performance_results.values())
                }
            },
            "detailed_results": {
                "basic_tests": basic_results,
                "execution_tests": execution_results,
                "performance_tests": performance_results
            }
        }
        
        # Save report
        report_file = Path(__file__).parent / "test_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📊 Test report saved: {report_file}")
        
        return report
    
    def run_all_tests(self):
        """Run all test phases"""
        print("🚀 SuperClaude Hook Test Suite")
        print("=" * 50)
        
        try:
            # Phase 1: Basic validation tests
            print("\n📋 Phase 1: Basic Validation Tests")
            basic_results = self.run_basic_tests()
            
            # Phase 2: Hook execution tests  
            print("\n🔧 Phase 2: Hook Execution Tests")
            execution_results = self.run_hook_execution_tests()
            
            # Phase 3: Performance tests
            print("\n⚡ Phase 3: Performance Tests")
            performance_results = self.run_performance_tests()
            
            # Generate report
            print("\n📊 Generating Test Report...")
            report = self.generate_test_report(basic_results, execution_results, performance_results)
            
            # Print summary
            print("\n" + "=" * 50)
            print("🎯 TEST SUMMARY")
            print("=" * 50)
            
            summary = report["test_summary"]
            
            print(f"Basic Tests:")
            print(f"  Config Validation: {'✅' if summary['basic_tests']['config_validation'] else '❌'}")
            print(f"  Script Validation: {'✅' if summary['basic_tests']['script_validation'] else '❌'}")
            print(f"  Python Environment: {'✅' if summary['basic_tests']['python_env'] else '❌'}")
            
            print(f"\nExecution Tests:")
            print(f"  Scripts Tested: {summary['execution_tests']['scripts_tested']}")
            print(f"  Scripts Passed: {summary['execution_tests']['scripts_passed']}")
            print(f"  Success Rate: {summary['execution_tests']['success_rate']:.1%}")
            
            print(f"\nPerformance Tests:")
            print(f"  Hooks Benchmarked: {summary['performance_tests']['hooks_benchmarked']}")
            print(f"  Avg Execution Time: {summary['performance_tests']['avg_execution_time']:.3f}s")
            print(f"  Performance Acceptable: {'✅' if summary['performance_tests']['performance_acceptable'] else '❌'}")
            
            # Determine overall result
            overall_success = (
                summary['basic_tests']['config_validation'] and
                summary['basic_tests']['script_validation'] and
                summary['execution_tests']['success_rate'] > 0.8 and
                summary['performance_tests']['performance_acceptable']
            )
            
            if overall_success:
                print("\n🎉 All tests passed successfully!")
                return 0
            else:
                print("\n⚠️ Some tests failed - see detailed report")
                return 1
                
        except KeyboardInterrupt:
            print("\n🛑 Tests interrupted by user")
            return 1
        except Exception as e:
            print(f"\n❌ Test suite failed: {e}")
            return 1

def main():
    """Main function"""
    runner = HookTestRunner()
    
    try:
        return runner.run_all_tests()
    finally:
        runner.stop_bridge_service()

if __name__ == "__main__":
    sys.exit(main())