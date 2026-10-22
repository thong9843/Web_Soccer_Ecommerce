import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { Role } from '@football/shared';
import type { AuthenticatedUser, RequestWithUser } from './auth.types.js';

export const IS_PUBLIC_KEY = 'isPublic';
export const ROLES_KEY = 'roles';

/** Route không bắt buộc đăng nhập (guest được phép). Nếu có token hợp lệ thì vẫn nhận diện user. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Chỉ các vai trò liệt kê mới được vào. Không có decorator này = mọi user đã đăng nhập. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

/** Lấy user hiện tại từ request (undefined với guest). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser | undefined => {
    return ctx.switchToHttp().getRequest<RequestWithUser>().user;
  },
);
