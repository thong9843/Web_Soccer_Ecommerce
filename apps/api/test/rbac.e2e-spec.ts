import { Controller, Get, INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { Role } from '@football/shared';
import { Public, Roles } from '../src/common/decorators.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, createUser, resetDb } from './helpers.js';

// Controller chỉ dùng trong test để kiểm tra Guard theo ma trận phân quyền ở plan mục 4.
@Controller('probe')
class ProbeController {
  @Public() @Get('public') open() {
    return { ok: true };
  }
  @Get('any-user') anyUser() {
    return { ok: true };
  }
  @Roles('MANAGER', 'ADMIN') @Get('staff') staff() {
    return { ok: true };
  }
  @Roles('ADMIN') @Get('admin') admin() {
    return { ok: true };
  }
}

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const tokens = {} as Record<Role, string>;
  const api = () => request(app.getHttpServer());
  const get = (path: string, token?: string) => {
    const req = api().get(`/api/v1/probe/${path}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  };

  beforeAll(async () => {
    app = await createTestApp({ controllers: [ProbeController] });
    prisma = app.get(PrismaService);
    await resetDb(prisma);
    for (const role of ['USER', 'MANAGER', 'ADMIN'] as Role[]) {
      const email = `${role.toLowerCase()}@example.com`;
      await createUser(prisma, email, role);
      const res = await api()
        .post('/api/v1/auth/login')
        .send({ email, password: 'MatKhau123' });
      tokens[role] = res.body.accessToken;
    }
  });
  afterAll(() => app.close());

  it('GUEST: chỉ route public', async () => {
    await get('public').expect(200);
    await get('any-user').expect(401);
    await get('staff').expect(401);
    await get('admin').expect(401);
  });

  it('route public nhận diện user nhưng không chặn token hỏng', async () => {
    await get('public', 'token-hong').expect(200);
    await get('public', tokens.USER).expect(200);
  });

  it('USER: chỉ route dành cho user đã đăng nhập', async () => {
    await get('any-user', tokens.USER).expect(200);
    await get('staff', tokens.USER).expect(403);
    await get('admin', tokens.USER).expect(403);
  });

  it('MANAGER: vào được khu vận hành, không vào được khu ADMIN', async () => {
    await get('any-user', tokens.MANAGER).expect(200);
    await get('staff', tokens.MANAGER).expect(200);
    await get('admin', tokens.MANAGER).expect(403);
  });

  it('ADMIN: vào mọi nơi', async () => {
    await get('any-user', tokens.ADMIN).expect(200);
    await get('staff', tokens.ADMIN).expect(200);
    await get('admin', tokens.ADMIN).expect(200);
  });

  it('nâng/hạ vai trò có hiệu lực ngay với token cũ', async () => {
    await get('staff', tokens.USER).expect(403);
    await prisma.user.update({
      where: { email: 'user@example.com' },
      data: { role: 'MANAGER' },
    });
    await get('staff', tokens.USER).expect(200);
    await prisma.user.update({
      where: { email: 'user@example.com' },
      data: { role: 'USER' },
    });
    await get('staff', tokens.USER).expect(403);
  });
});
