import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FoodService } from './food.service';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';
import { BulkDeleteFoodDto } from './dto/bulk-delete-food.dto.js';
import { BulkCreateFoodDto } from './dto/bulk-create-food.dto.js';
import { AdminGuard } from 'src/guards/admin.guard';

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

  // ──── All authenticated users ────────────────────────────────────────────
  @Get()
  findAll(@Query('category') category?: string) {
    if (category) {
      return this.foodService.findByCategory(category);
    }
    return this.foodService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findOne(id);
  }
}
