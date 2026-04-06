import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AllCodeLookupService } from '../common/services/allcode-lookup.service';

@Global() // Make the module available to all other modules
@Module({
  providers: [PrismaService, AllCodeLookupService],
  exports: [PrismaService, AllCodeLookupService],
})
export class PrismaModule {}
