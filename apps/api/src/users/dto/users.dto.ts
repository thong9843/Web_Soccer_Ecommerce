import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  transformPhone,
  VN_PHONE_MESSAGE,
  VN_PHONE_REGEX,
} from '../../common/validators.js';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @Transform(transformPhone)
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone?: string;
}

export class CreateAddressDto {
  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Họ tên người nhận quá ngắn' })
  @MaxLength(100)
  receiverName!: string;

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

  @ApiPropertyOptional({ description: 'Đặt làm địa chỉ mặc định' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Họ tên người nhận quá ngắn' })
  @MaxLength(100)
  receiverName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(transformPhone)
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ward?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
