'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { ProductDetail } from '@football/shared';
import { buttonClass } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { useCart } from '@/hooks/use-cart';
import { ClientApiError } from '@/lib/api-client';
import { formatVnd } from '@/lib/format';

const COLOR_HEX: Record<string, string> = {
  Đen: '#111827',
  Trắng: '#f9fafb',
  Đỏ: '#dc2626',
  'Xanh dương': '#2563eb',
  'Xanh lá': '#16a34a',
  Cam: '#f97316',
  Vàng: '#facc15',
};

const MAX_QTY = 20;

function sizeCompare(a: string, b: string) {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  return order.indexOf(a) - order.indexOf(b) || a.localeCompare(b);
}

export function BuyBox({ product }: { product: ProductDetail }) {
  const { add } = useCart();
  const colors = useMemo(
    () => [...new Set(product.variants.map((v) => v.color))],
    [product.variants],
  );

  // Mặc định chọn màu đầu tiên còn hàng
  const [color, setColor] = useState(
    () =>
      colors.find((c) =>
        product.variants.some((v) => v.color === c && v.stock > 0),
      ) ?? colors[0],
  );
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState<'idle' | 'adding' | 'added'>('idle');
  const [error, setError] = useState<string | null>(null);

  const variantsOfColor = useMemo(
    () =>
      product.variants
        .filter((v) => v.color === color)
        .sort((a, b) => sizeCompare(a.size, b.size)),
    [product.variants, color],
  );
  const variant = variantsOfColor.find((v) => v.size === size) ?? null;
  const maxQty = variant ? Math.min(variant.stock, MAX_QTY) : 1;
  const price = variant?.price ?? product.basePrice;

  function pickColor(next: string) {
    setColor(next);
    setSize(null);
    setQty(1);
    setStatus('idle');
    setError(null);
  }

  async function addToCart() {
    if (!variant) {
      setError('Vui lòng chọn size');
      return;
    }
    setError(null);
    setStatus('adding');
    try {
      await add(variant.id, qty);
      setStatus('added');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e) {
      setStatus('idle');
      setError(
        e instanceof ClientApiError
          ? e.message
          : 'Không thể thêm vào giỏ, vui lòng thử lại',
      );
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-pitch-dark">
          {product.brand.name}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
          {product.name}
        </h1>
        <p className="mt-3 text-3xl font-extrabold">{formatVnd(price)}</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Màu sắc: <span className="font-normal text-muted">{color}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={c === color}
              onClick={() => pickColor(c)}
              className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                c === color
                  ? 'border-ink bg-ink text-white'
                  : 'border-line hover:border-ink'
              }`}
            >
              <span
                className="h-4 w-4 rounded-full border border-black/20"
                style={{ background: COLOR_HEX[c] ?? '#9ca3af' }}
                aria-hidden
              />
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Size</legend>
        <div className="flex flex-wrap gap-2">
          {variantsOfColor.map((v) => {
            const soldOut = v.stock <= 0;
            return (
              <button
                key={v.id}
                type="button"
                disabled={soldOut}
                aria-pressed={v.size === size}
                aria-label={
                  soldOut ? `Size ${v.size} đã hết hàng` : `Size ${v.size}`
                }
                onClick={() => {
                  setSize(v.size);
                  setQty(1);
                  setError(null);
                  setStatus('idle');
                }}
                className={`h-11 min-w-12 rounded-lg border px-3 text-sm font-semibold transition-all ${
                  v.size === size
                    ? 'border-ink bg-ink text-white'
                    : soldOut
                      ? 'cursor-not-allowed border-line text-muted/50 line-through'
                      : 'border-line hover:border-ink'
                }`}
              >
                {v.size}
              </button>
            );
          })}
        </div>
        {variant && variant.stock <= 5 && (
          <p className="mt-2 text-sm font-medium text-warn">
            Chỉ còn {variant.stock} sản phẩm
          </p>
        )}
      </fieldset>

      <div className="flex items-center gap-3">
        <div
          className="inline-flex h-12 items-center rounded-lg border border-line"
          role="group"
          aria-label="Số lượng"
        >
          <button
            type="button"
            aria-label="Giảm số lượng"
            disabled={qty <= 1}
            onClick={() => setQty((q) => q - 1)}
            className="h-full w-11 text-lg hover:bg-surface disabled:opacity-30"
          >
            −
          </button>
          <output className="w-10 text-center font-semibold" aria-live="polite">
            {qty}
          </output>
          <button
            type="button"
            aria-label="Tăng số lượng"
            disabled={!variant || qty >= maxQty}
            onClick={() => setQty((q) => q + 1)}
            className="h-full w-11 text-lg hover:bg-surface disabled:opacity-30"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={status === 'adding' || !product.inStock}
          className={buttonClass(
            status === 'added' ? 'dark' : 'primary',
            'lg',
            'h-12 flex-1',
          )}
        >
          {!product.inStock
            ? 'Hết hàng'
            : status === 'adding'
              ? 'Đang thêm…'
              : status === 'added'
                ? '✓ Đã thêm vào giỏ'
                : 'Thêm vào giỏ'}
        </button>
      </div>

      <FormError message={error} />

      {status === 'added' && (
        <p className="animate-fade-up text-sm">
          <Link
            href="/gio-hang"
            className="font-semibold text-pitch-dark underline underline-offset-4"
          >
            Xem giỏ hàng & thanh toán →
          </Link>
        </p>
      )}

      <ul className="space-y-2 border-t border-line pt-5 text-sm text-muted">
        <li>✔ Hàng chính hãng, nguồn gốc rõ ràng</li>
        <li>✔ Miễn phí vận chuyển cho đơn từ 1.000.000₫</li>
        <li>✔ Thanh toán khi nhận hàng (COD)</li>
      </ul>
    </div>
  );
}
