export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  EC: number;
  data: T;
  timestamp?: string;
  path?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  EC: number;
  timestamp?: string;
  path?: string;
}
