'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { useCart } from '@/hooks/use-cart';
import { ClientApiError } from '@/lib/api-client';
import { formatVnd } from '@/lib/format';

const FREE_SHIPPING_THRESHOLD = 1_000_000;

export default function CartPage() {
  const { cart, isLoading, setQty, remove } = useCart();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(itemId: string, action: () => Promise<unknown>) {
    setBusyId(itemId);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof ClientApiError
          ? e.message
          : 'Có lỗi xảy ra, vui lòng thử lại',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading || !cart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="skeleton h-9 w-48 rounded" />
        <div className="skeleton mt-8 h-32 rounded-xl" />
        <div className="skeleton mt-4 h-32 rounded-xl" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-6xl" aria-hidden>
          🛒
        </p>
        <h1 className="mt-4 text-2xl font-extrabold">
          Giỏ hàng của bạn đang trống
        </h1>
        <p className="mt-2 text-muted">
          Hãy chọn vài món đồ cho trận đấu sắp tới nhé.
        </p>
        <Link href="/giay" className={buttonClass('primary', 'lg', 'mt-6')}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  const remaining = FREE_SHIPPING_THRESHOLD - cart.subtotal;
  const progress = Math.min(
    100,
    (cart.subtotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Giỏ hàng{' '}
        <span className="text-lg font-medium text-muted">
          ({cart.itemCount} sản phẩm)
        </span>
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div>
          <div className="mb-6 rounded-xl bg-surface p-4 text-sm">
            {remaining > 0 ? (
              <p>
                Mua thêm <b>{formatVnd(remaining)}</b> để được{' '}
                <b className="text-pitch-dark">miễn phí vận chuyển</b>
              </p>
            ) : (
              <p className="font-semibold text-pitch-dark">
                ✔ Đơn hàng của bạn được miễn phí vận chuyển
              </p>
            )}
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Tiến độ miễn phí vận chuyển"
            >
              <div
                className="h-full rounded-full bg-pitch transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <FormError message={error} />

          <ul className="divide-y divide-line">
            {cart.items.map((item) => {
              const busy = busyId === item.id;
              return (
                <li
                  key={item.id}
                  className={`flex gap-4 py-5 transition-opacity ${busy ? 'opacity-50' : ''}`}
                >
                  <Link
                    href={`/san-pham/${item.productSlug}`}
                    className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-surface"
                  >
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          href={`/san-pham/${item.productSlug}`}
                          className="line-clamp-2 font-semibold hover:text-pitch-dark"
                        >
                          {item.productName}
                        </Link>
                        <p className="mt-1 text-sm text-muted">
                          Size {item.size} · {item.color}
                          {item.studType ? ` · ${item.studType}` : ''}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold">
                        {formatVnd(item.lineTotal)}
                      </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div
                        className="inline-flex h-10 items-center rounded-lg border border-line"
                        role="group"
                        aria-label={`Số lượng ${item.productName}`}
                      >
                        <button
                          type="button"
                          aria-label="Giảm số lượng"
                          disabled={busy || item.qty <= 1}
                          onClick={() =>
                            run(item.id, () => setQty(item.id, item.qty - 1))
                          }
                          className="h-full w-10 hover:bg-surface disabled:opacity-30"
                        >
                          −
                        </button>
                        <output className="w-9 text-center text-sm font-semibold">
                          {item.qty}
                        </output>
                        <button
                          type="button"
                          aria-label="Tăng số lượng"
                          disabled={
                            busy || item.qty >= Math.min(item.stock, 20)
                          }
                          onClick={() =>
                            run(item.id, () => setQty(item.id, item.qty + 1))
                          }
                          className="h-full w-10 hover:bg-surface disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(item.id, () => remove(item.id))}
                        className="text-sm text-muted underline underline-offset-4 hover:text-danger"
                      >
                        Xóa
                      </button>
                    </div>
                    {item.qty >= item.stock && (
                      <p className="mt-1 text-xs text-warn">
                        Đã đạt số lượng tối đa trong kho
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside
          className="h-fit space-y-4 rounded-2xl border border-line p-5 lg:sticky lg:top-32"
          aria-label="Tóm tắt đơn hàng"
        >
          <h2 className="text-lg font-extrabold">Tóm tắt đơn hàng</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Tạm tính</dt>
              <dd>{formatVnd(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Phí vận chuyển</dt>
              <dd>
                {cart.shippingFee === 0
                  ? 'Miễn phí'
                  : formatVnd(cart.shippingFee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-3 text-base font-extrabold">
              <dt>Tổng cộng</dt>
              <dd>{formatVnd(cart.total)}</dd>
            </div>
          </dl>
          <Link
            href="/thanh-toan"
            className={buttonClass('primary', 'lg', 'w-full')}
          >
            Tiến hành đặt hàng
          </Link>
          <p className="text-center text-xs text-muted">
            Thanh toán khi nhận hàng (COD)
          </p>
        </aside>
      </div>
    </div>
  );
}
