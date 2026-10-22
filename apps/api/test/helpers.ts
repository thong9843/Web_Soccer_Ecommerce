import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import type { Role } from '@football/shared';
import { PrismaService } from '../src/prisma/prisma.service.js';

export async function createTestApp(
  extra: { controllers?: any[] } = {},
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
    controllers: extra.controllers ?? [],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export async function resetDb(prisma: PrismaService) {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE audit_logs, team_orders, order_items, orders, cart_items, carts, refresh_tokens, addresses, product_images, product_variants, products, brands, categories, users RESTART IDENTITY CASCADE',
  );
}

export async function createUser(
  prisma: PrismaService,
  email: string,
  role: Role = 'USER',
  password = 'MatKhau123',
) {
  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 4),
      fullName: `Test ${role}`,
      role,
    },
  });
}
