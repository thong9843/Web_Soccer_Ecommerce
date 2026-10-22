import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { ProductGridSkeleton } from '@/components/catalog/product-card';
import { ProductListing } from '@/components/catalog/product-listing';
import { categoryTrail, findCategory, getCategoryTree } from '@/lib/categories';
import type { RawSearchParams } from '@/lib/listing';

type Props = {
  params: Promise<{ category: string[] }>;
  searchParams: Promise<RawSearchParams>;
};

async function resolve(segments: string[]) {
  // Danh mục tối đa 2 cấp (nhóm cha / nhóm con)
  if (segments.length > 2) return null;
  const path = segments.map(decodeURIComponent).join('/');
  const tree = await getCategoryTree();
  const node = findCategory(tree, path);
  return node ? { tree, node, path } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await resolve((await params).category).catch(() => null);
  if (!found) return { title: 'Không tìm thấy trang' };
  return {
    title: found.node.name,
    description: `Mua ${found.node.name.toLowerCase()} chính hãng, giao hàng toàn quốc, thanh toán khi nhận hàng.`,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const found = await resolve((await params).category);
  if (!found) notFound();
  const { tree, node, path } = found;

  const trail = categoryTrail(tree, path);
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs
        items={trail.map((c, i) => ({
          label: c.name,
          href: i < trail.length - 1 ? `/${c.path}` : undefined,
        }))}
      />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
        {node.name}
      </h1>

      {node.children.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2">
          {node.children.map((c) => (
            <li key={c.id}>
              <Link
                href={`/${c.path}`}
                className="inline-block rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-ink hover:bg-ink hover:text-white"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductListing
            categoryPath={path}
            basePath={`/${path}`}
            searchParams={sp}
          />
        </Suspense>
      </div>
    </div>
  );
}
