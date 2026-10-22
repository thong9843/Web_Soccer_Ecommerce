'use client';

import Image from 'next/image';
import { useState } from 'react';

export function ProductGallery({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square place-items-center rounded-2xl bg-surface text-muted">
        Chưa có ảnh
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${name} — ảnh ${active + 1}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="animate-fade-up object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="flex gap-3" aria-label="Ảnh sản phẩm">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                aria-current={i === active}
                className={`relative block h-20 w-20 overflow-hidden rounded-xl border-2 bg-surface transition-colors ${
                  i === active
                    ? 'border-ink'
                    : 'border-transparent hover:border-line'
                }`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
