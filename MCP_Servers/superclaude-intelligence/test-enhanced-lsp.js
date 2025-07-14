#!/usr/bin/env node
/**
 * Test Script for Enhanced LSP Manager v3.0
 * Validates LSP integration plan implementation
 */

import { EnhancedLSPManager } from './src/core/EnhancedLSPManager.ts';

async function testEnhancedLSPManager() {
  console.log('🚀 Testing Enhanced LSP Manager v3.0 Implementation');
  console.log('=' .repeat(60));

  // Initialize Enhanced LSP Manager
  const config = {
    enableMultiLanguageSupport: true,
    supportedLanguages: ['typescript', 'python', 'go', 'rust', 'javascript'],
    maxConcurrentServers: 8,
    serverStartupTimeout: 30000,
    enableIncrementalSync: true
  };

  const lspManager = new EnhancedLSPManager(config);

  try {
    // Test 1: Initialization
    console.log('\n📋 Test 1: Enhanced LSP Manager Initialization');
    await lspManager.initialize();
    
    const capabilities = lspManager.getCapabilities();
    console.log('✅ Capabilities:', JSON.stringify(capabilities, null, 2));

    // Test 2: Token Reduction Performance
    console.log('\n🎯 Test 2: Token Reduction & Semantic Caching');
    
    const testRequests = [
      {
        language: 'typescript',
        method: 'textDocument/documentSymbol',
        params: {
          textDocument: { uri: 'file:///test/component.tsx' }
        }
      },
      {
        language: 'python',
        method: 'textDocument/hover',
        params: {
          textDocument: { uri: 'file:///test/model.py' },
          position: { line: 10, character: 15 }
        }
      },
      {
        language: 'go',
        method: 'textDocument/definition',
        params: {
          textDocument: { uri: 'file:///test/handler.go' },
          position: { line: 25, character: 8 }
        }
      }
    ];

    for (const request of testRequests) {
      console.log(`\n  → Testing ${request.language} ${request.method}`);
      
      const startTime = performance.now();
      const result = await lspManager.sendRequestEnhanced(
        request.language,
        request.method,
        request.params
      );
      const duration = performance.now() - startTime;
      
      console.log(`    ⏱️  Response time: ${duration.toFixed(2)}ms`);
      console.log(`    📊 Result type: ${typeof result}`);
      
      // Test cache hit on second request
      const cacheStartTime = performance.now();
      await lspManager.sendRequestEnhanced(
        request.language,
        request.method,
        request.params
      );
      const cacheDuration = performance.now() - cacheStartTime;
      
      console.log(`    💾 Cache hit time: ${cacheDuration.toFixed(2)}ms`);
      console.log(`    🚀 Cache speedup: ${(duration / cacheDuration).toFixed(1)}x`);
    }

    // Test 3: Batch Processing
    console.log('\n⚡ Test 3: Batch Processing Performance');
    
    const batchRequests = testRequests.map((req, i) => ({
      id: `batch_${i}`,
      ...req
    }));

    const batchStartTime = performance.now();
    const batchResult = await lspManager.batchRequests(batchRequests);
    const batchDuration = performance.now() - batchStartTime;

    console.log(`  📦 Batch size: ${batchRequests.length} requests`);
    console.log(`  ⏱️  Total time: ${batchDuration.toFixed(2)}ms`);
    console.log(`  ✅ Success count: ${batchResult.successCount}`);
    console.log(`  ❌ Failure count: ${batchResult.failureCount}`);
    console.log(`  🎯 Token reduction: ${batchResult.tokenReductionAchieved ? 'Enabled' : 'Disabled'}`);

    // Test 4: Integration Metrics
    console.log('\n📊 Test 4: LSP Integration Metrics');
    
    const metrics = lspManager.getLSPIntegrationMetrics();
    console.log('  Performance Metrics:');
    console.log(`    • Total servers: ${metrics.totalServers}`);
    console.log(`    • Active servers: ${metrics.activeServers}`);
    console.log(`    • Total requests: ${metrics.totalRequests}`);
    console.log(`    • Avg response time: ${metrics.averageResponseTime.toFixed(2)}ms`);
    console.log(`    • Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`    • Token reduction: ${metrics.tokenReductionRate.toFixed(1)}%`);
    console.log(`    • Error rate: ${(metrics.errorRate * 100).toFixed(2)}%`);
    console.log(`    • Uptime: ${(metrics.uptime / 1000).toFixed(1)}s`);

    // Test 5: Server Health Monitoring
    console.log('\n🏥 Test 5: Server Health Monitoring');
    
    for (const language of config.supportedLanguages) {
      const health = lspManager.getServerHealth(language);
      if (health) {
        console.log(`  ${language}:`);
        console.log(`    • Status: ${health.status}`);
        console.log(`    • Response time: ${health.responseTime.toFixed(2)}ms`);
        console.log(`    • Error rate: ${(health.errorRate * 100).toFixed(2)}%`);
        console.log(`    • Token reduction: ${health.tokenReductionRate.toFixed(1)}%`);
        console.log(`    • Cache hit rate: ${(health.cacheHitRate * 100).toFixed(1)}%`);
      }
    }

    // Test 6: Connection Pool Optimization
    console.log('\n🔧 Test 6: Connection Pool Optimization');
    
    const optimizationResult = await lspManager.optimizeConnectionPool();
    console.log(`  🎯 Optimizations applied: ${optimizationResult.optimizations.length}`);
    console.log(`  🔗 Total connections: ${optimizationResult.totalConnectionsAfter}`);
    console.log(`  💾 Memory reduced: ${optimizationResult.memoryReduced}MB`);
    console.log(`  ⚡ Performance improvement: ${optimizationResult.performanceImprovement}%`);
    
    for (const opt of optimizationResult.optimizations) {
      console.log(`    • ${opt.type} for ${opt.language}: +${opt.improvement}% improvement`);
    }

    // Test 7: Target Validation
    console.log('\n🎯 Test 7: LSP Integration Plan Target Validation');
    console.log('  Checking against plan targets:');
    
    // Check 50% token reduction target
    const tokenReductionTarget = 50;
    const actualTokenReduction = metrics.tokenReductionRate;
    const tokenReductionPassed = actualTokenReduction >= tokenReductionTarget;
    console.log(`    • Token Reduction: ${actualTokenReduction.toFixed(1)}% (target: ${tokenReductionTarget}%) ${tokenReductionPassed ? '✅' : '❌'}`);
    
    // Check 80% cache hit rate target
    const cacheHitTarget = 0.8;
    const actualCacheHit = metrics.cacheHitRate;
    const cacheHitPassed = actualCacheHit >= cacheHitTarget;
    console.log(`    • Cache Hit Rate: ${(actualCacheHit * 100).toFixed(1)}% (target: 80%) ${cacheHitPassed ? '✅' : '❌'}`);
    
    // Check <300ms response time target
    const responseTimeTarget = 300;
    const actualResponseTime = metrics.averageResponseTime;
    const responseTimePassed = actualResponseTime < responseTimeTarget;
    console.log(`    • Response Time: ${actualResponseTime.toFixed(2)}ms (target: <300ms) ${responseTimePassed ? '✅' : '❌'}`);
    
    // Check <2% error rate target
    const errorRateTarget = 0.02;
    const actualErrorRate = metrics.errorRate;
    const errorRatePassed = actualErrorRate < errorRateTarget;
    console.log(`    • Error Rate: ${(actualErrorRate * 100).toFixed(2)}% (target: <2%) ${errorRatePassed ? '✅' : '❌'}`);

    // Overall assessment
    const allTargetsPassed = tokenReductionPassed && cacheHitPassed && responseTimePassed && errorRatePassed;
    console.log(`\n  Overall Plan Compliance: ${allTargetsPassed ? '✅ PASSED' : '⚠️  NEEDS IMPROVEMENT'}`);

    console.log('\n🔄 Test 8: Incremental Updates');
    
    await lspManager.handleIncrementalChange('file:///test/component.tsx', [
      { text: 'const newFunction = () => {};\n', range: { start: { line: 10, character: 0 }, end: { line: 10, character: 0 } } }
    ]);
    console.log('    ✅ Incremental update processed successfully');

    // Cleanup
    console.log('\n🧹 Cleanup: Shutting down LSP Manager');
    await lspManager.shutdown();
    console.log('    ✅ Shutdown completed');

    console.log('\n🎉 Enhanced LSP Manager v3.0 Test Complete!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testEnhancedLSPManager().catch(console.error);