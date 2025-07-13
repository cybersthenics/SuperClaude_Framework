#!/usr/bin/env python3
"""
SuperClaude Stop Hook
Executes when main agent finishes - handles session cleanup and performance reporting
"""

import json
import sys
import os
import requests
from typing import Dict, Any, Optional
import logging
from datetime import datetime
import time

# Import performance optimizer
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from performance_optimizer import (
    timed_operation, get_performance_report, monitor
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
logger = logging.getLogger('stop_hook')

class StopHook:
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('HOOK_TIMEOUT_MS', '500')) / 1000  # Extended for cleanup
        
    def extract_session_context(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract session context for cleanup and reporting"""
        session_id = input_data.get('sessionId', os.environ.get('CLAUDE_SESSION_ID', 'default'))
        
        # Get performance metrics from the session
        perf_report = get_performance_report()
        
        # Extract relevant context
        context = {
            'sessionId': session_id,
            'timestamp': datetime.now().isoformat(),
            'executionId': f"stop_{datetime.now().timestamp()}_{os.getpid()}",
            'performance': perf_report,
            'environment': {
                'workingDirectory': os.getcwd(),
                'platform': sys.platform,
                'pythonVersion': sys.version.split()[0],
                'gitRepo': os.path.exists('.git'),
            },
            'cleanup': {
                'tempFiles': self.identify_temp_files(),
                'openConnections': self.check_open_connections(),
                'memoryUsage': self.get_memory_usage(),
            }
        }
        
        return context
    
    def identify_temp_files(self) -> list:
        """Identify temporary files created during session"""
        temp_patterns = [
            '/tmp/claude_*',
            '/tmp/superclaude_*',
            '*.tmp',
            '.cache/*'
        ]
        
        temp_files = []
        import glob
        
        for pattern in temp_patterns:
            try:
                matches = glob.glob(pattern, recursive=True)
                temp_files.extend(matches)
            except Exception:
                pass
                
        return temp_files[:10]  # Limit for performance
    
    def check_open_connections(self) -> Dict[str, Any]:
        """Check for open network connections"""
        try:
            import psutil
            proc = psutil.Process(os.getpid())
            connections = len(proc.connections())
            return {
                'count': connections,
                'hasOpenConnections': connections > 0
            }
        except ImportError:
            return {'count': 0, 'hasOpenConnections': False, 'note': 'psutil not available'}
        except Exception as e:
            return {'count': 0, 'hasOpenConnections': False, 'error': str(e)}
    
    def get_memory_usage(self) -> Dict[str, Any]:
        """Get current memory usage"""
        try:
            import psutil
            proc = psutil.Process(os.getpid())
            memory_info = proc.memory_info()
            return {
                'rss': memory_info.rss,
                'vms': memory_info.vms,
                'rss_mb': round(memory_info.rss / 1024 / 1024, 2),
                'vms_mb': round(memory_info.vms / 1024 / 1024, 2)
            }
        except ImportError:
            return {'rss_mb': 0, 'vms_mb': 0, 'note': 'psutil not available'}
        except Exception as e:
            return {'rss_mb': 0, 'vms_mb': 0, 'error': str(e)}
    
    @timed_operation("session_cleanup")
    def perform_session_cleanup(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Perform session cleanup tasks"""
        cleanup_results = {
            'tempFilesRemoved': 0,
            'connectionsCloseed': 0,
            'cacheCleared': False,
            'errors': []
        }
        
        try:
            # Clean temporary files (be conservative)
            temp_files = context.get('cleanup', {}).get('tempFiles', [])
            for temp_file in temp_files:
                if temp_file.startswith('/tmp/claude_') or temp_file.startswith('/tmp/superclaude_'):
                    try:
                        if os.path.exists(temp_file):
                            os.remove(temp_file)
                            cleanup_results['tempFilesRemoved'] += 1
                    except Exception as e:
                        cleanup_results['errors'].append(f"Failed to remove {temp_file}: {e}")
            
            # Clear performance monitor cache
            try:
                from performance_optimizer import cache
                if hasattr(cache, 'clear'):
                    cache.clear()
                    cleanup_results['cacheCleared'] = True
            except Exception as e:
                cleanup_results['errors'].append(f"Cache clear failed: {e}")
                
        except Exception as e:
            cleanup_results['errors'].append(f"General cleanup error: {e}")
            
        return cleanup_results
    
    @timed_operation("stop_bridge_notification")
    def notify_bridge_session_end(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Notify bridge service of session end"""
        try:
            start_time = time.perf_counter()
            response = requests.post(
                f'{self.bridge_url}/session-stop',
                json=context,
                timeout=self.timeout
            )
            
            request_time = (time.perf_counter() - start_time) * 1000
            monitor.record_timing("stop_bridge_request", request_time)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Bridge notified of session end: {context['sessionId']}")
                return result
            else:
                logger.warning(f"Bridge notification failed with status {response.status_code}")
                return self.create_fallback_response(context)
                
        except requests.Timeout:
            logger.warning("Bridge notification timeout during session stop")
            return self.create_fallback_response(context)
            
        except Exception as e:
            logger.error(f"Bridge notification error during session stop: {e}")
            return self.create_fallback_response(context)
    
    def create_fallback_response(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback response when bridge is unavailable"""
        return {
            'sessionEnded': True,
            'fallback': True,
            'reason': 'Bridge service unavailable during session stop',
            'localCleanup': True,
            'sessionId': context['sessionId']
        }
    
    def generate_session_report(self, context: Dict[str, Any], cleanup_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate comprehensive session report"""
        perf_data = context.get('performance', {})
        
        report = {
            'sessionSummary': {
                'sessionId': context['sessionId'],
                'duration': perf_data.get('session_duration', 'unknown'),
                'totalOperations': sum(len(ops) for ops in perf_data.get('operation_timings', {}).values()),
                'averageOperationTime': perf_data.get('average_operation_time', 0),
                'peakMemoryUsage': context.get('cleanup', {}).get('memoryUsage', {}).get('rss_mb', 0)
            },
            'performanceMetrics': perf_data,
            'cleanupResults': cleanup_results,
            'recommendations': self.generate_recommendations(perf_data, cleanup_results)
        }
        
        return report
    
    def generate_recommendations(self, perf_data: Dict[str, Any], cleanup_results: Dict[str, Any]) -> list:
        """Generate performance and optimization recommendations"""
        recommendations = []
        
        # Performance recommendations
        avg_time = perf_data.get('average_operation_time', 0)
        if avg_time > 100:
            recommendations.append({
                'type': 'performance',
                'message': f'Average operation time ({avg_time:.1f}ms) exceeds target (50ms)',
                'suggestion': 'Consider enabling caching or optimizing hook matchers'
            })
        
        # Cleanup recommendations
        if cleanup_results.get('tempFilesRemoved', 0) > 5:
            recommendations.append({
                'type': 'cleanup',
                'message': f'High temporary file count ({cleanup_results["tempFilesRemoved"]})',
                'suggestion': 'Consider implementing automatic cleanup during session'
            })
        
        # Error recommendations
        if cleanup_results.get('errors'):
            recommendations.append({
                'type': 'error',
                'message': f'{len(cleanup_results["errors"])} cleanup errors occurred',
                'suggestion': 'Review error logs and fix permission or file access issues'
            })
        
        return recommendations
    
    def format_output(self, context: Dict[str, Any], report: Dict[str, Any]) -> Dict[str, Any]:
        """Format output for Claude Code"""
        return {
            'sessionEnded': True,
            'sessionId': context['sessionId'],
            'report': report,
            'timestamp': context['timestamp'],
            '_performance': {
                'hookDuration': report.get('hookExecutionTime', 0),
                'cleanupCompleted': True
            }
        }

@timed_operation("stop_main_execution")
def main():
    """Main entry point for Stop hook"""
    hook_start = time.perf_counter()
    
    try:
        # Read input from stdin (may be empty for Stop hook)
        input_text = sys.stdin.read().strip()
        input_data = json.loads(input_text) if input_text else {}
        
        # Initialize hook
        hook = StopHook()
        
        # Extract session context
        context = hook.extract_session_context(input_data)
        
        logger.info(f"Stop hook invoked for session {context['sessionId']}")
        
        # Perform session cleanup
        cleanup_results = hook.perform_session_cleanup(context)
        
        # Notify bridge service
        bridge_response = hook.notify_bridge_session_end(context)
        
        # Generate session report
        session_report = hook.generate_session_report(context, cleanup_results)
        session_report['bridgeResponse'] = bridge_response
        session_report['hookExecutionTime'] = (time.perf_counter() - hook_start) * 1000
        
        # Format output
        output = hook.format_output(context, session_report)
        
        # Log session summary
        logger.info(f"Session {context['sessionId']} ended. "
                   f"Operations: {session_report['sessionSummary']['totalOperations']}, "
                   f"Cleanup: {cleanup_results['tempFilesRemoved']} files removed")
        
        # Write output to stdout
        print(json.dumps(output))
        
        return 0
        
    except Exception as e:
        logger.error(f"Stop hook error: {e}", exc_info=True)
        
        # On error, still indicate session ended
        error_output = {
            'sessionEnded': True,
            'error': str(e),
            'fallback': True,
            'timestamp': datetime.now().isoformat()
        }
        print(json.dumps(error_output))
        return 0

if __name__ == '__main__':
    sys.exit(main())