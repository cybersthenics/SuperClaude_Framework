#!/usr/bin/env python3
"""
MorphLLM Error Handler Hook
Handles errors and provides fallback mechanisms for MorphLLM filesystem operations.

This hook provides robust error handling, automatic fallback to native tools,
and error recovery strategies for MorphLLM integration failures.

Usage:
  This hook is automatically triggered by Claude Code's hook system on tool failures.
  Provides intelligent fallback and recovery mechanisms.

Author: SuperClaude Framework
Version: 3.0.0
"""

import json
import sys
import os
import logging
import traceback
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ErrorType(Enum):
    """Types of errors that can occur with MorphLLM operations"""
    SERVER_UNAVAILABLE = "server_unavailable"
    API_KEY_INVALID = "api_key_invalid"
    TIMEOUT = "timeout"
    FILE_LOCK = "file_lock"
    PERMISSION_DENIED = "permission_denied"
    MEMORY_ERROR = "memory_error"
    NETWORK_ERROR = "network_error"
    TOOL_MAPPING_ERROR = "tool_mapping_error"
    UNKNOWN_ERROR = "unknown_error"

class FallbackStrategy(Enum):
    """Fallback strategies for different error types"""
    NATIVE_TOOL = "native_tool"
    RETRY_WITH_BACKOFF = "retry_with_backoff"
    BATCH_OPERATION = "batch_operation"
    ALTERNATIVE_TOOL = "alternative_tool"
    GRACEFUL_DEGRADATION = "graceful_degradation"
    FAIL_FAST = "fail_fast"

@dataclass
class ErrorContext:
    """Context information for error handling"""
    tool_name: str
    tool_input: Dict[str, Any]
    error_type: ErrorType
    error_message: str
    timestamp: datetime
    session_id: str
    retry_count: int = 0
    fallback_attempted: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        data["error_type"] = self.error_type.value
        return data

class MorphErrorHandler:
    """Main error handling class for MorphLLM operations"""
    
    def __init__(self):
        self.error_log_file = os.path.expanduser("~/.claude/morph_errors.log")
        self.fallback_stats_file = os.path.expanduser("~/.claude/morph_fallback_stats.json")
        self.session_id = str(os.getpid())
        
        # Ensure log directory exists
        os.makedirs(os.path.dirname(self.error_log_file), exist_ok=True)
        
        # Error handling configuration
        self.config = {
            "max_retry_attempts": 3,
            "retry_delay_seconds": [1, 2, 4],  # Exponential backoff
            "timeout_threshold_seconds": 30,
            "memory_threshold_mb": 1024,
            "enable_circuit_breaker": True,
            "circuit_breaker_failure_threshold": 5,
            "circuit_breaker_reset_timeout": 300  # 5 minutes
        }
        
        # Tool mapping for fallbacks
        self.tool_fallback_mapping = {
            "mcp__morph__read_file": "Read",
            "mcp__morph__write_file": "Write",
            "mcp__morph__edit_file": "Edit",
            "mcp__morph__list_directory": "LS",
            "mcp__morph__search_files": "Glob"
        }
        
        # Error type to fallback strategy mapping
        self.error_strategies = {
            ErrorType.SERVER_UNAVAILABLE: FallbackStrategy.NATIVE_TOOL,
            ErrorType.API_KEY_INVALID: FallbackStrategy.NATIVE_TOOL,
            ErrorType.TIMEOUT: FallbackStrategy.RETRY_WITH_BACKOFF,
            ErrorType.FILE_LOCK: FallbackStrategy.RETRY_WITH_BACKOFF,
            ErrorType.PERMISSION_DENIED: FallbackStrategy.NATIVE_TOOL,
            ErrorType.MEMORY_ERROR: FallbackStrategy.GRACEFUL_DEGRADATION,
            ErrorType.NETWORK_ERROR: FallbackStrategy.RETRY_WITH_BACKOFF,
            ErrorType.TOOL_MAPPING_ERROR: FallbackStrategy.ALTERNATIVE_TOOL,
            ErrorType.UNKNOWN_ERROR: FallbackStrategy.NATIVE_TOOL
        }
    
    def classify_error(self, error_message: str, tool_result: Dict[str, Any]) -> ErrorType:
        """Classify error type based on error message and context"""
        
        error_lower = error_message.lower()
        
        # Server connectivity errors
        if any(keyword in error_lower for keyword in ["connection", "server", "unavailable", "unreachable"]):
            return ErrorType.SERVER_UNAVAILABLE
        
        # Authentication errors
        if any(keyword in error_lower for keyword in ["api key", "authentication", "unauthorized", "forbidden"]):
            return ErrorType.API_KEY_INVALID
        
        # Timeout errors
        if any(keyword in error_lower for keyword in ["timeout", "timed out", "deadline"]):
            return ErrorType.TIMEOUT
        
        # File system errors
        if any(keyword in error_lower for keyword in ["file lock", "locked", "busy"]):
            return ErrorType.FILE_LOCK
        
        if any(keyword in error_lower for keyword in ["permission", "access denied", "not permitted"]):
            return ErrorType.PERMISSION_DENIED
        
        # Memory errors
        if any(keyword in error_lower for keyword in ["memory", "out of memory", "allocation"]):
            return ErrorType.MEMORY_ERROR
        
        # Network errors
        if any(keyword in error_lower for keyword in ["network", "dns", "connection reset"]):
            return ErrorType.NETWORK_ERROR
        
        # Tool mapping errors
        if any(keyword in error_lower for keyword in ["tool mapping", "invalid tool", "unknown tool"]):
            return ErrorType.TOOL_MAPPING_ERROR
        
        return ErrorType.UNKNOWN_ERROR
    
    def create_error_context(self, tool_name: str, tool_input: Dict[str, Any], 
                            error_message: str, tool_result: Dict[str, Any]) -> ErrorContext:
        """Create error context for handling"""
        
        error_type = self.classify_error(error_message, tool_result)
        
        return ErrorContext(
            tool_name=tool_name,
            tool_input=tool_input,
            error_type=error_type,
            error_message=error_message,
            timestamp=datetime.now(),
            session_id=self.session_id
        )
    
    def log_error(self, error_context: ErrorContext) -> None:
        """Log error details for debugging and analysis"""
        
        log_entry = {
            "timestamp": error_context.timestamp.isoformat(),
            "session_id": error_context.session_id,
            "tool_name": error_context.tool_name,
            "error_type": error_context.error_type.value,
            "error_message": error_context.error_message,
            "retry_count": error_context.retry_count,
            "fallback_attempted": error_context.fallback_attempted
        }
        
        try:
            with open(self.error_log_file, "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            logger.error(f"Failed to write error log: {str(e)}")
        
        # Also log to console
        logger.error(f"MorphLLM Error: {error_context.error_type.value} - {error_context.error_message}")
    
    def get_fallback_strategy(self, error_context: ErrorContext) -> FallbackStrategy:
        """Get appropriate fallback strategy for error type"""
        
        # Check circuit breaker state
        if self.is_circuit_breaker_open(error_context.error_type):
            return FallbackStrategy.NATIVE_TOOL
        
        # Get base strategy
        strategy = self.error_strategies.get(error_context.error_type, FallbackStrategy.NATIVE_TOOL)
        
        # Modify strategy based on retry count
        if error_context.retry_count >= self.config["max_retry_attempts"]:
            if strategy == FallbackStrategy.RETRY_WITH_BACKOFF:
                strategy = FallbackStrategy.NATIVE_TOOL
        
        return strategy
    
    def execute_fallback_strategy(self, error_context: ErrorContext, 
                                 strategy: FallbackStrategy) -> Dict[str, Any]:
        """Execute the selected fallback strategy"""
        
        if strategy == FallbackStrategy.NATIVE_TOOL:
            return self.fallback_to_native_tool(error_context)
        
        elif strategy == FallbackStrategy.RETRY_WITH_BACKOFF:
            return self.retry_with_backoff(error_context)
        
        elif strategy == FallbackStrategy.BATCH_OPERATION:
            return self.handle_batch_operation(error_context)
        
        elif strategy == FallbackStrategy.ALTERNATIVE_TOOL:
            return self.use_alternative_tool(error_context)
        
        elif strategy == FallbackStrategy.GRACEFUL_DEGRADATION:
            return self.graceful_degradation(error_context)
        
        elif strategy == FallbackStrategy.FAIL_FAST:
            return self.fail_fast(error_context)
        
        else:
            return self.fallback_to_native_tool(error_context)
    
    def fallback_to_native_tool(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Fallback to native Claude Code tool"""
        
        # Map MorphLLM tool to native equivalent
        native_tool = self.tool_fallback_mapping.get(error_context.tool_name, "Read")
        
        # Update statistics
        self.update_fallback_stats(error_context, "native_tool")
        
        return {
            "action": "fallback",
            "fallback_tool": native_tool,
            "fallback_input": error_context.tool_input,
            "reason": f"MorphLLM {error_context.error_type.value}: {error_context.error_message}",
            "performance_note": "Using native tool due to MorphLLM failure",
            "original_error": error_context.error_message
        }
    
    def retry_with_backoff(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Retry operation with exponential backoff"""
        
        if error_context.retry_count >= self.config["max_retry_attempts"]:
            return self.fallback_to_native_tool(error_context)
        
        delay = self.config["retry_delay_seconds"][
            min(error_context.retry_count, len(self.config["retry_delay_seconds"]) - 1)
        ]
        
        return {
            "action": "retry",
            "retry_delay": delay,
            "retry_count": error_context.retry_count + 1,
            "max_retries": self.config["max_retry_attempts"],
            "reason": f"Retrying after {error_context.error_type.value}"
        }
    
    def handle_batch_operation(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Handle batch operation failures by splitting into smaller operations"""
        
        # Check if this is a batch operation
        if "edits" in error_context.tool_input:
            edits = error_context.tool_input["edits"]
            if len(edits) > 1:
                # Split into smaller batches
                batch_size = max(1, len(edits) // 2)
                return {
                    "action": "split_batch",
                    "batch_size": batch_size,
                    "reason": "Splitting batch operation due to error",
                    "original_batch_size": len(edits)
                }
        
        # If not a batch operation, fall back to native tool
        return self.fallback_to_native_tool(error_context)
    
    def use_alternative_tool(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Use alternative tool for the operation"""
        
        # For tool mapping errors, try a different approach
        if error_context.error_type == ErrorType.TOOL_MAPPING_ERROR:
            # Try to use a more basic tool
            alternative_tools = {
                "mcp__morph__edit_file": "mcp__morph__write_file",
                "mcp__morph__search_files": "mcp__morph__list_directory"
            }
            
            alternative = alternative_tools.get(error_context.tool_name)
            if alternative:
                return {
                    "action": "alternative",
                    "alternative_tool": alternative,
                    "alternative_input": self.adapt_input_for_alternative(
                        error_context.tool_input, alternative
                    ),
                    "reason": "Using alternative tool due to mapping error"
                }
        
        # Default to native tool
        return self.fallback_to_native_tool(error_context)
    
    def graceful_degradation(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Handle errors with graceful degradation"""
        
        # For memory errors, try to reduce operation size
        if error_context.error_type == ErrorType.MEMORY_ERROR:
            # Reduce operation scope
            modified_input = error_context.tool_input.copy()
            
            # If reading a file, try to read in chunks
            if "limit" not in modified_input:
                modified_input["limit"] = 1000  # Limit lines
            
            return {
                "action": "degrade",
                "degraded_input": modified_input,
                "reason": "Reducing operation scope due to memory constraints",
                "degradation_type": "memory_optimization"
            }
        
        return self.fallback_to_native_tool(error_context)
    
    def fail_fast(self, error_context: ErrorContext) -> Dict[str, Any]:
        """Fail fast for unrecoverable errors"""
        
        return {
            "action": "fail",
            "error": error_context.error_message,
            "error_type": error_context.error_type.value,
            "reason": "Unrecoverable error - failing fast",
            "recovery_suggestion": "Check MorphLLM configuration and server status"
        }
    
    def adapt_input_for_alternative(self, original_input: Dict[str, Any], 
                                   alternative_tool: str) -> Dict[str, Any]:
        """Adapt input parameters for alternative tool"""
        
        # This is a simplified adaptation - in practice, you'd need more sophisticated mapping
        adapted_input = original_input.copy()
        
        # Remove tool-specific parameters that might not be compatible
        if alternative_tool == "mcp__morph__write_file":
            # Remove edit-specific parameters
            adapted_input.pop("old_string", None)
            adapted_input.pop("new_string", None)
            
        return adapted_input
    
    def is_circuit_breaker_open(self, error_type: ErrorType) -> bool:
        """Check if circuit breaker is open for this error type"""
        
        if not self.config["enable_circuit_breaker"]:
            return False
        
        # Load circuit breaker state
        try:
            stats = self.load_fallback_stats()
            circuit_state = stats.get("circuit_breaker", {}).get(error_type.value, {})
            
            failure_count = circuit_state.get("failure_count", 0)
            last_failure = circuit_state.get("last_failure")
            
            # Check if circuit should be open
            if failure_count >= self.config["circuit_breaker_failure_threshold"]:
                if last_failure:
                    last_failure_time = datetime.fromisoformat(last_failure)
                    if datetime.now() - last_failure_time < timedelta(seconds=self.config["circuit_breaker_reset_timeout"]):
                        return True
            
        except Exception as e:
            logger.error(f"Error checking circuit breaker: {str(e)}")
        
        return False
    
    def update_circuit_breaker(self, error_type: ErrorType, is_failure: bool) -> None:
        """Update circuit breaker state"""
        
        if not self.config["enable_circuit_breaker"]:
            return
        
        try:
            stats = self.load_fallback_stats()
            
            if "circuit_breaker" not in stats:
                stats["circuit_breaker"] = {}
            
            if error_type.value not in stats["circuit_breaker"]:
                stats["circuit_breaker"][error_type.value] = {
                    "failure_count": 0,
                    "last_failure": None
                }
            
            circuit_state = stats["circuit_breaker"][error_type.value]
            
            if is_failure:
                circuit_state["failure_count"] += 1
                circuit_state["last_failure"] = datetime.now().isoformat()
            else:
                # Reset on success
                circuit_state["failure_count"] = 0
                circuit_state["last_failure"] = None
            
            self.save_fallback_stats(stats)
            
        except Exception as e:
            logger.error(f"Error updating circuit breaker: {str(e)}")
    
    def update_fallback_stats(self, error_context: ErrorContext, strategy: str) -> None:
        """Update fallback statistics"""
        
        try:
            stats = self.load_fallback_stats()
            
            # Update counters
            stats["total_errors"] = stats.get("total_errors", 0) + 1
            stats["error_types"] = stats.get("error_types", {})
            
            error_type_key = error_context.error_type.value
            if error_type_key not in stats["error_types"]:
                stats["error_types"][error_type_key] = 0
            stats["error_types"][error_type_key] += 1
            
            # Update fallback strategies
            stats["fallback_strategies"] = stats.get("fallback_strategies", {})
            if strategy not in stats["fallback_strategies"]:
                stats["fallback_strategies"][strategy] = 0
            stats["fallback_strategies"][strategy] += 1
            
            # Update last error time
            stats["last_error"] = datetime.now().isoformat()
            
            self.save_fallback_stats(stats)
            
        except Exception as e:
            logger.error(f"Error updating fallback stats: {str(e)}")
    
    def load_fallback_stats(self) -> Dict[str, Any]:
        """Load fallback statistics from file"""
        
        default_stats = {
            "total_errors": 0,
            "error_types": {},
            "fallback_strategies": {},
            "circuit_breaker": {},
            "last_error": None,
            "created": datetime.now().isoformat()
        }
        
        try:
            if os.path.exists(self.fallback_stats_file):
                with open(self.fallback_stats_file, "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading fallback stats: {str(e)}")
        
        return default_stats
    
    def save_fallback_stats(self, stats: Dict[str, Any]) -> None:
        """Save fallback statistics to file"""
        
        try:
            with open(self.fallback_stats_file, "w") as f:
                json.dump(stats, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving fallback stats: {str(e)}")
    
    def handle_error(self, tool_name: str, tool_input: Dict[str, Any], 
                    error_message: str, tool_result: Dict[str, Any]) -> Dict[str, Any]:
        """Main error handling function"""
        
        try:
            # Create error context
            error_context = self.create_error_context(tool_name, tool_input, error_message, tool_result)
            
            # Log the error
            self.log_error(error_context)
            
            # Get fallback strategy
            strategy = self.get_fallback_strategy(error_context)
            
            # Execute fallback strategy
            response = self.execute_fallback_strategy(error_context, strategy)
            
            # Update circuit breaker
            self.update_circuit_breaker(error_context.error_type, True)
            
            return response
            
        except Exception as e:
            logger.error(f"Error in error handler: {str(e)}")
            traceback.print_exc()
            
            # Ultimate fallback
            return {
                "action": "fallback",
                "fallback_tool": "Read",
                "fallback_input": tool_input,
                "reason": f"Error handler failure: {str(e)}",
                "ultimate_fallback": True
            }

def main():
    """Main entry point for the hook"""
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No error data provided"}))
        sys.exit(1)
    
    try:
        # Parse error data from Claude Code
        error_data = json.loads(sys.argv[1])
        
        tool_name = error_data.get("tool_name", "")
        tool_input = error_data.get("tool_input", {})
        error_message = error_data.get("error_message", "")
        tool_result = error_data.get("tool_result", {})
        
        # Create error handler instance
        error_handler = MorphErrorHandler()
        
        # Handle the error
        result = error_handler.handle_error(tool_name, tool_input, error_message, tool_result)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Exit with success code
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"Critical error in MorphLLM error handler: {str(e)}")
        
        # Ultimate fallback response
        ultimate_response = {
            "action": "fallback",
            "fallback_tool": "Read",
            "reason": f"Critical error handler failure: {str(e)}",
            "ultimate_fallback": True
        }
        
        print(json.dumps(ultimate_response))
        sys.exit(0)

if __name__ == "__main__":
    main()