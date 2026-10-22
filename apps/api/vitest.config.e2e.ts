import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// E2E chạy trên database riêng `football_test` (tạo bởi `pnpm db:start`).
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://football:football@localhost:5432/football_test';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Các file test dùng chung một DB nên chạy lần lượt.
    fileParallelism: false,
    testTimeout: 30_000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: 'test-access-secret-test-access-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret-test-refresh-secret',
      WEB_ORIGIN: 'http://localhost:3000',
    },
  },
});
