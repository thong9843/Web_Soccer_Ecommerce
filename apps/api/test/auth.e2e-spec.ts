import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDb } from './helpers.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });
  beforeEach(() => resetDb(prisma));
  afterAll(() => app.close());

  const register = (email = 'a@example.com') =>
    api()
      .post('/api/v1/auth/register')
      .send({ email, password: 'MatKhau123', fullName: 'Nguyễn Văn A' });

  it('đăng ký tạo user với vai trò USER, không tin role từ client', async () => {
    const res = await api().post('/api/v1/auth/register').send({
      email: 'a@example.com',
      password: 'MatKhau123',
      fullName: 'A B',
      role: 'ADMIN',
    });
    // forbidNonWhitelisted: trường lạ bị từ chối
    expect(res.status).toBe(400);

    const ok = await register();
    expect(ok.status).toBe(201);
    expect(ok.body.user.role).toBe('USER');
    expect(ok.body.user).not.toHaveProperty('passwordHash');
    expect(ok.body.accessToken).toBeTruthy();
  });

  it('không lưu mật khẩu dạng rõ và chuẩn hóa email', async () => {
    await api()
      .post('/api/v1/auth/register')
      .send({
        email: '  MiXed@Example.COM ',
        password: 'MatKhau123',
        fullName: 'Ab',
      })
      .expect(201);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: 'mixed@example.com' },
    });
    expect(user.passwordHash).not.toContain('MatKhau123');
    expect(user.passwordHash.startsWith('$2')).toBe(true);
  });

  it('từ chối email trùng (409) và mật khẩu yếu (400)', async () => {
    await register().expect(201);
    await register().expect(409);
    await api()
      .post('/api/v1/auth/register')
      .send({ email: 'b@example.com', password: 'chuchuchu', fullName: 'Ab' })
      .expect(400);
  });

  it('đăng nhập đúng/sai mật khẩu', async () => {
    await register();
    await api()
      .post('/api/v1/auth/login')
      .send({ email: 'a@example.com', password: 'sai' })
      .expect(401);
    await api()
      .post('/api/v1/auth/login')
      .send({ email: 'khong@co.com', password: 'MatKhau123' })
      .expect(401);
    const res = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'A@example.com', password: 'MatKhau123' })
      .expect(200);
    expect(res.body.refreshToken).toBeTruthy();
  });

  it('/auth/me cần access token hợp lệ', async () => {
    const { body } = await register();
    await api().get('/api/v1/auth/me').expect(401);
    await api()
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer rac')
      .expect(401);
    const me = await api()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(200);
    expect(me.body.email).toBe('a@example.com');
  });

  it('refresh xoay vòng token; dùng lại token cũ thu hồi toàn bộ phiên', async () => {
    const { body: first } = await register();
    const second = await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(200);
    expect(second.body.refreshToken).not.toBe(first.refreshToken);

    // dùng lại token đã đổi → bị từ chối và token mới cũng bị thu hồi
    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: first.refreshToken })
      .expect(401);
    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: second.body.refreshToken })
      .expect(401);
  });

  it('logout thu hồi refresh token', async () => {
    const { body } = await register();
    await api()
      .post('/api/v1/auth/logout')
      .send({ refreshToken: body.refreshToken })
      .expect(204);
    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401);
  });

  it('tài khoản bị khóa mất quyền ngay, không cần chờ token hết hạn', async () => {
    const { body } = await register();
    await prisma.user.update({
      where: { email: 'a@example.com' },
      data: { isActive: false },
    });

    await api()
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${body.accessToken}`)
      .expect(401);
    await api()
      .post('/api/v1/auth/login')
      .send({ email: 'a@example.com', password: 'MatKhau123' })
      .expect(403);
    await api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: body.refreshToken })
      .expect(401);
  });
});
