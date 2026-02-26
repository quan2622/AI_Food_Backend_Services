import { Module } from '@nestjs/common';
import { FoodImageService } from './food-image.service';
import { FoodImageController } from './food-image.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  controllers: [FoodImageController],
  providers: [FoodImageService],
  exports: [FoodImageService],
  imports: [CloudinaryModule],
})
export class FoodImageModule {}
