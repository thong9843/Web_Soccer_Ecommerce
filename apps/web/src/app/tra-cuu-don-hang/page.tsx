'use client';

import { useState } from 'react';
import type { OrderDto } from '@football/shared';
import { OrderSummary } from '@/components/orders/order-summary';
import { buttonClass } from '@/components/ui/button';
import { Field, FormError, inputClass } from '@/components/ui/field';
import { api, ClientApiError } from '@/lib/api-client';
import { isValidPhone } from '@/lib/validation';

export default function OrderLookupPage() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOrder(null);
    if (!code.trim()) return setError('Vui lòng nhập mã đơn hàng');
    if (!isValidPhone(phone)) return setError('Số điện thoại không hợp lệ');
    setError(null);
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        code: code.trim(),
        phone: phone.trim(),
      });
      setOrder(await api<OrderDto>(`/orders/lookup?${qs}`));
    } catch (err) {
      setError(
        err instanceof ClientApiError && err.status === 404
          ? 'Không tìm thấy đơn hàng. Hãy kiểm tra lại mã đơn và số điện thoại đặt hàng.'
          : err instanceof ClientApiError && err.status === 429
            ? 'Bạn thử quá nhiều lần, vui lòng đợi một phút rồi thử lại.'
            : 'Không thể tra cứu lúc này, vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">
        Tra cứu đơn hàng
      </h1>
      <p className="mt-2 text-muted">
        Nhập mã đơn và số điện thoại bạn đã dùng khi đặt hàng.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <Field label="Mã đơn hàng">
          {(p) => (
            <input
              {...p}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="FG-20261011-AB12CD"
              className={`${inputClass} font-mono uppercase`}
            />
          )}
        </Field>
        <Field label="Số điện thoại">
          {(p) => (
            <input
              {...p}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              className={inputClass}
            />
          )}
        </Field>
        <FormError message={error} />
        <button
          type="submit"
          disabled={loading}
          className={buttonClass('primary', 'lg', 'w-full')}
        >
          {loading ? 'Đang tra cứu…' : 'Tra cứu'}
        </button>
      </form>

      {order && (
        <div className="animate-fade-up mt-8">
          <OrderSummary order={order} />
        </div>
      )}
    </div>
  );
}
