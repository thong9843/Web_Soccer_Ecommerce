import {
  calculateTotals,
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
} from './pricing.js';

describe('calculateTotals', () => {
  it('giỏ rỗng = 0 đồng, không tính phí ship', () => {
    expect(calculateTotals([])).toEqual({
      subtotal: 0,
      shippingFee: 0,
      total: 0,
    });
  });

  it('cộng đơn giá × số lượng và thêm phí ship khi dưới ngưỡng', () => {
    const totals = calculateTotals([
      { unitPrice: 290_000, qty: 2 },
      { unitPrice: 190_000, qty: 1 },
    ]);
    expect(totals).toEqual({
      subtotal: 770_000,
      shippingFee: STANDARD_SHIPPING_FEE,
      total: 800_000,
    });
  });

  it('miễn phí ship đúng tại ngưỡng, còn thiếu 1đ thì vẫn tính phí', () => {
    expect(
      calculateTotals([{ unitPrice: FREE_SHIPPING_THRESHOLD, qty: 1 }])
        .shippingFee,
    ).toBe(0);
    expect(
      calculateTotals([{ unitPrice: FREE_SHIPPING_THRESHOLD - 1, qty: 1 }])
        .shippingFee,
    ).toBe(STANDARD_SHIPPING_FEE);
  });

  it('đơn giá lớn không bị sai số (số nguyên VND)', () => {
    const totals = calculateTotals([{ unitPrice: 6_500_000, qty: 3 }]);
    expect(totals).toEqual({
      subtotal: 19_500_000,
      shippingFee: 0,
      total: 19_500_000,
    });
  });

  it.each([
    [{ unitPrice: 100_000, qty: 0 }],
    [{ unitPrice: 100_000, qty: -1 }],
    [{ unitPrice: 100_000, qty: 1.5 }],
    [{ unitPrice: -5, qty: 1 }],
    [{ unitPrice: 99.5, qty: 1 }],
  ])('từ chối dòng không hợp lệ %o', (line) => {
    expect(() => calculateTotals([line])).toThrow(RangeError);
  });
});
