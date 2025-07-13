#!/bin/bash
# SuperClaude MCP Health Monitoring Script

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BRIDGE_URL="http://localhost:8080"
CHECK_INTERVAL=30
LOG_FILE="/home/anton/SuperClaude_MCP/logs/monitor.log"

# Monitoring state
FAILURES=0
MAX_FAILURES=3

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to check service health
check_health() {
    local service=$1
    local url=$2
    local timeout=${3:-5}
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅${NC}"
        return 0
    else
        echo -e "${RED}❌${NC}"
        return 1
    fi
}

# Function to check external servers
check_external_servers() {
    local status=$(curl -s "$BRIDGE_URL/mcp-status" 2>/dev/null | jq -r '.externalServers // empty')
    
    if [ -n "$status" ]; then
        echo "$status" | jq -r 'to_entries[] | "\(.key): \(.value.status)"'
    else
        echo "Unable to fetch status"
    fi
}

# Function to display metrics
display_metrics() {
    local metrics=$(curl -s "$BRIDGE_URL/metrics" 2>/dev/null)
    
    if [ -n "$metrics" ]; then
        echo "$metrics" | jq -r '
            "Hook Executions: \(.hooks.total // 0)",
            "Average Latency: \(.performance.avgLatency // "N/A")ms",
            "Cache Hit Rate: \(.cache.hitRate // 0)%",
            "Active Circuits: \(.circuitBreaker.open // 0)"
        '
    fi
}

# Header
clear
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        SuperClaude MCP Health Monitor          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

log "Starting health monitoring (interval: ${CHECK_INTERVAL}s)"

# Main monitoring loop
while true; do
    # Clear screen and show header
    clear
    echo -e "${BLUE}SuperClaude MCP Health Monitor${NC} - $(date '+%Y-%m-%d %H:%M:%S')"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Core Services
    echo -e "\n${YELLOW}Core Services:${NC}"
    printf "  %-20s %s\n" "Bridge Server:" "$(check_health "Bridge" "$BRIDGE_URL/health")"
    
    # External Servers
    echo -e "\n${YELLOW}External Servers:${NC}"
    external_status=$(check_external_servers)
    if [ "$external_status" != "Unable to fetch status" ]; then
        echo "$external_status" | while IFS=: read -r server status; do
            if [[ "$status" =~ "healthy" ]]; then
                printf "  %-20s ${GREEN}✅ %s${NC}\n" "$server:" "$status"
            else
                printf "  %-20s ${RED}❌ %s${NC}\n" "$server:" "$status"
            fi
        done
    else
        echo "  Unable to fetch external server status"
    fi
    
    # Performance Metrics
    echo -e "\n${YELLOW}Performance Metrics:${NC}"
    display_metrics | while read -r line; do
        echo "  $line"
    done
    
    # Recent Errors
    echo -e "\n${YELLOW}Recent Errors (last 5):${NC}"
    if [ -f "$LOG_FILE" ]; then
        grep -i "error\|fail" "$LOG_FILE" | tail -5 | while read -r line; do
            echo "  ${line:0:80}..."
        done || echo "  No recent errors"
    else
        echo "  No log file found"
    fi
    
    # Circuit Breaker Status
    echo -e "\n${YELLOW}Circuit Breaker Status:${NC}"
    cb_status=$(curl -s "$BRIDGE_URL/circuit-status" 2>/dev/null)
    if [ -n "$cb_status" ]; then
        echo "$cb_status" | jq -r '.servers | to_entries[] | "  \(.key): \(.value.state // "unknown")"'
    else
        echo "  Unable to fetch circuit breaker status"
    fi
    
    # System Resources
    echo -e "\n${YELLOW}System Resources:${NC}"
    echo "  CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "  Memory: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
    echo "  Disk: $(df -h / | awk 'NR==2{print $5}')"
    
    # Health Status
    echo -e "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Overall health check
    if check_health "Bridge" "$BRIDGE_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}Overall Status: HEALTHY ✅${NC}"
        FAILURES=0
    else
        FAILURES=$((FAILURES + 1))
        echo -e "${RED}Overall Status: UNHEALTHY ❌ (Failures: $FAILURES/$MAX_FAILURES)${NC}"
        
        if [ $FAILURES -ge $MAX_FAILURES ]; then
            log "CRITICAL: Service has failed $FAILURES times. Attempting restart..."
            # Attempt to restart the service
            cd /home/anton/SuperClaude_MCP/MCP_Servers/bridge-hooks
            npm run start > /home/anton/SuperClaude_MCP/logs/bridge.log 2>&1 &
            FAILURES=0
            sleep 5
        fi
    fi
    
    echo -e "\nPress Ctrl+C to exit | Refreshing in ${CHECK_INTERVAL}s..."
    
    # Sleep until next check
    sleep $CHECK_INTERVAL
done