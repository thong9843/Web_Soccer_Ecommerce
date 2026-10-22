import { validateEnv } from './env.validation.js';

const good = {
  DATABASE_URL: 'postgresql://x',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validateEnv', () => {
  it('chấp nhận cấu hình đủ', () => {
    expect(validateEnv(good)).toEqual(good);
  });

  it('báo thiếu biến bắt buộc', () => {
    expect(() => validateEnv({ ...good, DATABASE_URL: '' })).toThrow(
      /DATABASE_URL/,
    );
  });

  it('từ chối secret ngắn', () => {
    expect(() => validateEnv({ ...good, JWT_ACCESS_SECRET: 'short' })).toThrow(
      /32/,
    );
  });

  it('từ chối secret mẫu ở production', () => {
    const sample = {
      ...good,
      JWT_REFRESH_SECRET: 'change-me-' + 'x'.repeat(30),
    };
    expect(() => validateEnv({ ...sample, NODE_ENV: 'production' })).toThrow(
      /giá trị mẫu/,
    );
    expect(() =>
      validateEnv({ ...sample, NODE_ENV: 'development' }),
    ).not.toThrow();
  });
});
