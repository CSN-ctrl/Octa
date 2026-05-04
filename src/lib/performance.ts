/**
 * Performance monitoring utilities
 * Tracks component render times, API calls, and user interactions
 */

import React from "react";

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'render' | 'api' | 'user' | 'custom';
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private enabled: boolean;

  constructor() {
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_PERFORMANCE === 'true';
  }

  /**
   * Measure component render time
   */
  measureRender<T>(componentName: string, renderFn: () => T): T {
    if (!this.enabled) {
      return renderFn();
    }

    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    const duration = end - start;

    this.record({
      name: `render:${componentName}`,
      value: duration,
      timestamp: Date.now(),
      type: 'render',
      metadata: { componentName },
    });

    if (duration > 16) {
      // Warn if render takes longer than one frame (16ms)
      console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`);
    }

    return result;
  }

  /**
   * Measure async operation (API calls, data fetching)
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.enabled) {
      return operation();
    }

    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      const duration = end - start;

      this.record({
        name: `async:${name}`,
        value: duration,
        timestamp: Date.now(),
        type: 'api',
        metadata: { ...metadata, success: true },
      });

      return result;
    } catch (error) {
      const end = performance.now();
      const duration = end - start;

      this.record({
        name: `async:${name}`,
        value: duration,
        timestamp: Date.now(),
        type: 'api',
        metadata: { ...metadata, success: false, error: String(error) },
      });

      throw error;
    }
  }

  /**
   * Record custom metric
   */
  record(metric: PerformanceMetric): void {
    if (!this.enabled) return;

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    render: { avg: number; max: number; count: number };
    api: { avg: number; max: number; count: number };
    total: number;
  } {
    const renderMetrics = this.metrics.filter(m => m.type === 'render');
    const apiMetrics = this.metrics.filter(m => m.type === 'api');

    const calculateStats = (metrics: PerformanceMetric[]) => {
      if (metrics.length === 0) {
        return { avg: 0, max: 0, count: 0 };
      }
      const values = metrics.map(m => m.value);
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        max: Math.max(...values),
        count: values.length,
      };
    };

    return {
      render: calculateStats(renderMetrics),
      api: calculateStats(apiMetrics),
      total: this.metrics.length,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  export(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMeasure(componentName: string) {
  if (!performanceMonitor['enabled']) {
    return { measureRender: <T>(fn: () => T): T => fn() };
  }

  return {
    measureRender: <T>(renderFn: () => T): T => performanceMonitor.measureRender(componentName, renderFn),
  };
}

/**
 * Higher-order component for measuring render performance
 */
export function withPerformanceMeasure<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function MeasuredComponent(props: P) {
    const { measureRender } = usePerformanceMeasure(componentName);
    
    return measureRender(() => React.createElement(Component, props));
  };
}

