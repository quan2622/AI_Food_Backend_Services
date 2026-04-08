import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  prismaSortFromAqp,
  stripAdminPaginationFilter,
} from '../../../common/utils/admin-pagination.util';
import { CloudinaryService } from '../../cloudinary/cloudinary.service';
import type { CreateIngredientDto } from '../dto/ingredient/create-ingredient.dto.js';
import type { UpdateIngredientDto } from '../dto/ingredient/update-ingredient.dto.js';

@Injectable()
export class IngredientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async create(dto: CreateIngredientDto, image: Express.Multer.File) {
    const { url } = await this.cloudinaryService.uploadFile(image);

    return this.prisma.ingredient.create({
      data: {
        ingredientName: dto.ingredientName,
        description: dto.description,
        imageUrl: url,
      },
    });
  }

  async update(
    id: number,
    dto: UpdateIngredientDto,
    image?: Express.Multer.File,
  ) {
    const existing = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Ingredient #${id} không tồn tại`);
    }

    let imageUrl = existing.imageUrl;
    if (image) {
      const { url } = await this.cloudinaryService.uploadFile(image);
      imageUrl = url;
    }

    return this.prisma.ingredient.update({
      where: { id },
      data: {
        ...(dto.ingredientName != null && { ingredientName: dto.ingredientName }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(image != null && { imageUrl }),
      },
    });
  }

  findAll() {
    return this.prisma.ingredient.findMany({
      orderBy: { ingredientName: 'asc' },
    });
  }

  async findAllAdmin(page: number, limit: number, queryString: string) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      stripAdminPaginationFilter(filter as Record<string, unknown>);
      const sort = prismaSortFromAqp(aqpSort, { updatedAt: 'desc' });

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.ingredient.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.ingredient.findMany({
        where: filter,
        orderBy: sort,
        skip: offset,
        take: defaultLimit,
      });

      return {
        EC: 0,
        EM: 'Get ingredients with query paginate success (admin)',
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
        'Error in ingredient service get paginate (admin):',
        (error as Error).message,
      );
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in ingredient service get paginate',
      });
    }
  }

  async findOne(id: number) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      throw new NotFoundException(`Ingredient #${id} không tồn tại`);
    }
    return ingredient;
  }
}

