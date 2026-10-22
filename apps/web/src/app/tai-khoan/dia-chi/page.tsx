'use client';

import { useState } from 'react';
import useSWR from 'swr';
import type { AddressDto } from '@football/shared';
import { buttonClass } from '@/components/ui/button';
import { Field, FormError, inputClass } from '@/components/ui/field';
import { api, ClientApiError } from '@/lib/api-client';
import { isValidPhone } from '@/lib/validation';

type Draft = Omit<AddressDto, 'id' | 'isDefault'> & { isDefault: boolean };
const EMPTY: Draft = {
  receiverName: '',
  phone: '',
  province: '',
  district: '',
  ward: '',
  street: '',
  isDefault: false,
};

export default function AddressesPage() {
  const { data, isLoading, mutate } = useSWR<AddressDto[]>(
    '/users/me/addresses',
  );
  const [editing, setEditing] = useState<{
    id: string | null;
    draft: Draft;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await mutate();
    } catch (e) {
      setError(
        e instanceof ClientApiError
          ? e.message
          : 'Có lỗi xảy ra, vui lòng thử lại',
      );
    }
  }

  if (isLoading) return <div className="skeleton h-48 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold">Sổ địa chỉ</h2>
        {!editing && (data?.length ?? 0) < 10 && (
          <button
            type="button"
            onClick={() => setEditing({ id: null, draft: EMPTY })}
            className={buttonClass('primary', 'sm')}
          >
            + Thêm địa chỉ
          </button>
        )}
      </div>
      <FormError message={error} />

      {editing && (
        <AddressForm
          initial={editing.draft}
          isNew={!editing.id}
          onCancel={() => setEditing(null)}
          onSave={(draft) =>
            run(async () => {
              if (editing.id)
                await api(`/users/me/addresses/${editing.id}`, {
                  method: 'PATCH',
                  body: draft,
                });
              else
                await api('/users/me/addresses', {
                  method: 'POST',
                  body: draft,
                });
              setEditing(null);
            })
          }
        />
      )}

      {data && data.length === 0 && !editing && (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-muted">
          Chưa có địa chỉ nào.
        </p>
      )}

      <ul className="space-y-3">
        {data?.map((a) => (
          <li key={a.id} className="rounded-xl border border-line p-4 text-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {a.receiverName} · {a.phone}
                  {a.isDefault && (
                    <span className="ml-2 rounded bg-pitch-soft px-1.5 py-0.5 text-xs font-semibold text-pitch-dark">
                      Mặc định
                    </span>
                  )}
                </p>
                <p className="mt-1 text-muted">
                  {a.street}, {a.ward}, {a.district}, {a.province}
                </p>
              </div>
              <div className="flex gap-3 text-sm">
                {!a.isDefault && (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() =>
                      run(() =>
                        api(`/users/me/addresses/${a.id}`, {
                          method: 'PATCH',
                          body: { isDefault: true },
                        }),
                      )
                    }
                  >
                    Đặt mặc định
                  </button>
                )}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() =>
                    setEditing({
                      id: a.id,
                      draft: {
                        receiverName: a.receiverName,
                        phone: a.phone,
                        province: a.province,
                        district: a.district,
                        ward: a.ward,
                        street: a.street,
                        isDefault: a.isDefault,
                      },
                    })
                  }
                >
                  Sửa
                </button>
                <button
                  type="button"
                  className="text-danger underline underline-offset-4"
                  onClick={() =>
                    window.confirm('Xóa địa chỉ này?') &&
                    run(() =>
                      api(`/users/me/addresses/${a.id}`, { method: 'DELETE' }),
                    )
                  }
                >
                  Xóa
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddressForm({
  initial,
  isNew,
  onSave,
  onCancel,
}: {
  initial: Draft;
  isNew: boolean;
  onSave: (draft: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>(
    {},
  );
  const [saving, setSaving] = useState(false);
  const set =
    (key: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraft((d) => ({ ...d, [key]: e.target.value }));
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const found: typeof errors = {};
    if (draft.receiverName.trim().length < 2)
      found.receiverName = 'Vui lòng nhập họ tên';
    if (!isValidPhone(draft.phone)) found.phone = 'Số điện thoại không hợp lệ';
    for (const k of ['province', 'district', 'ward', 'street'] as const) {
      if (!draft[k].trim()) found[k] = 'Không được để trống';
    }
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    await onSave({
      ...draft,
      receiverName: draft.receiverName.trim(),
      street: draft.street.trim(),
    });
    setSaving(false);
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="animate-fade-up grid gap-4 rounded-xl border border-ink p-5 sm:grid-cols-2"
    >
      <h3 className="font-bold sm:col-span-2">
        {isNew ? 'Địa chỉ mới' : 'Sửa địa chỉ'}
      </h3>
      <Field label="Người nhận" error={errors.receiverName}>
        {(p) => (
          <input
            {...p}
            value={draft.receiverName}
            onChange={set('receiverName')}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Số điện thoại" error={errors.phone}>
        {(p) => (
          <input
            {...p}
            value={draft.phone}
            onChange={set('phone')}
            type="tel"
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Tỉnh / Thành phố" error={errors.province}>
        {(p) => (
          <input
            {...p}
            value={draft.province}
            onChange={set('province')}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Quận / Huyện" error={errors.district}>
        {(p) => (
          <input
            {...p}
            value={draft.district}
            onChange={set('district')}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Phường / Xã" error={errors.ward}>
        {(p) => (
          <input
            {...p}
            value={draft.ward}
            onChange={set('ward')}
            className={inputClass}
          />
        )}
      </Field>
      <Field label="Số nhà, tên đường" error={errors.street}>
        {(p) => (
          <input
            {...p}
            value={draft.street}
            onChange={set('street')}
            className={inputClass}
          />
        )}
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input
          type="checkbox"
          checked={draft.isDefault}
          onChange={(e) =>
            setDraft((d) => ({ ...d, isDefault: e.target.checked }))
          }
          className="accent-pitch"
        />
        Đặt làm địa chỉ mặc định
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className={buttonClass('primary', 'md')}
        >
          {saving ? 'Đang lưu…' : 'Lưu địa chỉ'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={buttonClass('outline', 'md')}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
