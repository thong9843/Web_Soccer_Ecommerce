import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AddressDto, AuthUser } from '@football/shared';
import { toAuthUser } from '../auth/auth.service.js';
import type { Address } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from './dto/users.dto.js';

export const MAX_ADDRESSES = 10;

function toAddressDto(a: Address): AddressDto {
  return {
    id: a.id,
    receiverName: a.receiverName,
    phone: a.phone,
    province: a.province,
    district: a.district,
    ward: a.ward,
    street: a.street,
    isDefault: a.isDefault,
  };
}

/** Hồ sơ và sổ địa chỉ của chính người dùng. Mọi truy vấn đều giới hạn theo userId. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName, phone: dto.phone },
    });
    return toAuthUser(user);
  }

  async listAddresses(userId: string): Promise<AddressDto[]> {
    const rows = await this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
    return rows.map(toAddressDto);
  }

  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressDto> {
    const created = await this.prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      if (count >= MAX_ADDRESSES) {
        throw new BadRequestException(`Tối đa ${MAX_ADDRESSES} địa chỉ`);
      }
      // Địa chỉ đầu tiên luôn là mặc định.
      const isDefault = count === 0 || dto.isDefault === true;
      if (isDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId,
          receiverName: dto.receiverName,
          phone: dto.phone,
          province: dto.province,
          district: dto.district,
          ward: dto.ward,
          street: dto.street,
          isDefault,
        },
      });
    });
    return toAddressDto(created);
  }

  async updateAddress(
    userId: string,
    id: string,
    dto: UpdateAddressDto,
  ): Promise<AddressDto> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ');

      if (dto.isDefault === true) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      // Không cho bỏ mặc định trực tiếp; phải chọn địa chỉ khác làm mặc định.
      const { isDefault, ...fields } = dto;
      return tx.address.update({
        where: { id },
        data: { ...fields, ...(isDefault === true ? { isDefault: true } : {}) },
      });
    });
    return toAddressDto(updated);
  }

  async deleteAddress(userId: string, id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const existing = await tx.address.findFirst({ where: { id, userId } });
      if (!existing) throw new NotFoundException('Không tìm thấy địa chỉ');
      await tx.address.delete({ where: { id } });

      // Xóa địa chỉ mặc định thì chuyển mặc định sang địa chỉ còn lại đầu tiên.
      if (existing.isDefault) {
        const next = await tx.address.findFirst({
          where: { userId },
          orderBy: { id: 'asc' },
        });
        if (next) {
          await tx.address.update({
            where: { id: next.id },
            data: { isDefault: true },
          });
        }
      }
    });
  }
}
