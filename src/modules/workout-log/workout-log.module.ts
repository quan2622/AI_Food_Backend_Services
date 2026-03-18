import { Module } from '@nestjs/common';
import { WorkoutLogController } from './workout-log.controller';
import { WorkoutLogService } from './workout-log.service';

import { PrismaModule } from '../../prisma/prisma.module'; // Import it here

@Module({
  imports: [PrismaModule],
  controllers: [WorkoutLogController],
  providers: [WorkoutLogService]
})
export class WorkoutLogModule {}
