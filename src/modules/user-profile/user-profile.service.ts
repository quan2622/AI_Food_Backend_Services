import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { UserProfile } from '../../generated/prisma/client.js';
import type { CreateUserProfileDto } from './dto/create-user-profile.dto.js';
import type { UpdateUserProfileDto } from './dto/update-user-profile.dto.js';

@Injectable()
export class UserProfileService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateBmi(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
  }

  // Mifflin-St Jeor equation (mặc định giới tính nam)
  private calculateBmr(weight: number, height: number, age: number): number {
    return parseFloat((10 * weight + 6.25 * height - 5 * age + 5).toFixed(2));
  }

  // TDEE = BMR × hệ số hoạt động vừa phải (1.55)
  private calculateTdee(bmr: number): number {
    return parseFloat((bmr * 1.55).toFixed(2));
  }

  async create(
    userId: number,
    dto: CreateUserProfileDto,
  ): Promise<UserProfile> {
    // Kiểm tra user tồn tại
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException(`User #${userId} không tồn tại`);
    }

    // Kiểm tra profile đã tồn tại chưa
    const existing = await this.prisma.userProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException(`User #${userId} đã có UserProfile`);
    }

    const bmi = this.calculateBmi(dto.weight, dto.height);
    const bmr = this.calculateBmr(dto.weight, dto.height, dto.age);
    const tdee = this.calculateTdee(bmr);

    return this.prisma.userProfile.create({
      data: {
        userId,
        age: dto.age,
        height: dto.height,
        weight: dto.weight,
        allergies: dto.allergies ?? [],
        bmi,
        bmr,
        tdee,
      },
    });
  }

  async findAll(): Promise<UserProfile[]> {
    return this.prisma.userProfile.findMany({
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });
  }

  async findOne(id: number): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    if (!profile) {
      throw new NotFoundException(`UserProfile #${id} không tồn tại`);
    }

    return profile;
  }

  async findByUserId(userId: number): Promise<UserProfile> {
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
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

    const bmi = this.calculateBmi(newWeight, newHeight);
    const bmr = this.calculateBmr(newWeight, newHeight, newAge);
    const tdee = this.calculateTdee(bmr);

    return this.prisma.userProfile.update({
      where: { id },
      data: {
        ...(dto.age != null && { age: dto.age }),
        ...(dto.height != null && { height: dto.height }),
        ...(dto.weight != null && { weight: dto.weight }),
        ...(dto.allergies !== undefined && { allergies: dto.allergies }),
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

    const bmi = this.calculateBmi(newWeight, newHeight);
    const bmr = this.calculateBmr(newWeight, newHeight, newAge);
    const tdee = this.calculateTdee(bmr);

    return this.prisma.userProfile.update({
      where: { userId },
      data: {
        ...(dto.age != null && { age: dto.age }),
        ...(dto.height != null && { height: dto.height }),
        ...(dto.weight != null && { weight: dto.weight }),
        ...(dto.allergies !== undefined && { allergies: dto.allergies }),
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
