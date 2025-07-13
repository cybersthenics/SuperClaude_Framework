#!/usr/bin/env python3
"""
Performance optimization module for SuperClaude hooks
Provides caching, batching, and performance monitoring
"""

import time
import json
import hashlib
import functools
from typing import Dict, Any, Optional, Callable, Tuple
from collections import OrderedDict
import threading
import os

class LRUCache:
    """Thread-safe LRU cache implementation"""
    
    def __init__(self, max_size: int = 1000, ttl_seconds: int = 300):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self.lock = threading.Lock()
        self.hits = 0
        self.misses = 0
        
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self.lock:
            if key in self.cache:
                value, timestamp = self.cache[key]
                if time.time() - timestamp < self.ttl_seconds:
                    # Move to end (most recently used)
                    self.cache.move_to_end(key)
                    self.hits += 1
                    return value
                else:
                    # Expired
                    del self.cache[key]
            
            self.misses += 1
            return None
            
    def set(self, key: str, value: Any) -> None:
        """Set value in cache"""
        with self.lock:
            if key in self.cache:
                self.cache.move_to_end(key)
            
            self.cache[key] = (value, time.time())
            
            # Evict oldest if over capacity
            if len(self.cache) > self.max_size:
                self.cache.popitem(last=False)
                
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total = self.hits + self.misses
        hit_rate = (self.hits / total * 100) if total > 0 else 0
        
        return {
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": hit_rate,
            "size": len(self.cache),
            "max_size": self.max_size
        }

class PerformanceMonitor:
    """Monitor and track performance metrics"""
    
    def __init__(self):
        self.metrics: Dict[str, list] = {}
        self.lock = threading.Lock()
        
    def record_timing(self, operation: str, duration_ms: float) -> None:
        """Record operation timing"""
        with self.lock:
            if operation not in self.metrics:
                self.metrics[operation] = []
            
            self.metrics[operation].append(duration_ms)
            
            # Keep only last 1000 measurements
            if len(self.metrics[operation]) > 1000:
                self.metrics[operation] = self.metrics[operation][-1000:]
                
    def get_stats(self, operation: str) -> Dict[str, float]:
        """Get statistics for an operation"""
        with self.lock:
            if operation not in self.metrics:
                return {}
                
            timings = self.metrics[operation]
            if not timings:
                return {}
                
            timings_sorted = sorted(timings)
            
            return {
                "count": len(timings),
                "min": min(timings),
                "max": max(timings),
                "avg": sum(timings) / len(timings),
                "p50": timings_sorted[len(timings_sorted) // 2],
                "p95": timings_sorted[int(len(timings_sorted) * 0.95)],
                "p99": timings_sorted[int(len(timings_sorted) * 0.99)]
            }
            
    def get_all_stats(self) -> Dict[str, Dict[str, float]]:
        """Get all operation statistics"""
        with self.lock:
            return {op: self.get_stats(op) for op in self.metrics}

class RequestBatcher:
    """Batch multiple requests for efficiency"""
    
    def __init__(self, batch_size: int = 10, batch_timeout_ms: int = 50):
        self.batch_size = batch_size
        self.batch_timeout_ms = batch_timeout_ms
        self.pending_requests: list = []
        self.lock = threading.Lock()
        self.timer = None
        
    def add_request(self, request: Dict[str, Any], callback: Callable) -> None:
        """Add request to batch"""
        with self.lock:
            self.pending_requests.append((request, callback))
            
            if len(self.pending_requests) >= self.batch_size:
                self._process_batch()
            elif not self.timer:
                self.timer = threading.Timer(
                    self.batch_timeout_ms / 1000.0,
                    self._process_batch
                )
                self.timer.start()
                
    def _process_batch(self) -> None:
        """Process all pending requests"""
        with self.lock:
            if self.timer:
                self.timer.cancel()
                self.timer = None
                
            if not self.pending_requests:
                return
                
            batch = self.pending_requests
            self.pending_requests = []
            
        # Process batch (this would be customized based on use case)
        for request, callback in batch:
            callback(request)

# Global instances
cache = LRUCache(
    max_size=int(os.getenv('CACHE_MAX_SIZE', '1000')),
    ttl_seconds=int(os.getenv('CACHE_TTL', '300'))
)
monitor = PerformanceMonitor()
batcher = RequestBatcher()

def timed_operation(operation_name: str):
    """Decorator to time operations"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.perf_counter()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration_ms = (time.perf_counter() - start_time) * 1000
                monitor.record_timing(operation_name, duration_ms)
                
        return wrapper
    return decorator

def cached_operation(key_func: Callable):
    """Decorator to cache operation results"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = key_func(*args, **kwargs)
            
            # Check cache
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
                
            # Execute function
            result = func(*args, **kwargs)
            
            # Cache result
            cache.set(cache_key, result)
            
            return result
            
        return wrapper
    return decorator

def generate_cache_key(prefix: str, data: Dict[str, Any]) -> str:
    """Generate a cache key from data"""
    # Sort keys for consistent hashing
    sorted_data = json.dumps(data, sort_keys=True)
    hash_value = hashlib.md5(sorted_data.encode()).hexdigest()
    return f"{prefix}:{hash_value}"

def optimize_mcp_routing(tool_name: str, tool_args: Dict[str, Any]) -> Optional[str]:
    """Optimized MCP server routing with caching"""
    
    @cached_operation(lambda t, a: generate_cache_key("routing", {"tool": t, "args": a}))
    @timed_operation("mcp_routing")
    def _route(tool_name: str, tool_args: Dict[str, Any]) -> Optional[str]:
        # Complex routing logic here
        # This is simplified for example
        routing_map = {
            "Read": None,  # Internal only
            "Analyze": "sequential",
            "Build": "magic",
            "Test": "playwright"
        }
        
        return routing_map.get(tool_name)
        
    return _route(tool_name, tool_args)

def get_performance_report() -> Dict[str, Any]:
    """Get comprehensive performance report"""
    return {
        "timestamp": time.time(),
        "cache_stats": cache.get_stats(),
        "operation_timings": monitor.get_all_stats(),
        "recommendations": generate_recommendations()
    }

def generate_recommendations() -> list:
    """Generate performance recommendations based on metrics"""
    recommendations = []
    
    # Check cache hit rate
    cache_stats = cache.get_stats()
    if cache_stats.get("hit_rate", 0) < 60:
        recommendations.append({
            "type": "cache",
            "severity": "medium",
            "message": f"Cache hit rate is {cache_stats['hit_rate']:.1f}%, consider increasing cache size or TTL"
        })
        
    # Check operation timings
    timings = monitor.get_all_stats()
    for operation, stats in timings.items():
        if stats.get("p95", 0) > 100:  # Over 100ms
            recommendations.append({
                "type": "performance",
                "severity": "high",
                "message": f"{operation} P95 latency is {stats['p95']:.1f}ms, needs optimization"
            })
            
    return recommendations

# Performance optimization settings
OPTIMIZATION_CONFIG = {
    "enable_caching": True,
    "enable_batching": True,
    "enable_monitoring": True,
    "parallel_threshold": 3,  # Operations to run in parallel
    "compression_threshold": 1000,  # Bytes before compression
    "circuit_breaker_threshold": 5,
    "circuit_breaker_timeout": 60
}

def should_use_cache(operation: str) -> bool:
    """Determine if operation should use caching"""
    # Don't cache write operations
    no_cache_operations = ["Write", "Edit", "MultiEdit", "TodoWrite"]
    return OPTIMIZATION_CONFIG["enable_caching"] and operation not in no_cache_operations

def should_batch_request(operation: str) -> bool:
    """Determine if operation should be batched"""
    # Batch read-heavy operations
    batchable_operations = ["Read", "Grep", "Glob"]
    return OPTIMIZATION_CONFIG["enable_batching"] and operation in batchable_operations

if __name__ == "__main__":
    # Example usage and testing
    
    # Test caching
    print("Testing cache...")
    cache.set("test_key", {"data": "test"})
    print(f"Cache get: {cache.get('test_key')}")
    print(f"Cache stats: {cache.get_stats()}")
    
    # Test timing
    @timed_operation("test_operation")
    def slow_operation():
        time.sleep(0.1)
        return "done"
        
    print("\nTesting performance monitoring...")
    for _ in range(5):
        slow_operation()
        
    print(f"Operation stats: {monitor.get_stats('test_operation')}")
    
    # Test performance report
    print("\nPerformance Report:")
    print(json.dumps(get_performance_report(), indent=2))