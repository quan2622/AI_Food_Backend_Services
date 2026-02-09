import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('server-status')
  async getStatus(): Promise<{
    server: ReturnType<AppService['getServerStatus']>;
    database: Awaited<ReturnType<PrismaService['getConnectionStatus']>>;
  }> {
    const [server, database] = await Promise.all([
      Promise.resolve(this.appService.getServerStatus()),
      this.prisma.getConnectionStatus(),
    ]);
    return { server, database };
  }
}
