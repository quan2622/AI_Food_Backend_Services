import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecommendController } from './recommend.controller';
import { RecommendService } from './recommend.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [RecommendController],
  providers: [RecommendService],
  exports: [RecommendService],
})
export class RecommendModule {}
