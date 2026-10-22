'use client';

import { buttonClass } from '@/components/ui/button';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="text-5xl" aria-hidden>
        ⚠️
      </p>
      <h1 className="mt-4 text-2xl font-extrabold">Đã có lỗi xảy ra</h1>
      <p className="mt-2 text-muted">
        Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.
      </p>
      <button
        type="button"
        onClick={reset}
        className={buttonClass('primary', 'lg', 'mt-6')}
      >
        Thử lại
      </button>
    </div>
  );
}
