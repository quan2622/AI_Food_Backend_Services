import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';

async function checkUsers() {
  const app = await NestFactory.create(AppModule);
  const prisma = app.get(PrismaService);
  const users = await prisma.user.findMany({
    where: { email: { contains: 'recommender.test' } },
    select: { id: true, email: true },
    orderBy: { id: 'asc' },
    take: 20
  });
  console.log('--- TEST USERS SAMPLE ---');
  console.log(JSON.stringify(users, null, 2));
  await app.close();
}

checkUsers();
