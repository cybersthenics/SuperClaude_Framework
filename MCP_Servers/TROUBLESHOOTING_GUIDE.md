# SuperClaude MCP Suite - Troubleshooting Guide

Comprehensive troubleshooting guide for diagnosing and resolving issues with the SuperClaude MCP Suite.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Common Issues](#common-issues)
3. [Server-Specific Issues](#server-specific-issues)
4. [Performance Issues](#performance-issues)
5. [Integration Issues](#integration-issues)
6. [Security Issues](#security-issues)
7. [Resource Issues](#resource-issues)
8. [Network Issues](#network-issues)
9. [Data Issues](#data-issues)
10. [Debug Tools and Utilities](#debug-tools-and-utilities)
11. [Log Analysis](#log-analysis)
12. [Emergency Procedures](#emergency-procedures)

---

## Quick Diagnostics

### Health Check Commands

```bash
#!/bin/bash
# quick-health-check.sh

echo "=== SuperClaude MCP Suite Health Check ==="

# Check bridge service
echo "1. Bridge Service Health:"
curl -s http://localhost:8080/health | jq '.' || echo "❌ Bridge service unavailable"

# Check all server health
echo "2. Server Health:"
curl -s http://localhost:8080/health/servers | jq '.' || echo "❌ Unable to check server health"

# Check system resources
echo "3. System Resources:"
echo "Memory: $(free -h | awk 'NR==2{print $3"/"$2" ("$3/$2*100"%)"}')"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')"
echo "Disk: $(df -h | awk '$NF=="/"{print $3"/"$2" ("$5")"}')"

# Check port availability
echo "4. Port Status:"
netstat -tlnp | grep -E ':(8080|8081|8082|8083)' || echo "❌ No SuperClaude ports listening"

# Check process status
echo "5. Process Status:"
ps aux | grep -E 'superclaude|bridge-hooks' | grep -v grep || echo "❌ No SuperClaude processes running"

echo "=== Health Check Complete ==="
```

### Emergency Status Check

```bash
#!/bin/bash
# emergency-check.sh

# Critical service availability
services=("bridge-hooks" "router" "intelligence" "quality")

for service in "${services[@]}"; do
    if pgrep -f "$service" > /dev/null; then
        echo "✅ $service is running"
    else
        echo "❌ $service is NOT running"
    fi
done

# Memory pressure check
mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$mem_usage" -gt 90 ]; then
    echo "🚨 CRITICAL: Memory usage at ${mem_usage}%"
elif [ "$mem_usage" -gt 80 ]; then
    echo "⚠️  WARNING: Memory usage at ${mem_usage}%"
else
    echo "✅ Memory usage normal (${mem_usage}%)"
fi

# Disk space check
disk_usage=$(df / | awk 'NR==2{printf "%.0f", $5}' | sed 's/%//')
if [ "$disk_usage" -gt 90 ]; then
    echo "🚨 CRITICAL: Disk usage at ${disk_usage}%"
elif [ "$disk_usage" -gt 80 ]; then
    echo "⚠️  WARNING: Disk usage at ${disk_usage}%"
else
    echo "✅ Disk usage normal (${disk_usage}%)"
fi
```

---

## Common Issues

### Issue 1: Services Won't Start

#### Symptoms
- Port binding errors
- "EADDRINUSE" errors
- Services exit immediately

#### Diagnosis
```bash
# Check what's using the ports
lsof -i :8080
lsof -i :8081

# Check for zombie processes
ps aux | grep -E 'superclaude|bridge' | grep -v grep

# Check configuration
node -e "console.log(require('./MCP_Servers/mcp-servers.json'))" 2>&1
```

#### Solutions
```bash
# Kill existing processes
pkill -f superclaude
pkill -f bridge-hooks

# Clear port bindings
sudo fuser -k 8080/tcp
sudo fuser -k 8081/tcp

# Reset environment
unset NODE_ENV
export NODE_ENV=development

# Start services individually
cd MCP_Servers/bridge-hooks && npm start
cd MCP_Servers/superclaude-router && npm start
```

### Issue 2: High Memory Usage

#### Symptoms
- Memory usage >90%
- Services becoming unresponsive
- System swap usage increasing

#### Diagnosis
```bash
# Check memory usage by process
ps aux --sort=-%mem | head -10

# Check for memory leaks
node --inspect MCP_Servers/superclaude-intelligence/dist/index.js &
# Connect Chrome DevTools to localhost:9229

# Monitor memory over time
watch -n 5 'free -h && ps aux | grep superclaude | awk "{sum+=\$6} END {print \"Total SuperClaude Memory: \" sum/1024 \"MB\"}"'
```

#### Solutions
```bash
# Restart services with memory limits
export NODE_OPTIONS="--max-old-space-size=1024"

# Enable garbage collection optimization
export NODE_OPTIONS="--gc-interval=100 --max-old-space-size=2048"

# Clear caches
curl -X POST http://localhost:8080/admin/clear-cache

# Rolling restart
./scripts/rolling-restart.sh
```

### Issue 3: Performance Degradation

#### Symptoms
- Response times >500ms
- Timeouts occurring
- Queue buildups

#### Diagnosis
```bash
# Check performance metrics
curl http://localhost:8080/metrics/performance | jq '.'

# Monitor response times
while true; do
    start=$(date +%s%3N)
    curl -s http://localhost:8080/health > /dev/null
    end=$(date +%s%3N)
    echo "Response time: $((end - start))ms"
    sleep 1
done

# Check system load
uptime
iostat -x 1 5
```

#### Solutions
```bash
# Enable performance optimizations
export ENABLE_CACHING=true
export CACHE_TTL=600
export PARALLEL_EXECUTION=true

# Optimize configuration
export MAX_CONCURRENT_OPERATIONS=10
export CONNECTION_POOL_SIZE=20

# Scale horizontally
./scripts/start-additional-instance.sh 8081
```

### Issue 4: Connection Failures

#### Symptoms
- "Connection refused" errors
- Intermittent connectivity
- Timeout errors

#### Diagnosis
```bash
# Test connectivity
telnet localhost 8080
nc -zv localhost 8080

# Check network configuration
netstat -tlnp | grep 8080
ss -tlnp | grep 8080

# Check firewall
sudo ufw status
sudo iptables -L
```

#### Solutions
```bash
# Restart network services
sudo systemctl restart networking

# Check and fix firewall rules
sudo ufw allow 8080/tcp
sudo ufw reload

# Reset connections
sudo systemctl restart superclaude-bridge

# Increase connection limits
echo "net.core.somaxconn = 65535" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## Server-Specific Issues

### Router Server Issues

#### Issue: Routing Failures
```bash
# Check routing table
curl http://localhost:8080/routing/table

# Check circuit breaker status
curl http://localhost:8080/status/circuit-breakers

# Test routing manually
curl -X POST http://localhost:8080/route \
  -H "Content-Type: application/json" \
  -d '{"command": "/analyze", "flags": ["--think"]}'

# Solutions
# Reset routing rules
curl -X POST http://localhost:8080/admin/reset-routing

# Disable circuit breakers temporarily
curl -X POST http://localhost:8080/admin/disable-circuit-breakers
```

### Intelligence Server Issues

#### Issue: LSP Integration Failures
```bash
# Check LSP server status
cd MCP_Servers/superclaude-intelligence
npm run test:lsp

# Check language server availability
which typescript-language-server
which pylsp

# Test LSP connections
curl -X POST http://localhost:8080/intelligence/test-lsp \
  -H "Content-Type: application/json" \
  -d '{"language": "typescript", "uri": "file:///test.ts"}'

# Solutions
# Install missing language servers
npm install -g typescript-language-server
pip install python-lsp-server

# Reset LSP connections
curl -X POST http://localhost:8080/intelligence/reset-lsp

# Use stub mode
export LSP_MODE=stub
```

#### Issue: Token Reduction Not Working
```bash
# Check token reduction metrics
curl http://localhost:8080/intelligence/metrics | jq '.tokenReduction'

# Test token reduction
curl -X POST http://localhost:8080/intelligence/test-reduction \
  -H "Content-Type: application/json" \
  -d '{"text": "function example() { return true; }"}'

# Solutions
# Enable semantic caching
export SEMANTIC_CACHE_ENABLED=true

# Verify semantic analysis
export SEMANTIC_ANALYSIS_ENABLED=true
```

### Quality Server Issues

#### Issue: Validation Pipeline Failures
```bash
# Check individual gates
curl -X POST http://localhost:8080/quality/test-gate \
  -H "Content-Type: application/json" \
  -d '{"gate": "syntax", "target": "./test.js"}'

# Check validation logs
tail -f MCP_Servers/superclaude-quality/logs/validation.log

# Solutions
# Run gates individually
cd MCP_Servers/superclaude-quality
npm run test:gates

# Reset validation cache
curl -X POST http://localhost:8080/quality/clear-cache
```

### Tasks Server Issues

#### Issue: Database Connection Failures
```bash
# Check database status
sqlite3 MCP_Servers/superclaude-tasks/data/tasks.db ".schema"

# Check Redis connection (if used)
redis-cli ping

# Solutions
# Recreate database
cd MCP_Servers/superclaude-tasks
npm run db:reset

# Fix permissions
chmod 664 data/tasks.db
chown superclaude:superclaude data/tasks.db
```

### Personas Server Issues

#### Issue: Persona Activation Failures
```bash
# Test persona activation
curl -X POST http://localhost:8080/personas/test-activation \
  -H "Content-Type: application/json" \
  -d '{"persona": "architect", "context": {"task": "design system"}}'

# Check persona definitions
curl http://localhost:8080/personas/definitions

# Solutions
# Reset persona cache
curl -X POST http://localhost:8080/personas/reset-cache

# Validate persona configurations
cd MCP_Servers/superclaude-personas
npm run validate:personas
```

---

## Performance Issues

### High CPU Usage

#### Diagnosis
```bash
# Find CPU-intensive processes
top -o +%CPU
htop -s PERCENT_CPU

# Check specific SuperClaude processes
ps aux | grep superclaude | sort -k3 -nr

# Profile CPU usage
perf top -p $(pgrep -f superclaude-intelligence)
```

#### Solutions
```bash
# Limit CPU usage
cpulimit -l 50 -p $(pgrep -f superclaude-intelligence)

# Optimize Node.js settings
export UV_THREADPOOL_SIZE=8
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable clustering
export CLUSTERING_ENABLED=true
export CLUSTERING_INSTANCES=4
```

### Memory Leaks

#### Diagnosis
```bash
# Monitor memory growth
while true; do
    ps aux | grep superclaude | awk '{sum+=$6} END {print strftime("%H:%M:%S"), "Memory:", sum/1024, "MB"}'
    sleep 30
done

# Use heap profiling
node --inspect --heap-prof MCP_Servers/superclaude-intelligence/dist/index.js
```

#### Solutions
```bash
# Force garbage collection
kill -USR2 $(pgrep -f superclaude-intelligence)

# Restart services periodically
(crontab -l; echo "0 */6 * * * /path/to/rolling-restart.sh") | crontab -

# Optimize garbage collection
export NODE_OPTIONS="--gc-interval=100 --expose-gc"
```

### Slow Response Times

#### Diagnosis
```bash
# Measure response times
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8080/health

# Create curl-format.txt
cat > curl-format.txt << EOF
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF

# Check database query times
sqlite3 -timer on MCP_Servers/superclaude-tasks/data/tasks.db "SELECT COUNT(*) FROM tasks;"
```

#### Solutions
```bash
# Enable caching
export ENABLE_CACHING=true
export CACHE_TTL=600

# Optimize database
sqlite3 MCP_Servers/superclaude-tasks/data/tasks.db "VACUUM; ANALYZE;"

# Increase connection pool
export CONNECTION_POOL_SIZE=20
export MAX_CONCURRENT_CONNECTIONS=100
```

---

## Integration Issues

### External MCP Server Issues

#### Context7 Integration
```bash
# Test Context7 connectivity
curl http://localhost:8003/health

# Check Context7 configuration
curl http://localhost:8080/external/context7/status

# Solutions
# Start Context7 server
docker run -p 8003:8003 context7/server:latest

# Disable Context7 temporarily
export CONTEXT7_ENABLED=false
```

#### Magic Integration
```bash
# Test Magic connectivity
curl http://localhost:8002/health

# Check Magic configuration
curl http://localhost:8080/external/magic/status

# Solutions
# Restart Magic server
docker restart magic-server

# Use fallback UI generation
export MAGIC_FALLBACK_ENABLED=true
```

### Bridge Service Integration

#### Hook Execution Issues
```bash
# Check hook registration
curl http://localhost:8080/hooks/status

# Test hook execution
curl -X POST http://localhost:8080/hooks/test \
  -H "Content-Type: application/json" \
  -d '{"hook": "preToolUse", "tool": "test"}'

# Solutions
# Reset hook registry
curl -X POST http://localhost:8080/hooks/reset

# Restart bridge service
systemctl restart superclaude-bridge
```

---

## Security Issues

### Authentication Failures

#### Diagnosis
```bash
# Check JWT token validity
echo "your-jwt-token" | jwt decode

# Check authentication logs
grep -r "auth" MCP_Servers/*/logs/
```

#### Solutions
```bash
# Regenerate JWT secret
openssl rand -hex 32 > jwt-secret.txt
export JWT_SECRET=$(cat jwt-secret.txt)

# Reset authentication cache
curl -X POST http://localhost:8080/auth/reset-cache
```

### Permission Issues

#### Diagnosis
```bash
# Check file permissions
ls -la MCP_Servers/*/data/
ls -la MCP_Servers/*/logs/

# Check process user
ps aux | grep superclaude | awk '{print $1}' | sort -u
```

#### Solutions
```bash
# Fix permissions
sudo chown -R superclaude:superclaude MCP_Servers/
sudo chmod -R 755 MCP_Servers/
sudo chmod -R 644 MCP_Servers/*/data/*
```

---

## Resource Issues

### Disk Space Issues

#### Diagnosis
```bash
# Check disk usage
df -h
du -sh MCP_Servers/*/logs/
du -sh MCP_Servers/*/data/
```

#### Solutions
```bash
# Clean old logs
find MCP_Servers/*/logs/ -name "*.log" -mtime +7 -delete

# Compress old data
find MCP_Servers/*/data/ -name "*.db" -exec gzip {} \;

# Setup log rotation
sudo logrotate -f /etc/logrotate.d/superclaude
```

### File Descriptor Limits

#### Diagnosis
```bash
# Check limits
ulimit -n
cat /proc/$(pgrep -f superclaude-intelligence)/limits | grep "open files"
```

#### Solutions
```bash
# Increase limits temporarily
ulimit -n 65536

# Increase limits permanently
echo "superclaude soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "superclaude hard nofile 65536" | sudo tee -a /etc/security/limits.conf
```

---

## Network Issues

### Port Conflicts

#### Diagnosis
```bash
# Check port usage
netstat -tulpn | grep -E ':(8080|8081|8082|8083)'
ss -tulpn | grep -E ':(8080|8081|8082|8083)'
```

#### Solutions
```bash
# Change default ports
export BRIDGE_SERVICE_PORT=8090
export ROUTER_PORT=8091

# Kill conflicting processes
sudo fuser -k 8080/tcp
```

### Firewall Issues

#### Diagnosis
```bash
# Check firewall status
sudo ufw status verbose
sudo iptables -L -n
```

#### Solutions
```bash
# Open required ports
sudo ufw allow 8080/tcp
sudo ufw allow from 127.0.0.1 to any port 8080

# Restart firewall
sudo ufw reload
```

---

## Data Issues

### Database Corruption

#### Diagnosis
```bash
# Check SQLite integrity
sqlite3 MCP_Servers/superclaude-tasks/data/tasks.db "PRAGMA integrity_check;"

# Check database size
ls -lh MCP_Servers/*/data/*.db
```

#### Solutions
```bash
# Repair database
sqlite3 MCP_Servers/superclaude-tasks/data/tasks.db "VACUUM; REINDEX;"

# Restore from backup
cp /var/backups/superclaude/latest/tasks.db MCP_Servers/superclaude-tasks/data/
```

### Cache Issues

#### Diagnosis
```bash
# Check cache status
curl http://localhost:8080/cache/status

# Check cache size
du -sh MCP_Servers/*/cache/
```

#### Solutions
```bash
# Clear all caches
curl -X POST http://localhost:8080/admin/clear-all-caches

# Reset cache configuration
export CACHE_TTL=300
export MAX_CACHE_SIZE=1GB
```

---

## Debug Tools and Utilities

### Performance Monitoring

```bash
#!/bin/bash
# monitor-performance.sh

echo "Starting SuperClaude performance monitoring..."

while true; do
    echo "=== $(date) ==="
    
    # System metrics
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
    echo "Memory: $(free -h | awk 'NR==2{print $3"/"$2}')"
    
    # SuperClaude metrics
    curl -s http://localhost:8080/metrics/performance | jq -r '
        "Response Time: " + (.averageResponseTime | tostring) + "ms",
        "Error Rate: " + (.errorRate | tostring),
        "Cache Hit Rate: " + (.cacheHitRate | tostring),
        "Active Connections: " + (.activeConnections | tostring)
    ' 2>/dev/null || echo "Unable to fetch metrics"
    
    echo "---"
    sleep 10
done
```

### Connection Testing

```bash
#!/bin/bash
# test-connections.sh

servers=(
    "http://localhost:8080/health:Bridge Service"
    "http://localhost:8080/health/servers:Server Health"
    "http://localhost:8003/health:Context7"
    "http://localhost:8002/health:Magic"
)

for server in "${servers[@]}"; do
    url="${server%:*}"
    name="${server#*:}"
    
    if curl -s -f "$url" > /dev/null; then
        echo "✅ $name ($url)"
    else
        echo "❌ $name ($url)"
    fi
done
```

### Memory Analysis

```bash
#!/bin/bash
# analyze-memory.sh

echo "SuperClaude Memory Analysis"
echo "=========================="

# Overall system memory
echo "System Memory:"
free -h

echo ""
echo "SuperClaude Process Memory:"
ps aux | grep -E 'superclaude|bridge' | grep -v grep | while read line; do
    echo "$line" | awk '{print $11 ": " $6/1024 "MB"}'
done

echo ""
echo "Memory Growth Analysis:"
for i in {1..5}; do
    total=$(ps aux | grep superclaude | awk '{sum+=$6} END {print sum/1024}')
    echo "Sample $i: ${total}MB"
    sleep 2
done
```

---

## Log Analysis

### Centralized Log Viewer

```bash
#!/bin/bash
# view-logs.sh

LOG_DIRS=(
    "MCP_Servers/bridge-hooks/logs"
    "MCP_Servers/superclaude-router/logs"
    "MCP_Servers/superclaude-intelligence/logs"
    "MCP_Servers/superclaude-quality/logs"
    "MCP_Servers/superclaude-tasks/logs"
    "MCP_Servers/superclaude-personas/logs"
    "MCP_Servers/superclaude-builder/logs"
    "MCP_Servers/superclaude-orchestrator/logs"
    "MCP_Servers/superclaude-docs/logs"
)

case "$1" in
    "errors")
        grep -r "ERROR\|FATAL" "${LOG_DIRS[@]}" 2>/dev/null | tail -20
        ;;
    "warnings")
        grep -r "WARN" "${LOG_DIRS[@]}" 2>/dev/null | tail -20
        ;;
    "performance")
        grep -r "slow\|timeout\|performance" "${LOG_DIRS[@]}" 2>/dev/null | tail -20
        ;;
    "live")
        tail -f "${LOG_DIRS[@]}"/*/*.log 2>/dev/null
        ;;
    *)
        echo "Usage: $0 {errors|warnings|performance|live}"
        ;;
esac
```

### Error Pattern Analysis

```bash
#!/bin/bash
# analyze-errors.sh

echo "SuperClaude Error Analysis"
echo "========================="

# Find common error patterns
echo "Most Common Errors:"
grep -r "ERROR" MCP_Servers/*/logs/ 2>/dev/null | \
    awk -F: '{print $NF}' | \
    sort | uniq -c | sort -nr | head -10

echo ""
echo "Recent Critical Errors:"
grep -r "FATAL\|CRITICAL" MCP_Servers/*/logs/ 2>/dev/null | tail -10

echo ""
echo "Timeout Errors:"
grep -r "timeout\|TIMEOUT" MCP_Servers/*/logs/ 2>/dev/null | tail -5
```

---

## Emergency Procedures

### Emergency Shutdown

```bash
#!/bin/bash
# emergency-shutdown.sh

echo "Initiating emergency shutdown..."

# Stop all SuperClaude processes
pkill -TERM -f superclaude
pkill -TERM -f bridge-hooks

# Wait for graceful shutdown
sleep 10

# Force kill if still running
pkill -KILL -f superclaude
pkill -KILL -f bridge-hooks

# Clear port bindings
sudo fuser -k 8080/tcp 2>/dev/null
sudo fuser -k 8081/tcp 2>/dev/null

echo "Emergency shutdown complete"
```

### Emergency Recovery

```bash
#!/bin/bash
# emergency-recovery.sh

echo "Starting emergency recovery..."

# Check system resources
if [ $(free | awk 'NR==2{printf "%.0f", $3*100/$2}') -gt 95 ]; then
    echo "CRITICAL: Memory usage >95%, clearing caches..."
    sync && echo 3 > /proc/sys/vm/drop_caches
fi

# Restore from backup if needed
if [ "$1" = "--restore" ]; then
    echo "Restoring from latest backup..."
    ./scripts/restore-latest-backup.sh
fi

# Start essential services only
echo "Starting essential services..."
cd MCP_Servers/bridge-hooks && npm start &
sleep 5
cd ../superclaude-router && npm start &

# Verify recovery
sleep 10
if curl -s http://localhost:8080/health > /dev/null; then
    echo "✅ Emergency recovery successful"
else
    echo "❌ Emergency recovery failed"
    exit 1
fi
```

### Data Recovery

```bash
#!/bin/bash
# recover-data.sh

echo "Starting data recovery..."

# Check for corruption
corrupted=0

for db in MCP_Servers/*/data/*.db; do
    if [ -f "$db" ]; then
        if ! sqlite3 "$db" "PRAGMA integrity_check;" | grep -q "ok"; then
            echo "❌ Corruption detected in $db"
            corrupted=1
        fi
    fi
done

if [ $corrupted -eq 1 ]; then
    echo "Attempting to repair databases..."
    for db in MCP_Servers/*/data/*.db; do
        if [ -f "$db" ]; then
            echo "Repairing $db..."
            sqlite3 "$db" "VACUUM; REINDEX;"
        fi
    done
fi

echo "Data recovery complete"
```

---

## Getting Help

### Support Channels

1. **Self-Service**
   - Check this troubleshooting guide
   - Review server-specific README files
   - Analyze logs using provided tools

2. **Community Support**
   - GitHub Issues: Report bugs and get community help
   - Documentation: Comprehensive guides and API references
   - Examples: Working examples and use cases

3. **Professional Support**
   - Enterprise support: For production deployments
   - Custom integration: For specialized requirements
   - Training: For team onboarding

### Diagnostic Information to Collect

When seeking support, collect this information:

```bash
#!/bin/bash
# collect-diagnostics.sh

DIAG_DIR="superclaude-diagnostics-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DIAG_DIR"

# System information
uname -a > "$DIAG_DIR/system-info.txt"
free -h > "$DIAG_DIR/memory-info.txt"
df -h > "$DIAG_DIR/disk-info.txt"
ps aux | grep superclaude > "$DIAG_DIR/process-info.txt"

# Configuration
cp MCP_Servers/mcp-servers.json "$DIAG_DIR/"
env | grep -E 'NODE|SUPERCLAUDE|BRIDGE' > "$DIAG_DIR/environment.txt"

# Logs (last 1000 lines)
find MCP_Servers/*/logs/ -name "*.log" -exec tail -1000 {} \; > "$DIAG_DIR/all-logs.txt" 2>/dev/null

# Health status
curl -s http://localhost:8080/health > "$DIAG_DIR/health-status.json" 2>/dev/null

# Create archive
tar -czf "$DIAG_DIR.tar.gz" "$DIAG_DIR"
rm -rf "$DIAG_DIR"

echo "Diagnostics collected: $DIAG_DIR.tar.gz"
```

---

This troubleshooting guide provides comprehensive solutions for common and complex issues that may arise with the SuperClaude MCP Suite. Use the appropriate sections based on the symptoms you're experiencing, and follow the diagnostic steps before applying solutions.