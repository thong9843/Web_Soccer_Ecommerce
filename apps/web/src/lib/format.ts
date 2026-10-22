const vnd = new Intl.NumberFormat('vi-VN');

/** 1890000 → "1.890.000₫" */
export function formatVnd(amount: number): string {
  return `${vnd.format(amount)}₫`;
}

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

export const ORDER_STATUS_LABEL = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
  RETURNED: 'Hoàn trả',
} as const;
