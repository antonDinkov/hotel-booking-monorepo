export type ApiPaginationMeta = {
  page: number;
  limit: number;
  hasMore: boolean;
  total: number;
};

export type ApiError = {
  message: string;
  code: string;
  details?: unknown;
};

export type ApiResponse<T> = {
  data: T;
  meta?: ApiPaginationMeta;
};

export type ApiErrorResponse = {
  error: ApiError;
};

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
