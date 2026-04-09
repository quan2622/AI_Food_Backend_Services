import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
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
  @UseGuards(AdminGuard)
  @Get('nutrition-components/admin')
  findAllComponentsAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.foodNutritionService.findAllComponentsAdmin(page, limit, qs);
  }

  @Get('nutrition-components')
  findAllComponents() {
    return this.foodNutritionService.findAllComponents();
  }

  @Get('nutrition-components/paginate')
  findAllComponentsPaginate(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.foodNutritionService.findAllComponentsPaginate(page, limit, qs);
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

  // IngredientNutrition (per Ingredient)
  @Get('ingredients/:ingredientId/nutritions')
  findByIngredientId(@Param('ingredientId', ParseIntPipe) ingredientId: number) {
    return this.foodNutritionService.findByIngredientId(ingredientId);
  }

  @Post('ingredients/:ingredientId/nutritions')
  createNutrition(
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
    @Body() dto: CreateFoodNutritionDto,
  ) {
    return this.foodNutritionService.createNutrition(ingredientId, dto);
  }

  // Nutritions for all ingredients in a food (aggregated view)
  @Get('foods/:foodId/nutritions')
  getNutritionForFood(@Param('foodId', ParseIntPipe) foodId: number) {
    return this.foodNutritionService.getNutritionForFoodIngredients(foodId);
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

}

