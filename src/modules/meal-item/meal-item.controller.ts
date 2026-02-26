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
} from '@nestjs/common';
import { MealItemService } from './meal-item.service';
import { CreateMealItemDto } from './dto/create-meal-item.dto.js';
import { UpdateMealItemDto } from './dto/update-meal-item.dto.js';
import { User } from 'src/common/decorators';

@Controller('meal-items')
export class MealItemController {
  constructor(private readonly mealItemService: MealItemService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@User() user: { id: number }, @Body() dto: CreateMealItemDto) {
    return this.mealItemService.create(user.id, dto);
  }

  @Get('meal/:mealId')
  findAllByMealId(@Param('mealId', ParseIntPipe) mealId: number) {
    return this.mealItemService.findAllByMealId(mealId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mealItemService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @User() user: { id: number },
    @Body() dto: UpdateMealItemDto,
  ) {
    return this.mealItemService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.mealItemService.remove(id, user.id);
  }
}
