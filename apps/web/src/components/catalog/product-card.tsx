import Image from 'next/image';
import Link from 'next/link';
import type { ProductListItem } from '@football/shared';
import { formatVnd } from '@/lib/format';

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductListItem;
  priority?: boolean;
}) {
  return (
    <article className="group relative">
      <Link href={`/san-pham/${product.slug}`} className="block">
        <div className="relative aspect-4/5 overflow-hidden rounded-xl bg-surface">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              priority={priority}
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted">
              Chưa có ảnh
            </div>
          )}
          {!product.inStock && (
            <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-xs font-semibold text-white">
              Hết hàng
            </span>
          )}
        </div>
        <div className="mt-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-pitch-dark">
            {product.brand.name}
          </p>
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-5 text-ink group-hover:text-pitch-dark">
            {product.name}
          </h3>
          <p className="font-bold text-ink">{formatVnd(product.basePrice)}</p>
        </div>
      </Link>
    </article>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>
          <div className="skeleton aspect-4/5 rounded-xl" />
          <div className="skeleton mt-3 h-3 w-1/3 rounded" />
          <div className="skeleton mt-2 h-4 w-5/6 rounded" />
          <div className="skeleton mt-2 h-4 w-1/3 rounded" />
        </div>
      ))}
    </div>
  );
}
