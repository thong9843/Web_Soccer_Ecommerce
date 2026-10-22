import type { OrderDto } from '@football/shared';
import { formatDateTime, formatVnd, ORDER_STATUS_LABEL } from '@/lib/format';

const STATUS_STYLE: Record<OrderDto['status'], string> = {
  PENDING: 'bg-warn-soft text-warn',
  CONFIRMED: 'bg-blue-50 text-blue-700',
  SHIPPING: 'bg-blue-50 text-blue-700',
  DELIVERED: 'bg-pitch-soft text-pitch-dark',
  CANCELLED: 'bg-danger-soft text-danger',
  RETURNED: 'bg-surface text-muted',
};

export function StatusBadge({ status }: { status: OrderDto['status'] }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}

export function OrderSummary({ order }: { order: OrderDto }) {
  const s = order.shipping;
  return (
    <div className="space-y-6 rounded-2xl border border-line p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Mã đơn hàng</p>
          <p className="font-mono text-xl font-extrabold tracking-wide">
            {order.code}
          </p>
          <p className="mt-1 text-xs text-muted">
            Đặt lúc {formatDateTime(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="divide-y divide-line">
        {order.items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-4 py-3 text-sm"
          >
            <div>
              <p className="font-medium">{item.productName}</p>
              <p className="text-muted">
                Size {item.size} · {item.color} · SL {item.qty}
              </p>
              {(item.customName || item.customNumber) && (
                <p className="text-muted">
                  In: {item.customName} {item.customNumber}
                </p>
              )}
            </div>
            <span className="shrink-0 font-semibold">
              {formatVnd(item.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Tạm tính</dt>
          <dd>{formatVnd(order.subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Phí vận chuyển</dt>
          <dd>
            {order.shippingFee === 0
              ? 'Miễn phí'
              : formatVnd(order.shippingFee)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2 text-base font-extrabold">
          <dt>Tổng cộng (COD)</dt>
          <dd>{formatVnd(order.total)}</dd>
        </div>
      </dl>

      <div className="rounded-xl bg-surface p-4 text-sm">
        <p className="font-semibold">Giao đến</p>
        <p className="mt-1">
          {s.name} · {s.phone}
        </p>
        <p className="text-muted">
          {s.street}, {s.ward}, {s.district}, {s.province}
        </p>
        {order.note && <p className="mt-2 text-muted">Ghi chú: {order.note}</p>}
      </div>
    </div>
  );
}
