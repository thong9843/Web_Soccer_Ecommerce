import { API_URL } from './config';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Lấy dữ liệu công khai (danh mục, sản phẩm) từ Server Component. Không gửi thông tin đăng nhập. */
export async function apiGet<T>(
  path: string,
  options: { revalidate?: number } = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate: options.revalidate ?? 60 },
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = Array.isArray(body.message) ? body.message[0] : body.message;
    } catch {
      // giữ statusText
    }
    throw new ApiError(res.status, message);
  }
  return res.json() as Promise<T>;
}

/** Chuyển object query thành chuỗi, bỏ giá trị rỗng. */
export function toQuery(
  params: Record<string, string | number | string[] | undefined>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    search.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const s = search.toString();
  return s ? `?${s}` : '';
}
