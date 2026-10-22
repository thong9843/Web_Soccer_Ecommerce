'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import useSWR from 'swr';
import type { AddressDto, OrderDto } from '@football/shared';
import { buttonClass } from '@/components/ui/button';
import { Field, inputClass } from '@/components/ui/field';
import { useCart } from '@/hooks/use-cart';
import { useSession } from '@/hooks/use-session';
import { api, ClientApiError } from '@/lib/api-client';
import { formatVnd } from '@/lib/format';
import { isValidEmail, isValidPhone } from '@/lib/validation';

interface FormState {
  name: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  note: string;
}

const EMPTY: FormState = {
  name: '',
  phone: '',
  email: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  note: '',
};
type Errors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState, needEmail: boolean): Errors {
  const e: Errors = {};
  if (form.name.trim().length < 2) e.name = 'Vui lòng nhập họ tên người nhận';
  if (!isValidPhone(form.phone))
    e.phone = 'Số điện thoại không hợp lệ (VD: 0901234567)';
  if (needEmail && form.email.trim() && !isValidEmail(form.email.trim()))
    e.email = 'Email không hợp lệ';
  if (!form.province.trim()) e.province = 'Vui lòng nhập Tỉnh/Thành phố';
  if (!form.district.trim()) e.district = 'Vui lòng nhập Quận/Huyện';
  if (!form.ward.trim()) e.ward = 'Vui lòng nhập Phường/Xã';
  if (!form.street.trim()) e.street = 'Vui lòng nhập địa chỉ cụ thể';
  return e;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useSession();
  const { cart, isLoading, refresh } = useCart();
  const { data: addresses } = useSWR<AddressDto[]>(
    user ? '/users/me/addresses' : null,
  );

  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string[]>([]);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  // Người dùng có sổ địa chỉ: mặc định dùng địa chỉ mặc định, hoặc chọn "địa chỉ mới".
  const savedAddress =
    user && addresses?.length
      ? selectedId === 'new'
        ? null
        : (addresses.find((a) => a.id === selectedId) ??
          addresses.find((a) => a.isDefault) ??
          addresses[0])
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setServerError([]);

    const values: FormState = savedAddress
      ? {
          ...form,
          name: savedAddress.receiverName,
          phone: savedAddress.phone,
          province: savedAddress.province,
          district: savedAddress.district,
          ward: savedAddress.ward,
          street: savedAddress.street,
        }
      : form;

    const found = validate(values, !user);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document
        .getElementById('checkout-form')
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const order = await api<OrderDto>('/orders', {
        method: 'POST',
        body: {
          shipping: {
            name: values.name.trim(),
            phone: values.phone.trim(),
            province: values.province.trim(),
            district: values.district.trim(),
            ward: values.ward.trim(),
            street: values.street.trim(),
          },
          ...(!user && values.email.trim()
            ? { email: values.email.trim() }
            : {}),
          ...(values.note.trim() ? { note: values.note.trim() } : {}),
          paymentMethod: 'COD',
        },
      });
      await refresh();
      router.push(
        `/dat-hang-thanh-cong?code=${encodeURIComponent(order.code)}&phone=${encodeURIComponent(order.shipping.phone)}`,
      );
    } catch (err) {
      setServerError(
        err instanceof ClientApiError
          ? err.details
          : ['Không thể đặt hàng, vui lòng thử lại'],
      );
      setSubmitting(false);
    }
  }

  if (isLoading || !cart) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="skeleton h-96 rounded-xl" />
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-2xl font-extrabold">Giỏ hàng trống</h1>
        <p className="mt-2 text-muted">
          Bạn cần thêm sản phẩm vào giỏ trước khi thanh toán.
        </p>
        <Link href="/giay" className={buttonClass('primary', 'lg', 'mt-6')}>
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Thanh toán</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_24rem]">
        <form
          id="checkout-form"
          onSubmit={submit}
          noValidate
          className="space-y-8"
        >
          {!user && (
            <p className="rounded-xl bg-surface px-4 py-3 text-sm">
              Đã có tài khoản?{' '}
              <Link
                href="/dang-nhap?next=/thanh-toan"
                className="font-semibold text-pitch-dark underline underline-offset-4"
              >
                Đăng nhập
              </Link>{' '}
              để dùng sổ địa chỉ và theo dõi đơn hàng. Hoặc đặt hàng nhanh không
              cần tài khoản bên dưới.
            </p>
          )}

          <section aria-labelledby="ship-title" className="space-y-4">
            <h2 id="ship-title" className="text-lg font-extrabold">
              Thông tin giao hàng
            </h2>

            {user && addresses && addresses.length > 0 && (
              <div
                className="space-y-2"
                role="radiogroup"
                aria-label="Chọn địa chỉ"
              >
                {addresses.map((a) => {
                  const checked = savedAddress?.id === a.id;
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition-colors ${checked ? 'border-ink bg-surface' : 'border-line hover:border-ink/50'}`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={checked}
                        onChange={() => setSelectedId(a.id)}
                        className="mt-1 accent-pitch"
                      />
                      <span>
                        <b>{a.receiverName}</b> · {a.phone}{' '}
                        {a.isDefault && (
                          <span className="ml-1 rounded bg-pitch-soft px-1.5 py-0.5 text-xs font-semibold text-pitch-dark">
                            Mặc định
                          </span>
                        )}
                        <span className="block text-muted">
                          {a.street}, {a.ward}, {a.district}, {a.province}
                        </span>
                      </span>
                    </label>
                  );
                })}
                <label
                  className={`flex cursor-pointer gap-3 rounded-xl border p-4 text-sm transition-colors ${!savedAddress ? 'border-ink bg-surface' : 'border-line hover:border-ink/50'}`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={!savedAddress}
                    onChange={() => setSelectedId('new')}
                    className="mt-1 accent-pitch"
                  />
                  <b>Giao đến địa chỉ khác</b>
                </label>
              </div>
            )}

            {!savedAddress && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Họ và tên người nhận *" error={errors.name}>
                  {(p) => (
                    <input
                      {...p}
                      value={form.name}
                      onChange={set('name')}
                      autoComplete="name"
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Số điện thoại *" error={errors.phone}>
                  {(p) => (
                    <input
                      {...p}
                      value={form.phone}
                      onChange={set('phone')}
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      className={inputClass}
                    />
                  )}
                </Field>
                {!user && (
                  <div className="sm:col-span-2">
                    <Field
                      label="Email (không bắt buộc)"
                      error={errors.email}
                      hint="Để nhận thông tin đơn hàng"
                    >
                      {(p) => (
                        <input
                          {...p}
                          value={form.email}
                          onChange={set('email')}
                          type="email"
                          autoComplete="email"
                          className={inputClass}
                        />
                      )}
                    </Field>
                  </div>
                )}
                <Field label="Tỉnh / Thành phố *" error={errors.province}>
                  {(p) => (
                    <>
                      <input
                        {...p}
                        list="province-list"
                        value={form.province}
                        onChange={set('province')}
                        autoComplete="address-level1"
                        className={inputClass}
                      />
                      <datalist id="province-list">
                        {[
                          'TP. Hồ Chí Minh',
                          'Hà Nội',
                          'Đà Nẵng',
                          'Hải Phòng',
                          'Cần Thơ',
                          'Huế',
                        ].map((n) => (
                          <option key={n} value={n} />
                        ))}
                      </datalist>
                    </>
                  )}
                </Field>
                <Field label="Quận / Huyện *" error={errors.district}>
                  {(p) => (
                    <input
                      {...p}
                      value={form.district}
                      onChange={set('district')}
                      autoComplete="address-level2"
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Phường / Xã *" error={errors.ward}>
                  {(p) => (
                    <input
                      {...p}
                      value={form.ward}
                      onChange={set('ward')}
                      className={inputClass}
                    />
                  )}
                </Field>
                <Field label="Số nhà, tên đường *" error={errors.street}>
                  {(p) => (
                    <input
                      {...p}
                      value={form.street}
                      onChange={set('street')}
                      autoComplete="street-address"
                      className={inputClass}
                    />
                  )}
                </Field>
              </div>
            )}

            <Field label="Ghi chú (không bắt buộc)">
              {(p) => (
                <textarea
                  {...p}
                  value={form.note}
                  onChange={set('note')}
                  rows={3}
                  maxLength={500}
                  className={`${inputClass} h-auto py-2`}
                />
              )}
            </Field>
          </section>

          <section aria-labelledby="pay-title" className="space-y-3">
            <h2 id="pay-title" className="text-lg font-extrabold">
              Phương thức thanh toán
            </h2>
            <label className="flex gap-3 rounded-xl border border-ink bg-surface p-4 text-sm">
              <input
                type="radio"
                checked
                readOnly
                className="mt-1 accent-pitch"
              />
              <span>
                <b>Thanh toán khi nhận hàng (COD)</b>
                <span className="block text-muted">
                  Kiểm tra hàng rồi mới thanh toán cho nhân viên giao hàng.
                </span>
              </span>
            </label>
          </section>

          {serverError.length > 0 && (
            <div
              role="alert"
              className="rounded-lg border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
            >
              <ul className="list-inside list-disc">
                {serverError.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              {serverError.some((m) => m.includes('hàng')) && (
                <Link
                  href="/gio-hang"
                  className="mt-1 inline-block font-semibold underline"
                >
                  Kiểm tra lại giỏ hàng
                </Link>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className={buttonClass('primary', 'lg', 'w-full')}
          >
            {submitting ? 'Đang xử lý…' : `Đặt hàng · ${formatVnd(cart.total)}`}
          </button>
        </form>

        <aside
          className="h-fit space-y-4 rounded-2xl border border-line p-5 lg:sticky lg:top-32"
          aria-label="Đơn hàng của bạn"
        >
          <h2 className="text-lg font-extrabold">
            Đơn hàng ({cart.itemCount})
          </h2>
          <ul className="divide-y divide-line text-sm">
            {cart.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 py-2.5">
                <span>
                  <span className="line-clamp-2 font-medium">
                    {i.productName}
                  </span>
                  <span className="text-muted">
                    Size {i.size} · {i.color} · x{i.qty}
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatVnd(i.lineTotal)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="space-y-2 border-t border-line pt-4 text-sm">
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
        </aside>
      </div>
    </div>
  );
}
