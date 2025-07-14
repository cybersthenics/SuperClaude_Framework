# SuperClaude Router

The **Intelligent Command Gateway** for the SuperClaude MCP ecosystem. Routes SuperClaude commands to appropriate servers with intelligent decision-making, load balancing, and performance optimization.

## Features

- **Intelligent Routing**: Smart command routing based on command type, flags, and context
- **Bridge Service**: HTTP server on port 8080 for hook coordination
- **Performance Monitoring**: Sub-100ms routing with 2.02x optimization factor
- **Circuit Breaking**: Automatic failover and recovery
- **Caching**: Intelligent caching for routing decisions and command parsing
- **Health Monitoring**: Continuous server health checks and metrics

## Quick Start

### Installation

```bash
npm install
npm run build
```

### Development

```bash
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in CI mode
npm run test:ci
```

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start

# Or use Docker
docker-compose up -d
```

## Architecture

### Core Components

- **CommandParser**: Parses SuperClaude commands and validates syntax
- **RoutingEngine**: Intelligent server selection with load balancing
- **BridgeServiceManager**: HTTP server for hook coordination
- **PerformanceMonitor**: Real-time performance metrics and optimization
- **CacheManager**: Efficient caching for routing decisions

### Server Integration

Routes commands to specialized SuperClaude servers:

- `superclaude-orchestrator`: Complex workflows and coordination
- `superclaude-intelligence`: Analysis and investigation tasks
- `superclaude-builder`: Build and development operations
- `superclaude-quality`: Code quality and security scanning
- `superclaude-tasks`: Task management and workflows
- `superclaude-docs`: Documentation operations
- `superclaude-ui`: UI/UX development
- `superclaude-performance`: Performance optimization

### External MCP Integration

Intelligent routing to external MCP servers:

- **Context7**: Documentation and pattern lookup
- **Sequential**: Complex multi-step analysis
- **Magic**: UI component generation
- **Playwright**: Browser automation and testing

## Configuration

### Environment Variables

- `NODE_ENV`: Environment (development|production|test)
- `BRIDGE_SERVICE_PORT`: Bridge service port (default: 8080)
- `ENABLE_PERFORMANCE_MONITORING`: Enable metrics collection

### Configuration Files

Located in `src/config/`:

- `production.ts`: Production configuration
- Development and test configurations included

## API Reference

### MCP Tools

#### `route_command`
Routes SuperClaude commands to appropriate servers.

```typescript
{
  command: string,
  flags?: string[],
  context?: object
}
```

#### `get_routing_table`
Retrieves current routing configuration.

#### `get_server_health`
Checks health status of all MCP servers.

#### `enable_circuit_breaker`
Configures circuit breaker for servers.

### Bridge Service Endpoints

#### Hook Coordination
- `POST /hooks/pretooluse` - PreToolUse hook processing
- `POST /hooks/posttooluse` - PostToolUse hook processing

#### Monitoring
- `GET /health` - Service health check
- `GET /metrics/performance` - Performance metrics
- `GET /health/servers` - Server health status

#### Administration
- `GET /routing/table` - Current routing configuration
- `POST /routing/rules` - Update routing rules
- `GET /status/connections` - Connection status

## Performance Targets

- **Routing Latency**: <100ms (95th percentile)
- **Hook Execution**: 74ms average (2.02x optimization)
- **Throughput**: 100 routes/second sustained
- **Cache Hit Rate**: >80% routing, >85% commands
- **Uptime**: >99.9% availability

## Development

### Project Structure

```
src/
├── core/              # Core routing components
│   ├── CommandParser.ts
│   ├── RoutingEngine.ts
│   ├── BridgeServiceManager.ts
│   └── RouterServer.ts
├── routing/           # Routing logic
│   ├── RoutingTable.ts
│   ├── ServerHealth.ts
│   └── CircuitBreaker.ts
├── performance/       # Performance optimization
│   ├── CacheManager.ts
│   └── PerformanceMonitor.ts
├── types/            # TypeScript definitions
└── config/           # Configuration files

tests/
├── unit/             # Unit tests
├── integration/      # Integration tests
└── performance/      # Load testing
```

### Testing Strategy

- **Unit Tests**: >90% coverage for core components
- **Integration Tests**: Bridge service and hook coordination
- **Performance Tests**: Load testing with 50+ concurrent requests
- **Coverage Thresholds**: 90% for core modules, 80% overall

### Quality Gates

1. **Syntax Validation**: TypeScript strict mode compliance
2. **Security Scanning**: No critical vulnerabilities
3. **Performance Validation**: Sub-100ms routing targets
4. **Test Coverage**: Minimum coverage thresholds met
5. **Integration Testing**: Full hook coordination validation

## Monitoring

### Metrics Collection

- Routing latency (average, percentiles)
- Hook execution times
- Cache hit rates
- Circuit breaker status
- Server health metrics

### Health Checks

- Service availability check
- Server connection validation
- Performance threshold monitoring
- Resource usage tracking

## Contributing

1. Follow existing code patterns and conventions
2. Maintain >90% test coverage for new code
3. Validate performance targets are met
4. Update documentation for API changes
5. Run full test suite before submission

## License

ISC License - see LICENSE file for details.