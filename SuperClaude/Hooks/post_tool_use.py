#!/usr/bin/env python3
"""
SuperClaude Post-Tool Use Hook
Processes tool results for validation and context updates
"""

import json
import sys
import os
import requests
from typing import Dict, Any, Optional
import logging
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/home/anton/SuperClaude_MCP/logs/hooks.log'),
        logging.StreamHandler(sys.stderr)
    ]
)
logger = logging.getLogger('post_tool_use')

class PostToolUseHook:
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('POST_HOOK_TIMEOUT_MS', '50')) / 1000  # Convert to seconds
        
    def extract_context(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract context from Claude Code input"""
        tool_name = input_data.get('tool', '')
        tool_result = input_data.get('result')
        tool_error = input_data.get('error')
        context = input_data.get('context', {})
        
        # Calculate execution time if available
        execution_time = None
        if 'startTime' in context and 'endTime' in context:
            execution_time = context['endTime'] - context['startTime']
        
        return {
            'toolName': tool_name,
            'toolResult': tool_result,
            'toolError': str(tool_error) if tool_error else None,
            'sessionId': context.get('sessionId', os.environ.get('CLAUDE_SESSION_ID', 'default')),
            'executionId': context.get('executionId', f"exec_{datetime.now().timestamp()}"),
            'executionTime': execution_time,
            'metadata': context.get('metadata', {})
        }
    
    def send_to_bridge(self, context: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Send post-tool event to bridge service"""
        try:
            response = requests.post(
                f'{self.bridge_url}/post-tool',
                json=context,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Bridge service returned status {response.status_code}")
                return None
                
        except requests.Timeout:
            logger.warning("Bridge service timeout in post-tool hook")
            return None
            
        except Exception as e:
            logger.error(f"Bridge service error in post-tool: {e}")
            return None
    
    def process_bridge_response(self, response: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Process response from bridge service"""
        if not response:
            return {'processed': False}
        
        result = {'processed': True}
        
        # Check if validation should be triggered
        if response.get('triggerValidation'):
            result['triggerValidation'] = True
            result['validationRules'] = response.get('validationRules', [])
        
        # Check for context updates
        if response.get('contextUpdates'):
            result['contextUpdates'] = response['contextUpdates']
        
        # Check for follow-up actions
        if response.get('followUpActions'):
            result['followUpActions'] = response['followUpActions']
        
        # Performance metrics
        if response.get('performance'):
            result['performance'] = response['performance']
        
        return result
    
    def should_trigger_quality_gates(self, tool_name: str, tool_result: Any, tool_error: Any) -> bool:
        """Determine if quality gates should be triggered"""
        # Trigger on errors
        if tool_error:
            return True
        
        # Trigger on specific tools
        quality_gate_tools = ['Write', 'Edit', 'MultiEdit', 'Bash']
        if tool_name in quality_gate_tools:
            return True
        
        # Trigger on specific results
        if isinstance(tool_result, dict):
            if tool_result.get('filesModified', 0) > 5:
                return True
            if tool_result.get('linesChanged', 0) > 100:
                return True
        
        return False
    
    def format_output(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Format output for logging/metrics"""
        return {
            'processed': result.get('processed', False),
            'validationTriggered': result.get('triggerValidation', False),
            'contextUpdated': bool(result.get('contextUpdates')),
            'followUpActions': len(result.get('followUpActions', [])),
            'performance': result.get('performance', {})
        }

def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize hook
        hook = PostToolUseHook()
        
        # Extract context
        context = hook.extract_context(input_data)
        
        logger.info(f"Post-tool hook invoked for {context['toolName']}")
        
        # Send to bridge service
        bridge_response = hook.send_to_bridge(context)
        
        # Process response
        result = hook.process_bridge_response(bridge_response)
        
        # Check if we should trigger quality gates
        if hook.should_trigger_quality_gates(
            context['toolName'], 
            context['toolResult'], 
            context['toolError']
        ):
            result['triggerValidation'] = True
        
        # Format output for logging
        output = hook.format_output(result)
        
        # Log the result
        logger.info(f"Post-tool hook completed: {output}")
        
        # Post-tool hooks are non-blocking, always return 0
        return 0
        
    except Exception as e:
        logger.error(f"Post-tool hook error: {e}", exc_info=True)
        # Non-blocking, return success
        return 0

if __name__ == '__main__':
    sys.exit(main())