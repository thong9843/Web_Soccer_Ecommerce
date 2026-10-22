import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createTestApp, resetDb } from './helpers.js';

describe('Catalog (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await resetDb(prisma);

    const giay = await prisma.category.create({
      data: { name: 'Giày', slug: 'giay' },
    });
    const tf = await prisma.category.create({
      data: {
        name: 'TF',
        slug: 'co-nhan-tao',
        parentId: giay.id,
        sortOrder: 0,
      },
    });
    const ic = await prisma.category.create({
      data: { name: 'IC', slug: 'futsal', parentId: giay.id, sortOrder: 1 },
    });
    const hidden = await prisma.category.create({
      data: { name: 'Ẩn', slug: 'an', parentId: giay.id, isActive: false },
    });
    const nike = await prisma.brand.create({
      data: { name: 'Nike', slug: 'nike' },
    });
    const adidas = await prisma.brand.create({
      data: { name: 'Adidas', slug: 'adidas' },
    });

    const make = (
      name: string,
      slug: string,
      categoryId: string,
      brandId: string,
      basePrice: number,
      sizes: string[],
      extra = {},
    ) =>
      prisma.product.create({
        data: {
          name,
          slug,
          categoryId,
          brandId,
          basePrice,
          ...extra,
          images: { create: [{ url: `https://img/${slug}.png` }] },
          variants: {
            create: sizes.map((size) => ({
              sku: `${slug}-${size}`,
              size,
              color: 'Đen',
              price: basePrice,
              stock: size === '42' ? 0 : 5,
            })),
          },
        },
      });

    await make(
      'Nike Mercurial TF',
      'nike-mercurial-tf',
      tf.id,
      nike.id,
      2000000,
      ['41', '42'],
    );
    await make(
      'Adidas Predator TF',
      'adidas-predator-tf',
      tf.id,
      adidas.id,
      1500000,
      ['40', '41'],
    );
    await make('Nike Futsal IC', 'nike-futsal-ic', ic.id, nike.id, 1000000, [
      '42',
    ]);
    await make(
      'Sản phẩm đã ẩn',
      'san-pham-an',
      tf.id,
      nike.id,
      900000,
      ['41'],
      { isActive: false },
    );
    await make(
      'Sản phẩm trong danh mục ẩn',
      'trong-danh-muc-an',
      hidden.id,
      nike.id,
      800000,
      ['41'],
    );
  });
  afterAll(() => app.close());

  it('GET /categories trả cây, loại danh mục ẩn', async () => {
    const res = await api().get('/api/v1/categories').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].children.map((c: any) => c.path)).toEqual([
      'giay/co-nhan-tao',
      'giay/futsal',
    ]);
  });

  it('danh sách chỉ gồm sản phẩm active trong danh mục active', async () => {
    const res = await api().get('/api/v1/products').expect(200);
    expect(res.body.total).toBe(3);
    const slugs = res.body.items.map((i: any) => i.slug);
    expect(slugs).not.toContain('san-pham-an');
    expect(slugs).not.toContain('trong-danh-muc-an');
  });

  it('lọc theo danh mục cha bao gồm danh mục con', async () => {
    expect((await api().get('/api/v1/products?category=giay')).body.total).toBe(
      3,
    );
    expect(
      (await api().get('/api/v1/products?category=giay/futsal')).body.total,
    ).toBe(1);
  });

  it('lọc theo thương hiệu, size, khoảng giá', async () => {
    expect((await api().get('/api/v1/products?brand=nike')).body.total).toBe(2);
    expect(
      (await api().get('/api/v1/products?size=40')).body.items.map(
        (i: any) => i.slug,
      ),
    ).toEqual(['adidas-predator-tf']);
    const priced = await api().get(
      '/api/v1/products?minPrice=1200000&maxPrice=1800000',
    );
    expect(priced.body.items.map((i: any) => i.slug)).toEqual([
      'adidas-predator-tf',
    ]);
  });

  it('sắp xếp và phân trang', async () => {
    const asc = await api().get('/api/v1/products?sort=price_asc').expect(200);
    expect(asc.body.items.map((i: any) => i.basePrice)).toEqual([
      1000000, 1500000, 2000000,
    ]);

    const page2 = await api()
      .get('/api/v1/products?sort=price_asc&pageSize=2&page=2')
      .expect(200);
    expect(page2.body).toMatchObject({
      page: 2,
      pageSize: 2,
      total: 3,
      totalPages: 2,
    });
    expect(page2.body.items).toHaveLength(1);
  });

  it('tìm kiếm theo tên', async () => {
    const res = await api().get('/api/v1/products?q=predator').expect(200);
    expect(res.body.items.map((i: any) => i.slug)).toEqual([
      'adidas-predator-tf',
    ]);
  });

  it('validate query: sort lạ, pageSize quá lớn → 400; danh mục không tồn tại → 404', async () => {
    await api().get('/api/v1/products?sort=hack').expect(400);
    await api().get('/api/v1/products?pageSize=1000').expect(400);
    await api().get('/api/v1/products?category=khong-co').expect(404);
  });

  it('facets trả thương hiệu, size, khoảng giá', async () => {
    const res = await api()
      .get('/api/v1/products/facets?category=giay/co-nhan-tao')
      .expect(200);
    expect(res.body.brands.map((b: any) => [b.slug, b.count])).toEqual([
      ['adidas', 1],
      ['nike', 1],
    ]);
    expect(res.body.sizes).toEqual(['40', '41', '42']);
    expect(res.body).toMatchObject({ minPrice: 1500000, maxPrice: 2000000 });
  });

  it('chi tiết sản phẩm có biến thể, ảnh, tồn kho', async () => {
    const res = await api()
      .get('/api/v1/products/nike-mercurial-tf')
      .expect(200);
    expect(res.body.category.path).toBe('giay/co-nhan-tao');
    expect(res.body.variants.map((v: any) => [v.size, v.stock])).toEqual([
      ['41', 5],
      ['42', 0],
    ]);
    expect(res.body.inStock).toBe(true);
    await api().get('/api/v1/products/san-pham-an').expect(404);
    await api().get('/api/v1/products/trong-danh-muc-an').expect(404);
  });
});
