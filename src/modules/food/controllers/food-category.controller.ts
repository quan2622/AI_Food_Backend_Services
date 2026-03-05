import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FoodCategoryService } from '../services/food-category.service.js';
import { CreateFoodCategoryDto } from '../dto/food/create-food-category.dto.js';
import { UpdateFoodCategoryDto } from '../dto/food/update-food-category.dto.js';
import { AdminGuard } from '../../../guards/admin.guard';

@Controller('food-categories')
export class FoodCategoryController {
  constructor(private readonly foodCategoryService: FoodCategoryService) {}

  @Get()
  findAll() {
    return this.foodCategoryService.findAll();
  }

  @Get('roots')
  findRoots() {
    return this.foodCategoryService.findRoots();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodCategoryService.findOne(id);
  }

  @Get(':id/children')
  findChildren(@Param('id', ParseIntPipe) id: number) {
    return this.foodCategoryService.findChildren(id);
  }

  @UseGuards(AdminGuard)
  @Post()
  create(@Body() dto: CreateFoodCategoryDto) {
    return this.foodCategoryService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFoodCategoryDto,
  ) {
    return this.foodCategoryService.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodCategoryService.remove(id);
  }
}

