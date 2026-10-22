/** Đơn từ mức này trở lên được miễn phí vận chuyển (VND). */
export const FREE_SHIPPING_THRESHOLD = 1_000_000;
/** Phí vận chuyển tiêu chuẩn (VND). */
export const STANDARD_SHIPPING_FEE = 30_000;
export const MAX_QTY_PER_LINE = 20;

export interface PricedLine {
  unitPrice: number;
  qty: number;
}

export interface OrderTotals {
  subtotal: number;
  shippingFee: number;
  total: number;
}

/**
 * Tính tiền đơn hàng. Giá luôn lấy từ DB, không bao giờ từ client.
 * Giỏ rỗng → 0 đồng (không tính phí ship).
 */
export function calculateTotals(lines: PricedLine[]): OrderTotals {
  for (const { unitPrice, qty } of lines) {
    if (!Number.isInteger(unitPrice) || unitPrice < 0) {
      throw new RangeError(`Đơn giá không hợp lệ: ${unitPrice}`);
    }
    if (!Number.isInteger(qty) || qty < 1) {
      throw new RangeError(`Số lượng không hợp lệ: ${qty}`);
    }
  }
  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const shippingFee =
    subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : STANDARD_SHIPPING_FEE;
  return { subtotal, shippingFee, total: subtotal + shippingFee };
}
