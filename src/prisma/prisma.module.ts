import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Make the module available to all other modules
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
