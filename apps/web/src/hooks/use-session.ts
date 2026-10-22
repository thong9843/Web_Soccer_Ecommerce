'use client';

import useSWR, { useSWRConfig } from 'swr';
import type { AuthUser } from '@football/shared';
import { api } from '@/lib/api-client';

export function useSession() {
  const { mutate: globalMutate } = useSWRConfig();
  const { data, isLoading, mutate } = useSWR<AuthUser>('/auth/me', {
    // 401 nghĩa là chưa đăng nhập, không phải lỗi cần thử lại.
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  });

  async function login(email: string, password: string) {
    const res = await api<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await mutate(res.user, { revalidate: false });
    await globalMutate('/cart'); // giỏ khách được gộp vào giỏ user
    return res.user;
  }

  async function register(input: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
  }) {
    const res = await api<{ user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: input,
    });
    await mutate(res.user, { revalidate: false });
    await globalMutate('/cart');
    return res.user;
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' });
    await mutate(undefined, { revalidate: false });
    await globalMutate('/cart');
  }

  return { user: data ?? null, isLoading, login, register, logout, mutate };
}
