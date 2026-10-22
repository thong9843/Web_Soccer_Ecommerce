'use client';

import { useState } from 'react';
import type { AuthUser } from '@football/shared';
import { buttonClass } from '@/components/ui/button';
import { Field, FormError, inputClass } from '@/components/ui/field';
import { useSession } from '@/hooks/use-session';
import { api, ClientApiError } from '@/lib/api-client';
import { isValidPhone } from '@/lib/validation';

export default function ProfilePage() {
  const { user, mutate } = useSession();
  if (!user) return null;
  // key theo id để form khởi tạo lại đúng giá trị khi đổi người dùng
  return (
    <ProfileForm
      key={user.id}
      user={user}
      onSaved={(u) => mutate(u, { revalidate: false })}
    />
  );
}

function ProfileForm({
  user,
  onSaved,
}: {
  user: AuthUser;
  onSaved: (u: AuthUser) => unknown;
}) {
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError(null);
    const found: typeof errors = {};
    if (fullName.trim().length < 2) found.fullName = 'Họ tên quá ngắn';
    if (phone.trim() && !isValidPhone(phone))
      found.phone = 'Số điện thoại không hợp lệ';
    setErrors(found);
    if (Object.keys(found).length) return;

    setSaving(true);
    try {
      const updated = await api<AuthUser>('/users/me', {
        method: 'PATCH',
        body: {
          fullName: fullName.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        },
      });
      await onSaved(updated);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ClientApiError
          ? err.message
          : 'Không thể lưu, vui lòng thử lại',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-md space-y-4">
      <h2 className="text-xl font-extrabold">Hồ sơ của tôi</h2>
      <Field label="Email" hint="Email dùng để đăng nhập, không thể thay đổi">
        {(p) => (
          <input
            {...p}
            value={user.email}
            readOnly
            className={`${inputClass} bg-surface`}
          />
        )}
      </Field>
      <Field label="Họ và tên" error={errors.fullName}>
        {(p) => (
          <input
            {...p}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Số điện thoại" error={errors.phone}>
        {(p) => (
          <input
            {...p}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            autoComplete="tel"
            className={inputClass}
          />
        )}
      </Field>
      <FormError message={error} />
      {saved && (
        <p role="status" className="text-sm font-medium text-pitch-dark">
          ✔ Đã lưu thay đổi
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className={buttonClass('primary', 'md')}
      >
        {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
      </button>
    </form>
  );
}
