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
  Query,
  UseGuards,
} from '@nestjs/common';
import { FoodImageService } from './food-image.service';
import { CreateFoodImageDto } from './dto/create-food-image.dto.js';
import { User } from 'src/common/decorators';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminGuard } from '../../guards/admin.guard';

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

  @Get('meals/:mealId')
  findAllByMealId(@Param('mealId', ParseIntPipe) mealId: number) {
    return this.foodImageService.findAllByMealId(mealId);
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.foodImageService.findAllAdmin(page, limit, qs);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodImageService.findOne(id);
  }

  @Delete('meals/:mealId')
  @HttpCode(HttpStatus.OK)
  removeAllByMealId(
    @Param('mealId', ParseIntPipe) mealId: number,
    @User() user: { id: number },
  ) {
    return this.foodImageService.removeAllByMealId(mealId, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: { id: number }) {
    return this.foodImageService.remove(id, user.id);
  }
}
