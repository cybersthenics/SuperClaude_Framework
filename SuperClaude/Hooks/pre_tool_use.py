#!/usr/bin/env python3
"""
SuperClaude Pre-Tool Use Hook
Intercepts tool calls before execution for routing and validation
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
    timed_operation, cached_operation, generate_cache_key,
    optimize_mcp_routing, should_use_cache, monitor
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
logger = logging.getLogger('pre_tool_use')

class PreToolUseHook:
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('HOOK_TIMEOUT_MS', '100')) / 1000  # Convert to seconds
        self.enable_smart_routing = os.environ.get('ENABLE_SMART_ROUTING', 'true').lower() == 'true'
        self.enable_selective_activation = os.environ.get('ENABLE_SELECTIVE_ACTIVATION', 'true').lower() == 'true'
        
        # Load hook configuration for intelligent activation
        self.hook_config = self.load_hook_config()
        
    def load_hook_config(self) -> Dict[str, Any]:
        """Load hook configuration for intelligent processing"""
        try:
            config_path = os.path.join(os.path.dirname(__file__), 'config.json')
            with open(config_path, 'r') as f:
                config = json.load(f)
            return config.get('settings', {})
        except Exception as e:
            logger.warning(f"Failed to load hook config: {e}")
            return {}
    
    def determine_processing_level(self, tool_name: str, tool_args: Dict[str, Any]) -> str:
        """Determine the level of processing needed based on tool type and matcher patterns"""
        if not self.enable_selective_activation:
            return 'full'
        
        # MCP tools need high-priority processing
        if tool_name.startswith('mcp__'):
            return 'high'
        
        # File operations need medium processing
        if tool_name in ['Read', 'Write', 'Edit', 'MultiEdit', 'Grep', 'Glob']:
            return 'medium'
        
        # Task coordination tools need medium processing
        if tool_name in ['Task', 'TodoWrite', 'Bash']:
            return 'medium'
        
        # Simple tools can use minimal processing
        if tool_name in ['LS', 'WebSearch', 'WebFetch']:
            return 'minimal'
        
        return 'standard'
    
    def should_skip_bridge_routing(self, tool_name: str, processing_level: str) -> bool:
        """Determine if bridge routing can be skipped for performance"""
        if not self.enable_smart_routing:
            return False
            
        # Skip bridge for minimal processing of simple tools
        if processing_level == 'minimal' and tool_name in ['LS']:
            return True
            
        # Skip bridge for read-only operations that don't need MCP routing
        if processing_level == 'medium' and tool_name in ['Read', 'Grep', 'Glob'] and not self.needs_mcp_analysis(tool_name):
            return True
            
        return False
    
    def needs_mcp_analysis(self, tool_name: str) -> bool:
        """Check if tool operation needs MCP server analysis"""
        # Tools that benefit from MCP server analysis
        mcp_beneficial_tools = [
            'mcp__sequential', 'mcp__context7', 'mcp__magic', 'mcp__playwright',
            'Task', 'TodoWrite', 'MultiEdit'
        ]
        
        return any(tool in tool_name for tool in mcp_beneficial_tools)
        
    def extract_context(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract context from Claude Code input"""
        tool_name = input_data.get('tool', '')
        tool_args = input_data.get('args', {})
        
        # Extract context from environment or input
        context = input_data.get('context', {})
        
        # Parse flags from context or environment
        flags = context.get('flags', [])
        if 'CLAUDE_FLAGS' in os.environ:
            flags.extend(os.environ['CLAUDE_FLAGS'].split(','))
        
        # Detect persona from context
        persona = context.get('persona')
        if not persona:
            # Auto-detect based on tool and args
            persona = self.detect_persona(tool_name, tool_args)
        
        # Detect complexity
        complexity = context.get('complexity', self.assess_complexity(tool_name, tool_args))
        
        return {
            'toolName': tool_name,
            'toolArgs': tool_args,
            'sessionId': context.get('sessionId', os.environ.get('CLAUDE_SESSION_ID', 'default')),
            'executionId': f"exec_{datetime.now().timestamp()}_{os.getpid()}",
            'persona': persona,
            'complexity': complexity,
            'flags': flags,
            'environment': {
                'workingDirectory': os.getcwd(),
                'platform': sys.platform,
                'pythonVersion': sys.version.split()[0],
                'gitRepo': os.path.exists('.git'),
            }
        }
    
    def detect_persona(self, tool_name: str, tool_args: Dict[str, Any]) -> Optional[str]:
        """Auto-detect persona based on tool and arguments"""
        tool_lower = tool_name.lower()
        args_str = json.dumps(tool_args).lower()
        
        # Frontend indicators
        if any(keyword in tool_lower + args_str for keyword in ['component', 'ui', 'react', 'vue', 'css']):
            return 'frontend'
        
        # Backend indicators
        if any(keyword in tool_lower + args_str for keyword in ['api', 'database', 'server', 'endpoint']):
            return 'backend'
        
        # Security indicators
        if any(keyword in tool_lower + args_str for keyword in ['security', 'vulnerability', 'auth']):
            return 'security'
        
        # Architecture indicators
        if any(keyword in tool_lower + args_str for keyword in ['architecture', 'design', 'system']):
            return 'architect'
        
        # Analysis indicators
        if any(keyword in tool_lower + args_str for keyword in ['analyze', 'investigate', 'debug']):
            return 'analyzer'
        
        return None
    
    def assess_complexity(self, tool_name: str, tool_args: Dict[str, Any]) -> str:
        """Assess operation complexity"""
        # Simple heuristics for complexity assessment
        if tool_name in ['Read', 'Write'] and len(tool_args) == 1:
            return 'simple'
        
        if tool_name in ['Grep', 'Glob'] or 'search' in str(tool_args):
            return 'moderate'
        
        if tool_name in ['MultiEdit', 'Task'] or len(tool_args) > 3:
            return 'complex'
        
        return 'moderate'
    
    @timed_operation("route_to_bridge")
    def route_to_bridge(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Send request to bridge-hooks service with performance optimization"""
        
        # Check if we should use cache for this operation
        if should_use_cache(context['toolName']):
            cache_key = generate_cache_key("bridge_route", {
                "tool": context['toolName'],
                "args": context['toolArgs'],
                "persona": context.get('persona')
            })
            
            # Try to get from cache
            from performance_optimizer import cache
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Cache hit for {context['toolName']}")
                return cached_result
        
        try:
            start_time = time.perf_counter()
            response = requests.post(
                f'{self.bridge_url}/pre-tool',
                json=context,
                timeout=self.timeout
            )
            
            request_time = (time.perf_counter() - start_time) * 1000
            monitor.record_timing("bridge_request", request_time)
            
            if response.status_code == 200:
                result = response.json()
                
                # Cache the result if appropriate
                if should_use_cache(context['toolName']):
                    from performance_optimizer import cache
                    cache.set(cache_key, result)
                    
                return result
            else:
                logger.error(f"Bridge service returned status {response.status_code}")
                return self.create_fallback_response(context)
                
        except requests.Timeout:
            logger.warning("Bridge service timeout, using fallback")
            monitor.record_timing("bridge_timeout", self.timeout * 1000)
            return self.create_fallback_response(context)
            
        except Exception as e:
            logger.error(f"Bridge service error: {e}")
            return self.create_fallback_response(context)
    
    def create_fallback_response(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback response when bridge service is unavailable"""
        return {
            'allow': True,
            'modifiedArgs': context['toolArgs'],
            'metadata': {
                'fallback': True,
                'reason': 'Bridge service unavailable',
                'mcpRoute': self.select_fallback_route(context['toolName'])
            }
        }
    
    @cached_operation(lambda self, tool_name: f"fallback_route:{tool_name}")
    def select_fallback_route(self, tool_name: str) -> str:
        """Select fallback MCP route based on tool (with caching)"""
        # Use optimized routing function
        optimized_route = optimize_mcp_routing(tool_name, {})
        if optimized_route:
            return optimized_route
            
        tool_routes = {
            'Read': 'superclaude-code',
            'Write': 'superclaude-code',
            'Edit': 'superclaude-code',
            'MultiEdit': 'superclaude-code',
            'Grep': 'superclaude-code',
            'Glob': 'superclaude-code',
            'Bash': 'superclaude-orchestrator',
            'Task': 'superclaude-tasks',
            'TodoWrite': 'superclaude-tasks',
            'WebSearch': 'superclaude-intelligence',
            'WebFetch': 'superclaude-intelligence',
        }
        
        # Check for MCP tool patterns
        if tool_name.startswith('mcp__'):
            parts = tool_name.split('__')
            if len(parts) >= 2:
                server = parts[1]
                if server == 'sequential-thinking':
                    return 'sequential'
                elif server == 'context7':
                    return 'context7'
                elif server == 'magic':
                    return 'magic'
                elif server == 'playwright':
                    return 'playwright'
        
        return tool_routes.get(tool_name, 'superclaude-orchestrator')
    
    def format_output(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Format output for Claude Code"""
        return {
            'allow': result.get('allow', True),
            'modifiedArgs': result.get('modifiedArgs'),
            'metadata': result.get('metadata', {}),
            '_performance': {
                'hookDuration': result.get('performance', {}).get('duration', 0),
                'bridgeResponse': result.get('bridgeResponse', False)
            }
        }

    def create_fast_response(self, context: Dict[str, Any], processing_level: str) -> Dict[str, Any]:
        """Create fast response for minimal/simple operations"""
        return {
            'allow': True,
            'modifiedArgs': context['toolArgs'],
            'metadata': {
                'fastPath': True,
                'processingLevel': processing_level,
                'reason': 'Simple operation, bridge routing skipped for performance',
                'mcpRoute': self.select_fallback_route(context['toolName']),
                'intelligentActivation': True
            }
        }

@timed_operation("main_execution") 
def main():
    """Main entry point with intelligent activation and performance optimization"""
    hook_start = time.perf_counter()
    
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize hook
        hook = PreToolUseHook()
        
        # Extract context
        context = hook.extract_context(input_data)
        
        # Determine processing level for intelligent activation
        processing_level = hook.determine_processing_level(context['toolName'], context['toolArgs'])
        
        logger.info(f"Pre-tool hook invoked for {context['toolName']} (level: {processing_level})")
        
        # Check if we can skip bridge routing for performance
        if hook.should_skip_bridge_routing(context['toolName'], processing_level):
            logger.debug(f"Fast path activated for {context['toolName']}")
            result = hook.create_fast_response(context, processing_level)
        else:
            # Route to bridge service with full processing
            result = hook.route_to_bridge(context)
            result['metadata'] = result.get('metadata', {})
            result['metadata']['processingLevel'] = processing_level
            result['metadata']['intelligentActivation'] = True
        
        # Format output
        output = hook.format_output(result)
        
        # Add performance metrics
        hook_duration = (time.perf_counter() - hook_start) * 1000
        output['_performance']['totalDuration'] = hook_duration
        output['_performance']['processingLevel'] = processing_level
        output['_performance']['fastPath'] = result.get('metadata', {}).get('fastPath', False)
        
        # Adjust performance thresholds based on processing level
        performance_threshold = {
            'minimal': 10,   # 10ms for minimal processing
            'medium': 30,    # 30ms for medium processing  
            'high': 75,      # 75ms for high processing
            'full': 100,     # 100ms for full processing
            'standard': 50   # 50ms for standard processing
        }.get(processing_level, 50)
        
        # Log performance warning if too slow for level
        if hook_duration > performance_threshold:
            logger.warning(f"Hook execution took {hook_duration:.1f}ms "
                         f"(target: <{performance_threshold}ms for {processing_level} level)")
        else:
            logger.debug(f"Hook execution: {hook_duration:.1f}ms ({processing_level} level)")
            
        # Get performance stats periodically
        if monitor.metrics.get('main_execution') and len(monitor.metrics['main_execution']) % 100 == 0:
            from performance_optimizer import get_performance_report
            perf_report = get_performance_report()
            logger.info(f"Performance report: {json.dumps(perf_report, indent=2)}")
        
        # Write output to stdout
        print(json.dumps(output))
        
        # Exit with appropriate code
        return 0 if output['allow'] else 1
        
    except Exception as e:
        logger.error(f"Hook error: {e}", exc_info=True)
        
        # On error, allow operation but log
        error_output = {
            'allow': True,
            'error': str(e),
            'fallback': True,
            'processingLevel': 'error',
            'intelligentActivation': False
        }
        print(json.dumps(error_output))
        return 0

if __name__ == '__main__':
    sys.exit(main())