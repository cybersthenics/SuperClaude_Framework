/**
 * Event Bus Manager Implementation
 * High-performance event-driven communication system
 */

import { EventEmitter } from 'events';
import { 
  BaseMessage, 
  MessageType, 
  MessagePriority,
  ServerIdentifier,
  PerformanceHint
} from './types.js';

export enum EventPriority {
  Critical = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Background = 4
}

export interface SystemEvent {
  id: string;
  type: string;
  source: ServerIdentifier;
  timestamp: Date;
  data: any;
  priority?: EventPriority;
  ttl?: number;
  correlationId?: string;
}

export interface EventSubscriber {
  id: string;
  serverId: ServerIdentifier;
  eventTypes: string[];
  endpoint: string;
  priority: number;
  filters?: EventFilter[];
  onEvent: (event: SystemEvent) => Promise<void>;
}

export interface EventFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'matches';
  value: any;
}

export interface QueuedEvent {
  event: SystemEvent;
  subscribers: EventSubscriber[];
  priority: EventPriority;
  queuedAt: Date;
  attempts: number;
  nextRetry?: Date;
}

export interface PublishResult {
  success: boolean;
  deliveredCount: number;
  eventId?: string;
  errors?: string[];
}

export interface SubscriptionResult {
  success: boolean;
  subscriptionId?: string;
  reason?: string;
}

export interface EventValidationResult {
  valid: boolean;
  reason?: string;
}

export interface EventMetrics {
  totalPublished: number;
  totalDelivered: number;
  averageDeliveryTime: number;
  errorRate: number;
  subscriberCount: number;
  queueSize: number;
}

export class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  enqueue(item: T, priority: number = 0): void {
    const queueElement = { item, priority };
    
    // Insert based on priority (lower number = higher priority)
    let inserted = false;
    for (let i = 0; i < this.items.length; i++) {
      if (queueElement.priority < this.items[i].priority) {
        this.items.splice(i, 0, queueElement);
        inserted = true;
        break;
      }
    }
    
    if (!inserted) {
      this.items.push(queueElement);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }
}

export interface EventMetricsCollector {
  startEventTimer(eventType: string): string;
  endEventTimer(timerId: string): number;
  recordMetric(metric: string, value: number, tags?: Record<string, string>): Promise<void>;
  getMetrics(): Promise<EventMetrics>;
}

export class EventMetricsCollectorImpl implements EventMetricsCollector {
  private timers: Map<string, number> = new Map();
  private metrics: EventMetrics = {
    totalPublished: 0,
    totalDelivered: 0,
    averageDeliveryTime: 0,
    errorRate: 0,
    subscriberCount: 0,
    queueSize: 0
  };

  startEventTimer(eventType: string): string {
    const timerId = `${eventType}-${Date.now()}-${Math.random()}`;
    this.timers.set(timerId, performance.now());
    return timerId;
  }

  endEventTimer(timerId: string): number {
    const startTime = this.timers.get(timerId);
    if (!startTime) return 0;
    
    this.timers.delete(timerId);
    return performance.now() - startTime;
  }

  async recordMetric(metric: string, value: number, tags?: Record<string, string>): Promise<void> {
    switch (metric) {
      case 'event.published':
        this.metrics.totalPublished += value;
        break;
      case 'event.delivered':
        this.metrics.totalDelivered += value;
        break;
      case 'event.delivery_time':
        this.metrics.averageDeliveryTime = 
          (this.metrics.averageDeliveryTime + value) / 2;
        break;
      case 'event.error':
        const total = this.metrics.totalPublished || 1;
        this.metrics.errorRate = (this.metrics.errorRate * (total - 1) + value) / total;
        break;
      case 'event.subscriber_count':
        this.metrics.subscriberCount = value;
        break;
      case 'event.queue_size':
        this.metrics.queueSize = value;
        break;
    }
  }

  async getMetrics(): Promise<EventMetrics> {
    return { ...this.metrics };
  }
}

export class EventBusManager extends EventEmitter {
  private subscribers: Map<string, EventSubscriber[]> = new Map();
  private eventQueue: PriorityQueue<QueuedEvent> = new PriorityQueue();
  private eventMetrics: EventMetricsCollector;
  private processingInterval: NodeJS.Timeout | null = null;
  private maxRetries: number = 3;
  private retryDelayMs: number = 1000;
  private batchSize: number = 100;
  private queueProcessingActive: boolean = false;

  constructor(
    eventMetrics?: EventMetricsCollector,
    options?: {
      maxRetries?: number;
      retryDelayMs?: number;
      batchSize?: number;
      processingIntervalMs?: number;
    }
  ) {
    super();
    this.eventMetrics = eventMetrics || new EventMetricsCollectorImpl();
    
    if (options) {
      this.maxRetries = options.maxRetries ?? this.maxRetries;
      this.retryDelayMs = options.retryDelayMs ?? this.retryDelayMs;
      this.batchSize = options.batchSize ?? this.batchSize;
    }

    this.startQueueProcessing(options?.processingIntervalMs || 100);
  }

  async publishEvent(event: SystemEvent): Promise<PublishResult> {
    const timer = this.eventMetrics.startEventTimer(event.type);
    
    try {
      // Validate event
      const validation = await this.validateEvent(event);
      if (!validation.valid) {
        throw new Error(`Event validation failed: ${validation.reason}`);
      }

      // Enrich event with metadata
      const enrichedEvent = await this.enrichEvent(event);

      // Determine subscribers
      const subscribers = this.getSubscribers(event.type);
      if (subscribers.length === 0) {
        await this.eventMetrics.recordMetric('event.no_subscribers', 1, { type: event.type });
        return { success: true, deliveredCount: 0 };
      }

      // Filter subscribers based on event data
      const filteredSubscribers = this.filterSubscribers(subscribers, enrichedEvent);

      // Queue event for delivery
      const queuedEvent: QueuedEvent = {
        event: enrichedEvent,
        subscribers: filteredSubscribers,
        priority: event.priority || EventPriority.Normal,
        queuedAt: new Date(),
        attempts: 0
      };

      this.eventQueue.enqueue(queuedEvent, queuedEvent.priority);

      // Update metrics
      await this.eventMetrics.recordMetric('event.published', 1, { type: event.type });
      await this.eventMetrics.recordMetric('event.queue_size', this.eventQueue.size());

      // Trigger immediate processing for high priority events
      if (event.priority !== undefined && event.priority <= EventPriority.High) {
        setImmediate(() => this.processEventQueue());
      }

      return {
        success: true,
        deliveredCount: filteredSubscribers.length,
        eventId: enrichedEvent.id
      };
    } catch (error) {
      this.eventMetrics.endEventTimer(timer);
      await this.eventMetrics.recordMetric('event.error', 1, { type: event.type });
      
      return {
        success: false,
        deliveredCount: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  async subscribeToEvent(eventType: string, subscriber: EventSubscriber): Promise<SubscriptionResult> {
    const subscribers = this.subscribers.get(eventType) || [];
    
    // Check for duplicate subscription
    if (subscribers.some(s => s.id === subscriber.id)) {
      return { success: false, reason: 'Already subscribed' };
    }

    // Validate subscriber
    if (!subscriber.onEvent || typeof subscriber.onEvent !== 'function') {
      return { success: false, reason: 'Invalid event handler' };
    }

    subscribers.push(subscriber);
    this.subscribers.set(eventType, subscribers);

    await this.eventMetrics.recordMetric('event.subscription_added', 1, { 
      type: eventType,
      subscriber: subscriber.id 
    });

    // Update subscriber count
    const totalSubscribers = Array.from(this.subscribers.values())
      .reduce((total, subs) => total + subs.length, 0);
    await this.eventMetrics.recordMetric('event.subscriber_count', totalSubscribers);

    this.emit('subscriberAdded', { eventType, subscriber });

    return { success: true, subscriptionId: subscriber.id };
  }

  async unsubscribeFromEvent(eventType: string, subscriberId: string): Promise<SubscriptionResult> {
    const subscribers = this.subscribers.get(eventType);
    if (!subscribers) {
      return { success: false, reason: 'Event type not found' };
    }

    const index = subscribers.findIndex(s => s.id === subscriberId);
    if (index === -1) {
      return { success: false, reason: 'Subscriber not found' };
    }

    subscribers.splice(index, 1);
    
    if (subscribers.length === 0) {
      this.subscribers.delete(eventType);
    } else {
      this.subscribers.set(eventType, subscribers);
    }

    // Update subscriber count
    const totalSubscribers = Array.from(this.subscribers.values())
      .reduce((total, subs) => total + subs.length, 0);
    await this.eventMetrics.recordMetric('event.subscriber_count', totalSubscribers);

    this.emit('subscriberRemoved', { eventType, subscriberId });

    return { success: true, subscriptionId: subscriberId };
  }

  async getEventMetrics(): Promise<EventMetrics> {
    return this.eventMetrics.getMetrics();
  }

  getSubscriberCount(eventType?: string): number {
    if (eventType) {
      return this.subscribers.get(eventType)?.length || 0;
    }
    
    return Array.from(this.subscribers.values())
      .reduce((total, subs) => total + subs.length, 0);
  }

  getQueueSize(): number {
    return this.eventQueue.size();
  }

  private async validateEvent(event: SystemEvent): Promise<EventValidationResult> {
    // Basic validation
    if (!event.id || !event.type || !event.source) {
      return { valid: false, reason: 'Missing required fields (id, type, source)' };
    }

    if (!event.timestamp) {
      return { valid: false, reason: 'Missing timestamp' };
    }

    // TTL validation
    if (event.ttl && event.ttl < 0) {
      return { valid: false, reason: 'Invalid TTL value' };
    }

    // Check if event is expired
    if (event.ttl) {
      const age = Date.now() - event.timestamp.getTime();
      if (age > event.ttl) {
        return { valid: false, reason: 'Event has expired' };
      }
    }

    return { valid: true };
  }

  private async enrichEvent(event: SystemEvent): Promise<SystemEvent> {
    return {
      ...event,
      id: event.id || this.generateEventId(),
      timestamp: event.timestamp || new Date(),
      priority: event.priority ?? EventPriority.Normal,
      ttl: event.ttl || 300000 // 5 minutes default TTL
    };
  }

  private getSubscribers(eventType: string): EventSubscriber[] {
    const exactMatch = this.subscribers.get(eventType) || [];
    const wildcardMatch = this.subscribers.get('*') || [];
    
    // Support for pattern matching
    const patternMatches: EventSubscriber[] = [];
    for (const [pattern, subscribers] of this.subscribers.entries()) {
      if (pattern.includes('*') && pattern !== '*') {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(eventType)) {
          patternMatches.push(...subscribers);
        }
      }
    }

    // Combine and deduplicate
    const allSubscribers = [...exactMatch, ...wildcardMatch, ...patternMatches];
    const uniqueSubscribers = allSubscribers.filter((subscriber, index, array) => 
      array.findIndex(s => s.id === subscriber.id) === index
    );

    // Sort by priority
    return uniqueSubscribers.sort((a, b) => a.priority - b.priority);
  }

  private filterSubscribers(subscribers: EventSubscriber[], event: SystemEvent): EventSubscriber[] {
    return subscribers.filter(subscriber => {
      if (!subscriber.filters || subscriber.filters.length === 0) {
        return true;
      }

      return subscriber.filters.every(filter => this.applyFilter(filter, event));
    });
  }

  private applyFilter(filter: EventFilter, event: SystemEvent): boolean {
    const fieldValue = this.getNestedValue(event, filter.field);
    
    switch (filter.operator) {
      case 'equals':
        return fieldValue === filter.value;
      case 'contains':
        return String(fieldValue).includes(String(filter.value));
      case 'startsWith':
        return String(fieldValue).startsWith(String(filter.value));
      case 'matches':
        const regex = new RegExp(filter.value);
        return regex.test(String(fieldValue));
      default:
        return false;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private startQueueProcessing(intervalMs: number): void {
    this.processingInterval = setInterval(() => {
      if (!this.queueProcessingActive) {
        this.processEventQueue().catch(error => {
          console.error('Error processing event queue:', error);
        });
      }
    }, intervalMs);
  }

  private async processEventQueue(): Promise<void> {
    if (this.queueProcessingActive) return;
    
    this.queueProcessingActive = true;
    
    try {
      let processedCount = 0;
      const batchStartTime = performance.now();

      while (!this.eventQueue.isEmpty() && processedCount < this.batchSize) {
        const queuedEvent = this.eventQueue.dequeue();
        if (!queuedEvent) break;

        // Check if event should be retried
        if (queuedEvent.nextRetry && new Date() < queuedEvent.nextRetry) {
          // Re-queue for later
          this.eventQueue.enqueue(queuedEvent, queuedEvent.priority);
          continue;
        }

        await this.deliverEventToSubscribers(queuedEvent);
        processedCount++;
      }

      const batchTime = performance.now() - batchStartTime;
      if (processedCount > 0) {
        await this.eventMetrics.recordMetric('event.batch_processing_time', batchTime);
        await this.eventMetrics.recordMetric('event.queue_size', this.eventQueue.size());
      }
    } finally {
      this.queueProcessingActive = false;
    }
  }

  private async deliverEventToSubscribers(queuedEvent: QueuedEvent): Promise<void> {
    const deliveryStartTime = performance.now();
    
    const deliveryTasks = queuedEvent.subscribers.map(async (subscriber) => {
      const subscriberStartTime = performance.now();
      
      try {
        await subscriber.onEvent(queuedEvent.event);
        
        const deliveryTime = performance.now() - subscriberStartTime;
        await this.eventMetrics.recordMetric('event.delivery_success', 1, {
          type: queuedEvent.event.type,
          subscriber: subscriber.id
        });
        
        await this.eventMetrics.recordMetric('event.delivery_time', deliveryTime);
        
        return { success: true, subscriber: subscriber.id };
      } catch (error) {
        await this.eventMetrics.recordMetric('event.delivery_failure', 1, {
          type: queuedEvent.event.type,
          subscriber: subscriber.id,
          error: error instanceof Error ? error.name : 'unknown'
        });

        return { success: false, subscriber: subscriber.id, error };
      }
    });

    const results = await Promise.allSettled(deliveryTasks);
    
    // Handle failures
    const failures = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && !result.value.success)
    );

    if (failures.length > 0 && queuedEvent.attempts < this.maxRetries) {
      // Retry failed deliveries
      await this.handleDeliveryFailures(queuedEvent, failures);
    }

    const totalDeliveryTime = performance.now() - deliveryStartTime;
    await this.eventMetrics.recordMetric('event.delivered', queuedEvent.subscribers.length);
    await this.eventMetrics.recordMetric('event.total_delivery_time', totalDeliveryTime);
  }

  private async handleDeliveryFailures(queuedEvent: QueuedEvent, failures: any[]): Promise<void> {
    queuedEvent.attempts++;
    queuedEvent.nextRetry = new Date(Date.now() + this.retryDelayMs * queuedEvent.attempts);
    
    // Re-queue for retry
    this.eventQueue.enqueue(queuedEvent, queuedEvent.priority);
    
    this.emit('deliveryRetry', {
      eventId: queuedEvent.event.id,
      attempt: queuedEvent.attempts,
      failures: failures.length,
      nextRetry: queuedEvent.nextRetry
    });
  }

  private generateEventId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    this.subscribers.clear();
    this.removeAllListeners();
  }
}