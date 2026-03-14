import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFoodImageDto } from './dto/create-food-image.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class FoodImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(
    userId: number,
    dto: CreateFoodImageDto,
    image: Express.Multer.File,
  ) {
    const mealItem = await this.prisma.mealItem.findUnique({
      where: { id: dto.mealItemId },
      include: {
        meal: { include: { dailyLog: { select: { userId: true } } } },
      },
    });
    if (!mealItem)
      throw new NotFoundException(`MealItem #${dto.mealItemId} không tồn tại`);
    if (mealItem.meal.dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền thêm ảnh vào meal item này',
      );

    const { url } = await this.cloudinaryService.uploadFile(image);

    return this.prisma.foodImage.create({
      data: {
        mealItemId: dto.mealItemId,
        imageUrl: url,
        fileName: image.originalname,
        mimeType: image.mimetype,
        fileSize: image.size,
      },
    });
  }

  async findAllByMealItemId(mealItemId: number) {
    const mealItem = await this.prisma.mealItem.findUnique({
      where: { id: mealItemId },
    });
    if (!mealItem)
      throw new NotFoundException(`MealItem #${mealItemId} không tồn tại`);

    return this.prisma.foodImage.findMany({
      where: { mealItemId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const image = await this.prisma.foodImage.findUnique({
      where: { id },
      include: {
        mealItem: {
          select: {
            id: true,
            quantity: true,
            meal: {
              select: { id: true, mealType: true, mealDateTime: true },
            },
          },
        },
      },
    });
    if (!image) throw new NotFoundException(`FoodImage #${id} không tồn tại`);
    return image;
  }

  async remove(id: number, userId: number): Promise<void> {
    const image = await this.prisma.foodImage.findUnique({
      where: { id },
      include: {
        mealItem: {
          include: {
            meal: { include: { dailyLog: { select: { userId: true } } } },
          },
        },
      },
    });
    if (!image) throw new NotFoundException(`FoodImage #${id} không tồn tại`);
    if (image.mealItem.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa ảnh này');

    await this.prisma.foodImage.delete({ where: { id } });
  }

  async removeAllByMealItemId(
    mealItemId: number,
    userId: number,
  ): Promise<{ deletedCount: number }> {
    const mealItem = await this.prisma.mealItem.findUnique({
      where: { id: mealItemId },
      include: {
        meal: { include: { dailyLog: { select: { userId: true } } } },
      },
    });
    if (!mealItem)
      throw new NotFoundException(`MealItem #${mealItemId} không tồn tại`);
    if (mealItem.meal.dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền xóa ảnh của meal item này',
      );

    const result = await this.prisma.foodImage.deleteMany({
      where: { mealItemId },
    });
    return { deletedCount: result.count };
  }
}
