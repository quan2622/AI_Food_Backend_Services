import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IngredientAllergenService } from '../services/ingredient-allergen.service';
import { CreateIngredientAllergenDto } from '../dto/ingredient-allergen/create-ingredient-allergen.dto.js';
import { AdminGuard } from '../../../guards/admin.guard';

@Controller('ingredient-allergens')
export class IngredientAllergenController {
  constructor(private readonly ingredientAllergenService: IngredientAllergenService) {}

  @Post()
  create(@Body() dto: CreateIngredientAllergenDto) {
    return this.ingredientAllergenService.create(dto);
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.ingredientAllergenService.findAllAdmin(page, limit, qs);
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
