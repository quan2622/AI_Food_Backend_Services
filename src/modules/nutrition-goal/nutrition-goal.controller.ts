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
import { NutritionGoalService } from './nutrition-goal.service';
import { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto.js';
import { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto.js';
import { User } from 'src/common/decorators';

@Controller('nutrition-goals')
export class NutritionGoalController {
  constructor(private readonly nutritionGoalService: NutritionGoalService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @User() user: { id: number },
    @Body() createNutritionGoalDto: CreateNutritionGoalDto,
  ) {
    return this.nutritionGoalService.create(user.id, createNutritionGoalDto);
  }

  @Get('all')
  findAll() {
    return this.nutritionGoalService.findAll();
  }

  @Get()
  findMyGoals(@User() user: { id: number }) {
    return this.nutritionGoalService.findAllByUserId(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nutritionGoalService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @User() user: { id: number },
    @Body() updateNutritionGoalDto: UpdateNutritionGoalDto,
  ) {
    return this.nutritionGoalService.update(
      id,
      user.id,
      updateNutritionGoalDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.nutritionGoalService.remove(id, user.id);
  }
}
