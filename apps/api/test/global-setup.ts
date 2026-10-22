import { execSync } from 'node:child_process';

export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ??
    'postgresql://football:football@localhost:5432/football_test';
  // Áp dụng migration lên DB test trước khi chạy.
  execSync('npx prisma migrate deploy', {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'pipe',
  });
}
