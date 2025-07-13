#!/bin/bash
# SuperClaude Hooks Setup Script

echo "Setting up SuperClaude Python hooks..."

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Create virtual environment
echo "Creating Python virtual environment..."
python3 -m venv "$SCRIPT_DIR/venv"

# Activate virtual environment
source "$SCRIPT_DIR/venv/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -r "$SCRIPT_DIR/requirements.txt"

# Make hook scripts executable
echo "Making hook scripts executable..."
chmod +x "$SCRIPT_DIR/pre_tool_use.py"
chmod +x "$SCRIPT_DIR/post_tool_use.py"
chmod +x "$SCRIPT_DIR/notification.py"

# Create logs directory if it doesn't exist
LOG_DIR="/home/anton/SuperClaude_MCP/logs"
if [ ! -d "$LOG_DIR" ]; then
    echo "Creating logs directory..."
    mkdir -p "$LOG_DIR"
fi

# Create environment file template
ENV_FILE="/home/anton/SuperClaude_MCP/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Creating environment file template..."
    cat > "$ENV_FILE" << EOF
# SuperClaude Environment Configuration
CLAUDE_ENV=development
BRIDGE_HOOKS_URL=http://localhost:8080
CONTEXT7_API_KEY=your-context7-key-here
SEQUENTIAL_TOKEN=your-sequential-token-here
MAGIC_API_KEY=your-magic-key-here
MCP_TIMEOUT_MS=500
EOF
    echo "Please update $ENV_FILE with your API keys"
fi

echo "Setup complete!"
echo ""
echo "To use the hooks with Claude Code:"
echo "1. Copy or symlink config.json to ~/.claude/hooks/config.json"
echo "2. Ensure the bridge-hooks service is running on port 8080"
echo "3. Update the .env file with your API keys"
echo ""
echo "Example:"
echo "  ln -s $SCRIPT_DIR/config.json ~/.claude/hooks/config.json"