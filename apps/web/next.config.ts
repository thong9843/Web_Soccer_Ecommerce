import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Dùng mô hình render quen thuộc (không bật Cache Components) để đơn giản cho dự án học tập.
  cacheComponents: false,
  partialPrefetching: false,
  transpilePackages: ['@football/shared'],
  images: {
    remotePatterns: [
      // Ảnh giữ chỗ của dữ liệu seed; thay bằng Cloudinary ở giai đoạn 3.
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
