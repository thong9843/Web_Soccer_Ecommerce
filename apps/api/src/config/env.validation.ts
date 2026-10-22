const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

/** Kiểm tra biến môi trường lúc khởi động; dừng sớm nếu cấu hình sai. */
export function validateEnv(config: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !config[key]);
  if (missing.length > 0) {
    throw new Error(`Thiếu biến môi trường: ${missing.join(', ')}`);
  }

  const isProd = config.NODE_ENV === 'production';
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const) {
    const value = String(config[key]);
    if (value.length < 32) {
      throw new Error(`${key} phải dài ít nhất 32 ký tự`);
    }
    if (isProd && value.startsWith('change-me')) {
      throw new Error(
        `${key} vẫn là giá trị mẫu, hãy đổi trước khi chạy production`,
      );
    }
  }
  return config;
}
