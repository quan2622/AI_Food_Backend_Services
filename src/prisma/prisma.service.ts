import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const connectionString = process.env.DATABASE_URL ?? '';
    const adapter = new PrismaPg({ connectionString });
    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async enableShutdownHooks(): Promise<void> {
    await this.$disconnect();
  }

  async getConnectionStatus(): Promise<{
    connected: boolean;
    error?: string;
  }> {
    try {
      await this.$queryRaw`SELECT 1`;
      return { connected: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { connected: false, error: message };
    }
  }
}
