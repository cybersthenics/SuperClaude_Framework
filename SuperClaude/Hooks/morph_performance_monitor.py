#!/usr/bin/env python3
"""
MorphLLM Performance Monitor Hook
Monitors and analyzes performance metrics for MorphLLM filesystem operations.

This PostToolUse hook tracks execution times, success rates, and performance comparisons
between MorphLLM and native tools to optimize routing decisions and provide insights.

Usage:
  This hook is automatically triggered by Claude Code's hook system on PostToolUse events.
  Metrics are logged and analyzed to improve MorphLLM integration performance.

Author: SuperClaude Framework
Version: 3.0.0
"""

import json
import sys
import os
import time
import logging
import statistics
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class OperationMetrics:
    """Data class for operation performance metrics"""
    tool_name: str
    operation_type: str  # 'morph' or 'native'
    start_time: float
    end_time: float
    duration: float
    success: bool
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    error_message: Optional[str] = None
    session_id: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return asdict(self)

class MorphPerformanceMonitor:
    """Main performance monitoring class for MorphLLM operations"""
    
    def __init__(self):
        self.metrics_file = os.path.expanduser("~/.claude/morph_performance.json")
        self.summary_file = os.path.expanduser("~/.claude/morph_performance_summary.json")
        self.session_id = str(os.getpid())
        
        # Ensure metrics directory exists
        os.makedirs(os.path.dirname(self.metrics_file), exist_ok=True)
        
        # Performance thresholds
        self.thresholds = {
            "slow_operation_ms": 1000,  # Operations >1s are considered slow
            "performance_improvement_threshold": 0.2,  # 20% improvement threshold
            "max_metrics_age_days": 7,  # Keep metrics for 7 days
            "batch_size_threshold": 5  # Batch operations with >5 files
        }
        
    def is_morph_operation(self, tool_name: str, tool_result: Dict[str, Any]) -> bool:
        """Check if this was a MorphLLM operation"""
        
        # Check if tool name indicates MorphLLM
        if tool_name.startswith("mcp__morph__"):
            return True
            
        # Check if tool result contains MorphLLM metadata
        if "morph_metadata" in tool_result:
            return True
            
        # Check if operation was routed through MorphLLM
        if tool_result.get("routed_through_morph", False):
            return True
            
        return False
    
    def extract_operation_details(self, tool_name: str, tool_input: Dict[str, Any], 
                                 tool_result: Dict[str, Any]) -> Tuple[Optional[str], Optional[int]]:
        """Extract file path and size from operation details"""
        
        file_path = None
        file_size = None
        
        # Extract file path from input
        if "file_path" in tool_input:
            file_path = tool_input["file_path"]
        elif "path" in tool_input:
            file_path = tool_input["path"]
        
        # Get file size if path exists
        if file_path and os.path.exists(file_path):
            try:
                file_size = os.path.getsize(file_path)
            except OSError:
                pass
        
        return file_path, file_size
    
    def record_operation_metrics(self, tool_name: str, tool_input: Dict[str, Any], 
                                tool_result: Dict[str, Any], execution_time: float) -> None:
        """Record metrics for a single operation"""
        
        # Determine operation type
        operation_type = "morph" if self.is_morph_operation(tool_name, tool_result) else "native"
        
        # Extract operation details
        file_path, file_size = self.extract_operation_details(tool_name, tool_input, tool_result)
        
        # Check if operation was successful
        success = not tool_result.get("error", False) and tool_result.get("success", True)
        error_message = tool_result.get("error_message") if not success else None
        
        # Create metrics record
        metrics = OperationMetrics(
            tool_name=tool_name,
            operation_type=operation_type,
            start_time=time.time() - execution_time,
            end_time=time.time(),
            duration=execution_time,
            success=success,
            file_path=file_path,
            file_size=file_size,
            error_message=error_message,
            session_id=self.session_id
        )
        
        # Save metrics to file
        self.save_metrics(metrics)
        
        # Log performance insights
        self.log_performance_insights(metrics)
        
        # Update performance summary
        self.update_performance_summary(metrics)
    
    def save_metrics(self, metrics: OperationMetrics) -> None:
        """Save operation metrics to file"""
        
        try:
            # Append metrics to JSON lines file
            with open(self.metrics_file, "a") as f:
                f.write(json.dumps(metrics.to_dict()) + "\n")
                
        except Exception as e:
            logger.error(f"Failed to save metrics: {str(e)}")
    
    def log_performance_insights(self, metrics: OperationMetrics) -> None:
        """Log performance insights for the operation"""
        
        # Log slow operations
        if metrics.duration > self.thresholds["slow_operation_ms"] / 1000:
            logger.warning(f"Slow {metrics.operation_type} operation: {metrics.tool_name} "
                          f"took {metrics.duration:.2f}s")
        
        # Log file size impact
        if metrics.file_size:
            if metrics.file_size > 1024 * 1024:  # >1MB
                logger.info(f"Large file operation: {metrics.tool_name} processed "
                           f"{metrics.file_size / (1024*1024):.1f}MB in {metrics.duration:.2f}s")
        
        # Log failures
        if not metrics.success:
            logger.error(f"Operation failed: {metrics.tool_name} - {metrics.error_message}")
    
    def update_performance_summary(self, metrics: OperationMetrics) -> None:
        """Update performance summary statistics"""
        
        try:
            # Load existing summary
            summary = self.load_performance_summary()
            
            # Update counters
            summary["total_operations"] += 1
            summary[f"{metrics.operation_type}_operations"] += 1
            
            if metrics.success:
                summary["successful_operations"] += 1
            else:
                summary["failed_operations"] += 1
            
            # Update timing statistics
            if metrics.operation_type not in summary["timing_stats"]:
                summary["timing_stats"][metrics.operation_type] = {
                    "count": 0,
                    "total_time": 0,
                    "min_time": float('inf'),
                    "max_time": 0,
                    "recent_times": []
                }
            
            timing = summary["timing_stats"][metrics.operation_type]
            timing["count"] += 1
            timing["total_time"] += metrics.duration
            timing["min_time"] = min(timing["min_time"], metrics.duration)
            timing["max_time"] = max(timing["max_time"], metrics.duration)
            
            # Keep recent times for statistical analysis
            timing["recent_times"].append(metrics.duration)
            if len(timing["recent_times"]) > 100:
                timing["recent_times"] = timing["recent_times"][-100:]
            
            # Calculate average and percentiles
            timing["avg_time"] = timing["total_time"] / timing["count"]
            if len(timing["recent_times"]) >= 10:
                timing["median_time"] = statistics.median(timing["recent_times"])
                timing["p95_time"] = statistics.quantiles(timing["recent_times"], n=20)[18]  # 95th percentile
            
            # Update last operation time
            summary["last_updated"] = datetime.now().isoformat()
            
            # Save updated summary
            self.save_performance_summary(summary)
            
        except Exception as e:
            logger.error(f"Failed to update performance summary: {str(e)}")
    
    def load_performance_summary(self) -> Dict[str, Any]:
        """Load performance summary from file"""
        
        default_summary = {
            "total_operations": 0,
            "morph_operations": 0,
            "native_operations": 0,
            "successful_operations": 0,
            "failed_operations": 0,
            "timing_stats": {},
            "performance_comparison": {},
            "last_updated": datetime.now().isoformat(),
            "created": datetime.now().isoformat()
        }
        
        try:
            if os.path.exists(self.summary_file):
                with open(self.summary_file, "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load performance summary: {str(e)}")
        
        return default_summary
    
    def save_performance_summary(self, summary: Dict[str, Any]) -> None:
        """Save performance summary to file"""
        
        try:
            with open(self.summary_file, "w") as f:
                json.dump(summary, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save performance summary: {str(e)}")
    
    def analyze_performance_comparison(self) -> Dict[str, Any]:
        """Analyze performance comparison between MorphLLM and native tools"""
        
        summary = self.load_performance_summary()
        timing_stats = summary.get("timing_stats", {})
        
        comparison = {
            "has_data": False,
            "morph_faster": False,
            "improvement_percentage": 0,
            "recommendation": "insufficient_data"
        }
        
        # Check if we have data for both operation types
        if "morph" in timing_stats and "native" in timing_stats:
            morph_avg = timing_stats["morph"].get("avg_time", 0)
            native_avg = timing_stats["native"].get("avg_time", 0)
            
            if morph_avg > 0 and native_avg > 0:
                comparison["has_data"] = True
                comparison["morph_faster"] = morph_avg < native_avg
                
                if native_avg > 0:
                    improvement = (native_avg - morph_avg) / native_avg
                    comparison["improvement_percentage"] = improvement * 100
                    
                    # Generate recommendation
                    if improvement > self.thresholds["performance_improvement_threshold"]:
                        comparison["recommendation"] = "enable_morph"
                    elif improvement < -self.thresholds["performance_improvement_threshold"]:
                        comparison["recommendation"] = "disable_morph"
                    else:
                        comparison["recommendation"] = "neutral"
        
        return comparison
    
    def cleanup_old_metrics(self) -> None:
        """Clean up old metrics files to prevent disk space issues"""
        
        try:
            if os.path.exists(self.metrics_file):
                # Read all metrics
                metrics = []
                cutoff_time = time.time() - (self.thresholds["max_metrics_age_days"] * 24 * 3600)
                
                with open(self.metrics_file, "r") as f:
                    for line in f:
                        try:
                            metric = json.loads(line.strip())
                            if metric.get("end_time", 0) > cutoff_time:
                                metrics.append(metric)
                        except json.JSONDecodeError:
                            continue
                
                # Rewrite file with recent metrics only
                with open(self.metrics_file, "w") as f:
                    for metric in metrics:
                        f.write(json.dumps(metric) + "\n")
                
                logger.info(f"Cleaned up metrics file, kept {len(metrics)} recent entries")
                
        except Exception as e:
            logger.error(f"Failed to cleanup old metrics: {str(e)}")
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """Generate comprehensive performance report"""
        
        summary = self.load_performance_summary()
        comparison = self.analyze_performance_comparison()
        
        report = {
            "summary": summary,
            "comparison": comparison,
            "recommendations": [],
            "insights": []
        }
        
        # Add performance insights
        if comparison["has_data"]:
            if comparison["morph_faster"]:
                report["insights"].append(
                    f"MorphLLM operations are {comparison['improvement_percentage']:.1f}% faster on average"
                )
            else:
                report["insights"].append(
                    f"Native operations are {abs(comparison['improvement_percentage']):.1f}% faster on average"
                )
        
        # Add recommendations
        if comparison["recommendation"] == "enable_morph":
            report["recommendations"].append("Enable MorphLLM auto-activation for better performance")
        elif comparison["recommendation"] == "disable_morph":
            report["recommendations"].append("Consider disabling MorphLLM due to performance impact")
        
        # Add failure rate insights
        total_ops = summary.get("total_operations", 0)
        failed_ops = summary.get("failed_operations", 0)
        
        if total_ops > 0:
            failure_rate = (failed_ops / total_ops) * 100
            report["insights"].append(f"Overall failure rate: {failure_rate:.1f}%")
            
            if failure_rate > 5:
                report["recommendations"].append("High failure rate detected - check MorphLLM server configuration")
        
        return report
    
    def process_tool_result(self, tool_name: str, tool_input: Dict[str, Any], 
                           tool_result: Dict[str, Any]) -> Dict[str, Any]:
        """Main processing function for performance monitoring"""
        
        try:
            # Extract execution time from result
            execution_time = tool_result.get("execution_time", 0)
            
            # If execution time is not provided, try to calculate it
            if execution_time == 0:
                start_time = tool_result.get("start_time")
                end_time = tool_result.get("end_time")
                if start_time and end_time:
                    execution_time = end_time - start_time
            
            # Record operation metrics
            self.record_operation_metrics(tool_name, tool_input, tool_result, execution_time)
            
            # Periodically cleanup old metrics
            if hash(tool_name) % 100 == 0:  # Cleanup ~1% of the time
                self.cleanup_old_metrics()
            
            # Return success response
            return {
                "status": "success",
                "metrics_recorded": True,
                "execution_time": execution_time
            }
            
        except Exception as e:
            logger.error(f"Error in performance monitoring: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "metrics_recorded": False
            }

def main():
    """Main entry point for the hook"""
    
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No tool result data provided"}))
        sys.exit(1)
    
    try:
        # Parse tool result data from Claude Code
        tool_result_data = json.loads(sys.argv[1])
        
        tool_name = tool_result_data.get("tool_name", "")
        tool_input = tool_result_data.get("tool_input", {})
        tool_result = tool_result_data.get("tool_result", {})
        
        # Create performance monitor instance
        monitor = MorphPerformanceMonitor()
        
        # Process the tool result
        result = monitor.process_tool_result(tool_name, tool_input, tool_result)
        
        # Output result as JSON
        print(json.dumps(result))
        
        # Always exit with success code for PostToolUse hooks
        sys.exit(0)
        
    except Exception as e:
        logger.error(f"Error in MorphLLM performance monitor: {str(e)}")
        
        # On error, still exit successfully to not interfere with operations
        error_response = {
            "status": "error",
            "error": str(e),
            "metrics_recorded": False
        }
        
        print(json.dumps(error_response))
        sys.exit(0)

if __name__ == "__main__":
    main()