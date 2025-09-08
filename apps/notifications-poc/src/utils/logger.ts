import pino, { type LoggerOptions } from "pino";

export const pinoConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level(label, _number) {
      // Use the label for the level instead of the default, which is to use a number
      return { level: label };
    },
  },
  transport:
    process.env.LOG_FORMAT === "json"
      ? undefined
      : {
          target: "pino-pretty",
        },
};

export default pino(pinoConfig);
