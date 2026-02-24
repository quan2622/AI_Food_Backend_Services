import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AllCode } from '../../generated/prisma/client.js';
import type { CreateAllcodeDto } from './dto/create-allcode.dto.js';
import type { UpdateAllcodeDto } from './dto/update-allcode.dto.js';

@Injectable()
export class AllcodeService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAllcodeDto): Promise<AllCode> {
    const existing = await this.prisma.allCode.findUnique({
      where: { keyMap: dto.keyMap },
    });
    if (existing) {
      throw new ConflictException(`keyMap "${dto.keyMap}" đã tồn tại`);
    }

    return this.prisma.allCode.create({
      data: {
        keyMap: dto.keyMap,
        type: dto.type,
        value: dto.value,
        description: dto.description,
      },
    });
  }

  findAll(): Promise<AllCode[]> {
    return this.prisma.allCode.findMany({
      orderBy: { type: 'asc' },
    });
  }

  findByType(type: string): Promise<AllCode[]> {
    return this.prisma.allCode.findMany({
      where: { type },
      orderBy: { keyMap: 'asc' },
    });
  }

  async findOne(id: number): Promise<AllCode> {
    const code = await this.prisma.allCode.findUnique({ where: { id } });

    if (!code) {
      throw new NotFoundException(`AllCode #${id} không tồn tại`);
    }

    return code;
  }

  async findByKeyMap(keyMap: string): Promise<AllCode> {
    const code = await this.prisma.allCode.findUnique({ where: { keyMap } });

    if (!code) {
      throw new NotFoundException(
        `AllCode với keyMap "${keyMap}" không tồn tại`,
      );
    }

    return code;
  }

  async update(id: number, dto: UpdateAllcodeDto): Promise<AllCode> {
    const code = await this.prisma.allCode.findUnique({ where: { id } });

    if (!code) {
      throw new NotFoundException(`AllCode #${id} không tồn tại`);
    }

    if (dto.keyMap && dto.keyMap !== code.keyMap) {
      const existing = await this.prisma.allCode.findUnique({
        where: { keyMap: dto.keyMap },
      });
      if (existing) {
        throw new ConflictException(`keyMap "${dto.keyMap}" đã tồn tại`);
      }
    }

    return this.prisma.allCode.update({
      where: { id },
      data: {
        ...(dto.keyMap != null && { keyMap: dto.keyMap }),
        ...(dto.type != null && { type: dto.type }),
        ...(dto.value != null && { value: dto.value }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });
  }

  async remove(id: number): Promise<void> {
    const code = await this.prisma.allCode.findUnique({ where: { id } });

    if (!code) {
      throw new NotFoundException(`AllCode #${id} không tồn tại`);
    }

    await this.prisma.allCode.delete({ where: { id } });
  }
}
