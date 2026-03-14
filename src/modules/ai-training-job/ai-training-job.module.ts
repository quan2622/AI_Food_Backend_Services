import { Module } from '@nestjs/common';
import { AiTrainingJobController } from './ai-training-job.controller';
import { AiTrainingJobService } from './ai-training-job.service';

@Module({
  controllers: [AiTrainingJobController],
  providers: [AiTrainingJobService]
})
export class AiTrainingJobModule {}
