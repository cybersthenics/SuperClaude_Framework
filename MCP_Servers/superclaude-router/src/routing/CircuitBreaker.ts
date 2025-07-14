import { 
  CircuitBreakerInterface, 
  CircuitBreakerState 
} from '../types/index.js';

export class CircuitBreaker implements CircuitBreakerInterface {
  private circuitStates: Map<string, CircuitBreakerState> = new Map();
  private defaultThreshold = 5;
  private defaultTimeout = 60000; // 1 minute

  checkServerAvailability(serverName: string): boolean {
    const state = this.getState(serverName);
    
    if (!state.isOpen) {
      return true;
    }

    if (state.nextAttemptTime && Date.now() >= state.nextAttemptTime.getTime()) {
      this.setState(serverName, {
        ...state,
        isOpen: false,
        nextAttemptTime: undefined
      });
      return true;
    }

    return false;
  }

  recordFailure(serverName: string): void {
    const state = this.getState(serverName);
    const newFailureCount = state.failureCount + 1;
    const threshold = this.getThreshold(serverName);

    const newState: CircuitBreakerState = {
      ...state,
      failureCount: newFailureCount,
      lastFailureTime: new Date()
    };

    if (newFailureCount >= threshold) {
      newState.isOpen = true;
      newState.nextAttemptTime = new Date(Date.now() + this.defaultTimeout);
      console.warn(`Circuit breaker opened for ${serverName} after ${newFailureCount} failures`);
    }

    this.setState(serverName, newState);
  }

  recordSuccess(serverName: string): void {
    const state = this.getState(serverName);
    
    if (state.failureCount > 0 || state.isOpen) {
      this.setState(serverName, {
        isOpen: false,
        failureCount: 0,
        lastFailureTime: undefined,
        nextAttemptTime: undefined
      });
      
      if (state.isOpen) {
        console.info(`Circuit breaker closed for ${serverName} after successful request`);
      }
    }
  }

  enable(serverName: string, threshold: number): void {
    const state = this.getState(serverName);
    this.setState(serverName, {
      ...state,
      isOpen: false,
      failureCount: 0
    });
    
    this.setThreshold(serverName, threshold);
    console.info(`Circuit breaker enabled for ${serverName} with threshold ${threshold}`);
  }

  disable(serverName: string): void {
    this.setState(serverName, {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: undefined,
      nextAttemptTime: undefined
    });
    
    this.removeThreshold(serverName);
    console.info(`Circuit breaker disabled for ${serverName}`);
  }

  getStatus(serverName: string): CircuitBreakerState {
    return { ...this.getState(serverName) };
  }

  getAllStatuses(): Map<string, CircuitBreakerState> {
    const statuses = new Map<string, CircuitBreakerState>();
    
    for (const [serverName, state] of this.circuitStates) {
      statuses.set(serverName, { ...state });
    }
    
    return statuses;
  }

  resetCircuitBreaker(serverName: string): void {
    this.setState(serverName, {
      isOpen: false,
      failureCount: 0,
      lastFailureTime: undefined,
      nextAttemptTime: undefined
    });
    
    console.info(`Circuit breaker reset for ${serverName}`);
  }

  resetAllCircuitBreakers(): void {
    for (const serverName of this.circuitStates.keys()) {
      this.resetCircuitBreaker(serverName);
    }
  }

  setDefaultThreshold(threshold: number): void {
    if (threshold < 1) {
      throw new Error('Circuit breaker threshold must be at least 1');
    }
    this.defaultThreshold = threshold;
  }

  setDefaultTimeout(timeoutMs: number): void {
    if (timeoutMs < 1000) {
      throw new Error('Circuit breaker timeout must be at least 1000ms');
    }
    this.defaultTimeout = timeoutMs;
  }

  getHealthSummary(): {
    totalServers: number;
    openCircuits: number;
    serversWithFailures: number;
    healthyServers: number;
  } {
    const states = Array.from(this.circuitStates.values());
    
    return {
      totalServers: states.length,
      openCircuits: states.filter(s => s.isOpen).length,
      serversWithFailures: states.filter(s => s.failureCount > 0).length,
      healthyServers: states.filter(s => !s.isOpen && s.failureCount === 0).length
    };
  }

  private getState(serverName: string): CircuitBreakerState {
    return this.circuitStates.get(serverName) || {
      isOpen: false,
      failureCount: 0
    };
  }

  private setState(serverName: string, state: CircuitBreakerState): void {
    this.circuitStates.set(serverName, state);
  }

  private thresholds: Map<string, number> = new Map();

  private getThreshold(serverName: string): number {
    return this.thresholds.get(serverName) || this.defaultThreshold;
  }

  private setThreshold(serverName: string, threshold: number): void {
    this.thresholds.set(serverName, threshold);
  }

  private removeThreshold(serverName: string): void {
    this.thresholds.delete(serverName);
  }
}