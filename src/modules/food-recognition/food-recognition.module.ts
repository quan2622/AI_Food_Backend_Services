import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FoodRecognitionController } from './food-recognition.controller';
import { FoodRecognitionService } from './food-recognition.service';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [HttpModule, ConfigModule, CloudinaryModule, PrismaModule],
  controllers: [FoodRecognitionController],
  providers: [FoodRecognitionService],
  exports: [FoodRecognitionService],
})
export class FoodRecognitionModule {}
