# Football Gear — cổng thương mại điện tử đồ bóng đá

Dự án học tập: bán giày, quần áo, phụ kiện bóng đá chính hãng tại Việt Nam. Chi tiết kế hoạch xem [plan.md](plan.md).

## Cấu trúc

```
apps/api         NestJS (REST) + Prisma + PostgreSQL
apps/web         Next.js (App Router) + Tailwind CSS
packages/shared  Type và hằng số dùng chung (Role, OrderStatus, DTO...)
docs/            Wireframe, ghi nguồn model 3D
```

## Yêu cầu

- Node.js >= 22, pnpm (`corepack enable` hoặc `npm i -g pnpm`)
- PostgreSQL: dùng **Docker** (`docker compose up -d`) **hoặc** Postgres nhúng không cần Docker (`pnpm db:start`)

## Chạy local

```bash
pnpm install
cp .env.example apps/api/.env              # PowerShell: Copy-Item .env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
pnpm build:shared                          # build package dùng chung (làm lại khi sửa packages/shared)

# 1) Database — chọn một:
docker compose up -d                       # cần Docker
pnpm db:start                              # hoặc Postgres nhúng; giữ terminal này mở (dữ liệu ở .pgdata/)

# 2) Tạo bảng và dữ liệu mẫu (terminal khác)
pnpm db:migrate
pnpm db:seed

# 3) Chạy ứng dụng
pnpm dev:api    # http://localhost:4000/api/v1  — Swagger: http://localhost:4000/api/docs
pnpm dev:web    # http://localhost:3000
```

Tài khoản mẫu (chỉ tạo ở môi trường dev):

| Vai trò | Email                    | Mật khẩu        |
| ------- | ------------------------ | --------------- |
| ADMIN   | `admin@football.local`   | `Admin@12345`   |
| MANAGER | `manager@football.local` | `Manager@12345` |
| USER    | `user@football.local`    | `User@12345`    |

## Kiểm thử

```bash
pnpm lint
pnpm test                 # unit test
pnpm --filter api test:e2e  # e2e trên database football_test (cần DB đang chạy)
pnpm format:check
```

E2E dùng database riêng `football_test`, được tạo sẵn bởi Docker Compose (`docker/init-db.sql`, chỉ chạy khi volume còn trống) hoặc `pnpm db:start`. Migration được áp dụng tự động trước khi chạy.

## Ghi chú kỹ thuật

- **API versioning**: prefix `/api/v1`. Phân quyền kiểm tra ở backend bằng Guard (`JwtAuthGuard` → `RolesGuard`), dùng `@Public()` và `@Roles(...)`. Guard đọc user từ DB mỗi request nên khóa tài khoản/đổi vai trò có hiệu lực ngay.
- **Auth**: access token JWT (15 phút) + refresh token ngẫu nhiên lưu dạng hash trong DB, xoay vòng mỗi lần refresh; dùng lại token đã thu hồi sẽ thu hồi toàn bộ phiên.
- **Web gọi API qua proxy của Next** (`/api/bff/*`, [route.ts](apps/web/src/app/api/bff/[...path]/route.ts)): JWT nằm trong cookie httpOnly, trình duyệt không đọc được token; proxy tự refresh khi access token hết hạn và lưu token giỏ hàng của khách. Cơ chế gộp các lần refresh trùng nhau chỉ có hiệu lực trong một tiến trình Next (đủ cho một instance; nếu chạy nhiều instance cần dùng kho chung như Redis).
- **Rate limit theo IP**: vì mọi request từ web đến API đều đi qua proxy, đặt `TRUST_PROXY=1` ở API khi triển khai để API lấy IP khách thật từ `x-forwarded-for` (chỉ nên bật khi API không mở trực tiếp ra internet).
- **Giỏ hàng & đơn hàng**: giỏ lưu ở server (khách dùng `x-cart-token`, được gộp vào giỏ user khi đăng nhập). Đặt hàng chạy trong một transaction: giá luôn lấy từ DB, trừ kho có điều kiện nên hai đơn tranh nhau món cuối cùng chỉ một đơn thành công. Miễn phí vận chuyển từ 1.000.000₫, dưới mức đó phí 30.000₫ ([pricing.ts](apps/api/src/orders/pricing.ts)).
- **Dữ liệu ảnh mẫu** dùng placehold.co; thay bằng Cloudinary ở giai đoạn 3.
- **Giá**: lưu VND dạng số nguyên.
- **Postgres nhúng** khởi tạo với `--locale=C` để dùng UTF8 trên Windows; vì vậy tìm kiếm không phân biệt hoa/thường chỉ chính xác với ký tự ASCII (Docker/Neon không bị giới hạn này).
- Prisma client sinh ra ở `apps/api/src/generated` (không commit); chạy `pnpm --filter api db:generate` nếu thiếu.

## Tiến độ

Xem checklist ở [plan.md](plan.md) mục 8.
