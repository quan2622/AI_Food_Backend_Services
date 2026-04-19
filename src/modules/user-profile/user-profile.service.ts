import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import aqp from 'api-query-params';
import type { AqpQuery } from 'api-query-params';
import { isEmpty } from 'lodash';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';
import type { GenderType, UserProfile } from '../../generated/prisma/client.js';
import type { CreateUserProfileDto } from './dto/create-user-profile.dto.js';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';
import { UserProfilePaginationDto } from './dto/user-profile-pagination.dto';

/** Hệ số hoạt động TDEE */
const ACTIVITY_FACTORS: Record<string, number> = {
  ACT_SEDENTARY: 1.2,
  ACT_LIGHT: 1.375,
  ACT_MODERATE: 1.55,
  ACT_VERY: 1.725,
  ACT_SUPER: 1.9,
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
    // FEMALE uses -161, MALE and UNDEFINED default to +5 (male calculation)
    const offset = gender === 'FEMALE' ? -161 : 5;
    return parseFloat((base + offset).toFixed(2));
  }

  private calculateAgeFromBirthDate(birthOfDate: string | Date): number {
    const birth = new Date(birthOfDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    const dayDiff = today.getDate() - birth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }
    return age;
  }

  /** TDEE = BMR × hệ số hoạt động */
  private calculateTdee(bmr: number, activityLevel?: string | null): number {
    const factor = activityLevel ? ACTIVITY_FACTORS[activityLevel] : 1.55;
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

    const birthDateSource =
      dto.birthOfDate ??
      (user.dateOfBirth ? user.dateOfBirth.toISOString() : undefined);

    const age = birthDateSource
      ? this.calculateAgeFromBirthDate(birthDateSource)
      : dto.age;

    const bmi = this.calculateBmi(dto.weight, dto.height);
    const bmr = this.calculateBmr(dto.weight, dto.height, age ?? 0, dto.gender);
    const tdee = this.calculateTdee(bmr, dto.activityLevel ?? null);

    if (dto.birthOfDate !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          dateOfBirth: dto.birthOfDate ? new Date(dto.birthOfDate) : null,
        },
      });
    }

    return this.prisma.userProfile.create({
      data: {
        userId,
        age: age ?? 0,
        height: dto.height,
        weight: dto.weight,
        gender: dto.gender ?? 'UNDEFINED',
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
      },
    });
  }

  async findAllAdmin(
    page: number,
    limit: number,
    queryString: string,
  ) {
    try {
      const parsed = aqp(queryString) as AqpQuery;
      const { filter } = parsed;
      const { sort: aqpSort } = parsed;

      delete filter.current;
      delete filter.pageSize;

      // Convert aqp sort format to Prisma sort format
      let sort: Record<string, 'asc' | 'desc'>;
      if (isEmpty(aqpSort)) {
        sort = { updatedAt: 'desc' };
      } else {
        sort = Object.entries(aqpSort as Record<string, number>).reduce(
          (acc, [key, value]) => {
            acc[key] = value === 1 ? 'asc' : 'desc';
            return acc;
          },
          {} as Record<string, 'asc' | 'desc'>,
        );
      }

      const offset = (page - 1) * limit;
      const defaultLimit = limit ? limit : 10;

      const totalItems = await this.prisma.userProfile.count({ where: filter });
      const totalPages = Math.ceil(totalItems / defaultLimit);

      const result = await this.prisma.userProfile.findMany({
        where: filter,
        orderBy: sort,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              avatarUrl: true,
            },
          },
        },
        skip: offset,
        take: defaultLimit,
      });

      // Fetch activity level data from AllCode for each profile
      const activityLevelCodes = await this.prisma.allCode.findMany({
        where: {
          type: 'ACTIVITY',
          keyMap: {
            in: result
              .map((p) => p.activityLevel)
              .filter((a): a is string => a !== null && a !== undefined),
          },
        },
      });

      const activityLevelMap = new Map(activityLevelCodes.map((c) => [c.keyMap, c]));

      // Fetch gender data from AllCode for each profile
      const genderKeyMaps = result
        .map((p) => p.gender)
        .filter((g): g is GenderType => g !== null && g !== undefined);
      const genderCodes =
        genderKeyMaps.length > 0
          ? await this.prisma.allCode.findMany({
              where: {
                type: 'GENDER',
                keyMap: { in: [...new Set(genderKeyMaps)] },
              },
            })
          : [];

      const genderMap = new Map(genderCodes.map((c) => [c.keyMap, c]));

      const data = result.map((profile) => ({
        ...profile,
        genderData: profile.gender ? genderMap.get(profile.gender) || null : null,
        activityLevelData: profile.activityLevel
          ? activityLevelMap.get(profile.activityLevel) || null
          : null,
      }));

      return {
        EC: 0,
        EM: 'Get user profiles with query paginate success (admin)',
        meta: {
          current: page,
          pageSize: limit,
          pages: totalPages,
          total: totalItems,
        },
        result: plainToInstance(UserProfilePaginationDto, data),
      };
    } catch (error) {
      console.error('Error in user profile service get paginate(admin):', error.message);
      throw new InternalServerErrorException({
        EC: 1,
        EM: 'Error in user profile service get paginate',
      });
    }
  }

  async findOne(id: number): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
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
    const newGender = dto.gender ?? profile.gender;
    const newActivityLevel: string | null =
      dto.activityLevel ?? profile.activityLevel ?? null;

    const birthDateSource = dto.birthOfDate ? dto.birthOfDate : undefined;
    const newAge = birthDateSource
      ? this.calculateAgeFromBirthDate(birthDateSource)
      : dto.age ?? profile.age;

    const bmi = this.calculateBmi(newWeight, newHeight);
    const bmr = this.calculateBmr(newWeight, newHeight, newAge, newGender);
    const tdee = this.calculateTdee(bmr, newActivityLevel);

    if (
      dto.avatarUrl !== undefined ||
      dto.fullName !== undefined ||
      dto.birthOfDate !== undefined
    ) {
      await this.prisma.user.update({
        where: { id: profile.userId },
        data: {
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          ...(dto.fullName !== undefined && { fullName: dto.fullName }),
          ...(dto.birthOfDate !== undefined && {
            dateOfBirth: dto.birthOfDate ? new Date(dto.birthOfDate) : null,
          }),
        },
      });
    }

    return this.prisma.userProfile.update({
      where: { id },
      data: {
        ...(dto.age != null && { age: newAge }),
        ...(dto.height != null && { height: dto.height }),
        ...(dto.weight != null && { weight: dto.weight }),
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
    const newGender = dto.gender ?? profile.gender;
    const newActivityLevel: string | null =
      dto.activityLevel ?? profile.activityLevel ?? null;

    const birthDateSource = dto.birthOfDate ? dto.birthOfDate : undefined;
    const newAge = birthDateSource
      ? this.calculateAgeFromBirthDate(birthDateSource)
      : dto.age ?? profile.age;

    const bmi = this.calculateBmi(newWeight, newHeight);
    const bmr = this.calculateBmr(newWeight, newHeight, newAge, newGender);
    const tdee = this.calculateTdee(bmr, newActivityLevel);

    if (
      dto.avatarUrl !== undefined ||
      dto.fullName !== undefined ||
      dto.birthOfDate !== undefined
    ) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
          ...(dto.fullName !== undefined && { fullName: dto.fullName }),
          ...(dto.birthOfDate !== undefined && {
            dateOfBirth: dto.birthOfDate ? new Date(dto.birthOfDate) : null,
          }),
        },
      });
    }

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.age != null && { age: newAge }),
        ...(dto.height != null && { height: dto.height }),
        ...(dto.weight != null && { weight: dto.weight }),
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
