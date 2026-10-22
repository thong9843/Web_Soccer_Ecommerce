import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@football/shared';
import { RolesGuard } from './roles.guard.js';

function contextFor(user: { role: Role } | undefined, required?: Role[]) {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return { guard: new RolesGuard(reflector), context };
}

describe('RolesGuard', () => {
  it('cho qua route không khai báo @Roles (kể cả guest)', () => {
    const { guard, context } = contextFor(undefined, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('guest vào route có @Roles → 401', () => {
    const { guard, context } = contextFor(undefined, ['ADMIN']);
    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('USER vào route của MANAGER/ADMIN → 403', () => {
    const { guard, context } = contextFor({ role: 'USER' }, [
      'MANAGER',
      'ADMIN',
    ]);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('MANAGER không vào được route chỉ dành cho ADMIN → 403', () => {
    const { guard, context } = contextFor({ role: 'MANAGER' }, ['ADMIN']);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it.each<Role>(['MANAGER', 'ADMIN'])('%s vào được route quản trị', (role) => {
    const { guard, context } = contextFor({ role }, ['MANAGER', 'ADMIN']);
    expect(guard.canActivate(context)).toBe(true);
  });
});
