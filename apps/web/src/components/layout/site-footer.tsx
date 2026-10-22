import Link from 'next/link';
import { Logo } from './site-header';

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-ink text-white/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Giày đá bóng, áo đấu và phụ kiện chính hãng. Dự án học tập — dữ liệu
            và hình ảnh trong site là dữ liệu mẫu.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-volt">
            Mua sắm
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link className="hover:text-white" href="/giay">
                Giày bóng đá
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/quan-ao">
                Quần áo
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/phu-kien">
                Phụ kiện
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-volt">
            Hỗ trợ
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link className="hover:text-white" href="/tra-cuu-don-hang">
                Tra cứu đơn hàng
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/gio-hang">
                Giỏ hàng
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" href="/dang-nhap">
                Tài khoản
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} Football Gear. Dự án học tập, chưa kinh
        doanh thật.
      </div>
    </footer>
  );
}
