/** Số điện thoại di động Việt Nam, khớp với quy tắc ở backend. */
const VN_PHONE = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

export function isValidPhone(value: string): boolean {
  return VN_PHONE.test(value.replace(/[\s.-]/g, ''));
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Chỉ cho chuyển hướng nội bộ sau đăng nhập, chặn open-redirect (`//evil.com`, `https://...`). */
export function safeNext(
  next: string | null | undefined,
  fallback = '/',
): string {
  if (
    !next ||
    !next.startsWith('/') ||
    next.startsWith('//') ||
    next.includes('\\')
  )
    return fallback;
  return next;
}
