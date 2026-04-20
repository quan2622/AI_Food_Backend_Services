import {
  Controller,
  Post,
  Get,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Optional,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FoodRecognitionService } from './food-recognition.service';
import { User } from '../../common/decorators';

@Controller('food-recognition')
export class FoodRecognitionController {
  constructor(private readonly foodRecognitionService: FoodRecognitionService) {}

  @Post('predict')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  predict(
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
    @Query('model_name') modelName?: string,
    @Query('meal_item_id') mealItemId?: string,
  ) {
    return this.foodRecognitionService.predict(
      image,
      user.id,
      modelName,
      mealItemId ? parseInt(mealItemId, 10) : undefined,
    );
  }

  @Get('classes')
  getClasses() {
    return this.foodRecognitionService.getClasses();
  }

  @Get('health')
  health() {
    return this.foodRecognitionService.health();
  }
}
