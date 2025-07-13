# SuperClaude MCP - Centralized Test Suite

Comprehensive testing framework for all SuperClaude MCP components.

## 📁 Test Structure

```
Tests/
├── 🔧 Hooks/                    # Hook system tests
│   ├── benchmark_performance.py     # Performance benchmarks
│   ├── run_tests.py                 # Main test runner
│   ├── test_hook_integration.py     # Integration tests
│   └── test_hooks.py                # Basic hook tests
│
├── 🌐 MCP/                      # MCP server tests
│   ├── superclaude-performance/     # Performance server tests
│   │   ├── ComplexityEstimator.test.ts
│   │   ├── MCPServer.test.ts
│   │   └── PerformanceProfiler.test.ts
│   └── superclaude-quality/         # Quality server tests
│       ├── MCPServer.test.ts
│       ├── SemanticAnalysisEngine.test.ts
│       ├── ValidationFramework.test.ts
│       ├── basic.test.ts
│       └── types.test.ts
│
├── 🔄 Integration Tests (Root)   # System-wide tests
│   ├── test_circuit_breaker.py      # Circuit breaker functionality
│   ├── test_commands.py             # End-to-end command testing
│   ├── test_external_servers.py     # External server connectivity
│   ├── test_performance.py          # System performance validation
│   └── requirements.txt             # Python test dependencies
│
└── 📋 README.md                 # This file
```

## 🧪 Test Categories

### Hook System Tests (`Hooks/`)

**Purpose**: Validate SuperClaude hook system functionality and performance.

| Test File | Focus | Test Count | Coverage |
|-----------|-------|------------|----------|
| `test_hooks.py` | Basic hook functionality | ~20 tests | Core hooks |
| `test_hook_integration.py` | Integration workflows | ~15 tests | Full workflow |
| `benchmark_performance.py` | Performance metrics | ~10 benchmarks | All hooks |
| `run_tests.py` | Test orchestration | Test runner | All above |

**Key Validations**:
- ✅ All 7 hook scripts execute correctly
- ✅ JSON input/output handling
- ✅ Performance targets (<100ms average)
- ✅ Error handling and fallback mechanisms
- ✅ Bridge service integration

### MCP Server Tests (`MCP/`)

**Purpose**: Validate individual MCP server implementations.

#### superclaude-performance/
| Test File | Focus | Coverage |
|-----------|-------|----------|
| `MCPServer.test.ts` | Server integration | Core MCP functions |
| `PerformanceProfiler.test.ts` | Performance analysis | Profiling algorithms |
| `ComplexityEstimator.test.ts` | Complexity analysis | Estimation models |

#### superclaude-quality/
| Test File | Focus | Coverage |
|-----------|-------|----------|
| `MCPServer.test.ts` | Server integration | Core MCP functions |
| `SemanticAnalysisEngine.test.ts` | Code analysis | Semantic processing |
| `ValidationFramework.test.ts` | Quality validation | Validation rules |
| `basic.test.ts` | Basic functionality | Core features |
| `types.test.ts` | Type definitions | TypeScript types |

### Integration Tests (Root Level)

**Purpose**: System-wide validation and end-to-end testing.

| Test File | Focus | Scope |
|-----------|-------|-------|
| `test_circuit_breaker.py` | Failure resilience | Circuit breaker patterns |
| `test_commands.py` | Command execution | End-to-end workflows |
| `test_external_servers.py` | External connectivity | MCP server connections |
| `test_performance.py` | System performance | Overall system metrics |

## 🚀 Running Tests

### Quick Test Commands

```bash
# Run all tests
python3 Tests/Hooks/run_tests.py

# Run hook-specific tests
python3 Tests/Hooks/test_hooks.py

# Run MCP server tests (TypeScript)
cd Tests/MCP/superclaude-performance && npm test

# Run integration tests
python3 Tests/test_commands.py
```

### Comprehensive Test Suite

```bash
# From project root - run full integration test suite
./Scripts/run-integration-tests.sh
```

### Performance Benchmarks

```bash
# Hook performance benchmarks
python3 Tests/Hooks/benchmark_performance.py

# System performance validation
python3 Tests/test_performance.py
```

## 📊 Test Execution Matrix

### Test Environments

| Environment | Hooks | MCP Servers | Integration | Performance |
|-------------|-------|-------------|-------------|-------------|
| **Development** | ✅ All | ✅ Unit tests | ✅ Basic | ✅ Benchmarks |
| **CI/CD** | ✅ All | ✅ All | ✅ Comprehensive | ✅ Regression |
| **Production** | ✅ Smoke | ❌ Skip | ✅ Health checks | ✅ Monitoring |

### Test Dependencies

**Python Tests** (`requirements.txt`):
```
pytest>=7.0.0
requests>=2.28.0
aiohttp>=3.8.0
```

**TypeScript Tests** (each MCP server):
```
jest>=29.0.0
@types/jest>=29.0.0
typescript>=5.0.0
```

## 🔍 Test Configuration

### Environment Variables

```bash
# Test configuration
export TEST_BRIDGE_URL="http://localhost:8080"
export TEST_TIMEOUT=30
export TEST_PARALLEL=true

# Performance test settings
export BENCHMARK_ITERATIONS=100
export PERFORMANCE_THRESHOLD=100  # ms

# Integration test settings
export EXTERNAL_SERVER_TIMEOUT=5000
export CIRCUIT_BREAKER_THRESHOLD=3
```

### Test Data Location

```bash
# Test artifacts
Tests/
├── __pycache__/          # Python test cache
├── .pytest_cache/       # Pytest cache
├── coverage/             # Coverage reports
├── logs/                 # Test execution logs
└── reports/              # Test result reports
```

## 📈 Test Metrics & Reporting

### Success Criteria

| Component | Success Rate | Performance | Coverage |
|-----------|-------------|-------------|----------|
| **Hooks** | >99% | <100ms avg | >90% |
| **MCP Servers** | >95% | <500ms avg | >80% |
| **Integration** | >95% | End-to-end | >70% |

### Generated Reports

- **Test Results**: JSON and HTML reports
- **Performance Metrics**: Benchmark results and trends
- **Coverage Reports**: Code coverage analysis
- **Integration Status**: Component interaction validation

## 🛠️ Test Development

### Adding New Tests

**Hook Tests**:
```python
# Add to Tests/Hooks/test_hooks.py
def test_new_hook_functionality():
    # Test implementation
    pass
```

**MCP Server Tests**:
```typescript
// Add to Tests/MCP/server-name/new-test.test.ts
describe('New Feature', () => {
  it('should validate functionality', () => {
    // Test implementation
  });
});
```

**Integration Tests**:
```python
# Add to Tests/test_new_integration.py
def test_new_integration_workflow():
    # Integration test implementation
    pass
```

### Test Patterns

**Standard Test Structure**:
1. **Setup** - Initialize test environment
2. **Execute** - Run the test scenario
3. **Validate** - Check expected outcomes
4. **Cleanup** - Reset environment state

**Performance Test Pattern**:
1. **Baseline** - Measure current performance
2. **Execute** - Run performance scenario
3. **Measure** - Collect performance metrics
4. **Compare** - Validate against thresholds

## 🔧 Troubleshooting

**Common Test Issues**:

**Tests fail to start**:
- Check Python/Node.js versions
- Install dependencies: `pip install -r requirements.txt`
- Verify service availability

**Performance tests fail**:
- Check system resources (CPU, memory)
- Verify bridge service is running
- Review performance thresholds

**Integration tests timeout**:
- Check external server connectivity
- Verify network configuration
- Review timeout settings

## 📋 Test Maintenance

**Regular Tasks**:
- Update test dependencies monthly
- Review and update performance thresholds
- Add tests for new features
- Archive old test reports
- Update documentation

**Test Data Management**:
- Clean test caches regularly
- Archive historical test results
- Maintain test environment consistency
- Update test configurations as needed

---

*Centralized test suite provides comprehensive validation for all SuperClaude MCP components.*