import Link from 'next/link';
import type { Paginated, ProductListItem } from '@football/shared';
import { ProductCard } from '@/components/catalog/product-card';
import { buttonClass } from '@/components/ui/button';
import { apiGet, toQuery } from '@/lib/api-server';
import { getCategoryTree } from '@/lib/categories';

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch {
    return fallback;
  }
}

export default async function HomePage() {
  const [categories, latest] = await Promise.all([
    safe(getCategoryTree(), []),
    safe(
      apiGet<Paginated<ProductListItem>>(
        `/products${toQuery({ sort: 'newest', pageSize: 8 })}`,
        { revalidate: 60 },
      ),
      null,
    ),
  ]);

  return (
    <>
      {/* Hero — khu vực này sẽ được thay bằng cảnh 3D ở giai đoạn 4 */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-pitch/30 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-volt/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
          <div className="animate-fade-up">
            <p className="mb-4 inline-block rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-volt">
              Mùa giải mới 2025/26
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight md:text-6xl">
              Trang bị cho <span className="text-volt">trận đấu</span> của bạn
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/70">
              Giày đá bóng, áo đấu CLB &amp; đội tuyển, phụ kiện chính hãng.
              Giao toàn quốc, thanh toán khi nhận hàng.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/giay" className={buttonClass('volt', 'lg')}>
                Mua giày ngay
              </Link>
              <Link
                href="/quan-ao/ao-dau-clb"
                className={buttonClass('outline-light', 'lg')}
              >
                Áo đấu CLB
              </Link>
            </div>
          </div>
          <div
            className="relative mx-auto hidden aspect-square w-full max-w-sm md:block"
            aria-hidden
          >
            <div className="absolute inset-8 rounded-full border border-white/10" />
            <div className="absolute inset-20 rounded-full border border-white/10" />
            <div className="absolute inset-0 grid place-items-center text-[10rem] leading-none">
              ⚽
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section
          className="mx-auto max-w-7xl px-4 py-16"
          aria-labelledby="home-categories"
        >
          <h2
            id="home-categories"
            className="text-2xl font-extrabold tracking-tight md:text-3xl"
          >
            Mua theo danh mục
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {categories.map((c, i) => (
              <Link
                key={c.id}
                href={`/${c.path}`}
                className="group relative flex min-h-48 flex-col justify-end overflow-hidden rounded-2xl bg-ink-soft p-6 text-white transition-transform duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <span
                  className="absolute right-5 top-4 text-6xl opacity-20 transition-transform duration-500 group-hover:scale-125 group-hover:opacity-40"
                  aria-hidden
                >
                  {['👟', '👕', '🧤'][i % 3]}
                </span>
                <span className="text-2xl font-bold">{c.name}</span>
                <span className="mt-1 text-sm text-white/60">
                  {c.children
                    .map((x) => x.name)
                    .slice(0, 3)
                    .join(' · ')}
                  …
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {latest && latest.items.length > 0 && (
        <section
          className="mx-auto max-w-7xl px-4 pb-8"
          aria-labelledby="home-latest"
        >
          <div className="flex items-end justify-between">
            <h2
              id="home-latest"
              className="text-2xl font-extrabold tracking-tight md:text-3xl"
            >
              Sản phẩm mới
            </h2>
            <Link
              href="/tim-kiem"
              className="text-sm font-semibold text-pitch-dark hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
            {latest.items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <ul className="grid gap-4 rounded-2xl bg-surface p-6 text-sm md:grid-cols-3">
          {[
            ['✔', 'Chính hãng 100%', 'Cam kết nguồn gốc rõ ràng'],
            ['🚚', 'Giao toàn quốc', 'Miễn phí vận chuyển từ 1.000.000₫'],
            ['💵', 'Thanh toán COD', 'Kiểm tra hàng rồi mới trả tiền'],
          ].map(([icon, title, desc]) => (
            <li key={title} className="flex items-start gap-3">
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-lg shadow-sm"
                aria-hidden
              >
                {icon}
              </span>
              <span>
                <b className="block text-base">{title}</b>
                <span className="text-muted">{desc}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
