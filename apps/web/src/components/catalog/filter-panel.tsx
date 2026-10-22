'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import type { ProductFacets } from '@football/shared';
import { PRICE_RANGES } from '@/lib/listing';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'name_asc', label: 'Tên A → Z' },
];

/** Đổi query string, luôn về trang 1 khi lọc/sắp xếp lại. */
function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    }
    next.delete('page');
    const qs = next.toString();
    startTransition(() =>
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }),
    );
  }
  return { update, searchParams, pending, pathname };
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

export function SortSelect() {
  const { update, searchParams } = useQueryUpdater();
  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor="sort" className="text-muted">
        Sắp xếp
      </label>
      <select
        id="sort"
        value={searchParams.get('sort') ?? 'newest'}
        onChange={(e) =>
          update({
            sort: e.target.value === 'newest' ? undefined : e.target.value,
          })
        }
        className="h-10 rounded-lg border border-line bg-white px-3 focus:border-pitch focus:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterPanel({ facets }: { facets: ProductFacets }) {
  const { update, searchParams, pending, pathname } = useQueryUpdater();
  const [mobileOpen, setMobileOpen] = useState(false);
  const brands = searchParams.get('brand')?.split(',').filter(Boolean) ?? [];
  const sizes = searchParams.get('size')?.split(',').filter(Boolean) ?? [];
  const minPrice = searchParams.get('minPrice') ?? undefined;
  const maxPrice = searchParams.get('maxPrice') ?? undefined;
  const q = searchParams.get('q');

  const activeCount =
    brands.length + sizes.length + (minPrice || maxPrice ? 1 : 0);

  return (
    <div className="rounded-xl border border-line lg:border-0">
      {/* Mobile: thu gọn mặc định để thấy sản phẩm ngay; desktop: luôn hiển thị */}
      <button
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="filter-body"
        onClick={() => setMobileOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 font-semibold lg:hidden"
      >
        <span>
          Bộ lọc{' '}
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-pitch px-2 py-0.5 text-xs text-white">
              {activeCount}
            </span>
          )}
        </span>
        <span aria-hidden>{mobileOpen ? '−' : '+'}</span>
      </button>

      <div
        id="filter-body"
        className={`space-y-7 p-4 transition-opacity lg:block lg:p-0 ${mobileOpen ? 'block' : 'hidden'} ${pending ? 'opacity-60' : ''}`}
        aria-busy={pending}
      >
        {(activeCount > 0 || q) && (
          <button
            type="button"
            onClick={() =>
              update({
                brand: undefined,
                size: undefined,
                minPrice: undefined,
                maxPrice: undefined,
              })
            }
            className="text-sm font-medium text-pitch-dark underline underline-offset-4"
          >
            Xóa tất cả bộ lọc
          </button>
        )}

        {facets.brands.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
              Thương hiệu
            </legend>
            <ul className="space-y-2">
              {facets.brands.map((b) => (
                <li key={b.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={brands.includes(b.slug)}
                      onChange={() =>
                        update({ brand: toggle(brands, b.slug).join(',') })
                      }
                      className="h-4 w-4 accent-pitch"
                    />
                    <span className="flex-1">{b.name}</span>
                    <span className="text-xs text-muted">{b.count}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        {facets.sizes.length > 0 && (
          <fieldset>
            <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
              Size
            </legend>
            <div className="flex flex-wrap gap-2">
              {facets.sizes.map((s) => {
                const active = sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={active}
                    onClick={() => update({ size: toggle(sizes, s).join(',') })}
                    className={`h-9 min-w-11 rounded-lg border px-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'border-ink bg-ink text-white'
                        : 'border-line hover:border-ink'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset>
          <legend className="mb-3 text-sm font-bold uppercase tracking-wider">
            Khoảng giá
          </legend>
          <ul className="space-y-2">
            {PRICE_RANGES.map((r) => {
              const active =
                minPrice === (r.min?.toString() ?? undefined) &&
                maxPrice === (r.max?.toString() ?? undefined);
              return (
                <li key={r.label}>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                    <input
                      type="radio"
                      name={`price-${pathname}`}
                      checked={active}
                      onChange={() =>
                        update({
                          minPrice: r.min?.toString(),
                          maxPrice: r.max?.toString(),
                        })
                      }
                      className="h-4 w-4 accent-pitch"
                    />
                    {r.label}
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      </div>
    </div>
  );
}
