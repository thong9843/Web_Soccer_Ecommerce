import Link from 'next/link';

function pageHref(basePath: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params);
  if (page <= 1) next.delete('page');
  else next.set('page', String(page));
  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Dãy số trang rút gọn: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(current: number, total: number): Array<number | '…'> {
  const pages = new Set([
    1,
    total,
    current,
    current - 1,
    current + 1,
    current - 2,
    current + 2,
  ]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  const out: Array<number | '…'> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

export function Pagination({
  basePath,
  searchParams,
  page,
  totalPages,
}: {
  basePath: string;
  searchParams: URLSearchParams;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;
  const item =
    'grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-medium transition-colors';

  return (
    <nav
      aria-label="Phân trang"
      className="mt-12 flex flex-wrap items-center justify-center gap-1.5"
    >
      {page > 1 && (
        <Link
          href={pageHref(basePath, searchParams, page - 1)}
          className={`${item} hover:bg-surface`}
          rel="prev"
        >
          ← Trước
        </Link>
      )}
      {pageWindow(page, totalPages).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={pageHref(basePath, searchParams, p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${item} ${p === page ? 'bg-ink text-white' : 'hover:bg-surface'}`}
          >
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link
          href={pageHref(basePath, searchParams, page + 1)}
          className={`${item} hover:bg-surface`}
          rel="next"
        >
          Sau →
        </Link>
      )}
    </nav>
  );
}
