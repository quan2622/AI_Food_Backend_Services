import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserProfile } from '../../generated/prisma/client.js';
import type { CreateUserProfileDto } from './dto/create-user-profile.dto.js';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';

/** Hệ số hoạt động TDEE */
const ACTIVITY_FACTORS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

@Injectable()
export class UserProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateBmi(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  /**
   * Mifflin-St Jeor equation
   * Nam:  BMR = 10W + 6.25H − 5A + 5
   * Nữ:   BMR = 10W + 6.25H − 5A − 161
   */
  private calculateBmr(
    weight: number,
    height: number,
    age: number,
    gender?: string,
  ): number {
    const base = 10 * weight + 6.25 * height - 5 * age;
    const offset = gender === 'FEMALE' ? -161 : 5; // default MALE
    return parseFloat((base + offset).toFixed(2));
  }

  /** TDEE = BMR × hệ số hoạt động */
  private calculateTdee(bmr: number, activityLevel?: string): number {
    const factor = ACTIVITY_FACTORS[activityLevel ?? ''] ?? 1.55;
    return parseFloat((bmr * factor).toFixed(2));
  }

  async create(
    userId: number,
    dto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User #${userId} không tồn tại`);
    }

    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(`User #${userId} đã có UserProfile`);
    }

    const bmi = this.calculateBmi(dto.weight, dto.height);
    const bmr = this.calculateBmr(dto.weight, dto.height, dto.age, dto.gender);
    const tdee = this.calculateTdee(bmr, dto.activityLevel);

    return this.prisma.userProfile.create({
      data: {
        userId,
        age: dto.age,
        height: dto.height,
        weight: dto.weight,
        allergies: {
          create:
            dto.allergies?.map((a) => ({
              allergenId: a.allergenId,
              severity: a.severity,
              note: a.note,
            })) ?? [],
        },
        gender: dto.gender ?? null,
        activityLevel: dto.activityLevel ?? null,
        bmi,
        bmr,
        tdee,
      },
    });
  }

  async findAll(): Promise<UserProfile[]> {
    return this.prisma.userProfile.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        allergies: true,
      },
    });
  }

  async findOne(id: number): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        allergies: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(`UserProfile #${id} không tồn tại`);
    }

    return profile;
  }

  async findByUserId(userId: number): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        allergies: true,
      },
    });

    if (!profile) {
      throw new NotFoundException(
        `UserProfile của User #${userId} không tồn tại`,
      );
    }

    return profile;
  }

  async update(id: number, dto: UpdateUserProfileDto): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`UserProfile #${id} không tồn tại`);
    }

    const newWeight = dto.weight ?? profile.weight;
    const newHeight = dto.height ?? profile.height;
    const newAge = dto.age ?? profile.age;
    const newGender = dto.gender ?? profile.gender ?? undefined;
    const newActivityLevel =
      dto.activityLevel ?? profile.activityLevel ?? undefined;

    const bmi = this.calculateBmi(newWeight, newHeight);
    const bmr = this.calculateBmr(newWeight, newHeight, newAge, newGender);
    const tdee = this.calculateTdee(bmr, newActivityLevel);

    return this.prisma.userProfile.update({
      where: { id },
      data: {
        ...(dto.age != null && { age: dto.age }),
        ...(dto.height != null && { height: dto.height }),
        ...(dto.weight != null && { weight: dto.weight }),
        ...(dto.allergies !== undefined && {
          allergies: {
            deleteMany: {},
            create: dto.allergies.map((a) => ({
              allergenId: a.allergenId,
              severity: a.severity,
              note: a.note,
            })),
          },
        }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.activityLevel !== undefined && {
          activityLevel: dto.activityLevel,
        }),
        bmi,
        bmr,
        tdee,
      },
    });
  }

  async removeByUserId(userId: number): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `UserProfile của User #${userId} không tồn tại`,
      );
    }

    await this.prisma.userProfile.delete({ where: { userId } });
  }

  async updateByUserId(
    userId: number,
    dto: UpdateUserProfileDto,
  ): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException(
        `UserProfile của User #${userId} không tồn tại`,
      );
    }

    const newWeight = dto.weight ?? profile.weight;
    const newHeight = dto.height ?? profile.height;
    const newAge = dto.age ?? profile.age;
    const newGender = dto.gender ?? profile.gender ?? undefined;
    const newActivityLevel =
      dto.activityLevel ?? profile.activityLevel ?? undefined;

    const bmi = this.calculateBmi(newWeight, newHeight);
    const bmr = this.calculateBmr(newWeight, newHeight, newAge, newGender);
    const tdee = this.calculateTdee(bmr, newActivityLevel);

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.age != null && { age: dto.age }),
        ...(dto.height != null && { height: dto.height }),
        ...(dto.weight != null && { weight: dto.weight }),
        ...(dto.allergies !== undefined && {
          allergies: {
            deleteMany: {},
            create: dto.allergies.map((a) => ({
              allergenId: a.allergenId,
              severity: a.severity,
              note: a.note,
            })),
          },
        }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
        ...(dto.activityLevel !== undefined && {
          activityLevel: dto.activityLevel,
        }),
        bmi,
        bmr,
        tdee,
      },
    });
  }

  async remove(id: number): Promise<void> {
    const profile = await this.prisma.userProfile.findUnique({ where: { id } });

    if (!profile) {
      throw new NotFoundException(`UserProfile #${id} không tồn tại`);
    }

    await this.prisma.userProfile.delete({ where: { id } });
  }
}
