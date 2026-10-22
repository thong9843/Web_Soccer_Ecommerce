/** URL gốc của API NestJS (chỉ dùng phía server của Next). */
export const API_URL =
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api/v1';

export const COOKIE = {
  access: 'fg_at',
  refresh: 'fg_rt',
  cart: 'fg_cart',
} as const;
