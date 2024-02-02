/* eslint-disable max-classes-per-file */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class InvalidArgumentsError extends Error {}
