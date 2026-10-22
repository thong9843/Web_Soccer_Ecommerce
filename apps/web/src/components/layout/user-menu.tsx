'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from '@/hooks/use-session';

export function UserMenu() {
  const { user, isLoading, logout } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isLoading)
    return <div className="skeleton h-10 w-10 rounded-lg" aria-hidden />;

  if (!user) {
    return (
      <Link
        href="/dang-nhap"
        aria-label="Đăng nhập"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg px-2.5 text-sm font-semibold whitespace-nowrap hover:bg-surface sm:px-3"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="sm:hidden"
          aria-hidden
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <span className="hidden sm:inline">Đăng nhập</span>
      </Link>
    );
  }

  const initial = user.fullName.trim().charAt(0).toUpperCase();
  const isStaff = user.role === 'MANAGER' || user.role === 'ADMIN';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Tài khoản"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-full bg-ink text-sm font-bold text-volt transition-transform hover:scale-105"
      >
        {initial}
      </button>
      {open && (
        <div
          role="menu"
          className="animate-fade-up absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <MenuLink href="/tai-khoan" onClick={() => setOpen(false)}>
            Hồ sơ của tôi
          </MenuLink>
          <MenuLink href="/tai-khoan/don-hang" onClick={() => setOpen(false)}>
            Đơn hàng
          </MenuLink>
          <MenuLink href="/tai-khoan/dia-chi" onClick={() => setOpen(false)}>
            Sổ địa chỉ
          </MenuLink>
          {isStaff && (
            <MenuLink href="/admin" onClick={() => setOpen(false)}>
              Quản trị
            </MenuLink>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await logout();
              router.push('/');
              router.refresh();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-danger-soft"
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className="block px-4 py-2.5 text-sm hover:bg-surface"
    >
      {children}
    </Link>
  );
}
