#!/usr/bin/env python3
"""
Enhanced error messages for SuperClaude hooks
Provides user-friendly error messages with actionable suggestions
"""

from typing import Dict, Any, Optional, List
import json

class ErrorMessageProvider:
    """Provides enhanced error messages with suggestions"""
    
    def __init__(self):
        self.error_templates = {
            # Connection errors
            "bridge_unavailable": {
                "message": "Bridge service is not responding",
                "suggestions": [
                    "Check if the bridge server is running: ps aux | grep http-server",
                    "Start the bridge server: cd MCP_Servers/bridge-hooks && npm run server",
                    "Check logs: tail -f logs/bridge.log"
                ],
                "fallback": "Using internal servers only"
            },
            
            "external_server_timeout": {
                "message": "External server {server} timed out",
                "suggestions": [
                    "Check your internet connection",
                    "Verify API key is correct in .env file",
                    "Server may be experiencing high load - try again later",
                    "Internal fallback server will be used"
                ],
                "fallback": "Using internal {fallback_server}"
            },
            
            "api_key_missing": {
                "message": "API key for {server} is not configured",
                "suggestions": [
                    "Add {key_name} to your .env file",
                    "Get your API key from {provider_url}",
                    "Example: {key_name}=your-api-key-here"
                ],
                "fallback": "External features disabled for {server}"
            },
            
            # Circuit breaker errors
            "circuit_breaker_open": {
                "message": "Circuit breaker is open for {server}",
                "suggestions": [
                    "Server failed {failure_count} times in a row",
                    "Circuit will auto-recover in {recovery_time} seconds",
                    "Check server status: curl {health_endpoint}"
                ],
                "fallback": "Routing to {fallback_server}"
            },
            
            # Performance errors
            "performance_degraded": {
                "message": "Performance is degraded",
                "suggestions": [
                    "Hook execution time: {execution_time}ms (target: <50ms)",
                    "Consider reducing operation complexity",
                    "Check system resources: ./monitor.sh",
                    "Clear cache if needed: rm -rf cache/*"
                ],
                "fallback": "Operation will continue but may be slow"
            },
            
            # Configuration errors
            "invalid_configuration": {
                "message": "Invalid configuration detected",
                "suggestions": [
                    "Check {config_file} for syntax errors",
                    "Validate JSON: python -m json.tool {config_file}",
                    "Restore from backup: cp {config_file}.backup {config_file}"
                ],
                "fallback": "Using default configuration"
            },
            
            # Hook errors
            "hook_execution_failed": {
                "message": "Hook execution failed: {error}",
                "suggestions": [
                    "Check hook logs: tail -f logs/hooks.log",
                    "Test hook manually: echo '{{}}' | python3 {hook_file}",
                    "Verify Python dependencies: pip install -r requirements.txt"
                ],
                "fallback": "Operation allowed but hook features disabled"
            }
        }
        
        self.server_info = {
            "context7": {
                "provider_url": "https://context7.com/api",
                "key_name": "CONTEXT7_API_KEY",
                "health_endpoint": "https://api.context7.com/v1/health",
                "fallback_server": "superclaude-code"
            },
            "sequential": {
                "provider_url": "Contact your administrator",
                "key_name": "SEQUENTIAL_TOKEN",
                "health_endpoint": "http://sequential.local:8080/health",
                "fallback_server": "superclaude-intelligence"
            },
            "magic": {
                "provider_url": "https://21st.dev/api",
                "key_name": "MAGIC_API_KEY",
                "health_endpoint": "https://21st.dev/api/health",
                "fallback_server": "superclaude-ui"
            },
            "playwright": {
                "provider_url": "https://playwright.dev",
                "key_name": "N/A",
                "health_endpoint": "N/A",
                "fallback_server": "manual test generation"
            }
        }
    
    def format_error(self, error_type: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Format an error with suggestions"""
        if error_type not in self.error_templates:
            return self.format_generic_error(error_type, context)
            
        template = self.error_templates[error_type]
        context = context or {}
        
        # Format message
        message = template["message"]
        for key, value in context.items():
            message = message.replace(f"{{{key}}}", str(value))
            
        # Format suggestions
        suggestions = []
        for suggestion in template["suggestions"]:
            formatted = suggestion
            for key, value in context.items():
                formatted = formatted.replace(f"{{{key}}}", str(value))
            suggestions.append(formatted)
            
        # Format fallback
        fallback = template["fallback"]
        for key, value in context.items():
            fallback = fallback.replace(f"{{{key}}}", str(value))
            
        return {
            "type": error_type,
            "message": message,
            "suggestions": suggestions,
            "fallback": fallback,
            "context": context
        }
    
    def format_generic_error(self, error_type: str, context: Dict[str, Any] = None) -> Dict[str, Any]:
        """Format a generic error"""
        return {
            "type": error_type,
            "message": f"An error occurred: {error_type}",
            "suggestions": [
                "Check logs for more details: tail -f logs/*.log",
                "Try running the operation again",
                "Report issue if it persists: https://github.com/user/SuperClaude_MCP/issues"
            ],
            "fallback": "Operation may continue with reduced functionality",
            "context": context or {}
        }
    
    def get_server_error(self, server: str, error: str) -> Dict[str, Any]:
        """Get error message for server-specific issues"""
        if server not in self.server_info:
            return self.format_generic_error(f"unknown_server_{server}", {"error": error})
            
        server_data = self.server_info[server]
        
        if "timeout" in error.lower():
            return self.format_error("external_server_timeout", {
                "server": server,
                "fallback_server": server_data["fallback_server"]
            })
        elif "api key" in error.lower() or "auth" in error.lower():
            return self.format_error("api_key_missing", {
                "server": server,
                "key_name": server_data["key_name"],
                "provider_url": server_data["provider_url"]
            })
        else:
            return self.format_generic_error(f"{server}_error", {"error": error})
    
    def get_performance_warning(self, execution_time: float, target_time: float = 50) -> Dict[str, Any]:
        """Get performance warning message"""
        if execution_time <= target_time:
            return None
            
        severity = "warning" if execution_time < target_time * 2 else "critical"
        
        return self.format_error("performance_degraded", {
            "execution_time": f"{execution_time:.1f}",
            "target_time": target_time,
            "severity": severity
        })
    
    def format_user_message(self, error_info: Dict[str, Any]) -> str:
        """Format error info for user display"""
        lines = [
            f"⚠️  {error_info['message']}",
            "",
            "💡 Suggestions:"
        ]
        
        for i, suggestion in enumerate(error_info.get('suggestions', []), 1):
            lines.append(f"   {i}. {suggestion}")
            
        if error_info.get('fallback'):
            lines.extend([
                "",
                f"🔄 Fallback: {error_info['fallback']}"
            ])
            
        return "\n".join(lines)

# Global instance
error_provider = ErrorMessageProvider()

def get_user_friendly_error(error_type: str, **kwargs) -> str:
    """Get user-friendly error message"""
    error_info = error_provider.format_error(error_type, kwargs)
    return error_provider.format_user_message(error_info)

def get_server_error_message(server: str, error: str) -> str:
    """Get server-specific error message"""
    error_info = error_provider.get_server_error(server, error)
    return error_provider.format_user_message(error_info)

if __name__ == "__main__":
    # Test error messages
    print("Testing error messages:\n")
    
    # Test bridge unavailable
    print(get_user_friendly_error("bridge_unavailable"))
    print("\n" + "="*50 + "\n")
    
    # Test external server timeout
    print(get_server_error_message("context7", "Connection timeout"))
    print("\n" + "="*50 + "\n")
    
    # Test API key missing
    print(get_server_error_message("magic", "API key not found"))
    print("\n" + "="*50 + "\n")
    
    # Test circuit breaker
    print(get_user_friendly_error("circuit_breaker_open", 
        server="sequential",
        failure_count=5,
        recovery_time=60,
        health_endpoint="http://sequential.local:8080/health",
        fallback_server="superclaude-intelligence"
    ))