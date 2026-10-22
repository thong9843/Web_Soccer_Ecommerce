import type { Metadata } from 'next';
import { Be_Vietnam_Pro } from 'next/font/google';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import { SWRProvider } from '@/components/swr-provider';
import './globals.css';

const sans = Be_Vietnam_Pro({
  variable: '--font-sans-vi',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

// Dữ liệu lấy từ API lúc chạy, không cần API sống khi build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Football Gear — Giày, quần áo, phụ kiện bóng đá chính hãng',
    template: '%s | Football Gear',
  },
  description:
    'Cửa hàng giày đá bóng, áo đấu CLB, đội tuyển và phụ kiện bóng đá chính hãng. Giao hàng toàn quốc, thanh toán khi nhận hàng.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${sans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <SWRProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </SWRProvider>
      </body>
    </html>
  );
}
