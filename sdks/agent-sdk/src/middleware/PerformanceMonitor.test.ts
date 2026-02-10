import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  PerformanceMonitor,
  type HealthReport,
} from "@/middleware/PerformanceMonitor";

describe("PerformanceMonitor", () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    monitor.shutdown();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("logs an initial health report", () => {
      const spy = vi.spyOn(console, "log");
      monitor = new PerformanceMonitor();
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("CPU:"));
    });

    it("uses default config values", () => {
      const spy = vi.spyOn(console, "log");
      monitor = new PerformanceMonitor();
      // Advance past the default 60s interval
      vi.advanceTimersByTime(60_000);
      // Initial health report + interval report
      const healthReportCalls = spy.mock.calls.filter((call) =>
        String(call[0]).includes("CPU:"),
      );
      expect(healthReportCalls).toHaveLength(2);
    });

    it("accepts a custom reporting interval", () => {
      const spy = vi.spyOn(console, "log");
      monitor = new PerformanceMonitor({ healthReportInterval: 5_000 });
      vi.advanceTimersByTime(15_000);
      const healthReportCalls = spy.mock.calls.filter((call) =>
        String(call[0]).includes("CPU:"),
      );
      // 1 initial + 3 interval reports
      expect(healthReportCalls).toHaveLength(4);
    });

    it("calls custom onHealthReport handler instead of logging", () => {
      const onHealthReport = vi.fn();
      monitor = new PerformanceMonitor({
        healthReportInterval: 5_000,
        onHealthReport,
      });
      // 1 initial call
      expect(onHealthReport).toHaveBeenCalledOnce();
      const report: HealthReport = onHealthReport.mock.calls[0]![0];
      expect(report.cpuPercent).toBeTypeOf("number");
      expect(report.heapMB).toBeTypeOf("number");
      expect(report.heapPercent).toBeTypeOf("number");
      expect(report.heapLimitMB).toBeTypeOf("number");
      expect(report.totalMB).toBeTypeOf("number");
      // Interval calls
      vi.advanceTimersByTime(10_000);
      expect(onHealthReport).toHaveBeenCalledTimes(3);
    });

    it("disables health reports when reportingIntervalMs is 0", () => {
      const spy = vi.spyOn(console, "log");
      monitor = new PerformanceMonitor({ healthReportInterval: 0 });
      vi.advanceTimersByTime(120_000);
      const healthReportCalls = spy.mock.calls.filter((call) =>
        String(call[0]).includes("CPU:"),
      );
      expect(healthReportCalls).toHaveLength(0);
    });
  });

  describe("shutdown", () => {
    it("logs shutdown message", () => {
      const spy = vi.spyOn(console, "log");
      monitor = new PerformanceMonitor();
      monitor.shutdown();
      expect(spy).toHaveBeenCalledWith(
        "[PerformanceMonitor] Monitoring shut down",
      );
    });
  });

  describe("middleware", () => {
    it("returns a function", () => {
      monitor = new PerformanceMonitor();
      expect(typeof monitor.middleware()).toBe("function");
    });

    it("calls next()", async () => {
      vi.useRealTimers();
      monitor = new PerformanceMonitor({ healthReportInterval: 999_999 });
      const mw = monitor.middleware();
      const next = vi.fn();
      await mw({} as never, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("calls onResponse for every message", async () => {
      vi.useRealTimers();
      const onResponse = vi.fn();
      monitor = new PerformanceMonitor({
        healthReportInterval: 999_999,
        onResponse,
      });
      const mw = monitor.middleware();
      await mw({} as never, vi.fn());
      await mw({} as never, vi.fn());
      expect(onResponse).toHaveBeenCalledTimes(2);
      expect(onResponse).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});
