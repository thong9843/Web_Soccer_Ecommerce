// Chạy Postgres cục bộ không cần Docker (dùng binary từ npm). Dữ liệu lưu ở <root>/.pgdata.
// Dùng: `pnpm db:start` (giữ terminal mở, Ctrl+C để dừng).
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';

const databaseDir = resolve(import.meta.dirname, '../../../.pgdata');
const port = Number(process.env.PG_PORT ?? 5432);
const DATABASES = ['football', 'football_test'];

const pg = new EmbeddedPostgres({
  databaseDir,
  user: 'football',
  password: 'football',
  port,
  persistent: true,
  // Mặc định initdb dùng locale Windows (WIN1252) nên không lưu được tiếng Việt.
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) {
  console.log('Khởi tạo cluster Postgres mới tại', databaseDir);
  await pg.initialise();
}

await pg.start();

for (const name of DATABASES) {
  try {
    await pg.createDatabase(name);
    console.log(`Đã tạo database "${name}"`);
  } catch {
    // đã tồn tại
  }
}

console.log(
  `Postgres đang chạy: postgresql://football:football@localhost:${port}/football`,
);
console.log('Nhấn Ctrl+C để dừng.');

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await pg.stop();
  process.exit(0);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
setInterval(() => undefined, 1 << 30);
