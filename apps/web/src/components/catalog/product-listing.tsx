import type {
  Paginated,
  ProductFacets,
  ProductListItem,
} from '@football/shared';
import { apiGet, toQuery } from '@/lib/api-server';
import { parseFilters, type RawSearchParams } from '@/lib/listing';
import { FilterPanel, SortSelect } from './filter-panel';
import { Pagination } from './pagination';
import { ProductCard } from './product-card';

const PAGE_SIZE = 12;

/** Danh sách sản phẩm + bộ lọc + phân trang, dùng cho trang danh mục và trang tìm kiếm. */
export async function ProductListing({
  categoryPath,
  basePath,
  searchParams,
}: {
  categoryPath?: string;
  basePath: string;
  searchParams: RawSearchParams;
}) {
  const f = parseFilters(searchParams);

  const [result, facets] = await Promise.all([
    apiGet<Paginated<ProductListItem>>(
      `/products${toQuery({
        category: categoryPath,
        q: f.q,
        brand: f.brand,
        size: f.size,
        minPrice: f.minPrice,
        maxPrice: f.maxPrice,
        sort: f.sort,
        page: f.page,
        pageSize: PAGE_SIZE,
      })}`,
      { revalidate: 30 },
    ),
    apiGet<ProductFacets>(
      `/products/facets${toQuery({ category: categoryPath })}`,
      { revalidate: 60 },
    ),
  ]);

  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key !== 'page' && value !== undefined)
      qs.set(key, Array.isArray(value) ? value[0] : value);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
      <aside aria-label="Bộ lọc">
        <FilterPanel facets={facets} />
      </aside>

      <section aria-label="Danh sách sản phẩm">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <b className="text-ink">{result.total}</b> sản phẩm
          </p>
          <SortSelect />
        </div>

        {result.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line px-6 py-16 text-center">
            <p className="text-lg font-semibold">
              Không tìm thấy sản phẩm phù hợp
            </p>
            <p className="mt-1 text-sm text-muted">
              Thử bỏ bớt bộ lọc hoặc đổi từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-4">
            {result.items.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <ProductCard product={p} priority={i < 4} />
              </div>
            ))}
          </div>
        )}

        <Pagination
          basePath={basePath}
          searchParams={qs}
          page={result.page}
          totalPages={result.totalPages}
        />
      </section>
    </div>
  );
}
