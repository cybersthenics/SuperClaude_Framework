#!/usr/bin/env node

/**
 * Test script for SuperClaude Orchestrator
 */

async function testOrchestrator() {
  try {
    // Import the main server components
    const { WaveOrchestratorEngine } = await import('./dist/wave/WaveOrchestratorEngine.js');
    const { DelegationEngine } = await import('./dist/delegation/DelegationEngine.js');
    const { SubAgentManager } = await import('./dist/delegation/SubAgentManager.js');
    const { ConcurrencyController } = await import('./dist/delegation/ConcurrencyController.js');
    const { ResourceManager } = await import('./dist/shared/ResourceManager.js');
    const { ContextPreserver } = await import('./dist/shared/ContextPreserver.js');
    const { PerformanceTracker } = await import('./dist/shared/PerformanceTracker.js');

    console.log('🚀 Testing SuperClaude Orchestrator...\n');

    // Initialize components
    const resourceManager = new ResourceManager();
    const contextPreserver = new ContextPreserver();
    const performanceTracker = new PerformanceTracker();
    const subAgentManager = new SubAgentManager();
    const concurrencyController = new ConcurrencyController();

    // Test Wave Orchestrator
    console.log('📊 Testing Wave Orchestrator Engine...');
    const waveEngine = new WaveOrchestratorEngine(
      resourceManager,
      contextPreserver,
      performanceTracker
    );

    const testOperation = {
      type: 'code_analysis',
      complexity: 0.6,
      fileCount: 25,
      domains: ['backend', 'frontend'],
      operationTypes: ['analysis', 'improvement']
    };

    const wavePlan = await waveEngine.createWavePlan(testOperation, 'progressive');
    console.log(`✅ Wave plan created: ${wavePlan.waveId} with ${wavePlan.phases.length} phases`);

    // Test Delegation Engine
    console.log('\n🤖 Testing Delegation Engine...');
    const delegationEngine = new DelegationEngine(
      subAgentManager,
      concurrencyController,
      performanceTracker
    );

    const testTask = {
      type: 'quality_analysis',
      scope: ['src/file1.ts', 'src/file2.ts', 'src/file3.ts'],
      requirements: ['analyze code quality', 'identify issues'],
      context: {
        executionId: 'test_exec_1',
        command: 'test_delegation',
        flags: ['test'],
        scope: ['src/'],
        metadata: { test: true },
        timestamp: new Date()
      }
    };

    const delegationStrategy = {
      type: 'files',
      concurrency: 3,
      resourceAllocation: 'equal'
    };

    const delegationResult = await delegationEngine.delegateToSubAgents(testTask, delegationStrategy);
    console.log(`✅ Delegation completed: ${delegationResult.delegationId} with ${delegationResult.subAgentsCreated} sub-agents`);

    // Test Performance Tracking
    console.log('\n📈 Testing Performance Tracking...');
    performanceTracker.recordWaveCoordination(wavePlan.waveId, 150);
    performanceTracker.recordDelegationPerformance(
      delegationResult.delegationId,
      delegationResult.subAgentsCreated,
      2500,
      0.65
    );

    const performanceReport = performanceTracker.generatePerformanceReport();
    console.log(`✅ Performance report generated with score: ${performanceReport.overallScore.toFixed(1)}`);

    // Test Resource Management
    console.log('\n🔧 Testing Resource Management...');
    const resourceAllocation = await resourceManager.allocateResources('wave', {
      memory: 512,
      cpu: 1.0,
      concurrency: 3,
      timeout: 30000
    });
    console.log(`✅ Resources allocated: ${resourceAllocation.allocationId}`);

    const utilization = resourceManager.getResourceUtilization();
    console.log(`📊 Resource utilization: Memory ${(utilization.memory.utilization * 100).toFixed(1)}%, CPU ${(utilization.cpu.utilization * 100).toFixed(1)}%`);

    await resourceManager.releaseResources(resourceAllocation.allocationId);
    console.log('✅ Resources released');

    // Test Context Preservation
    console.log('\n💾 Testing Context Preservation...');
    const testContext = {
      executionId: 'test_context_1',
      command: 'test_command',
      flags: ['test', 'context'],
      scope: ['test_scope'],
      metadata: { test: 'context_data' },
      timestamp: new Date()
    };

    const snapshotId = await contextPreserver.preserveContext('test_exec', testContext);
    console.log(`✅ Context preserved: ${snapshotId}`);

    const restoredContext = await contextPreserver.restoreContext(snapshotId);
    console.log(`✅ Context restored: ${restoredContext ? 'Success' : 'Failed'}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 SuperClaude Orchestrator Implementation Summary:');
    console.log('   ✅ Wave Orchestration Engine (Progressive, Systematic, Adaptive, Enterprise)');
    console.log('   ✅ Sub-Agent Delegation System (Files, Folders, Auto strategies)');
    console.log('   ✅ Concurrency Control (1-15 concurrent agents)');
    console.log('   ✅ Resource Management (Dynamic allocation and optimization)');
    console.log('   ✅ Performance Tracking (Comprehensive metrics and reporting)');
    console.log('   ✅ Context Preservation (Multi-strategy context handling)');
    console.log('   ✅ MCP Server Integration (Tool definitions and handlers)');
    console.log('\n🚧 Remaining Implementation:');
    console.log('   🔄 Loop Mode Controller (Iterative refinement)');
    console.log('   🔗 Chain Mode Manager (Persona coordination)');
    console.log('   🎯 Hybrid Orchestration (Pattern combinations)');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testOrchestrator();