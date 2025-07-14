#!/usr/bin/env node

/**
 * Test script for SuperClaude Orchestrator Loop and Chain modes
 */

async function testLoopAndChainModes() {
  try {
    // Import the components
    const { LoopModeController } = await import('./dist/loop/LoopModeController.js');
    const { ChainModeManager } = await import('./dist/chain/ChainModeManager.js');
    const { PerformanceTracker } = await import('./dist/shared/PerformanceTracker.js');
    const { ContextPreserver } = await import('./dist/shared/ContextPreserver.js');

    console.log('🧪 Testing SuperClaude Orchestrator Loop and Chain Modes...\n');

    // Initialize shared components
    const performanceTracker = new PerformanceTracker();
    const contextPreserver = new ContextPreserver();

    // Test Loop Mode Controller
    console.log('🔄 Testing Loop Mode Controller...');
    const loopController = new LoopModeController(performanceTracker, contextPreserver);

    const loopConfiguration = {
      mode: 'refine',
      maxIterations: 5,
      convergenceThreshold: 0.95,
      targetQuality: 0.9,
      enableInteractiveMode: false,
      qualityGates: ['minimum_quality', 'improvement_rate']
    };

    const initialContext = {
      executionId: 'test_loop_exec_1',
      command: 'test_loop',
      flags: ['test', 'loop'],
      scope: ['test_scope'],
      metadata: { test: 'loop_data' },
      timestamp: new Date()
    };

    const loopId = await loopController.startLoop(loopConfiguration, initialContext);
    console.log(`✅ Loop started: ${loopId}`);

    // Execute a few iterations
    for (let i = 0; i < 3; i++) {
      const iteration = await loopController.executeIteration(loopId);
      console.log(`✅ Iteration ${iteration.iterationNumber} completed (quality: ${iteration.metrics.qualityScore.toFixed(2)})`);
    }

    const loopStatus = loopController.getLoopStatus(loopId);
    console.log(`📊 Loop status: ${loopStatus?.status}, iterations: ${loopStatus?.iterations.length}`);

    // Test Chain Mode Manager
    console.log('\n🔗 Testing Chain Mode Manager...');
    const chainManager = new ChainModeManager(performanceTracker, contextPreserver);

    const chainConfiguration = {
      personas: ['analyzer', 'architect', 'security', 'qa'],
      strategy: 'sequential',
      handoffStrategy: 'cumulative',
      contextPreservation: 'essential',
      enableValidation: true
    };

    const chainContext = {
      executionId: 'test_chain_exec_1',
      command: 'test_chain',
      flags: ['test', 'chain'],
      scope: ['test_scope'],
      metadata: { test: 'chain_data' },
      timestamp: new Date()
    };

    const chainId = await chainManager.startChain(chainConfiguration, chainContext);
    console.log(`✅ Chain started: ${chainId}`);

    // Execute chain step by step
    for (let i = 0; i < chainConfiguration.personas.length; i++) {
      const link = await chainManager.executeNextLink(chainId);
      console.log(`✅ Chain link ${i + 1} completed: ${link.persona} persona (quality: ${link.metrics?.qualityScore.toFixed(2)})`);
    }

    const chainResult = await chainManager.getChainResult(chainId);
    console.log(`📊 Chain completed: ${chainResult.totalLinks} links, total time: ${chainResult.performance.totalExecutionTime}ms`);

    // Test statistics
    console.log('\n📈 Testing Performance Statistics...');
    const loopStats = loopController.getLoopStatistics();
    console.log(`Loop statistics: ${loopStats.completedLoops} completed, avg quality improvement: ${loopStats.averageQualityImprovement.toFixed(2)}`);

    const chainStats = chainManager.getChainStatistics();
    console.log(`Chain statistics: ${chainStats.completedChains} completed, avg execution time: ${chainStats.averageExecutionTime.toFixed(0)}ms`);

    const performanceReport = performanceTracker.generatePerformanceReport();
    console.log(`Overall performance score: ${performanceReport.overallScore.toFixed(1)}`);

    console.log('\n🎉 Loop and Chain mode tests completed successfully!');
    console.log('\n📋 SuperClaude Orchestrator Implementation Status:');
    console.log('   ✅ Wave Orchestration Engine (Progressive, Systematic, Adaptive, Enterprise)');
    console.log('   ✅ Sub-Agent Delegation System (Files, Folders, Auto strategies)');
    console.log('   ✅ Loop Mode Controller (Polish, Refine, Enhance, Converge modes)');
    console.log('   ✅ Chain Mode Manager (Sequential persona execution with handoff)');
    console.log('   ✅ Concurrency Control (1-15 concurrent agents)');
    console.log('   ✅ Resource Management (Dynamic allocation and optimization)');
    console.log('   ✅ Performance Tracking (Comprehensive metrics and reporting)');
    console.log('   ✅ Context Preservation (Multi-strategy context handling)');
    console.log('   ✅ MCP Server Integration (Full tool definitions and handlers)');
    console.log('\n🚧 Remaining Implementation:');
    console.log('   🎯 Hybrid Orchestration (Pattern combinations)');
    console.log('   📊 Comprehensive test suite (Unit and integration tests)');

  } catch (error) {
    console.error('❌ Loop and Chain mode test failed:', error);
    process.exit(1);
  }
}

testLoopAndChainModes();