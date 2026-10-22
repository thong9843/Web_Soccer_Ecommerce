import Link from 'next/link';
import type { CategoryNode } from '@football/shared';
import { apiGet } from '@/lib/api-server';
import { CartButton } from './cart-button';
import { MegaMenu } from './mega-menu';
import { MobileMenu } from './mobile-menu';
import { SearchBox } from './search-box';
import { UserMenu } from './user-menu';

async function loadCategories(): Promise<CategoryNode[]> {
  try {
    return await apiGet<CategoryNode[]>('/categories', { revalidate: 60 });
  } catch {
    // API tạm thời không sẵn sàng: vẫn hiển thị trang, chỉ thiếu menu danh mục.
    return [];
  }
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-extrabold tracking-tight"
      aria-label="Football Gear — trang chủ"
    >
      <span className="relative grid h-8 w-8 place-items-center rounded-full bg-ink">
        <span className="h-3 w-3 rounded-full bg-volt" />
      </span>
      <span
        className={`text-base sm:text-lg ${light ? 'text-white' : 'text-ink'}`}
      >
        FOOTBALL<span className="text-pitch">GEAR</span>
      </span>
    </Link>
  );
}

export async function SiteHeader() {
  const categories = await loadCategories();

  return (
    // Không dùng backdrop-blur ở đây: nó biến header thành containing block của
    // các phần tử `fixed` bên trong (drawer menu mobile sẽ bị co lại bằng header).
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="bg-ink px-4 py-1.5 text-center text-xs text-white/90">
        Miễn phí vận chuyển đơn từ <b className="text-volt">1.000.000₫</b> ·
        Thanh toán khi nhận hàng (COD) · Hàng chính hãng 100%
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <MobileMenu categories={categories} />
        <Logo />
        <MegaMenu categories={categories} />
        <div className="ml-auto flex items-center sm:gap-2">
          <SearchBox />
          <UserMenu />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
