export interface ErrorDetails {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: ErrorDetails[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}
