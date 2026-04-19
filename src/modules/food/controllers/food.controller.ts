import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FoodService } from '../services/food.service.js';
import { CreateFoodDto } from '../dto/create-food.dto.js';
import { CreateFoodWithIngredientsDto } from '../dto/create-food-with-ingredients.dto.js';
import { UpdateFoodDto } from '../dto/update-food.dto.js';
import { BulkDeleteFoodDto } from '../dto/bulk-delete-food.dto.js';
import { BulkCreateFoodDto } from '../dto/bulk-create-food.dto.js';
import { AdminGuard } from '../../../guards/admin.guard';

@Controller('foods')
export class FoodController {
  constructor(private readonly foodService: FoodService) {}

  // ──── Admin only ────────────────────────────────────────────────────────
  @UseGuards(AdminGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Body() createFoodDto: CreateFoodDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
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
    image?: Express.Multer.File,
  ) {
    return this.foodService.create(createFoodDto, image);
  }

  @UseGuards(AdminGuard)
  @Post('with-ingredients')
  @HttpCode(HttpStatus.CREATED)
  createWithIngredients(@Body() dto: CreateFoodWithIngredientsDto) {
    return this.foodService.createWithIngredients(dto);
  }

  @UseGuards(AdminGuard)
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  createMany(@Body() dto: BulkCreateFoodDto) {
    return this.foodService.createMany(dto.items);
  }

  @UseGuards(AdminGuard)
  @Patch(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFoodDto: UpdateFoodDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
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
    image?: Express.Multer.File,
  ) {
    return this.foodService.update(id, updateFoodDto, image);
  }

  @UseGuards(AdminGuard)
  @Delete('bulk')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: BulkDeleteFoodDto) {
    return this.foodService.removeMany(dto.ids);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.remove(id);
  }

  @UseGuards(AdminGuard)
  @Get('admin')
  findAllAdmin(
    @Query('current') page: number,
    @Query('pageSize') limit: number,
    @Query() qs: string,
  ) {
    return this.foodService.findAllAdmin(page, limit, qs);
  }

  // ──── All authenticated users ────────────────────────────────────────────
  @Get()
  findAll(@Query('categoryId', ParseIntPipe) categoryId?: number) {
    if (categoryId != null) {
      return this.foodService.findByCategoryId(categoryId);
    }
    return this.foodService.findAll();
  }

  @Get(':id/detail')
  findDetail(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findDetail(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodService.findOne(id);
  }
}

