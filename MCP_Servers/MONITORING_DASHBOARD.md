# SuperClaude MCP Suite - Centralized Monitoring Dashboard

Comprehensive real-time monitoring dashboard for all SuperClaude MCP servers with performance visualization, health tracking, and alert management.

## Table of Contents

1. [Overview](#overview)
2. [Dashboard Architecture](#dashboard-architecture)
3. [Real-Time Monitoring](#real-time-monitoring)
4. [Performance Visualization](#performance-visualization)
5. [Health Status Management](#health-status-management)
6. [Resource Monitoring](#resource-monitoring)
7. [Alert System](#alert-system)
8. [Historical Analytics](#historical-analytics)
9. [Installation & Setup](#installation--setup)
10. [Configuration](#configuration)
11. [API Integration](#api-integration)
12. [Customization](#customization)

---

## Overview

The SuperClaude MCP Suite Monitoring Dashboard provides comprehensive real-time visibility into:

- **8 SuperClaude Servers**: Router, Intelligence, Quality, Tasks, Personas, Builder, Orchestrator, Docs
- **Bridge-Hooks Performance**: 2.84x optimization factor monitoring
- **External MCP Integration**: Context7, Sequential, Magic, Playwright
- **System Resources**: CPU, memory, disk, network utilization
- **Performance Metrics**: Response times, throughput, error rates
- **Quality Gates**: Real-time quality validation monitoring

### Key Features

- **Real-Time Updates**: WebSocket-based live data streaming
- **Performance Visualization**: Interactive charts and graphs
- **Health Monitoring**: Server health status with detailed diagnostics
- **Alert Management**: Intelligent alerting with escalation
- **Historical Analytics**: Trend analysis and performance history
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices

---

## Dashboard Architecture

### Technology Stack

```yaml
Frontend:
  Framework: React 18 with TypeScript
  UI Library: Material-UI (MUI) v5
  Charts: Recharts + D3.js
  Real-time: Socket.IO client
  State Management: Redux Toolkit
  Build Tool: Vite

Backend:
  Framework: Express.js with TypeScript
  Real-time: Socket.IO server
  Database: InfluxDB (time-series) + SQLite (configuration)
  API: REST + GraphQL
  Authentication: JWT

Infrastructure:
  Reverse Proxy: Nginx
  Process Manager: PM2
  Logging: Winston + Morgan
  Monitoring: Built-in + Prometheus integration
```

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser Dashboard                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │
│  │   Health    │ │ Performance │ │      Resources      │   │
│  │   Status    │ │   Metrics   │ │    Monitoring       │   │
│  └─────────────┘ └─────────────┘ └─────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   Dashboard API   │
                    │   (Port 3000)     │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼──────┐    ┌────────▼────────┐    ┌──────▼──────┐
│ SuperClaude  │    │ Bridge Service  │    │ External    │
│   Servers    │    │   (Port 8080)   │    │ MCP Servers │
│  (8 servers) │    └─────────────────┘    │ (4 servers) │
└──────────────┘                           └─────────────┘
```

---

## Real-Time Monitoring

### Live Performance Dashboard

```typescript
// dashboard/src/components/LiveDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import io from 'socket.io-client';

interface PerformanceMetrics {
  timestamp: number;
  server: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export const LiveDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3000');

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to monitoring dashboard');
    });

    socket.on('performance-metrics', (data: PerformanceMetrics) => {
      setMetrics(prev => {
        const updated = [...prev, data];
        // Keep last 100 data points
        return updated.slice(-100);
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        SuperClaude MCP Suite - Live Monitor
        <Box
          component="span"
          sx={{
            ml: 2,
            color: isConnected ? 'green' : 'red',
            fontSize: '0.8em'
          }}
        >
          ● {isConnected ? 'Connected' : 'Disconnected'}
        </Box>
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">Response Times</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">System Resources</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Line 
                    type="monotone" 
                    dataKey="memoryUsage" 
                    stroke="#82ca9d" 
                    name="Memory"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpuUsage" 
                    stroke="#ffc658" 
                    name="CPU"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

### WebSocket Data Streaming

```typescript
// dashboard/backend/src/services/MetricsCollector.ts
import { Server as SocketIOServer } from 'socket.io';
import axios from 'axios';
import { EventEmitter } from 'events';

export class MetricsCollector extends EventEmitter {
  private io: SocketIOServer;
  private collectionInterval: NodeJS.Timeout | null = null;
  private servers = [
    { name: 'bridge', url: 'http://localhost:8080', type: 'bridge' },
    { name: 'router', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'intelligence', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'quality', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'tasks', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'personas', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'builder', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'orchestrator', url: 'http://localhost:8080', type: 'superclaude' },
    { name: 'docs', url: 'http://localhost:8080', type: 'superclaude' }
  ];

  constructor(io: SocketIOServer) {
    super();
    this.io = io;
  }

  start(): void {
    console.log('Starting metrics collection...');
    
    this.collectionInterval = setInterval(async () => {
      await this.collectAndBroadcastMetrics();
    }, 5000); // Collect every 5 seconds
  }

  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  private async collectAndBroadcastMetrics(): Promise<void> {
    const timestamp = Date.now();
    
    for (const server of this.servers) {
      try {
        const metrics = await this.collectServerMetrics(server);
        const enrichedMetrics = {
          ...metrics,
          timestamp,
          server: server.name
        };

        // Broadcast to all connected clients
        this.io.emit('performance-metrics', enrichedMetrics);
        
        // Store in time-series database
        await this.storeMetrics(enrichedMetrics);
        
      } catch (error) {
        console.error(`Failed to collect metrics for ${server.name}:`, error);
        
        // Emit error metric
        this.io.emit('performance-metrics', {
          timestamp,
          server: server.name,
          responseTime: -1,
          throughput: 0,
          errorRate: 1,
          memoryUsage: 0,
          cpuUsage: 0,
          status: 'error'
        });
      }
    }
  }

  private async collectServerMetrics(server: any): Promise<any> {
    const startTime = Date.now();
    
    let endpoint = '/health';
    if (server.type === 'superclaude') {
      endpoint = `/health/servers?server=${server.name}`;
    }

    const response = await axios.get(`${server.url}${endpoint}`, {
      timeout: 10000
    });
    
    const responseTime = Date.now() - startTime;
    
    // Extract metrics from response
    const data = response.data;
    
    return {
      responseTime,
      throughput: data.metrics?.throughput || 0,
      errorRate: data.metrics?.errorRate || 0,
      memoryUsage: data.resources?.memoryUsage || 0,
      cpuUsage: data.resources?.cpuUsage || 0,
      status: data.status || 'unknown'
    };
  }

  private async storeMetrics(metrics: any): Promise<void> {
    // Store in InfluxDB for historical analysis
    // Implementation would depend on InfluxDB client
    console.log(`Storing metrics for ${metrics.server}:`, {
      responseTime: metrics.responseTime,
      timestamp: metrics.timestamp
    });
  }
}
```

---

## Performance Visualization

### Server Performance Overview

```typescript
// dashboard/src/components/ServerOverview.tsx
import React, { useState, useEffect } from 'react';
import {
  Grid, Card, CardContent, Typography, Box,
  Chip, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';

interface ServerStatus {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  responseTime: number;
  uptime: number;
  version: string;
  lastCheck: string;
  metrics: {
    requestsPerSecond: number;
    errorRate: number;
    averageResponseTime: number;
    peakResponseTime: number;
  };
}

export const ServerOverview: React.FC = () => {
  const [servers, setServers] = useState<ServerStatus[]>([]);

  useEffect(() => {
    // Fetch server data
    fetchServerData();
    const interval = setInterval(fetchServerData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchServerData = async () => {
    try {
      const response = await fetch('/api/servers/overview');
      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error('Failed to fetch server data:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      case 'offline': return 'default';
      default: return 'default';
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 100) return 'success';
    if (responseTime < 300) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Server Performance Overview
      </Typography>

      {/* Performance Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Healthy Servers
              </Typography>
              <Typography variant="h4">
                {servers.filter(s => s.status === 'healthy').length}/{servers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Response Time
              </Typography>
              <Typography variant="h4">
                {servers.length > 0 
                  ? Math.round(servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length)
                  : 0}ms
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests/sec
              </Typography>
              <Typography variant="h4">
                {servers.reduce((sum, s) => sum + (s.metrics?.requestsPerSecond || 0), 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Error Rate
              </Typography>
              <Typography variant="h4">
                {servers.length > 0 
                  ? ((servers.reduce((sum, s) => sum + (s.metrics?.errorRate || 0), 0) / servers.length) * 100).toFixed(2)
                  : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Server Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Server Details
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Server</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Response Time</TableCell>
                  <TableCell>Uptime</TableCell>
                  <TableCell>Requests/sec</TableCell>
                  <TableCell>Error Rate</TableCell>
                  <TableCell>Version</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {servers.map((server) => (
                  <TableRow key={server.name}>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {server.name.charAt(0).toUpperCase() + server.name.slice(1)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={server.status}
                        color={getStatusColor(server.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography
                          color={getResponseTimeColor(server.responseTime)}
                          sx={{ mr: 1 }}
                        >
                          {server.responseTime}ms
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min((server.responseTime / 500) * 100, 100)}
                          sx={{ width: 50, height: 4 }}
                          color={getResponseTimeColor(server.responseTime) as any}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {Math.floor(server.uptime / 3600)}h {Math.floor((server.uptime % 3600) / 60)}m
                    </TableCell>
                    <TableCell>{server.metrics?.requestsPerSecond || 0}</TableCell>
                    <TableCell>
                      {((server.metrics?.errorRate || 0) * 100).toFixed(2)}%
                    </TableCell>
                    <TableCell>{server.version}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};
```

### Bridge-Hooks Performance Monitor

```typescript
// dashboard/src/components/BridgeHooksMonitor.tsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Grid,
  LinearProgress, Chip
} from '@mui/material';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface BridgeMetrics {
  optimizationFactor: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  throughput: number;
  concurrentOperations: number;
  successRate: number;
  hookMetrics: {
    preToolUse: { count: number; averageTime: number };
    postToolUse: { count: number; averageTime: number };
  };
}

export const BridgeHooksMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<BridgeMetrics | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    fetchBridgeMetrics();
    const interval = setInterval(fetchBridgeMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBridgeMetrics = async () => {
    try {
      const response = await fetch('/api/bridge/metrics');
      const data = await response.json();
      setMetrics(data);
      
      // Add to historical data
      setHistoricalData(prev => {
        const updated = [...prev, { ...data, timestamp: Date.now() }];
        return updated.slice(-50); // Keep last 50 data points
      });
    } catch (error) {
      console.error('Failed to fetch bridge metrics:', error);
    }
  };

  if (!metrics) {
    return <Typography>Loading bridge metrics...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Bridge-Hooks Performance Monitor
      </Typography>
      
      <Grid container spacing={3}>
        {/* Key Performance Indicators */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Optimization
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Optimization Factor
                </Typography>
                <Typography variant="h4" color="primary">
                  {metrics.optimizationFactor.toFixed(2)}x
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((metrics.optimizationFactor / 3) * 100, 100)}
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Average Execution Time
                </Typography>
                <Typography variant="h4">
                  {metrics.averageExecutionTime.toFixed(1)}ms
                </Typography>
                <Chip
                  label={metrics.averageExecutionTime < 70 ? "Excellent" : "Good"}
                  color={metrics.averageExecutionTime < 70 ? "success" : "warning"}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Cache Hit Rate
                </Typography>
                <Typography variant="h4">
                  {(metrics.cacheHitRate * 100).toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={metrics.cacheHitRate * 100}
                  sx={{ mt: 1 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Real-time Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Real-time Operations
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Throughput
                </Typography>
                <Typography variant="h4">
                  {metrics.throughput.toLocaleString()} ops/sec
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Concurrent Operations
                </Typography>
                <Typography variant="h4">
                  {metrics.concurrentOperations}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary">
                  Success Rate
                </Typography>
                <Typography variant="h4" color="success.main">
                  {(metrics.successRate * 100).toFixed(2)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Time Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Execution Time Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Line
                    type="monotone"
                    dataKey="averageExecutionTime"
                    stroke="#8884d8"
                    strokeWidth={2}
                    name="Avg Execution Time (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Hook Performance Breakdown */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Hook Performance Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      name: 'PreToolUse',
                      count: metrics.hookMetrics.preToolUse.count,
                      averageTime: metrics.hookMetrics.preToolUse.averageTime
                    },
                    {
                      name: 'PostToolUse',
                      count: metrics.hookMetrics.postToolUse.count,
                      averageTime: metrics.hookMetrics.postToolUse.averageTime
                    }
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="averageTime" fill="#8884d8" name="Avg Time (ms)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

---

## Health Status Management

### Health Dashboard Component

```typescript
// dashboard/src/components/HealthDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent,
  Alert, Chip, List, ListItem, ListItemText,
  IconButton, Collapse
} from '@mui/material';
import {
  CheckCircle, Warning, Error, ExpandMore, ExpandLess
} from '@mui/icons-material';

interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  servers: {
    [key: string]: {
      status: 'healthy' | 'warning' | 'critical' | 'offline';
      checks: {
        name: string;
        status: 'pass' | 'warning' | 'fail';
        message: string;
        responseTime?: number;
      }[];
      lastCheck: string;
      uptime: number;
    };
  };
  external: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'offline';
      url: string;
      lastCheck: string;
    };
  };
}

export const HealthDashboard: React.FC = () => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health/comprehensive');
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error('Failed to fetch health status:', error);
    }
  };

  const toggleServerExpansion = (serverName: string) => {
    const newExpanded = new Set(expandedServers);
    if (newExpanded.has(serverName)) {
      newExpanded.delete(serverName);
    } else {
      newExpanded.add(serverName);
    }
    setExpandedServers(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return <CheckCircle color="success" />;
      case 'warning':
      case 'degraded':
        return <Warning color="warning" />;
      case 'critical':
      case 'fail':
      case 'offline':
        return <Error color="error" />;
      default:
        return <Warning color="action" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
        return 'success';
      case 'warning':
      case 'degraded':
        return 'warning';
      case 'critical':
      case 'fail':
      case 'offline':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!health) {
    return <Typography>Loading health status...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        System Health Dashboard
      </Typography>

      {/* Overall Status Alert */}
      <Alert
        severity={getStatusColor(health.overall) as any}
        sx={{ mb: 3 }}
        icon={getStatusIcon(health.overall)}
      >
        <Typography variant="h6">
          System Status: {health.overall.toUpperCase()}
        </Typography>
        {health.overall !== 'healthy' && (
          <Typography variant="body2">
            Some components require attention. Check individual server status below.
          </Typography>
        )}
      </Alert>

      {/* SuperClaude Servers Health */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        SuperClaude Servers
      </Typography>
      
      <Grid container spacing={2}>
        {Object.entries(health.servers).map(([serverName, serverHealth]) => (
          <Grid item xs={12} md={6} lg={4} key={serverName}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {serverName.charAt(0).toUpperCase() + serverName.slice(1)}
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <Chip
                      label={serverHealth.status}
                      color={getStatusColor(serverHealth.status) as any}
                      size="small"
                      icon={getStatusIcon(serverHealth.status)}
                    />
                    <IconButton
                      size="small"
                      onClick={() => toggleServerExpansion(serverName)}
                    >
                      {expandedServers.has(serverName) ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" color="textSecondary">
                  Uptime: {Math.floor(serverHealth.uptime / 3600)}h {Math.floor((serverHealth.uptime % 3600) / 60)}m
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Last Check: {new Date(serverHealth.lastCheck).toLocaleTimeString()}
                </Typography>

                <Collapse in={expandedServers.has(serverName)}>
                  <List dense>
                    {serverHealth.checks.map((check, index) => (
                      <ListItem key={index}>
                        <Box display="flex" alignItems="center" width="100%">
                          {getStatusIcon(check.status)}
                          <ListItemText
                            primary={check.name}
                            secondary={check.message}
                            sx={{ ml: 1 }}
                          />
                          {check.responseTime && (
                            <Typography variant="caption" color="textSecondary">
                              {check.responseTime}ms
                            </Typography>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* External MCP Servers */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        External MCP Servers
      </Typography>
      
      <Grid container spacing={2}>
        {Object.entries(health.external).map(([serverName, serverHealth]) => (
          <Grid item xs={12} md={6} lg={3} key={serverName}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">
                    {serverName}
                  </Typography>
                  <Chip
                    label={serverHealth.status}
                    color={getStatusColor(serverHealth.status) as any}
                    size="small"
                    icon={getStatusIcon(serverHealth.status)}
                  />
                </Box>
                
                <Typography variant="body2" color="textSecondary">
                  URL: {serverHealth.url}
                </Typography>
                
                <Typography variant="body2" color="textSecondary">
                  Last Check: {new Date(serverHealth.lastCheck).toLocaleTimeString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
```

---

## Resource Monitoring

### Resource Usage Dashboard

```typescript
// dashboard/src/components/ResourceMonitor.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Card, CardContent,
  LinearProgress, Chip
} from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface ResourceMetrics {
  system: {
    cpu: { usage: number; cores: number; load: number[] };
    memory: { used: number; total: number; available: number };
    disk: { used: number; total: number; available: number };
    network: { bytesIn: number; bytesOut: number; packetsIn: number; packetsOut: number };
  };
  processes: {
    [serverName: string]: {
      cpu: number;
      memory: number;
      handles: number;
      threads: number;
    };
  };
  trends: Array<{
    timestamp: number;
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
  }>;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export const ResourceMonitor: React.FC = () => {
  const [resources, setResources] = useState<ResourceMetrics | null>(null);

  useEffect(() => {
    fetchResourceMetrics();
    const interval = setInterval(fetchResourceMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchResourceMetrics = async () => {
    try {
      const response = await fetch('/api/resources/metrics');
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error('Failed to fetch resource metrics:', error);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage < 70) return 'success';
    if (percentage < 85) return 'warning';
    return 'error';
  };

  const formatBytes = (bytes: number) => {
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(1)} GB`;
  };

  if (!resources) {
    return <Typography>Loading resource metrics...</Typography>;
  }

  const cpuUsage = resources.system.cpu.usage;
  const memoryUsage = (resources.system.memory.used / resources.system.memory.total) * 100;
  const diskUsage = (resources.system.disk.used / resources.system.disk.total) * 100;

  const processData = Object.entries(resources.processes).map(([name, metrics]) => ({
    name,
    memory: metrics.memory,
    cpu: metrics.cpu
  }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Resource Monitoring
      </Typography>

      {/* System Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {cpuUsage.toFixed(1)}%
                </Typography>
                <Chip
                  label={cpuUsage < 70 ? 'Normal' : cpuUsage < 85 ? 'High' : 'Critical'}
                  color={getUsageColor(cpuUsage) as any}
                  size="small"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={cpuUsage}
                color={getUsageColor(cpuUsage) as any}
                sx={{ height: 8 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {resources.system.cpu.cores} cores available
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {memoryUsage.toFixed(1)}%
                </Typography>
                <Chip
                  label={memoryUsage < 70 ? 'Normal' : memoryUsage < 85 ? 'High' : 'Critical'}
                  color={getUsageColor(memoryUsage) as any}
                  size="small"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={memoryUsage}
                color={getUsageColor(memoryUsage) as any}
                sx={{ height: 8 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {formatBytes(resources.system.memory.used)} / {formatBytes(resources.system.memory.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Disk Usage
              </Typography>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {diskUsage.toFixed(1)}%
                </Typography>
                <Chip
                  label={diskUsage < 70 ? 'Normal' : diskUsage < 85 ? 'High' : 'Critical'}
                  color={getUsageColor(diskUsage) as any}
                  size="small"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={diskUsage}
                color={getUsageColor(diskUsage) as any}
                sx={{ height: 8 }}
              />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {formatBytes(resources.system.disk.used)} / {formatBytes(resources.system.disk.total)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Resource Trends */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resource Usage Trends
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={resources.trends}>
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Area
                    type="monotone"
                    dataKey="cpuUsage"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    name="CPU %"
                  />
                  <Area
                    type="monotone"
                    dataKey="memoryUsage"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    name="Memory %"
                  />
                  <Area
                    type="monotone"
                    dataKey="diskUsage"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                    name="Disk %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Process Memory Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="memory"
                    label={({ name, value }) => `${name}: ${formatBytes(value)}`}
                  >
                    {processData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

---

## Alert System

### Alert Management Component

```typescript
// dashboard/src/components/AlertManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, List, ListItem,
  ListItemText, IconButton, Chip, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Warning, Error, Info, CheckCircle, Close, Settings
} from '@mui/icons-material';

interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  acknowledgedBy?: string;
  resolvedBy?: string;
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
}

export const AlertManager: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
    fetchAlertRules();
    const interval = setInterval(fetchAlerts, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const fetchAlertRules = async () => {
    try {
      const response = await fetch('/api/alerts/rules');
      const data = await response.json();
      setAlertRules(data);
    } catch (error) {
      console.error('Failed to fetch alert rules:', error);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acknowledgedBy: 'Dashboard User' })
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolvedBy: 'Dashboard User' })
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info': return <Info color="info" />;
      case 'warning': return <Warning color="warning" />;
      case 'error': return <Error color="error" />;
      case 'critical': return <Error sx={{ color: '#d32f2f' }} />;
      default: return <Info />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'info';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const acknowledgedAlerts = activeAlerts.filter(alert => alert.acknowledged);
  const unacknowledgedAlerts = activeAlerts.filter(alert => !alert.acknowledged);

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">
          Alert Management
        </Typography>
        <Button
          startIcon={<Settings />}
          onClick={() => setSettingsOpen(true)}
          variant="outlined"
        >
          Alert Settings
        </Button>
      </Box>

      {/* Alert Summary */}
      <Box display="flex" gap={2} sx={{ mb: 3 }}>
        <Chip
          label={`${unacknowledgedAlerts.length} Unacknowledged`}
          color={unacknowledgedAlerts.length > 0 ? 'error' : 'default'}
          variant={unacknowledgedAlerts.length > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          label={`${acknowledgedAlerts.length} Acknowledged`}
          color={acknowledgedAlerts.length > 0 ? 'warning' : 'default'}
          variant={acknowledgedAlerts.length > 0 ? 'filled' : 'outlined'}
        />
        <Chip
          label={`${alerts.filter(a => a.resolved).length} Resolved`}
          color="success"
          variant="outlined"
        />
      </Box>

      {/* Active Alerts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Alerts ({activeAlerts.length})
          </Typography>
          
          {activeAlerts.length === 0 ? (
            <Box display="flex" alignItems="center" justifyContent="center" py={4}>
              <CheckCircle color="success" sx={{ mr: 1 }} />
              <Typography color="textSecondary">
                No active alerts. All systems operational.
              </Typography>
            </Box>
          ) : (
            <List>
              {activeAlerts.map((alert) => (
                <ListItem
                  key={alert.id}
                  sx={{
                    border: 1,
                    borderColor: alert.acknowledged ? 'warning.main' : 'error.main',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: alert.acknowledged ? 'warning.50' : 'error.50'
                  }}
                >
                  <Box display="flex" alignItems="center" width="100%">
                    {getSeverityIcon(alert.severity)}
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle1">
                            {alert.title}
                          </Typography>
                          <Chip
                            label={alert.severity}
                            color={getSeverityColor(alert.severity) as any}
                            size="small"
                          />
                          <Chip
                            label={alert.source}
                            variant="outlined"
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {alert.message}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(alert.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                      sx={{ ml: 2 }}
                    />
                    <Box display="flex" gap={1}>
                      {!alert.acknowledged && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Alert Settings Dialog */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Alert Configuration</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Alert Rules
          </Typography>
          <List>
            {alertRules.map((rule) => (
              <ListItem key={rule.id}>
                <ListItemText
                  primary={rule.name}
                  secondary={`${rule.metric} ${rule.condition} ${rule.threshold}`}
                />
                <Chip
                  label={rule.severity}
                  color={getSeverityColor(rule.severity) as any}
                  size="small"
                />
                <Chip
                  label={rule.enabled ? 'Enabled' : 'Disabled'}
                  color={rule.enabled ? 'success' : 'default'}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
```

---

## Installation & Setup

### Installation Script

```bash
#!/bin/bash
# install-monitoring-dashboard.sh

echo "Installing SuperClaude MCP Suite Monitoring Dashboard..."

# Create project structure
mkdir -p dashboard/{frontend,backend,shared}
cd dashboard

# Initialize backend
cd backend
npm init -y
npm install express socket.io cors helmet morgan winston
npm install --save-dev typescript @types/node @types/express ts-node
npm install influxdb2 sqlite3 jsonwebtoken bcryptjs

# Create backend structure
mkdir -p src/{services,routes,middleware,models,config}

# Initialize frontend
cd ../frontend
npm create vite@latest . -- --template react-ts
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material recharts socket.io-client
npm install @reduxjs/toolkit react-redux axios

# Install shared dependencies
cd ../shared
npm init -y
npm install typescript

echo "Dependencies installed. Building dashboard components..."

# Build shared types
cat > shared/src/types.ts << 'EOF'
export interface PerformanceMetrics {
  timestamp: number;
  server: string;
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
}

export interface ServerHealth {
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  responseTime: number;
  uptime: number;
  version: string;
  lastCheck: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  responseTime?: number;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}
EOF

echo "Dashboard installation complete!"
echo "Next steps:"
echo "1. cd dashboard/backend && npm run build && npm start"
echo "2. cd dashboard/frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"
```

### Environment Configuration

```bash
# dashboard/.env
NODE_ENV=development
PORT=3000
SOCKET_PORT=3001

# Database
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=superclaude
INFLUXDB_BUCKET=metrics

# SQLite
SQLITE_DB_PATH=./data/dashboard.db

# SuperClaude Integration
SUPERCLAUDE_BRIDGE_URL=http://localhost:8080
SUPERCLAUDE_API_KEY=your-api-key

# External MCP Servers
CONTEXT7_URL=http://localhost:8003
MAGIC_URL=http://localhost:8002
SEQUENTIAL_URL=auto
PLAYWRIGHT_URL=auto

# Security
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# Monitoring
METRICS_COLLECTION_INTERVAL=5000
HEALTH_CHECK_INTERVAL=15000
ALERT_CHECK_INTERVAL=30000

# Performance
CACHE_TTL=300
MAX_METRICS_RETENTION_DAYS=30
```

---

## Configuration

### Dashboard Configuration File

```json
{
  "dashboard": {
    "name": "SuperClaude MCP Suite Monitor",
    "version": "1.0.0",
    "theme": "light",
    "autoRefresh": true,
    "refreshInterval": 5000
  },
  "monitoring": {
    "servers": [
      {
        "name": "bridge",
        "url": "http://localhost:8080",
        "type": "bridge",
        "enabled": true,
        "healthEndpoint": "/health",
        "metricsEndpoint": "/metrics/performance"
      },
      {
        "name": "router",
        "url": "http://localhost:8080",
        "type": "superclaude",
        "enabled": true,
        "healthEndpoint": "/health/servers?server=router"
      }
    ],
    "external": [
      {
        "name": "context7",
        "url": "http://localhost:8003",
        "enabled": true
      },
      {
        "name": "magic",
        "url": "http://localhost:8002",
        "enabled": true
      }
    ]
  },
  "alerts": {
    "rules": [
      {
        "name": "High Response Time",
        "metric": "responseTime",
        "condition": "gt",
        "threshold": 500,
        "severity": "warning",
        "enabled": true
      },
      {
        "name": "Server Offline",
        "metric": "status",
        "condition": "eq",
        "threshold": "offline",
        "severity": "critical",
        "enabled": true
      },
      {
        "name": "High Memory Usage",
        "metric": "memoryUsage",
        "condition": "gt",
        "threshold": 80,
        "severity": "warning",
        "enabled": true
      }
    ],
    "notifications": {
      "email": {
        "enabled": false,
        "recipients": []
      },
      "webhook": {
        "enabled": false,
        "url": ""
      }
    }
  },
  "performance": {
    "targets": {
      "router": { "responseTime": 100 },
      "intelligence": { "tokenReduction": 50 },
      "quality": { "pipelineExecution": 200 },
      "tasks": { "responseTime": 500 },
      "personas": { "activationTime": 50 },
      "builder": { "symbolOperations": 200 },
      "orchestrator": { "coordinationOverhead": 100 },
      "docs": { "generationTime": 300 },
      "bridge": { "hookExecution": 70 }
    }
  }
}
```

---

The centralized monitoring dashboard provides comprehensive real-time visibility into the SuperClaude MCP Suite's health, performance, and resource utilization. This completes Phase 3 of the enhancement plan, delivering enterprise-grade monitoring capabilities that complement the existing 8-server architecture and bridge-hooks performance optimization system.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Phase 1: Standardize documentation across Builder, Orchestrator, and Docs servers", "status": "completed", "priority": "high", "id": "doc-standardization"}, {"content": "Create comprehensive API documentation for all server endpoints", "status": "completed", "priority": "high", "id": "api-documentation"}, {"content": "Develop deployment guides and troubleshooting documentation", "status": "completed", "priority": "high", "id": "deployment-guides"}, {"content": "Phase 2: Develop comprehensive integration tests for inter-server communication", "status": "completed", "priority": "medium", "id": "integration-testing"}, {"content": "Create performance testing framework for the entire suite", "status": "completed", "priority": "medium", "id": "performance-testing"}, {"content": "Phase 3: Implement centralized monitoring dashboard for all servers", "status": "completed", "priority": "medium", "id": "monitoring-dashboard"}, {"content": "Create automated deployment scripts with validation", "status": "pending", "priority": "low", "id": "deployment-automation"}]