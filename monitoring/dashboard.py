#!/usr/bin/env python3
"""
Enhanced monitoring dashboard for SuperClaude MCP
Provides real-time performance metrics and health monitoring
"""

import time
import json
import requests
import curses
from typing import Dict, Any, List, Tuple
import threading
import os
from datetime import datetime
from collections import deque

class MonitoringDashboard:
    def __init__(self):
        self.bridge_url = os.getenv('BRIDGE_HOOKS_URL', 'http://localhost:8080')
        self.refresh_interval = 2  # seconds
        self.running = True
        self.metrics_history = {
            'hook_latency': deque(maxlen=60),  # Last 60 measurements
            'cache_hit_rate': deque(maxlen=60),
            'error_rate': deque(maxlen=60),
            'throughput': deque(maxlen=60)
        }
        self.alerts = deque(maxlen=10)
        
    def fetch_metrics(self) -> Dict[str, Any]:
        """Fetch metrics from bridge service"""
        try:
            # Fetch health status
            health = requests.get(f"{self.bridge_url}/health", timeout=2).json()
            
            # Fetch MCP status
            mcp_status = requests.get(f"{self.bridge_url}/mcp-status", timeout=2).json()
            
            # Fetch circuit breaker status
            circuit_status = requests.get(f"{self.bridge_url}/circuit-status", timeout=2).json()
            
            # Fetch performance metrics
            metrics = requests.get(f"{self.bridge_url}/metrics", timeout=2).json()
            
            return {
                'health': health,
                'mcp': mcp_status,
                'circuits': circuit_status,
                'metrics': metrics,
                'timestamp': time.time()
            }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': time.time()
            }
    
    def update_history(self, data: Dict[str, Any]):
        """Update metrics history"""
        if 'metrics' in data:
            metrics = data['metrics']
            
            # Update hook latency
            if 'performance' in metrics:
                avg_latency = metrics['performance'].get('avgLatency', 0)
                self.metrics_history['hook_latency'].append(avg_latency)
                
                # Check for performance alert
                if avg_latency > 50:
                    self.alerts.append({
                        'time': datetime.now(),
                        'type': 'performance',
                        'message': f'Hook latency high: {avg_latency:.1f}ms'
                    })
            
            # Update cache hit rate
            if 'cache' in metrics:
                hit_rate = metrics['cache'].get('hitRate', 0)
                self.metrics_history['cache_hit_rate'].append(hit_rate)
                
                # Check for cache alert
                if hit_rate < 60:
                    self.alerts.append({
                        'time': datetime.now(),
                        'type': 'cache',
                        'message': f'Cache hit rate low: {hit_rate:.1f}%'
                    })
            
            # Update error rate
            if 'errors' in metrics:
                error_rate = metrics['errors'].get('rate', 0)
                self.metrics_history['error_rate'].append(error_rate)
                
                # Check for error alert
                if error_rate > 1:
                    self.alerts.append({
                        'time': datetime.now(),
                        'type': 'error',
                        'message': f'Error rate high: {error_rate:.1f}%'
                    })
    
    def draw_header(self, stdscr, y: int) -> int:
        """Draw dashboard header"""
        height, width = stdscr.getmaxyx()
        
        title = "SuperClaude MCP Monitoring Dashboard"
        stdscr.addstr(y, (width - len(title)) // 2, title, curses.A_BOLD)
        y += 1
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        stdscr.addstr(y, (width - len(timestamp)) // 2, timestamp)
        y += 2
        
        return y
    
    def draw_health_status(self, stdscr, y: int, data: Dict[str, Any]) -> int:
        """Draw health status section"""
        stdscr.addstr(y, 0, "═" * 50)
        y += 1
        stdscr.addstr(y, 0, "System Health", curses.A_BOLD)
        y += 2
        
        if 'error' in data:
            stdscr.addstr(y, 2, "❌ Bridge Service: ", curses.color_pair(1))
            stdscr.addstr(y, 20, "Offline")
            y += 1
            stdscr.addstr(y, 2, f"Error: {data['error']}", curses.color_pair(1))
        else:
            # Bridge health
            bridge_status = data.get('health', {}).get('status', 'unknown')
            if bridge_status == 'healthy':
                stdscr.addstr(y, 2, "✅ Bridge Service: ", curses.color_pair(2))
                stdscr.addstr(y, 20, "Healthy")
            else:
                stdscr.addstr(y, 2, "❌ Bridge Service: ", curses.color_pair(1))
                stdscr.addstr(y, 20, "Unhealthy")
            y += 1
            
            # External servers
            mcp_servers = data.get('mcp', {}).get('externalServers', {})
            for server, info in mcp_servers.items():
                status = info.get('status', 'unknown')
                if 'healthy' in status.lower():
                    stdscr.addstr(y, 2, f"✅ {server}: ", curses.color_pair(2))
                    stdscr.addstr(y, 20, status)
                else:
                    stdscr.addstr(y, 2, f"❌ {server}: ", curses.color_pair(1))
                    stdscr.addstr(y, 20, status)
                y += 1
        
        y += 1
        return y
    
    def draw_performance_metrics(self, stdscr, y: int, data: Dict[str, Any]) -> int:
        """Draw performance metrics section"""
        stdscr.addstr(y, 0, "═" * 50)
        y += 1
        stdscr.addstr(y, 0, "Performance Metrics", curses.A_BOLD)
        y += 2
        
        if 'metrics' in data:
            metrics = data['metrics']
            
            # Hook latency
            if 'performance' in metrics:
                perf = metrics['performance']
                avg_latency = perf.get('avgLatency', 0)
                p95_latency = perf.get('p95Latency', 0)
                
                color = curses.color_pair(2) if avg_latency < 50 else curses.color_pair(3)
                stdscr.addstr(y, 2, f"Hook Latency: {avg_latency:.1f}ms avg, {p95_latency:.1f}ms p95", color)
                y += 1
                
                # Draw mini graph
                if self.metrics_history['hook_latency']:
                    self.draw_mini_graph(stdscr, y, 4, self.metrics_history['hook_latency'], "ms", 50)
                    y += 3
            
            # Cache performance
            if 'cache' in metrics:
                cache = metrics['cache']
                hit_rate = cache.get('hitRate', 0)
                
                color = curses.color_pair(2) if hit_rate > 60 else curses.color_pair(3)
                stdscr.addstr(y, 2, f"Cache Hit Rate: {hit_rate:.1f}%", color)
                y += 1
                
                # Draw mini graph
                if self.metrics_history['cache_hit_rate']:
                    self.draw_mini_graph(stdscr, y, 4, self.metrics_history['cache_hit_rate'], "%", 60)
                    y += 3
            
            # Error rate
            if 'errors' in metrics:
                errors = metrics['errors']
                error_rate = errors.get('rate', 0)
                
                color = curses.color_pair(2) if error_rate < 1 else curses.color_pair(1)
                stdscr.addstr(y, 2, f"Error Rate: {error_rate:.2f}%", color)
                y += 1
        
        y += 1
        return y
    
    def draw_circuit_breakers(self, stdscr, y: int, data: Dict[str, Any]) -> int:
        """Draw circuit breaker status"""
        stdscr.addstr(y, 0, "═" * 50)
        y += 1
        stdscr.addstr(y, 0, "Circuit Breakers", curses.A_BOLD)
        y += 2
        
        circuits = data.get('circuits', {}).get('servers', {})
        for server, info in circuits.items():
            state = info.get('state', 'unknown')
            failures = info.get('failures', 0)
            
            if state == 'closed':
                stdscr.addstr(y, 2, f"⚡ {server}: ", curses.color_pair(2))
                stdscr.addstr(y, 20, f"Closed (healthy)")
            elif state == 'open':
                stdscr.addstr(y, 2, f"🔴 {server}: ", curses.color_pair(1))
                stdscr.addstr(y, 20, f"Open ({failures} failures)")
            else:
                stdscr.addstr(y, 2, f"🟡 {server}: ", curses.color_pair(3))
                stdscr.addstr(y, 20, f"Half-open (testing)")
            y += 1
        
        y += 1
        return y
    
    def draw_alerts(self, stdscr, y: int) -> int:
        """Draw recent alerts"""
        stdscr.addstr(y, 0, "═" * 50)
        y += 1
        stdscr.addstr(y, 0, "Recent Alerts", curses.A_BOLD)
        y += 2
        
        if not self.alerts:
            stdscr.addstr(y, 2, "No recent alerts", curses.color_pair(2))
            y += 1
        else:
            for alert in list(self.alerts)[-5:]:  # Show last 5 alerts
                time_str = alert['time'].strftime("%H:%M:%S")
                color = curses.color_pair(1) if alert['type'] == 'error' else curses.color_pair(3)
                stdscr.addstr(y, 2, f"{time_str} [{alert['type']}] {alert['message']}", color)
                y += 1
        
        y += 1
        return y
    
    def draw_mini_graph(self, stdscr, y: int, x: int, data: deque, unit: str, threshold: float):
        """Draw a mini sparkline graph"""
        if not data:
            return
            
        # Normalize data to 0-2 range for 3-line graph
        max_val = max(data) if max(data) > 0 else 1
        min_val = min(data)
        
        # Draw 3 lines
        for line in range(3):
            stdscr.addstr(y + (2 - line), x, "")
            for i, value in enumerate(list(data)[-20:]):  # Show last 20 points
                normalized = (value - min_val) / (max_val - min_val) if max_val != min_val else 0.5
                level = int(normalized * 2.999)  # 0, 1, or 2
                
                if level == line:
                    char = "█"
                elif level > line:
                    char = "▄"
                else:
                    char = " "
                    
                # Color based on threshold
                if value > threshold:
                    color = curses.color_pair(3)  # Yellow
                else:
                    color = curses.color_pair(2)  # Green
                    
                stdscr.addstr(y + (2 - line), x + i, char, color)
    
    def run(self, stdscr):
        """Main dashboard loop"""
        # Initialize colors
        curses.start_color()
        curses.init_pair(1, curses.COLOR_RED, curses.COLOR_BLACK)
        curses.init_pair(2, curses.COLOR_GREEN, curses.COLOR_BLACK)
        curses.init_pair(3, curses.COLOR_YELLOW, curses.COLOR_BLACK)
        
        # Configure screen
        curses.curs_set(0)  # Hide cursor
        stdscr.nodelay(1)   # Non-blocking input
        stdscr.clear()
        
        while self.running:
            # Fetch latest data
            data = self.fetch_metrics()
            self.update_history(data)
            
            # Clear screen
            stdscr.clear()
            
            # Draw dashboard sections
            y = 0
            y = self.draw_header(stdscr, y)
            y = self.draw_health_status(stdscr, y, data)
            y = self.draw_performance_metrics(stdscr, y, data)
            y = self.draw_circuit_breakers(stdscr, y, data)
            y = self.draw_alerts(stdscr, y)
            
            # Footer
            height, width = stdscr.getmaxyx()
            footer = "Press 'q' to quit | Refreshing every 2s"
            stdscr.addstr(height - 1, (width - len(footer)) // 2, footer)
            
            # Refresh screen
            stdscr.refresh()
            
            # Check for quit
            key = stdscr.getch()
            if key == ord('q') or key == ord('Q'):
                self.running = False
                break
            
            # Sleep
            time.sleep(self.refresh_interval)

def main():
    """Main entry point"""
    dashboard = MonitoringDashboard()
    
    try:
        curses.wrapper(dashboard.run)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Dashboard error: {e}")

if __name__ == "__main__":
    main()