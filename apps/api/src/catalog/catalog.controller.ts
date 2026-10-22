import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  BrandSummary,
  CategoryNode,
  Paginated,
  ProductDetail,
  ProductFacets,
  ProductListItem,
} from '@football/shared';
import { Public } from '../common/decorators.js';
import { CatalogService } from './catalog.service.js';
import {
  FacetsQueryDto,
  ListProductsQueryDto,
} from './dto/list-products.dto.js';

@ApiTags('catalog')
@Public()
@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Cây danh mục (menu xổ xuống)' })
  categories(): Promise<CategoryNode[]> {
    return this.catalog.getCategoryTree();
  }

  @Get('brands')
  @ApiOperation({ summary: 'Danh sách thương hiệu' })
  brands(): Promise<BrandSummary[]> {
    return this.catalog.listBrands();
  }

  @Get('products')
  @ApiOperation({ summary: 'Danh sách sản phẩm (lọc, sắp xếp, phân trang)' })
  products(
    @Query() query: ListProductsQueryDto,
  ): Promise<Paginated<ProductListItem>> {
    return this.catalog.listProducts(query);
  }

  @Get('products/facets')
  @ApiOperation({
    summary: 'Dữ liệu cho bộ lọc: thương hiệu, size, khoảng giá',
  })
  facets(@Query() query: FacetsQueryDto): Promise<ProductFacets> {
    return this.catalog.getFacets(query);
  }

  @Get('products/:slug')
  @ApiOperation({ summary: 'Chi tiết sản phẩm theo slug' })
  product(@Param('slug') slug: string): Promise<ProductDetail> {
    return this.catalog.getProductBySlug(slug);
  }
}
