export class AgentError extends Error {
  #code: number;

  constructor(code: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.#code = code;
  }

  get code() {
    return this.#code;
  }
}
