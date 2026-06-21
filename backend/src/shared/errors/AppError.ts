export class AppError extends Error {
  statusCode: number;
  details?: Array<{ field: string; issue: string }>;

  constructor(statusCode: number, message: string, details?: Array<{ field: string; issue: string }>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}
