#!/usr/bin/env python3
"""
MorphLLM Tool Interceptor Hook
Intercepts native Claude Code tool calls and redirects to MorphLLM for blazing-fast filesystem operations.

This PreToolUse hook intercepts filesystem tool calls and routes them to MorphLLM MCP server
when MorphLLM flags are active or auto-activation conditions are met.

Usage:
  This hook is automatically triggered by Claude Code's hook system on PreToolUse events.
  Configure via flags: --morph, --morph-only, --morph-fast, --no-morph

Author: SuperClaude Framework
Version: 3.0.0
"""

import json
import sys
import os
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Tool mapping from native Claude Code tools to MorphLLM equivalents
TOOL_MAPPING = {
    "Read": "mcp__morph__read_file",
    "Write": "mcp__morph__write_file",
    "Edit": "mcp__morph__edit_file",
    "LS": "mcp__morph__list_directory",
    "Glob": "mcp__morph__search_files",
    "MultiEdit": "mcp__morph__edit_file"  # Special handling for batch operations
}

# Performance thresholds for auto-activation
AUTO_ACTIVATION_THRESHOLDS = {
    "filesystem_operations": 5,
    "batch_edits": 3,
    "directory_scans": 10
}

class MorphToolInterceptor:
    """Main interceptor class for MorphLLM tool routing"""
    
    def __init__(self):
        self.session_stats = {
            "total_operations": 0,
            "morph_operations": 0,
            "native_operations": 0,
            "fallback_operations": 0,
            "start_time": datetime.now()
        }
        
    def should_intercept(self, tool_name: str, tool_input: Dict[str, Any], flags: List[str]) -> bool:
        """Determine if tool should be intercepted and routed to MorphLLM"""
        
        # Check explicit flags first
        if "--no-morph" in flags:
            logger.debug(f"MorphLLM disabled by --no-morph flag for {tool_name}")
            return False
            
        if "--morph-only" in flags:
            logger.debug(f"MorphLLM forced by --morph-only flag for {tool_name}")
            return tool_name in TOOL_MAPPING
            
        if "--morph" in flags or "--morphllm" in flags:
            logger.debug(f"MorphLLM enabled by --morph flag for {tool_name}")
            return tool_name in TOOL_MAPPING
            
        # Check auto-activation conditions
        if self.should_auto_activate(tool_name, tool_input, flags):
            logger.info(f"MorphLLM auto-activated for {tool_name}")
            return True
            
        return False
    
    def should_auto_activate(self, tool_name: str, tool_input: Dict[str, Any], flags: List[str]) -> bool:
        """Check if MorphLLM should auto-activate based on operation patterns"""
        
        # Only auto-activate for filesystem tools
        if tool_name not in TOOL_MAPPING:
            return False
            
        # Check session statistics for auto-activation patterns
        if self.session_stats["total_operations"] >= AUTO_ACTIVATION_THRESHOLDS["filesystem_operations"]:
            logger.debug(f"Auto-activation: filesystem operations threshold reached ({self.session_stats['total_operations']})")
            return True
            
        # Check for batch operations
        if tool_name == "MultiEdit" and self.is_batch_operation(tool_input):
            logger.debug("Auto-activation: batch edit operation detected")
            return True
            
        # Check for directory operations
        if tool_name == "LS" and self.is_large_directory_operation(tool_input):
            logger.debug("Auto-activation: large directory operation detected")
            return True
            
        # Check for --morph-fast flag auto-activation
        if "--morph-fast" in flags and self.is_performance_critical_operation(tool_name, tool_input):
            logger.debug("Auto-activation: performance-critical operation with --morph-fast")
            return True
            
        return False
    
    def is_batch_operation(self, tool_input: Dict[str, Any]) -> bool:
        """Check if operation is a batch operation (MultiEdit with multiple files)"""
        if "edits" in tool_input:
            return len(tool_input.get("edits", [])) >= AUTO_ACTIVATION_THRESHOLDS["batch_edits"]
        return False
    
    def is_large_directory_operation(self, tool_input: Dict[str, Any]) -> bool:
        """Check if directory operation is large enough to benefit from MorphLLM"""
        # This is a heuristic - in practice, you might want to check directory size
        # For now, we'll assume any directory operation benefits from MorphLLM
        return True
    
    def is_performance_critical_operation(self, tool_name: str, tool_input: Dict[str, Any]) -> bool:
        """Check if operation is performance-critical and would benefit from MorphLLM"""
        
        # Large file operations
        if tool_name in ["Read", "Write", "Edit"] and "file_path" in tool_input:
            try:
                file_path = tool_input["file_path"]
                if os.path.exists(file_path):
                    file_size = os.path.getsize(file_path)
                    if file_size > 1024 * 1024:  # 1MB threshold
                        return True
            except (OSError, KeyError):
                pass
        
        # Multi-file operations
        if tool_name == "MultiEdit":
            return len(tool_input.get("edits", [])) > 1
            
        return False
    
    def validate_morph_server(self) -> bool:
        """Validate that MorphLLM MCP server is available"""
        
        # Check if MorphLLM MCP server is configured
        # This is a simplified check - in practice, you'd check the MCP server status
        morph_env_vars = ["MORPH_API_KEY", "MORPH_SERVER_URL"]
        
        for env_var in morph_env_vars:
            if not os.getenv(env_var):
                logger.warning(f"MorphLLM server validation failed: {env_var} not set")
                return False
        
        logger.debug("MorphLLM server validation passed")
        return True
    
    def map_tool_parameters(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Map native tool parameters to MorphLLM equivalents"""
        
        # Most tools have direct parameter mapping
        if tool_name in ["Read", "Write", "Edit", "LS", "Glob"]:
            return tool_input
            
        # Special handling for MultiEdit -> batch Edit operations
        if tool_name == "MultiEdit":
            return self.map_multiedit_parameters(tool_input)
            
        return tool_input
    
    def map_multiedit_parameters(self, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Map MultiEdit parameters to MorphLLM batch edit format"""
        
        # Extract file path and edits
        file_path = tool_input.get("file_path", "")
        edits = tool_input.get("edits", [])
        
        # For MorphLLM, we'll need to handle batch edits differently
        # This is a simplified mapping - actual implementation may vary
        return {
            "file_path": file_path,
            "edits": edits,
            "batch_mode": True,
            "atomic_operation": True
        }
    
    def create_morph_tool_call(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Create MorphLLM tool call from native tool call"""
        
        morph_tool_name = TOOL_MAPPING.get(tool_name, tool_name)
        mapped_input = self.map_tool_parameters(tool_name, tool_input)
        
        return {
            "tool": morph_tool_name,
            "input": mapped_input,
            "original_tool": tool_name,
            "timestamp": datetime.now().isoformat(),
            "session_id": os.getpid()
        }
    
    def log_interception(self, tool_name: str, action: str, reason: str = ""):
        """Log tool interception for debugging and monitoring"""
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "tool_name": tool_name,
            "action": action,
            "reason": reason,
            "session_stats": self.session_stats
        }
        
        logger.info(f"Tool interception: {action} {tool_name} - {reason}")
        
        # Write to performance log file for analysis
        log_file = os.path.expanduser("~/.claude/morph_interception.log")
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        
        with open(log_file, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    
    def process_tool_call(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing function for tool interception"""
        
        # Update session statistics
        self.session_stats["total_operations"] += 1
        
        # Parse command line arguments to get flags
        flags = self.parse_flags()
        
        # Determine if we should intercept this tool call
        if self.should_intercept(tool_name, tool_input, flags):
            
            # Validate MorphLLM server availability
            if not self.validate_morph_server():
                self.log_interception(tool_name, "fallback", "MorphLLM server unavailable")
                self.session_stats["fallback_operations"] += 1
                return self.create_fallback_response(tool_name, tool_input)
            
            # Create MorphLLM tool call
            morph_call = self.create_morph_tool_call(tool_name, tool_input)
            self.log_interception(tool_name, "intercept", f"Routing to {morph_call['tool']}")
            self.session_stats["morph_operations"] += 1
            
            # Block the native tool call and provide MorphLLM alternative
            return {
                "action": "block",
                "exit_code": 2,
                "reason": f"Routing {tool_name} to MorphLLM for improved performance",
                "alternative_tool": morph_call['tool'],
                "alternative_input": morph_call['input'],
                "morph_metadata": {
                    "original_tool": tool_name,
                    "performance_expected": True,
                    "fallback_available": True
                }
            }
        
        # Allow native tool to proceed
        self.session_stats["native_operations"] += 1
        self.log_interception(tool_name, "allow", "Using native tool")
        return {"action": "allow"}
    
    def create_fallback_response(self, tool_name: str, tool_input: Dict[str, Any]) -> Dict[str, Any]:
        """Create fallback response when MorphLLM is unavailable"""
        
        return {
            "action": "allow",
            "reason": f"MorphLLM unavailable, using native {tool_name}",
            "fallback_mode": True,
            "performance_note": "Performance may be reduced due to MorphLLM unavailability"
        }
    
    def parse_flags(self) -> List[str]:
        """Parse command line flags from environment or arguments"""
        
        # In a real implementation, you would parse actual Claude Code flags
        # For now, we'll check environment variables and command line arguments
        flags = []
        
        # Check environment variables
        if os.getenv("MORPH_ENABLED"):
            flags.append("--morph")
        if os.getenv("MORPH_ONLY"):
            flags.append("--morph-only")
        if os.getenv("MORPH_FAST"):
            flags.append("--morph-fast")
        if os.getenv("NO_MORPH"):
            flags.append("--no-morph")
        
        # Check command line arguments
        cmd_args = sys.argv[1:] if len(sys.argv) > 1 else []
        morph_flags = ["--morph", "--morphllm", "--morph-only", "--morph-fast", "--no-morph"]
        
        for arg in cmd_args:
            if arg in morph_flags:
                flags.append(arg)
        
        return flags

def main():
    """Main entry point for the hook"""
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No tool call data provided"}))
        sys.exit(1)
    
    try:
        # Parse tool call data from Claude Code
        tool_call_data = json.loads(sys.argv[1])
        
        tool_name = tool_call_data.get("tool_name", "")
        tool_input = tool_call_data.get("tool_input", {})
        
        # Create interceptor instance
        interceptor = MorphToolInterceptor()
        
        # Process the tool call
        result = interceptor.process_tool_call(tool_name, tool_input)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with appropriate code
        exit_code = result.get("exit_code", 0)
        sys.exit(exit_code)
        
    except Exception as e:
        logger.error(f"Error in MorphLLM tool interceptor: {str(e)}")
        
        # On error, allow native tool to proceed
        error_response = {
            "action": "allow",
            "error": str(e),
            "fallback_mode": True
        }
        
        print(json.dumps(error_response))
        sys.exit(0)

if __name__ == "__main__":
    main()