'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { CategoryNode } from '@football/shared';

export function MobileMenu({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();
  // Ghi nhớ trang lúc mở; chuyển trang thì drawer tự đóng mà không cần effect.
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = (value: boolean) => setOpenedAt(value ? pathname : null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Khóa cuộn nền khi drawer mở
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="Mở menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="-ml-2 grid h-10 w-9 place-items-center rounded-lg hover:bg-surface"
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
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      <div
        className={`fixed inset-0 z-50 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          aria-label="Đóng menu"
          className="absolute inset-0 bg-ink/50"
          onClick={() => setOpen(false)}
          tabIndex={open ? 0 : -1}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[min(86vw,22rem)] flex-col bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
          role="dialog"
          aria-label="Menu"
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <span className="font-bold">Danh mục</span>
            <button
              type="button"
              aria-label="Đóng menu"
              onClick={() => setOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface"
              tabIndex={open ? 0 : -1}
            >
              ✕
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto p-2">
            {categories.map((cat) => {
              const isExpanded = expanded === cat.id;
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpanded(isExpanded ? null : cat.id)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left font-semibold hover:bg-surface"
                    tabIndex={open ? 0 : -1}
                  >
                    {cat.name}
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <ul
                    className={`grid overflow-hidden pl-3 transition-all duration-300 ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="min-h-0">
                      <li>
                        <Link
                          href={`/${cat.path}`}
                          className="block rounded-lg px-3 py-2.5 text-sm font-medium text-pitch-dark"
                          tabIndex={isExpanded && open ? 0 : -1}
                        >
                          Xem tất cả {cat.name}
                        </Link>
                      </li>
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/${child.path}`}
                            className="block rounded-lg px-3 py-2.5 text-sm hover:bg-surface"
                            tabIndex={isExpanded && open ? 0 : -1}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </div>
                  </ul>
                </li>
              );
            })}
          </ul>
          <div className="space-y-1 border-t border-line p-3 text-sm">
            <Link
              href="/tra-cuu-don-hang"
              className="block rounded-lg px-3 py-2.5 hover:bg-surface"
              tabIndex={open ? 0 : -1}
            >
              Tra cứu đơn hàng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
