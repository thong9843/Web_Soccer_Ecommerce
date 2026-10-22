import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CartDto } from '@football/shared';
import type { AuthenticatedUser } from '../common/auth.types.js';
import { CurrentUser, Public } from '../common/decorators.js';
import { CartService } from './cart.service.js';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto.js';

/** Giỏ hàng dùng được cả khi chưa đăng nhập: guest gửi `x-cart-token` nhận được ở lần thêm đầu tiên. */
@ApiTags('cart')
@Public()
@ApiHeader({
  name: 'x-cart-token',
  required: false,
  description: 'Token giỏ hàng của khách',
})
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Xem giỏ hàng hiện tại' })
  get(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Headers('x-cart-token') token?: string,
  ): Promise<CartDto> {
    return this.cart.getCart(user, token);
  }

  @Post('items')
  @ApiOperation({ summary: 'Thêm sản phẩm (biến thể) vào giỏ' })
  add(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() dto: AddCartItemDto,
    @Headers('x-cart-token') token?: string,
  ): Promise<CartDto> {
    return this.cart.addItem(user, token, dto.variantId, dto.qty);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Đổi số lượng một dòng trong giỏ' })
  update(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-cart-token') token?: string,
  ): Promise<CartDto> {
    return this.cart.updateItem(user, token, id, dto.qty);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Xóa một dòng khỏi giỏ' })
  remove(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-cart-token') token?: string,
  ): Promise<CartDto> {
    return this.cart.removeItem(user, token, id);
  }
}
