import { slugify } from './slug.js';

describe('slugify', () => {
  it.each([
    ['Áo đấu CLB', 'ao-dau-clb'],
    ['Giày cỏ nhân tạo (TF)', 'giay-co-nhan-tao-tf'],
    ['  Đồ thủ môn  ', 'do-thu-mon'],
    [
      'Áo đấu Real Madrid sân nhà 2025/26',
      'ao-dau-real-madrid-san-nha-2025-26',
    ],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected);
  });
});
