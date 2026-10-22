import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, createUser, resetDb } from './helpers.js';

const shipping = {
  name: 'Nguyễn Văn A',
  phone: '0901 234 567',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  street: '12 Lê Lợi',
};

describe('Cart & Orders (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let cheap: { id: string }; // 290.000đ, 2 trong kho
  let pricey: { id: string }; // 1.500.000đ, 10 trong kho
  let lastOne: { id: string }; // 500.000đ, còn đúng 1
  const api = () => request(app.getHttpServer());

  const addToCart = (
    variantId: string,
    qty: number,
    token?: string,
    auth?: string,
  ) => {
    const req = api().post('/api/v1/cart/items').send({ variantId, qty });
    if (token) req.set('x-cart-token', token);
    if (auth) req.set('Authorization', `Bearer ${auth}`);
    return req;
  };
  const checkout = (
    token?: string,
    auth?: string,
    body: object = { shipping },
  ) => {
    const req = api().post('/api/v1/orders').send(body);
    if (token) req.set('x-cart-token', token);
    if (auth) req.set('Authorization', `Bearer ${auth}`);
    return req;
  };
  const stockOf = async (id: string) =>
    (await prisma.productVariant.findUniqueOrThrow({ where: { id } })).stock;
  const login = async (email: string) =>
    (
      await api()
        .post('/api/v1/auth/login')
        .send({ email, password: 'MatKhau123' })
    ).body.accessToken as string;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  afterAll(() => app.close());

  beforeEach(async () => {
    await resetDb(prisma);
    const cat = await prisma.category.create({
      data: { name: 'Bóng', slug: 'bong' },
    });
    const brand = await prisma.brand.create({
      data: { name: 'Nike', slug: 'nike' },
    });
    const product = await prisma.product.create({
      data: {
        name: 'Sản phẩm test',
        slug: 'san-pham-test',
        basePrice: 290000,
        categoryId: cat.id,
        brandId: brand.id,
      },
    });
    const v = (sku: string, price: number, stock: number) =>
      prisma.productVariant.create({
        data: {
          productId: product.id,
          sku,
          size: '5',
          color: sku,
          price,
          stock,
        },
      });
    cheap = await v('CHEAP', 290000, 2);
    pricey = await v('PRICEY', 1500000, 10);
    lastOne = await v('LAST', 500000, 1);
  });

  describe('giỏ hàng', () => {
    it('guest thêm hàng, nhận token và xem lại giỏ bằng token', async () => {
      const res = await addToCart(cheap.id, 2).expect(201);
      expect(res.body.token).toBeTruthy();
      expect(res.body).toMatchObject({
        itemCount: 2,
        subtotal: 580000,
        shippingFee: 30000,
        total: 610000,
      });

      const again = await api()
        .get('/api/v1/cart')
        .set('x-cart-token', res.body.token)
        .expect(200);
      expect(again.body.items).toHaveLength(1);
      expect(again.body.items[0]).toMatchObject({
        unitPrice: 290000,
        qty: 2,
        lineTotal: 580000,
      });
    });

    it('thêm cùng biến thể thì cộng dồn số lượng', async () => {
      const first = await addToCart(pricey.id, 1);
      const second = await addToCart(pricey.id, 2, first.body.token);
      expect(second.body.items).toHaveLength(1);
      expect(second.body.items[0].qty).toBe(3);
      expect(second.body.shippingFee).toBe(0); // 4.500.000đ ≥ ngưỡng miễn ship
    });

    it('không cho vượt tồn kho hoặc mua hàng hết kho / không tồn tại', async () => {
      await addToCart(cheap.id, 3).expect(400);
      await prisma.productVariant.update({
        where: { id: cheap.id },
        data: { stock: 0 },
      });
      await addToCart(cheap.id, 1).expect(400);
      await addToCart('00000000-0000-4000-8000-000000000000', 1).expect(404);
      await addToCart(pricey.id, 0).expect(400);
    });

    it('sản phẩm bị ẩn không thêm được và biến mất khỏi giỏ', async () => {
      const res = await addToCart(pricey.id, 1);
      await prisma.productVariant.update({
        where: { id: pricey.id },
        data: { isActive: false },
      });
      const cart = await api()
        .get('/api/v1/cart')
        .set('x-cart-token', res.body.token);
      expect(cart.body.items).toHaveLength(0);
      await addToCart(pricey.id, 1).expect(404);
    });

    it('sửa / xóa dòng; người khác không đụng được vào giỏ của mình', async () => {
      const mine = await addToCart(pricey.id, 2);
      const item = mine.body.items[0];
      const other = await addToCart(cheap.id, 1);

      await api()
        .patch(`/api/v1/cart/items/${item.id}`)
        .set('x-cart-token', other.body.token)
        .send({ qty: 1 })
        .expect(404);
      await api()
        .delete(`/api/v1/cart/items/${item.id}`)
        .set('x-cart-token', other.body.token)
        .expect(404);

      const upd = await api()
        .patch(`/api/v1/cart/items/${item.id}`)
        .set('x-cart-token', mine.body.token)
        .send({ qty: 5 })
        .expect(200);
      expect(upd.body.items[0].qty).toBe(5);
      await api()
        .patch(`/api/v1/cart/items/${item.id}`)
        .set('x-cart-token', mine.body.token)
        .send({ qty: 11 })
        .expect(400);

      const del = await api()
        .delete(`/api/v1/cart/items/${item.id}`)
        .set('x-cart-token', mine.body.token)
        .expect(200);
      expect(del.body.items).toHaveLength(0);
    });

    it('giỏ khách được gộp vào giỏ user khi đăng nhập', async () => {
      await createUser(prisma, 'u@example.com');
      const auth = await login('u@example.com');
      await addToCart(cheap.id, 1, undefined, auth);
      const guest = await addToCart(cheap.id, 1);
      await addToCart(pricey.id, 1, guest.body.token);

      const merged = await api()
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${auth}`)
        .set('x-cart-token', guest.body.token)
        .expect(200);
      expect(merged.body.token).toBeNull();
      const qtyBySku = Object.fromEntries(
        merged.body.items.map((i: any) => [i.color, i.qty]),
      );
      expect(qtyBySku).toEqual({ CHEAP: 2, PRICEY: 1 });

      // giỏ khách đã bị xóa
      await api()
        .get('/api/v1/cart')
        .set('x-cart-token', guest.body.token)
        .expect(200)
        .expect((r) => expect(r.body.items).toEqual([]));
    });
  });

  describe('đặt hàng', () => {
    it('guest đặt hàng thành công: tính tiền từ DB, trừ kho, dọn giỏ', async () => {
      const cart = await addToCart(cheap.id, 2);
      await addToCart(pricey.id, 1, cart.body.token);

      const res = await checkout(cart.body.token, undefined, {
        shipping,
        email: 'a@example.com',
        note: 'Giao giờ hành chính',
      }).expect(201);
      expect(res.body.code).toMatch(/^FG-\d{8}-[A-Z2-9]{6}$/);
      expect(res.body).toMatchObject({
        status: 'PENDING',
        paymentMethod: 'COD',
        subtotal: 2080000,
        shippingFee: 0,
        total: 2080000,
        guestEmail: 'a@example.com',
      });
      expect(res.body.shipping.phone).toBe('0901234567'); // đã chuẩn hóa
      expect(
        res.body.items.map((i: any) => [i.productName, i.qty, i.unitPrice]),
      ).toEqual(
        expect.arrayContaining([
          ['Sản phẩm test', 2, 290000],
          ['Sản phẩm test', 1, 1500000],
        ]),
      );

      expect(await stockOf(cheap.id)).toBe(0);
      expect(await stockOf(pricey.id)).toBe(9);
      const after = await api()
        .get('/api/v1/cart')
        .set('x-cart-token', cart.body.token);
      expect(after.body.items).toHaveLength(0);
    });

    it('đơn dưới ngưỡng miễn ship bị tính phí vận chuyển', async () => {
      const cart = await addToCart(cheap.id, 1);
      const res = await checkout(cart.body.token).expect(201);
      expect(res.body).toMatchObject({
        subtotal: 290000,
        shippingFee: 30000,
        total: 320000,
      });
    });

    it('bắt buộc thông tin giao hàng hợp lệ (guest)', async () => {
      const cart = await addToCart(cheap.id, 1);
      await checkout(cart.body.token, undefined, {}).expect(400);
      await checkout(cart.body.token, undefined, {
        shipping: { ...shipping, phone: '123' },
      }).expect(400);
      await checkout(cart.body.token, undefined, {
        shipping: { ...shipping, street: '' },
      }).expect(400);
      // client không được tự đặt giá / tổng tiền / trạng thái
      await checkout(cart.body.token, undefined, {
        shipping,
        total: 1,
        status: 'DELIVERED',
      }).expect(400);
      expect(await stockOf(cheap.id)).toBe(2); // các lần lỗi không làm mất kho
    });

    it('giỏ trống → 400', async () => {
      await checkout().expect(400);
      const cart = await addToCart(cheap.id, 1);
      await checkout(cart.body.token).expect(201);
      await checkout(cart.body.token).expect(400); // giỏ đã được dọn
    });

    it('hết hàng giữa chừng: toàn bộ đơn bị từ chối và không trừ kho dòng nào', async () => {
      const cart = await addToCart(pricey.id, 1);
      await addToCart(cheap.id, 2, cart.body.token);
      await prisma.productVariant.update({
        where: { id: cheap.id },
        data: { stock: 1 },
      });

      const res = await checkout(cart.body.token).expect(400);
      expect(res.body.message).toContain('không đủ hàng');
      expect(await stockOf(pricey.id)).toBe(10); // rollback
      expect(await prisma.order.count()).toBe(0);
    });

    it('hai khách tranh nhau món cuối cùng: chỉ một đơn thành công', async () => {
      const a = await addToCart(lastOne.id, 1);
      const b = await addToCart(lastOne.id, 1);
      const results = await Promise.all([
        checkout(a.body.token),
        checkout(b.body.token),
      ]);
      expect(results.map((r) => r.status).sort((a, b) => a - b)).toEqual([
        201, 400,
      ]);
      expect(await stockOf(lastOne.id)).toBe(0);
      expect(await prisma.order.count()).toBe(1);
    });

    it('giá đổi sau khi thêm vào giỏ → đơn dùng giá hiện tại trong DB', async () => {
      const cart = await addToCart(cheap.id, 1);
      await prisma.productVariant.update({
        where: { id: cheap.id },
        data: { price: 350000 },
      });
      const res = await checkout(cart.body.token).expect(201);
      expect(res.body.subtotal).toBe(350000);
    });
  });

  describe('tra cứu và lịch sử', () => {
    it('guest tra cứu bằng mã đơn + số điện thoại (định dạng nào cũng được)', async () => {
      const cart = await addToCart(cheap.id, 1);
      const order = (await checkout(cart.body.token)).body;

      const ok = await api()
        .get('/api/v1/orders/lookup')
        .query({ code: order.code.toLowerCase(), phone: '+84901234567' })
        .expect(200);
      expect(ok.body.id).toBe(order.id);
      await api()
        .get('/api/v1/orders/lookup')
        .query({ code: order.code, phone: '0912345678' })
        .expect(404);
      await api()
        .get('/api/v1/orders/lookup')
        .query({ code: 'FG-00000000-AAAAAA', phone: '0901234567' })
        .expect(404);
    });

    it('user: đơn gắn với tài khoản, xem được lịch sử; người khác không xem được', async () => {
      await createUser(prisma, 'u@example.com');
      await createUser(prisma, 'v@example.com');
      await createUser(prisma, 'm@example.com', 'MANAGER');
      const [u, v, m] = [
        await login('u@example.com'),
        await login('v@example.com'),
        await login('m@example.com'),
      ];

      await addToCart(cheap.id, 1, undefined, u);
      const order = (await checkout(undefined, u)).body;

      const mine = await api()
        .get('/api/v1/orders/me')
        .set('Authorization', `Bearer ${u}`)
        .expect(200);
      expect(mine.body).toMatchObject({ total: 1, items: [{ id: order.id }] });
      expect(
        (
          await api()
            .get('/api/v1/orders/me')
            .set('Authorization', `Bearer ${v}`)
        ).body.total,
      ).toBe(0);

      await api()
        .get(`/api/v1/orders/${order.id}`)
        .set('Authorization', `Bearer ${u}`)
        .expect(200);
      await api()
        .get(`/api/v1/orders/${order.id}`)
        .set('Authorization', `Bearer ${v}`)
        .expect(404);
      await api()
        .get(`/api/v1/orders/${order.id}`)
        .set('Authorization', `Bearer ${m}`)
        .expect(200);
      await api().get(`/api/v1/orders/${order.id}`).expect(401);
      await api().get('/api/v1/orders/me').expect(401);
    });

    it('chủ đơn hủy đơn PENDING được hoàn kho; hủy 2 lần hoặc đơn đã xác nhận bị từ chối', async () => {
      await createUser(prisma, 'u@example.com');
      await createUser(prisma, 'v@example.com');
      const [u, v] = [
        await login('u@example.com'),
        await login('v@example.com'),
      ];

      await addToCart(cheap.id, 2, undefined, u);
      const order = (await checkout(undefined, u)).body;
      expect(await stockOf(cheap.id)).toBe(0);

      await api()
        .post(`/api/v1/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${v}`)
        .expect(404);
      const cancelled = await api()
        .post(`/api/v1/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${u}`)
        .expect(200);
      expect(cancelled.body.status).toBe('CANCELLED');
      expect(await stockOf(cheap.id)).toBe(2);
      await api()
        .post(`/api/v1/orders/${order.id}/cancel`)
        .set('Authorization', `Bearer ${u}`)
        .expect(400);
      expect(await stockOf(cheap.id)).toBe(2); // không hoàn kho lần hai

      await addToCart(cheap.id, 1, undefined, u);
      const second = (await checkout(undefined, u)).body;
      await prisma.order.update({
        where: { id: second.id },
        data: { status: 'CONFIRMED' },
      });
      await api()
        .post(`/api/v1/orders/${second.id}/cancel`)
        .set('Authorization', `Bearer ${u}`)
        .expect(400);
    });
  });
});
