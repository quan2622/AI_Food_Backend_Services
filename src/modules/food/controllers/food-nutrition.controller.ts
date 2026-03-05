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
import { FoodNutritionService } from '../services/food-nutrition.service.js';
import { CreateNutritionComponentDto } from '../dto/food-nutrition/create-nutrition-component.dto.js';
import { CreateFoodNutritionDto } from '../dto/food-nutrition/create-food-nutrition.dto.js';
import { UpdateFoodNutritionDto } from '../dto/food-nutrition/update-food-nutrition.dto.js';
import { UpsertNutritionValueDto } from '../dto/food-nutrition/upsert-nutrition-value.dto.js';
import { AdminGuard } from '../../../guards/admin.guard';

@Controller()
export class FoodNutritionController {
  constructor(private readonly foodNutritionService: FoodNutritionService) {}

  // NutritionComponent
  @Get('nutrition-components')
  findAllComponents() {
    return this.foodNutritionService.findAllComponents();
  }

  @UseGuards(AdminGuard)
  @Post('nutrition-components')
  createComponent(@Body() dto: CreateNutritionComponentDto) {
    return this.foodNutritionService.createComponent(dto);
  }

  @UseGuards(AdminGuard)
  @Patch('nutrition-components/:id')
  updateComponent(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateNutritionComponentDto,
  ) {
    return this.foodNutritionService.updateComponent(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('nutrition-components/:id')
  removeComponent(@Param('id', ParseIntPipe) id: number) {
    return this.foodNutritionService.removeComponent(id);
  }

  // FoodNutrition
  @Get('foods/:foodId/nutritions')
  findByFoodId(@Param('foodId', ParseIntPipe) foodId: number) {
    return this.foodNutritionService.findByFoodId(foodId);
  }

  @Post('foods/:foodId/nutritions')
  createNutrition(
    @Param('foodId', ParseIntPipe) foodId: number,
    @Body() dto: CreateFoodNutritionDto,
  ) {
    return this.foodNutritionService.createNutrition(foodId, dto);
  }

  @Get('foods/:foodId/nutritions/:id')
  findOneNutrition(@Param('id', ParseIntPipe) id: number) {
    return this.foodNutritionService.findOneNutrition(id);
  }

  @Patch('foods/:foodId/nutritions/:id')
  updateNutrition(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFoodNutritionDto,
  ) {
    return this.foodNutritionService.updateNutrition(id, dto);
  }

  @Delete('foods/:foodId/nutritions/:id')
  removeNutrition(@Param('id', ParseIntPipe) id: number) {
    return this.foodNutritionService.removeNutrition(id);
  }

  @Post('foods/:foodId/nutritions/:id/values')
  upsertValues(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertNutritionValueDto,
  ) {
    return this.foodNutritionService.upsertValues(id, dto);
  }

  @Post('foods/:foodId/nutritions/calculate')
  calculateFromIngredients(@Param('foodId', ParseIntPipe) foodId: number) {
    return this.foodNutritionService.calculateFromIngredients(foodId);
  }
}

