'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useSession } from '@/hooks/use-session';

const LINKS = [
  { href: '/tai-khoan', label: 'Hồ sơ' },
  { href: '/tai-khoan/don-hang', label: 'Đơn hàng' },
  { href: '/tai-khoan/dia-chi', label: 'Sổ địa chỉ' },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Chỉ để điều hướng/ẩn giao diện; quyền truy cập dữ liệu thật do backend kiểm tra.
  useEffect(() => {
    if (!isLoading && !user)
      router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`);
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Tài khoản</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-[13rem_1fr]">
        <nav
          aria-label="Tài khoản"
          className="flex gap-1 overflow-x-auto md:flex-col"
        >
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-ink text-white' : 'hover:bg-surface'}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
