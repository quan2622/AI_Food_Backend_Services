import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FoodService } from '../services/food.service.js';
import { CreateFoodDto } from '../dto/create-food.dto.js';
import { UpdateFoodDto } from '../dto/update-food.dto.js';
import { BulkDeleteFoodDto } from '../dto/bulk-delete-food.dto.js';
import { BulkCreateFoodDto } from '../dto/bulk-create-food.dto.js';
import { AdminGuard } from '../../../guards/admin.guard';

@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  // ──── Admin only ────────────────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFoodDto: CreateFoodDto) {
    return this.foodService.create(createFoodDto);
  }

  @UseGuards(AdminGuard)
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createMany(@Body() dto: BulkCreateFoodDto) {
    return this.foodService.createMany(dto.items);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFoodDto: UpdateFoodDto,
  ) {
    return this.foodService.update(id, updateFoodDto);
  }

  @UseGuards(AdminGuard)
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: BulkDeleteFoodDto) {
    return this.foodService.removeMany(dto.ids);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.remove(id);
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.foodService.findAllAdmin(page, limit, qs);
  }

  // ──── All authenticated users ────────────────────────────────────────────
  @Get()
  findAll(@Query('categoryId', ParseIntPipe) categoryId?: number) {
    if (categoryId != null) {
      return this.foodService.findByCategoryId(categoryId);
    }
    return this.foodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findOne(id);
  }
}

