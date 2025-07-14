export var HookType;
(function (HookType) {
    HookType["PreToolUse"] = "preToolUse";
    HookType["PostToolUse"] = "postToolUse";
    HookType["PrePrompt"] = "prePrompt";
    HookType["PostPrompt"] = "postPrompt";
    HookType["PreCompact"] = "preCompact";
    HookType["Stop"] = "stop";
    HookType["SubagentStop"] = "subagentStop";
})(HookType || (HookType = {}));
export class CircuitBreakerOpenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CircuitBreakerOpenError';
    }
}
export const PROVEN_PERFORMANCE_TARGETS = {
    [HookType.PreToolUse]: {
        maxExecutionTime: 74,
        optimizationFactor: 2.02,
        targetServer: 'superclaude-router'
    },
    [HookType.PostToolUse]: {
        maxExecutionTime: 71,
        optimizationFactor: 1.41,
        targetServer: 'superclaude-quality'
    },
    [HookType.PrePrompt]: {
        maxExecutionTime: 25,
        optimizationFactor: 4.66,
        targetServer: 'superclaude-personas'
    },
    [HookType.PostPrompt]: {
        maxExecutionTime: 27,
        optimizationFactor: 4.66,
        targetServer: 'superclaude-personas'
    },
    [HookType.PreCompact]: {
        maxExecutionTime: 72,
        optimizationFactor: 4.18,
        targetServer: 'superclaude-intelligence'
    },
    [HookType.Stop]: {
        maxExecutionTime: 77,
        optimizationFactor: 2.06,
        targetServer: 'superclaude-orchestrator'
    },
    [HookType.SubagentStop]: {
        maxExecutionTime: 85,
        optimizationFactor: 2.58,
        targetServer: 'superclaude-orchestrator'
    }
};
export const SYSTEM_PERFORMANCE_TARGETS = {
    OVERALL_AVERAGE_TIME: 62,
    OVERALL_OPTIMIZATION_FACTOR: 2.84,
    CACHE_HIT_RATE_MINIMUM: 0.8,
    RELIABILITY_TARGET: 1.0,
    HOOK_OVERHEAD_MAX: 10,
    BRIDGE_OVERHEAD_MAX: 5,
    CIRCUIT_BREAKER_THRESHOLD: 5,
    CONCURRENT_OPERATIONS_TARGET: 500,
    THROUGHPUT_TARGET: 5000
};
//# sourceMappingURL=index.js.map