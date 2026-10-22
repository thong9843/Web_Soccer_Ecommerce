/** Số điện thoại di động Việt Nam: 0xxxxxxxxx hoặc +84xxxxxxxxx. */
export const VN_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
export const VN_PHONE_MESSAGE = 'Số điện thoại không hợp lệ';

/** "+84901234567" / "0901 234 567" → "0901234567" để so khớp và lưu thống nhất. */
export function normalizePhone(phone: string): string {
  const compact = phone.replace(/[\s.-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
}

/** Dùng với @Transform: chuẩn hóa số điện thoại trước khi validate. */
export const transformPhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? normalizePhone(value.trim()) : value;
