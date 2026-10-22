'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';

export function CartButton() {
  const { cart } = useCart();
  const count = cart?.itemCount ?? 0;

  return (
    <Link
      href="/gio-hang"
      aria-label={`Giỏ hàng, ${count} sản phẩm`}
      className="relative grid h-10 w-10 place-items-center rounded-lg hover:bg-surface"
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <path d="M6 7h13l-1.5 8.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.6L5.5 4H3" />
        <circle cx="10" cy="20.5" r="1" />
        <circle cx="17" cy="20.5" r="1" />
      </svg>
      {count > 0 && (
        // key theo số lượng để chạy lại hiệu ứng mỗi lần thay đổi
        <span
          key={count}
          className="animate-pop absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-pitch px-1 text-[11px] font-bold text-white"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
