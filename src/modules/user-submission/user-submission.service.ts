import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FoodService } from '../food/services/food.service';
import {
  CreateSubmissionDto,
  UpdateSubmissionStatusDto,
  QuerySubmissionDto,
  VoteType,
} from './dto';
import {
  SubmissionType,
  SubmissionCategory,
  SubmissionStatus,
  UserSubmission,
  Prisma,
} from '@prisma/client';

export interface SubmissionWithRelations extends UserSubmission {
  user?: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string;
  };
  targetFood?: {
    id: number;
    foodName: string;
    imageUrl?: string;
  } | null;
}

export interface PaginatedSubmissionsResult {
  EC: number;
  EM: string;
  meta: {
    current: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: SubmissionWithRelations[];
}

@Injectable()
export class UserSubmissionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly foodService: FoodService,
  ) {}

  // ─── User APIs ─────────────────────────────────────────────────────────────

  async create(
    userId: number,
    dto: CreateSubmissionDto,
  ): Promise<UserSubmission> {
    // Validate targetFoodId exists when type is REPORT
    if (dto.type === SubmissionType.REPORT && !dto.targetFoodId) {
      throw new BadRequestException(
        'Báo cáo sai sót cần có targetFoodId (ID món ăn cần báo cáo)',
      );
    }

    // Validate targetFood exists
    if (dto.targetFoodId) {
      const food = await this.prisma.food.findUnique({
        where: { id: dto.targetFoodId },
      });
      if (!food) {
        throw new NotFoundException(
          `Không tìm thấy món ăn với ID ${dto.targetFoodId}`,
        );
      }
    }

    // Calculate reliability score based on user's history
    const reliabilityScore = await this.calculateReliabilityScore(userId);

    return this.prisma.userSubmission.create({
      data: {
        userId,
        type: dto.type,
        targetFoodId: dto.targetFoodId || null,
        category: dto.category,
        payload: dto.payload as Prisma.InputJsonValue,
        description: dto.description || null,
        reliabilityScore,
      },
    });
  }

  async findByUser(
    userId: number,
    query: QuerySubmissionDto,
  ): Promise<PaginatedSubmissionsResult> {
    const { type, category, status, current = 1, pageSize = 10 } = query;

    const where: Prisma.UserSubmissionWhereInput = { userId };
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;

    const skip = (current - 1) * pageSize;

    const [submissions, total] = await Promise.all([
      this.prisma.userSubmission.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          targetFood: {
            select: {
              id: true,
              foodName: true,
              imageUrl: true,
            },
          },
        },
      }),
      this.prisma.userSubmission.count({ where }),
    ]);

    return {
      EC: 0,
      EM: 'Get user submissions success',
      meta: {
        current,
        pageSize,
        pages: Math.ceil(total / pageSize),
        total,
      },
      result: submissions,
    };
  }

  async cancelSubmission(userId: number, id: number): Promise<void> {
    const submission = await this.prisma.userSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy submission');
    }

    if (submission.userId !== userId) {
      throw new ForbiddenException('Không có quyền hủy submission này');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy submission đang ở trạng thái PENDING',
      );
    }

    await this.prisma.userSubmission.delete({
      where: { id },
    });
  }

  // ─── Admin APIs ────────────────────────────────────────────────────────────

  async findAll(
    query: QuerySubmissionDto,
  ): Promise<PaginatedSubmissionsResult> {
    const {
      type,
      category,
      status,
      userId,
      targetFoodId,
      current = 1,
      pageSize = 10,
    } = query;

    const where: Prisma.UserSubmissionWhereInput = {};
    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (targetFoodId) where.targetFoodId = targetFoodId;

    const skip = (current - 1) * pageSize;

    const [submissions, total] = await Promise.all([
      this.prisma.userSubmission.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { status: 'asc' }, // PENDING first
          { upvotes: 'desc' }, // Higher priority first
          { createdAt: 'desc' },
        ],
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              avatarUrl: true,
            },
          },
          targetFood: {
            select: {
              id: true,
              foodName: true,
              imageUrl: true,
            },
          },
        },
      }),
      this.prisma.userSubmission.count({ where }),
    ]);

    return {
      EC: 0,
      EM: 'Get all submissions success',
      meta: {
        current,
        pageSize,
        pages: Math.ceil(total / pageSize),
        total,
      },
      result: submissions,
    };
  }

  async findOne(id: number): Promise<SubmissionWithRelations> {
    const submission = await this.prisma.userSubmission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
        targetFood: {
          select: {
            id: true,
            foodName: true,
            imageUrl: true,
            description: true,
            defaultServingGrams: true,
            foodCategory: {
              select: {
                id: true,
                name: true,
              },
            },
            nutritionProfile: {
              include: {
                values: {
                  include: {
                    nutrient: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy submission');
    }

    return submission;
  }

  async updateStatus(
    id: number,
    dto: UpdateSubmissionStatusDto,
  ): Promise<UserSubmission> {
    const submission = await this.prisma.userSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy submission');
    }

    return this.prisma.userSubmission.update({
      where: { id },
      data: {
        status: dto.status,
        adminNote: dto.adminNote || null,
      },
    });
  }

  async approveAndProcess(
    id: number,
    adminNote?: string,
  ): Promise<UserSubmission> {
    const submission = await this.prisma.userSubmission.findUnique({
      where: { id },
      include: {
        targetFood: true,
      },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy submission');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể duyệt submission đang ở trạng thái PENDING',
      );
    }

    // Process based on submission type
    if (submission.type === SubmissionType.CONTRIBUTION) {
      // Create new food from payload
      await this.createFoodFromSubmission(submission);
    } else if (submission.type === SubmissionType.REPORT) {
      // Update existing food from payload
      if (submission.targetFoodId) {
        await this.updateFoodFromSubmission(submission);
      }
    }

    // Update submission status and reliability score
    const newReliabilityScore = await this.calculateReliabilityScore(
      submission.userId,
      true,
    );

    return this.prisma.userSubmission.update({
      where: { id },
      data: {
        status: SubmissionStatus.APPROVED,
        adminNote: adminNote || null,
        reliabilityScore: newReliabilityScore,
      },
    });
  }

  async reject(
    id: number,
    adminNote: string,
  ): Promise<UserSubmission> {
    const submission = await this.prisma.userSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy submission');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể từ chối submission đang ở trạng thái PENDING',
      );
    }

    // Update reliability score
    const newReliabilityScore = await this.calculateReliabilityScore(
      submission.userId,
      false,
    );

    return this.prisma.userSubmission.update({
      where: { id },
      data: {
        status: SubmissionStatus.REJECTED,
        adminNote,
        reliabilityScore: newReliabilityScore,
      },
    });
  }

  async vote(
    submissionId: number,
    voteType: VoteType,
  ): Promise<UserSubmission> {
    const submission = await this.prisma.userSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Không tìm thấy submission');
    }

    const updateData: Prisma.UserSubmissionUpdateInput =
      voteType === VoteType.UPVOTE
        ? { upvotes: { increment: 1 } }
        : { downvotes: { increment: 1 } };

    return this.prisma.userSubmission.update({
      where: { id: submissionId },
      data: updateData,
    });
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    reports: number;
    contributions: number;
  }> {
    const [
      total,
      pending,
      approved,
      rejected,
      reports,
      contributions,
    ] = await Promise.all([
      this.prisma.userSubmission.count(),
      this.prisma.userSubmission.count({
        where: { status: SubmissionStatus.PENDING },
      }),
      this.prisma.userSubmission.count({
        where: { status: SubmissionStatus.APPROVED },
      }),
      this.prisma.userSubmission.count({
        where: { status: SubmissionStatus.REJECTED },
      }),
      this.prisma.userSubmission.count({
        where: { type: SubmissionType.REPORT },
      }),
      this.prisma.userSubmission.count({
        where: { type: SubmissionType.CONTRIBUTION },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      reports,
      contributions,
    };
  }

  // ─── Private helpers ───────────────────────────────────────────────────────

  private async calculateReliabilityScore(
    userId: number,
    isApproved?: boolean,
  ): Promise<number> {
    const submissions = await this.prisma.userSubmission.findMany({
      where: { userId },
    });

    if (submissions.length === 0) {
      return 0;
    }

    const approved = submissions.filter(
      (s) => s.status === SubmissionStatus.APPROVED,
    ).length;
    const total = submissions.length;

    // Base score from approval rate
    let score = (approved / total) * 100;

    // Bonus for approved submissions
    if (isApproved === true) {
      score += 5;
    } else if (isApproved === false) {
      score -= 10;
    }

    // Cap at 0-100
    return Math.max(0, Math.min(100, score));
  }

  private async createFoodFromSubmission(
    submission: UserSubmission,
  ): Promise<void> {
    const payload = submission.payload as any;

    // Extract nutrition values from payload
    const nutritionValues = payload.nutritionValues || [];

    // Create the food using existing food service
    // This is a simplified version - in production you'd use the full food creation flow
    await this.prisma.food.create({
      data: {
        foodName: payload.foodName || payload.name,
        description: payload.description || null,
        imageUrl: payload.imageUrl || null,
        categoryId: payload.categoryId || null,
        defaultServingGrams: payload.defaultServingGrams || 100,
        nutritionProfile: {
          create: {
            source: 'SRC_MANUAL',
            isCalculated: false,
            values: {
              create: nutritionValues.map((nv: any) => ({
                value: nv.value,
                nutrient: {
                  connect: { id: nv.nutrientId },
                },
              })),
            },
          },
        },
      },
    });
  }

  private async updateFoodFromSubmission(
    submission: UserSubmission,
  ): Promise<void> {
    const payload = submission.payload as any;

    if (!submission.targetFoodId) return;

    // Update food basic info
    const updateData: Prisma.FoodUpdateInput = {};
    if (payload.foodName || payload.name) {
      updateData.foodName = payload.foodName || payload.name;
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description;
    }
    if (payload.imageUrl !== undefined) {
      updateData.imageUrl = payload.imageUrl;
    }
    if (payload.categoryId !== undefined) {
      updateData.categoryId = payload.categoryId;
    }
    if (payload.defaultServingGrams !== undefined) {
      updateData.defaultServingGrams = payload.defaultServingGrams;
    }

    await this.prisma.food.update({
      where: { id: submission.targetFoodId },
      data: updateData,
    });

    // Update nutrition values if provided
    if (payload.nutritionValues && payload.nutritionValues.length > 0) {
      const nutritionProfile = await this.prisma.foodNutritionProfile.findUnique({
        where: { foodId: submission.targetFoodId },
      });

      if (nutritionProfile) {
        for (const nv of payload.nutritionValues) {
          await this.prisma.foodNutritionValue.upsert({
            where: {
              foodNutritionProfileId_nutrientId: {
                foodNutritionProfileId: nutritionProfile.id,
                nutrientId: nv.nutrientId,
              },
            },
            update: { value: nv.value },
            create: {
              value: nv.value,
              foodNutritionProfileId: nutritionProfile.id,
              nutrientId: nv.nutrientId,
            },
          });
        }
      }
    }
  }
}
