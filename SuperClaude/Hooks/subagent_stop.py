#!/usr/bin/env python3
"""
SuperClaude SubagentStop Hook
Executes when subagent completes - handles task coordination and delegation cleanup
"""

import json
import sys
import os
import requests
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime
import time

# Import performance optimizer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from performance_optimizer import (
    timed_operation, cached_operation, monitor
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/anton/SuperClaude_MCP/logs/hooks.log'),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger('subagent_stop_hook')

class SubagentStopHook:
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('HOOK_TIMEOUT_MS', '200')) / 1000
        
    def extract_subagent_context(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract subagent context for coordination and cleanup"""
        
        # Extract subagent information
        subagent_info = input_data.get('subagent', {})
        task_info = input_data.get('task', {})
        
        context = {
            'subagentId': subagent_info.get('id', f"subagent_{datetime.now().timestamp()}"),
            'parentSessionId': input_data.get('sessionId', os.environ.get('CLAUDE_SESSION_ID', 'default')),
            'taskId': task_info.get('id', 'unknown'),
            'timestamp': datetime.now().isoformat(),
            'executionId': f"subagent_stop_{datetime.now().timestamp()}_{os.getpid()}",
            'subagent': {
                'type': subagent_info.get('type', 'generic'),
                'scope': subagent_info.get('scope', 'unknown'),
                'startTime': subagent_info.get('startTime'),
                'endTime': datetime.now().isoformat(),
                'delegationStrategy': subagent_info.get('delegationStrategy', 'auto'),
                'specialization': subagent_info.get('specialization', 'general')
            },
            'task': {
                'id': task_info.get('id'),
                'description': task_info.get('description', ''),
                'status': task_info.get('status', 'completed'),
                'priority': task_info.get('priority', 'medium'),
                'complexity': task_info.get('complexity', 'moderate'),
                'domain': task_info.get('domain', 'general'),
                'results': task_info.get('results', {})
            },
            'coordination': {
                'parallelSubagents': self.detect_parallel_subagents(),
                'dependentTasks': self.identify_dependent_tasks(task_info),
                'resourceUsage': self.assess_resource_usage(),
                'aggregationNeeded': self.check_aggregation_requirements(task_info)
            }
        }
        
        return context
    
    def detect_parallel_subagents(self) -> List[Dict[str, Any]]:
        """Detect other parallel subagents that might be running"""
        try:
            # Check for other Python processes that might be subagents
            import psutil
            current_pid = os.getpid()
            parallel_agents = []
            
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if proc.info['pid'] != current_pid and proc.info['name'] == 'python3':
                        cmdline = proc.info['cmdline'] or []
                        if any('subagent' in arg.lower() or 'task' in arg.lower() for arg in cmdline):
                            parallel_agents.append({
                                'pid': proc.info['pid'],
                                'cmdline': ' '.join(cmdline[-2:])  # Last 2 args for brevity
                            })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
                    
            return parallel_agents[:5]  # Limit for performance
            
        except ImportError:
            return []
        except Exception as e:
            logger.warning(f"Failed to detect parallel subagents: {e}")
            return []
    
    def identify_dependent_tasks(self, task_info: Dict[str, Any]) -> List[str]:
        """Identify tasks that depend on this subagent's completion"""
        dependent_tasks = []
        
        # Look for dependency hints in task description or results
        task_desc = task_info.get('description', '').lower()
        task_id = task_info.get('id', '')
        
        # Common dependency patterns
        if 'prerequisite' in task_desc or 'dependency' in task_desc:
            dependent_tasks.append('dependent_task_detected')
        
        if task_info.get('domain') in ['architecture', 'security', 'performance']:
            dependent_tasks.append('cross_domain_dependency')
            
        if 'shared' in task_desc or 'common' in task_desc:
            dependent_tasks.append('shared_resource_dependency')
            
        return dependent_tasks
    
    def assess_resource_usage(self) -> Dict[str, Any]:
        """Assess resource usage of this subagent"""
        try:
            import psutil
            proc = psutil.Process(os.getpid())
            
            return {
                'cpu_percent': proc.cpu_percent(),
                'memory_mb': round(proc.memory_info().rss / 1024 / 1024, 2),
                'execution_time': time.time() - proc.create_time(),
                'open_files': len(proc.open_files()),
                'connections': len(proc.connections())
            }
        except ImportError:
            return {'note': 'psutil not available'}
        except Exception as e:
            return {'error': str(e)}
    
    def check_aggregation_requirements(self, task_info: Dict[str, Any]) -> Dict[str, Any]:
        """Check if this subagent's results need aggregation with others"""
        results = task_info.get('results', {})
        task_type = task_info.get('type', '')
        
        aggregation_info = {
            'required': False,
            'type': 'none',
            'waitForOthers': False,
            'aggregationKey': None
        }
        
        # Determine if aggregation is needed
        if task_type in ['analysis', 'scan', 'review']:
            aggregation_info.update({
                'required': True,
                'type': 'results_merge',
                'aggregationKey': f"{task_type}_results"
            })
        
        if 'files' in results or 'directories' in results:
            aggregation_info.update({
                'required': True,
                'type': 'file_results',
                'aggregationKey': 'file_operations'
            })
        
        if task_info.get('domain') in ['quality', 'performance', 'security']:
            aggregation_info.update({
                'required': True,
                'type': 'domain_analysis',
                'waitForOthers': True,
                'aggregationKey': f"{task_info['domain']}_analysis"
            })
        
        return aggregation_info
    
    @timed_operation("subagent_coordination")
    def coordinate_with_parent(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Coordinate subagent completion with parent agent"""
        coordination_results = {
            'parentNotified': False,
            'resultsAggregated': False,
            'dependenciesResolved': False,
            'errors': []
        }
        
        try:
            # Notify parent session of subagent completion
            parent_notification = {
                'event': 'subagent_completed',
                'subagentId': context['subagentId'],
                'parentSessionId': context['parentSessionId'],
                'taskResults': context['task']['results'],
                'coordination': context['coordination']
            }
            
            # Send to bridge for parent coordination
            response = requests.post(
                f'{self.bridge_url}/subagent-completed',
                json=parent_notification,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                bridge_response = response.json()
                coordination_results['parentNotified'] = True
                coordination_results['resultsAggregated'] = bridge_response.get('aggregated', False)
                coordination_results['dependenciesResolved'] = bridge_response.get('dependenciesResolved', False)
            else:
                coordination_results['errors'].append(f"Bridge coordination failed: {response.status_code}")
                
        except requests.Timeout:
            coordination_results['errors'].append("Bridge coordination timeout")
        except Exception as e:
            coordination_results['errors'].append(f"Coordination error: {e}")
            
        return coordination_results
    
    @timed_operation("subagent_cleanup")
    def perform_subagent_cleanup(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Perform subagent-specific cleanup"""
        cleanup_results = {
            'tempResourcesReleased': 0,
            'cacheEntriesCleared': 0,
            'connectionsCloseed': 0,
            'errors': []
        }
        
        try:
            # Clean up temporary resources specific to this subagent
            subagent_id = context['subagentId']
            temp_pattern = f"/tmp/subagent_{subagent_id}_*"
            
            import glob
            temp_files = glob.glob(temp_pattern)
            for temp_file in temp_files:
                try:
                    if os.path.exists(temp_file):
                        os.remove(temp_file)
                        cleanup_results['tempResourcesReleased'] += 1
                except Exception as e:
                    cleanup_results['errors'].append(f"Failed to remove {temp_file}: {e}")
            
            # Clear subagent-specific cache entries
            try:
                from performance_optimizer import cache
                if hasattr(cache, 'clear_pattern'):
                    cleared = cache.clear_pattern(f"subagent_{subagent_id}_*")
                    cleanup_results['cacheEntriesCleared'] = cleared
            except Exception as e:
                cleanup_results['errors'].append(f"Cache cleanup failed: {e}")
                
        except Exception as e:
            cleanup_results['errors'].append(f"General subagent cleanup error: {e}")
            
        return cleanup_results
    
    def generate_subagent_report(self, context: Dict[str, Any], coordination: Dict[str, Any], cleanup: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive subagent completion report"""
        
        # Calculate execution duration
        start_time = context['subagent'].get('startTime')
        end_time = context['subagent']['endTime']
        duration = 'unknown'
        
        if start_time:
            try:
                start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
                end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
                duration = (end_dt - start_dt).total_seconds()
            except Exception:
                duration = 'parse_error'
        
        report = {
            'subagentSummary': {
                'subagentId': context['subagentId'],
                'taskId': context['taskId'],
                'type': context['subagent']['type'],
                'specialization': context['subagent']['specialization'],
                'duration': duration,
                'status': context['task']['status'],
                'domain': context['task']['domain']
            },
            'taskResults': context['task']['results'],
            'coordination': {
                'parallelAgents': len(context['coordination']['parallelSubagents']),
                'dependentTasks': context['coordination']['dependentTasks'],
                'aggregationNeeded': context['coordination']['aggregationNeeded'],
                'coordinationResults': coordination
            },
            'resourceUsage': context['coordination']['resourceUsage'],
            'cleanup': cleanup,
            'recommendations': self.generate_subagent_recommendations(context, coordination, cleanup)
        }
        
        return report
    
    def generate_subagent_recommendations(self, context: Dict[str, Any], coordination: Dict[str, Any], cleanup: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recommendations for subagent optimization"""
        recommendations = []
        
        # Coordination recommendations
        if not coordination.get('parentNotified', False):
            recommendations.append({
                'type': 'coordination',
                'message': 'Parent notification failed',
                'suggestion': 'Check bridge service connectivity and retry mechanism'
            })
        
        # Resource usage recommendations
        resource_usage = context['coordination']['resourceUsage']
        memory_mb = resource_usage.get('memory_mb', 0)
        if memory_mb > 500:
            recommendations.append({
                'type': 'performance',
                'message': f'High memory usage ({memory_mb}MB)',
                'suggestion': 'Consider optimizing subagent memory footprint'
            })
        
        # Cleanup recommendations
        if cleanup.get('errors'):
            recommendations.append({
                'type': 'cleanup',
                'message': f'{len(cleanup["errors"])} cleanup errors',
                'suggestion': 'Review subagent cleanup procedures and permissions'
            })
        
        # Aggregation recommendations
        if context['coordination']['aggregationNeeded']['required']:
            recommendations.append({
                'type': 'aggregation',
                'message': 'Results require aggregation with other subagents',
                'suggestion': 'Ensure parent agent has aggregation logic for this task type'
            })
        
        return recommendations
    
    def format_output(self, context: Dict[str, Any], report: Dict[str, Any]) -> Dict[str, Any]:
        """Format output for Claude Code"""
        return {
            'subagentCompleted': True,
            'subagentId': context['subagentId'],
            'parentSessionId': context['parentSessionId'],
            'taskId': context['taskId'],
            'report': report,
            'timestamp': context['timestamp'],
            '_performance': {
                'hookDuration': report.get('hookExecutionTime', 0),
                'coordinationCompleted': report['coordination']['coordinationResults'].get('parentNotified', False)
            }
        }

@timed_operation("subagent_stop_main_execution")
def main():
    """Main entry point for SubagentStop hook"""
    hook_start = time.perf_counter()
    
    try:
        # Read input from stdin
        input_text = sys.stdin.read().strip()
        input_data = json.loads(input_text) if input_text else {}
        
        # Initialize hook
        hook = SubagentStopHook()
        
        # Extract subagent context
        context = hook.extract_subagent_context(input_data)
        
        logger.info(f"SubagentStop hook invoked for subagent {context['subagentId']} "
                   f"(task: {context['taskId']})")
        
        # Coordinate with parent agent
        coordination_results = hook.coordinate_with_parent(context)
        
        # Perform subagent cleanup
        cleanup_results = hook.perform_subagent_cleanup(context)
        
        # Generate subagent report
        subagent_report = hook.generate_subagent_report(context, coordination_results, cleanup_results)
        subagent_report['hookExecutionTime'] = (time.perf_counter() - hook_start) * 1000
        
        # Format output
        output = hook.format_output(context, subagent_report)
        
        # Log subagent completion summary
        logger.info(f"Subagent {context['subagentId']} completed. "
                   f"Status: {context['task']['status']}, "
                   f"Domain: {context['task']['domain']}, "
                   f"Parent notified: {coordination_results.get('parentNotified', False)}")
        
        # Write output to stdout
        print(json.dumps(output))
        
        return 0
        
    except Exception as e:
        logger.error(f"SubagentStop hook error: {e}", exc_info=True)
        
        # On error, still indicate subagent completed
        error_output = {
            'subagentCompleted': True,
            'error': str(e),
            'fallback': True,
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_output))
        return 0

if __name__ == '__main__':
    sys.exit(main())