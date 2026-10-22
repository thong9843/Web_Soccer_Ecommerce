import type { Metadata } from 'next';
import Link from 'next/link';
import type { OrderDto } from '@football/shared';
import { OrderSummary } from '@/components/orders/order-summary';
import { buttonClass } from '@/components/ui/button';
import { apiGet, toQuery } from '@/lib/api-server';
import type { RawSearchParams } from '@/lib/listing';

export const metadata: Metadata = {
  title: 'Đặt hàng thành công',
  robots: { index: false },
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const sp = await searchParams;
  const code = Array.isArray(sp.code) ? sp.code[0] : sp.code;
  const phone = Array.isArray(sp.phone) ? sp.phone[0] : sp.phone;

  let order: OrderDto | null = null;
  if (code && phone) {
    order = await apiGet<OrderDto>(
      `/orders/lookup${toQuery({ code, phone })}`,
      { revalidate: 0 },
    ).catch(() => null);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="animate-fade-up text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-pitch text-3xl text-white">
          ✓
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
          Đặt hàng thành công!
        </h1>
        <p className="mt-2 text-muted">
          Cảm ơn bạn. Chúng tôi sẽ liên hệ xác nhận đơn qua số điện thoại sớm
          nhất.
        </p>
      </div>

      <div className="mt-8">
        {order ? (
          <OrderSummary order={order} />
        ) : (
          <p className="rounded-xl bg-surface p-4 text-center text-sm">
            Không hiển thị được chi tiết đơn. Bạn có thể{' '}
            <Link href="/tra-cuu-don-hang" className="font-semibold underline">
              tra cứu đơn hàng
            </Link>{' '}
            bằng mã đơn và số điện thoại.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        Hãy lưu lại mã đơn để tra cứu khi cần.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass('primary', 'md')}>
          Tiếp tục mua sắm
        </Link>
        <Link href="/tra-cuu-don-hang" className={buttonClass('outline', 'md')}>
          Tra cứu đơn hàng
        </Link>
      </div>
    </div>
  );
}
