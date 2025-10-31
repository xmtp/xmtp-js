/**
 * Shared CLI utilities for XMTP skills
 * Provides common argument parsing, help generation, and CLI validation
 */

export interface CliParam {
  flags: string[];
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  defaultValue?: any;
}

export interface CliConfig {
  [key: string]: any;
  help?: boolean;
}

/**
 * Parse command line arguments using a configuration object
 */
export function parseCliArgs(
  args: string[],
  params: Record<string, CliParam>,
): CliConfig {
  const config: CliConfig = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) {
      continue;
    }
    const nextArg = args[i + 1];

    // Handle help flag
    if (arg === "--help" || arg === "-h") {
      config.help = true;
      continue;
    }

    // Find matching parameter
    for (const [key, param] of Object.entries(params)) {
      if (param && param.flags.includes(arg)) {
        if (param.type === "boolean") {
          config[key] = true;
        } else if (param.type === "string" || param.type === "number") {
          if (nextArg && !nextArg.startsWith("--")) {
            config[key] =
              param.type === "number" ? parseInt(nextArg, 10) : nextArg;
            i++; // Skip next arg since we consumed it
          } else if (param.required) {
            throw new Error(`Missing value for required parameter: ${arg}`);
          }
        }
        break;
      }
    }
  }

  // Apply defaults
  for (const [key, param] of Object.entries(params)) {
    if (config[key] === undefined && param.defaultValue !== undefined) {
      config[key] = param.defaultValue;
    }
  }

  // Check required parameters
  for (const [key, param] of Object.entries(params)) {
    if (param.required && config[key] === undefined) {
      throw new Error(`Required parameter missing: ${param.flags[0]}`);
    }
  }

  return config;
}

/**
 * Generate help text for CLI commands
 */
export function generateHelpText(
  title: string,
  description: string,
  usage: string,
  params: Record<string, CliParam>,
  examples: string[] = [],
): string {
  let help = `${title}\n\n${description}\n\nUSAGE:\n  ${usage}\n\nOPTIONS:\n`;

  // Add parameters
  for (const [, param] of Object.entries(params)) {
    const flags = param.flags.join(", ");
    const required = param.required ? " (required)" : "";
    const defaultValue =
      param.defaultValue !== undefined
        ? ` [default: ${param.defaultValue}]`
        : "";
    help += `  ${flags.padEnd(20)} ${param.description}${required}${defaultValue}\n`;
  }

  // Add examples
  if (examples.length > 0) {
    help += "\nEXAMPLES:\n";
    examples.forEach((example) => {
      help += `  ${example}\n`;
    });
  }

  help += "\nFor more information, see: cli/readme.md\n";

  return help;
}

/**
 * Validate mutually exclusive parameters
 */
export function validateMutuallyExclusive(
  config: CliConfig,
  exclusiveGroups: string[][],
): void {
  for (const group of exclusiveGroups) {
    const provided = group.filter((param) => config[param] !== undefined);
    if (provided.length > 1) {
      throw new Error(
        `Parameters are mutually exclusive: ${provided.join(", ")}`,
      );
    }
  }
}

/**
 * Show help and exit if help flag is present
 */
export function handleHelp(config: CliConfig, helpText: string): void {
  if (config.help) {
    console.log(helpText);
    process.exit(0);
  }
}
