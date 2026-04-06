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
  UseGuards,
  Query,
} from '@nestjs/common';
import { NutritionGoalService } from './nutrition-goal.service';
import { CreateNutritionGoalDto } from './dto/create-nutrition-goal.dto.js';
import { UpdateNutritionGoalDto } from './dto/update-nutrition-goal.dto.js';
import { User } from 'src/common/decorators';
import { AdminGuard } from '@/guards/admin.guard';
import { BulkDeleteNutritionGoalDto } from './dto/bulk-delete-nutrition-goal.dto.js';

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

  @UseGuards(AdminGuard)
  @Get('all')
  findAll() {
    return this.nutritionGoalService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.nutritionGoalService.findAllAdmin(page, limit, qs);
  }

  @Get()
  findMyGoals(@User() user: { id: number }) {
    return this.nutritionGoalService.findAllByUserId(user.id);
  }

  @Get('my-goals')
  findMyGoalsWithHistory(@User() user: { id: number }) {
    return this.nutritionGoalService.findMyGoalsWithHistory(user.id);
  }

  @Get('current')
  getCurrentGoal(@User() user: { id: number }) {
    return this.nutritionGoalService.findCurrentGoal(user.id);
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

  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  removeMany(
    @User() user: { id: number },
    @Body() dto: BulkDeleteNutritionGoalDto,
  ) {
    return this.nutritionGoalService.removeMany(dto.ids, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.nutritionGoalService.remove(id, user.id);
  }
}
