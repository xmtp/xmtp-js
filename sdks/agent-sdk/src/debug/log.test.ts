import { LogLevel } from "@xmtp/node-sdk";
import { describe, expect, it } from "vitest";
import { getValidLogLevels, parseLogLevel } from "@/debug/log";

describe("parseLogLevel", () => {
  it("should parse lowercase log levels", () => {
    expect(parseLogLevel("off")).toBe(LogLevel.Off);
    expect(parseLogLevel("error")).toBe(LogLevel.Error);
    expect(parseLogLevel("warn")).toBe(LogLevel.Warn);
    expect(parseLogLevel("info")).toBe(LogLevel.Info);
    expect(parseLogLevel("debug")).toBe(LogLevel.Debug);
    expect(parseLogLevel("trace")).toBe(LogLevel.Trace);
  });

  it("should parse uppercase log levels", () => {
    expect(parseLogLevel("OFF")).toBe(LogLevel.Off);
    expect(parseLogLevel("ERROR")).toBe(LogLevel.Error);
    expect(parseLogLevel("WARN")).toBe(LogLevel.Warn);
    expect(parseLogLevel("INFO")).toBe(LogLevel.Info);
    expect(parseLogLevel("DEBUG")).toBe(LogLevel.Debug);
    expect(parseLogLevel("TRACE")).toBe(LogLevel.Trace);
  });

  it("should parse properly cased log levels", () => {
    expect(parseLogLevel("Off")).toBe(LogLevel.Off);
    expect(parseLogLevel("Error")).toBe(LogLevel.Error);
    expect(parseLogLevel("Warn")).toBe(LogLevel.Warn);
    expect(parseLogLevel("Info")).toBe(LogLevel.Info);
    expect(parseLogLevel("Debug")).toBe(LogLevel.Debug);
    expect(parseLogLevel("Trace")).toBe(LogLevel.Trace);
  });

  it("should parse mixed case log levels", () => {
    expect(parseLogLevel("dEBUG")).toBe(LogLevel.Debug);
    expect(parseLogLevel("WaRn")).toBe(LogLevel.Warn);
  });

  it("should return null for invalid log levels", () => {
    expect(parseLogLevel("invalid")).toBeNull();
    expect(parseLogLevel("")).toBeNull();
    expect(parseLogLevel("verbose")).toBeNull();
    expect(parseLogLevel("warning")).toBeNull();
  });
});

describe("getValidLogLevels", () => {
  it("should return all valid log levels", () => {
    const levels = getValidLogLevels();
    expect(levels).toContain(LogLevel.Off);
    expect(levels).toContain(LogLevel.Error);
    expect(levels).toContain(LogLevel.Warn);
    expect(levels).toContain(LogLevel.Info);
    expect(levels).toContain(LogLevel.Debug);
    expect(levels).toContain(LogLevel.Trace);
    expect(levels).toHaveLength(6);
  });

  it("should return a new array each time", () => {
    const levels1 = getValidLogLevels();
    const levels2 = getValidLogLevels();
    expect(levels1).not.toBe(levels2);
    expect(levels1).toEqual(levels2);
  });
});
