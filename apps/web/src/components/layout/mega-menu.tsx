'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { CategoryNode } from '@football/shared';

export function MegaMenu({ categories }: { categories: CategoryNode[] }) {
  const pathname = usePathname();
  // Ghi nhớ trang lúc mở; chuyển trang thì menu tự đóng mà không cần effect.
  const [state, setState] = useState<{ id: string | null; path: string }>({
    id: null,
    path: pathname,
  });
  const openId = state.path === pathname ? state.id : null;
  const setOpenId = useCallback(
    (id: string | null) => setState({ id, path: pathname }),
    [pathname],
  );
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenId(null);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpenId]);

  const open = (id: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenId(id);
  };
  // Trễ một chút để con trỏ kịp di chuyển từ nút xuống panel
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenId(null), 120);
  };

  return (
    <nav aria-label="Danh mục sản phẩm" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {categories.map((cat) => {
          const isOpen = openId === cat.id;
          return (
            <li
              key={cat.id}
              onMouseEnter={() => open(cat.id)}
              onMouseLeave={scheduleClose}
            >
              <div className="flex items-center">
                <Link
                  href={`/${cat.path}`}
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface"
                  onFocus={() => open(cat.id)}
                >
                  {cat.name}
                </Link>
                {cat.children.length > 0 && (
                  <button
                    type="button"
                    aria-label={`Mở menu ${cat.name}`}
                    aria-expanded={isOpen}
                    aria-controls={`mega-${cat.id}`}
                    onClick={() => setOpenId(isOpen ? null : cat.id)}
                    className="-ml-2 rounded-md p-1 text-muted hover:text-ink"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {cat.children.length > 0 && (
                <div
                  id={`mega-${cat.id}`}
                  hidden={!isOpen}
                  className="absolute left-0 right-0 top-full border-b border-line bg-white shadow-lg"
                >
                  <div className="animate-fade-up mx-auto grid max-w-7xl grid-cols-[1fr_auto] gap-8 px-4 py-6">
                    <ul className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-3">
                      {cat.children.map((child) => (
                        <li key={child.id}>
                          <Link
                            href={`/${child.path}`}
                            className="group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm text-ink transition-colors hover:bg-pitch-soft hover:text-pitch-dark"
                          >
                            {child.name}
                            <span
                              aria-hidden
                              className="translate-x-[-4px] opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                            >
                              →
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/${cat.path}`}
                      className="hidden min-w-56 flex-col justify-end rounded-xl bg-ink p-5 text-white transition-transform hover:-translate-y-0.5 md:flex"
                    >
                      <span className="text-xs uppercase tracking-widest text-volt">
                        Xem tất cả
                      </span>
                      <span className="mt-1 text-lg font-bold">{cat.name}</span>
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
