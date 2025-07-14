import { SYSTEM_PERFORMANCE_TARGETS, HookType } from '../types/index.js';

describe('SuperClaude Hooks Unit Tests', () => {
  describe('System Performance Targets', () => {
    test('should have correct performance targets', () => {
      expect(SYSTEM_PERFORMANCE_TARGETS.OVERALL_AVERAGE_TIME).toBe(62);
      expect(SYSTEM_PERFORMANCE_TARGETS.OVERALL_OPTIMIZATION_FACTOR).toBe(2.84);
      expect(SYSTEM_PERFORMANCE_TARGETS.CACHE_HIT_RATE_MINIMUM).toBe(0.8);
      expect(SYSTEM_PERFORMANCE_TARGETS.RELIABILITY_TARGET).toBe(1.0);
      expect(SYSTEM_PERFORMANCE_TARGETS.CONCURRENT_OPERATIONS_TARGET).toBe(500);
      expect(SYSTEM_PERFORMANCE_TARGETS.THROUGHPUT_TARGET).toBe(5000);
    });
  });

  describe('Hook Types', () => {
    test('should have all 7 hook types defined', () => {
      const hookTypes = Object.values(HookType);
      expect(hookTypes).toHaveLength(7);
      expect(hookTypes).toContain(HookType.PreToolUse);
      expect(hookTypes).toContain(HookType.PostToolUse);
      expect(hookTypes).toContain(HookType.PrePrompt);
      expect(hookTypes).toContain(HookType.PostPrompt);
      expect(hookTypes).toContain(HookType.PreCompact);
      expect(hookTypes).toContain(HookType.Stop);
      expect(hookTypes).toContain(HookType.SubagentStop);
    });
  });
});