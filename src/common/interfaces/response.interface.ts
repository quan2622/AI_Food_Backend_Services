export interface ApiResponse<T = any> {
  metadata: {
    statusCode: number;
    message: string;
    EC: number;
    timestamp?: string;
    path?: string;
  };
  data: T;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  EC: number;
  timestamp?: string;
  path?: string;
}
