#!/usr/bin/env python3
"""
SuperClaude Hook Performance Benchmark
Measures hook performance and optimization effectiveness
"""

import json
import time
import subprocess
import statistics
import sys
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass

@dataclass
class BenchmarkMetrics:
    """Performance benchmark metrics"""
    hook_name: str
    total_runs: int
    success_rate: float
    avg_execution_time: float
    min_execution_time: float
    max_execution_time: float
    p50_execution_time: float
    p95_execution_time: float
    p99_execution_time: float
    throughput_per_second: float
    optimization_effectiveness: float

class PerformanceBenchmark:
    """Performance benchmark for hook system"""
    
    def __init__(self):
        self.hooks_dir = Path(__file__).parent
        self.baseline_times = {
            'pre_tool_use.py': 0.150,   # 150ms baseline
            'post_tool_use.py': 0.100,  # 100ms baseline
            'pre_prompt.py': 0.075,     # 75ms baseline
            'post_prompt.py': 0.125,    # 125ms baseline
            'stop.py': 0.200,           # 200ms baseline
            'subagent_stop.py': 0.175,  # 175ms baseline
            'precompact.py': 0.300      # 300ms baseline
        }
    
    def benchmark_hook(self, hook_script: str, test_data: Dict[str, Any], iterations: int = 100) -> BenchmarkMetrics:
        """Benchmark a specific hook script"""
        print(f"🔥 Benchmarking {hook_script} ({iterations} iterations)...")
        
        script_path = self.hooks_dir / hook_script
        if not script_path.exists():
            raise FileNotFoundError(f"Hook script not found: {script_path}")
        
        execution_times = []
        successes = 0
        
        # Warm up
        for _ in range(5):
            try:
                subprocess.run(
                    ["python3", str(script_path)],
                    input=json.dumps(test_data),
                    text=True,
                    capture_output=True,
                    timeout=2
                )
            except Exception:
                pass
        
        # Actual benchmark
        for i in range(iterations):
            start_time = time.time()
            
            try:
                result = subprocess.run(
                    ["python3", str(script_path)],
                    input=json.dumps(test_data),
                    text=True,
                    capture_output=True,
                    timeout=2
                )
                
                execution_time = time.time() - start_time
                execution_times.append(execution_time)
                
                if result.returncode == 0:
                    successes += 1
                    
            except subprocess.TimeoutExpired:
                execution_times.append(2.0)  # Timeout time
            except Exception as e:
                execution_times.append(1.0)  # Default error time
                print(f"  Error in iteration {i+1}: {e}")
            
            if (i + 1) % 20 == 0:
                print(f"  Progress: {i+1}/{iterations}")
        
        # Calculate metrics
        if execution_times:
            execution_times.sort()
            avg_time = statistics.mean(execution_times)
            min_time = min(execution_times)
            max_time = max(execution_times)
            p50_time = statistics.median(execution_times)
            p95_time = execution_times[int(0.95 * len(execution_times))]
            p99_time = execution_times[int(0.99 * len(execution_times))]
            
            total_time = sum(execution_times)
            throughput = iterations / total_time if total_time > 0 else 0
            
            # Calculate optimization effectiveness
            baseline_time = self.baseline_times.get(hook_script, avg_time)
            optimization_effectiveness = baseline_time / avg_time if avg_time > 0 else 1.0
            
            return BenchmarkMetrics(
                hook_name=hook_script,
                total_runs=iterations,
                success_rate=successes / iterations,
                avg_execution_time=avg_time,
                min_execution_time=min_time,
                max_execution_time=max_time,
                p50_execution_time=p50_time,
                p95_execution_time=p95_time,
                p99_execution_time=p99_time,
                throughput_per_second=throughput,
                optimization_effectiveness=optimization_effectiveness
            )
        else:
            raise ValueError("No execution times recorded")
    
    def benchmark_all_hooks(self, iterations: int = 100) -> Dict[str, BenchmarkMetrics]:
        """Benchmark all hook scripts"""
        print(f"⚡ Starting comprehensive performance benchmark ({iterations} iterations per hook)")
        
        # Test data for each hook
        test_data_sets = {
            'pre_tool_use.py': {
                'tool_name': 'mcp__sequential__sequentialthinking',
                'tool_args': {
                    'thought': 'Testing performance optimization',
                    'thoughtNumber': 1,
                    'totalThoughts': 3,
                    'nextThoughtNeeded': True
                }
            },
            'post_tool_use.py': {
                'tool_name': 'Edit',
                'tool_args': {
                    'file_path': '/test/file.ts',
                    'success': True,
                    'execution_time': 0.245,
                    'tokens_used': 150
                }
            },
            'pre_prompt.py': {
                'prompt': 'Analyze this complex TypeScript function for performance issues',
                'context': {
                    'file_type': 'typescript',
                    'complexity_hints': ['async', 'error_handling', 'nested_loops']
                },
                'user_preferences': {
                    'persona': 'performance',
                    'detail_level': 'comprehensive'
                }
            },
            'post_prompt.py': {
                'response': 'The function has several performance issues including unnecessary async operations and inefficient loops. Consider refactoring to use more efficient algorithms.',
                'optimization_hints': {
                    'compress': True,
                    'focus_on': 'actionable_recommendations',
                    'user_expertise': 'senior'
                },
                'quality_requirements': {
                    'thresholds': {
                        'completeness': 0.8,
                        'actionability': 0.7
                    }
                }
            },
            'stop.py': {
                'sessionId': 'benchmark-session-001',
                'performance': {
                    'total_tools_used': 25,
                    'total_execution_time': 15.5,
                    'cache_hits': 8,
                    'errors': 0,
                    'mcp_servers_used': ['sequential', 'context7', 'magic']
                },
                'cleanup': {
                    'temp_files': ['/tmp/file1.tmp', '/tmp/file2.tmp'],
                    'cache_entries': 12,
                    'memory_freed': '45MB'
                }
            },
            'subagent_stop.py': {
                'agentId': 'benchmark-agent-001',
                'parentId': 'main-session-001',
                'task': {
                    'type': 'quality_analysis',
                    'scope': 'project',
                    'status': 'completed',
                    'files_processed': 15
                },
                'results': {
                    'issues_found': 8,
                    'overall_score': 0.85,
                    'execution_time': 12.3
                },
                'coordination': {
                    'dependencies_resolved': True,
                    'parent_notified': False
                }
            },
            'precompact.py': {
                'context': {
                    'total_tokens': 15000,
                    'critical_sections': ['recent_analysis', 'user_preferences', 'session_state'],
                    'preservationStrategy': 'selective',
                    'optimization_opportunities': [
                        'compress_historical_data',
                        'summarize_completed_tasks',
                        'archive_old_contexts'
                    ]
                },
                'compaction_trigger': 'token_limit_approaching',
                'target_reduction': '40%'
            }
        }
        
        benchmark_results = {}
        
        for hook_script, test_data in test_data_sets.items():
            script_path = self.hooks_dir / hook_script
            
            if script_path.exists():
                try:
                    metrics = self.benchmark_hook(hook_script, test_data, iterations)
                    benchmark_results[hook_script] = metrics
                    
                    print(f"  ✅ {hook_script}:")
                    print(f"    Avg: {metrics.avg_execution_time:.3f}s")
                    print(f"    P95: {metrics.p95_execution_time:.3f}s")
                    print(f"    Success Rate: {metrics.success_rate:.1%}")
                    print(f"    Optimization: {metrics.optimization_effectiveness:.2f}x")
                    print(f"    Throughput: {metrics.throughput_per_second:.1f} ops/sec")
                    
                except Exception as e:
                    print(f"  ❌ {hook_script} failed: {e}")
            else:
                print(f"  ⚠️ {hook_script} not found")
        
        return benchmark_results
    
    def test_intelligent_activation(self, iterations: int = 50) -> Dict[str, Any]:
        """Test intelligent activation optimization"""
        print(f"\n🎯 Testing intelligent activation ({iterations} iterations)...")
        
        # Test cases for different tool types
        test_cases = [
            # MCP tools (should trigger full processing)
            {
                'name': 'mcp_sequential',
                'tool_name': 'mcp__sequential__sequentialthinking',
                'tool_args': {'thought': 'Complex analysis', 'thoughtNumber': 1},
                'expected_processing': 'full'
            },
            {
                'name': 'mcp_context7',
                'tool_name': 'mcp__context7__get-library-docs',
                'tool_args': {'context7CompatibleLibraryID': '/react/react'},
                'expected_processing': 'full'
            },
            {
                'name': 'mcp_magic',
                'tool_name': 'mcp__magic__21st_magic_component_builder',
                'tool_args': {'message': 'Create button', 'searchQuery': 'button'},
                'expected_processing': 'full'
            },
            
            # Simple tools (should use fast path)
            {
                'name': 'read_file',
                'tool_name': 'Read',
                'tool_args': {'file_path': '/test/file.txt'},
                'expected_processing': 'fast'
            },
            {
                'name': 'write_file',
                'tool_name': 'Write',
                'tool_args': {'file_path': '/test/output.txt', 'content': 'test'},
                'expected_processing': 'fast'
            },
            {
                'name': 'grep_search',
                'tool_name': 'Grep',
                'tool_args': {'pattern': 'function', 'path': '/test'},
                'expected_processing': 'fast'
            }
        ]
        
        activation_results = {}
        
        for test_case in test_cases:
            print(f"  Testing {test_case['name']}...")
            
            execution_times = []
            
            for _ in range(iterations):
                start_time = time.time()
                
                try:
                    result = subprocess.run(
                        ["python3", str(self.hooks_dir / "pre_tool_use.py")],
                        input=json.dumps({
                            'tool_name': test_case['tool_name'],
                            'tool_args': test_case['tool_args']
                        }),
                        text=True,
                        capture_output=True,
                        timeout=1
                    )
                    
                    execution_time = time.time() - start_time
                    execution_times.append(execution_time)
                    
                except Exception:
                    execution_times.append(0.5)  # Default time for errors
            
            if execution_times:
                avg_time = statistics.mean(execution_times)
                min_time = min(execution_times)
                max_time = max(execution_times)
                
                # Determine if optimization is working
                expected_fast = test_case['expected_processing'] == 'fast'
                is_optimized = avg_time < 0.1 if expected_fast else avg_time >= 0.05
                
                activation_results[test_case['name']] = {
                    'tool_name': test_case['tool_name'],
                    'expected_processing': test_case['expected_processing'],
                    'avg_execution_time': avg_time,
                    'min_execution_time': min_time,
                    'max_execution_time': max_time,
                    'is_optimized': is_optimized,
                    'optimization_effective': is_optimized
                }
                
                status = "🚀" if is_optimized else "⚠️"
                print(f"    {status} {test_case['expected_processing']} path: {avg_time:.3f}s")
        
        # Calculate overall activation effectiveness
        mcp_tools = [r for name, r in activation_results.items() if 'mcp_' in name]
        simple_tools = [r for name, r in activation_results.items() if 'mcp_' not in name]
        
        mcp_avg_time = statistics.mean([r['avg_execution_time'] for r in mcp_tools]) if mcp_tools else 0
        simple_avg_time = statistics.mean([r['avg_execution_time'] for r in simple_tools]) if simple_tools else 0
        
        optimization_ratio = mcp_avg_time / simple_avg_time if simple_avg_time > 0 else 1
        fast_path_effectiveness = sum(1 for r in simple_tools if r['is_optimized']) / len(simple_tools) if simple_tools else 0
        
        summary = {
            'tool_results': activation_results,
            'summary_metrics': {
                'mcp_tools_avg_time': mcp_avg_time,
                'simple_tools_avg_time': simple_avg_time,
                'optimization_ratio': optimization_ratio,
                'fast_path_effectiveness': fast_path_effectiveness,
                'total_tools_tested': len(test_cases),
                'optimization_working': optimization_ratio > 2.0 and fast_path_effectiveness > 0.8
            }
        }
        
        print(f"  📊 MCP tools avg: {mcp_avg_time:.3f}s")
        print(f"  📊 Simple tools avg: {simple_avg_time:.3f}s")
        print(f"  📊 Optimization ratio: {optimization_ratio:.2f}x")
        print(f"  📊 Fast path effectiveness: {fast_path_effectiveness:.1%}")
        
        return summary
    
    def generate_performance_report(self, benchmark_results: Dict[str, BenchmarkMetrics], activation_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        
        # Calculate overall statistics
        all_metrics = list(benchmark_results.values())
        
        if all_metrics:
            overall_avg_time = statistics.mean([m.avg_execution_time for m in all_metrics])
            overall_success_rate = statistics.mean([m.success_rate for m in all_metrics])
            overall_optimization = statistics.mean([m.optimization_effectiveness for m in all_metrics])
            total_throughput = sum([m.throughput_per_second for m in all_metrics])
        else:
            overall_avg_time = 0
            overall_success_rate = 0
            overall_optimization = 1
            total_throughput = 0
        
        report = {
            'benchmark_timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'summary': {
                'hooks_benchmarked': len(benchmark_results),
                'overall_avg_execution_time': overall_avg_time,
                'overall_success_rate': overall_success_rate,
                'overall_optimization_factor': overall_optimization,
                'total_throughput': total_throughput,
                'intelligent_activation_working': activation_results.get('summary_metrics', {}).get('optimization_working', False)
            },
            'detailed_benchmarks': {
                hook_name: {
                    'total_runs': metrics.total_runs,
                    'success_rate': metrics.success_rate,
                    'avg_execution_time': metrics.avg_execution_time,
                    'p95_execution_time': metrics.p95_execution_time,
                    'p99_execution_time': metrics.p99_execution_time,
                    'throughput_per_second': metrics.throughput_per_second,
                    'optimization_effectiveness': metrics.optimization_effectiveness
                }
                for hook_name, metrics in benchmark_results.items()
            },
            'intelligent_activation': activation_results,
            'performance_analysis': {
                'fastest_hook': min(all_metrics, key=lambda m: m.avg_execution_time).hook_name if all_metrics else None,
                'most_optimized_hook': max(all_metrics, key=lambda m: m.optimization_effectiveness).hook_name if all_metrics else None,
                'highest_throughput_hook': max(all_metrics, key=lambda m: m.throughput_per_second).hook_name if all_metrics else None,
                'performance_targets_met': {
                    'avg_execution_time_under_100ms': overall_avg_time < 0.1,
                    'success_rate_above_95_percent': overall_success_rate > 0.95,
                    'optimization_factor_above_2x': overall_optimization > 2.0
                }
            }
        }
        
        return report

def main():
    """Main benchmark execution"""
    print("⚡ SuperClaude Hook Performance Benchmark")
    print("=" * 50)
    
    benchmark = PerformanceBenchmark()
    
    try:
        # Run comprehensive benchmarks
        print("🔥 Phase 1: Hook Performance Benchmarks")
        benchmark_results = benchmark.benchmark_all_hooks(iterations=100)
        
        # Test intelligent activation
        print("\n🎯 Phase 2: Intelligent Activation Tests")
        activation_results = benchmark.test_intelligent_activation(iterations=50)
        
        # Generate report
        print("\n📊 Generating Performance Report...")
        report = benchmark.generate_performance_report(benchmark_results, activation_results)
        
        # Save report
        report_file = Path(__file__).parent / "performance_benchmark_report.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"📊 Performance report saved: {report_file}")
        
        # Print summary
        print("\n" + "=" * 50)
        print("🎯 PERFORMANCE SUMMARY")
        print("=" * 50)
        
        summary = report['summary']
        print(f"Hooks Benchmarked: {summary['hooks_benchmarked']}")
        print(f"Overall Avg Execution Time: {summary['overall_avg_execution_time']:.3f}s")
        print(f"Overall Success Rate: {summary['overall_success_rate']:.1%}")
        print(f"Overall Optimization Factor: {summary['overall_optimization_factor']:.2f}x")
        print(f"Total Throughput: {summary['total_throughput']:.1f} ops/sec")
        print(f"Intelligent Activation: {'✅ Working' if summary['intelligent_activation_working'] else '❌ Issues'}")
        
        # Performance targets
        targets = report['performance_analysis']['performance_targets_met']
        print(f"\nPerformance Targets:")
        print(f"  Avg Time <100ms: {'✅' if targets['avg_execution_time_under_100ms'] else '❌'}")
        print(f"  Success Rate >95%: {'✅' if targets['success_rate_above_95_percent'] else '❌'}")
        print(f"  Optimization >2x: {'✅' if targets['optimization_factor_above_2x'] else '❌'}")
        
        # Best performers
        analysis = report['performance_analysis']
        if analysis['fastest_hook']:
            print(f"\nBest Performers:")
            print(f"  Fastest: {analysis['fastest_hook']}")
            print(f"  Most Optimized: {analysis['most_optimized_hook']}")
            print(f"  Highest Throughput: {analysis['highest_throughput_hook']}")
        
        print("\n🎉 Performance benchmark completed!")
        return 0
        
    except Exception as e:
        print(f"\n❌ Benchmark failed: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())