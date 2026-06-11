/**
 * 서버 API 응답의 기본 형태.
 * TransformInterceptor가 자동으로 `success: true`를 추가합니다.
 */
/**
 * 서버 API 응답의 기본 형태.
 * TransformInterceptor가 자동으로 `success: true`를 추가하며, 나머지 속성은 루트에 병합됩니다.
 */
export type ApiResponse<T = unknown> = {
  success: boolean;
} & T;

/**
 * 페이지네이션이 포함된 API 응답
 */
export type PaginatedResponse<T = unknown> = {
  success: boolean;
  page: number;
  limit: number;
  totalCount: number;
} & T;

/**
 * 에러 응답 형태
 */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

/**
 * axios 에러에서 서버 메시지를 추출하는 헬퍼
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }
  if (error instanceof Error) return error.message;
  return '오류가 발생했습니다.';
}
