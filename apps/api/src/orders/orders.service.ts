import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { OrderDto, Paginated } from '@football/shared';
import { randomInt } from 'node:crypto';
import { CartService } from '../cart/cart.service.js';
import type { AuthenticatedUser } from '../common/auth.types.js';
import { normalizePhone } from '../common/validators.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/order.dto.js';
import { calculateTotals } from './pricing.js';

const orderInclude = {
  items: { orderBy: { id: 'asc' }, include: { variant: true } },
} satisfies Prisma.OrderInclude;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Mã đơn dễ đọc cho khách, ví dụ FG-20261011-AB12CD. */
export function generateOrderCode(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = Array.from(
    { length: 6 },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join('');
  return `FG-${date}-${suffix}`;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cart: CartService,
  ) {}

  /** Đặt hàng từ giỏ hiện tại. Giá và tồn kho luôn được kiểm tra lại trong transaction. */
  async create(
    user: AuthenticatedUser | undefined,
    token: string | undefined,
    dto: CreateOrderDto,
  ): Promise<OrderDto> {
    const cartId = await this.cart.resolveCartId(user, token, false);
    if (!cartId) throw new BadRequestException('Giỏ hàng trống');

    const order = await this.prisma.$transaction(async (tx) => {
      const items = await tx.cartItem.findMany({
        where: { cartId },
        orderBy: { id: 'asc' },
      });
      if (items.length === 0) throw new BadRequestException('Giỏ hàng trống');

      const lines: Array<{
        variantId: string;
        productName: string;
        unitPrice: number;
        qty: number;
      }> = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: { select: { name: true, isActive: true } } },
        });
        if (!variant || !variant.isActive || !variant.product.isActive) {
          throw new BadRequestException(
            'Có sản phẩm trong giỏ không còn được bán, vui lòng kiểm tra lại giỏ hàng',
          );
        }
        // Trừ kho có điều kiện: hai đơn cùng mua món cuối cùng thì chỉ một đơn thắng.
        const updated = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.qty } },
          data: { stock: { decrement: item.qty } },
        });
        if (updated.count === 0) {
          throw new BadRequestException(
            `"${variant.product.name}" (size ${variant.size}, ${variant.color}) không đủ hàng`,
          );
        }
        lines.push({
          variantId: variant.id,
          productName: variant.product.name,
          unitPrice: variant.price,
          qty: item.qty,
        });
      }

      const totals = calculateTotals(lines);
      const phone = normalizePhone(dto.shipping.phone);
      const created = await tx.order.create({
        data: {
          code: generateOrderCode(),
          userId: user?.id ?? null,
          guestName: user ? null : dto.shipping.name,
          guestPhone: user ? null : phone,
          guestEmail: dto.email ?? null,
          shipName: dto.shipping.name,
          shipPhone: phone,
          shipProvince: dto.shipping.province,
          shipDistrict: dto.shipping.district,
          shipWard: dto.shipping.ward,
          shipStreet: dto.shipping.street,
          paymentMethod: dto.paymentMethod ?? 'COD',
          note: dto.note || null,
          ...totals,
          items: {
            create: lines.map((l) => ({
              variantId: l.variantId,
              productName: l.productName,
              qty: l.qty,
              unitPrice: l.unitPrice,
            })),
          },
        },
        include: orderInclude,
      });
      await tx.cartItem.deleteMany({ where: { cartId } });
      return created;
    });

    return this.toDto(order);
  }

  async listMine(
    user: AuthenticatedUser,
    page = 1,
    pageSize = 10,
  ): Promise<Paginated<OrderDto>> {
    const where = { userId: user.id };
    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: orderInclude,
      }),
    ]);
    return {
      items: orders.map((o) => this.toDto(o)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** User chỉ xem đơn của mình; Manager/Admin xem mọi đơn. Đơn của người khác trả 404 để không lộ sự tồn tại. */
  async getOne(user: AuthenticatedUser, id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
    const isStaff = user.role === 'MANAGER' || user.role === 'ADMIN';
    if (!order || (!isStaff && order.userId !== user.id)) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return this.toDto(order);
  }

  /** Khách vãng lai tra cứu bằng mã đơn + số điện thoại đặt hàng. */
  async lookup(code: string, phone: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({
      where: { code: code.toUpperCase() },
      include: orderInclude,
    });
    if (!order || order.shipPhone !== normalizePhone(phone)) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    return this.toDto(order);
  }

  /** Chủ đơn chỉ hủy được khi đơn còn PENDING; hoàn lại tồn kho. */
  async cancel(user: AuthenticatedUser, id: string): Promise<OrderDto> {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Chỉ hủy được đơn đang chờ xác nhận');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // Chuyển trạng thái có điều kiện để tránh hoàn kho hai lần khi bấm đúp.
      const changed = await tx.order.updateMany({
        where: { id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });
      if (changed.count === 0) {
        throw new BadRequestException('Chỉ hủy được đơn đang chờ xác nhận');
      }
      const items = await tx.orderItem.findMany({ where: { orderId: id } });
      for (const item of items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.qty } },
        });
      }
      return tx.order.findUniqueOrThrow({
        where: { id },
        include: orderInclude,
      });
    });
    return this.toDto(updated);
  }

  private toDto(order: OrderWithItems): OrderDto {
    return {
      id: order.id,
      code: order.code,
      status: order.status,
      paymentMethod: order.paymentMethod,
      subtotal: order.subtotal,
      shippingFee: order.shippingFee,
      total: order.total,
      note: order.note,
      createdAt: order.createdAt.toISOString(),
      guestEmail: order.guestEmail,
      shipping: {
        name: order.shipName,
        phone: order.shipPhone,
        province: order.shipProvince,
        district: order.shipDistrict,
        ward: order.shipWard,
        street: order.shipStreet,
      },
      items: order.items.map((i) => ({
        id: i.id,
        productName: i.productName,
        size: i.variant.size,
        color: i.variant.color,
        qty: i.qty,
        unitPrice: i.unitPrice,
        lineTotal: i.unitPrice * i.qty,
        customName: i.customName,
        customNumber: i.customNumber,
      })),
    };
  }
}
