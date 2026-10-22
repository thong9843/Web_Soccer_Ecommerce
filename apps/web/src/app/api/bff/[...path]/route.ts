import { NextRequest, NextResponse } from 'next/server';
import type { AuthResponse } from '@football/shared';
import { API_URL, COOKIE } from '@/lib/config';

/**
 * Proxy (BFF) giữa trình duyệt và API NestJS.
 * - JWT nằm trong cookie httpOnly, JavaScript phía trình duyệt không đọc được.
 * - Tự refresh token khi access token hết hạn.
 * - Giữ token giỏ hàng của khách trong cookie.
 */

/** Cookie chỉ gắn Secure khi request thật sự đi qua HTTPS (tránh mất cookie khi chạy http://localhost). */
function cookieOptions(req: NextRequest) {
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol;
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: proto.replace(':', '') === 'https',
    path: '/',
  };
}
type CookieOptions = ReturnType<typeof cookieOptions>;
const ACCESS_MAX_AGE = 14 * 60; // ngắn hơn TTL 15 phút của access token
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;
const CART_MAX_AGE = 30 * 24 * 60 * 60;

type Params = { params: Promise<{ path: string[] }> };

// Nhiều request song song có thể cùng mang một refresh token cũ (vd. trang tải cả giỏ hàng và
// thông tin user). API thu hồi toàn bộ phiên nếu thấy token cũ bị dùng lại, nên gộp các lần
// refresh trùng nhau và giữ kết quả vài giây cho request đến muộn. Chỉ hiệu lực trong một tiến trình.
const REFRESH_GRACE_MS = 15_000;
const refreshCache = new Map<string, Promise<AuthResponse | null>>();

function refreshSession(refreshToken: string): Promise<AuthResponse | null> {
  const cached = refreshCache.get(refreshToken);
  if (cached) return cached;

  const promise = fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
    cache: 'no-store',
  })
    .then((r) => (r.ok ? (r.json() as Promise<AuthResponse>) : null))
    .catch(() => null);

  refreshCache.set(refreshToken, promise);
  setTimeout(
    () => refreshCache.delete(refreshToken),
    REFRESH_GRACE_MS,
  ).unref?.();
  return promise;
}

function setSessionCookies(
  res: NextResponse,
  session: AuthResponse,
  opts: CookieOptions,
) {
  res.cookies.set(COOKIE.access, session.accessToken, {
    ...opts,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookies.set(COOKIE.refresh, session.refreshToken, {
    ...opts,
    maxAge: REFRESH_MAX_AGE,
  });
}

function clearSessionCookies(res: NextResponse, opts: CookieOptions) {
  res.cookies.set(COOKIE.access, '', { ...opts, maxAge: 0 });
  res.cookies.set(COOKIE.refresh, '', { ...opts, maxAge: 0 });
}

function forward(
  req: NextRequest,
  path: string,
  body: string | undefined,
  accessToken: string | undefined,
  cartToken: string | undefined,
) {
  const headers: Record<string, string> = {};
  const contentType = req.headers.get('content-type');
  if (contentType) headers['content-type'] = contentType;
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;
  if (cartToken) headers['x-cart-token'] = cartToken;
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) headers['x-forwarded-for'] = forwardedFor;

  return fetch(`${API_URL}/${path}${req.nextUrl.search}`, {
    method: req.method,
    headers,
    body,
    cache: 'no-store',
  });
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function handle(req: NextRequest, { params }: Params) {
  const segments = (await params).path;
  if (segments.some((s) => !s || s === '.' || s === '..')) {
    return json({ message: 'Đường dẫn không hợp lệ' }, 400);
  }
  const path = segments.join('/');
  const opts = cookieOptions(req);

  // Chặn request ghi từ origin khác (CSRF); cookie SameSite=Lax là lớp bảo vệ thứ hai.
  const origin = req.headers.get('origin');
  if (
    req.method !== 'GET' &&
    origin &&
    new URL(origin).host !== req.nextUrl.host
  ) {
    return json({ message: 'Origin không hợp lệ' }, 403);
  }

  // Đăng nhập/đăng ký không dùng token cũ; các route khác (kể cả auth/me) được tự refresh.
  const isAuthPath = path === 'auth/login' || path === 'auth/register';
  // Refresh do proxy tự xử lý, không cho trình duyệt gọi trực tiếp.
  if (path === 'auth/refresh') return json({ message: 'Not found' }, 404);

  let accessToken = req.cookies.get(COOKIE.access)?.value;
  const refreshToken = req.cookies.get(COOKIE.refresh)?.value;
  const cartToken = req.cookies.get(COOKIE.cart)?.value;
  const body =
    req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await req.text();

  if (path === 'auth/logout') {
    if (refreshToken) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        cache: 'no-store',
      }).catch(() => undefined);
    }
    const res = new NextResponse(null, { status: 204 });
    clearSessionCookies(res, opts);
    return res;
  }

  let refreshed: AuthResponse | null = null;
  let refreshFailed = false;
  if (!accessToken && refreshToken && !isAuthPath) {
    refreshed = await refreshSession(refreshToken);
    refreshFailed = !refreshed;
    accessToken = refreshed?.accessToken;
  }

  let upstream = await forward(req, path, body, accessToken, cartToken);

  if (
    upstream.status === 401 &&
    refreshToken &&
    !refreshed &&
    !refreshFailed &&
    !isAuthPath
  ) {
    refreshed = await refreshSession(refreshToken);
    refreshFailed = !refreshed;
    if (refreshed) {
      upstream = await forward(
        req,
        path,
        body,
        refreshed.accessToken,
        cartToken,
      );
    }
  }

  const text = await upstream.text();
  let res: NextResponse;

  if ((path === 'auth/login' || path === 'auth/register') && upstream.ok) {
    // Token chỉ đi vào cookie; trình duyệt chỉ nhận thông tin user.
    const session = JSON.parse(text) as AuthResponse;
    res = json({ user: session.user }, upstream.status);
    setSessionCookies(res, session, opts);
    return res;
  }

  res =
    upstream.status === 204
      ? new NextResponse(null, { status: 204 })
      : new NextResponse(text, {
          status: upstream.status,
          headers: {
            'content-type':
              upstream.headers.get('content-type') ?? 'application/json',
          },
        });

  if (refreshed) setSessionCookies(res, refreshed, opts);
  if (refreshFailed) clearSessionCookies(res, opts);

  // Lưu token giỏ hàng của khách để các lần sau gửi lại.
  if (upstream.ok && path.startsWith('cart')) {
    try {
      const token = (JSON.parse(text) as { token?: string | null }).token;
      if (typeof token === 'string') {
        res.cookies.set(COOKIE.cart, token, { ...opts, maxAge: CART_MAX_AGE });
      }
    } catch {
      // không phải JSON
    }
  }
  return res;
}

export { handle as GET, handle as POST, handle as PATCH, handle as DELETE };
