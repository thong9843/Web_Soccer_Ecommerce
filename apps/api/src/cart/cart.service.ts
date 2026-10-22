import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CartDto } from '@football/shared';
import { randomBytes } from 'node:crypto';
import type { AuthenticatedUser } from '../common/auth.types.js';
import { Prisma } from '../generated/prisma/client.js';
import { calculateTotals, MAX_QTY_PER_LINE } from '../orders/pricing.js';
import { PrismaService } from '../prisma/prisma.service.js';

const cartInclude = {
  items: {
    orderBy: { id: 'asc' },
    include: {
      variant: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              isActive: true,
              images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.CartInclude;

type CartWithItems = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tìm giỏ của người gọi: user đã đăng nhập → giỏ theo userId (gộp giỏ guest nếu có token);
   * guest → giỏ theo token. `create` = tạo mới nếu chưa có.
   */
  async resolveCartId(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
    create: boolean,
  ): Promise<string | null> {
    if (user) {
      let cart = await this.prisma.cart.findFirst({
        where: { userId: user.id },
      });
      if (!cart && (create || token)) {
        cart = await this.prisma.cart.create({ data: { userId: user.id } });
      }
      if (cart && token) await this.mergeGuestCart(cart.id, token);
      return cart?.id ?? null;
    }

    if (token) {
      const cart = await this.prisma.cart.findFirst({
        where: { token, userId: null },
      });
      if (cart) return cart.id;
    }
    if (!create) return null;
    const cart = await this.prisma.cart.create({
      data: { token: randomBytes(24).toString('base64url') },
    });
    return cart.id;
  }

  async getCart(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
  ) {
    const cartId = await this.resolveCartId(user, token, false);
    return this.toDto(cartId ? await this.load(cartId) : null);
  }

  async addItem(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
    variantId: string,
    qty: number,
  ): Promise<CartDto> {
    const variant = await this.requireSellableVariant(variantId);
    const cartId = (await this.resolveCartId(user, token, true))!;

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId, variantId } },
    });
    const newQty = (existing?.qty ?? 0) + qty;
    this.assertQty(newQty, variant.stock);

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId, variantId } },
      update: { qty: newQty },
      create: { cartId, variantId, qty },
    });
    return this.toDto(await this.load(cartId));
  }

  async updateItem(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
    itemId: string,
    qty: number,
  ): Promise<CartDto> {
    const { cartId, item } = await this.requireOwnItem(user, token, itemId);
    const variant = await this.requireSellableVariant(item.variantId);
    this.assertQty(qty, variant.stock);
    await this.prisma.cartItem.update({ where: { id: itemId }, data: { qty } });
    return this.toDto(await this.load(cartId));
  }

  async removeItem(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
    itemId: string,
  ): Promise<CartDto> {
    const { cartId } = await this.requireOwnItem(user, token, itemId);
    await this.prisma.cartItem.delete({ where: { id: itemId } });
    return this.toDto(await this.load(cartId));
  }

  async clear(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  private async requireOwnItem(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
    itemId: string,
  ) {
    const cartId = await this.resolveCartId(user, token, false);
    const item = cartId
      ? await this.prisma.cartItem.findFirst({ where: { id: itemId, cartId } })
      : null;
    if (!cartId || !item)
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    return { cartId, item };
  }

  private async requireSellableVariant(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { isActive: true } } },
    });
    if (!variant || !variant.isActive || !variant.product.isActive) {
      throw new NotFoundException('Sản phẩm không còn được bán');
    }
    return variant;
  }

  private assertQty(qty: number, stock: number) {
    if (stock <= 0) throw new BadRequestException('Sản phẩm đã hết hàng');
    if (qty > stock) {
      throw new BadRequestException(`Chỉ còn ${stock} sản phẩm trong kho`);
    }
    if (qty > MAX_QTY_PER_LINE) {
      throw new BadRequestException(
        `Tối đa ${MAX_QTY_PER_LINE} sản phẩm mỗi mặt hàng`,
      );
    }
  }

  /** Gộp giỏ khách vào giỏ user khi đăng nhập; số lượng bị chặn bởi tồn kho. */
  private async mergeGuestCart(userCartId: string, token: string) {
    const guest = await this.prisma.cart.findFirst({
      where: { token, userId: null },
      include: { items: { include: { variant: true } } },
    });
    if (!guest) return;
    await this.prisma.$transaction(async (tx) => {
      for (const item of guest.items) {
        if (!item.variant.isActive || item.variant.stock <= 0) continue;
        const existing = await tx.cartItem.findUnique({
          where: {
            cartId_variantId: { cartId: userCartId, variantId: item.variantId },
          },
        });
        const qty = Math.min(
          (existing?.qty ?? 0) + item.qty,
          item.variant.stock,
          MAX_QTY_PER_LINE,
        );
        await tx.cartItem.upsert({
          where: {
            cartId_variantId: { cartId: userCartId, variantId: item.variantId },
          },
          update: { qty },
          create: { cartId: userCartId, variantId: item.variantId, qty },
        });
      }
      await tx.cart.delete({ where: { id: guest.id } });
    });
  }

  private load(cartId: string) {
    return this.prisma.cart.findUniqueOrThrow({
      where: { id: cartId },
      include: cartInclude,
    });
  }

  private toDto(cart: CartWithItems | null): CartDto {
    if (!cart) {
      return {
        id: null,
        token: null,
        items: [],
        itemCount: 0,
        subtotal: 0,
        shippingFee: 0,
        total: 0,
      };
    }
    // Biến thể/sản phẩm đã bị ẩn không còn tính vào giỏ.
    const live = cart.items.filter(
      (i) => i.variant.isActive && i.variant.product.isActive,
    );
    const lines = live.map((i) => ({ unitPrice: i.variant.price, qty: i.qty }));
    const totals = calculateTotals(lines);
    return {
      id: cart.id,
      token: cart.userId ? null : cart.token,
      items: live.map((i) => ({
        id: i.id,
        variantId: i.variantId,
        productName: i.variant.product.name,
        productSlug: i.variant.product.slug,
        imageUrl: i.variant.product.images[0]?.url ?? null,
        size: i.variant.size,
        color: i.variant.color,
        studType: i.variant.studType,
        unitPrice: i.variant.price,
        qty: i.qty,
        lineTotal: i.variant.price * i.qty,
        stock: i.variant.stock,
      })),
      itemCount: live.reduce((n, i) => n + i.qty, 0),
      ...totals,
    };
  }
}
