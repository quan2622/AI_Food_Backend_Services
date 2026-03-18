import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { WorkoutLogService } from './workout-log.service';
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('workout-logs')
@UseGuards(JwtAuthGuard)
export class WorkoutLogController {
  constructor(private readonly workoutLogService: WorkoutLogService) {}

  @Post()
  create(@Req() req, @Body() createWorkoutLogDto: CreateWorkoutLogDto) {
    const userId = req.user.id;
    return this.workoutLogService.create(userId, createWorkoutLogDto);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const userId = req.user.id;
    return this.workoutLogService.findAll(userId, +page, +limit);
  }

  @Get('date/:date')
  findByDate(@Req() req, @Param('date') date: string) {
    const userId = req.user.id;
    return this.workoutLogService.findByDate(userId, date);
  }

  @Get(':id')
  findOne(@Req() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.workoutLogService.findOne(+id, userId);
  }

  @Patch(':id')
  update(
    @Req() req,
    @Param('id') id: string,
    @Body() updateWorkoutLogDto: UpdateWorkoutLogDto,
  ) {
    const userId = req.user.id;
    return this.workoutLogService.update(+id, userId, updateWorkoutLogDto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    const userId = req.user.id;
    return this.workoutLogService.remove(+id, userId);
  }
}
