export class ApiError extends Error {
  code: string;
  status: number;
  data?: unknown;

  constructor({
    message,
    code,
    status,
    data,
  }: {
    message: string;
    code: string;
    status: number;
    data?: unknown;
  }) {
    super(message);

    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.data = data;
  }
}
