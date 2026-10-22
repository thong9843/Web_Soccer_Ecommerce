'use client';

import useSWR from 'swr';
import type { CartDto } from '@football/shared';
import { api } from '@/lib/api-client';

export function useCart() {
  const { data, isLoading, mutate } = useSWR<CartDto>('/cart');

  async function add(variantId: string, qty = 1) {
    const cart = await api<CartDto>('/cart/items', {
      method: 'POST',
      body: { variantId, qty },
    });
    await mutate(cart, { revalidate: false });
    return cart;
  }

  async function setQty(itemId: string, qty: number) {
    const cart = await api<CartDto>(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: { qty },
    });
    await mutate(cart, { revalidate: false });
    return cart;
  }

  async function remove(itemId: string) {
    const cart = await api<CartDto>(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    await mutate(cart, { revalidate: false });
    return cart;
  }

  return { cart: data, isLoading, add, setQty, remove, refresh: mutate };
}
