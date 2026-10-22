import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { slugify } from '../src/common/slug.js';
import { BRANDS, CATEGORIES, PRODUCTS } from './seed-data.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const isProd = process.env.NODE_ENV === 'production';

async function seedUsers() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@football.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@12345';
  if (isProd && adminPassword === 'Admin@12345') {
    throw new Error(
      'Đặt SEED_ADMIN_PASSWORD khác mặc định trước khi seed production',
    );
  }

  const users = [
    {
      email: adminEmail,
      password: adminPassword,
      fullName: 'Quản trị viên',
      role: 'ADMIN' as const,
    },
    // Tài khoản demo chỉ tạo ở môi trường dev.
    ...(isProd
      ? []
      : [
          {
            email: 'manager@football.local',
            password: 'Manager@12345',
            fullName: 'Nhân viên vận hành',
            role: 'MANAGER' as const,
          },
          {
            email: 'user@football.local',
            password: 'User@12345',
            fullName: 'Nguyễn Văn A',
            role: 'USER' as const,
          },
        ]),
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      // Không ghi đè mật khẩu của tài khoản đã tồn tại.
      update: { role: u.role, isActive: true },
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
      },
    });
  }
  console.log(`Users: ${users.length}`);
}

async function findOrCreateCategory(
  parentId: string | null,
  name: string,
  slug: string,
  sortOrder: number,
) {
  const existing = await prisma.category.findFirst({
    where: { parentId, slug },
  });
  if (existing) {
    return prisma.category.update({
      where: { id: existing.id },
      data: { name, sortOrder },
    });
  }
  return prisma.category.create({ data: { parentId, name, slug, sortOrder } });
}

async function seedCategories(): Promise<Map<string, string>> {
  const idByPath = new Map<string, string>();
  for (const [i, parent] of CATEGORIES.entries()) {
    const p = await findOrCreateCategory(null, parent.name, parent.slug, i);
    idByPath.set(parent.slug, p.id);
    for (const [j, child] of parent.children.entries()) {
      const c = await findOrCreateCategory(p.id, child.name, child.slug, j);
      idByPath.set(`${parent.slug}/${child.slug}`, c.id);
    }
  }
  console.log(`Categories: ${idByPath.size}`);
  return idByPath;
}

async function seedBrands(): Promise<Map<string, string>> {
  const idByName = new Map<string, string>();
  for (const name of BRANDS) {
    const brand = await prisma.brand.upsert({
      where: { slug: slugify(name) },
      update: { name },
      create: { name, slug: slugify(name) },
    });
    idByName.set(name, brand.id);
  }
  console.log(`Brands: ${idByName.size}`);
  return idByName;
}

const placeholder = (text: string, shade: string) =>
  `https://placehold.co/800x800/${shade}/ffffff/png?text=${encodeURIComponent(text)}`;

async function seedProducts(
  categoryIds: Map<string, string>,
  brandIds: Map<string, string>,
) {
  let variantCount = 0;
  for (const [i, p] of PRODUCTS.entries()) {
    const categoryId = categoryIds.get(p.category);
    const brandId = brandIds.get(p.brand);
    if (!categoryId || !brandId) {
      throw new Error(
        `Danh mục hoặc thương hiệu không tồn tại cho "${p.name}"`,
      );
    }

    const slug = slugify(p.name);
    const product = await prisma.product.upsert({
      where: { slug },
      update: { name: p.name, basePrice: p.price, categoryId, brandId },
      create: {
        name: p.name,
        slug,
        description:
          p.description ??
          `${p.name} — sản phẩm chính hãng ${p.brand}. Chất liệu bền, thoải mái khi thi đấu và tập luyện.`,
        basePrice: p.price,
        categoryId,
        brandId,
        // Mỗi sản phẩm có 2 ảnh giữ chỗ; thay bằng ảnh thật qua Cloudinary ở giai đoạn 3.
        images: {
          create: [
            { url: placeholder(p.name, '0b1d3a'), sortOrder: 0 },
            {
              url: placeholder(`${p.brand} • mặt sau`, '1e3a8a'),
              sortOrder: 1,
            },
          ],
        },
      },
    });

    const code = `FG${String(i + 1).padStart(3, '0')}`;
    for (const [ci, color] of p.colors.entries()) {
      for (const [si, size] of p.sizes.entries()) {
        const sku = `${code}-${slugify(color).toUpperCase()}-${size}`;
        // Tồn kho giả lập, có vài biến thể hết hàng để test giao diện.
        const stock =
          (i * 7 + ci * 5 + si * 3) % 6 === 0 ? 0 : 3 + ((i + ci + si) % 12);
        await prisma.productVariant.upsert({
          where: { sku },
          update: { price: p.price },
          create: {
            productId: product.id,
            sku,
            size,
            color,
            studType: p.studType ?? null,
            price: p.price,
            stock,
          },
        });
        variantCount++;
      }
    }
  }
  console.log(`Products: ${PRODUCTS.length}, variants: ${variantCount}`);
}

async function main() {
  await seedUsers();
  const categoryIds = await seedCategories();
  const brandIds = await seedBrands();
  await seedProducts(categoryIds, brandIds);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
