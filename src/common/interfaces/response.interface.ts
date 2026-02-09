export interface ApiResponse<T = any> {
  statusCode: number;
  message: string;
  data: T;
  timestamp?: string;
  path?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  errorCode?: string;
  timestamp?: string;
  path?: string;
}
