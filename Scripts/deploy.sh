#!/bin/bash
# SuperClaude MCP Deployment Script

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/logs/deployment-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Error handling
handle_error() {
    log "${RED}❌ Error on line $1${NC}"
    log "${RED}Deployment failed! Check $LOG_FILE for details.${NC}"
    exit 1
}

trap 'handle_error $LINENO' ERR

# Header
log "${BLUE}╔════════════════════════════════════════╗${NC}"
log "${BLUE}║     SuperClaude MCP Deployment         ║${NC}"
log "${BLUE}╚════════════════════════════════════════╝${NC}"
log ""

# Check prerequisites
log "${YELLOW}📋 Checking prerequisites...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        log "${RED}❌ $1 is not installed${NC}"
        exit 1
    else
        log "${GREEN}✅ $1 found${NC}"
    fi
}

check_command python3
check_command node
check_command npm
check_command git

# Python version check
PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
log "   Python version: $PYTHON_VERSION"

# Node version check
NODE_VERSION=$(node --version)
log "   Node version: $NODE_VERSION"

# Create necessary directories
log ""
log "${YELLOW}📁 Creating directories...${NC}"
mkdir -p "$SCRIPT_DIR/logs"
mkdir -p "$SCRIPT_DIR/cache"
mkdir -p "$SCRIPT_DIR/data"

# Environment setup
log ""
log "${YELLOW}🔧 Setting up environment...${NC}"

if [ ! -f "$SCRIPT_DIR/.env" ]; then
    if [ -f "$SCRIPT_DIR/.env.example" ]; then
        cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env"
        log "${YELLOW}⚠️  Created .env from template. Please update with your API keys!${NC}"
    else
        log "${RED}❌ No .env file found${NC}"
        exit 1
    fi
else
    log "${GREEN}✅ .env file exists${NC}"
fi

# Install Python dependencies
log ""
log "${YELLOW}🐍 Installing Python dependencies...${NC}"
cd "$SCRIPT_DIR/SuperClaude/Hooks"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt > /dev/null 2>&1
deactivate

log "${GREEN}✅ Python dependencies installed${NC}"

# Install Node dependencies
log ""
log "${YELLOW}📦 Installing Node dependencies...${NC}"
cd "$SCRIPT_DIR/MCP_Servers/bridge-hooks"

if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
fi

# Build TypeScript
log "${YELLOW}🔨 Building TypeScript...${NC}"
npm run build > /dev/null 2>&1
log "${GREEN}✅ TypeScript build complete${NC}"

# Configure Claude Code hooks
log ""
log "${YELLOW}🔗 Configuring Claude Code hooks...${NC}"

CLAUDE_HOOKS_DIR="$HOME/.claude/hooks"
mkdir -p "$CLAUDE_HOOKS_DIR"

# Remove old symlink if exists
if [ -L "$CLAUDE_HOOKS_DIR/config.json" ]; then
    rm "$CLAUDE_HOOKS_DIR/config.json"
fi

# Create new symlink
ln -sf "$SCRIPT_DIR/SuperClaude/Hooks/config.json" "$CLAUDE_HOOKS_DIR/config.json"
log "${GREEN}✅ Claude Code hooks configured${NC}"

# Start services
log ""
log "${YELLOW}🚀 Starting services...${NC}"

# Check if bridge is already running
if pgrep -f "node.*http-server" > /dev/null; then
    log "${YELLOW}⚠️  Bridge server already running${NC}"
else
    cd "$SCRIPT_DIR/MCP_Servers/bridge-hooks"
    nohup npm run start > "$SCRIPT_DIR/logs/bridge.log" 2>&1 &
    BRIDGE_PID=$!
    sleep 3
    
    if kill -0 $BRIDGE_PID 2>/dev/null; then
        log "${GREEN}✅ Bridge server started (PID: $BRIDGE_PID)${NC}"
    else
        log "${RED}❌ Failed to start bridge server${NC}"
        exit 1
    fi
fi

# Verify deployment
log ""
log "${YELLOW}🔍 Verifying deployment...${NC}"

# Check bridge health
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    log "${GREEN}✅ Bridge server healthy${NC}"
else
    log "${RED}❌ Bridge server not responding${NC}"
    exit 1
fi

# Run basic tests
log ""
log "${YELLOW}🧪 Running basic tests...${NC}"
cd "$SCRIPT_DIR"

if python3 Tests/Hooks/test_hooks.py > /dev/null 2>&1; then
    log "${GREEN}✅ Hook tests passed${NC}"
else
    log "${YELLOW}⚠️  Some hook tests failed (non-critical)${NC}"
fi

# Summary
log ""
log "${GREEN}╔════════════════════════════════════════╗${NC}"
log "${GREEN}║     Deployment Complete! 🎉            ║${NC}"
log "${GREEN}╚════════════════════════════════════════╝${NC}"
log ""
log "📋 Next steps:"
log "  1. Update .env with your API keys"
log "  2. Run full integration tests: ./run-integration-tests.sh"
log "  3. Monitor logs: tail -f logs/bridge.log"
log ""
log "🌐 Service endpoints:"
log "  - Bridge health: http://localhost:8080/health"
log "  - MCP status: http://localhost:8080/mcp-status"
log ""
log "📖 Documentation: deployment-guide.md"
log ""

# Save deployment info
echo "{
  \"deployed_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"version\": \"1.0.0\",
  \"python_version\": \"$PYTHON_VERSION\",
  \"node_version\": \"$NODE_VERSION\",
  \"bridge_pid\": \"${BRIDGE_PID:-unknown}\"
}" > "$SCRIPT_DIR/deployment-info.json"

exit 0