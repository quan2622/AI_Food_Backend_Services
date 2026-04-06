import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateFoodImageDto } from './dto/create-food-image.dto.js';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { AllCodeLookupService } from '../../common/services/allcode-lookup.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../common/utils/admin-pagination.util';

@Injectable()
export class FoodImageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly allCodeLookup: AllCodeLookupService,
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

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { uploadedAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.foodImage.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const rows = await this.prisma.foodImage.findMany({
        where: filter,
        orderBy: sort,
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
          meal: {
            select: {
              id: true,
              mealType: true,
              mealDateTime: true,
              dailyLogId: true,
            },
          },
        },
        skip: offset,
        take: defaultLimit,
      });

      const mealTypeMap = await this.allCodeLookup.mapByKeyMaps(
        rows.map((r) => r.meal?.mealType).filter(Boolean) as string[],
      );

      const result = rows.map((r) => ({
        ...r,
        mealTypeInfo: r.meal?.mealType
          ? mealTypeMap.get(r.meal.mealType) ?? null
          : null,
      }));

      return {
        EC: 0,
        EM: 'Get food images with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result,
      };
    } catch (error) {
      console.error(
        'Error in food image service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in food image service get paginate',
      });
    }
  }
}
