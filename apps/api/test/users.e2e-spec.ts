import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, createUser, resetDb } from './helpers.js';

const address = {
  receiverName: 'Nguyễn Văn A',
  phone: '+84 901 234 567',
  province: 'TP. Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  street: '12 Lê Lợi',
};

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let u: string;
  let v: string;
  const api = () => request(app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
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
    await createUser(prisma, 'u@example.com');
    await createUser(prisma, 'v@example.com');
    u = await login('u@example.com');
    v = await login('v@example.com');
  });

  it('cần đăng nhập', async () => {
    await api().get('/api/v1/users/me/addresses').expect(401);
    await api().patch('/api/v1/users/me').send({ fullName: 'Abc' }).expect(401);
  });

  it('cập nhật hồ sơ, chuẩn hóa số điện thoại, bỏ qua trường không được phép', async () => {
    const res = await api()
      .patch('/api/v1/users/me')
      .set(as(u))
      .send({ fullName: 'Tên Mới', phone: '+84 912 345 678' })
      .expect(200);
    expect(res.body).toMatchObject({
      fullName: 'Tên Mới',
      phone: '0912345678',
      role: 'USER',
    });

    // không thể tự nâng quyền
    await api()
      .patch('/api/v1/users/me')
      .set(as(u))
      .send({ role: 'ADMIN' })
      .expect(400);
    await api()
      .patch('/api/v1/users/me')
      .set(as(u))
      .send({ phone: '123' })
      .expect(400);
  });

  it('địa chỉ đầu tiên tự thành mặc định; đặt địa chỉ khác làm mặc định chuyển cờ', async () => {
    const first = (
      await api()
        .post('/api/v1/users/me/addresses')
        .set(as(u))
        .send(address)
        .expect(201)
    ).body;
    expect(first).toMatchObject({ isDefault: true, phone: '0901234567' });

    const second = (
      await api()
        .post('/api/v1/users/me/addresses')
        .set(as(u))
        .send(address)
        .expect(201)
    ).body;
    expect(second.isDefault).toBe(false);

    await api()
      .patch(`/api/v1/users/me/addresses/${second.id}`)
      .set(as(u))
      .send({ isDefault: true })
      .expect(200);
    const list = (
      await api().get('/api/v1/users/me/addresses').set(as(u)).expect(200)
    ).body;
    expect(list.map((a: any) => [a.id, a.isDefault])).toEqual([
      [second.id, true],
      [first.id, false],
    ]);
  });

  it('xóa địa chỉ mặc định thì địa chỉ còn lại trở thành mặc định', async () => {
    const a = (
      await api().post('/api/v1/users/me/addresses').set(as(u)).send(address)
    ).body;
    const b = (
      await api().post('/api/v1/users/me/addresses').set(as(u)).send(address)
    ).body;
    await api()
      .delete(`/api/v1/users/me/addresses/${a.id}`)
      .set(as(u))
      .expect(204);
    const list = (await api().get('/api/v1/users/me/addresses').set(as(u)))
      .body;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ id: b.id, isDefault: true });
  });

  it('user không xem/sửa/xóa được địa chỉ của người khác', async () => {
    const a = (
      await api().post('/api/v1/users/me/addresses').set(as(u)).send(address)
    ).body;
    expect(
      (await api().get('/api/v1/users/me/addresses').set(as(v))).body,
    ).toEqual([]);
    await api()
      .patch(`/api/v1/users/me/addresses/${a.id}`)
      .set(as(v))
      .send({ street: 'Hack' })
      .expect(404);
    await api()
      .delete(`/api/v1/users/me/addresses/${a.id}`)
      .set(as(v))
      .expect(404);
    expect(await prisma.address.count()).toBe(1);
  });

  it('validate địa chỉ và giới hạn số lượng', async () => {
    await api()
      .post('/api/v1/users/me/addresses')
      .set(as(u))
      .send({ ...address, street: '' })
      .expect(400);
    await api()
      .post('/api/v1/users/me/addresses')
      .set(as(u))
      .send({ ...address, phone: '123' })
      .expect(400);
    for (let i = 0; i < 10; i++) {
      await api()
        .post('/api/v1/users/me/addresses')
        .set(as(u))
        .send(address)
        .expect(201);
    }
    await api()
      .post('/api/v1/users/me/addresses')
      .set(as(u))
      .send(address)
      .expect(400);
  });
});
