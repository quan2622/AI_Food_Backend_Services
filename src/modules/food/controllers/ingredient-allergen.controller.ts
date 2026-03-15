import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { IngredientAllergenService } from '../services/ingredient-allergen.service';
import { CreateIngredientAllergenDto } from '../dto/ingredient-allergen/create-ingredient-allergen.dto.js';

@Controller('ingredient-allergens')
export class IngredientAllergenController {
  constructor(private readonly ingredientAllergenService: IngredientAllergenService) {}

  @Post()
  create(@Body() dto: CreateIngredientAllergenDto) {
    return this.ingredientAllergenService.create(dto);
  }

  @Get('ingredient/:ingredientId')
  findByIngredient(@Param('ingredientId', ParseIntPipe) ingredientId: number) {
    return this.ingredientAllergenService.findByIngredient(ingredientId);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientAllergenService.remove(id);
  }

  @Delete('ingredient/:ingredientId/allergen/:allergenId')
  removeByCompositeKey(
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
    @Param('allergenId', ParseIntPipe) allergenId: number,
  ) {
    return this.ingredientAllergenService.removeByCompositeKey(ingredientId, allergenId);
  }
}
