'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { OrderDto, Paginated } from '@football/shared';
import { OrderSummary, StatusBadge } from '@/components/orders/order-summary';
import { buttonClass } from '@/components/ui/button';
import { FormError } from '@/components/ui/field';
import { api, ClientApiError } from '@/lib/api-client';
import { formatDateTime, formatVnd } from '@/lib/format';

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data, isLoading, mutate } = useSWR<Paginated<OrderDto>>(
    `/orders/me?page=${page}&pageSize=10`,
  );

  async function cancel(order: OrderDto) {
    if (!window.confirm(`Hủy đơn ${order.code}?`)) return;
    setError(null);
    try {
      await api(`/orders/${order.id}/cancel`, { method: 'POST' });
      await mutate();
    } catch (e) {
      setError(e instanceof ClientApiError ? e.message : 'Không thể hủy đơn');
    }
  }

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;
  if (!data || data.items.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-extrabold">Đơn hàng của tôi</h2>
        <p className="mt-4 rounded-xl border border-dashed border-line p-10 text-center text-muted">
          Bạn chưa có đơn hàng nào.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-extrabold">Đơn hàng của tôi</h2>
      <FormError message={error} />
      <ul className="space-y-3">
        {data.items.map((o) => {
          const open = openId === o.id;
          return (
            <li key={o.id} className="rounded-xl border border-line">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : o.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
              >
                <span>
                  <span className="block font-mono font-bold">{o.code}</span>
                  <span className="text-xs text-muted">
                    {formatDateTime(o.createdAt)} · {o.items.length} sản phẩm
                  </span>
                </span>
                <span className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <b>{formatVnd(o.total)}</b>
                </span>
              </button>
              {open && (
                <div className="animate-fade-up space-y-3 border-t border-line p-4">
                  <OrderSummary order={o} />
                  {o.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => cancel(o)}
                      className={buttonClass('outline-danger', 'sm')}
                    >
                      Hủy đơn hàng
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={buttonClass('outline', 'sm')}
          >
            ← Trước
          </button>
          <span>
            Trang {data.page}/{data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className={buttonClass('outline', 'sm')}
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  );
}
