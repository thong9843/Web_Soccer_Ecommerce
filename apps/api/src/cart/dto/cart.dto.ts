import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';
import { MAX_QTY_PER_LINE } from '../../orders/pricing.js';

export class AddCartItemDto {
  @ApiProperty()
  @IsUUID()
  variantId!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_QTY_PER_LINE })
  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_LINE)
  qty!: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ minimum: 1, maximum: MAX_QTY_PER_LINE })
  @IsInt()
  @Min(1)
  @Max(MAX_QTY_PER_LINE)
  qty!: number;
}
