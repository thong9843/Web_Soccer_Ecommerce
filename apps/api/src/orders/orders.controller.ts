import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { OrderDto, Paginated } from '@football/shared';
import type { AuthenticatedUser } from '../common/auth.types.js';
import { CurrentUser, Public } from '../common/decorators.js';
import {
  CreateOrderDto,
  ListOrdersQueryDto,
  LookupOrderQueryDto,
} from './dto/order.dto.js';
import { OrdersService } from './orders.service.js';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  @ApiHeader({ name: 'x-cart-token', required: false })
  @ApiOperation({
    summary:
      'Đặt hàng từ giỏ hiện tại (khách vãng lai hoặc user). Bắt buộc có thông tin giao hàng.',
  })
  create(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() dto: CreateOrderDto,
    @Headers('x-cart-token') token?: string,
  ): Promise<OrderDto> {
    return this.orders.create(user, token, dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Get('lookup')
  @ApiOperation({
    summary: 'Khách vãng lai tra cứu đơn bằng mã đơn + số điện thoại',
  })
  lookup(@Query() query: LookupOrderQueryDto): Promise<OrderDto> {
    return this.orders.lookup(query.code, query.phone);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Lịch sử đơn hàng của tôi' })
  mine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOrdersQueryDto,
  ): Promise<Paginated<OrderDto>> {
    return this.orders.listMine(user, query.page, query.pageSize);
  }

  @ApiBearerAuth()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết đơn (chủ đơn, Manager hoặc Admin)' })
  one(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderDto> {
    return this.orders.getOne(user, id);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post(':id/cancel')
  @ApiOperation({ summary: 'Hủy đơn đang chờ xác nhận (chủ đơn)' })
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderDto> {
    return this.orders.cancel(user, id);
  }
}
