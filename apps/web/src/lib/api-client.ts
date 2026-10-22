'use client';

export class ClientApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: string[] = [],
  ) {
    super(message);
  }
}

/**
 * Gọi API qua proxy của Next (/api/bff/*). Token nằm trong cookie httpOnly nên
 * JavaScript phía trình duyệt không bao giờ đọc được JWT.
 */
export async function api<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`/api/bff${path}`, {
    method: init.method ?? 'GET',
    headers:
      init.body !== undefined
        ? { 'content-type': 'application/json' }
        : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const raw = data?.message;
    const details: string[] = Array.isArray(raw) ? raw : raw ? [raw] : [];
    throw new ClientApiError(
      res.status,
      details[0] ?? 'Đã có lỗi xảy ra',
      details,
    );
  }
  return data as T;
}

export const fetcher = <T>(path: string) => api<T>(path);
