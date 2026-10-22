import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
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

const trimLower = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterDto {
  @ApiProperty({ example: 'nguyenvana@example.com' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'MatKhau123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(72, { message: 'Mật khẩu tối đa 72 ký tự' })
  @Matches(/[A-Za-z]/, { message: 'Mật khẩu phải có ít nhất 1 chữ cái' })
  @Matches(/\d/, { message: 'Mật khẩu phải có ít nhất 1 chữ số' })
  password!: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @Transform(trim)
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  @MaxLength(100)
  fullName!: string;

  @ApiPropertyOptional({ example: '0901234567' })
  @IsOptional()
  @Transform(transformPhone)
  @Matches(VN_PHONE_REGEX, { message: VN_PHONE_MESSAGE })
  phone?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'nguyenvana@example.com' })
  @Transform(trimLower)
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(72)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(20)
  @MaxLength(200)
  refreshToken!: string;
}
