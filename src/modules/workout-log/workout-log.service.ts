import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Adjust path if necessary
import { CreateWorkoutLogDto } from './dto/create-workout-log.dto';
import { UpdateWorkoutLogDto } from './dto/update-workout-log.dto';

@Injectable()
export class WorkoutLogService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createWorkoutLogDto: CreateWorkoutLogDto) {
    return await this.prisma.workoutLog.create({
      data: {
        userId,
        workoutType: createWorkoutLogDto.workoutType,
        durationMinute: createWorkoutLogDto.durationMinute,
        burnedCalories: createWorkoutLogDto.burnedCalories ?? 0,
        startedAt: new Date(createWorkoutLogDto.startedAt),
        endedAt: createWorkoutLogDto.endedAt
          ? new Date(createWorkoutLogDto.endedAt)
          : null,
        source: createWorkoutLogDto.source,
      },
    });
  }

  async findAll(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.workoutLog.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.workoutLog.count({
        where: { userId },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByDate(userId: number, date: string) {
    const targetDate = new Date(date);
    const startDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
      ),
    );
    const endDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    return await this.prisma.workoutLog.findMany({
      where: {
        userId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { startedAt: 'asc' },
    });
  }

  async findOne(id: number, userId: number) {
    const log = await this.prisma.workoutLog.findUnique({
      where: { id },
    });

    if (!log || log.userId !== userId) {
      throw new NotFoundException(`Workout log #${id} not found`);
    }

    return log;
  }

  async update(
    id: number,
    userId: number,
    updateWorkoutLogDto: UpdateWorkoutLogDto,
  ) {
    await this.findOne(id, userId); // Ensure it exists and belongs to user

    const updateData: any = { ...updateWorkoutLogDto };
    if (updateWorkoutLogDto.startedAt)
      updateData.startedAt = new Date(updateWorkoutLogDto.startedAt);
    if (updateWorkoutLogDto.endedAt)
      updateData.endedAt = new Date(updateWorkoutLogDto.endedAt);

    return await this.prisma.workoutLog.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId); // Ensure it exists and belongs to user

    return await this.prisma.workoutLog.delete({
      where: { id },
    });
  }

  async calculateDailyBurnedCalories(
    userId: number,
    date: Date | string,
  ): Promise<number> {
    const targetDate = new Date(date);
    const startDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
      ),
    );
    const endDate = new Date(
      Date.UTC(
        targetDate.getUTCFullYear(),
        targetDate.getUTCMonth(),
        targetDate.getUTCDate(),
        23,
        59,
        59,
        999,
      ),
    );

    const result = await this.prisma.workoutLog.aggregate({
      where: {
        userId,
        startedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        burnedCalories: true,
      },
    });

    return result._sum.burnedCalories || 0;
  }
}
