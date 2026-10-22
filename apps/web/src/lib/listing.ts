import { PRODUCT_SORTS, type ProductSort } from '@football/shared';

export type RawSearchParams = Record<string, string | string[] | undefined>;

export interface ListingFilters {
  q?: string;
  brand: string[];
  size: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: ProductSort;
  page: number;
}

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;
const csv = (v: string | string[] | undefined) =>
  (first(v) ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
const int = (v: string | string[] | undefined) => {
  const n = Number(first(v));
  return Number.isInteger(n) && n >= 0 ? n : undefined;
};

/** Đọc query string của trang danh sách thành bộ lọc đã làm sạch. */
export function parseFilters(sp: RawSearchParams): ListingFilters {
  const sort = first(sp.sort) as ProductSort | undefined;
  return {
    q: first(sp.q)?.trim().slice(0, 100) || undefined,
    brand: csv(sp.brand),
    size: csv(sp.size),
    minPrice: int(sp.minPrice),
    maxPrice: int(sp.maxPrice),
    sort: sort && PRODUCT_SORTS.includes(sort) ? sort : 'newest',
    page: Math.max(1, int(sp.page) ?? 1),
  };
}

/** Khoảng giá gợi ý ở bộ lọc (VND). */
export const PRICE_RANGES = [
  { label: 'Dưới 500.000₫', min: undefined, max: 499_999 },
  { label: '500.000₫ – 1.000.000₫', min: 500_000, max: 1_000_000 },
  { label: '1.000.000₫ – 2.000.000₫', min: 1_000_000, max: 2_000_000 },
  { label: '2.000.000₫ – 5.000.000₫', min: 2_000_000, max: 5_000_000 },
  { label: 'Trên 5.000.000₫', min: 5_000_001, max: undefined },
] as const;
