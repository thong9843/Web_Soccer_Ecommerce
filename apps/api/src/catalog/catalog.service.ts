import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  BrandSummary,
  CategoryNode,
  Paginated,
  ProductDetail,
  ProductFacets,
  ProductListItem,
} from '@football/shared';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  buildCategoryTree,
  collectIds,
  findByPath,
  flattenTree,
} from './category-tree.js';
import type {
  FacetsQueryDto,
  ListProductsQueryDto,
} from './dto/list-products.dto.js';

const DEFAULT_PAGE_SIZE = 12;
const LETTER_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];

/** Số trước (38, 38.5, 39...), sau đó size chữ theo thứ tự XS→4XL, còn lại theo bảng chữ cái. */
export function compareSizes(a: string, b: string): number {
  const rank = (s: string) => {
    if (!Number.isNaN(Number(s))) return { group: 0, num: Number(s), idx: 0 };
    const idx = LETTER_SIZES.indexOf(s.toUpperCase());
    return idx >= 0 ? { group: 1, num: 0, idx } : { group: 2, num: 0, idx: 0 };
  };
  const ra = rank(a);
  const rb = rank(b);
  return (
    ra.group - rb.group ||
    ra.num - rb.num ||
    ra.idx - rb.idx ||
    a.localeCompare(b)
  );
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoryTree(): Promise<CategoryNode[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        parentId: true,
        name: true,
        slug: true,
        sortOrder: true,
      },
    });
    return buildCategoryTree(rows);
  }

  async listBrands(): Promise<BrandSummary[]> {
    return this.prisma.brand.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
  }

  async listProducts(
    query: ListProductsQueryDto,
  ): Promise<Paginated<ProductListItem>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const tree = await this.getCategoryTree();
    const where = this.buildWhere(tree, query);

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        orderBy: [this.buildOrderBy(query.sort), { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          brand: {
            select: { id: true, name: true, slug: true, logoUrl: true },
          },
          category: { select: { id: true } },
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: { where: { isActive: true }, select: { stock: true } },
        },
      }),
    ]);

    const pathById = new Map(flattenTree(tree).map((n) => [n.id, n.path]));
    return {
      items: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        basePrice: p.basePrice,
        imageUrl: p.images[0]?.url ?? null,
        brand: p.brand,
        categorySlug: pathById.get(p.category.id) ?? '',
        inStock: p.variants.some((v) => v.stock > 0),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Dữ liệu cho bộ lọc: thương hiệu (kèm số lượng), size, khoảng giá của danh mục. */
  async getFacets(query: FacetsQueryDto): Promise<ProductFacets> {
    const tree = await this.getCategoryTree();
    const where = this.buildWhere(tree, { category: query.category });

    const [brandCounts, sizeRows, price] = await Promise.all([
      this.prisma.product.groupBy({
        by: ['brandId'],
        where,
        _count: { _all: true },
      }),
      this.prisma.productVariant.findMany({
        where: { isActive: true, product: where },
        distinct: ['size'],
        select: { size: true },
      }),
      this.prisma.product.aggregate({
        where,
        _min: { basePrice: true },
        _max: { basePrice: true },
      }),
    ]);

    const brands = await this.prisma.brand.findMany({
      where: { id: { in: brandCounts.map((b) => b.brandId) } },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    const countById = new Map(
      brandCounts.map((b) => [b.brandId, b._count._all]),
    );

    return {
      brands: brands.map((b) => ({ ...b, count: countById.get(b.id) ?? 0 })),
      sizes: sizeRows.map((r) => r.size).sort(compareSizes),
      minPrice: price._min.basePrice ?? 0,
      maxPrice: price._max.basePrice ?? 0,
    };
  }

  async getProductBySlug(slug: string): Promise<ProductDetail> {
    const tree = await this.getCategoryTree();
    const activeIds = flattenTree(tree).map((n) => n.id);
    const product = await this.prisma.product.findFirst({
      where: { slug, isActive: true, categoryId: { in: activeIds } },
      include: {
        brand: { select: { id: true, name: true, slug: true, logoUrl: true } },
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          where: { isActive: true },
          orderBy: [{ color: 'asc' }, { size: 'asc' }],
        },
      },
    });
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');

    const category = flattenTree(tree).find(
      (n) => n.id === product.categoryId,
    )!;
    const variants = [...product.variants].sort(
      (a, b) => a.color.localeCompare(b.color) || compareSizes(a.size, b.size),
    );
    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      description: product.description,
      imageUrl: product.images[0]?.url ?? null,
      images: product.images.map((i) => i.url),
      model3dUrl: product.model3dUrl,
      brand: product.brand,
      categorySlug: category.path,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
      },
      inStock: variants.some((v) => v.stock > 0),
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        size: v.size,
        color: v.color,
        studType: v.studType,
        price: v.price,
        stock: v.stock,
      })),
    };
  }

  private buildWhere(
    tree: CategoryNode[],
    query: Partial<ListProductsQueryDto>,
  ): Prisma.ProductWhereInput {
    // Mặc định chỉ lấy sản phẩm thuộc danh mục đang hiển thị.
    let categoryIds = flattenTree(tree).map((n) => n.id);
    if (query.category) {
      const node = findByPath(tree, query.category);
      if (!node) throw new NotFoundException('Danh mục không tồn tại');
      categoryIds = collectIds(node);
    }

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      categoryId: { in: categoryIds },
    };
    if (query.brand?.length) where.brand = { slug: { in: query.brand } };
    if (query.size?.length) {
      where.variants = { some: { isActive: true, size: { in: query.size } } };
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = { gte: query.minPrice, lte: query.maxPrice };
    }
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    return where;
  }

  private buildOrderBy(sort: ListProductsQueryDto['sort']) {
    switch (sort) {
      case 'price_asc':
        return { basePrice: 'asc' } as const;
      case 'price_desc':
        return { basePrice: 'desc' } as const;
      case 'name_asc':
        return { name: 'asc' } as const;
      default:
        return { createdAt: 'desc' } as const;
    }
  }
}
