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
import { MealService } from './meal.service';
import { CreateMealDto } from './dto/create-meal.dto.js';
import { UpdateMealDto } from './dto/update-meal.dto.js';
import { User } from 'src/common/decorators';
import { AdminGuard } from 'src/guards/admin.guard';

@Controller('meals')
export class MealController {
  constructor(private readonly mealService: MealService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@User() user: { id: number }, @Body() dto: CreateMealDto) {
    return this.mealService.create(user.id, dto);
  }

  @Get('daily-log/:dailyLogId')
  findByDailyLog(
    @Param('dailyLogId', ParseIntPipe) dailyLogId: number,
    @User() user: { id: number },
  ) {
    return this.mealService.findAllByDailyLogId(dailyLogId, user.id);
  }

  @UseGuards(AdminGuard)
  @Get('all')
  findAll() {
    return this.mealService.findAll();
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.mealService.findAllAdmin(page, limit, qs);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mealService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @User() user: { id: number },
    @Body() dto: UpdateMealDto,
  ) {
    return this.mealService.update(id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.mealService.remove(id, user.id);
  }
}
