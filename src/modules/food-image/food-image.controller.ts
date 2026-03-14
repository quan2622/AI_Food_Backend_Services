import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FoodImageService } from './food-image.service';
import { CreateFoodImageDto } from './dto/create-food-image.dto.js';
import { User } from 'src/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('food-images')
export class FoodImageController {
  constructor(private readonly foodImageService: FoodImageService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB — reject sớm ở tầng multipart
    }),
  )
  create(
    @User() user: { id: number },
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
            message: 'Ảnh không được vượt quá 5MB',
          }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp)$/,
          }),
        ],
      }),
    )
    image: Express.Multer.File,
    @Body() dto: CreateFoodImageDto,
  ) {
    return this.foodImageService.create(user.id, dto, image);
  }

  @Get('meal-items/:mealItemId')
  findAllByMealItemId(@Param('mealItemId', ParseIntPipe) mealItemId: number) {
    return this.foodImageService.findAllByMealItemId(mealItemId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodImageService.findOne(id);
  }

  @Delete('meal-items/:mealItemId')
  @HttpCode(HttpStatus.OK)
  removeAllByMealItemId(
    @Param('mealItemId', ParseIntPipe) mealItemId: number,
    @User() user: { id: number },
  ) {
    return this.foodImageService.removeAllByMealItemId(mealItemId, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.foodImageService.remove(id, user.id);
  }
}
