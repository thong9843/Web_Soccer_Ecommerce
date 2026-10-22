import Link from 'next/link';
import { buttonClass } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-28 text-center">
      <p className="text-7xl font-extrabold text-pitch">404</p>
      <h1 className="mt-4 text-2xl font-extrabold">Không tìm thấy trang</h1>
      <p className="mt-2 text-muted">
        Trang bạn tìm có thể đã bị xóa hoặc đường dẫn không đúng.
      </p>
      <Link href="/" className={buttonClass('primary', 'lg', 'mt-6')}>
        Về trang chủ
      </Link>
    </div>
  );
}
