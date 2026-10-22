# Wireframe các trang chính

Phác thảo ASCII để thống nhất bố cục trước khi code giao diện. Chỉnh khi thiết kế thật.

## Header + mega-menu (mọi trang)

```
+----------------------------------------------------------------------------+
| [LOGO]   Giày v    Quần áo v    Phụ kiện v     [ Tìm kiếm... ]  ♡  👤  🛒(2)|
+----------------------------------------------------------------------------+
   hover "Giày" →
   +--------------------------------------------------------+
   | Giày cỏ nhân tạo (TF)     | Giày futsal (IC)           |
   | Giày cỏ tự nhiên (FG)     | Giày trẻ em                |
   | Giày đinh tháo rời (SG)   |                            |
   +--------------------------------------------------------+
Mobile: nút ☰ mở drawer, bấm nhóm cha để xổ nhóm con.
```

## Trang chủ `/`

```
+------------------------------------------------------------+
| HERO: giày 3D xoay theo chuột (ảnh tĩnh dự phòng)           |
|  "Trang bị cho trận đấu của bạn"        [Mua ngay]          |
+------------------------------------------------------------+
| Danh mục nổi bật:  [Giày] [Quần áo] [Phụ kiện]              |
| Sản phẩm mới       [card][card][card][card]                 |
| Banner khuyến mãi / bóng lăn theo thanh cuộn                |
| Thương hiệu: Nike Adidas Puma Mizuno ...                    |
+------------------------------------------------------------+
| Footer: chính sách, liên hệ, đổi trả                        |
```

## Danh sách `/giay/co-nhan-tao`

```
Trang chủ > Giày > Giày cỏ nhân tạo (TF)
+------------+-----------------------------------------------+
| BỘ LỌC     | 24 sản phẩm              Sắp xếp: [Mới nhất v] |
| Thương hiệu| [card][card][card]                            |
|  ☐ Nike    | [card][card][card]                            |
|  ☐ Adidas  | [card][card][card]                            |
| Size       |                                               |
|  [40][41]  |        « 1 2 3 »                              |
| Giá        |                                               |
|  ───●──●── |                                               |
+------------+-----------------------------------------------+
Card: ảnh (nghiêng 3D khi hover) / hãng / tên / giá / nhãn "Hết hàng"
Mobile: bộ lọc là bottom sheet.
```

## Chi tiết `/san-pham/[slug]`

```
+---------------------------+--------------------------------+
| [ảnh lớn / 360° (GĐ 2)]   | Hãng · Tên sản phẩm            |
| [thumb][thumb][thumb]     | 1.890.000đ                     |
|                           | Màu: (●)(●)                    |
|                           | Size: [40][41][42 hết][43]     |
|                           | Số lượng [-1+]                 |
|                           | [ Thêm vào giỏ ]               |
+---------------------------+--------------------------------+
| Mô tả | Thông số | Chính sách đổi trả                       |
| Sản phẩm liên quan                                          |
```

## Giỏ hàng `/gio-hang` và thanh toán `/thanh-toan`

```
Giỏ hàng: bảng [ảnh | tên, size, màu | đơn giá | SL | thành tiền | xóa]
          Tạm tính / Phí ship / Tổng      [Tiến hành đặt hàng]

Thanh toán (guest bắt buộc điền; user dùng sổ địa chỉ):
  Họ tên*  SĐT*  Email
  Tỉnh/Thành*  Quận/Huyện*  Phường/Xã*  Địa chỉ*
  Ghi chú
  Thanh toán: (●) COD — trả tiền khi nhận hàng
  Tóm tắt đơn                              [Đặt hàng]
→ Trang cảm ơn: mã đơn, tóm tắt, link tra cứu
```

## Tài khoản `/tai-khoan`

```
Sidebar: Hồ sơ | Địa chỉ | Đơn hàng | Yêu thích
Đơn hàng: bảng mã đơn / ngày / trạng thái (PENDING→DELIVERED) / tổng, bấm xem chi tiết
```

## Quản trị `/admin` (hiển thị theo vai trò)

```
+----------+-------------------------------------------------+
| Sidebar  | Tiêu đề trang                       [+ Thêm mới] |
| Sản phẩm |  bảng + tìm kiếm + lọc                          |
| Danh mục |                                                 |
| Thương hiệu  Form sản phẩm: thông tin, nhiều ảnh (kéo thả),|
| Đơn hàng |  bảng biến thể (size/màu/loại đinh/giá/tồn kho),|
| Báo cáo* |  bật/tắt hiển thị.   Import CSV                 |
| Người dùng** Đơn hàng: đổi trạng thái theo luồng           |
| Nhật ký**|                                                 |
+----------+-------------------------------------------------+
 * Manager chỉ xem   ** chỉ Admin
```
