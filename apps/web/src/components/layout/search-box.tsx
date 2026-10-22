'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export function SearchBox() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q')?.toString().trim();
    if (!q) return;
    setOpen(false);
    router.push(`/tim-kiem?q=${encodeURIComponent(q)}`);
  }

  return (
    <>
      <form onSubmit={onSubmit} role="search" className="hidden md:block">
        <label htmlFor="site-search" className="sr-only">
          Tìm kiếm sản phẩm
        </label>
        <div className="relative">
          <input
            id="site-search"
            name="q"
            type="search"
            placeholder="Tìm giày, áo đấu..."
            maxLength={100}
            className="h-10 w-52 rounded-full border border-line bg-surface pl-4 pr-10 text-sm transition-all focus:w-72 focus:border-pitch focus:bg-white focus:outline-none lg:w-60 lg:focus:w-80"
          />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full text-muted hover:text-ink"
          >
            <SearchIcon />
          </button>
        </div>
      </form>

      {/* Mobile: nút mở thanh tìm kiếm */}
      <button
        type="button"
        aria-label="Tìm kiếm"
        onClick={() => setOpen((v) => !v)}
        className="grid h-10 w-10 place-items-center rounded-lg hover:bg-surface md:hidden"
      >
        <SearchIcon />
      </button>
      {open && (
        <form
          onSubmit={onSubmit}
          role="search"
          className="animate-fade-up absolute inset-x-0 top-full border-b border-line bg-white p-3 md:hidden"
        >
          <label htmlFor="site-search-m" className="sr-only">
            Tìm kiếm sản phẩm
          </label>
          <input
            id="site-search-m"
            ref={inputRef}
            name="q"
            type="search"
            placeholder="Tìm giày, áo đấu..."
            maxLength={100}
            className="h-11 w-full rounded-lg border border-line bg-surface px-4 text-sm focus:border-pitch focus:outline-none"
          />
        </form>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
