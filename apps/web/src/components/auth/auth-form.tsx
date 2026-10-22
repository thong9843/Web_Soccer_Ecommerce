'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { buttonClass } from '@/components/ui/button';
import { Field, FormError, inputClass } from '@/components/ui/field';
import { useSession } from '@/hooks/use-session';
import { ClientApiError } from '@/lib/api-client';
import { isValidEmail, isValidPhone, safeNext } from '@/lib/validation';

type Mode = 'login' | 'register';

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const { login, register } = useSession();

  const [values, setValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof values, string>>
  >({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set =
    (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  function validate() {
    const e: typeof errors = {};
    if (!isValidEmail(values.email.trim())) e.email = 'Email không hợp lệ';
    if (mode === 'register') {
      if (values.fullName.trim().length < 2)
        e.fullName = 'Vui lòng nhập họ tên';
      if (values.phone.trim() && !isValidPhone(values.phone))
        e.phone = 'Số điện thoại không hợp lệ';
      if (values.password.length < 8)
        e.password = 'Mật khẩu phải có ít nhất 8 ký tự';
      else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password))
        e.password = 'Mật khẩu cần có cả chữ cái và chữ số';
    } else if (!values.password) {
      e.password = 'Vui lòng nhập mật khẩu';
    }
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setServerError(null);
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        await login(values.email.trim(), values.password);
      } else {
        await register({
          email: values.email.trim(),
          password: values.password,
          fullName: values.fullName.trim(),
          ...(values.phone.trim() ? { phone: values.phone.trim() } : {}),
        });
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setServerError(
        err instanceof ClientApiError
          ? err.status === 429
            ? 'Bạn thử quá nhiều lần, vui lòng đợi một phút rồi thử lại.'
            : err.message
          : 'Không thể kết nối, vui lòng thử lại.',
      );
      setLoading(false);
    }
  }

  const isLogin = mode === 'login';
  const other = isLogin ? '/dang-ky' : '/dang-nhap';
  const otherHref =
    next === '/' ? other : `${other}?next=${encodeURIComponent(next)}`;

  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="text-3xl font-extrabold tracking-tight">
        {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
      </h1>
      <p className="mt-2 text-muted">
        {isLogin
          ? 'Chào mừng bạn quay lại.'
          : 'Theo dõi đơn hàng và lưu địa chỉ giao hàng.'}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
        {!isLogin && (
          <Field label="Họ và tên" error={errors.fullName}>
            {(p) => (
              <input
                {...p}
                value={values.fullName}
                onChange={set('fullName')}
                autoComplete="name"
                className={inputClass}
              />
            )}
          </Field>
        )}
        <Field label="Email" error={errors.email}>
          {(p) => (
            <input
              {...p}
              value={values.email}
              onChange={set('email')}
              type="email"
              autoComplete="email"
              className={inputClass}
            />
          )}
        </Field>
        {!isLogin && (
          <Field label="Số điện thoại (không bắt buộc)" error={errors.phone}>
            {(p) => (
              <input
                {...p}
                value={values.phone}
                onChange={set('phone')}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={inputClass}
              />
            )}
          </Field>
        )}
        <Field
          label="Mật khẩu"
          error={errors.password}
          hint={isLogin ? undefined : 'Ít nhất 8 ký tự, gồm chữ cái và chữ số'}
        >
          {(p) => (
            <input
              {...p}
              value={values.password}
              onChange={set('password')}
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className={inputClass}
            />
          )}
        </Field>

        <FormError message={serverError} />

        <button
          type="submit"
          disabled={loading}
          className={buttonClass('primary', 'lg', 'w-full')}
        >
          {loading ? 'Vui lòng đợi…' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}{' '}
        <Link
          href={otherHref}
          className="font-semibold text-pitch-dark underline underline-offset-4"
        >
          {isLogin ? 'Đăng ký' : 'Đăng nhập'}
        </Link>
      </p>
    </div>
  );
}
