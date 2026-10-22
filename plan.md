# PLAN: Football Gear Ecommerce Portal

> File này dành cho Claude Code. Làm theo từng giai đoạn, xong giai đoạn nào chạy được và test được rồi mới sang giai đoạn tiếp theo. Hỏi lại người dùng khi gặp điểm chưa rõ thay vì tự đoán.

## 1. Bối cảnh

- Web bán giày, quần áo, phụ kiện bóng đá, hàng chính hãng, chỉ bán tại Việt Nam.
- Dự án cá nhân để học tập, một người làm, ngân sách 0 đồng (chỉ dùng gói free, dữ liệu mẫu).
- Giao diện đẹp, nhiều chuyển động, có Three.js ở các điểm chính.
- Ngôn ngữ giao diện: tiếng Việt. Tiền tệ: VND.
- Chưa bán thật, nhưng có thể sau này (nên thiết kế sạch, dễ mở rộng).

## 2. Công nghệ

| Tầng | Chọn |
| --- | --- |
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS |
| 3D / animation | Three.js qua React Three Fiber + Drei; GSAP hoặc Framer Motion |
| Backend / API | NestJS (REST), JWT access token + refresh token, Swagger/OpenAPI |
| Database | PostgreSQL + Prisma ORM |
| Cache | Redis (giỏ hàng, rate limit); có thể bỏ ở MVP |
| Lưu ảnh / model | Cloudinary (gói free) |
| Hosting (free) | Vercel (web), Render (API), Neon hoặc Supabase (Postgres) |
| Dev local | Docker Compose (Postgres, Redis) |
| Cấu trúc repo | Monorepo: `apps/web`, `apps/api`, `packages/shared` (type dùng chung) |

Luồng chạy: Trình duyệt (Next.js) gọi API, backend kiểm tra đăng nhập + vai trò, xử lý logic, đọc/ghi Postgres qua Prisma, trả JSON. Frontend không bao giờ gọi DB trực tiếp.

## 3. Danh mục sản phẩm (menu xổ xuống)

Hover vào nhóm cha thì mở mega-menu liệt kê nhóm con. Mỗi danh mục có URL riêng (ví dụ `/giay/co-nhan-tao`) và bộ lọc theo thương hiệu, size, giá. Mobile: menu dạng bấm để mở.

```
Giày
  Giày cỏ nhân tạo (TF)
  Giày cỏ tự nhiên (FG)
  Giày đinh tháo rời (SG)
  Giày futsal (IC)
  Giày trẻ em
Quần áo
  Áo đấu CLB
  Áo đấu đội tuyển
  Quần short
  Đồ tập luyện
  Áo khoác và áo gió
  Đồ thủ môn
Phụ kiện
  Bóng
  Tất và băng bảo vệ
  Bọc ống đồng
  Găng tay thủ môn
  Balo và túi giày
  Băng đội trưởng
```

Danh mục lưu trong DB (bảng `categories` có `parent_id`), không hard-code, để admin sửa được.

## 4. Phân quyền (RBAC)

Vai trò: `GUEST` (chưa đăng nhập), `USER`, `MANAGER` (nhân viên vận hành), `ADMIN` (chủ hệ thống). Kiểm tra quyền ở backend bằng Guard, frontend chỉ ẩn/hiện giao diện.

| Chức năng | Guest | User | Manager | Admin |
| --- | --- | --- | --- | --- |
| Xem sản phẩm, tìm kiếm, lọc | Có | Có | Có | Có |
| Giỏ hàng, đặt hàng | Có, phải điền thông tin giao hàng | Có | Có | Có |
| Hồ sơ, địa chỉ, lịch sử đơn, wishlist, review | Không | Có | Có | Có |
| Thêm/sửa/ẩn sản phẩm, danh mục, tồn kho (upload) | Không | Không | Có | Có |
| Xử lý đơn (xác nhận, giao, hoàn/hủy) | Không | Không | Có | Có |
| Quản lý banner, mã giảm giá, duyệt review | Không | Không | Có | Có |
| Xem báo cáo doanh thu | Không | Không | Chỉ xem | Đầy đủ |
| Tạo/khóa tài khoản, gán vai trò | Không | Không | Không | Có |
| Cấu hình hệ thống, nhật ký thao tác | Không | Không | Không | Có |

Ràng buộc: ghi audit log cho thao tác của Manager/Admin; không cho xóa Admin cuối cùng; user chỉ xem/sửa dữ liệu của chính mình.

## 5. Database (đề xuất, chỉnh khi code)

- `users` (id, email, password_hash, full_name, phone, role, is_active, created_at)
- `addresses` (id, user_id, receiver_name, phone, province, district, ward, street, is_default)
- `categories` (id, parent_id, name, slug, sort_order, is_active)
- `brands` (id, name, slug, logo_url)
- `products` (id, category_id, brand_id, name, slug, description, base_price, is_active, model_3d_url nullable, created_at)
- `product_images` (id, product_id, url, sort_order)
- `product_variants` (id, product_id, sku, size, color, stud_type nullable, price, stock)
- `carts`, `cart_items` (hỗ trợ cả guest bằng cart token)
- `orders` (id, user_id nullable, guest_name, guest_phone, guest_email, ship_address, status, payment_method, total, note, created_at)
- `order_items` (id, order_id, variant_id, qty, unit_price, custom_name nullable, custom_number nullable)
- `team_orders` (id, order_id, team_name, note), cầu thủ in tên/số lưu ở `order_items` (custom_name, custom_number)
- `reviews`, `wishlists` (giai đoạn 2)
- `coupons` (giai đoạn 2)
- `audit_logs` (id, actor_id, action, entity, entity_id, meta, created_at)

Trạng thái đơn: `PENDING` → `CONFIRMED` → `SHIPPING` → `DELIVERED`; nhánh `CANCELLED`, `RETURNED`.

## 6. API (REST, prefix `/api/v1`)

- Auth: `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`
- Public: `GET /categories` (dạng cây), `GET /products` (lọc: category, brand, size, giá, sắp xếp, phân trang), `GET /products/:slug`
- Cart/Order: `POST /cart`, `PATCH /cart/items/:id`, `POST /orders` (guest hoặc user), `GET /orders/me`, `GET /orders/:id`
- Team order: `POST /orders/team` (danh sách cầu thủ: tên, số áo, size)
- Admin/Manager: CRUD `/admin/products`, `/admin/categories`, `/admin/brands`; `POST /admin/uploads` (ảnh qua Cloudinary); `POST /admin/products/import` (CSV); `GET/PATCH /admin/orders`; `GET /admin/reports/revenue`
- Admin only: `/admin/users` (khóa, gán vai trò), `/admin/audit-logs`

Tài liệu Swagger tại `/api/docs`. Validate input bằng DTO + class-validator. Rate limit cho auth.

## 7. Three.js và hiệu ứng

- Hero trang chủ: đôi giày 3D xoay theo con trỏ chuột, quả bóng lăn theo thanh cuộn.
- Trang sản phẩm: xem 360° (giai đoạn 2), đổi màu thì model đổi theo.
- Thẻ sản phẩm: hiệu ứng nghiêng 3D khi hover (CSS/GSAP, dùng ảnh thường cho nhẹ).
- Chuyển trang mượt, hiệu ứng ở nút "Thêm vào giỏ".

Nguyên tắc hiệu năng: model `.glb` nén Draco, dưới 1–2 MB mỗi model; lazy-load canvas; chỉ render khi trong khung nhìn; tắt/giảm hiệu ứng trên máy yếu và khi `prefers-reduced-motion`; luôn có ảnh tĩnh dự phòng; SEO nội dung dùng SSR, 3D chỉ là lớp trang trí.

Model 3D: dùng model miễn phí (giày, bóng) từ Free3D, Sketchfab, itch.io. Phải kiểm tra giấy phép từng model (CC0 dùng tự do, CC-BY phải ghi nguồn, tránh bản cấm thương mại) và không dùng model nhái logo hãng. Ghi nguồn + giấy phép vào `docs/3d-credits.md`.

## 8. Lộ trình (làm một mình, khoảng 10–15 giờ/tuần)

Mỗi giai đoạn kết thúc bằng bản chạy được.

**Giai đoạn 0. Chuẩn bị (1–2 tuần)**
- [x] Wireframe các trang chính (`docs/wireframes.md`), chốt schema DB, seed danh mục
- [x] Khởi tạo monorepo, Docker Compose, lint, format

**Giai đoạn 1. Nền tảng (2–3 tuần)**
- [x] Prisma schema + migration + seed (danh mục, vài sản phẩm mẫu)
- [x] Auth (đăng ký, đăng nhập, refresh token) + RBAC Guard
- [x] API danh mục (cây) và sản phẩm (lọc, phân trang)
- [x] CI cơ bản (lint + test) — workflow `.github/workflows/ci.yml` đã viết; chưa chạy trên GitHub (thư mục chưa phải git repo), các bước tương đương đã chạy local

**Giai đoạn 2. Storefront (3–4 tuần)**
- [x] Layout, header với mega-menu xổ xuống theo danh mục
- [x] Trang danh sách (bộ lọc, sắp xếp) và trang chi tiết (chọn size/màu)
- [x] Giỏ hàng, checkout cho guest (bắt buộc điền thông tin giao hàng) và user, thanh toán COD
- [x] Trang tài khoản: hồ sơ, địa chỉ, lịch sử đơn

**Giai đoạn 3. Admin / Manager (2–3 tuần)**
- [ ] Layout trang quản trị theo vai trò
- [ ] Form upload sản phẩm: nhiều ảnh (Cloudinary), biến thể size/màu, tồn kho, ẩn/hiện; import CSV
- [ ] Quản lý danh mục, thương hiệu, đơn hàng (đổi trạng thái)
- [ ] Admin: quản lý người dùng, gán vai trò, audit log

**Giai đoạn 4. Three.js (2–3 tuần)**
- [ ] Hero 3D trang chủ, hiệu ứng thẻ sản phẩm, chuyển trang
- [ ] Tối ưu hiệu năng, fallback ảnh tĩnh, test trên mobile

**Giai đoạn 5. Kiểm thử và ra mắt (2 tuần)**
- [ ] Test chức năng chính, bảo mật cơ bản (rate limit, validate, phân quyền)
- [ ] Deploy Vercel + Render + Neon/Supabase

**Giai đoạn 6. Sau ra mắt**
- [ ] Đặt hàng theo đội: chọn mẫu, nhập tên và số áo từng cầu thủ
- [ ] Mã giảm giá, review, wishlist, xem 360°, báo cáo doanh thu, email tự động
- [ ] Thanh toán online (VNPay/MoMo), tích hợp vận chuyển (GHN, GHTK)

## 9. Rủi ro

| Rủi ro | Cách xử lý |
| --- | --- |
| 3D làm web nặng, lag trên điện thoại | Model nhẹ, lazy-load, ảnh tĩnh dự phòng, test máy yếu |
| Không có sẵn model 3D cho từng sản phẩm | 3D chỉ cho trang chủ/sản phẩm nổi bật, còn lại ảnh thường |
| Nhiều biến thể (size, màu, loại đinh) | Thiết kế `product_variants` và tồn kho theo biến thể ngay từ đầu |
| SEO kém nếu render 3D phía client | Next.js SSR cho nội dung, 3D là lớp trang trí |
| Bản quyền ảnh/model/thương hiệu | Chỉ dùng ảnh được phép, kiểm tra giấy phép model, ghi nguồn |
| Gói free bị giới hạn, server ngủ | Chấp nhận khi học tập; cân nhắc chuyển sang gói trả phí nếu bán thật |
| Nếu bán thật sau này | Tìm hiểu thủ tục kinh doanh và đăng ký website thương mại điện tử tại Việt Nam trước |

## 10. Quy ước cho Claude Code

- Dùng TypeScript chặt (`strict`), tách module theo domain trong NestJS (auth, users, catalog, cart, orders, admin).
- Mỗi API mới có DTO validate + ghi Swagger; viết test cho auth, phân quyền và tính tiền đơn hàng.
- Không commit secret; dùng `.env` + `.env.example`.
- Dữ liệu mẫu qua seed script; tên danh mục, slug theo mục 3.
- Cuối mỗi giai đoạn: cập nhật README (cách chạy local) và tick checklist ở mục 8.
