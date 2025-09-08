export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

export const logError = (error: unknown, context?: Record<string, unknown>) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: error instanceof Error ? error.name : "UnknownError",
    message:
      error instanceof Error ? error.message : "An unknown error occurred",
    stack: error instanceof Error ? error.stack : undefined,
    details: error instanceof AppError ? error.details : undefined,
    context,
  };

  console.error(JSON.stringify(errorLog, null, 2));

  return errorLog;
};
