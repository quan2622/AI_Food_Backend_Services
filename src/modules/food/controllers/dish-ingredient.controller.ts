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
import { FoodIngredientService } from '../services/food-ingredient.service.js';
import { CreateDishIngredientDto } from '../dto/dish-ingredient/create-dish-ingredient.dto.js';
import { UpdateDishIngredientDto } from '../dto/dish-ingredient/update-dish-ingredient.dto.js';
import { AdminGuard } from '../../../guards/admin.guard';

@Controller('foods/:dishId/ingredients')
export class DishIngredientController {
  constructor(private readonly dishIngredientService: FoodIngredientService) {}

  @Get()
  findByDish(@Param('dishId', ParseIntPipe) dishId: number) {
    return this.dishIngredientService.findByDish(dishId);
  }

  @UseGuards(AdminGuard)
  @Post()
  addIngredient(
    @Param('dishId', ParseIntPipe) dishId: number,
    @Body() dto: CreateDishIngredientDto,
  ) {
    return this.dishIngredientService.addIngredient(dishId, dto);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDishIngredientDto,
  ) {
    return this.dishIngredientService.updateIngredient(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  removeIngredient(@Param('id', ParseIntPipe) id: number) {
    return this.dishIngredientService.removeIngredient(id);
  }
}

