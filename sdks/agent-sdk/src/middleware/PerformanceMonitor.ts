import { monitorEventLoopDelay, performance } from "node:perf_hooks";
import v8 from "node:v8";
import type { AgentMiddleware } from "@/core/Agent";

export interface HealthReport {
  cpuPercent: number;
  eventLoopDelayMs: number;
  heapMB: number;
  heapPercent: number;
  heapLimitMB: number;
  totalMB: number;
}

export interface PerformanceMonitorConfig {
  /** Interval in ms between health reports (default: 60000). Set to 0 to disable. */
  healthReportInterval?: number;
  /** Threshold in ms for critical warning (default: 10000) */
  criticalThresholdInterval?: number;
  /** Called when a message takes longer than the critical threshold to process. Defaults to logging a warning. */
  onCriticalResponse?: (durationMs: number) => void;
  /** Called on each health report interval. Defaults to logging CPU and memory stats. */
  onHealthReport?: (report: HealthReport) => void;
  /** Called after every message with the processing duration in ms. */
  onResponse?: (durationMs: number) => void;
  /** Called when shutdown is invoked. Defaults to logging a message. */
  onShutdown?: () => void;
}

/**
 * Middleware that measures message processing time and logs periodic
 * CPU / memory health reports.
 *
 * Register it as the first middleware so the timer wraps all downstream
 * middleware and handlers, giving you the total processing time independent
 * of other logic.
 */
export class PerformanceMonitor {
  #interval: ReturnType<typeof setInterval> | undefined;
  #lastCpuUsage: NodeJS.CpuUsage;
  #lastCpuTime: number;
  #criticalThresholdMs: number;
  #onCriticalResponse: (durationMs: number) => void;
  #onHealthReport: (report: HealthReport) => void;
  #onResponse?: (durationMs: number) => void;
  #onShutdown: () => void;
  #eventLoopHistogram: ReturnType<typeof monitorEventLoopDelay>;

  constructor(config: PerformanceMonitorConfig = {}) {
    const {
      healthReportInterval = 60_000,
      criticalThresholdInterval = 10_000,
    } = config;

    this.#criticalThresholdMs = criticalThresholdInterval;

    const defaultCriticalResponseHandler = (durationMs: number) => {
      console.warn(
        `[PerformanceMonitor] Critical: Response time exceeded ${criticalThresholdInterval / 1000}s (${durationMs.toFixed(0)}ms)`,
      );
    };

    const defaultHealthReportHandler = (report: HealthReport) => {
      console.log(
        `[${new Date().toISOString()}] CPU: ${report.cpuPercent.toFixed(1)}% | Event Loop: ${report.eventLoopDelayMs.toFixed(1)}ms | Heap: ${report.heapPercent.toFixed(1)}% (${report.heapMB.toFixed(0)}MB/${report.totalMB.toFixed(1)}MB)`,
      );
    };

    const defaultShutdownHandler = () => {
      console.log("[PerformanceMonitor] Monitoring shut down");
    };

    this.#onCriticalResponse =
      config.onCriticalResponse ?? defaultCriticalResponseHandler;

    this.#onHealthReport = config.onHealthReport ?? defaultHealthReportHandler;
    this.#onResponse = config.onResponse;
    this.#onShutdown = config.onShutdown ?? defaultShutdownHandler;
    this.#eventLoopHistogram = monitorEventLoopDelay();
    this.#eventLoopHistogram.enable();
    this.#lastCpuUsage = process.cpuUsage();
    this.#lastCpuTime = Date.now();

    if (healthReportInterval > 0) {
      this.#logHealthReport();
      this.#interval = setInterval(() => {
        this.#logHealthReport();
      }, healthReportInterval);
    }
  }

  #getCpuPercent(): number {
    const currentCpuUsage = process.cpuUsage(this.#lastCpuUsage);
    const elapsedMs = Date.now() - this.#lastCpuTime;
    const totalCpuMicros = currentCpuUsage.user + currentCpuUsage.system;
    const percent =
      elapsedMs > 0 ? (totalCpuMicros / (elapsedMs * 1000)) * 100 : 0;

    this.#lastCpuUsage = process.cpuUsage();
    this.#lastCpuTime = Date.now();

    return Math.min(percent, 100);
  }

  #getMemory() {
    const memoryUsage = process.memoryUsage();
    const heapStats = v8.getHeapStatistics();
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
    const heapLimitMB = heapStats.heap_size_limit / 1024 / 1024;
    return {
      heapMB: heapUsedMB,
      heapPercent: (heapUsedMB / heapLimitMB) * 100,
      heapLimitMB,
      totalMB: memoryUsage.rss / 1024 / 1024,
    };
  }

  #logHealthReport() {
    const cpuPercent = this.#getCpuPercent();
    const mem = this.#getMemory();
    const mean = this.#eventLoopHistogram.mean;
    const eventLoopDelayMs = Number.isNaN(mean) ? 0 : mean / 1e6;
    this.#eventLoopHistogram.reset();
    this.#onHealthReport({
      cpuPercent,
      eventLoopDelayMs,
      ...mem,
    });
  }

  shutdown() {
    clearInterval(this.#interval);
    this.#eventLoopHistogram.disable();
    this.#onShutdown();
  }

  middleware(): AgentMiddleware {
    return async (_, next) => {
      const start = performance.now();
      try {
        await next();
      } finally {
        const duration = performance.now() - start;
        this.#onResponse?.(duration);
        if (duration > this.#criticalThresholdMs) {
          this.#onCriticalResponse(duration);
        }
      }
    };
  }
}
