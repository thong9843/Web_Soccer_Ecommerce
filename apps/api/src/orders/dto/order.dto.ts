import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAYMENT_METHODS, type PaymentMethod } from '@football/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  transformPhone,
  VN_PHONE_MESSAGE,
  VN_PHONE_REGEX,
} from '../../common/validators.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ShippingDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Họ tên người nhận quá ngắn' })
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: '0901234567' })
  @Transform(transformPhone)
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone!: string;

  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập Tỉnh/Thành phố' })
  @MaxLength(100)
  province!: string;

  @ApiProperty({ example: 'Quận 1' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập Quận/Huyện' })
  @MaxLength(100)
  district!: string;

  @ApiProperty({ example: 'Phường Bến Nghé' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập Phường/Xã' })
  @MaxLength(100)
  ward!: string;

  @ApiProperty({ example: '12 Lê Lợi' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập địa chỉ' })
  @MaxLength(200)
  street!: string;
}

export class CreateOrderDto {
  @ApiProperty({ type: ShippingDto })
  @IsDefined({ message: 'Vui lòng nhập thông tin giao hàng' })
  @ValidateNested()
  @Type(() => ShippingDto)
  shipping!: ShippingDto;

  @ApiPropertyOptional({
    description: 'Email nhận thông tin đơn (khách vãng lai)',
  })
  @IsOptional()
  @Transform(trim)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({ enum: PAYMENT_METHODS, default: 'COD' })
  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  paymentMethod?: PaymentMethod;
}

export class LookupOrderQueryDto {
  @ApiProperty({ example: 'FG-20261011-AB12CD' })
  @Transform(trim)
  @IsString()
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: '0901234567' })
  @Transform(transformPhone)
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone!: string;
}

export class ListOrdersQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 10, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number;
}
