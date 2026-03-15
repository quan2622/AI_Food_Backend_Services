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
    const meal = await this.prisma.meal.findUnique({
      where: { id: dto.mealId },
      include: { dailyLog: { select: { userId: true } } },
    });
    if (!meal) throw new NotFoundException(`Meal #${dto.mealId} không tồn tại`);
    if (meal.dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền thêm ảnh vào bữa ăn này',
      );

    const { url } = await this.cloudinaryService.uploadFile(image);

    return this.prisma.foodImage.create({
      data: {
        userId,
        mealId: dto.mealId,
        imageUrl: url,
        fileName: image.originalname,
        mimeType: image.mimetype,
        fileSize: image.size,
      },
    });
  }

  async findAllByMealId(mealId: number) {
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
    });
    if (!meal) throw new NotFoundException(`Meal #${mealId} không tồn tại`);

    return this.prisma.foodImage.findMany({
      where: { mealId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const image = await this.prisma.foodImage.findUnique({
      where: { id },
      include: {
        meal: {
          select: {
            id: true,
            mealType: true,
            mealDateTime: true,
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
        meal: { include: { dailyLog: { select: { userId: true } } } },
      },
    });
    if (!image) throw new NotFoundException(`FoodImage #${id} không tồn tại`);
    if (image.meal.dailyLog.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền xóa ảnh này');

    await this.prisma.foodImage.delete({ where: { id } });
  }

  async removeAllByMealId(
    mealId: number,
    userId: number,
  ): Promise<{ deletedCount: number }> {
    const meal = await this.prisma.meal.findUnique({
      where: { id: mealId },
      include: { dailyLog: { select: { userId: true } } },
    });
    if (!meal) throw new NotFoundException(`Meal #${mealId} không tồn tại`);
    if (meal.dailyLog.userId !== userId)
      throw new ForbiddenException(
        'Bạn không có quyền xóa ảnh của bữa ăn này',
      );

    const result = await this.prisma.foodImage.deleteMany({
      where: { mealId },
    });
    return { deletedCount: result.count };
  }
}
