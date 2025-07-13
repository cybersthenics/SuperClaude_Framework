# SuperClaude Hook System - Framework Structure

**Clean, organized structure for production deployment**

## 📁 Framework Directory Layout

```
SuperClaude/Hooks/
├── 📋 Essential Files (10 files - Required for installation)
│   ├── pre_tool_use.py            # MCP routing & intelligent activation
│   ├── post_tool_use.py           # Performance tracking & caching  
│   ├── pre_prompt.py              # Context enhancement & personalization
│   ├── post_prompt.py             # Response optimization & quality gates
│   ├── stop.py                    # Session cleanup & performance reporting
│   ├── subagent_stop.py           # Task coordination & delegation cleanup
│   ├── precompact.py              # Context optimization before compaction
│   ├── config.json                # Hook configuration for Claude Code
│   ├── requirements.txt           # Python dependencies (optional)
│   └── README.md                  # Usage guide and troubleshooting
│
├── 📚 Documentation (3 files)
│   ├── FILE_MANIFEST.md           # Complete file listing
│   ├── INSTALLATION.md            # Installation instructions
│   └── FRAMEWORK_STRUCTURE.md     # This file
│
├── 🧪 Tests/ (4 files - Development only)
│   ├── run_tests.py               # Main test runner
│   ├── test_hook_integration.py   # Integration tests
│   ├── benchmark_performance.py   # Performance benchmarks
│   └── test_hooks.py              # Basic hook tests
│
├── 🛠️ Utils/ (4 files - Support utilities)
│   ├── performance_optimizer.py   # Performance optimization
│   ├── error_messages.py          # Error handling
│   ├── notification.py            # Bridge communication
│   └── setup.sh                   # Installation helper
│
└── 📊 Reports/ (2 files - Generated artifacts)
    ├── test_report.json           # Test execution results
    └── performance_benchmark_report.json  # Performance metrics
```

## 🎯 Installation Categories

### Essential for Production (10 files)
**What to install**: Core hooks + configuration + documentation
- All 7 hook scripts (`*.py`)
- Configuration (`config.json`, `requirements.txt`)  
- Documentation (`README.md`)

### Optional Directories
- **Tests/**: Development and validation only
- **Utils/**: Helper utilities and setup scripts
- **Reports/**: Generated test and performance reports

## 🚀 Deployment Strategy

### Minimal Installation
```bash
# Copy only essential 10 files
cp *.py config.json requirements.txt README.md /target/directory/
```

### Complete Installation  
```bash
# Copy entire organized structure
cp -r SuperClaude/Hooks/ /target/directory/
```

### Development Installation
```bash
# Include test and utility directories for development
cp -r SuperClaude/Hooks/ /dev/directory/
# Tests/ and Utils/ available for validation
```

## 📊 File Statistics

| Category | Files | Purpose | Required |
|----------|-------|---------|----------|
| Essential | 10 | Production functionality | ✅ Yes |
| Documentation | 3 | Guidance and reference | 📖 Recommended |
| Tests/ | 4 | Development validation | 🧪 Development only |
| Utils/ | 4 | Helper utilities | 🛠️ Optional |
| Reports/ | 2 | Generated artifacts | 📊 Optional |

**Total**: 23 files organized for optimal deployment

## 🔧 Framework Benefits

✅ **Clean Structure**: Essential files clearly separated from development artifacts  
✅ **Easy Installation**: 10 core files for production deployment  
✅ **Organized Development**: Test and utility files properly categorized  
✅ **Maintainable**: Clear separation of concerns and responsibilities  
✅ **Production Ready**: Minimal footprint with complete functionality

---

*Framework structure optimized for clean deployment and maintainability.*