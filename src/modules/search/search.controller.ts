import {
  Controller,
  Get,
  Post,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { SearchService } from './search.service';

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

  // ─── Admin: Reindex ──────────────────────────────────────────────────────

  /** Reindex toàn bộ foods vào Elasticsearch */
  @Post('admin/reindex/foods')
  reindexFoods() {
    return this.searchService.reindexAllFoods();
  }

  /** Reindex toàn bộ ingredients vào Elasticsearch */
  @Post('admin/reindex/ingredients')
  reindexIngredients() {
    return this.searchService.reindexAllIngredients();
  }
}
