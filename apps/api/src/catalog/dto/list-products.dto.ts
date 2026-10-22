import { ApiPropertyOptional } from '@nestjs/swagger';
import { PRODUCT_SORTS, type ProductSort } from '@football/shared';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const csv = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
    : value;

export class FacetsQueryDto {
  @ApiPropertyOptional({
    description: 'Đường dẫn danh mục, vd `giay` hoặc `giay/co-nhan-tao`',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  category?: string;
}

export class ListProductsQueryDto extends FacetsQueryDto {
  @ApiPropertyOptional({
    description: 'Slug thương hiệu, nhiều giá trị cách nhau bởi dấu phẩy',
  })
  @IsOptional()
  @Transform(csv)
  @IsString({ each: true })
  brand?: string[];

  @ApiPropertyOptional({
    description: 'Size, nhiều giá trị cách nhau bởi dấu phẩy',
    example: '41,42',
  })
  @IsOptional()
  @Transform(csv)
  @IsString({ each: true })
  size?: string[];

  @ApiPropertyOptional({ description: 'Giá tối thiểu (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá tối đa (VND)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo tên sản phẩm/thương hiệu',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ enum: PRODUCT_SORTS, default: 'newest' })
  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 48 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(48)
  pageSize?: number;
}
