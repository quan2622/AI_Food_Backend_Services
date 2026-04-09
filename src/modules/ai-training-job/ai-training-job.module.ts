import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiTrainingJobController } from './ai-training-job.controller';
import { AiTrainingJobService } from './ai-training-job.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [AiTrainingJobController],
  providers: [AiTrainingJobService],
  exports: [AiTrainingJobService],
})
export class AiTrainingJobModule {}
