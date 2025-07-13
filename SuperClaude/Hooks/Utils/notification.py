#!/usr/bin/env python3
"""
SuperClaude Notification Hook
Handles Claude Code notifications and permission requests
"""

import json
import sys
import os
import requests
from typing import Dict, Any
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
logger = logging.getLogger('notification')

class NotificationHook:
    def __init__(self):
        self.bridge_url = os.environ.get('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.timeout = float(os.environ.get('NOTIFICATION_TIMEOUT_MS', '100')) / 1000
        
    def extract_context(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extract context from notification event"""
        return {
            'notificationType': input_data.get('type', 'unknown'),
            'message': input_data.get('message', ''),
            'details': input_data.get('details', {}),
            'sessionId': input_data.get('sessionId', os.environ.get('CLAUDE_SESSION_ID', 'default')),
            'timestamp': datetime.now().isoformat()
        }
    
    def handle_permission_request(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Handle permission request notifications"""
        details = context.get('details', {})
        operation = details.get('operation', '')
        
        # Check for high-risk operations
        high_risk_operations = [
            'delete', 'remove', 'drop', 'truncate',
            'sudo', 'admin', 'root',
            'production', 'deploy'
        ]
        
        is_high_risk = any(risk in operation.lower() for risk in high_risk_operations)
        
        # Auto-approve low-risk operations in development
        if not is_high_risk and os.environ.get('CLAUDE_ENV') == 'development':
            return {
                'allow': True,
                'autoApproved': True,
                'reason': 'Low-risk operation in development environment'
            }
        
        # For high-risk operations, require explicit approval
        return {
            'allow': False,
            'requiresApproval': True,
            'riskLevel': 'high' if is_high_risk else 'medium',
            'message': f"Operation '{operation}' requires approval"
        }
    
    def send_notification_metrics(self, context: Dict[str, Any]) -> None:
        """Send notification metrics to bridge service"""
        try:
            requests.post(
                f'{self.bridge_url}/notification-metrics',
                json={
                    'type': context['notificationType'],
                    'sessionId': context['sessionId'],
                    'timestamp': context['timestamp']
                },
                timeout=self.timeout
            )
        except Exception as e:
            logger.debug(f"Failed to send notification metrics: {e}")
    
    def format_output(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Format output for Claude Code"""
        return {
            'handled': True,
            'action': result.get('action', 'none'),
            'metadata': result
        }

def main():
    """Main entry point"""
    try:
        # Read input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Initialize hook
        hook = NotificationHook()
        
        # Extract context
        context = hook.extract_context(input_data)
        
        logger.info(f"Notification hook invoked: {context['notificationType']}")
        
        # Handle based on notification type
        result = {}
        
        if context['notificationType'] == 'permission_request':
            result = hook.handle_permission_request(context)
        else:
            # Default handling for other notification types
            result = {
                'handled': True,
                'action': 'logged'
            }
        
        # Send metrics asynchronously
        hook.send_notification_metrics(context)
        
        # Format output
        output = hook.format_output(result)
        
        # Write output to stdout
        print(json.dumps(output))
        
        return 0
        
    except Exception as e:
        logger.error(f"Notification hook error: {e}", exc_info=True)
        
        # On error, return safe default
        error_output = {
            'handled': False,
            'error': str(e)
        }
        print(json.dumps(error_output))
        return 0

if __name__ == '__main__':
    sys.exit(main())