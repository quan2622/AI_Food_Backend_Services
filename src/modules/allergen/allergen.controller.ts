import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { AllergenService } from './allergen.service';
import { CreateAllergenDto } from './dto/create-allergen.dto.js';
import { UpdateAllergenDto } from './dto/update-allergen.dto.js';

@Controller('allergens')
export class AllergenController {
  constructor(private readonly allergenService: AllergenService) {}

  @Post()
  create(@Body() dto: CreateAllergenDto) {
    return this.allergenService.create(dto);
  }

  @Get()
  findAll() {
    return this.allergenService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.allergenService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAllergenDto,
  ) {
    return this.allergenService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.allergenService.remove(id);
  }
}
