import {
  Controller,
  Get,
  Post,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { Public } from '../../common/decorators';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Tìm kiếm món ăn */
  @Get('foods')
  searchFoods(
    @Query('q') q: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ) {
    return this.searchService.searchFoods(q ?? '', size);
  }

  /** Tìm kiếm nguyên liệu */
  @Get('ingredients')
  searchIngredients(
    @Query('q') q: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ) {
    return this.searchService.searchIngredients(q ?? '', size);
  }

  /** Tìm kiếm tổng hợp cả foods + ingredients */
  @Get()
  searchAll(
    @Query('q') q: string,
    @Query('size', new DefaultValuePipe(20), ParseIntPipe) size: number,
  ) {
    return this.searchService.searchAll(q ?? '', size);
  }

  /** Kiểm tra trạng thái Elasticsearch và số lượng document đã index */
  @Get('status')
  getStatus() {
    return this.searchService.getStatus();
  }

  // ─── Admin: Reindex ──────────────────────────────────────────────────────

  /** Reindex toàn bộ foods vào Elasticsearch */
  @Public()
  @Post('admin/reindex/foods')
  reindexFoods() {
    return this.searchService.reindexAllFoods();
  }

  /** Reindex toàn bộ ingredients vào Elasticsearch */
  @Public()
  @Post('admin/reindex/ingredients')
  reindexIngredients() {
    return this.searchService.reindexAllIngredients();
  }
}
