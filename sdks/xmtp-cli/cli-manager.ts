import { spawn } from "child_process";

export interface CliManagerConfig {
  repeat?: number;
  delay?: number; // milliseconds between executions
  continueOnError?: boolean;
  verbose?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
  attempt: number;
}

export class CliManager {
  private config: CliManagerConfig;

  constructor(config: CliManagerConfig = {}) {
    this.config = {
      repeat: 1,
      delay: 0,
      continueOnError: false,
      verbose: false,
      ...config,
    };
  }

  /**
   * Execute a CLI command with optional repetition
   */
  async executeCommand(
    command: string,
    args: string[] = [],
    options: CliManagerConfig = {},
  ): Promise<ExecutionResult[]> {
    const finalConfig = { ...this.config, ...options };
    const results: ExecutionResult[] = [];
    const repeatCount = finalConfig.repeat || 1;

    if (finalConfig.verbose) {
      console.log(`🔄 CLI Manager: Executing command ${repeatCount} time(s)`);
      console.log(`📝 Command: ${command} ${args.join(" ")}`);
    }

    for (let i = 0; i < repeatCount; i++) {
      const startTime = Date.now();

      if (finalConfig.verbose && repeatCount > 1) {
        console.log(`\n🔄 Execution ${i + 1}/${repeatCount}`);
      }

      try {
        const result = await this.runSingleExecution(command, args, i + 1);
        results.push(result);

        if (!result.success && !finalConfig.continueOnError) {
          console.error(
            `❌ Execution ${i + 1} failed, stopping (use --continue-on-error to override)`,
          );
          break;
        }

        // Add delay between executions (except for the last one)
        if (i < repeatCount - 1 && finalConfig.delay && finalConfig.delay > 0) {
          if (finalConfig.verbose) {
            console.log(
              `⏳ Waiting ${finalConfig.delay}ms before next execution...`,
            );
          }
          await this.delay(finalConfig.delay);
        }
      } catch (error) {
        const errorResult: ExecutionResult = {
          success: false,
          exitCode: 1,
          stdout: "",
          stderr: error instanceof Error ? error.message : String(error),
          executionTime: Date.now() - startTime,
          attempt: i + 1,
        };
        results.push(errorResult);

        if (!finalConfig.continueOnError) {
          break;
        }
      }
    }

    this.printSummary(results);
    return results;
  }

  /**
   * Run a single command execution
   */
  private async runSingleExecution(
    command: string,
    args: string[],
    attempt: number,
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = "";
      let stderr = "";

      const child = spawn(command, args, {
        stdio: ["inherit", "pipe", "pipe"],
        shell: true,
      });

      child.stdout?.on("data", (data) => {
        const output = data.toString();
        stdout += output;
        if (this.config.verbose) {
          process.stdout.write(output);
        }
      });

      child.stderr?.on("data", (data) => {
        const output = data.toString();
        stderr += output;
        if (this.config.verbose) {
          process.stderr.write(output);
        }
      });

      child.on("close", (code) => {
        const executionTime = Date.now() - startTime;
        resolve({
          success: code === 0,
          exitCode: code || 0,
          stdout,
          stderr,
          executionTime,
          attempt,
        });
      });

      child.on("error", (error) => {
        const executionTime = Date.now() - startTime;
        resolve({
          success: false,
          exitCode: 1,
          stdout,
          stderr: error.message,
          executionTime,
          attempt,
        });
      });
    });
  }

  /**
   * Execute a yarn command (convenience method)
   */
  async executeYarnCommand(
    skill: string,
    args: string[] = [],
    options: CliManagerConfig = {},
  ): Promise<ExecutionResult[]> {
    const yarnArgs = [skill, ...args];
    return this.executeCommand("yarn", yarnArgs, options);
  }

  /**
   * Parse CLI manager arguments from command line
   */
  static parseManagerArgs(args: string[]): {
    managerArgs: string[];
    skillArgs: string[];
    config: CliManagerConfig;
  } {
    const managerArgs: string[] = [];
    const skillArgs: string[] = [];
    let isManagerArg = false;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === undefined) {
        continue;
      }

      if (
        arg === "--repeat" ||
        arg === "--delay" ||
        arg === "--continue-on-error" ||
        arg === "--verbose"
      ) {
        isManagerArg = true;
        managerArgs.push(arg);

        // If next arg is not a flag, it's the value for this flag
        const nextArg = args[i + 1];
        if (
          nextArg !== undefined &&
          i + 1 < args.length &&
          !nextArg.startsWith("--")
        ) {
          managerArgs.push(nextArg);
          i++; // Skip the next argument
        }
      } else if (arg.startsWith("--")) {
        isManagerArg = false;
        skillArgs.push(arg);
      } else if (isManagerArg) {
        managerArgs.push(arg);
      } else {
        skillArgs.push(arg);
      }
    }

    // Parse manager config
    const config: CliManagerConfig = {};
    for (let i = 0; i < managerArgs.length; i++) {
      const arg = managerArgs[i];
      const nextArg = managerArgs[i + 1];

      switch (arg) {
        case "--repeat":
          config.repeat = nextArg !== undefined ? parseInt(nextArg) || 1 : 1;
          if (nextArg !== undefined) {
            i++;
          }
          break;
        case "--delay":
          config.delay = nextArg !== undefined ? parseInt(nextArg) || 0 : 0;
          if (nextArg !== undefined) {
            i++;
          }
          break;
        case "--continue-on-error":
          config.continueOnError = true;
          break;
        case "--verbose":
          config.verbose = true;
          break;
      }
    }

    return { managerArgs, skillArgs, config };
  }

  /**
   * Print execution summary
   */
  private printSummary(results: ExecutionResult[]): void {
    if (results.length <= 1) return;

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const avgTime = totalTime / results.length;

    console.log("\n📊 CLI Manager Summary:");
    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(
      `📈 Average time: ${(avgTime / 1000).toFixed(2)}s per execution`,
    );

    if (failed.length > 0) {
      console.log("\n❌ Failed executions:");
      failed.forEach((result) => {
        console.log(
          `  Attempt ${result.attempt}: Exit code ${result.exitCode}`,
        );
        if (result.stderr) {
          console.log(`    Error: ${result.stderr.trim()}`);
        }
      });
    }
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Convenience function to execute a skill with CLI manager
 */
export async function executeSkillWithManager(
  skill: string,
  args: string[] = [],
  options: CliManagerConfig = {},
): Promise<ExecutionResult[]> {
  const manager = new CliManager(options);
  return manager.executeYarnCommand(skill, args, options);
}
