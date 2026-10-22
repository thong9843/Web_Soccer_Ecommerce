import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import type {
  Paginated,
  ProductDetail,
  ProductListItem,
} from '@football/shared';
import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { BuyBox } from '@/components/catalog/buy-box';
import { ProductCard } from '@/components/catalog/product-card';
import { ProductGallery } from '@/components/catalog/product-gallery';
import { ApiError, apiGet, toQuery } from '@/lib/api-server';
import { categoryTrail, getCategoryTree } from '@/lib/categories';

type Props = { params: Promise<{ slug: string }> };

// generateMetadata và page cùng gọi; cache() để chỉ hỏi API một lần cho mỗi request.
const getProduct = cache(
  async (slug: string): Promise<ProductDetail | null> => {
    try {
      return await apiGet<ProductDetail>(
        `/products/${encodeURIComponent(slug)}`,
        { revalidate: 30 },
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return { title: 'Không tìm thấy sản phẩm' };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const [tree, related] = await Promise.all([
    getCategoryTree().catch(() => []),
    apiGet<Paginated<ProductListItem>>(
      `/products${toQuery({ category: product.category.path, pageSize: 5 })}`,
      { revalidate: 60 },
    ).catch(() => null),
  ]);
  const trail = categoryTrail(tree, product.category.path);
  const others =
    related?.items.filter((p) => p.id !== product.id).slice(0, 4) ?? [];

  // Dữ liệu có cấu trúc để công cụ tìm kiếm hiểu đây là sản phẩm
  const prices = product.variants.map((v) => v.price);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description,
    brand: { '@type': 'Brand', name: product.brand.name },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'VND',
      lowPrice: prices.length ? Math.min(...prices) : product.basePrice,
      highPrice: prices.length ? Math.max(...prices) : product.basePrice,
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Breadcrumbs
        items={[
          ...trail.map((c) => ({ label: c.name, href: `/${c.path}` })),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images} name={product.name} />
        <BuyBox product={product} />
      </div>

      <section className="mt-16 max-w-3xl" aria-labelledby="desc">
        <h2 id="desc" className="text-xl font-extrabold">
          Mô tả sản phẩm
        </h2>
        <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/80">
          {product.description}
        </p>
        {product.variants[0]?.studType && (
          <p className="mt-4 text-sm">
            <b>Loại đế:</b> {product.variants[0].studType}
          </p>
        )}
      </section>

      {others.length > 0 && (
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="text-xl font-extrabold">
            Sản phẩm liên quan
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {others.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
