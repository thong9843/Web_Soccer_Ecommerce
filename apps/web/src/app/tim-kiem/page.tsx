import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Breadcrumbs } from '@/components/catalog/breadcrumbs';
import { ProductGridSkeleton } from '@/components/catalog/product-card';
import { ProductListing } from '@/components/catalog/product-listing';
import { parseFilters, type RawSearchParams } from '@/lib/listing';

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const { q } = parseFilters(await searchParams);
  return { title: q ? `Tìm kiếm: ${q}` : 'Tìm kiếm', robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { q } = parseFilters(sp);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Tìm kiếm' }]} />
      <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
        {q ? <>Kết quả cho “{q}”</> : 'Tất cả sản phẩm'}
      </h1>
      <div className="mt-8">
        <Suspense fallback={<ProductGridSkeleton />}>
          <ProductListing basePath="/tim-kiem" searchParams={sp} />
        </Suspense>
      </div>
    </div>
  );
}
