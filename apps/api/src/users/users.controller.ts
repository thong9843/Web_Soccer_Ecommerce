import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AddressDto, AuthUser } from '@football/shared';
import type { AuthenticatedUser } from '../common/auth.types.js';
import { CurrentUser } from '../common/decorators.js';
import {
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
} from './dto/users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users/me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch()
  @ApiOperation({ summary: 'Cập nhật hồ sơ của tôi' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthUser> {
    return this.users.updateProfile(user.id, dto);
  }

  @Get('addresses')
  @ApiOperation({ summary: 'Sổ địa chỉ của tôi' })
  addresses(@CurrentUser() user: AuthenticatedUser): Promise<AddressDto[]> {
    return this.users.listAddresses(user.id);
  }

  @Post('addresses')
  @ApiOperation({ summary: 'Thêm địa chỉ' })
  createAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressDto> {
    return this.users.createAddress(user.id, dto);
  }

  @Patch('addresses/:id')
  @ApiOperation({ summary: 'Sửa địa chỉ' })
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressDto> {
    return this.users.updateAddress(user.id, id, dto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('addresses/:id')
  @ApiOperation({ summary: 'Xóa địa chỉ' })
  async deleteAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.users.deleteAddress(user.id, id);
  }
}
