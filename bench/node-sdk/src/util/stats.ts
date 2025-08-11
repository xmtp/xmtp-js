import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import packageJson from "@xmtp/node-sdk/package.json" with { type: "json" };

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Interface for duration statistics
 */
interface DurationStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  p999: number;
}

/**
 * Calculate percentile from an array (will be sorted internally if needed)
 * @param array - Array of numbers (does not need to be pre-sorted)
 * @param percentile - Percentile to calculate (0-100)
 * @returns The calculated percentile value
 */
function calculatePercentile(array: number[], percentile: number): number {
  if (array.length === 0) return 0;

  // Sort the array if not already sorted
  const sorted = [...array].sort((a, b) => a - b);

  if (percentile <= 0) return Math.round(sorted[0] * 100) / 100;
  if (percentile >= 100)
    return Math.round(sorted[sorted.length - 1] * 100) / 100;

  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index % 1;

  if (lower === upper) {
    return Math.round(sorted[lower] * 100) / 100;
  }

  return (
    Math.round((sorted[lower] * (1 - weight) + sorted[upper] * weight) * 100) /
    100
  );
}

/**
 * Calculate mean (average) of an array
 * @param array - Array of numbers
 * @returns The mean value
 */
function calculateMean(array: number[]): number {
  if (array.length === 0) return 0;
  const sum = array.reduce((acc, val) => acc + val, 0);
  return sum / array.length;
}

/**
 * Calculate standard deviation
 * @param array - Array of numbers
 * @param mean - Pre-calculated mean value
 * @returns The standard deviation
 */
function calculateStdDev(array: number[], mean: number): number {
  if (array.length <= 1) return 0;

  const squaredDiffs = array.map((value) => Math.pow(value - mean, 2));
  const avgSquaredDiff = calculateMean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate comprehensive statistics from an array of durations
 * @param durations - Array of duration values in milliseconds
 * @returns Object containing various statistical measures
 */
export function calculateDurationStats(durations: number[]): DurationStats {
  if (durations.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      p999: 0,
    };
  }

  // Calculate mean and standard deviation from original array
  const mean = calculateMean(durations);
  const stdDev = calculateStdDev(durations, mean);

  // Sort once for min/max calculation
  const sorted = [...durations].sort((a, b) => a - b);

  return {
    count: durations.length,
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[sorted.length - 1] * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    median: calculatePercentile(durations, 50),
    stdDev: Math.round(stdDev * 100) / 100,
    p50: calculatePercentile(durations, 50),
    p75: calculatePercentile(durations, 75),
    p90: calculatePercentile(durations, 90),
    p95: calculatePercentile(durations, 95),
    p99: calculatePercentile(durations, 99),
    p999: calculatePercentile(durations, 99.9),
  };
}

/**
 * Format duration statistics into a readable string
 * @param stats - Duration statistics object
 * @returns Formatted string representation
 */
export function printDurationStats(
  stats: DurationStats,
  label: string,
): string {
  if (stats.count === 0) {
    return "No data available";
  }

  return `
${label} Performance Statistics:
========================
Count:    ${stats.count}
Min:      ${stats.min.toFixed(2)} ms
Max:      ${stats.max.toFixed(2)} ms
Mean:     ${stats.mean.toFixed(2)} ms
Std Dev:  ${stats.stdDev.toFixed(2)} ms

Percentiles:
------------
P50 (Median): ${stats.p50.toFixed(2)} ms
P75:          ${stats.p75.toFixed(2)} ms
P90:          ${stats.p90.toFixed(2)} ms
P95:          ${stats.p95.toFixed(2)} ms
P99:          ${stats.p99.toFixed(2)} ms
P99.9:        ${stats.p999.toFixed(2)} ms
`.trim();
}

/**
 * Log duration statistics to a JSON file
 * @param stats - Duration statistics object
 * @param path - Path to the JSON file to write
 */
export async function logStats(
  stats: DurationStats,
  fileName: string,
): Promise<void> {
  const resultsPath = join(__dirname, "..", "results");
  await mkdir(resultsPath, { recursive: true });
  await writeFile(
    join(resultsPath, fileName),
    JSON.stringify(
      {
        sdkName: packageJson.name,
        sdkVersion: packageJson.version,
        ...stats,
      },
      null,
      2,
    ),
  );
}
